'use client';

import { useState, useCallback, useRef } from 'react';
// Note: metadata should be exported from a parent Server Component layout,
// not from a 'use client' component.

const STEPS = [
  { solfege: 'Do', letter: 'C', freq: 261.63 },
  { solfege: 'Re', letter: 'D', freq: 293.66 },
  { solfege: 'Mi', letter: 'E', freq: 329.63 },
  { solfege: 'Fa', letter: 'F', freq: 349.23 },
  { solfege: 'Sol', letter: 'G', freq: 392.0 },
  { solfege: 'La', letter: 'A', freq: 440.0 },
  { solfege: 'Ti', letter: 'B', freq: 493.88 },
];

function playTone(freq: number, duration = 0.8) {
  if (typeof window === 'undefined') return;
  const ctx = new (window.AudioContext ||
    (window as unknown as { webkitAudioContext: typeof AudioContext })
      .webkitAudioContext)();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.type = 'sine';
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0.4, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + duration);
}

export default function SolfegeStaircasePage() {
  const [stars, setStars] = useState(0);
  const [currentIndex, setCurrentIndex] = useState<number | null>(null);
  const [message, setMessage] = useState('Press "Play Note" to begin!');
  const [stepsEnabled, setStepsEnabled] = useState(false);
  const [level2Unlocked, setLevel2Unlocked] = useState(false);
  const playBtnRef = useRef<HTMLButtonElement>(null);

  const chooseNewNote = useCallback(() => {
    const idx = Math.floor(Math.random() * STEPS.length);
    setCurrentIndex(idx);
    setStepsEnabled(true);
    setMessage('Listen carefully… then click the matching step!');
    playTone(STEPS[idx].freq);
  }, []);

  const handleStepClick = useCallback(
    (clickedIndex: number) => {
      if (!stepsEnabled || currentIndex === null) return;
      if (clickedIndex === currentIndex) {
        setStars((s) => s + 1);
        setMessage(
          `✅ Correct! That was ${STEPS[currentIndex].solfege} (${STEPS[currentIndex].letter}). Great ear!`
        );
        setStepsEnabled(false);
        setCurrentIndex(null);
      } else {
        setMessage(
          `Try again — listen once more, then choose the step that matches.`
        );
        playTone(STEPS[currentIndex].freq, 0.6);
      }
    },
    [stepsEnabled, currentIndex]
  );

  const resetScore = useCallback(() => {
    setStars(0);
    setStepsEnabled(false);
    setCurrentIndex(null);
    setMessage("✨ Score reset. Let's start a new climb!");
    playBtnRef.current?.focus();
  }, []);

  return (
    <main className="min-h-screen bg-white p-6 print:p-2">
      <div className="max-w-xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-rk-green">
            Solfège Staircase
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Listen to the note, then climb to the right step!
          </p>
        </div>

        {/* Score */}
        <div className="flex items-center justify-center gap-3 print:hidden">
          <span className="text-lg font-semibold text-gray-700">
            ⭐ Stars: <span className="text-rk-yellow font-bold">{stars}</span>
          </span>
        </div>

        {/* Message */}
        <div
          role="status"
          aria-live="polite"
          className="text-center text-sm text-gray-600 min-h-[1.5rem] print:hidden"
        >
          {message}
        </div>

        {/* Staircase */}
        <div
          className="flex flex-col-reverse gap-1"
          role="group"
          aria-label="Solfège staircase steps"
        >
          {STEPS.map((step, idx) => (
            <button
              key={step.solfege}
              onClick={() => handleStepClick(idx)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleStepClick(idx);
                }
              }}
              disabled={!stepsEnabled}
              aria-label={`Step ${idx + 1}: ${step.solfege} — ${step.letter}`}
              aria-disabled={!stepsEnabled}
              style={{ width: `${((idx + 1) / STEPS.length) * 100}%` }}
              className={`
                self-start text-left px-4 py-2 rounded-lg text-sm font-semibold
                transition-colors focus-visible:ring-2 focus-visible:ring-rk-orange
                ${
                  stepsEnabled
                    ? 'bg-rk-green text-white hover:bg-opacity-80 cursor-pointer'
                    : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                }
              `}
            >
              <span className="font-bold">{step.solfege}</span>{' '}
              <span className="opacity-70">({step.letter})</span>
            </button>
          ))}
        </div>

        {/* Controls */}
        <div className="flex flex-wrap gap-3 justify-center print:hidden">
          <button
            ref={playBtnRef}
            onClick={chooseNewNote}
            className="px-5 py-2 rounded-lg bg-rk-orange text-white font-semibold hover:bg-opacity-90 focus-visible:ring-2 focus-visible:ring-rk-orange"
          >
            Play Note
          </button>
          <button
            onClick={resetScore}
            className="px-5 py-2 rounded-lg border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 focus-visible:ring-2 focus-visible:ring-rk-orange"
          >
            Reset Score
          </button>
          <button
            onClick={() => window.print()}
            className="px-5 py-2 rounded-lg border border-rk-blue text-rk-blue font-semibold hover:bg-blue-50 focus-visible:ring-2 focus-visible:ring-rk-blue"
          >
            Print Worksheet
          </button>
        </div>

        {/* Level 2 unlock */}
        {!level2Unlocked && (
          <div className="text-center print:hidden">
            <button
              onClick={() => setLevel2Unlocked(true)}
              className="text-sm text-rk-blue underline hover:no-underline focus-visible:ring-2 focus-visible:ring-rk-blue"
            >
              Unlock Level 2: Intervals
            </button>
          </div>
        )}
        {level2Unlocked && (
          <div className="rounded-lg border border-rk-yellow bg-yellow-50 p-4 text-sm text-gray-700 text-center print:hidden">
            🎵 Level 2 (Intervals) is coming soon! Keep practicing Level 1 to
            build your ear.
          </div>
        )}

        {/* Print-only worksheet */}
        <div className="hidden print:block mt-4">
          <h2 className="text-xl font-bold text-rk-green mb-2">
            Solfège Staircase Worksheet
          </h2>
          <p className="text-sm mb-4">
            Write the solfège syllable and note letter for each step of the
            scale.
          </p>
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr>
                <th className="border border-gray-400 px-3 py-1 text-left">
                  Step
                </th>
                <th className="border border-gray-400 px-3 py-1 text-left">
                  Solfège
                </th>
                <th className="border border-gray-400 px-3 py-1 text-left">
                  Note
                </th>
                <th className="border border-gray-400 px-3 py-1 text-left">
                  My Answer
                </th>
              </tr>
            </thead>
            <tbody>
              {STEPS.map((step, idx) => (
                <tr key={step.solfege}>
                  <td className="border border-gray-400 px-3 py-2">{idx + 1}</td>
                  <td className="border border-gray-400 px-3 py-2">
                    {step.solfege}
                  </td>
                  <td className="border border-gray-400 px-3 py-2">
                    {step.letter}
                  </td>
                  <td className="border border-gray-400 px-3 py-2 h-8"></td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="text-xs text-gray-400 mt-4">
            © {new Date().getFullYear()} Renaissance Kids, Inc. — Light up
            learning through the arts.
          </p>
        </div>

        {/* Screen footer */}
        <footer className="text-center text-xs text-gray-400 print:hidden">
          © {new Date().getFullYear()} Renaissance Kids, Inc. — Light up
          learning through the arts.
        </footer>
      </div>
    </main>
  );
}
