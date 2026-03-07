import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

// Status mapping: Checkr report status → instructor_profiles approval_status
const CHECKR_STATUS_MAP: Record<string, string> = {
  clear: "approved",
  consider: "pending_admin_review",
};

export async function POST(request: NextRequest): Promise<NextResponse> {
  let body: Record<string, unknown>;

  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    // Malformed JSON – still return 200 so Checkr does not retry
    return NextResponse.json({ received: true }, { status: 200 });
  }

  // Only handle report.completed events
  const eventType = body?.type as string | undefined;
  if (eventType !== "report.completed") {
    return NextResponse.json({ received: true }, { status: 200 });
  }

  const data = body?.data as Record<string, unknown> | undefined;
  const report = data?.object as Record<string, unknown> | undefined;

  if (!report) {
    return NextResponse.json({ received: true }, { status: 200 });
  }

  const reportId = report?.id as string | undefined;
  const candidateId = report?.candidate_id as string | undefined;
  const reportStatus = report?.status as string | undefined;

  if (!reportId || !candidateId || !reportStatus) {
    return NextResponse.json({ received: true }, { status: 200 });
  }

  const approvalStatus = CHECKR_STATUS_MAP[reportStatus];
  if (!approvalStatus) {
    // Unknown status – acknowledge without updating
    return NextResponse.json({ received: true }, { status: 200 });
  }

  // Initialize Supabase admin client using service role key (server-side only)
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error("Supabase environment variables are not configured.");
    // Return 200 to prevent Checkr from retrying; log the issue for ops
    return NextResponse.json({ received: true }, { status: 200 });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const { error } = await supabase
    .from("instructor_profiles")
    .update({
      approval_status: approvalStatus,
      checkr_report_id: reportId,
      background_check_updated_at: new Date().toISOString(),
    })
    .eq("checkr_candidate_id", candidateId);

  if (error) {
    console.error("Failed to update instructor profile:", error.message);
  }

  // Always return 200 to acknowledge receipt and prevent Checkr retries
  return NextResponse.json({ received: true }, { status: 200 });
}
