import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { generateQuarterlyReportPdf } from "@/lib/services/reportService";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const studentId = searchParams.get("student_id");
  const year = searchParams.get("year");
  const quarter = searchParams.get("quarter");
  const format = searchParams.get("format") ?? "json";

  if (!studentId || !year || !quarter) {
    return NextResponse.json(
      { error: "student_id, year, and quarter are required" },
      { status: 400 }
    );
  }

  const quarterNumber = parseInt(quarter, 10);
  if (isNaN(quarterNumber) || quarterNumber < 1 || quarterNumber > 4) {
    return NextResponse.json(
      { error: "quarter must be a number between 1 and 4" },
      { status: 400 }
    );
  }

  const yearNumber = parseInt(year, 10);
  const quarterStartMonth = (quarterNumber - 1) * 3 + 1;
  const quarterEndMonth = quarterStartMonth + 2;
  const startDate = new Date(yearNumber, quarterStartMonth - 1, 1)
    .toISOString()
    .split("T")[0];
  const endDate = new Date(yearNumber, quarterEndMonth, 0)
    .toISOString()
    .split("T")[0];

  const [skillsResult, assessmentsResult, worksheetsResult] = await Promise.all(
    [
      supabase
        .from("student_skills")
        .select("*")
        .eq("student_id", studentId)
        .order("subject"),
      supabase
        .from("educator_assessments")
        .select("*")
        .eq("student_id", studentId)
        .gte("assessed_at", startDate)
        .lte("assessed_at", endDate)
        .order("assessed_at"),
      supabase
        .from("worksheet_logs")
        .select("*")
        .eq("student_id", studentId)
        .gte("generated_at", startDate)
        .lte("generated_at", endDate)
        .order("generated_at"),
    ]
  );

  if (skillsResult.error || assessmentsResult.error || worksheetsResult.error) {
    const err =
      skillsResult.error?.message ??
      assessmentsResult.error?.message ??
      worksheetsResult.error?.message;
    return NextResponse.json({ error: err }, { status: 500 });
  }

  const report = {
    student_id: studentId,
    year: yearNumber,
    quarter: quarterNumber,
    period: { start: startDate, end: endDate },
    skills: skillsResult.data,
    assessments: assessmentsResult.data,
    worksheets: worksheetsResult.data,
    summary: {
      total_skills_tracked: skillsResult.data?.length ?? 0,
      total_assessments: assessmentsResult.data?.length ?? 0,
      total_worksheets_completed:
        worksheetsResult.data?.filter(
          (w) => w.status === "completed" || w.status === "reviewed"
        ).length ?? 0,
      average_assessment_score:
        assessmentsResult.data && assessmentsResult.data.length > 0
          ? Math.round(
              assessmentsResult.data.reduce(
                (sum, a) => sum + (a.score_percentage ?? 0),
                0
              ) / assessmentsResult.data.length
            )
          : null,
    },
    ihip_compliant: true,
    generated_at: new Date().toISOString(),
  };

  if (format === "pdf") {
    const pdfBytes = await generateQuarterlyReportPdf(report);
    return new NextResponse(pdfBytes, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="ihip-report-q${quarter}-${year}-${studentId}.pdf"`,
      },
    });
  }

  return NextResponse.json({ report }, { status: 200 });
}
