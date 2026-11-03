'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { playConfettiPop, preloadConfettiPop } from './lib/audio';
import { MAPLE_LEAF_PATH, createMapleLeafShape, loadConfetti } from './lib/mapleLeafConfetti';

// The reveal celebrates with the homepage's Explore Your Luck moment: the same
// maple-leaf outline and gold palette, the same confetti pop, and the same
// main-thread canvas because the site's Content Security Policy blocks
// canvas-confetti's default Blob worker.
const GOLD_LEAF_COLORS = ['#FBBF24', '#F59E0B', '#D97706'];

// The confetti is bounded so no leaf can pile up behind the reveal container: at
// most MAX_ACTIVE_PARTICLES leaves exist at once, each leaf has a hard lifetime,
// and the scheduled waves finish inside a three-to-four second window.
const MAX_ACTIVE_PARTICLES = 96;
// 150 ticks is about 2.5 seconds at 60 fps, so the last wave's leaves expire
// before the celebration ends.
const PARTICLE_LIFETIME_TICKS = 150;
const WAVE_INTERVAL_MS = 500;
// Waves start at 0 ms, 500 ms and 1000 ms; the final leaves expire 2500 ms after
// that last wave, so the confetti itself lasts about 3.5 seconds.
const CONFETTI_WINDOW_MS = WAVE_INTERVAL_MS * 2 + (PARTICLE_LIFETIME_TICKS / 60) * 1000;
// The layer fades out in the last half second and unmounts on this timer, which
// leaves nothing behind the reveal container.
const CELEBRATION_TOTAL_MS = CONFETTI_WINDOW_MS + 700;
const CELEBRATION_FADE_MS = 500;

// Same shape as the shipped celebration — both edges burst inward, a slower pair
// follows, then a small centre wave — with fewer leaves per wave: 24 + 24 + 14 +
// 14 + 10 = 86, inside the 96-particle ceiling.
const CONFETTI_WAVES = [
  {
    delayMs: 0,
    particleCount: 24,
    angle: 62,
    spread: 46,
    startVelocity: 52,
    origin: { x: 0, y: 0.82 },
    drift: 0.35,
    decay: 0.915,
  },
  {
    delayMs: 0,
    particleCount: 24,
    angle: 118,
    spread: 46,
    startVelocity: 52,
    origin: { x: 1, y: 0.82 },
    drift: -0.35,
    decay: 0.915,
  },
  {
    delayMs: WAVE_INTERVAL_MS,
    particleCount: 14,
    angle: 70,
    spread: 82,
    startVelocity: 38,
    origin: { x: 0.02, y: 0.9 },
    scalar: 1.15,
    decay: 0.93,
  },
  {
    delayMs: WAVE_INTERVAL_MS,
    particleCount: 14,
    angle: 110,
    spread: 82,
    startVelocity: 38,
    origin: { x: 0.98, y: 0.9 },
    scalar: 1.15,
    decay: 0.93,
  },
  {
    delayMs: WAVE_INTERVAL_MS * 2,
    particleCount: 10,
    angle: 90,
    spread: 120,
    startVelocity: 30,
    origin: { x: 0.5, y: 1.02 },
    scalar: 1.05,
    decay: 0.94,
  },
];

