'use client';

/**
 * LuckyGenerator.tsx
 * "Daily Resonance Ritual" — luckypickcanada.ca
 *
 * Pure digital entertainment / motivational novelty. No gambling affiliation,
 * no prizes. Deployed on Cloudflare Pages (Next.js + Tailwind).
 */

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  memo,
} from 'react';
import Link from 'next/link';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Phase = 'idle' | 'revealing' | 'locked';

interface StoredResonance {
  lastSpinDate: string;
  lastScore: number;
  lastQuoteIndex: number;
}

interface Tier {
  id: 1 | 2 | 3 | 4;
  name: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const STORAGE_KEY = 'luckyPickCanada:dailyResonance';

const REVEAL_DURATION_MS = 10000;

const QUOTES: string[] = [
  'Like the Northern Lights dancing across the sky, your luck is uniquely yours today.',
  'A shiny loonie in your pocket and a sky full of stars. Today is looking bright.',
  'Catch a falling maple leaf and let the good vibes flow. True North, true luck.',
  'From coast to coast, the cosmic current is flowing your way.',
  'Keep your stick on the ice and your eyes on the stars. The universe has your back.',
  'Deep as the Great Lakes and bright as the winter snow, your resonance is strong.',
  'Like an Inukshuk guiding the way, good fortune is pointing directly at you.',
  'No golden tickets needed here, just pure True North energy. Enjoy the ride!',
];

const TIER1_FALLBACK_COPY =
  'The stars are just realigning for you! Rest up and recharge—tomorrow brings a brand new spark of luck.';

function getTier(score: number): Tier {
  if (score < 25) return { id: 1, name: 'GENTLE AURORA' };
  if (score < 50) return { id: 2, name: 'METEOR SHOWER' };
  if (score < 75) return { id: 3, name: 'COSMIC LIGHTNING' };
  return { id: 4, name: 'GRAND FIREWORKS' };
}

// ---------------------------------------------------------------------------
// Helpers — dates, randomness, persistence
// ---------------------------------------------------------------------------

function getLocalDateKey(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function msUntilLocalMidnight(): number {
  const now = new Date();
  const midnight = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() + 1,
    0,
    0,
    0,
    0
  );
  return midnight.getTime() - now.getTime();
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function readStoredResonance(): StoredResonance | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredResonance;
    if (
      typeof parsed.lastSpinDate === 'string' &&
      typeof parsed.lastScore === 'number' &&
      typeof parsed.lastQuoteIndex === 'number'
    ) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

function writeStoredResonance(next: StoredResonance) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // localStorage unavailable (private mode, quota, etc.) — fail silently,
    // the ritual still works for this session.
  }
}

/** Generates today's score + quote, guaranteed to differ from yesterday's. */
function generateTodaysResonance(previous: StoredResonance | null): {
  score: number;
  quoteIndex: number;
} {
  let score = randomInt(0, 100);
  if (previous) {
    let attempts = 0;
    while (score === previous.lastScore && attempts < 100) {
      score = randomInt(0, 100);
      attempts++;
    }
  }

  let quoteIndex = randomInt(0, QUOTES.length - 1);
  if (previous && QUOTES.length > 1) {
    let attempts = 0;
    while (quoteIndex === previous.lastQuoteIndex && attempts < 100) {
      quoteIndex = randomInt(0, QUOTES.length - 1);
      attempts++;
    }
  }

  return { score, quoteIndex };
}

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

// ---------------------------------------------------------------------------
// CountdownTimer — isolated so its 1s ticks never re-render the parent
// ---------------------------------------------------------------------------

const CountdownTimer = memo(function CountdownTimer() {
  const [remainingMs, setRemainingMs] = useState<number>(() =>
    msUntilLocalMidnight()
  );

  useEffect(() => {
    const id = window.setInterval(() => {
      setRemainingMs(msUntilLocalMidnight());
    }, 1000);
    return () => window.clearInterval(id);
  }, []);

  const totalSeconds = Math.max(0, Math.floor(remainingMs / 1000));
  const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, '0');
  const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(
    2,
    '0'
  );
  const seconds = String(totalSeconds % 60).padStart(2, '0');

  return (
    <div className="flex flex-col items-center gap-1 select-none">
      <span className="text-[10px] uppercase tracking-[0.2em] text-white/40">
        Next resonance in
      </span>
      <span className="font-mono text-lg tabular-nums text-cyan-100/90 tracking-wider">
        {hours}:{minutes}:{seconds}
      </span>
    </div>
  );
});

