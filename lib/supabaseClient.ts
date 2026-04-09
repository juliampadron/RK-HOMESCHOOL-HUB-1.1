import { createClient } from "@supabase/supabase-js";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing required environment variable: ${name}. ` +
        "Please add it to your .env.local file."
    );
  }
  return value;
}

const supabaseUrl = requireEnv("NEXT_PUBLIC_SUPABASE_URL");
const supabaseServiceRoleKey = requireEnv("SUPABASE_SERVICE_ROLE_KEY");
const supabaseAnonKey = requireEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");

/**
 * Admin client using the service role key.
 * Use ONLY on the server side (API routes, server components).
 * Never expose the service role key to the browser.
 */
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

/**
 * Public client using the anon key.
 * Safe to use in server components when Row-Level Security is configured.
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
