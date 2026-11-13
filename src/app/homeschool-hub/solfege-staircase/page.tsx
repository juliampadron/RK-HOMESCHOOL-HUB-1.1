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

const RK_GREEN = '#2F6B65';
const RK_YELLOW = '#FBC440';
const RK_ORANGE = '#F05A22';

const LEVEL_2_UNLOCK_SCORE = 15;
const GAME_SLUG = 'solfege-staircase';

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

  return <SolfegeGame key={studentId ?? 'guest'} studentId={studentId} />;
}

function SolfegeGame({ studentId }: { studentId?: string }) {
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
  const [progressReady, setProgressReady] = useState(false);
  const [saveStatus, setSaveStatus] = useState('Loading progress…');
  const [historyStatus, setHistoryStatus] = useState('');
  const cacheKeyRef = useRef<string | null>(null);
  const readyRef = useRef(false);
  const ownerRef = useRef<string | null>(null);
  const aliveRef = useRef(true);
  const saveQueueRef = useRef<Promise<void>>(Promise.resolve());
  const questionLockedRef = useRef(false);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const later = useCallback((callback: () => void, delay: number) => {
    const timer = setTimeout(() => { if (aliveRef.current) callback(); }, delay);
    timersRef.current.push(timer);
    return timer;
  }, []);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const supabaseRef = useRef<SupabaseClient | null>(null);

  const levelTwoUnlocked = score >= LEVEL_2_UNLOCK_SCORE;
  const accuracy = totalAttempts ? Math.round((correctCount / totalAttempts) * 100) : 100;

  const levelButtonText = useMemo(() => {
    if (!levelTwoUnlocked) return '🔓 Level 2 (Intervals)';
    return level === 1 ? '🔓 Level 2 (Intervals)' : '🔒 Back to Level 1';
  }, [level, levelTwoUnlocked]);

  useEffect(() => {
    aliveRef.current = true;
    let cancelled = false;
    const client = createSupabase();
    supabaseRef.current = client;
    if (!localStorage.getItem('rk_tutorialSeen')) later(() => setIsTutorialOpen(true), 500);

    const load = async () => {
      if (!studentId) {
        cacheKeyRef.current = 'rk_solfege:guest';
        const cached = Number(localStorage.getItem(cacheKeyRef.current) ?? '0');
        setScore(Number.isSafeInteger(cached) && cached >= 0 ? cached : 0);
        setSaveStatus('Practice on this device. Choose a student to save online.');
      } else {
        if (!client) throw new Error('Online progress is unavailable.');
        if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(studentId)) {
          throw new Error('This student link is invalid.');
        }
        const { data: session, error: sessionError } = await client.auth.getSession();
        if (cancelled) return;
        if (sessionError || !session.session) throw new Error('Sign in to save student progress.');
        ownerRef.current = session.session.user.id;
        const { data: allowed, error: accessError } = await client.rpc('can_access_game_student', { target_student: studentId });
        if (cancelled) return;
        if (accessError || !allowed) throw new Error('This account cannot access this student.');
        const { data, error } = await client.from('student_game_progress').select('score')
          .eq('student_id', studentId).eq('game_slug', GAME_SLUG).maybeSingle();
        if (cancelled) return;
        if (error) throw new Error('Could not load online progress. Reload to try again.');
        // Online state is authoritative; never apply another student's cache or
        // replay an old offline score into a newly selected student's record.
        cacheKeyRef.current = `rk_solfege:${session.session.user.id}:${studentId}`;
        setScore(data?.score ?? 0);
        localStorage.setItem(cacheKeyRef.current, String(data?.score ?? 0));
        setSaveStatus('Progress loaded.');
      }
      if (!cancelled) {
        readyRef.current = true;
        setProgressReady(true);
      }
    };
    void load().catch((error: unknown) => {
      if (!cancelled) setSaveStatus(error instanceof Error ? error.message : 'Could not load progress.');
    });
    // A changed account must remount the game so no child's state carries over.
    const { data: authListener } = client?.auth.onAuthStateChange((event, session) => {
      if (studentId && ownerRef.current &&
          (event === 'SIGNED_OUT' || (session && session.user.id !== ownerRef.current))) {
        readyRef.current = false;
        setProgressReady(false);
        if (studentId) window.location.reload();
      }
    }) ?? { data: null };
    return () => {
      cancelled = true;
      aliveRef.current = false;
      readyRef.current = false;
      timersRef.current.forEach(clearTimeout);
      timersRef.current = [];
      authListener?.subscription.unsubscribe();
      void audioCtxRef.current?.close();
    };
  }, [later, studentId]);

  const saveScore = useCallback((nextScore: number) => {
    if (!readyRef.current || !cacheKeyRef.current) return;
    try { localStorage.setItem(cacheKeyRef.current, String(nextScore)); }
    catch { setSaveStatus('Device storage is unavailable.'); }
    const client = supabaseRef.current;
    if (!studentId || !client) return;
    // Preserve answer/reset ordering even when network responses arrive slowly.
    saveQueueRef.current = saveQueueRef.current.then(async () => {
      if (!aliveRef.current || !readyRef.current) return;
      setSaveStatus('Saving…');
      const { error } = await client.rpc('save_game_progress', {
        p_student_id: studentId, p_game_slug: GAME_SLUG, p_score: nextScore,
      });
      if (aliveRef.current) setSaveStatus(error ? 'Progress was not saved online. Check your connection and sign-in.' : 'Progress saved.');
    }).catch(() => {
      if (aliveRef.current) setSaveStatus('Progress was not saved online. Check your connection and sign-in.');
    });
  }, [studentId]);

  const saveSession = useCallback(async (payload: { score: number; accuracy: number; streak: number; level: Level; attempts: number }) => {
    if (!readyRef.current || !studentId || !supabaseRef.current) return;
    try {
      const { error } = await supabaseRef.current.from('game_sessions').insert({
        student_id: studentId, game_slug: GAME_SLUG,
        score: payload.score, accuracy: payload.accuracy, streak: payload.streak,
        metadata: { level: payload.level, attempts: payload.attempts },
      });
      if (error && aliveRef.current) setHistoryStatus('Practice history was not saved online.');
    } catch {
      if (aliveRef.current) setHistoryStatus('Practice history was not saved online.');
    }
  }, [studentId]);

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
    later(() => {
      setActiveStep((current) => (current === idx ? null : current));
    }, 800);
  }, [later]);

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
      if (!readyRef.current) return;
      timersRef.current.forEach(clearTimeout);
      timersRef.current = [];
      questionLockedRef.current = false;
      if (targetLevel === 2) {
        const nextInterval = makeIntervalQuestion();
        setIntervalQuestion(nextInterval);
        setCurrentNoteIndex(null);

        playTone(steps[nextInterval.firstIndex].freq, 0.45, 'triangle');

        later(() => {
          playTone(steps[nextInterval.secondIndex].freq, 0.45, 'triangle');
        }, 650);

        setMessage('🎧 Did it go UP, DOWN, or stay SAME?');
        return;
      }

      const idx = Math.floor(Math.random() * steps.length);
      setIntervalQuestion(null);
      setCurrentNoteIndex(idx);

      playTone(steps[idx].freq);
      setMessage('Listen… then click the matching step!');
    },
    [later, level, makeIntervalQuestion, playTone],
  );

  const handleStepClick = useCallback(
    (clickedIndex: number) => {
      if (!readyRef.current || questionLockedRef.current || level === 2 || currentNoteIndex === null) return;

      const nextAttempts = totalAttempts + 1;
      setTotalAttempts(nextAttempts);

      if (clickedIndex === currentNoteIndex) {
        questionLockedRef.current = true;
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

        later(() => chooseNewNote(), 1400);
      } else {
        const nextAccuracy = Math.round((correctCount / nextAttempts) * 100);
        setStreak(0);
        void saveSession({ score, accuracy: nextAccuracy, streak: 0, level, attempts: nextAttempts });
        setMessage('Try again!');
        playTone(steps[currentNoteIndex].freq, 0.6);
      }
    },
    [later, chooseNewNote, correctCount, currentNoteIndex, level, playTone, rkConfettiBurst, saveScore, saveSession, score, streak, totalAttempts],
  );

  const handleIntervalChoice = useCallback(
    (guess: IntervalDirection) => {
      if (!readyRef.current || questionLockedRef.current || level !== 2 || !intervalQuestion) return;
      questionLockedRef.current = true;

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

      later(() => chooseNewNote(), 1600);
    },
    [later, chooseNewNote, correctCount, intervalQuestion, level, rkConfettiBurst, saveScore, saveSession, score, streak, totalAttempts],
  );

  const replay = useCallback(() => {
    if (level === 2 && intervalQuestion) {
      playTone(steps[intervalQuestion.firstIndex].freq, 0.45);

      later(() => {
        playTone(steps[intervalQuestion.secondIndex].freq, 0.45);
      }, 550);
      return;
    }

    if (currentNoteIndex !== null) {
      playTone(steps[currentNoteIndex].freq);
    }
  }, [later, currentNoteIndex, intervalQuestion, level, playTone]);

  const playScale = useCallback(() => {
    let i = 0;
    const playNext = () => {
      if (i >= steps.length) return;
      highlightStep(i);
      playTone(steps[i].freq, 0.4);
      i += 1;
      later(playNext, 380);
    };
    playNext();
  }, [later, highlightStep, playTone]);

  const resetStars = useCallback(() => {
    if (!readyRef.current) return;
    timersRef.current.forEach(clearTimeout);
    questionLockedRef.current = true;
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
      later(() => chooseNewNote(next), 0);
      return next;
    });
  }, [later, chooseNewNote, levelTwoUnlocked]);

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

          <p role="status" aria-live="polite">{saveStatus} {historyStatus}</p>
          <fieldset disabled={!progressReady}>
          <div className="flex flex-wrap gap-2.5">
            <button className="rounded-full border-2 px-4 py-2.5 font-extrabold text-white" style={{ backgroundColor: RK_ORANGE }} onClick={() => chooseNewNote()}>
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
          </fieldset>
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
