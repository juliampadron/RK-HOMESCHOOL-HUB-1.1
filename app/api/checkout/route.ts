import { NextRequest, NextResponse } from "next/server";

type CheckoutRequest = {
  studentId: string;
  classId: string;
  amountCents: number;
  currency?: string;
};

const jsonError = (message: string, status = 400) =>
  NextResponse.json({ ok: false, error: message }, { status });

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as Partial<CheckoutRequest>;

    if (!body.studentId || !body.classId) {
      return jsonError("studentId and classId are required", 422);
    }

    if (typeof body.amountCents !== "number" || body.amountCents <= 0) {
      return jsonError("amountCents must be a positive integer", 422);
    }

    const checkoutId = crypto.randomUUID();

    console.info("[checkout] created", {
      checkoutId,
      studentId: body.studentId,
      classId: body.classId,
      amountCents: body.amountCents,
      currency: body.currency ?? "usd",
    });

    return NextResponse.json(
      {
        ok: true,
        checkoutId,
        status: "pending_payment",
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("[checkout] unhandled error", {
      error: error instanceof Error ? error.message : String(error),
    });

    return jsonError("Unable to create checkout session", 500);
  }
}
