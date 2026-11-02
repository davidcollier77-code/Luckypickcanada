'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { playConfettiPop, preloadConfettiPop } from './lib/audio';
import { MAPLE_LEAF_PATH, createMapleLeafShape, loadConfetti } from './lib/mapleLeafConfetti';

// The reveal celebrates with the homepage's Explore Your Luck moment: the same
// maple-leaf outline and gold palette, the same confetti pop, and the same
// main-thread canvas because the site's Content Security Policy blocks
// canvas-confetti's default Blob worker.
const GOLD_LEAF_COLORS = ['#FBBF24', '#F59E0B', '#D97706'];

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
 * settled: leaves burst inward from both sides of the screen, drift and rotate
 * down, and a small glowing pile of the same leaves finishes the moment.
 *
 * Reduced-motion visitors get the static finish with no burst, sparkle, or sound.
 *
 * @param {{startDelayMs?: number}} props Delay from popup open to the final number settling.
 * @returns {JSX.Element|null} The celebration layer, or null before it starts.
 */
export default function LuckyRevealCelebration({ startDelayMs = 0 }) {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [isCelebrating, setIsCelebrating] = useState(false);
  const canvasRef = useRef(null);
  const confettiRef = useRef(null);

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

  const launch = useCallback(() => {
    setIsCelebrating(true);

    // Play in the same tick as the burst so the pop and the leaves start together.
    playConfettiPop().catch((error) => {
      console.warn('Reveal confetti pop playback failed', error);
    });

    loadConfetti()
      .then((confettiLib) => {
        if (canvasRef.current) return;

        const canvas = document.createElement('canvas');
        Object.assign(canvas.style, {
          position: 'fixed',
          top: '0',
          left: '0',
          width: '100vw',
          height: '100vh',
          pointerEvents: 'none',
          zIndex: '100',
        });
        document.body.appendChild(canvas);
        canvasRef.current = canvas;

        const confetti = confettiLib.create(canvas, { resize: true, useWorker: false });
        confettiRef.current = confetti;

        const leafShape = createMapleLeafShape(confettiLib);
        const defaults = {
          colors: GOLD_LEAF_COLORS,
          shapes: leafShape ? [leafShape] : ['circle'],
          zIndex: 100,
          // 160 ticks is about 2.7 seconds at 60fps, inside the requested
          // two-to-three second celebration window.
          ticks: 160,
          gravity: 1.05,
          scalar: 1.5,
        };

        const fire = (options) => confetti({ ...defaults, ...options });

        // Both edges fire inward and upward, then the slower follow-up waves drift
        // the leaves toward the middle as they fall to the bottom of the reveal.
        fire({
          particleCount: 34,
          angle: 62,
          spread: 46,
          startVelocity: 52,
          origin: { x: 0, y: 0.82 },
          drift: 0.35,
          decay: 0.915,
        });
        fire({
          particleCount: 34,
          angle: 118,
          spread: 46,
          startVelocity: 52,
          origin: { x: 1, y: 0.82 },
          drift: -0.35,
          decay: 0.915,
        });
        fire({
          particleCount: 16,
          angle: 70,
          spread: 82,
          startVelocity: 38,
          origin: { x: 0.02, y: 0.9 },
          scalar: 1.15,
          decay: 0.93,
        });
        fire({
          particleCount: 16,
          angle: 110,
          spread: 82,
          startVelocity: 38,
          origin: { x: 0.98, y: 0.9 },
          scalar: 1.15,
          decay: 0.93,
        });
        fire({
          particleCount: 12,
          angle: 90,
          spread: 120,
          startVelocity: 30,
          origin: { x: 0.5, y: 1.02 },
          scalar: 1.05,
          decay: 0.94,
        });
      })
      .catch((error) => console.warn('Reveal confetti effect unavailable', error));
  }, []);

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
    confettiRef.current?.reset();
    canvasRef.current?.remove();
    confettiRef.current = null;
    canvasRef.current = null;
  }, []);

  if (!isCelebrating) return null;

  return (
    <div className="lucky-celebration" aria-hidden="true">
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
