import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, canAccessStudent } from '@/lib/auth/helpers';
import { createAdminClient } from '@/lib/supabase/server';
import {
  buildQuarterlyReportJson,
  buildQuarterlyReportPdf,
  type QuarterlyReportData,
} from '@/lib/services/reportService';
import { quarterlyReportQuerySchema } from '@/lib/validations/schemas';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  // Require authentication
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) return authResult;

  // Validate query parameters
  const { searchParams } = new URL(request.url);
  const parsed = quarterlyReportQuerySchema.safeParse({
    student_id: searchParams.get('student_id'),
    year: searchParams.get('year'),
    quarter: searchParams.get('quarter'),
    format: searchParams.get('format') ?? 'json',
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid query parameters', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { student_id, year, quarter, format } = parsed.data;

  // Authorisation: caller must be a guardian, active teacher, or admin
  const allowed = await canAccessStudent(student_id);
  if (!allowed) {
    return NextResponse.json(
      { error: 'Forbidden: you do not have access to this student record' },
      { status: 403 }
    );
  }

  const supabase = createAdminClient();

  // Derive date range for the quarter
  const quarterStartMonth = (quarter - 1) * 3 + 1;
  const quarterEndMonth = quarterStartMonth + 2;
  const startDate = new Date(year, quarterStartMonth - 1, 1)
    .toISOString()
    .split('T')[0];
  const endDate = new Date(year, quarterEndMonth, 0)
    .toISOString()
    .split('T')[0];

  const quarterLabel = `Q${quarter}` as 'Q1' | 'Q2' | 'Q3' | 'Q4';

  // Fetch student profile
  const { data: student, error: studentError } = await supabase
    .from('students')
    .select('id, display_name, grade_level')
    .eq('id', student_id)
    .single();

  if (studentError || !student) {
    return NextResponse.json({ error: 'Student not found' }, { status: 404 });
  }

  // Fetch skills, assessments, and worksheet logs in parallel
  const [skillsResult, assessmentsResult, worksheetsResult] = await Promise.all([
    supabase
      .from('student_skills')
      .select('subject_area, skill_code, skill_name, proficiency_level, evidence_notes, assessed_at')
      .eq('student_id', student_id)
      .order('subject_area'),
    supabase
      .from('educator_assessments')
      .select('subject_area, assessment_period, narrative, standards, created_at')
      .eq('student_id', student_id)
      .gte('created_at', startDate)
      .lte('created_at', endDate)
      .order('created_at'),
    supabase
      .from('worksheet_logs')
      .select('subject_area, standards, score, completed_at')
      .eq('student_id', student_id)
      .gte('completed_at', startDate)
      .lte('completed_at', endDate)
      .order('completed_at'),
  ]);

  if (skillsResult.error || assessmentsResult.error || worksheetsResult.error) {
    const msg =
      skillsResult.error?.message ??
      assessmentsResult.error?.message ??
      worksheetsResult.error?.message ??
      'Database error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }

  const reportData: QuarterlyReportData = {
    student: {
      id: student.id,
      display_name: student.display_name,
      grade_level: student.grade_level ?? null,
    },
    year,
    quarter: quarterLabel,
    skills: skillsResult.data ?? [],
    worksheetLogs: worksheetsResult.data ?? [],
    assessments: assessmentsResult.data ?? [],
  };

  if (format === 'pdf') {
    const pdfBytes = buildQuarterlyReportPdf(reportData);
    return new NextResponse(pdfBytes, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="rk-progress-report-${quarterLabel}-${year}-${student_id}.pdf"`,
      },
    });
  }

  return NextResponse.json(
    { report: buildQuarterlyReportJson(reportData) },
    { status: 200 }
  );
}
