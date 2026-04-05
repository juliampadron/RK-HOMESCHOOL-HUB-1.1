'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { useSearchParams } from 'next/navigation';

type Level = 1 | 2;
type IntervalDirection = 'UP' | 'SAME' | 'DOWN';

type StairStep = {
  solfege: 'DO' | 'RE' | 'MI' | 'FA' | 'SOL' | 'LA' | 'TI';
  letter: string;
  freq: number;
};

type IntervalQuestion = {
  firstIndex: number;
  secondIndex: number;
  correct: IntervalDirection;
};

type StudentSkillRow = {
  mastery_level: number;
};

const RK_GREEN = '#2F6B65';
const RK_YELLOW = '#FBC440';
const RK_ORANGE = '#F05A22';

const LEVEL_2_UNLOCK_SCORE = 15;
const SKILL_TAG = 'solfege-major-scale';

const steps: StairStep[] = [
  { solfege: 'DO', letter: 'C', freq: 261.63 },
  { solfege: 'RE', letter: 'D', freq: 293.66 },
  { solfege: 'MI', letter: 'E', freq: 329.63 },
  { solfege: 'FA', letter: 'F', freq: 349.23 },
  { solfege: 'SOL', letter: 'G', freq: 392.0 },
  { solfege: 'LA', letter: 'A', freq: 440.0 },
  { solfege: 'TI', letter: 'B', freq: 493.88 },
  { solfege: 'DO', letter: 'C', freq: 523.25 },
];

const createSupabase = (): SupabaseClient | null => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) return null;
  return createClient(url, anonKey);
};

