import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const checkrApiKey = process.env.CHECKR_API_KEY!;
const checkrEnvironment = process.env.CHECKR_ENVIRONMENT || 'sandbox';

const CHECKR_API_URL = checkrEnvironment === 'production'
  ? 'https://api.checkr.com/v1'
  : 'https://api.checkr-staging.com/v1';

interface BackgroundCheckRequest {
  instructorId: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  email: string;
  phone: string;
  dob: string; // YYYY-MM-DD
  ssn: string; // Last 4 digits
  zipCode: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: BackgroundCheckRequest = await request.json();
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Validate instructor exists
    const { data: instructor, error: instructorError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', body.instructorId)
      .eq('role', 'instructor')
      .single();

    if (instructorError || !instructor) {
      return NextResponse.json(
        { error: 'Instructor not found' },
        { status: 404 }
      );
    }

    // Create Checkr candidate
    const candidateResponse = await fetch(`${CHECKR_API_URL}/candidates`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${Buffer.from(checkrApiKey + ':').toString('base64')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        first_name: body.firstName,
        middle_name: body.middleName || '',
        last_name: body.lastName,
        email: body.email,
        phone: body.phone,
        dob: body.dob,
        ssn: body.ssn,
        zipcode: body.zipCode,
        custom_id: body.instructorId,
      }),
    });

    if (!candidateResponse.ok) {
      const errorData = await candidateResponse.json();
      console.error('Checkr candidate creation error:', errorData);
      return NextResponse.json(
        { error: 'Failed to create Checkr candidate', details: errorData },
        { status: 500 }
      );
    }

    const candidateData = await candidateResponse.json();
    const candidateId = candidateData.id;

    // Create background check report
    const reportResponse = await fetch(`${CHECKR_API_URL}/reports`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${Buffer.from(checkrApiKey + ':').toString('base64')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        candidate_id: candidateId,
        package: 'standard_criminal', // Standard criminal background check
      }),
    });

    if (!reportResponse.ok) {
      const errorData = await reportResponse.json();
      console.error('Checkr report creation error:', errorData);
      return NextResponse.json(
        { error: 'Failed to create background check report', details: errorData },
        { status: 500 }
      );
    }

    const reportData = await reportResponse.json();

    // Store background check record in database
    const { data: bgCheck, error: bgCheckError } = await supabase
      .from('background_checks')
      .insert({
        profile_id: body.instructorId,
        checkr_candidate_id: candidateId,
        checkr_report_id: reportData.id,
        status: reportData.status,
        result: reportData.result,
        completed_at: reportData.completed_at,
        expires_at: reportData.completed_at
          ? new Date(new Date(reportData.completed_at).setFullYear(new Date(reportData.completed_at).getFullYear() + 2)).toISOString()
          : null,
        report_url: reportData.uri,
        metadata: {
          package: 'standard_criminal',
          turnaround_time: reportData.turnaround_time,
        },
      })
      .select()
      .single();

    if (bgCheckError) {
      console.error('Database error creating background check:', bgCheckError);
      return NextResponse.json(
        { error: 'Failed to store background check record' },
        { status: 500 }
      );
    }

    // Update instructor profile background check status
    await supabase
      .from('profiles')
      .update({
        background_check_status: 'pending',
        background_check_date: new Date().toISOString(),
      })
      .eq('id', body.instructorId);

    return NextResponse.json({
      success: true,
      backgroundCheckId: bgCheck.id,
      checkrReportId: reportData.id,
      status: reportData.status,
    });

  } catch (error) {
    console.error('Background check error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// Webhook handler for Checkr status updates
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify webhook signature (Checkr uses HMAC-SHA256)
    const signature = request.headers.get('x-checkr-signature');
    // TODO: Implement signature verification in production

    const event = body.type;
    const reportId = body.data?.object?.id;

    if (event === 'report.completed' || event === 'report.updated') {
      const report = body.data.object;

      // Update background check record
      const { data: bgCheck } = await supabase
        .from('background_checks')
        .select('*')
        .eq('checkr_report_id', reportId)
        .single();

      if (bgCheck) {
        await supabase
          .from('background_checks')
          .update({
            status: report.status,
            result: report.result,
            adjudication: report.adjudication,
            completed_at: report.completed_at,
            expires_at: report.completed_at
              ? new Date(new Date(report.completed_at).setFullYear(new Date(report.completed_at).getFullYear() + 2)).toISOString()
              : null,
            metadata: {
              ...bgCheck.metadata,
              turnaround_time: report.turnaround_time,
              package: report.package,
            },
          })
          .eq('id', bgCheck.id);

        // Update instructor profile based on result
        let profileStatus = 'pending';
        if (report.status === 'clear') {
          profileStatus = 'approved';
        } else if (report.status === 'consider' || report.status === 'suspended') {
          profileStatus = 'rejected';
        }

        await supabase
          .from('profiles')
          .update({
            background_check_status: profileStatus,
            background_check_expiry: report.completed_at
              ? new Date(new Date(report.completed_at).setFullYear(new Date(report.completed_at).getFullYear() + 2)).toISOString()
              : null,
          })
          .eq('id', bgCheck.profile_id);
      }
    }

    return NextResponse.json({ received: true });

  } catch (error) {
    console.error('Checkr webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}
