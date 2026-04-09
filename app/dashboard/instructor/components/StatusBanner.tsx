"use client";

interface StatusBannerProps {
  /** The instructor's current background-check / approval status. */
  status: string | null | undefined;
}

const BANNER_STATUSES = new Set(["pending", "invited"]);

/**
 * StatusBanner
 *
 * Displays a warm, encouraging message when an instructor's account is in the
 * `pending` or `invited` state, guiding them to complete their background check.
 * Renders nothing for all other statuses.
 */
export default function StatusBanner({ status }: StatusBannerProps) {
  if (!status || !BANNER_STATUSES.has(status)) {
    return null;
  }

  return (
    <div
      role="status"
      aria-live="polite"
      style={{ backgroundColor: "#F7C4A5" }}
      className="flex items-start gap-3 rounded-lg px-5 py-4 text-gray-800 shadow-sm"
    >
      {/* Decorative icon */}
      <span aria-hidden="true" className="mt-0.5 text-xl">
        🌟
      </span>

      <p className="text-sm font-medium leading-relaxed">
        We are so excited to have you join us! Please check your email for a
        secure background check link so we can get your classes listed.
      </p>
    </div>
  );
}