// The pile of fallen leaves along the bottom edge is the same maple leaf drawn as
// inline SVG, so the finish stays vector and needs no extra raster asset. The
// leaves are stacked in three overlapping layers with irregular spacing, sizes
// and rotations so the finish reads as a small pile rather than a row.
const SETTLED_LEAVES = [
  // Back layer: larger, darker leaves that sit under everything else.
  { left: '8%', bottom: 34, size: 34, rotate: -34, color: '#D97706', opacity: 0.42, delay: 0, layer: 0 },
  { left: '23%', bottom: 37, size: 30, rotate: 24, color: '#B45309', opacity: 0.38, delay: 0.03, layer: 0 },
  { left: '41%', bottom: 39, size: 37, rotate: -14, color: '#D97706', opacity: 0.4, delay: 0.06, layer: 0 },
  { left: '62%', bottom: 35, size: 32, rotate: 30, color: '#B45309', opacity: 0.38, delay: 0.09, layer: 0 },
  { left: '84%', bottom: 33, size: 36, rotate: -24, color: '#D97706', opacity: 0.42, delay: 0.12, layer: 0 },
  // Middle layer: the bulk of the pile, tucked into the back leaves.
  { left: '3%', bottom: 17, size: 26, rotate: 18, color: '#F59E0B', opacity: 0.7, delay: 0.1, layer: 1 },
  { left: '15%', bottom: 14, size: 31, rotate: -28, color: '#FBBF24', opacity: 0.72, delay: 0.14, layer: 1 },
  { left: '31%', bottom: 19, size: 24, rotate: 40, color: '#F59E0B', opacity: 0.68, delay: 0.18, layer: 1 },
  { left: '48%', bottom: 15, size: 29, rotate: -20, color: '#FBBF24', opacity: 0.74, delay: 0.22, layer: 1 },
  { left: '67%', bottom: 18, size: 25, rotate: 34, color: '#F59E0B', opacity: 0.7, delay: 0.26, layer: 1 },
  { left: '81%', bottom: 13, size: 30, rotate: -32, color: '#FBBF24', opacity: 0.72, delay: 0.3, layer: 1 },
  { left: '94%', bottom: 19, size: 23, rotate: 12, color: '#F59E0B', opacity: 0.66, delay: 0.34, layer: 1 },
  // Front layer: small, bright leaves resting on top of the pile.
  { left: '9%', bottom: 3, size: 21, rotate: -8, color: '#FDE68A', opacity: 0.9, delay: 0.26, layer: 2 },
  { left: '27%', bottom: 1, size: 25, rotate: 26, color: '#FBBF24', opacity: 0.95, delay: 0.3, layer: 2 },
  { left: '44%', bottom: 5, size: 19, rotate: -42, color: '#FDE68A', opacity: 0.88, delay: 0.34, layer: 2 },
  { left: '60%', bottom: 1, size: 24, rotate: 10, color: '#FBBF24', opacity: 0.94, delay: 0.38, layer: 2 },
  { left: '77%', bottom: 6, size: 20, rotate: -16, color: '#FDE68A', opacity: 0.9, delay: 0.42, layer: 2 },
  { left: '90%', bottom: 2, size: 23, rotate: 32, color: '#FBBF24', opacity: 0.92, delay: 0.46, layer: 2 },
];

/**
 * Fires the golden maple-leaf celebration once the final reveal number has
 * settled: leaves burst inward from both sides of the reveal, drift and rotate
 * down, and a small glowing pile of the same leaves finishes the moment.
 *
 * The particles are capped, each leaf expires on its own lifetime, and the whole
 * layer is removed when the celebration ends, so nothing accumulates behind the
 * reveal container.
 *
 * Reduced-motion visitors get the static finish with no burst, sparkle, or sound.
 *
 * @param {{startDelayMs?: number}} props Delay from popup open to the final number settling.
 * @returns {JSX.Element|null} The celebration layers, or null before or after it runs.
 */
