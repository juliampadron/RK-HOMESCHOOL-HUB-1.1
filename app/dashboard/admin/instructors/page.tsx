import { createClient } from "@supabase/supabase-js";

interface InstructorProfile {
  id: string;
  user_id: string;
  full_name: string | null;
  email: string | null;
  approval_status: string | null;
  checkr_candidate_id: string | null;
  checkr_report_id: string | null;
  background_check_updated_at: string | null;
  created_at: string | null;
}

const STATUS_BADGE: Record<
  string,
  { label: string; className: string }
> = {
  invited: {
    label: "Invited",
    className:
      "bg-blue-100 text-blue-800 border border-blue-300",
  },
  processing: {
    label: "Processing",
    className:
      "bg-yellow-100 text-yellow-800 border border-yellow-300",
  },
  pending_admin_review: {
    label: "Pending Review",
    className:
      "bg-orange-100 text-orange-800 border border-orange-300",
  },
};

const REVIEW_STATUSES = Object.keys(STATUS_BADGE);

function StatusBadge({ status }: { status: string | null }) {
  const config =
    status && STATUS_BADGE[status]
      ? STATUS_BADGE[status]
      : { label: status ?? "Unknown", className: "bg-gray-100 text-gray-700 border border-gray-300" };

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${config.className}`}
    >
      {config.label}
    </span>
  );
}

export default async function AdminInstructorsPage() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error(
      "AdminInstructorsPage: Supabase environment variables are not configured."
    );
    return (
      <main className="mx-auto max-w-6xl px-4 py-8">
        <p className="text-red-600">
          Dashboard configuration error. Please contact support.
        </p>
      </main>
    );
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const { data: instructors, error } = await supabase
    .from("instructor_profiles")
    .select(
      "id, user_id, full_name, email, approval_status, checkr_candidate_id, checkr_report_id, background_check_updated_at, created_at"
    )
    .in("approval_status", REVIEW_STATUSES)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to fetch instructor profiles:", error);
    return (
      <main className="mx-auto max-w-6xl px-4 py-8">
        <p className="text-red-600">
          Unable to load instructor data. Please try again later.
        </p>
      </main>
    );
  }

  const profiles: InstructorProfile[] = instructors ?? [];

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold text-gray-900">
        Instructor Background Check Review
      </h1>

      {profiles.length === 0 ? (
        <p className="text-gray-500">
          No instructors currently require review.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
          <table className="min-w-full divide-y divide-gray-200 bg-white text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left font-semibold text-gray-600"
                >
                  Name
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left font-semibold text-gray-600"
                >
                  Email
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left font-semibold text-gray-600"
                >
                  Status
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left font-semibold text-gray-600"
                >
                  Checkr Report ID
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left font-semibold text-gray-600"
                >
                  Last Updated
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {profiles.map((instructor) => (
                <tr key={instructor.id} className="hover:bg-gray-50">
                  <td className="whitespace-nowrap px-6 py-4 font-medium text-gray-900">
                    {instructor.full_name ?? "—"}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-gray-600">
                    {instructor.email ?? "—"}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <StatusBadge status={instructor.approval_status} />
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 font-mono text-gray-500">
                    {instructor.checkr_report_id ?? "—"}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-gray-500">
                    {instructor.background_check_updated_at
                      ? new Date(
                          instructor.background_check_updated_at
                        ).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
