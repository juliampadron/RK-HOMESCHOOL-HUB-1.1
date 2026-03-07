import { supabaseAdmin } from "@/lib/supabaseClient";

type InstructorStatus =
  | "pending"
  | "invited"
  | "processing"
  | "pending_admin_review"
  | "approved"
  | "rejected";

interface InstructorProfile {
  id: string;
  full_name: string | null;
  email: string | null;
  status: InstructorStatus;
  checkr_candidate_id: string | null;
  checkr_report_id: string | null;
  background_check_updated_at: string | null;
}

const STATUS_BADGE: Record<
  InstructorStatus,
  { label: string; className: string }
> = {
  pending: {
    label: "Pending",
    className: "bg-gray-100 text-gray-700",
  },
  invited: {
    label: "Invited",
    className: "bg-blue-100 text-blue-700",
  },
  processing: {
    label: "Processing",
    className: "bg-yellow-100 text-yellow-700",
  },
  pending_admin_review: {
    label: "Needs Review",
    className: "bg-orange-100 text-orange-700",
  },
  approved: {
    label: "Approved",
    className: "bg-green-100 text-green-700",
  },
  rejected: {
    label: "Rejected",
    className: "bg-red-100 text-red-700",
  },
};

const FILTER_STATUSES: InstructorStatus[] = [
  "pending_admin_review",
  "processing",
  "invited",
];

async function fetchPendingInstructors(): Promise<InstructorProfile[]> {
  const { data, error } = await supabaseAdmin
    .from("instructor_profiles")
    .select(
      "id, full_name, email, status, checkr_candidate_id, checkr_report_id, background_check_updated_at"
    )
    .in("status", FILTER_STATUSES)
    .order("background_check_updated_at", {
      ascending: false,
      nullsFirst: false,
    });

  if (error) {
    console.error("Failed to fetch instructor profiles:", error.message);
    return [];
  }

  return (data ?? []) as InstructorProfile[];
}

function StatusBadge({ status }: { status: InstructorStatus }) {
  const badge = STATUS_BADGE[status] ?? {
    label: status,
    className: "bg-gray-100 text-gray-700",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${badge.className}`}
    >
      {badge.label}
    </span>
  );
}

export default async function AdminInstructorsPage() {
  const instructors = await fetchPendingInstructors();

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="mb-2 text-2xl font-bold text-gray-900">
        Instructor Background Check Review
      </h1>
      <p className="mb-6 text-sm text-gray-500">
        Showing instructors in{" "}
        <strong>invited</strong>, <strong>processing</strong>, or{" "}
        <strong>needs review</strong> states.
      </p>

      {instructors.length === 0 ? (
        <p className="rounded-lg border border-dashed border-gray-300 p-8 text-center text-gray-400">
          No instructors currently require attention.
        </p>
      ) : (
        <div className="overflow-hidden rounded-lg border border-gray-200 shadow-sm">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500"
                >
                  Instructor
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500"
                >
                  Status
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500"
                >
                  Checkr Report ID
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500"
                >
                  Last Updated
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {instructors.map((instructor) => (
                <tr key={instructor.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">
                      {instructor.full_name ?? "—"}
                    </div>
                    <div className="text-sm text-gray-500">
                      {instructor.email ?? "—"}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status={instructor.status} />
                  </td>
                  <td className="px-6 py-4 font-mono text-sm text-gray-600">
                    {instructor.checkr_report_id ?? "—"}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
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