// ---------------------------------------------------------------------------
// Canvas VFX engine
//
// A single full-viewport canvas rendered behind the card. Particle systems
// are cheap arrays of plain objects, updated with a delta-time step and
// drawn with additive ('lighter') blending for glow. The loop is paused on
// tab-hidden and scaled back under prefers-reduced-motion.
// ---------------------------------------------------------------------------

type EffectGroup = 'idle' | 1 | 2 | 3 | 4;

interface Mote {
  x: number;
  y: number;
  r: number;
  driftPhase: number;
  speed: number;
  hue: 'cyan' | 'purple';
}

interface Ember {
  x: number;
  y: number;
  r: number;
  vy: number;
  wobble: number;
  wobbleSpeed: number;
  life: number;
  maxLife: number;
}

interface Meteor {
  x: number;
  y: number;
  vx: number;
  vy: number;
  len: number;
  width: number;
  trail: { x: number; y: number }[];
  life: number;
}

interface Bolt {
  points: { x: number; y: number }[];
  branches: { x: number; y: number }[][];
  age: number;
  life: number;
}

interface Spark {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  age: number;
  life: number;
  size: number;
}

interface Rocket {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  trail: { x: number; y: number }[];
  exploded: boolean;
}

const FIREWORK_COLORS = [
  '255,80,80', // red
  '90,140,255', // blue
  '110,255,150', // green
  '200,110,255', // purple
  '255,205,90', // gold
];