export default function LuckyRevealCelebration({ startDelayMs = 0 }) {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [isCelebrating, setIsCelebrating] = useState(false);
  const canvasRef = useRef(null);
  const confettiRef = useRef(null);
  const timersRef = useRef([]);
  // Tracks how many particles have been fired across all waves for this celebration.
  // Stored in a ref so it persists across React strict-mode double-invocations of
  // the wave-scheduling effect without resetting the budget mid-celebration.
  const firedParticlesRef = useRef(0);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handler = (event) => setPrefersReducedMotion(event.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  useEffect(() => {
    if (prefersReducedMotion) return undefined;

    // Prepare both the sound and the particle library before the last number
    // settles, so the celebration starts on the right frame instead of loading.
    preloadConfettiPop().catch((error) => {
      console.warn('Reveal confetti sound preload failed', error);
    });
    loadConfetti().catch(() => {});
    return undefined;
  }, [prefersReducedMotion]);

  const clearTimers = useCallback(() => {
    timersRef.current.forEach((timer) => window.clearTimeout(timer));
    timersRef.current = [];
  }, []);

  const releaseConfetti = useCallback(() => {
    confettiRef.current?.reset();
    confettiRef.current = null;
  }, []);

  const launch = useCallback(() => {
    setIsCelebrating(true);

    // Play in the same tick as the burst so the pop and the leaves start together.
    playConfettiPop().catch((error) => {
      console.warn('Reveal confetti pop playback failed', error);
    });
  }, []);

  // Create the particle instance against the canvas that is now inside the reveal
  // (so it cannot outlive or escape the reveal), then fire the scheduled waves
  // against a shared particle budget.
  useEffect(() => {
    if (!isCelebrating || prefersReducedMotion) return undefined;

    // Reset the budget for this celebration run. Using a ref (not a local `let`) so
    // a React strict-mode double-invoke of this effect cannot restart it at 0 and
    // bypass MAX_ACTIVE_PARTICLES mid-celebration.
    firedParticlesRef.current = 0;

    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    let isActive = true;

    loadConfetti()
      .then((confettiLib) => {
        if (!isActive || !canvasRef.current) return;

        const confetti =
          confettiRef.current ?? confettiLib.create(canvas, { resize: true, useWorker: false });
        confettiRef.current = confetti;

        const leafShape = createMapleLeafShape(confettiLib);
        const defaults = {
          colors: GOLD_LEAF_COLORS,
          shapes: leafShape ? [leafShape] : ['circle'],
          zIndex: 100,
          // A hard per-leaf lifetime: particles are deleted from the simulation
          // once these ticks expire, so none can linger on or behind the reveal.
          ticks: PARTICLE_LIFETIME_TICKS,
          gravity: 1.05,
          scalar: 1.5,
        };

        let firedParticles = 0;

        for (const { delayMs, ...wave } of CONFETTI_WAVES) {
          // delayMs is a compile-time constant (0, 500 or 1000 ms) — no untrusted data.
          timersRef.current.push(
            window.setTimeout(() => {
              const budget = MAX_ACTIVE_PARTICLES - firedParticlesRef.current;
              const particleCount = Math.min(wave.particleCount, budget);
              if (particleCount <= 0) return;
              firedParticlesRef.current += particleCount;
              confetti({ ...defaults, ...wave, particleCount });
            }, delayMs),
          );
        }
      })
      .catch((error) => console.warn('Reveal confetti effect unavailable', error));

    return () => {
      isActive = false;
    };
  }, [isCelebrating, prefersReducedMotion]);

  // End the celebration: drop the instance once the last leaf has expired, then
  // remove the layer so no leaf is left behind the reveal container.

  useEffect(() => {
    if (!isCelebrating || prefersReducedMotion) return undefined;
    // Guards against double-settle: both settleTimer and finishTimer call
    // releaseConfetti(); isReleased ensures it runs at most once per lifecycle.
    let isReleased = false;
    // CONFETTI_WINDOW_MS is a compile-time constant — no untrusted data.
    const settleTimer = window.setTimeout(() => {
      if (!isReleased) { isReleased = true; releaseConfetti(); }
    }, CONFETTI_WINDOW_MS);
    // CELEBRATION_TOTAL_MS is a compile-time constant — no untrusted data.
    const finishTimer = window.setTimeout(() => {
      if (!isReleased) { isReleased = true; releaseConfetti(); }
      setIsCelebrating(false);
    }, CELEBRATION_TOTAL_MS);
    timersRef.current.push(settleTimer, finishTimer);

    return () => {
      window.clearTimeout(settleTimer);
      window.clearTimeout(finishTimer);
    };
  }, [clearTimers, isCelebrating, prefersReducedMotion, releaseConfetti]);

  useEffect(() => {
    if (prefersReducedMotion) {
      // No motion and no sound: show the static finish instead.
      setIsCelebrating(true);
      return undefined;
    }

    const timer = window.setTimeout(launch, Math.max(0, startDelayMs));
    return () => window.clearTimeout(timer);
  }, [launch, prefersReducedMotion, startDelayMs]);

  useEffect(() => () => {
    // Release every scheduled wave and the particle instance with the component.
    clearTimers();
    releaseConfetti();
  }, [clearTimers, releaseConfetti]);

  if (!isCelebrating) return null;

  // Fade the finish out with the confetti window; reduced motion keeps the static
  // finish with no animation.
  const fadeStyle = prefersReducedMotion
    ? undefined
    : {
        animation: `lucky-celebration-out ${CELEBRATION_FADE_MS}ms ease-in ${CONFETTI_WINDOW_MS + 200}ms forwards`,
      };

  return (
    <>
      <div className="lucky-celebration" aria-hidden="true" style={fadeStyle}>
        <style>{`
        @keyframes lucky-celebration-flash {
          0% { opacity: 0; transform: translate(-50%, 0) scale(0.82); }
          22% { opacity: 1; }
          100% { opacity: 0; transform: translate(-50%, 0) scale(1.08); }
        }

        @keyframes lucky-celebration-finish-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes lucky-celebration-out {
          to { opacity: 0; }
        }

        @keyframes lucky-settled-leaf-in {
          from { opacity: 0; }
          to { opacity: var(--leaf-opacity, 0.9); }
        }

        .lucky-celebration {
          position: absolute;
          inset: 0;
          /* Behind the reveal panel (z-index 2): the finish is decorative and must
             never sit over numbers, copy, the share control, or the map button. */
          z-index: 1;
          pointer-events: none;
          overflow: hidden;
        }

        /* The falling leaves live above the panel (z-index 2) so they stay visible,
           but inside the reveal overlay and clipped to its animation area. */
        .lucky-celebration-particles {
          position: absolute;
          inset: 0;
          z-index: 3;
          pointer-events: none;
          overflow: hidden;
        }

        .lucky-celebration-particle-canvas {
          display: block;
          width: 100%;
          height: 100%;
        }

        .lucky-celebration-flash {
          position: absolute;
          left: 50%;
          bottom: -8%;
          width: min(74vw, 640px);
          aspect-ratio: 1;
          border-radius: 999px;
          background: radial-gradient(circle, rgba(255, 244, 190, 0.5) 0%, rgba(250, 204, 21, 0.26) 34%, rgba(245, 158, 11, 0) 70%);
          opacity: 0;
          animation: lucky-celebration-flash 1s ease-out forwards;
        }

        .lucky-celebration-finish {
          position: absolute;
          inset-inline: 0;
          bottom: 0;
          height: clamp(96px, 18vh, 168px);
          opacity: 0;
          animation: lucky-celebration-finish-in 0.9s ease-out 1s forwards;
        }

        .lucky-celebration-glow {
          position: absolute;
          inset: 0;
          background: radial-gradient(62% 130% at 50% 100%, rgba(250, 204, 21, 0.34) 0%, rgba(245, 158, 11, 0.14) 46%, rgba(245, 158, 11, 0) 80%);
        }

        .lucky-settled-leaf {
          position: absolute;
          opacity: 0;
          filter: drop-shadow(0 0 10px rgba(250, 204, 21, 0.45));
          animation: lucky-settled-leaf-in 0.8s ease-out forwards;
        }

        @media (prefers-reduced-motion: reduce) {
          .lucky-celebration-flash { display: none; }
          .lucky-celebration-finish {
            animation: none !important;
            opacity: 1;
          }
          .lucky-settled-leaf {
            animation: none !important;
            opacity: var(--leaf-opacity, 0.9);
          }
        }
      `}</style>

        <span className="lucky-celebration-flash" />

        <div className="lucky-celebration-finish">
          <span className="lucky-celebration-glow" />
          {SETTLED_LEAVES.map((leaf) => (
            <svg
              key={`${leaf.left}-${leaf.size}`}
              viewBox="-2015 -2000 4030 4030"
              className="lucky-settled-leaf"
              focusable="false"
              style={{
                left: leaf.left,
                bottom: leaf.bottom,
                width: leaf.size,
                height: leaf.size,
                zIndex: leaf.layer,
                color: leaf.color,
                transform: `translate(-50%, 0) rotate(${leaf.rotate}deg)`,
                '--leaf-opacity': leaf.opacity,
                animationDelay: `${leaf.delay}s`,
              }}
            >
              <path d={MAPLE_LEAF_PATH} fill="currentColor" />
            </svg>
          ))}
        </div>
      </div>

      {!prefersReducedMotion && (
        <div className="lucky-celebration-particles" aria-hidden="true">
          <canvas ref={canvasRef} className="lucky-celebration-particle-canvas" />
        </div>
      )}
    </>
  );
}

const CELEBRATION_CSS = `
  @keyframes lucky-celebration-flash {
    0% { opacity: 0; transform: translate(-50%, 0) scale(0.82); }
    22% { opacity: 1; }
    100% { opacity: 0; transform: translate(-50%, 0) scale(1.08); }
  }
  @keyframes lucky-celebration-finish-in {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  @keyframes lucky-settled-leaf-in {
    from { opacity: 0; }
    to { opacity: var(--leaf-opacity, 0.9); }
  }
  .lucky-celebration {
    position: absolute;
    inset: 0;
    z-index: 3;
    pointer-events: none;
    overflow: hidden;
  }
  .lucky-celebration-flash {
    position: absolute;
    left: 50%;
    bottom: -8%;
    width: min(74vw, 640px);
    aspect-ratio: 1;
    border-radius: 999px;
    background: radial-gradient(circle, rgba(255, 244, 190, 0.5) 0%, rgba(250, 204, 21, 0.26) 34%, rgba(245, 158, 11, 0) 70%);
    opacity: 0;
    animation: lucky-celebration-flash 1s ease-out forwards;
  }
  .lucky-celebration-finish {
    position: absolute;
    inset-inline: 0;
    bottom: 0;
    height: clamp(76px, 15vh, 140px);
    opacity: 0;
    animation: lucky-celebration-finish-in 0.9s ease-out 1s forwards;
  }
  .lucky-celebration-glow {
    position: absolute;
    inset: 0;
    background: radial-gradient(62% 130% at 50% 100%, rgba(250, 204, 21, 0.34) 0%, rgba(245, 158, 11, 0.14) 46%, rgba(245, 158, 11, 0) 80%);
  }
  .lucky-settled-leaf {
    position: absolute;
    opacity: 0;
    filter: drop-shadow(0 0 10px rgba(250, 204, 21, 0.45));
    animation: lucky-settled-leaf-in 0.8s ease-out forwards;
  }
  @media (prefers-reduced-motion: reduce) {
    .lucky-celebration-flash { display: none; }
    .lucky-celebration-finish { animation: none !important; opacity: 1; }
    .lucky-settled-leaf { animation: none !important; opacity: var(--leaf-opacity, 0.9); }
  }
`;

/** Injects celebration CSS into <head> once on mount and removes it on unmount. */
function CelebrationStyles() {
  useEffect(() => {
    const el = document.createElement('style');
    el.setAttribute('data-lucky-celebration', '');
    el.textContent = CELEBRATION_CSS;
    document.head.appendChild(el);
    return () => {
      el.remove();
    };
  }, []);
  return null;
}
