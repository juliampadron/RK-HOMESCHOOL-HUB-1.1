'use client';

import Link from 'next/link';

type SolfegeLaunchCardProps = {
  studentId: string;
  className?: string;
};

export function SolfegeLaunchCard({ studentId, className }: SolfegeLaunchCardProps) {
  const href = `/games/solfege-staircase?studentId=${encodeURIComponent(studentId)}`;

  return (
    <article
      className={`rounded-3xl border-2 border-[#2F6B65]/20 bg-[#fdfbf7] p-5 shadow-sm ${className ?? ''}`.trim()}
      aria-label="Solfege Staircase launch card"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-extrabold text-[#2F6B65]">🎵 Solfege Staircase</h3>
          <p className="mt-1 text-sm text-black/70">
            Practice pitch matching and interval direction with replay, scale mode, and sing-back prompts.
          </p>
        </div>
        <span className="rounded-full bg-[#FBC440] px-3 py-1 text-xs font-black text-black">Music</span>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <span className="text-xs font-semibold text-black/60">DO → RE → MI → FA → SOL → LA → TI → DO</span>
        <Link
          href={href}
          className="rounded-full border-2 border-black/20 bg-[#F05A22] px-4 py-2 text-sm font-extrabold text-white transition hover:brightness-105"
        >
          Start Game
        </Link>
      </div>
    </article>
  );
}
