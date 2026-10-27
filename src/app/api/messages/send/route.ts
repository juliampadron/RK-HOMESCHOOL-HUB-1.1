import { NextResponse } from "next/server";

/**
 * Family messaging is intentionally not included in the invitation-only beta.
 *
 * The earlier route accepted caller-supplied user IDs while using the Supabase
 * service-role key, which could expose every family's messages. Keep this
 * surface disabled until messaging has a reviewed participant model, RLS
 * policies, moderation/retention rules, and end-to-end tests.
 */
const disabled = () =>
  NextResponse.json(
    { error: "Family messaging is not available during the private beta." },
    {
      status: 503,
      headers: {
        "Cache-Control": "private, no-store, max-age=0",
        "X-Content-Type-Options": "nosniff",
      },
    },
  );

export async function GET() {
  return disabled();
}

export async function POST() {
  return disabled();
}
