import { NextRequest, NextResponse } from "next/server";
import { generateQuarterlyReportPdf } from "@/lib/services/reportService";
import { privateJson, requireGuardianStudentAccess } from "@/lib/betaAuth";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const studentId = searchParams.get("student_id");
  const year = Number(searchParams.get("year"));
  const quarter = Number(searchParams.get("quarter"));
  const format = searchParams.get("format") ?? "json";

  if (!studentId || !Number.isInteger(year) || year < 2004 || year > 2100 ||
      !Number.isInteger(quarter) || quarter < 1 || quarter > 4 ||
      (format !== "json" && format !== "pdf")) {
    return privateJson({ error: "Invalid report request." }, 400);
  }

  // Authenticate first; never trust student_id from the query string by itself.
  const access = await requireGuardianStudentAccess(request, studentId);
  if ("response" in access) return access.response;
  const { admin } = access;

  const quarterStartMonth = (quarter - 1) * 3 + 1;
  const quarterEndMonth = quarterStartMonth + 2;
  const startDate = new Date(Date.UTC(year, quarterStartMonth - 1, 1)).toISOString().slice(0, 10);
  const endDate = new Date(Date.UTC(year, quarterEndMonth, 0)).toISOString().slice(0, 10);

  try {
    const [skillsResult, assessmentsResult, worksheetsResult] = await Promise.all([
      admin.from("student_skills").select("*").eq("student_id", studentId).order("subject"),
      admin.from("educator_assessments").select("*").eq("student_id", studentId)
        .gte("assessed_at", startDate).lte("assessed_at", endDate).order("assessed_at"),
      admin.from("worksheet_logs").select("*").eq("student_id", studentId)
        .gte("generated_at", startDate).lte("generated_at", endDate).order("generated_at"),
    ]);

    if (skillsResult.error || assessmentsResult.error || worksheetsResult.error) {
      throw new Error("Report source query failed");
    }

    const assessments = assessmentsResult.data ?? [];
    const worksheets = worksheetsResult.data ?? [];
    const report = {
      student_id: studentId,
      year,
      quarter,
      period: { start: startDate, end: endDate },
      skills: skillsResult.data ?? [],
      assessments,
      worksheets,
      summary: {
        total_skills_tracked: skillsResult.data?.length ?? 0,
        total_assessments: assessments.length,
        total_worksheets_completed: worksheets.filter(
          (worksheet) => worksheet.status === "completed" || worksheet.status === "reviewed",
        ).length,
        average_assessment_score: assessments.length
          ? Math.round(assessments.reduce((sum, assessment) => sum + (assessment.score_percentage ?? 0), 0) / assessments.length)
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
          "Content-Disposition": `attachment; filename="ihip-report-q${quarter}-${year}.pdf"`,
          "Cache-Control": "private, no-store, max-age=0",
          "X-Content-Type-Options": "nosniff",
        },
      });
    }
    return privateJson({ report });
  } catch {
    return privateJson({ error: "The report could not be generated." }, 503);
  }
}