const webkitAudioContextClass =
  typeof window !== 'undefined' ? (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext : undefined;

export default function SolfegeStaircasePage() {
  const searchParams = useSearchParams();
  const studentId = searchParams.get('studentId') ?? searchParams.get('student_id') ?? undefined;

  const [score, setScore] = useState(0);
  const [level, setLevel] = useState<Level>(1);
  const [currentNoteIndex, setCurrentNoteIndex] = useState<number | null>(null);
  const [intervalQuestion, setIntervalQuestion] = useState<IntervalQuestion | null>(null);
  const [message, setMessage] = useState('Press PLAY NOTE, then click the matching step.');
  const [correctCount, setCorrectCount] = useState(0);
  const [totalAttempts, setTotalAttempts] = useState(0);
  const [streak, setStreak] = useState(0);
  const [isTutorialOpen, setIsTutorialOpen] = useState(false);
  const [activeStep, setActiveStep] = useState<number | null>(null);
  const hasMountedRef = useRef(false);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const supabaseRef = useRef<SupabaseClient | null>(null);

  const levelTwoUnlocked = score >= LEVEL_2_UNLOCK_SCORE;
  const accuracy = totalAttempts ? Math.round((correctCount / totalAttempts) * 100) : 100;

  const levelButtonText = useMemo(() => {
    if (!levelTwoUnlocked) return `🔒 Level 2 unlocks at ${LEVEL_2_UNLOCK_SCORE} stars (${score}/${LEVEL_2_UNLOCK_SCORE})`;
    return level === 1 ? '🔓 Level 2 (Intervals)' : '🔒 Back to Level 1';
  }, [level, levelTwoUnlocked, score]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const seenTutorial = localStorage.getItem('rk_tutorialSeen');
    if (!seenTutorial) {
      const timer = setTimeout(() => setIsTutorialOpen(true), 500);
      return () => clearTimeout(timer);
    }

    const cachedScore = Number(localStorage.getItem('rk_solfegeScore') ?? '0');
    if (!Number.isNaN(cachedScore) && cachedScore > 0) {
      setScore(cachedScore);
      setMessage(`👋 Welcome back! You have ${cachedScore} stars.`);
    }
  }, []);

  useEffect(() => {
    supabaseRef.current = createSupabase();
  }, []);

  const saveLocalScore = useCallback((nextScore: number) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('rk_solfegeScore', String(nextScore));
  }, []);

  const loadScore = useCallback(async () => {
    if (!studentId || !supabaseRef.current) return;

    const { data, error } = await supabaseRef.current
      .from('student_skills')
      .select('mastery_level')
      .eq('student_id', studentId)
      .eq('skill_tag', SKILL_TAG)
      .single<StudentSkillRow>();

    if (error || !data) return;

    const mastery = Number(data.mastery_level) || 0;
    setScore(mastery);
    saveLocalScore(mastery);
    setMessage(`👋 Welcome back! You have ${mastery} stars.`);
  }, [saveLocalScore, studentId]);

  const saveScore = useCallback(
    async (nextScore: number) => {
      saveLocalScore(nextScore);
      if (!studentId || !supabaseRef.current) return;

      await supabaseRef.current.from('student_skills').upsert({
        student_id: studentId,
        skill_tag: SKILL_TAG,
        mastery_level: nextScore,
        evidence: {
          last_score: nextScore,
          timestamp: new Date().toISOString(),
        },
      });
    },
    [saveLocalScore, studentId],
  );

  const saveSession = useCallback(
    async (payload: { score: number; accuracy: number; streak: number; level: Level; attempts: number }) => {
      if (!studentId || !supabaseRef.current) return;

      await supabaseRef.current.from('game_sessions').insert({
        student_id: studentId,
        game_slug: 'solfege-staircase',
        score: payload.score,
        accuracy: payload.accuracy,
        streak: payload.streak,
        metadata: {
          level: payload.level,
          attempts: payload.attempts,
          timestamp: new Date().toISOString(),
        },
      });
    },
    [studentId],
  );

  useEffect(() => {
    void loadScore();
  }, [loadScore]);

  const ensureAudio = useCallback(() => {
    if (typeof window === 'undefined') return null;

    if (!audioCtxRef.current) {
      const Ctx = window.AudioContext ?? webkitAudioContextClass;
      if (!Ctx) return null;
      audioCtxRef.current = new Ctx();
    }

    if (audioCtxRef.current.state === 'suspended') {
      void audioCtxRef.current.resume();
    }

    return audioCtxRef.current;
  }, []);

  const playTone = useCallback((freq: number, duration = 0.7, type: OscillatorType = 'triangle') => {
    const ctx = ensureAudio();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    const oscHarmonic = ctx.createOscillator();
    const gainHarmonic = ctx.createGain();

    osc.type = type;
    osc.frequency.value = freq;

    oscHarmonic.type = 'sine';
    oscHarmonic.frequency.value = freq * 2;
    gainHarmonic.gain.value = 0.15;

    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.4, ctx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);

    osc.connect(gain).connect(ctx.destination);
    oscHarmonic.connect(gainHarmonic).connect(ctx.destination);

    osc.start();
    oscHarmonic.start();

    osc.stop(ctx.currentTime + duration);
    oscHarmonic.stop(ctx.currentTime + duration);
  }, [ensureAudio]);

  const highlightStep = useCallback((idx: number) => {
    setActiveStep(idx);
    window.setTimeout(() => {
      setActiveStep((current) => (current === idx ? null : current));
    }, 800);
  }, []);

  const rkConfettiBurst = useCallback(() => {
    const el = document.getElementById('messageBox');
    if (!el || !el.animate) return;

    el.animate(
      [
        { transform: 'scale(1)', offset: 0 },
        { transform: 'scale(1.03)', offset: 0.5 },
        { transform: 'scale(1)', offset: 1 },
      ],
      { duration: 550, easing: 'ease-out' },
    );
  }, []);

  const makeIntervalQuestion = useCallback((): IntervalQuestion => {
    const firstIndex = Math.floor(Math.random() * steps.length);
    const moveOptions = [-2, -1, 0, 1, 2].filter((delta) => {
      const target = firstIndex + delta;
      return target >= 0 && target < steps.length;
    });

    const delta = moveOptions[Math.floor(Math.random() * moveOptions.length)] ?? 0;
    const secondIndex = firstIndex + delta;
    const correct: IntervalDirection = delta === 0 ? 'SAME' : delta > 0 ? 'UP' : 'DOWN';

    return { firstIndex, secondIndex, correct };
  }, []);

  const chooseNewNote = useCallback(
    (targetLevel: Level = level) => {
      if (targetLevel === 2) {
      const nextInterval = makeIntervalQuestion();
      setIntervalQuestion(nextInterval);
      setCurrentNoteIndex(null);

      highlightStep(nextInterval.firstIndex);
      playTone(steps[nextInterval.firstIndex].freq, 0.45, 'triangle');

      window.setTimeout(() => {
        highlightStep(nextInterval.secondIndex);
        playTone(steps[nextInterval.secondIndex].freq, 0.45, 'triangle');
      }, 650);

      setMessage('🎧 Did it go UP, DOWN, or stay SAME?');
        return;
      }

      const idx = Math.floor(Math.random() * steps.length);
      setIntervalQuestion(null);
      setCurrentNoteIndex(idx);

      highlightStep(idx);
      playTone(steps[idx].freq);
      setMessage('Listen… then click the matching step!');
    },
    [highlightStep, level, makeIntervalQuestion, playTone],
  );

  const handleStepClick = useCallback(
    (clickedIndex: number) => {
      if (level === 2 || currentNoteIndex === null) return;

      const nextAttempts = totalAttempts + 1;
      setTotalAttempts(nextAttempts);

      if (clickedIndex === currentNoteIndex) {
        const nextScore = score + 1;
        const nextCorrect = correctCount + 1;
        const nextStreak = streak + 1;
        const nextAccuracy = Math.round((nextCorrect / nextAttempts) * 100);

        setScore(nextScore);
        setCorrectCount(nextCorrect);
        setStreak(nextStreak);
        void saveScore(nextScore);
        void saveSession({ score: nextScore, accuracy: nextAccuracy, streak: nextStreak, level, attempts: nextAttempts });

        setMessage(`✅ ${steps[currentNoteIndex].solfege}! Now sing it back! 🎤`);
        if (nextScore % 10 === 0) rkConfettiBurst();

        window.setTimeout(() => chooseNewNote(), 1400);
      } else {
        const nextAccuracy = Math.round((correctCount / nextAttempts) * 100);
        setStreak(0);
        void saveSession({ score, accuracy: nextAccuracy, streak: 0, level, attempts: nextAttempts });
        setMessage('Try again!');
        playTone(steps[currentNoteIndex].freq, 0.6);
      }
    },
    [chooseNewNote, correctCount, currentNoteIndex, level, playTone, rkConfettiBurst, saveScore, saveSession, score, streak, totalAttempts],
  );

  const handleIntervalChoice = useCallback(
    (guess: IntervalDirection) => {
      if (level !== 2 || !intervalQuestion) return;

      const nextAttempts = totalAttempts + 1;
      setTotalAttempts(nextAttempts);

      if (guess === intervalQuestion.correct) {
        const nextScore = score + 1;
        const nextCorrect = correctCount + 1;
        const nextStreak = streak + 1;
        const nextAccuracy = Math.round((nextCorrect / nextAttempts) * 100);

        setScore(nextScore);
        setCorrectCount(nextCorrect);
        setStreak(nextStreak);
        void saveScore(nextScore);
        void saveSession({ score: nextScore, accuracy: nextAccuracy, streak: nextStreak, level, attempts: nextAttempts });

        setMessage(`✅ Correct! It went ${guess}. Sing the two notes! 🎤`);
        if (nextScore % 10 === 0) rkConfettiBurst();
      } else {
        const nextAccuracy = Math.round((correctCount / nextAttempts) * 100);
        setStreak(0);
        void saveSession({ score, accuracy: nextAccuracy, streak: 0, level, attempts: nextAttempts });
        setMessage('❌ Listen again.');
      }

      window.setTimeout(() => chooseNewNote(), 1600);
    },
    [chooseNewNote, correctCount, intervalQuestion, level, rkConfettiBurst, saveScore, saveSession, score, streak, totalAttempts],
  );

  const replay = useCallback(() => {
    if (level === 2 && intervalQuestion) {
      highlightStep(intervalQuestion.firstIndex);
      playTone(steps[intervalQuestion.firstIndex].freq, 0.45);

      window.setTimeout(() => {
        highlightStep(intervalQuestion.secondIndex);
        playTone(steps[intervalQuestion.secondIndex].freq, 0.45);
      }, 550);
      return;
    }

    if (currentNoteIndex !== null) {
      highlightStep(currentNoteIndex);
      playTone(steps[currentNoteIndex].freq);
    }
  }, [currentNoteIndex, highlightStep, intervalQuestion, level, playTone]);

  const playScale = useCallback(() => {
    let i = 0;
    const playNext = () => {
      if (i >= steps.length) return;
      highlightStep(i);
      playTone(steps[i].freq, 0.4);
      i += 1;
      window.setTimeout(playNext, 380);
    };
    playNext();
  }, [highlightStep, playTone]);

  const resetStars = useCallback(() => {
    setScore(0);
    setLevel(1);
    setCurrentNoteIndex(null);
    setIntervalQuestion(null);
    setCorrectCount(0);
    setTotalAttempts(0);
    setStreak(0);
    void saveScore(0);
    setMessage("✨ Score reset. Let's start a new climb!");
  }, [saveScore]);

  const toggleLevel = useCallback(() => {
    if (!levelTwoUnlocked) return;

    setLevel((current) => {
      const next = current === 1 ? 2 : 1;
      setMessage(next === 2 ? '✨ Level 2: Listen for direction!' : '🎵 Level 1: Find the matching note!');
      window.setTimeout(() => chooseNewNote(next), 0);
      return next;
    });
  }, [chooseNewNote, levelTwoUnlocked]);

  const closeTutorial = useCallback(() => {
    localStorage.setItem('rk_tutorialSeen', 'true');
    setIsTutorialOpen(false);
    chooseNewNote();
  }, [chooseNewNote]);

  useEffect(() => {
    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      return;
    }

    if (level === 1) {
      setIntervalQuestion(null);
    } else {
      setCurrentNoteIndex(null);
    }
  }, [level]);

  return (
    <div className="mx-auto w-full max-w-4xl p-4 md:p-6">
      <style jsx>{`
        .rk-step.active {
          animation: glow 0.6s ease;
          box-shadow: 0 0 25px 8px #fbc440 !important;
          transform: scale(1.03);
        }

        @keyframes glow {
          0% { box-shadow: 0 0 0 0 rgba(251, 196, 64, 0.8); }
          70% { box-shadow: 0 0 0 20px rgba(251, 196, 64, 0); }
          100% { box-shadow: 0 0 0 0 rgba(251, 196, 64, 0); }
        }
      `}</style>

      <section className="overflow-hidden rounded-3xl border-4 shadow-xl" style={{ borderColor: RK_GREEN, backgroundColor: '#fdfbf7' }}>
        <header className="flex flex-wrap items-center justify-between gap-4 border-b-4 px-5 py-4 text-white md:px-6" style={{ backgroundColor: RK_GREEN, borderBottomColor: RK_YELLOW }}>
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-white text-xl" style={{ color: RK_ORANGE }}>
              🎵
            </div>
            <div>
              <h1 className="text-xl font-extrabold leading-tight md:text-2xl">Solfege Staircase</h1>
              <p className="text-sm font-semibold" style={{ color: RK_YELLOW }}>Renaissance Kids</p>
            </div>
          </div>

          <div className="rounded-full border-2 bg-white/15 px-3 py-2 text-right">
            <div className="text-xs font-semibold opacity-85">⭐ Stars</div>
            <div className="rounded-full px-4 py-1 text-xl font-black text-black" style={{ backgroundColor: RK_YELLOW }}>{score}</div>
          </div>
        </header>

        <main className="space-y-4 p-4 md:p-5">
          <div id="messageBox" className="rounded-2xl border-2 bg-[#fff7e6] px-4 py-3 font-semibold" style={{ borderColor: 'rgba(251,196,64,.55)' }}>
            {message}
          </div>

          <div className="flex flex-wrap gap-2.5">
            <button className="rounded-full border-2 px-4 py-2.5 font-extrabold text-white" style={{ backgroundColor: RK_ORANGE }} onClick={chooseNewNote}>
              {level === 2 ? '▶ PLAY INTERVAL' : '▶ PLAY NOTE'}
            </button>
            <button className="rounded-full border-2 px-4 py-2.5 font-extrabold" style={{ backgroundColor: RK_YELLOW }} onClick={replay}>🔁 Replay</button>
            <button className="rounded-full border-2 bg-white px-4 py-2.5 font-extrabold" onClick={playScale}>🎼 Play Scale</button>
            <button className="rounded-full border-2 px-4 py-2.5 font-extrabold" style={{ backgroundColor: RK_YELLOW }} onClick={resetStars}>↺ Reset Stars</button>
            <button className="rounded-full border-2 bg-white px-4 py-2.5 font-extrabold" onClick={() => window.print()}>🖨 Print Worksheet</button>
            <button className="rounded-full border-2 px-4 py-2.5 font-extrabold disabled:cursor-not-allowed disabled:opacity-50" style={{ backgroundColor: RK_YELLOW }} onClick={toggleLevel} disabled={!levelTwoUnlocked}>
              {levelButtonText}
            </button>
          </div>

          {level === 2 && (
            <div className="flex flex-wrap gap-2.5">
              <button className="rounded-full border-2 px-4 py-2.5 font-extrabold text-white" style={{ backgroundColor: RK_ORANGE }} onClick={() => handleIntervalChoice('UP')}>⬆️ UP</button>
              <button className="rounded-full border-2 px-4 py-2.5 font-extrabold text-white" style={{ backgroundColor: RK_ORANGE }} onClick={() => handleIntervalChoice('SAME')}>⏺ SAME</button>
              <button className="rounded-full border-2 px-4 py-2.5 font-extrabold text-white" style={{ backgroundColor: RK_ORANGE }} onClick={() => handleIntervalChoice('DOWN')}>⬇️ DOWN</button>
            </div>
          )}

          <div className="grid gap-2.5" aria-label="Solfege staircase">
            {steps.map((step, idx) => (
              <button
                key={`${step.solfege}-${idx}`}
                type="button"
                data-index={idx}
                aria-label={`Step ${idx + 1}: ${step.solfege} (${step.letter})`}
                className={`rk-step flex items-center justify-between gap-3 rounded-2xl border-2 bg-white px-4 py-3 shadow-sm transition ${activeStep === idx ? 'active' : ''}`}
                style={{ borderColor: 'rgba(47,107,101,.18)' }}
                onClick={() => handleStepClick(idx)}
              >
                <span className="min-w-20 rounded-full border-2 px-3 py-1.5 text-center text-sm font-black tracking-wide" style={{ backgroundColor: 'rgba(47,107,101,.12)', color: RK_GREEN, borderColor: 'rgba(47,107,101,.18)' }}>
                  {step.solfege}
                </span>
                <span className="min-w-14 rounded-full border-2 px-3 py-1.5 text-center text-sm font-black" style={{ backgroundColor: 'rgba(251,196,64,.25)' }}>
                  {step.letter}
                </span>
              </button>
            ))}
          </div>

          <div className="pt-1 text-center text-sm font-bold" style={{ color: RK_GREEN }}>
            Accuracy: {accuracy}% • Streak: 🔥 {streak}
          </div>
        </main>

        <footer className="px-5 pb-5 text-center text-sm font-semibold text-black/55">
          “Light up learning through the arts.” · renkids.org · (845) 452-4225
        </footer>
      </section>

      {isTutorialOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4">
          <div className="w-full max-w-xl rounded-3xl bg-white p-7 text-center shadow-2xl">
            <h2 className="text-2xl font-black" style={{ color: RK_GREEN }}>Welcome to Solfege Staircase! 🎵</h2>
            <p className="mt-3 text-base">Climb the stairs by listening and matching notes. Level 2 trains your ear for direction.</p>
            <p className="mt-2 text-base">After every correct answer, <strong>sing the note back</strong> — that&apos;s how real musicians learn.</p>
            <button className="mt-6 rounded-full border-2 px-5 py-2.5 font-extrabold text-white" style={{ backgroundColor: RK_ORANGE }} onClick={closeTutorial}>
              Got it — let&apos;s climb!
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
