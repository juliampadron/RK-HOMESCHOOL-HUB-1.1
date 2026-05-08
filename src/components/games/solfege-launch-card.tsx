'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface SolfegeLaunchCardProps {
  studentId: string;
  studentName?: string;
}

export default function SolfegeLaunchCard({ studentId, studentName }: SolfegeLaunchCardProps) {
  const gameUrl = `/games/solfege-staircase?studentId=${encodeURIComponent(studentId)}`;

  return (
    <Card className="border-2 border-[#2F6B65] bg-[#fdfbf7] shadow-lg">
      <CardHeader className="pb-3">
        <div className="flex items-start gap-3">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#FBC440] text-2xl">🎵</div>
          <div>
            <CardTitle className="text-xl text-[#2F6B65]">Solfege Staircase</CardTitle>
            <CardDescription className="font-medium text-[#F05A22]">Ear-training game</CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        <p className="text-sm text-black/80">
          Climb the musical stairs! Listen, match notes, and train your ear with Level 1 (note ID) and Level 2
          (intervals). Perfect for building music theory and singing confidence.
        </p>

        {studentName && <p className="text-sm font-semibold text-[#2F6B65]">Playing for: {studentName}</p>}

        <Link
          href={gameUrl}
          aria-label="Launch Solfege Staircase game"
          className="inline-flex"
        >
          <Button className="bg-[#F05A22] font-bold text-white hover:bg-[#d94e1f]">▶ Play Solfege Staircase Now</Button>
        </Link>

        <p className="text-xs font-semibold text-black/55">Progress is automatically saved</p>
      </CardContent>
    </Card>
  );
}
