'use client';

/**
 * LuckyGenerator
 * ----------------------------------------------------------------------
 * A once-a-day "Daily Resonance Ritual" generator for Lucky Pick Canada.
 *
 * Design concept: instead of a mechanical dial or gauge, the night sky
 * itself IS the meter. Five aurora "ribbons" (one per score tier) live
 * behind a glass ritual card. At rest, a single dim ember thread breathes.
 * On activation, all five flicker and surge through each other like the
 * sky is searching for an answer. When the score locks, every ribbon but
 * the winning tier fades to black, leaving one steady aurora glow that
 * matches the result.
 *
 * Performance contract:
 * - Every animation touches ONLY `opacity` and `transform` (GPU compositor
 *   layers). Nothing animates width/height/margin/top/left/filter/gradient.
 * - Blur and gradients are static per-element, never animated.
 * - The DOM stays light: 5 ribbons + 1 starfield layer + 3 flares total.
 * - `prefers-reduced-motion` disables every looping/flicker animation.
 *
 * Requirements:
 * - Next.js 13.4+ (App Router), React 18+
 * - Tailwind CSS v3+ (arbitrary value syntax, no config changes needed)
 *
 * Usage:
 *   import LuckyGenerator from '@/components/LuckyGenerator';
 *   export default function Page() { return <LuckyGenerator />; }
 * ----------------------------------------------------------------------
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { Cinzel, Manrope, JetBrains_Mono } from 'next/font/google';

const cinzel = Cinzel({
  subsets: ['latin'],
  weight: ['600', '700'],
  variable: '--font-lg-display',
});
const manrope = Manrope({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-lg-body',
});
const jbMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['500', '600'],
  variable: '--font-lg-mono',
});

// ---------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------

const STORAGE_KEY = 'lucky-pick-canada:daily-resonance:v1';
const REVEAL_DURATION_MS = 10000; // full awakening sequence before lock-in
const CLOCK_REVEAL_DELAY_MS = 650; // countdown fades in after score locks

type TierId = 'dormant' | 'kindling' | 'rising' | 'northern' | 'peak';
type Phase = 'loading' | 'ready' | 'revealing' | 'locked';

interface Tier {
  id: TierId;
  label: string;
  range: [number, number];
  glow: string; // used for text glow / accent color
  copy: string;
}

const TIERS: Tier[] = [
  {
    id: 'dormant',
    label: 'Dormant Void',
    range: [0, 20],
    glow: '#8291BE',
    copy: "The current sleeps tonight. Rest, and return with the dawn.",
  },
  {
    id: 'kindling',
    label: 'Kindling Spark',
    range: [21, 40],
    glow: '#3DFFB0',
    copy: 'A thread of light stirs. Something small is beginning.',
  },
  {
    id: 'rising',
    label: 'Rising Current',
    range: [41, 60],
    glow: '#38E0FF',
    copy: 'The current runs strong and true. Momentum is yours.',
  },
  {
    id: 'northern',
    label: 'Northern Resonance',
    range: [61, 80],
    glow: '#B48CFF',
    copy: 'The sky bends toward you. Rare resonance, well earned.',
  },
  {
    id: 'peak',
    label: 'Peak Radiance',
    range: [81, 100],
    glow: '#FFD66B',
    copy: 'Full radiance. The rarest pull the aurora can offer.',
  },
];

const RIBBON_ORDER: TierId[] = ['dormant', 'kindling', 'rising', 'northern', 'peak'];
const TIER_INTENSITY: Record<TierId, number> = {
  dormant: 0.22,
  kindling: 0.5,
  rising: 0.62,
  northern: 0.78,
  peak: 0.95,
};

function tierForScore(score: number): Tier {
  return TIERS.find((t) => score >= t.range[0] && score <= t.range[1]) ?? TIERS[0];
}

function pad(n: number): string {
  return n.toString().padStart(2, '0');
}

function msUntilLocalMidnight(from: Date = new Date()): number {
  const next = new Date(from.getFullYear(), from.getMonth(), from.getDate() + 1, 0, 0, 0, 0);
  return next.getTime() - from.getTime();
}

function localDateKey(d: Date = new Date()): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

interface StoredResult {
  score: number;
  tierId: TierId;
  dateKey: string;
}

// ---------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------




function FlickerScore({ phase }: { phase: Phase }) {
  const [flickerScore, setFlickerScore] = useState(0);
  useEffect(() => {
    if (phase !== 'revealing') return;

    // Set immediate first value to remove visual lag
    setFlickerScore(Math.floor(Math.random() * 101));

    const id = setInterval(() => {
      setFlickerScore(Math.floor(Math.random() * 101));
    }, 110);
    return () => clearInterval(id);
  }, [phase]);
  return <>{flickerScore}</>;
}
function CountdownClock({ onMidnight, phase }: { onMidnight: () => void, phase: Phase }) {
  const [remainingMs, setRemainingMs] = useState(() => msUntilLocalMidnight());

  useEffect(() => {
    if (phase !== 'locked') return;
    setRemainingMs(msUntilLocalMidnight()); // Update immediately upon entering locked phase
    const id = setInterval(() => {
      const ms = msUntilLocalMidnight();
      setRemainingMs(ms);
      if (ms <= 1000) {
        onMidnight();
      }
    }, 1000);
    return () => clearInterval(id);
  }, [onMidnight, phase]);

  const clock = useMemo(() => {
    const total = Math.max(0, Math.floor(remainingMs / 1000));
    return {
      h: pad(Math.floor(total / 3600)),
      m: pad(Math.floor((total % 3600) / 60)),
      s: pad(total % 60),
    };
  }, [remainingMs]);

  return (
    <>
      <span>{clock.h}</span>
      <span className="lg-clock-colon text-white/40">:</span>
      <span>{clock.m}</span>
      <span className="lg-clock-colon text-white/40">:</span>
      <span>{clock.s}</span>
    </>
  );
}

export default function LuckyGenerator() {
  const [phase, setPhase] = useState<Phase>('loading');
  const [score, setScore] = useState<number | null>(null);
  const [showClock, setShowClock] = useState(false);
  const [isSharing, setIsSharing] = useState(false);

  const cardRef = useRef<HTMLDivElement>(null);
  const revealTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clockDelayRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasActivatedRef = useRef(false); // guards against rapid double-click races

  const tier = score !== null ? tierForScore(score) : null;

  // Hydrate from localStorage on mount (client-only, avoids SSR mismatch)
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const stored = JSON.parse(raw) as StoredResult;
        if (stored && stored.dateKey === localDateKey() && typeof stored.score === 'number' && stored.score >= 0 && stored.score <= 100) {
          setScore(stored.score);
          setPhase('locked');
          setShowClock(true);
          return;
        }
        window.localStorage.removeItem(STORAGE_KEY);
      }
    } catch {
      // localStorage unavailable (private mode / disabled) — degrade to a fresh session
    }
    setPhase('ready');
  }, []);

  // Countdown ticker — resets state at midnight
  const handleMidnight = useCallback(() => {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* noop */
    }
    hasActivatedRef.current = false;
    setPhase('ready');
    setScore(null);
    setShowClock(false);
  }, []);

  // Haptic feedback pulse
  useEffect(() => {
    if (phase !== 'revealing') return;
    const hapticId = setInterval(() => {
      if (typeof window !== 'undefined' && 'vibrate' in navigator) {
        try {
          navigator.vibrate(30);
        } catch {}
      }
    }, 600);

    return () => {
      clearInterval(hapticId);
    };
  }, [phase]);

  // Cleanup any pending timeouts on unmount
  useEffect(
    () => () => {
      if (revealTimeoutRef.current) clearTimeout(revealTimeoutRef.current);
      if (clockDelayRef.current) clearTimeout(clockDelayRef.current);
    },
    []
  );

  const handleShare = useCallback(async () => {
    if (!cardRef.current || !tier || score === null) return;

    try {
      setIsSharing(true);

      const style = document.createElement('style');
      // Inject temporary styles to freeze animations for a crisp snapshot
      style.innerHTML = '.lg-root * { animation: none !important; transition: none !important; }';
      document.head.appendChild(style);

      // Wait a tick for styles to apply and UI to hide the share button
      await new Promise(resolve => setTimeout(resolve, 50));

      let canvas;
      try {
        const html2canvas = (await import('html2canvas')).default;
        canvas = await html2canvas(cardRef.current, {
          backgroundColor: null,
          scale: 2,
          logging: false,
          useCORS: true,
        });
      } finally {
        if (document.head.contains(style)) {
          document.head.removeChild(style);
        }
      }
      if (!canvas) {
        console.error('Failed to generate canvas');
        return;
      }

      canvas.toBlob(async (blob) => {
        if (!blob) return;

        const file = new File([blob], 'lucky-resonance.png', { type: 'image/png' });
        const text = `The sky answered. I pulled a ${score}% on Lucky Pick Canada today! ✨`;

        try {
          await navigator.share({
            title: 'Lucky Pick Canada',
            text: text,
            files: [file],
          });
        } catch (err) {
          try {
            await navigator.clipboard.writeText(text);
          } catch (clipboardErr) {
            console.error('Clipboard failed', clipboardErr);
          }

          try {
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = 'lucky-resonance.png';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
          } catch (downloadErr) {
            console.error('Download failed', downloadErr);
          }
          alert('Score copied to clipboard and image downloaded!');
        }
      }, 'image/png');
    } catch (err) {
      console.error('Error sharing:', err);
    } finally {
      setIsSharing(false);
    }
  }, [score, tier]);

  const handleActivate = useCallback(() => {
    if (phase !== 'ready' || hasActivatedRef.current) return;
    hasActivatedRef.current = true;
    setPhase('revealing');
    setShowClock(false);

    const finalScore = Math.floor(Math.random() * 101);

    revealTimeoutRef.current = setTimeout(() => {
      setScore(finalScore);
      setPhase('locked');

      if (typeof window !== 'undefined' && 'vibrate' in navigator) {
        try {
          navigator.vibrate([200, 100, 200]);
        } catch {}
      }
      try {
        const record: StoredResult = {
          score: finalScore,
          tierId: tierForScore(finalScore).id,
          dateKey: localDateKey(),
        };
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(record));
      } catch {
        /* noop */
      }
      clockDelayRef.current = setTimeout(() => setShowClock(true), CLOCK_REVEAL_DELAY_MS);
    }, REVEAL_DURATION_MS);
  }, [phase]);

  // Explosive Sparkler Particles for top tiers (State C / locked)
  const sparklers = useMemo(() => {
    const randomValues = Array.from({ length: 48 }).map((_, i) => ({
      angle: 210 + Math.random() * 120, // Shoot upwards
      distance: 300 + Math.random() * 400, // wider burst radius
      delay: Math.random() * 0.3,
      duration: 0.8 + Math.random() * 0.6,
      size: Math.random() * 4 + 2,
      originX: 40 + Math.random() * 20, // random origin points
      originY: 45 + Math.random() * 20,
    }));
    
    return randomValues.map((v, i) => ({
      id: i,
      angle: v.angle,
      distance: v.distance,
      delay: `${v.delay}s`,
      duration: `${v.duration}s`,
      size: `${v.size}px`,
      left: `${v.originX}%`,
      top: `${v.originY}%`,
    }));
  }, []);

  // Ambient Stardust Particles
  const stardustParticles = useMemo(() => {
    return Array.from({ length: 8 }).map((_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      size: `${Math.random() * 3 + 2}px`,
      duration: `${Math.random() * 4 + 4}s`,
      delay: `${Math.random() * 4}s`,
      opacity: Math.random() * 0.4 + 0.3,
    }));
  }, []);

  return (
    <div
      ref={cardRef}
      className={`${cinzel.variable} ${manrope.variable} ${jbMono.variable} lg-root relative flex min-h-dvh w-full flex-col items-center justify-center overflow-hidden bg-[#05070d] px-4 py-10 sm:px-6`}
      style={{ fontFamily: 'var(--font-lg-body), ui-sans-serif, system-ui, sans-serif' }}
    >
      {/* Full-Screen "Heartbeat" (Make the Environment Breathe) */}
      <div className="lg-room-breathe pointer-events-none absolute inset-0 z-0 bg-gradient-to-t from-white/[0.02] to-transparent" aria-hidden="true" />

      {/* Ambient sky — the aurora IS the meter */}
      <div className="lg-sky pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="lg-stars absolute inset-0" />

        {RIBBON_ORDER.map((rt, i) => {
          const isActiveTier = tier?.id === rt;
          const targetOpacity =
            phase === 'ready'
              ? rt === 'dormant'
                ? 0.22
                : 0
              : phase === 'revealing'
              ? 0.7
              : isActiveTier
              ? TIER_INTENSITY[rt]
              : 0;
          const breathing = (phase === 'ready' && rt === 'dormant') || (phase === 'locked' && isActiveTier);
          const surging = phase === 'revealing';

          return (
            <div
              key={rt}
              className="lg-ribbon-wrap absolute inset-0"
              style={{ opacity: targetOpacity }}
            >
              <div
                data-ribbon={rt}
                className={`lg-ribbon absolute inset-[-20%] ${breathing ? 'lg-breathe' : ''} ${
                  surging ? 'lg-surge' : ''
                }`}
                style={surging ? { '--led-index': i } as React.CSSProperties : undefined}
              />
            </div>
          );
        })}

        <div className={`lg-flare lg-flare--1 ${phase === 'revealing' ? 'lg-flare--active' : ''}`} />
        <div className={`lg-flare lg-flare--2 ${phase === 'revealing' ? 'lg-flare--active' : ''}`} />
        <div className={`lg-flare lg-flare--3 ${phase === 'revealing' ? 'lg-flare--active' : ''}`} />
      </div>

      {/* Return to home */}
      {!isSharing && (
        <Link
        href="/"
        aria-label="Return to home"
        className="group absolute left-4 top-4 z-20 flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3.5 py-2 text-xs font-medium text-white/60 backdrop-blur-md transition-colors hover:border-white/20 hover:text-white/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#B48CFF] sm:left-6 sm:top-6"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M15 6l-6 6 6 6"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <span>Home</span>
        </Link>
      )}

      {/* Background Fireworks Layer */}
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden" aria-hidden="true">
        {phase === 'locked' && (tier?.id === 'northern' || tier?.id === 'peak') && sparklers.map((p) => (
          <div
            key={`sparkler-${p.id}`}
            className="lg-sparkler absolute rounded-full"
            style={{
              left: p.left,
              top: p.top,
              width: p.size,
              height: p.size,
              backgroundColor: tier?.glow || '#ffffff',
              boxShadow: `0 0 12px ${tier?.glow || '#ffffff'}`,
              animationDuration: p.duration,
              animationDelay: p.delay,
              '--tx': `${Math.cos((p.angle * Math.PI) / 180) * p.distance}px`,
              '--ty': `${Math.sin((p.angle * Math.PI) / 180) * p.distance}px`,
            } as React.CSSProperties}
          />
        ))}
        {stardustParticles.map((p) => (
          <div
            key={p.id}
            className="lg-stardust absolute bottom-0 rounded-full"
            style={{
              left: p.left,
              width: p.size,
              height: p.size,
              backgroundColor: tier?.glow || '#ffffff',
              boxShadow: `0 0 8px ${tier?.glow || '#ffffff'}`,
              animationDuration: p.duration,
              animationDelay: p.delay,
              '--max-opacity': p.opacity,
              filter: 'blur(1px)'
            } as React.CSSProperties}
          />
        ))}
      </div>

      {/* Ritual card */}
      <main className={`relative z-10 w-full max-w-md ${(phase === 'ready' || phase === 'locked') ? 'lg-breathe-card' : ''}`} aria-label="Daily Resonance Ritual interactive dashboard">
        <div className="relative overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.045] px-6 py-10 shadow-[0_0_90px_-25px_rgba(0,0,0,0.9)] backdrop-blur-xl sm:px-10 sm:py-12">
          <p
            className="relative z-10 mb-6 text-center text-[11px] font-semibold uppercase tracking-[0.28em] text-white/45"
            style={{ fontFamily: 'var(--font-lg-body)' }}
          >
            Daily Resonance Ritual
          </p>

          <div className="lg-stage-enter relative z-10 flex min-h-[260px] flex-col items-center justify-center text-center" key={phase}>
            {phase === 'loading' && <div aria-hidden="true" />}

            {phase === 'ready' && (
              <div className="flex flex-col items-center">
                <h1
                  className="max-w-xs text-2xl font-semibold leading-snug text-white/95 sm:text-3xl"
                  style={{ fontFamily: 'var(--font-lg-display)' }}
                >
                  Awaken Today&rsquo;s Resonance
                </h1>
                <p className="mt-3 max-w-[22rem] text-sm text-white/55">
                  One pull. Once a day. The sky remembers.
                </p>

                <button
                  type="button"
                  aria-label="Reveal my daily resonance energy level"
                  onClick={handleActivate}
                  className="lg-button group relative mt-9 inline-flex min-h-[52px] items-center justify-center rounded-full border border-white/15 bg-white/[0.06] px-8 text-sm font-semibold tracking-wide text-white transition-transform duration-200 ease-out hover:scale-[1.03] active:scale-[0.97] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#B48CFF]"
                >
                  <span className="lg-button-glow pointer-events-none absolute inset-0 rounded-full" aria-hidden="true" />
                  <span className="relative">Reveal My Resonance</span>
                </button>
              </div>
            )}

            {phase === 'revealing' && (
              <div className="flex flex-col items-center" role="status" aria-live="polite">
                <p
                  className="text-lg font-semibold text-white/90 sm:text-xl"
                  style={{ fontFamily: 'var(--font-lg-display)' }}
                >
                  The sky is answering&hellip;
                </p>
                <p
                  aria-hidden="true"
                  className="lg-flicker-number mt-6 text-6xl font-bold text-white/25 sm:text-7xl"
                  style={{ fontFamily: 'var(--font-lg-mono)' }}
                >
                  <FlickerScore phase={phase} />
                  <span className="text-2xl align-top">%</span>
                </p>
              </div>
            )}

            {phase === 'locked' && score !== null && tier && (
              <div className="flex flex-col items-center" role="status" aria-live="polite">
                <p
                  className="text-xs font-semibold uppercase tracking-[0.22em]"
                  style={{ color: tier.glow }}
                >
                  {tier.label}
                </p>

                <p className="lg-score-pop mt-3 flex items-start leading-none text-white" style={{ '--tier-glow-dim': `${tier.glow}55`, '--tier-glow-bright': `${tier.glow}aa` } as React.CSSProperties}>
                  <span
                    className="text-7xl font-bold sm:text-8xl animate-glow-pulse"
                    style={{ fontFamily: 'var(--font-lg-display)' }}
                  >
                    {score}
                  </span>
                  <span className="mt-2 text-2xl font-semibold text-white/70 sm:text-3xl">%</span>
                </p>

                <p className="mt-4 max-w-[22rem] text-sm text-white/60">{tier.copy}</p>

                <div
                  className={`mt-8 flex items-center gap-1.5 text-2xl font-semibold text-white/85 transition-all duration-700 ease-out sm:text-3xl ${
                    showClock ? 'opacity-100' : 'translate-y-1.5 opacity-0'
                  }`}
                  style={{ fontFamily: 'var(--font-lg-mono)', fontVariantNumeric: 'tabular-nums' }}
                >
<CountdownClock onMidnight={handleMidnight} phase={phase} />
                </div>
                <p
                  className={`mt-2 text-[11px] uppercase tracking-[0.2em] text-white/35 transition-all duration-700 ease-out ${
                    showClock ? 'opacity-100' : 'translate-y-1.5 opacity-0'
                  }`}
                >
                  until the sky renews
                </p>

                {/* Share Button */}
                {!isSharing && (
                  <button
                    type="button"
                    aria-label="Share your daily resonance result"
                    onClick={handleShare}
                    className={`mt-8 flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-5 py-2.5 text-xs font-semibold tracking-wide text-white transition-all duration-700 ease-out hover:bg-white/[0.1] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#B48CFF] ${
                      showClock ? 'opacity-100' : 'translate-y-1.5 opacity-0'
                    }`}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path>
                      <polyline points="16 6 12 2 8 6"></polyline>
                      <line x1="12" y1="2" x2="12" y2="15"></line>
                    </svg>
                    Share My Resonance
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Share Watermark */}
      {isSharing && (
        <div className="absolute bottom-6 z-50 text-sm font-medium tracking-widest text-white/40 uppercase" style={{ fontFamily: 'var(--font-lg-body)' }}>
          luckypickcanada.ca
        </div>
      )}

      <style jsx>{`

        .lg-room-breathe {
          animation: lgRoomBreathe 8s ease-in-out infinite;
        }
        @keyframes lgRoomBreathe {
          0%, 100% { opacity: 0.85; }
          50% { opacity: 1; }
        }

        .lg-breathe-card {
          animation: lgBreatheCard 6s ease-in-out infinite;
          will-change: transform;
        }
        @keyframes lgBreatheCard {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-4px);
          }
        }
        .lg-stars {
          background-image: radial-gradient(1.4px 1.4px at 8% 18%, rgba(255, 255, 255, 0.85), transparent 100%),
            radial-gradient(1.2px 1.2px at 22% 8%, rgba(255, 255, 255, 0.6), transparent 100%),
            radial-gradient(1.6px 1.6px at 35% 32%, rgba(255, 255, 255, 0.75), transparent 100%),
            radial-gradient(1.2px 1.2px at 48% 12%, rgba(255, 255, 255, 0.55), transparent 100%),
            radial-gradient(1.4px 1.4px at 62% 24%, rgba(255, 255, 255, 0.7), transparent 100%),
            radial-gradient(1.1px 1.1px at 75% 6%, rgba(255, 255, 255, 0.5), transparent 100%),
            radial-gradient(1.5px 1.5px at 85% 20%, rgba(255, 255, 255, 0.8), transparent 100%),
            radial-gradient(1.2px 1.2px at 92% 40%, rgba(255, 255, 255, 0.55), transparent 100%),
            radial-gradient(1.3px 1.3px at 15% 55%, rgba(255, 255, 255, 0.6), transparent 100%),
            radial-gradient(1.4px 1.4px at 30% 78%, rgba(255, 255, 255, 0.65), transparent 100%),
            radial-gradient(1.1px 1.1px at 55% 68%, rgba(255, 255, 255, 0.5), transparent 100%),
            radial-gradient(1.6px 1.6px at 70% 85%, rgba(255, 255, 255, 0.75), transparent 100%),
            radial-gradient(1.2px 1.2px at 88% 65%, rgba(255, 255, 255, 0.55), transparent 100%),
            radial-gradient(1.3px 1.3px at 95% 90%, rgba(255, 255, 255, 0.6), transparent 100%);
          background-repeat: no-repeat;
          opacity: 0.7;
          animation: lgTwinkle 9s ease-in-out infinite;
          will-change: opacity;
        }

        .lg-ribbon-wrap {
          transition: opacity 1s ease;
          will-change: opacity, transform;
          transform: translateZ(0);
        }

        .lg-ribbon {
          filter: blur(60px);
          will-change: opacity, transform;
          transform: translateZ(0);
        }
        @media (max-width: 640px) {
          .lg-ribbon {
            filter: blur(34px);
          }
        }

        .lg-ribbon[data-ribbon='dormant'] {
          background: radial-gradient(55% 45% at 30% 70%, #33447a 0%, transparent 72%);
        }
        .lg-ribbon[data-ribbon='kindling'] {
          background: linear-gradient(115deg, transparent 8%, #12594a 32%, #2edda0 52%, transparent 82%);
        }
        .lg-ribbon[data-ribbon='rising'] {
          background: linear-gradient(100deg, transparent 4%, #0e5a78 28%, #38e0ff 52%, #0e5a78 74%, transparent 96%);
        }
        .lg-ribbon[data-ribbon='northern'] {
          background: linear-gradient(125deg, transparent 0%, #3e1f73 28%, #b48cff 50%, #6f3fd1 72%, transparent 100%);
        }
        .lg-ribbon[data-ribbon='peak'] {
          background: linear-gradient(105deg, transparent 0%, #8a5a00 22%, #ffd66b 48%, #fff3d0 62%, #8a5a00 80%, transparent 100%);
        }

        .lg-breathe {
          animation: lgBreathe 7s ease-in-out infinite;
        }
        .lg-surge {
          animation: lgSurge 1.8s ease-in-out infinite;
          animation-delay: calc(var(--led-index) * 220ms);
        }

        .lg-flare {
          position: absolute;
          width: 130px;
          height: 130px;
          border-radius: 9999px;
          filter: blur(32px);
          opacity: 0;
          will-change: opacity, transform;
          transform: translateZ(0);
        }
        .lg-flare--1 {
          top: 10%;
          left: 10%;
          background: radial-gradient(circle, rgba(180, 140, 255, 0.9), transparent 70%);
        }
        .lg-flare--2 {
          bottom: 12%;
          right: 8%;
          background: radial-gradient(circle, rgba(56, 224, 255, 0.9), transparent 70%);
        }
        .lg-flare--3 {
          top: 55%;
          right: 22%;
          background: radial-gradient(circle, rgba(255, 214, 107, 0.9), transparent 70%);
        }
        .lg-flare--active.lg-flare--1 {
          animation: lgFlarePulse 1.4s ease-in-out infinite;
          animation-delay: 0ms;
        }
        .lg-flare--active.lg-flare--2 {
          animation: lgFlarePulse 1.4s ease-in-out infinite;
          animation-delay: 350ms;
        }
        .lg-flare--active.lg-flare--3 {
          animation: lgFlarePulse 1.4s ease-in-out infinite;
          animation-delay: 700ms;
        }

        .lg-button-glow {
          background: radial-gradient(circle, rgba(180, 140, 255, 0.55), transparent 70%);
          filter: blur(18px);
          animation: lgGlowBreathe 3.2s ease-in-out infinite;
          will-change: opacity, transform;
          transform: translateZ(0);
        }

        .lg-stage-enter {
          animation: lgFadeUp 0.6s cubic-bezier(0.2, 0.8, 0.2, 1) both;
        }
        .lg-score-pop {
          animation: lgPop 0.55s cubic-bezier(0.2, 0.8, 0.2, 1) both;
        }
        .lg-flicker-number {
          font-variant-numeric: tabular-nums;
        }
        .lg-clock-colon {
          animation: lgColonBlink 1.4s steps(1) infinite;
        }

        @keyframes lgTwinkle {
          0%,
          100% {
            opacity: 0.5;
          }
          50% {
            opacity: 0.8;
          }
        }
        @keyframes lgBreathe {
          0%,
          100% {
            opacity: 0.82;
            transform: translate3d(0, 0, 0) scale(1);
          }
          50% {
            opacity: 1;
            transform: translate3d(0, -1%, 0) scale(1.035);
          }
        }
        @keyframes lgSurge {
          0% {
            opacity: 0.15;
            transform: scale(0.98) rotate(0deg);
          }
          20% {
            opacity: 0.9;
            transform: scale(1.02) rotate(0.5deg);
          }
          40% {
            opacity: 0.3;
            transform: scale(0.99) rotate(-0.5deg);
          }
          60% {
            opacity: 1;
            transform: scale(1.04) rotate(0.3deg);
          }
          80% {
            opacity: 0.4;
            transform: scale(1) rotate(-0.2deg);
          }
          100% {
            opacity: 0.15;
            transform: scale(0.98) rotate(0deg);
          }
        }
        @keyframes lgFlarePulse {
          0%,
          100% {
            opacity: 0;
            transform: scale(0.6) translateZ(0);
          }
          50% {
            opacity: 0.85;
            transform: scale(1.15) translateZ(0);
          }
        }
        @keyframes lgGlowBreathe {
          0%,
          100% {
            opacity: 0.55;
            transform: scale(1) translateZ(0);
          }
          50% {
            opacity: 1;
            transform: scale(1.08) translateZ(0);
          }
        }
        @keyframes lgFadeUp {
          from {
            opacity: 0;
            transform: translate3d(0, 14px, 0);
          }
          to {
            opacity: 1;
            transform: translate3d(0, 0, 0);
          }
        }
        @keyframes lgPop {
          0% {
            opacity: 0;
            transform: translate3d(0, 10px, 0) scale(0.92);
          }
          60% {
            opacity: 1;
            transform: translate3d(0, -2px, 0) scale(1.04);
          }
          100% {
            opacity: 1;
            transform: translate3d(0, 0, 0) scale(1);
          }
        }
        @keyframes lgColonBlink {
          0%,
          100% {
            opacity: 1;
          }
          50% {
            opacity: 0.25;
          }
        }
        .lg-sparkler {
          animation: lgSparklerBurst cubic-bezier(0.1, 0.8, 0.2, 1) forwards;
          will-change: transform, opacity;
          transform: translate3d(-50%, -50%, 0) scale(0);
          opacity: 0;
        }
        @keyframes lgSparklerBurst {
          0% {
            transform: translate3d(-50%, -50%, 0) scale(0);
            opacity: 1;
          }
          100% {
            transform: translate3d(calc(-50% + var(--tx)), calc(-50% + var(--ty)), 0) scale(1);
            opacity: 0;
          }
        }
        .lg-stardust {
          animation: lgStardustDrift linear infinite;
          will-change: transform, opacity;
          transform: translateZ(0);
        }
        @keyframes lgStardustDrift {
          0% {
            transform: translateY(100vh);
            opacity: 0;
          }
          20% {
            opacity: var(--max-opacity, 0.8);
          }
          80% {
            opacity: var(--max-opacity, 0.8);
          }
          100% {
            transform: translateY(-100vh);
            opacity: 0;
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .lg-stardust {
            animation: none !important;
          }
        }


        @media (prefers-reduced-motion: reduce) {
          .lg-stars,
          .lg-breathe,
          .lg-surge,
          .lg-flare--active,
          .lg-button-glow,
          .lg-stage-enter,
          .lg-score-pop,
          .lg-clock-colon,
          .lg-sparkler {
            animation: none !important;
          }
          .lg-ribbon-wrap {
            transition-duration: 200ms !important;
          }
        }
      `}</style>
    </div>
  );
}