function useResonanceCanvas(
  canvasRef: React.RefObject<HTMLCanvasElement>,
  effectGroup: EffectGroup
) {
  const stateRef = useRef({
    motes: [] as Mote[],
    embers: [] as Ember[],
    meteors: [] as Meteor[],
    bolts: [] as Bolt[],
    flash: 0,
    sparks: [] as Spark[],
    rockets: [] as Rocket[],
    nextMeteorAt: 0,
    nextBoltAt: 0,
    nextRocketBatchAt: 0,
    rocketsQueued: 0,
    elapsed: 0,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const reduced = prefersReducedMotion();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    let width = 0;
    let height = 0;

    function resize() {
      const c = canvasRef.current;
      if (!c) return;
      width = window.innerWidth;
      height = window.innerHeight;
      c.width = width * dpr;
      c.height = height * dpr;
      c.style.width = `${width}px`;
      c.style.height = `${height}px`;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();
    window.addEventListener('resize', resize);

    const s = stateRef.current;

    // Seed ambient motes once — they persist across every phase.
    if (s.motes.length === 0) {
      const count = reduced ? 14 : 34;
      for (let i = 0; i < count; i++) {
        s.motes.push({
          x: Math.random() * window.innerWidth,
          y: Math.random() * window.innerHeight,
          r: 0.6 + Math.random() * 1.6,
          driftPhase: Math.random() * Math.PI * 2,
          speed: 0.15 + Math.random() * 0.25,
          hue: Math.random() > 0.5 ? 'cyan' : 'purple',
        });
      }
    }

    function spawnEmber() {
      s.embers.push({
        x: Math.random() * width,
        y: height + 10,
        r: 1.2 + Math.random() * 2.2,
        vy: -(18 + Math.random() * 22),
        wobble: Math.random() * Math.PI * 2,
        wobbleSpeed: 0.6 + Math.random() * 0.8,
        life: 0,
        maxLife: 5 + Math.random() * 3,
      });
    }

    function spawnMeteor() {
      const startX = Math.random() * width * 0.6 + width * 0.2;
      const speed = reduced ? 260 : 420 + Math.random() * 220;
      const angle = (55 + Math.random() * 10) * (Math.PI / 180);
      s.meteors.push({
        x: startX,
        y: -20,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        len: 70 + Math.random() * 60,
        width: 1.6 + Math.random() * 1.4,
        trail: [],
        life: 0,
      });
    }

    function spawnBolt() {
      const startX = width * (0.15 + Math.random() * 0.7);
      const endX = startX + (Math.random() - 0.5) * width * 0.3;
      const points: { x: number; y: number }[] = [];
      const segments = 9;
      for (let i = 0; i <= segments; i++) {
        const t = i / segments;
        const baseX = startX + (endX - startX) * t;
        const jitter = (1 - t * 0.4) * (Math.random() - 0.5) * 46;
        points.push({ x: baseX + jitter, y: height * 0.55 * t });
      }
      const branches: { x: number; y: number }[][] = [];
      const branchCount = randomInt(1, 3);
      for (let b = 0; b < branchCount; b++) {
        const originIdx = randomInt(2, segments - 2);
        const origin = points[originIdx];
        const branch: { x: number; y: number }[] = [origin];
        let bx = origin.x;
        let by = origin.y;
        const branchSegs = randomInt(3, 5);
        for (let i = 0; i < branchSegs; i++) {
          bx += (Math.random() - 0.3) * 40;
          by += (height * 0.2) / branchSegs;
          branch.push({ x: bx, y: by });
        }
        branches.push(branch);
      }
      s.bolts.push({ points, branches, age: 0, life: 0.22 + Math.random() * 0.12 });
      s.flash = 0.35;
    }

    function spawnRocket() {
      const color = FIREWORK_COLORS[randomInt(0, FIREWORK_COLORS.length - 1)];
      const x = width * (0.2 + Math.random() * 0.6);
      s.rockets.push({
        x,
        y: height,
        vx: (Math.random() - 0.5) * 30,
        vy: -(420 + Math.random() * 110),
        color,
        trail: [],
        exploded: false,
      });
    }

    function explode(x: number, y: number, color: string) {
      const count = reduced ? 36 : 100; // Multi-colored 3D bursts count
      for (let i = 0; i < count; i++) {
        // Spherical distribution projected to 2D for a pseudo-3D bouquet.
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(Math.random() * 2 - 1);
        const speed = 90 + Math.random() * 170;
        const depth = Math.sin(phi); // 0..1, used to scale for "3D" falloff
        s.sparks.push({
          x,
          y,
          vx: Math.cos(theta) * depth * speed,
          vy: Math.sin(theta) * depth * speed * 0.85 + Math.cos(phi) * 40,
          color,
          age: 0,
          life: 0.9 + Math.random() * 0.6,
          size: 1.6 + depth * 2.2, // Enhanced spark size for 3D bursts
        });
      }
    }

    let raf = 0;
    let last = performance.now();
    let hidden = false;

    function onVisibility() {
      hidden = document.hidden;
      if (!hidden) last = performance.now();
    }
    document.addEventListener('visibilitychange', onVisibility);

    function drawMotes(dt: number) {
      ctx!.globalCompositeOperation = 'lighter';
      for (const m of s.motes) {
        m.driftPhase += dt * m.speed;
        m.y -= dt * 4;
        if (m.y < -10) m.y = height + 10;
        const x = m.x + Math.sin(m.driftPhase) * 14;
        const glow = ctx!.createRadialGradient(x, m.y, 0, x, m.y, m.r * 6);
        const color =
          m.hue === 'cyan' ? '120,220,255' : '170,120,255';
        glow.addColorStop(0, `rgba(${color},0.55)`);
        glow.addColorStop(1, `rgba(${color},0)`);
        ctx!.fillStyle = glow;
        ctx!.beginPath();
        ctx!.arc(x, m.y, m.r * 6, 0, Math.PI * 2);
        ctx!.fill();
      }
    }

    function drawAurora(t: number, dt: number) {
      ctx!.globalCompositeOperation = 'lighter';
      const bands = 3;
      for (let b = 0; b < bands; b++) {
        const freq = 0.0016 + b * 0.0006;
        const amp = 70 + b * 30; // Enhanced gentle wave amplitude
        const yBase = height * (0.28 + b * 0.14);
        const grad = ctx!.createLinearGradient(0, 0, width, 0);
        const hue = b % 2 === 0 ? '110,230,210' : '170,140,255';
        grad.addColorStop(0, `rgba(${hue},0)`);
        grad.addColorStop(0.5, `rgba(${hue},0.16)`);
        grad.addColorStop(1, `rgba(${hue},0)`);
        ctx!.strokeStyle = grad;
        ctx!.lineWidth = 32 + b * 12; // Enhanced gentle aurora width
        ctx!.beginPath();
        for (let x = 0; x <= width; x += 12) {
          const y =
            yBase +
            Math.sin(x * freq + t * 0.6 + b * 2) * amp +
            Math.sin(x * freq * 2.3 - t * 0.3) * amp * 0.3;
          if (x === 0) ctx!.moveTo(x, y);
          else ctx!.lineTo(x, y);
        }
        ctx!.stroke();
      }

      // Embers
      if (Math.random() < dt * 1.4) spawnEmber();
      for (let i = s.embers.length - 1; i >= 0; i--) {
        const e = s.embers[i];
        e.life += dt;
        e.y += e.vy * dt;
        e.wobble += e.wobbleSpeed * dt;
        const x = e.x + Math.sin(e.wobble) * 10;
        const alpha = Math.max(0, 1 - e.life / e.maxLife) * 0.7;
        const glow = ctx!.createRadialGradient(x, e.y, 0, x, e.y, e.r * 5);
        glow.addColorStop(0, `rgba(255,220,170,${alpha})`);
        glow.addColorStop(1, 'rgba(255,220,170,0)');
        ctx!.fillStyle = glow;
        ctx!.beginPath();
        ctx!.arc(x, e.y, e.r * 5, 0, Math.PI * 2);
        ctx!.fill();
        if (e.life > e.maxLife) s.embers.splice(i, 1);
      }
    }

    function drawMeteors(t: number, dt: number) {
      if (t > s.nextMeteorAt) {
        spawnMeteor();
        s.nextMeteorAt = t + (reduced ? 0.5 : 0.14 + Math.random() * 0.16);
      }
      ctx!.globalCompositeOperation = 'lighter';
      for (let i = s.meteors.length - 1; i >= 0; i--) {
        const m = s.meteors[i];
        m.life += dt;
        m.x += m.vx * dt;
        m.y += m.vy * dt;
        m.trail.push({ x: m.x, y: m.y });
        if (m.trail.length > 14) m.trail.shift();

        // Tail — fading gradient line built from the trail.
        for (let j = 1; j < m.trail.length; j++) {
          const a = m.trail[j - 1];
          const bpt = m.trail[j];
          const alpha = (j / m.trail.length) * 0.5;
          ctx!.strokeStyle = `rgba(180,210,255,${alpha})`;
          ctx!.lineWidth = m.width * (j / m.trail.length) * 1.4; // Crisp glowing trails
          ctx!.beginPath();
          ctx!.moveTo(a.x, a.y);
          ctx!.lineTo(bpt.x, bpt.y);
          ctx!.stroke();
        }

        // Bright head
        const glow = ctx!.createRadialGradient(m.x, m.y, 0, m.x, m.y, 11);
        glow.addColorStop(0, 'rgba(255,255,255,0.95)');
        glow.addColorStop(0.4, 'rgba(190,220,255,0.6)');
        glow.addColorStop(1, 'rgba(190,220,255,0)');
        ctx!.fillStyle = glow;
        ctx!.beginPath();
        ctx!.arc(m.x, m.y, 11, 0, Math.PI * 2); // Enhanced meteor head
        ctx!.fill();

        if (m.y > height + 40 || m.x < -60 || m.x > width + 60) {
          s.meteors.splice(i, 1);
        }
      }
    }

    function drawLightning(t: number, dt: number) {
      if (t > s.nextBoltAt) {
        spawnBolt();
        s.nextBoltAt = t + (reduced ? 1.4 : 0.6 + Math.random() * 0.7);
      }

      // Atmospheric flash
      if (s.flash > 0) {
        ctx!.globalCompositeOperation = 'lighter';
        ctx!.fillStyle = `rgba(190,170,255,${s.flash * 0.32})`; // Atmospheric flashes
        ctx!.fillRect(0, 0, width, height);
        s.flash = Math.max(0, s.flash - dt * 1.8);
      }

      ctx!.globalCompositeOperation = 'lighter';
      for (let i = s.bolts.length - 1; i >= 0; i--) {
        const bolt = s.bolts[i];
        bolt.age += dt;
        const alpha = Math.max(0, 1 - bolt.age / bolt.life);
        if (alpha <= 0) {
          s.bolts.splice(i, 1);
          continue;
        }
        const paths = [bolt.points, ...bolt.branches];
        for (const path of paths) {
          // Wide soft glow pass
          ctx!.strokeStyle = `rgba(180,140,255,${alpha * 0.35})`;
          ctx!.lineWidth = 12; // Wider soft glow for lightning
          ctx!.lineJoin = 'round';
          ctx!.beginPath();
          path.forEach((p, idx) =>
            idx === 0 ? ctx!.moveTo(p.x, p.y) : ctx!.lineTo(p.x, p.y)
          );
          ctx!.stroke();
          // Bright core pass
          ctx!.strokeStyle = `rgba(235,225,255,${alpha})`;
          ctx!.lineWidth = 2;
          ctx!.beginPath();
          path.forEach((p, idx) =>
            idx === 0 ? ctx!.moveTo(p.x, p.y) : ctx!.lineTo(p.x, p.y)
          );
          ctx!.stroke();
        }
      }
    }

    function drawFireworks(t: number, dt: number) {
      if (t > s.nextRocketBatchAt) {
        s.rocketsQueued = randomInt(5, 6);
        s.nextRocketBatchAt = t + (reduced ? 5 : 3.4);
      }
      if (s.rocketsQueued > 0 && Math.random() < dt * 2.2) {
        spawnRocket();
        s.rocketsQueued -= 1;
      }

      ctx!.globalCompositeOperation = 'lighter';

      for (let i = s.rockets.length - 1; i >= 0; i--) {
        const r = s.rockets[i];
        r.vy += 260 * dt; // gravity
        r.vx *= 1 - dt * 0.2; // drag
        r.x += r.vx * dt;
        r.y += r.vy * dt;
        r.trail.push({ x: r.x, y: r.y });
        if (r.trail.length > 10) r.trail.shift();

        for (let j = 1; j < r.trail.length; j++) {
          const a = r.trail[j - 1];
          const bpt = r.trail[j];
          const alpha = (j / r.trail.length) * 0.6;
          ctx!.strokeStyle = `rgba(${r.color},${alpha})`;
          ctx!.lineWidth = 2;
          ctx!.beginPath();
          ctx!.moveTo(a.x, a.y);
          ctx!.lineTo(bpt.x, bpt.y);
          ctx!.stroke();
        }

        const apex = r.vy >= -30;
        const highEnough = r.y < height * 0.55;
        if ((apex && highEnough) || r.y < height * 0.12) {
          explode(r.x, r.y, r.color);
          r.exploded = true;
        }
        if (r.exploded || r.y < -20) s.rockets.splice(i, 1);
      }

      for (let i = s.sparks.length - 1; i >= 0; i--) {
        const sp = s.sparks[i];
        sp.age += dt;
        sp.vy += 130 * dt; // gravity
        sp.vx *= 1 - dt * 0.6; // drag
        sp.vy *= 1 - dt * 0.35;
        sp.x += sp.vx * dt;
        sp.y += sp.vy * dt;
        const lifeRatio = sp.age / sp.life;
        const alpha = Math.max(0, 1 - lifeRatio);
        if (alpha <= 0) {
          s.sparks.splice(i, 1);
          continue;
        }
        const glow = ctx!.createRadialGradient(
          sp.x,
          sp.y,
          0,
          sp.x,
          sp.y,
          sp.size * 5
        );
        glow.addColorStop(0, `rgba(${sp.color},${alpha})`);
        glow.addColorStop(1, `rgba(${sp.color},0)`);
        ctx!.fillStyle = glow;
        ctx!.beginPath();
        ctx!.arc(sp.x, sp.y, sp.size * 5, 0, Math.PI * 2);
        ctx!.fill();
      }
    }

    function frame(now: number) {
      raf = requestAnimationFrame(frame);
      if (hidden) {
        last = now;
        return;
      }
      let dt = (now - last) / 1000;
      dt = Math.min(dt, 1 / 30); // clamp to avoid huge jumps on tab-back
      last = now;
      s.elapsed += dt;

      ctx!.globalCompositeOperation = 'source-over';
      // Soft trailing clear for motion-blur-esque persistence.
      ctx!.fillStyle = 'rgba(5,4,14,0.28)';
      ctx!.fillRect(0, 0, width, height);

      drawMotes(dt);

      switch (effectGroup) {
        case 'idle':
          break;
        case 1:
          drawAurora(s.elapsed, dt);
          break;
        case 2:
          drawMeteors(s.elapsed, dt);
          break;
        case 3:
          drawLightning(s.elapsed, dt);
          break;
        case 4:
          drawFireworks(s.elapsed, dt);
          break;
      }
    }

    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [canvasRef, effectGroup]);
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function LuckyGenerator() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [phase, setPhase] = useState<Phase>('idle');
  const [score, setScore] = useState<number | null>(null);
  const [displayScore, setDisplayScore] = useState(0);
  const [quoteIndex, setQuoteIndex] = useState<number | null>(null);
  const [shareStatus, setShareStatus] = useState<'idle' | 'copied'>('idle');

  const rollRef = useRef<number | null>(null);

  // Hydrate from localStorage on mount (client only — avoids hydration
  // mismatches since the server has no notion of "today" for this user).
  useEffect(() => {
    const stored = readStoredResonance();
    if (stored && stored.lastSpinDate === getLocalDateKey()) {
      setScore(stored.lastScore);
      setDisplayScore(stored.lastScore);
      setQuoteIndex(stored.lastQuoteIndex);
      setPhase('locked');
    }
    return () => {
      if (rollRef.current) cancelAnimationFrame(rollRef.current);
    };
  }, []);

  const tier = useMemo(() => (score === null ? null : getTier(score)), [
    score,
  ]);

  const effectGroup: EffectGroup =
    (phase !== 'idle' && tier) ? tier.id : 'idle';

  useResonanceCanvas(canvasRef, effectGroup);

  const handleReveal = useCallback(() => {
    if (phase !== 'idle') return;

    const previous = readStoredResonance();
    const { score: newScore, quoteIndex: newQuoteIndex } =
      generateTodaysResonance(previous);

    writeStoredResonance({
      lastSpinDate: getLocalDateKey(),
      lastScore: newScore,
      lastQuoteIndex: newQuoteIndex,
    });

    setScore(newScore);
    setQuoteIndex(newQuoteIndex);
    setDisplayScore(0);
    setPhase('revealing');

    const reduced = prefersReducedMotion();
    const duration = reduced ? 400 : REVEAL_DURATION_MS;
    const start = performance.now();

    function tick(now: number) {
      const elapsed = now - start;
      const t = Math.min(1, elapsed / duration);
      const eased = 1 - Math.pow(1 - t, 3); // ease-out-cubic
      setDisplayScore(Math.round(eased * newScore));
      if (t < 1) {
        rollRef.current = requestAnimationFrame(tick);
      } else {
        rollRef.current = null;
        setPhase('locked');
      }
    }
    rollRef.current = requestAnimationFrame(tick);
  }, [phase]);

  const handleShare = useCallback(async () => {
    const text =
      tier && score !== null
        ? `My Daily Resonance today is ${score}% — ${tier.name} ✨ luckypickcanada.ca`
        : 'luckypickcanada.ca';
    const shareData = {
      title: 'Lucky Pick Canada — Daily Resonance',
      text,
      url: typeof window !== 'undefined' ? window.location.href : undefined,
    };
    try {
      if (typeof navigator !== 'undefined' && navigator.share) {
        await navigator.share(shareData);
        return;
      }
    } catch {
      // user cancelled or share failed — fall through to clipboard
    }
    try {
      await navigator.clipboard.writeText(`${text} ${shareData.url ?? ''}`.trim());
      setShareStatus('copied');
      window.setTimeout(() => setShareStatus('idle'), 2200);
    } catch {
      // clipboard unavailable — silently no-op, nothing destructive to do
    }
  }, [tier, score]);

  const pulseClass =
    phase === 'idle'
      ? 'card-pulse-idle'
      : phase === 'revealing'
      ? 'card-pulse-reveal'
      : 'card-pulse-locked';

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-transparent text-white">
      {/* Cinematic nebula background */}
      <div
        className="fixed inset-0 -z-20"
        style={{
          background:
            'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(76,29,149,0.55), transparent 60%), ' +
            'radial-gradient(ellipse 70% 50% at 85% 90%, rgba(8,47,73,0.6), transparent 60%), ' +
            'radial-gradient(ellipse 60% 60% at 10% 85%, rgba(20,83,45,0.18), transparent 55%), ' +
            'radial-gradient(circle at 50% 50%, #0b0a1a, #05040e 70%)',
        }}
      />

      {/* Interactive canvas layer */}
      <canvas ref={canvasRef} className="fixed inset-0 -z-10 h-full w-full" />

      {/* Return to home */}
      <div className="relative z-10 flex justify-start p-4">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/60 backdrop-blur-md transition hover:border-white/20 hover:text-white/90"
        >
          <span aria-hidden>←</span> Return to Home
        </Link>
      </div>

      {/* Ritual card */}
      <main className="relative z-10 flex min-h-[80vh] items-center justify-center px-4 pb-12">
        <div
          className={`card-pulse ${pulseClass} w-[92%] max-w-sm rounded-2xl border-t border-white/15 bg-black/40 p-6 text-center backdrop-blur-xl motion-reduce:animate-none`}
        >
          {phase === 'idle' && (
            <div className="flex flex-col items-center gap-6 py-4">
              <p className="text-xs uppercase tracking-[0.3em] text-cyan-200/70">
                Daily Resonance Ritual
              </p>
              <h1 className="text-xl font-semibold tracking-wide text-white/90">
                AWAKEN TODAY&apos;S RESONANCE
              </h1>
              <button
                onClick={handleReveal}
                className="group relative overflow-hidden rounded-full bg-gradient-to-r from-purple-500/80 via-fuchsia-400/70 to-cyan-400/80 px-6 py-3 text-sm font-medium tracking-wide text-white shadow-lg shadow-purple-500/30 transition active:scale-95 btn-pulse"
              >
                Reveal My Resonance
              </button>
            </div>
          )}

          {phase === 'revealing' && (
            <div className="flex flex-col items-center gap-5 py-4">
              <p className="text-xs uppercase tracking-[0.3em] text-cyan-200/80 animate-pulse">
                THE SKY IS ANSWERING...
              </p>
              <div className="text-6xl font-bold tabular-nums text-transparent bg-clip-text bg-gradient-to-b from-white to-cyan-200/80">
                {displayScore}%
              </div>
              {quoteIndex !== null && (
                <p className="text-sm italic leading-relaxed text-white/70">
                  &ldquo;{QUOTES[quoteIndex]}&rdquo;
                </p>
              )}
            </div>
          )}

          {phase === 'locked' && tier && score !== null && (
            <div className="flex flex-col items-center gap-4 py-2">
              <p className="text-xs uppercase tracking-[0.35em] text-fuchsia-200/80">
                {tier.name}
              </p>
              <div className="text-7xl font-bold tabular-nums text-transparent bg-clip-text bg-gradient-to-b from-yellow-100 via-white to-cyan-200">
                {score}%
              </div>
              {tier.id === 1 && (
                <p className="text-sm leading-relaxed text-white/70">
                  {TIER1_FALLBACK_COPY}
                </p>
              )}
              <div className="mt-1 w-full border-t border-white/10 pt-4">
                <CountdownTimer />
              </div>
              <button
                onClick={handleShare}
                className="mt-2 rounded-full border border-white/15 bg-white/5 px-5 py-2.5 text-sm text-white/85 backdrop-blur-md transition hover:border-white/30 hover:bg-white/10 active:scale-95"
              >
                {shareStatus === 'copied' ? 'Copied ✓' : 'Share My Resonance'}
              </button>
            </div>
          )}
        </div>
      </main>

      <style jsx>{`
        @keyframes pulseButton {
          0%,
          100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.05);
          }
        }
        .btn-pulse {
          animation: pulseButton 2s ease-in-out infinite;
        }
        @keyframes pulseIdle {
          0%,
          100% {
            transform: scale(1);
            box-shadow: 0 0 30px 6px rgba(139, 92, 246, 0.22);
          }
          50% {
            transform: scale(1.012);
            box-shadow: 0 0 48px 10px rgba(103, 232, 249, 0.28);
          }
        }
        @keyframes pulseReveal {
          0%,
          100% {
            transform: scale(1.01);
            box-shadow: 0 0 55px 14px rgba(217, 70, 239, 0.4);
          }
          50% {
            transform: scale(1.045);
            box-shadow: 0 0 95px 24px rgba(103, 232, 249, 0.5);
          }
        }
        @keyframes pulseLocked {
          0%,
          100% {
            transform: scale(1);
            box-shadow: 0 0 70px 18px rgba(139, 92, 246, 0.28);
          }
          50% {
            transform: scale(1.018);
            box-shadow: 0 0 140px 36px rgba(250, 204, 21, 0.24);
          }
        }
        .card-pulse {
          will-change: transform, box-shadow;
        }
        .card-pulse-idle {
          animation: pulseIdle 4.2s ease-in-out infinite;
        }
        .card-pulse-reveal {
          animation: pulseReveal 1.1s ease-in-out infinite;
        }
        .card-pulse-locked {
          animation: pulseLocked 5.6s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
