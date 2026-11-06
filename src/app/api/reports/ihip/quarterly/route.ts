import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { generateQuarterlyReportPdf } from "@/lib/services/reportService";
import { buildQuarterlyProgressReport } from "@/lib/services/quarterlyReportBuilder";

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

  const yearNumber = parseInt(year, 10);
  const quarterNumber = parseInt(quarter, 10);

  if (
    Number.isNaN(yearNumber) ||
    Number.isNaN(quarterNumber) ||
    quarterNumber < 1 ||
    quarterNumber > 4
  ) {
    return NextResponse.json(
      { error: "year and quarter are required, and quarter must be 1-4" },
      { status: 400 }
    );
  }

  const payload = await buildQuarterlyProgressReport({
    supabase,
    studentId,
    year: yearNumber,
    quarter: quarterNumber,
  });

  if ("error" in payload) {
    return NextResponse.json({ error: payload.error }, { status: payload.status ?? 500 });
  }

  if (format === "pdf") {
    const pdfBytes = await generateQuarterlyReportPdf(payload.report);
    return new NextResponse(pdfBytes, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="quarterly-progress-q${quarter}-${year}-${studentId}.pdf"`,
      },
    });
  }

  return NextResponse.json({ report: payload.report }, { status: 200 });
}
