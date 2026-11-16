import { NextRequest, NextResponse } from "next/server";

const CHECKR_WEBHOOK_SECRET = process.env.CHECKR_WEBHOOK_SECRET;

type CheckrWebhookPayload = {
  id?: string;
  type?: string;
  data?: {
    object?: {
      id?: string;
      candidate_id?: string;
      status?: string;
      adjudication?: string;
      completed_at?: string;
    };
  };
};

function verifySignature(request: NextRequest): boolean {
  if (!CHECKR_WEBHOOK_SECRET) {
    console.warn("[checkr-webhook] CHECKR_WEBHOOK_SECRET is not configured");
    return true;
  }

  const incoming = request.headers.get("checkr-signature");
  return incoming === CHECKR_WEBHOOK_SECRET;
}

export async function POST(request: NextRequest) {
  try {
    if (!verifySignature(request)) {
      return NextResponse.json({ ok: false, error: "Invalid signature" }, { status: 401 });
    }

    const payload = (await request.json()) as CheckrWebhookPayload;
    const eventType = payload.type ?? "unknown";

    if (!payload.data?.object?.id) {
      return NextResponse.json({ ok: false, error: "Malformed payload" }, { status: 422 });
    }

    console.info("[checkr-webhook] event received", {
      eventId: payload.id,
      eventType,
      reportId: payload.data.object.id,
      candidateId: payload.data.object.candidate_id,
      status: payload.data.object.status,
      adjudication: payload.data.object.adjudication,
      completedAt: payload.data.object.completed_at,
    });

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error) {
    console.error("[checkr-webhook] unhandled error", {
      error: error instanceof Error ? error.message : String(error),
    });

    return NextResponse.json({ ok: false, error: "Webhook handling failed" }, { status: 500 });
  }
}
