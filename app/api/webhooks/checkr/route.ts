import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/app/lib/supabase';
import crypto from 'crypto';

const CHECKR_WEBHOOK_SECRET = process.env.CHECKR_WEBHOOK_SECRET!;

// Verify Checkr webhook signature
function verifyCheckrSignature(payload: string, signature: string): boolean {
  if (!CHECKR_WEBHOOK_SECRET) {
    console.warn('CHECKR_WEBHOOK_SECRET not configured');
    return false;
  }

  const expectedSignature = crypto
    .createHmac('sha256', CHECKR_WEBHOOK_SECRET)
    .update(payload)
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('checkr-signature');

    if (!signature) {
      return NextResponse.json(
        { error: 'Missing checkr-signature header' },
        { status: 400 }
      );
    }

    // Verify webhook signature
    if (!verifyCheckrSignature(body, signature)) {
      console.error('Checkr webhook signature verification failed');
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      );
    }

    const event = JSON.parse(body);

    // Handle report.completed event
    if (event.type === 'report.completed') {
      const reportData = event.data?.object;

      if (!reportData) {
        return NextResponse.json(
          { error: 'Missing report data' },
          { status: 400 }
        );
      }

      const candidateId = reportData.candidate_id;
      const reportStatus = reportData.status; // 'clear' or 'consider'

      if (!candidateId) {
        return NextResponse.json(
          { error: 'Missing candidate_id' },
          { status: 400 }
        );
      }

      // Find instructor profile by Checkr candidate ID
      const { data: profile, error: findError } = await supabaseAdmin
        .from('instructor_profiles')
        .select('*')
        .eq('checkr_candidate_id', candidateId)
        .single();

      if (findError || !profile) {
        console.error('Instructor profile not found for candidate:', candidateId);
        return NextResponse.json(
          { error: 'Instructor profile not found' },
          { status: 404 }
        );
      }

      // Map Checkr status to our background_check_status
      let backgroundCheckStatus: string;
      if (reportStatus === 'clear') {
        backgroundCheckStatus = 'clear';
      } else if (reportStatus === 'consider') {
        backgroundCheckStatus = 'consider';
      } else {
        backgroundCheckStatus = 'failed';
      }

      // Update instructor profile
      const { error: updateError } = await supabaseAdmin
        .from('instructor_profiles')
        .update({
          background_check_status: backgroundCheckStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', profile.id);

      if (updateError) {
        console.error('Failed to update instructor profile:', updateError);
        return NextResponse.json(
          { error: 'Failed to update instructor profile' },
          { status: 500 }
        );
      }

      // Log audit trail
      await supabaseAdmin
        .from('audit_trail')
        .insert({
          event_type: 'background_check_completed',
          entity_type: 'instructor_profile',
          entity_id: profile.id,
          metadata: {
            checkr_candidate_id: candidateId,
            checkr_report_id: reportData.id,
            status: reportStatus,
            background_check_status: backgroundCheckStatus
          }
        });

      // If status is 'consider' or 'failed', trigger admin notification
      // (This would integrate with your notification system)
      if (backgroundCheckStatus === 'consider' || backgroundCheckStatus === 'failed') {
        // TODO: Trigger admin notification
        console.log('Admin notification needed for instructor:', profile.id, 'Status:', backgroundCheckStatus);

        // Log notification event
        await supabaseAdmin
          .from('audit_trail')
          .insert({
            event_type: 'admin_notification_required',
            entity_type: 'instructor_profile',
            entity_id: profile.id,
            metadata: {
              reason: 'background_check_review_needed',
              background_check_status: backgroundCheckStatus
            }
          });
      }

      return NextResponse.json({ received: true }, { status: 200 });
    }

    // Handle other Checkr events
    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    console.error('Checkr webhook error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
