import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { generateIHIPQuarterlyReport } from "@/lib/services/reportService";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET(req: NextRequest) {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const authHeader = req.headers.get("authorization");
  if (!authHeader) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const token = authHeader.replace("Bearer ", "");
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser(token);

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const studentId = searchParams.get("studentId");
  const quarter = searchParams.get("quarter");
  const year = searchParams.get("year");

  if (!studentId || !quarter || !year) {
    return NextResponse.json(
      { error: "studentId, quarter, and year are required query parameters" },
      { status: 400 }
    );
  }

  const quarterNum = parseInt(quarter, 10);
  const yearNum = parseInt(year, 10);

  if (isNaN(quarterNum) || quarterNum < 1 || quarterNum > 4) {
    return NextResponse.json({ error: "quarter must be a number between 1 and 4" }, { status: 400 });
  }

  if (isNaN(yearNum) || yearNum < 2000 || yearNum > 2100) {
    return NextResponse.json({ error: "year must be a valid 4-digit year" }, { status: 400 });
  }

  try {
    const report = await generateIHIPQuarterlyReport(supabase, {
      studentId,
      quarter: quarterNum,
      year: yearNum,
    });

    return NextResponse.json(report, { status: 200 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to generate report";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
