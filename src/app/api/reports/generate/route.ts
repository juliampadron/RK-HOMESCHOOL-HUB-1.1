import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { generateQuarterlyReportPdf } from "@/lib/services/reportService";
import { buildQuarterlyProgressReport } from "@/lib/services/quarterlyReportBuilder";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  const body = await request.json();
  const studentId = body.student_id as string | undefined;
  const year = Number(body.year);
  const quarter = Number(body.quarter);

  if (!studentId || Number.isNaN(year) || Number.isNaN(quarter) || quarter < 1 || quarter > 4) {
    return NextResponse.json(
      { error: "student_id, year, and quarter are required (quarter: 1-4)" },
      { status: 400 }
    );
  }

  const payload = await buildQuarterlyProgressReport({
    supabase,
    studentId,
    year,
    quarter,
  });

  if ("error" in payload) {
    return NextResponse.json({ error: payload.error }, { status: payload.status ?? 500 });
  }

  const pdfBytes = await generateQuarterlyReportPdf(payload.report);
  const reportPath = `quarterly/${studentId}/${year}/Q${quarter}.pdf`;

  const uploadResult = await supabase.storage
    .from("reports")
    .upload(reportPath, pdfBytes, { contentType: "application/pdf", upsert: true });

  if (uploadResult.error) {
    return NextResponse.json({ error: uploadResult.error.message }, { status: 500 });
  }

  const publicUrlResult = supabase.storage.from("reports").getPublicUrl(reportPath);

  const upsertResult = await supabase.from("reports").upsert(
    {
      student_id: studentId,
      year,
      quarter,
      storage_path: reportPath,
      public_url: publicUrlResult.data.publicUrl,
      generated_at: new Date().toISOString(),
    },
    {
      onConflict: "student_id,year,quarter",
    }
  );

  if (upsertResult.error) {
    return NextResponse.json({ error: upsertResult.error.message }, { status: 500 });
  }

  return NextResponse.json(
    {
      success: true,
      report_url: publicUrlResult.data.publicUrl,
      storage_path: reportPath,
      report: payload.report,
    },
    { status: 200 }
  );
}
