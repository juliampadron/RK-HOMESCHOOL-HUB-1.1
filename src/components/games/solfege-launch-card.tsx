'use client';

import Link from 'next/link';

interface SolfegeLaunchCardProps {
  studentId: string;
  studentName?: string;
}

export default function SolfegeLaunchCard({ studentId, studentName }: SolfegeLaunchCardProps) {
  const gameUrl = `/games/solfege-staircase?studentId=${encodeURIComponent(studentId)}`;

  return (
    <section className="border-2 border-[#2F6B65] rounded-2xl bg-[#fdfbf7] p-5 shadow-lg">
      <header className="pb-3">
        <div className="flex items-start gap-3">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#FBC440] text-2xl">🎵</div>
          <div>
            <h2 className="text-xl text-[#2F6B65]">Solfege Staircase</h2>
            <p className="font-medium text-[#F05A22]">Ear-training game</p>
          </div>
        </div>
      </header>

      <div className="space-y-3">
        <p className="text-sm text-black/80">
          Climb the musical stairs! Listen, match notes, and train your ear with Level 1 (note ID) and Level 2
          (intervals). Perfect for building music theory and singing confidence.
        </p>

        {studentName && <p className="text-sm font-semibold text-[#2F6B65]">Playing for: {studentName}</p>}

        <Link
          href={gameUrl}
          aria-label="Launch Solfege Staircase game"
          className="inline-flex rounded-lg bg-[#F05A22] px-4 py-2 font-bold text-white hover:bg-[#d94e1f]"
        >
          ▶ Play Solfege Staircase Now
        </Link>

        <p className="text-xs font-semibold text-black/55">Sign in with student access to save progress online</p>
      </div>
    </section>
  );
}
