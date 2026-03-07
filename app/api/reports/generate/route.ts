import { NextRequest, NextResponse } from 'next/server';
import { renderToStream } from '@react-pdf/renderer';
import { createClient } from '@supabase/supabase-js';
import { QuarterlyReportPDF } from '../../components/QuarterlyReportPDF';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface RequestBody {
  studentId: string;
  quarter: string; // e.g., 'Q2'
  year: number; // e.g., 2026
}

export async function POST(request: NextRequest) {
  try {
    const body: RequestBody = await request.json();
    const { studentId, quarter, year } = body;

    // Validate input
    if (!studentId || !quarter || !year) {
      return NextResponse.json(
        { error: 'Missing required fields: studentId, quarter, year' },
        { status: 400 }
      );
    }

    // Get authenticated user
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Missing authorization header' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Fetch student data
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('*')
      .eq('id', studentId)
      .eq('user_id', user.id)
      .single();

    if (studentError || !student) {
      return NextResponse.json(
        { error: 'Student not found or access denied' },
        { status: 404 }
      );
    }

    // Calculate quarter date range
    const quarterStartMonth = (parseInt(quarter.replace('Q', '')) - 1) * 3;
    const startDate = new Date(year, quarterStartMonth, 1);
    const endDate = new Date(year, quarterStartMonth + 3, 0);

    // Fetch enrollments for the quarter
    const { data: enrollments, error: enrollmentsError } = await supabase
      .from('enrollments')
      .select(`
        *,
        class:classes (
          *,
          instructor:instructors (*)
        )
      `)
      .eq('student_id', studentId)
      .eq('status', 'active');

    if (enrollmentsError) {
      console.error('Error fetching enrollments:', enrollmentsError);
      return NextResponse.json(
        { error: 'Failed to fetch enrollments' },
        { status: 500 }
      );
    }

    // Fetch hours for each enrollment
    const hoursPromises = enrollments.map((enrollment) =>
      supabase
        .from('hours_log')
        .select('hours')
        .eq('enrollment_id', enrollment.id)
        .gte('date', startDate.toISOString())
        .lte('date', endDate.toISOString())
    );

    const hoursResults = await Promise.all(hoursPromises);
    const totalHours = hoursResults.reduce((acc, result) => {
      if (result.data) {
        return acc + result.data.reduce((sum, log) => sum + parseFloat(log.hours), 0);
      }
      return acc;
    }, 0);

    // Fetch portfolio items
    const { data: portfolioItems, error: portfolioError } = await supabase
      .from('portfolio_items')
      .select('*')
      .eq('student_id', studentId)
      .gte('submitted_date', startDate.toISOString())
      .lte('submitted_date', endDate.toISOString())
      .order('submitted_date', { ascending: false });

    if (portfolioError) {
      console.error('Error fetching portfolio:', portfolioError);
    }

    // Fetch NYS standards met
    const { data: standards, error: standardsError } = await supabase
      .from('nys_standards_met')
      .select('*')
      .eq('student_id', studentId)
      .eq('quarter', quarter)
      .eq('year', year);

    if (standardsError) {
      console.error('Error fetching standards:', standardsError);
    }

    // Fetch instructor feedback
    const { data: feedback, error: feedbackError } = await supabase
      .from('instructor_feedback')
      .select(`
        *,
        instructor:instructors (*),
        enrollment:enrollments!inner (
          class:classes (*)
        )
      `)
      .eq('quarter', quarter)
      .eq('year', year);

    if (feedbackError) {
      console.error('Error fetching feedback:', feedbackError);
    }

    // Fetch game activity
    const { data: gameActivity, error: gameError } = await supabase
      .from('game_activity')
      .select('*')
      .eq('student_id', studentId)
      .gte('date_played', startDate.toISOString())
      .lte('date_played', endDate.toISOString());

    if (gameError) {
      console.error('Error fetching game activity:', gameError);
    }

    // Group data by subject
    const subjectMap = new Map();
    enrollments.forEach((enrollment, index) => {
      const subject = enrollment.class.subject_area;
      if (!subjectMap.has(subject)) {
        subjectMap.set(subject, {
          name: subject,
          hours: 0,
          classes: [],
          games: [],
          portfolioCount: 0,
        });
      }
      const subjectData = subjectMap.get(subject);
      subjectData.classes.push({
        title: enrollment.class.title,
        instructor: enrollment.class.instructor?.name || 'Unknown',
      });

      // Add hours
      const hoursData = hoursResults[index].data || [];
      subjectData.hours += hoursData.reduce((sum, log) => sum + parseFloat(log.hours), 0);
    });

    // Add game activity to subjects
    if (gameActivity) {
      gameActivity.forEach((game) => {
        if (subjectMap.has(game.subject_area)) {
          const subjectData = subjectMap.get(game.subject_area);
          if (!subjectData.games.includes(game.game_name)) {
            subjectData.games.push(game.game_name);
          }
        }
      });
    }

    // Add portfolio counts to subjects
    if (portfolioItems) {
      portfolioItems.forEach((item) => {
        const classData = enrollments.find((e) => e.class_id === item.class_id);
        if (classData && subjectMap.has(classData.class.subject_area)) {
          const subjectData = subjectMap.get(classData.class.subject_area);
          subjectData.portfolioCount += 1;
        }
      });
    }

    // Group standards by subject
    const standardsMap = new Map();
    if (standards) {
      standards.forEach((standard) => {
        if (!standardsMap.has(standard.subject_area)) {
          standardsMap.set(standard.subject_area, []);
        }
        standardsMap.get(standard.subject_area).push({
          code: standard.standard_code,
          description: standard.standard_description,
        });
      });
    }

    // Get unique instructors
    const uniqueInstructors = new Set();
    enrollments.forEach((enrollment) => {
      if (enrollment.class.instructor) {
        uniqueInstructors.add(enrollment.class.instructor.id);
      }
    });

    // Format data for PDF
    const reportData = {
      student: {
        firstName: student.first_name,
        lastInitial: student.last_initial,
        grade: student.grade_band,
        parentGuardian: student.parent_guardian_name,
        district: student.district,
      },
      reportPeriod: {
        quarter,
        year,
        startDate: startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        endDate: endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        generatedDate: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
      },
      summary: {
        totalHours: parseFloat(totalHours.toFixed(1)),
        classesEnrolled: enrollments.length,
        instructorsCount: uniqueInstructors.size,
      },
      subjects: Array.from(subjectMap.values()),
      standards: Array.from(standardsMap.entries()).map(([subject, items]) => ({
        subject,
        items,
      })),
      portfolio: (portfolioItems || []).map((item) => ({
        title: item.title,
        submittedDate: new Date(item.submitted_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        standard: item.nys_standard || 'N/A',
        type: item.type.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
      })),
      instructorFeedback: (feedback || []).map((fb) => ({
        instructor: fb.instructor?.name || 'Unknown',
        subject: fb.enrollment?.class?.subject_area || 'General',
        feedback: fb.feedback_text,
      })),
    };

    // Generate PDF
    const pdfDoc = QuarterlyReportPDF({ data: reportData });
    const stream = await renderToStream(pdfDoc);

    // Convert stream to buffer
    const chunks: Uint8Array[] = [];
    for await (const chunk of stream) {
      chunks.push(chunk);
    }
    const pdfBuffer = Buffer.concat(chunks);

    // Upload to Supabase Storage
    const fileName = `quarterly-reports/${studentId}/${quarter}-${year}.pdf`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('reports')
      .upload(fileName, pdfBuffer, {
        contentType: 'application/pdf',
        upsert: true,
      });

    if (uploadError) {
      console.error('Error uploading PDF:', uploadError);
      return NextResponse.json(
        { error: 'Failed to upload PDF' },
        { status: 500 }
      );
    }

    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from('reports')
      .getPublicUrl(fileName);

    // Save report record
    const { data: reportRecord, error: reportError } = await supabase
      .from('quarterly_reports')
      .insert({
        student_id: studentId,
        quarter,
        year,
        report_period_start: startDate.toISOString(),
        report_period_end: endDate.toISOString(),
        generated_by: user.id,
        file_url: publicUrlData.publicUrl,
        total_hours: totalHours,
        classes_enrolled: enrollments.length,
        instructors_count: uniqueInstructors.size,
      })
      .select()
      .single();

    if (reportError) {
      console.error('Error saving report record:', reportError);
    }

    return NextResponse.json({
      success: true,
      reportUrl: publicUrlData.publicUrl,
      reportId: reportRecord?.id,
      data: reportData,
    });
  } catch (error) {
    console.error('Error generating report:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');

    // Get authenticated user
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Missing authorization header' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Build query
    let query = supabase
      .from('quarterly_reports')
      .select('*')
      .order('created_at', { ascending: false });

    if (studentId) {
      // Verify student belongs to user
      const { data: student } = await supabase
        .from('students')
        .select('id')
        .eq('id', studentId)
        .eq('user_id', user.id)
        .single();

      if (!student) {
        return NextResponse.json(
          { error: 'Student not found or access denied' },
          { status: 404 }
        );
      }

      query = query.eq('student_id', studentId);
    } else {
      // Get all reports for user's students
      const { data: students } = await supabase
        .from('students')
        .select('id')
        .eq('user_id', user.id);

      if (students && students.length > 0) {
        const studentIds = students.map((s) => s.id);
        query = query.in('student_id', studentIds);
      }
    }

    const { data: reports, error } = await query;

    if (error) {
      console.error('Error fetching reports:', error);
      return NextResponse.json(
        { error: 'Failed to fetch reports' },
        { status: 500 }
      );
    }

    return NextResponse.json({ reports });
  } catch (error) {
    console.error('Error fetching reports:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
