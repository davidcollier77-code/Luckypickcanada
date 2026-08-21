'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';

// Logical canvas size in CSS pixels — kept separate from the physical
// (devicePixelRatio-scaled) resolution so burst math never has to care
// about the display's pixel density.
const CANVAS_SIZE = 340;

const TIERS = {
  common: {
    name: 'Common',
    min: 0,
    max: 59,
    color: '#94A3B8',
    glow: 'rgba(148, 163, 184, 0.45)',
    sparks: 20,
    trickleRate: 0.12,
    flash: false,
  },
  lucky: {
    name: 'Lucky',
    min: 60,
    max: 84,
    color: '#10B981',
    glow: 'rgba(16, 185, 129, 0.55)',
    sparks: 45,
    trickleRate: 0.24,
    flash: false,
  },
  superLucky: {
    name: 'Super Lucky',
    min: 85,
    max: 100,
    color: '#F59E0B',
    glow: 'rgba(245, 158, 11, 0.8)',
    sparks: 75,
    trickleRate: 0.4,
    flash: true,
  },
};

function tierFor(score) {
  return (
    Object.values(TIERS).find((t) => score >= t.min && score <= t.max) ||
    TIERS.common
  );
}

export default function LuckyOrbReveal({ targetScore = 88, onComplete }) {
  const [phase, setPhase] = useState('idle'); // 'idle' | 'analyzing' | 'revealed' | 'settled'
  const [displayScore, setDisplayScore] = useState(0);
  const [flashActive, setFlashActive] = useState(false);
  const [announcement, setAnnouncement] = useState('');

  const canvasRef = useRef(null);
  const particlesRef = useRef([]);
  const animFrameRef = useRef(null);
  const timersRef = useRef([]); // [{ id, type: 'interval' | 'timeout' }]
  const isMountedRef = useRef(true);

  const reduceMotion =
    typeof window !== 'undefined' &&
    window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const activeTier = tierFor(targetScore);

  // ---------- lifecycle ----------
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      timersRef.current.forEach(({ id, type }) => {
        if (type === 'interval') clearInterval(id);
        else clearTimeout(id);
      });
      timersRef.current = [];
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  // Stores { id, type } so cleanup calls the correct clear function instead
  // of firing both clearInterval and clearTimeout on every tracked id.
  const track = (id, type) => {
    timersRef.current.push({ id, type });
    return id;
  };

  // ---------- canvas setup (centered + dpr-scaled, SSR-safe) ----------
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr =
      typeof window !== 'undefined'
        ? Math.min(window.devicePixelRatio || 1, 2)
        : 1;

    canvas.width = CANVAS_SIZE * dpr;
    canvas.height = CANVAS_SIZE * dpr;

    const ctx = canvas.getContext('2d');
    if (!ctx) return; // context can be null (e.g. headless/test environments)
    ctx.scale(dpr, dpr);

    const render = () => {
      ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

      for (let i = particlesRef.current.length - 1; i >= 0; i--) {
        const p = particlesRef.current[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += p.gravity;
        p.alpha -= p.decay;

        if (p.alpha <= 0) {
          particlesRef.current.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 8;
        // Optimization (⚡ Bolt): Use fillRect instead of arc for particles.
        // Rendering a tiny square is visually identical to a circle but much faster.
        // Size represents radius in the old code, so multiply by 2 for width/height.
        ctx.fillRect(p.x - p.size, p.y - p.size, p.size * 2, p.size * 2);
        ctx.restore();
      }

      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  // ---------- particles ----------
  const spawnBurst = useCallback(
    (tier, count, isTrickle = false) => {
      const cx = CANVAS_SIZE / 2;
      const cy = CANVAS_SIZE / 2;
      const n = reduceMotion ? Math.ceil(count * 0.3) : count;

      for (let i = 0; i < n; i++) {
        // Trickle: gentle upward drift (embers rising off the orb pre-reveal).
        // Burst: a frontal arc biased up/outward — the "sparks off the
        // front" moment, not an even radial scatter.
        const angle = isTrickle
          ? Math.random() * Math.PI + Math.PI // upper half-circle
          : Math.PI * 1.1 + Math.random() * Math.PI * 0.8; // up-left → up-right arc

        const speed = isTrickle
          ? Math.random() * 1.5 + 0.5
          : Math.random() * 7 + 3;

        particlesRef.current.push({
          x: cx + (Math.random() - 0.5) * 16,
          y: cy + (Math.random() - 0.5) * 16,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - (isTrickle ? 1 : 2.5),
          size: Math.random() * (isTrickle ? 2.5 : 4) + 1,
          color: tier.color,
          alpha: 1,
          decay: isTrickle ? 0.025 : 0.016,
          gravity: 0.08,
        });
      }
    },
    [reduceMotion]
  );

  // ---------- main sequence ----------
  const handleStartReveal = () => {
    if (phase !== 'idle') return;
    setPhase('analyzing');
    setDisplayScore(0);
    setAnnouncement('Reading the signs.');

    const startTime = performance.now();
    const duration = 4200;

    const interval = track(
      setInterval(() => {
        if (!isMountedRef.current) return;
        const elapsed = performance.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // Ease the flicker toward the true score instead of pure noise,
        // so the last tick or two visibly "lock in" rather than jump-cut.
        const noise = Math.floor(Math.random() * 99) + 1;
        const eased = Math.round(noise * (1 - progress) + targetScore * progress);
        setDisplayScore(Math.min(100, Math.max(0, eased)));

        if (Math.random() < activeTier.trickleRate) {
          spawnBurst(activeTier, 2, true);
        }

        if (progress >= 1) {
          clearInterval(interval);
          if (!isMountedRef.current) return;

          setDisplayScore(targetScore);
          setPhase('revealed');
          setAnnouncement(`${activeTier.name} — ${targetScore}% luck score.`);
          spawnBurst(activeTier, activeTier.sparks, false);

          if (activeTier.flash && !reduceMotion) {
            setFlashActive(true);
            track(
              setTimeout(() => {
                if (isMountedRef.current) setFlashActive(false);
              }, 300),
              'timeout'
            );
          }

          track(
            setTimeout(() => {
              if (!isMountedRef.current) return;
              setPhase('settled');
              if (onComplete) onComplete(targetScore, activeTier);
            }, 5500),
            'timeout'
          );
        }
      }, 60),
      'interval'
    );
  };

  return (
    <div className="relative flex flex-col items-center justify-center min-h-[420px] w-full select-none overflow-hidden p-6">
      {/* Screen-reader announcement, not visually rendered */}
      <span className="sr-only" role="status" aria-live="polite">
        {announcement}
      </span>

      {/* Ambient background pulse for flash-tier reveals — single smooth
          fade, not a strobe, and skipped entirely under reduced motion. */}
      <div
        className={`pointer-events-none absolute inset-0 transition-opacity duration-300 ${
          flashActive ? 'opacity-25' : 'opacity-0'
        }`}
        style={{ backgroundColor: activeTier.color }}
      />

      <canvas
        ref={canvasRef}
        className="pointer-events-none absolute z-20 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
        style={{ width: CANVAS_SIZE, height: CANVAS_SIZE }}
      />

      {/* Main Interactive Orb — a real button: keyboard-focusable,
          announced correctly, disabled while a reveal is in progress. */}
      <button
        type="button"
        onClick={handleStartReveal}
        disabled={phase !== 'idle'}
        aria-label={
          phase === 'idle'
            ? 'Reveal your daily luck'
            : 'Reading your daily luck'
        }
        className="appearance-none bg-transparent p-0 relative z-10 flex h-48 w-48 cursor-pointer disabled:cursor-default items-center justify-center rounded-full transition-all duration-700 active:scale-95"
        style={{
          boxShadow:
            phase === 'idle'
              ? '0 0 20px rgba(255,255,255,0.08)'
              : `0 0 40px ${activeTier.glow}, inset 0 0 20px ${activeTier.glow}`,
          border: `2px solid ${
            phase === 'idle' ? 'rgba(255,255,255,0.2)' : activeTier.color
          }`,
        }}
      >
        <div className="flex flex-col items-center text-center">
          {phase === 'idle' && (
            <span className="text-sm font-semibold tracking-wider text-slate-300 uppercase">
              Reveal Luck
            </span>
          )}
          {phase === 'analyzing' && (
            <>
              <span className="text-3xl font-extrabold text-white animate-pulse">
                {displayScore}%
              </span>
              <span className="text-xs text-slate-400 mt-1">Analyzing...</span>
            </>
          )}
          {(phase === 'revealed' || phase === 'settled') && (
            <>
              <span className="text-4xl font-black text-white drop-shadow-md">
                {displayScore}%
              </span>
              <span
                className="text-xs font-bold uppercase tracking-widest mt-1"
                style={{ color: activeTier.color }}
              >
                {activeTier.name}
              </span>
            </>
          )}
        </div>
      </button>
    </div>
  );
}
