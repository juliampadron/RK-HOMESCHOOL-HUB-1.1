import { SupabaseClient } from "@supabase/supabase-js";

export interface IHIPReportParams {
  studentId: string;
  quarter: number;
  year: number;
}

export interface SubjectProgress {
  subject: string;
  grade_level: string;
  worksheets_completed: number;
  avg_score: number;
  avg_time_minutes: number;
}

export interface IHIPQuarterlyReport {
  studentId: string;
  quarter: number;
  year: number;
  periodStart: string;
  periodEnd: string;
  generatedAt: string;
  subjectProgress: SubjectProgress[];
  totalWorksheetsCompleted: number;
  overallAvgScore: number;
}

function getQuarterDateRange(quarter: number, year: number): { start: string; end: string } {
  const quarterMonths: Record<number, { startMonth: number; endMonth: number }> = {
    1: { startMonth: 1, endMonth: 3 },
    2: { startMonth: 4, endMonth: 6 },
    3: { startMonth: 7, endMonth: 9 },
    4: { startMonth: 10, endMonth: 12 },
  };

  const { startMonth, endMonth } = quarterMonths[quarter];
  const start = new Date(year, startMonth - 1, 1);
  const end = new Date(year, endMonth, 0);

  return {
    start: start.toISOString().split("T")[0],
    end: end.toISOString().split("T")[0],
  };
}

export async function generateIHIPQuarterlyReport(
  supabase: SupabaseClient,
  params: IHIPReportParams
): Promise<IHIPQuarterlyReport> {
  const { studentId, quarter, year } = params;
  const { start, end } = getQuarterDateRange(quarter, year);

  const { data, error } = await supabase
    .from("worksheet_logs")
    .select("subject, grade_level, score, time_spent_minutes")
    .eq("student_id", studentId)
    .eq("completed", true)
    .gte("completed_at", `${start}T00:00:00.000Z`)
    .lte("completed_at", `${end}T23:59:59.999Z`);

  if (error) {
    throw new Error(`Failed to fetch worksheet logs: ${error.message}`);
  }

  const logs = data ?? [];

  const subjectMap: Record<string, { subject: string; grade_level: string; scores: number[]; times: number[] }> = {};

  for (const log of logs) {
    const key = `${log.subject}::${log.grade_level}`;
    if (!subjectMap[key]) {
      subjectMap[key] = { subject: log.subject, grade_level: log.grade_level, scores: [], times: [] };
    }
    if (log.score != null) subjectMap[key].scores.push(log.score);
    if (log.time_spent_minutes != null) subjectMap[key].times.push(log.time_spent_minutes);
  }

  const subjectProgress: SubjectProgress[] = Object.values(subjectMap).map((entry) => ({
    subject: entry.subject,
    grade_level: entry.grade_level,
    worksheets_completed: entry.scores.length,
    avg_score:
      entry.scores.length > 0
        ? Math.round((entry.scores.reduce((a, b) => a + b, 0) / entry.scores.length) * 100) / 100
        : 0,
    avg_time_minutes:
      entry.times.length > 0
        ? Math.round(entry.times.reduce((a, b) => a + b, 0) / entry.times.length)
        : 0,
  }));

  const totalWorksheetsCompleted = logs.length;
  const allScores = logs.map((l) => l.score).filter((s) => s != null) as number[];
  const overallAvgScore =
    allScores.length > 0
      ? Math.round((allScores.reduce((a, b) => a + b, 0) / allScores.length) * 100) / 100
      : 0;

  return {
    studentId,
    quarter,
    year,
    periodStart: start,
    periodEnd: end,
    generatedAt: new Date().toISOString(),
    subjectProgress,
    totalWorksheetsCompleted,
    overallAvgScore,
  };
}
