import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export type AppRole = 'parent' | 'teacher' | 'admin' | 'district_viewer';

/**
 * Returns the authenticated user, or null if not authenticated.
 * Use in API routes and Server Components.
 */
export async function getAuthenticatedUser() {
  const supabase = createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) return null;
  return user;
}

/**
 * Returns a 401 JSON response if the request is not authenticated.
 * Use at the top of protected API routes.
 */
export async function requireAuth(): Promise<
  { user: NonNullable<Awaited<ReturnType<typeof getAuthenticatedUser>>> } | NextResponse
> {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return { user };
}

/**
 * Checks whether the current user has the given role in any organization.
 * Relies on the has_role() Postgres function defined in the identity migration.
 */
export async function hasRole(role: AppRole): Promise<boolean> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc('has_role', { _role: role });
  if (error) return false;
  return Boolean(data);
}

/**
 * Checks whether the current user can access a given student record.
 * Relies on the can_access_student() Postgres function.
 */
export async function canAccessStudent(studentId: string): Promise<boolean> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc('can_access_student', {
    _student_id: studentId,
  });
  if (error) return false;
  return Boolean(data);
}
