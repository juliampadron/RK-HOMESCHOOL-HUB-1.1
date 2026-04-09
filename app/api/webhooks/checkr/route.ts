import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseClient";

/**
 * Maps a Checkr report status to the instructor profile status used in this app.
 *
 * Checkr report statuses of interest:
 *   "clear"     → background check passed → approve the instructor
 *   "consider"  → adverse items found → hold for admin review
 *
 * All other statuses (e.g. "pending", "suspended") are left as-is so the
 * instructor remains in their current state until a decisive outcome arrives.
 */
function mapCheckrStatus(
  reportStatus: string
): "approved" | "pending_admin_review" | null {
  if (reportStatus === "clear") return "approved";
  if (reportStatus === "consider") return "pending_admin_review";
  return null;
}

/**
 * POST /api/webhooks/checkr
 *
 * Receives Checkr webhook events and keeps the `instructor_profiles` table in
 * sync.  We always return 200 OK so Checkr does not retry the delivery.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  let body: Record<string, unknown>;

  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    // Return 200 to prevent Checkr retries even for malformed payloads.
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 200 }
    );
  }

  const eventType = body?.type as string | undefined;

  // Only act on the report.completed event; acknowledge all others gracefully.
  if (eventType !== "report.completed") {
    return NextResponse.json(
      { received: true, processed: false },
      { status: 200 }
    );
  }

  const data = body?.data as Record<string, unknown> | undefined;
  const object = data?.object as Record<string, unknown> | undefined;
  const reportId = object?.id as string | undefined;
  const reportStatus = object?.status as string | undefined;
  const candidateId = object?.candidate_id as string | undefined;

  if (!reportId || !reportStatus || !candidateId) {
    return NextResponse.json(
      { error: "Missing required fields in webhook payload" },
      { status: 200 }
    );
  }

  const newStatus = mapCheckrStatus(reportStatus);

  if (!newStatus) {
    // Status is not one we act on; acknowledge receipt and move on.
    return NextResponse.json(
      { received: true, processed: false },
      { status: 200 }
    );
  }

  const { error, count } = await supabaseAdmin
    .from("instructor_profiles")
    .update({
      status: newStatus,
      checkr_report_id: reportId,
      background_check_updated_at: new Date().toISOString(),
    })
    .eq("checkr_candidate_id", candidateId)
    .select("id", { count: "exact", head: true });

  if (error) {
    console.error("Supabase update error:", error.message);
    // Return 200 to avoid Checkr retries; log internally for investigation.
    return NextResponse.json(
      { error: "Database update failed" },
      { status: 200 }
    );
  }

  if (count === 0) {
    console.warn(
      `Checkr webhook: no instructor found with candidate_id=${candidateId}. ` +
        "The profile may not have been created yet or the ID is mismatched."
    );
  }

  return NextResponse.json({ received: true, processed: true }, { status: 200 });
}
