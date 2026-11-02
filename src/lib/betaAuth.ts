import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

type BetaUser = { id: string; email: string };

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required server configuration: ${name}`);
  return value;
}

function allowedEmails(): Set<string> {
  return new Set(
    required("RK_BETA_ALLOWED_EMAILS")
      .split(",")
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean),
  );
}

export function betaAdmin(): SupabaseClient {
  return createClient(
    required("NEXT_PUBLIC_SUPABASE_URL"),
    required("SUPABASE_SERVICE_ROLE_KEY"),
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}

export function privateJson(body: Record<string, unknown>, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: {
      "Cache-Control": "private, no-store, max-age=0",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

/**
 * Verifies a real Supabase access token and applies the invitation-only
 * beta allow-list. Do not replace this with a caller-supplied user id.
 */
export async function requireBetaUser(request: NextRequest): Promise<
  { user: BetaUser } | { response: NextResponse }
> {
  if (process.env.RK_BETA_MODE !== "true") {
    return { response: privateJson({ error: "This endpoint is beta-only." }, 404) };
  }

  const header = request.headers.get("authorization");
  const token = header?.startsWith("Bearer ") ? header.slice(7).trim() : "";
  if (!token) return { response: privateJson({ error: "Sign-in required." }, 401) };

  try {
    const authClient = createClient(
      required("NEXT_PUBLIC_SUPABASE_URL"),
      required("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
      { auth: { persistSession: false, autoRefreshToken: false } },
    );
    const { data, error } = await authClient.auth.getUser(token);
    const email = data.user?.email?.trim().toLowerCase();
    if (error || !data.user || !email) {
      return { response: privateJson({ error: "Sign-in required." }, 401) };
    }
    if (!allowedEmails().has(email)) {
      return { response: privateJson({ error: "This account is not invited to the beta." }, 403) };
    }
    return { user: { id: data.user.id, email } };
  } catch {
    return { response: privateJson({ error: "Beta access is not configured." }, 503) };
  }
}

/**
 * Allows a signed-in invited guardian to access only their own linked student.
 * It relies on the audited student_guardians table from migration 006.
 */
export async function requireGuardianStudentAccess(
  request: NextRequest,
  studentId: string,
): Promise<{ admin: SupabaseClient; user: BetaUser } | { response: NextResponse }> {
  const beta = await requireBetaUser(request);
  if ("response" in beta) return beta;

  try {
    const admin = betaAdmin();
    const { data: self, error: selfError } = await admin
      .from("profiles")
      .select("id")
      .eq("id", studentId)
      .eq("user_id", beta.user.id)
      .maybeSingle();
    if (selfError) throw selfError;
    if (self) return { admin, user: beta.user };

    const { data: guardian, error: guardianError } = await admin
      .from("student_guardians")
      .select("student_id")
      .eq("student_id", studentId)
      .eq("guardian_user_id", beta.user.id)
      .maybeSingle();
    if (guardianError) throw guardianError;
    if (!guardian) return { response: privateJson({ error: "Not authorized for this student." }, 403) };

    return { admin, user: beta.user };
  } catch {
    // Keep database details out of responses.
    return { response: privateJson({ error: "Student access could not be verified." }, 503) };
  }
}
