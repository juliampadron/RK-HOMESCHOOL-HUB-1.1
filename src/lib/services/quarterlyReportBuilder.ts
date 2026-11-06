import { SupabaseClient } from "@supabase/supabase-js";
import { QuarterlyProgressReport, SubjectBreakdown } from "@/lib/services/reportService";

type ProfileRow = { username?: string | null };

type SkillRow = {
  subject: string | null;
  grade_level: string | null;
  skill_name: string;
  standard_code: string;
};

type AssessmentRow = {
  subject: string | null;
  title: string;
  assessed_at: string;
  assessment_type: string | null;
  standards_addressed?: string[] | null;
  educator_id?: string | null;
  notes?: string | null;
};

type WorksheetRow = {
  subject: string | null;
  template_id?: string | null;
  time_spent_minutes?: number | null;
  educator_id?: string | null;
  generated_at?: string;
  completed_at?: string | null;
};

export function quarterDateRange(year: number, quarter: number) {
  const quarterStartMonth = (quarter - 1) * 3 + 1;
  const quarterEndMonth = quarterStartMonth + 2;

  return {
    startDate: new Date(year, quarterStartMonth - 1, 1).toISOString().split("T")[0],
    endDate: new Date(year, quarterEndMonth, 0).toISOString().split("T")[0],
  };
}

export async function buildQuarterlyProgressReport(params: {
  supabase: SupabaseClient;
  studentId: string;
  year: number;
  quarter: number;
}): Promise<{ report: QuarterlyProgressReport } | { error: string; status?: number }> {
  const { supabase, studentId, year, quarter } = params;
  const { startDate, endDate } = quarterDateRange(year, quarter);

  const [profileResult, skillsResult, assessmentsResult, worksheetsResult] = await Promise.all([
    supabase.from("profiles").select("username").eq("id", studentId).maybeSingle(),
    supabase
      .from("student_skills")
      .select("subject, grade_level, skill_name, standard_code")
      .eq("student_id", studentId)
      .order("subject"),
    supabase
      .from("educator_assessments")
      .select("subject, title, assessed_at, assessment_type, standards_addressed, educator_id, notes")
      .eq("student_id", studentId)
      .gte("assessed_at", startDate)
      .lte("assessed_at", endDate)
      .order("assessed_at"),
    supabase
      .from("worksheet_logs")
      .select("subject, template_id, time_spent_minutes, educator_id, generated_at, completed_at")
      .eq("student_id", studentId)
      .gte("generated_at", startDate)
      .lte("generated_at", endDate)
      .order("generated_at"),
  ]);

  if (skillsResult.error || assessmentsResult.error || worksheetsResult.error) {
    return {
      error:
        skillsResult.error?.message ??
        assessmentsResult.error?.message ??
        worksheetsResult.error?.message ??
        "Unable to gather report data",
      status: 500,
    };
  }

  const profile = (profileResult.data as ProfileRow | null) ?? null;
  const skills = (skillsResult.data as SkillRow[] | null) ?? [];
  const assessments = (assessmentsResult.data as AssessmentRow[] | null) ?? [];
  const worksheets = (worksheetsResult.data as WorksheetRow[] | null) ?? [];

  const subjectHours = new Map<string, number>();
  worksheets.forEach((worksheet) => {
    const subject = worksheet.subject ?? "General Studies";
    const hours = (worksheet.time_spent_minutes ?? 0) / 60;
    subjectHours.set(subject, (subjectHours.get(subject) ?? 0) + hours);
  });

  assessments.forEach((assessment) => {
    const subject = assessment.subject ?? "General Studies";
    subjectHours.set(subject, (subjectHours.get(subject) ?? 0) + 1);
  });

  const subjects: SubjectBreakdown[] = Array.from(subjectHours.entries()).map(([subject, hours]) => {
    const assessmentTitles = assessments
      .filter((assessment) => (assessment.subject ?? "General Studies") === subject)
      .slice(0, 1)
      .map((assessment) => assessment.title);

    const worksheetTemplates = worksheets
      .filter((worksheet) => (worksheet.subject ?? "General Studies") === subject)
      .slice(0, 1)
      .map((worksheet) => worksheet.template_id)
      .filter((value): value is string => Boolean(value));

    const classHighlights = [...assessmentTitles, ...worksheetTemplates.map((id) => `Worksheet: ${id}`)];

    if (classHighlights.length === 0) {
      classHighlights.push("Instruction and portfolio evidence logged");
    }

    return {
      subject,
      hours: Number(hours.toFixed(1)),
      classHighlights: classHighlights.slice(0, 2),
    };
  });

  const standardsBySubject = Array.from(
    skills.reduce((acc, skill) => {
      const subject = skill.subject ?? "General Studies";
      const standards = acc.get(subject) ?? [];
      standards.push({ code: skill.standard_code, description: skill.skill_name });
      acc.set(subject, standards);
      return acc;
    }, new Map<string, Array<{ code: string; description: string }>>())
  ).map(([subject, standards]) => ({
    subject,
    standards: standards.slice(0, 4),
  }));

  const portfolioItems = assessments
    .filter((assessment) => assessment.assessment_type === "portfolio")
    .map((assessment) => ({
      title: assessment.title,
      submittedAt: assessment.assessed_at,
      standard: assessment.standards_addressed?.[0] ?? "N/A",
    }))
    .slice(0, 6);

  const instructorFeedback = Array.from(
    assessments.reduce((acc, assessment) => {
      if (!assessment.notes) {
        return acc;
      }

      const key = assessment.educator_id ?? "instructor";
      if (!acc.has(key)) {
        acc.set(key, {
          instructor: assessment.educator_id ? `Instructor ${assessment.educator_id.slice(0, 6)}` : "Instructor",
          subject: assessment.subject ?? "General Studies",
          note: assessment.notes,
        });
      }

      return acc;
    }, new Map<string, { instructor: string; subject: string; note: string }>())
  )
    .map(([, value]) => value)
    .slice(0, 3);

  const totalHours = Number(subjects.reduce((sum, subject) => sum + subject.hours, 0).toFixed(1));

  const report: QuarterlyProgressReport = {
    student: {
      id: studentId,
      displayName: profile?.username ?? `Student ${studentId.slice(0, 6)}`,
      gradeBand: skills[0]?.grade_level ?? "Middle School",
      parentGuardian: "On File",
      district: "Pleasant Valley UFSD",
    },
    report: {
      year,
      quarter,
      periodStart: startDate,
      periodEnd: endDate,
      generatedAt: new Date().toISOString(),
    },
    summary: {
      totalHours,
      classesEnrolled: subjects.length,
      instructors: new Set(
        [...assessments.map((assessment) => assessment.educator_id), ...worksheets.map((worksheet) => worksheet.educator_id)].filter(
          (value): value is string => Boolean(value)
        )
      ).size,
    },
    subjects,
    standardsBySubject,
    portfolioItems,
    instructorFeedback,
    portfolioUrl: `renkids.org/portfolio/${studentId}`,
  };

  return { report };
}
