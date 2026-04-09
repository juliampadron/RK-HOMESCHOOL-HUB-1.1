"use client";

interface StatusBannerProps {
  /** The instructor's current approval_status from their profile */
  status: string | null | undefined;
}

const PENDING_STATUSES = new Set(["pending", "invited"]);

/**
 * StatusBanner displays a warm, encouraging message to instructors whose
 * background check is still in the early stages (pending or invited).
 */
export default function StatusBanner({ status }: StatusBannerProps) {
  if (!status || !PENDING_STATUSES.has(status)) {
    return null;
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className="flex items-start gap-3 rounded-xl px-5 py-4 shadow-sm"
      style={{ backgroundColor: "#F7C4A5" }}
    >
      <span className="mt-0.5 text-2xl" aria-hidden="true">
        🌟
      </span>
      <p className="text-sm font-medium leading-relaxed text-gray-900">
        We are so excited to have you join us! Please check your email for a
        secure background check link so we can get your classes listed.
      </p>
    </div>
  );
}
