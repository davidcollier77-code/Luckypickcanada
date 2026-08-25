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

const LUCKY_QUOTES: string[] = [
  "Deep as the Great Lakes and bright as the winter snow, your resonance is strong.",
  "Like an Inukshuk guiding the way, good fortune is pointing directly at you.",
  "The northern lights dance in your favor today; trust the journey ahead.",
  "As steadfast as the Rocky Mountains, your patience will bring reward.",
  "A fresh breeze from the Pacific brings clarity and new opportunities.",
  "Energy flows like the mighty St. Lawrence—steady, powerful, and unstoppable.",
  "Golden fields under wide prairie skies remind you that abundance is near.",
  "Like maple sap rising in spring, your potential is ready to sweeten the day."
];

const TIER1_FALLBACK_COPY =
  'The stars are just realigning for you! Rest up and recharge—tomorrow brings a brand new spark of luck.';

function getTier(score: number): Tier {
  if (score < 25) return { id: 1, name: 'COSMIC DRIFT' };
  if (score < 50) return { id: 2, name: 'METEOR SHOWER' };
  if (score < 75) return { id: 3, name: 'COSMIC LIGHTNING RESONANCE' };
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

  let quoteIndex = randomInt(0, LUCKY_QUOTES.length - 1);
  if (previous && LUCKY_QUOTES.length > 1) {
    let attempts = 0;
    while (quoteIndex === previous.lastQuoteIndex && attempts < 100) {
      quoteIndex = randomInt(0, LUCKY_QUOTES.length - 1);
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

interface Dust {
  x: number;
  y: number;
  r: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
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
  trail: { x: number; y: number }[];
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

// Audio context singleton to avoid creating multiple contexts
let audioCtx: AudioContext | null = null;
function getAudioCtx() {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

function playClickSFX() {
  const ctx = getAudioCtx();
  if (!ctx) return;
  const t = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(800, t);
  osc.frequency.exponentialRampToValueAtTime(1200, t + 0.05);

  gain.gain.setValueAtTime(0, t);
  gain.gain.linearRampToValueAtTime(0.3, t + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.onended = () => {
    osc.disconnect();
    gain.disconnect();
  };

  osc.start(t);
  osc.stop(t + 0.1);
}



function playCosmicDriftSFX() {
  const ctx = getAudioCtx();
  if (!ctx) return;
  const t = ctx.currentTime;

  // Deep sub-bass swell & sweeping celestial hum
  const humOsc = ctx.createOscillator();
  const humGain = ctx.createGain();
  humOsc.type = 'sine';
  humOsc.frequency.setValueAtTime(50, t); // Deep sub-bass
  humOsc.frequency.linearRampToValueAtTime(80, t + 2); // Swell

  // Phaser effect for hum
  const phaser = ctx.createBiquadFilter();
  phaser.type = 'allpass';
  phaser.frequency.setValueAtTime(100, t);
  phaser.frequency.linearRampToValueAtTime(1000, t + 2);
  phaser.frequency.linearRampToValueAtTime(100, t + 4);

  humGain.gain.setValueAtTime(0, t);
  humGain.gain.linearRampToValueAtTime(0.3, t + 1);
  humGain.gain.exponentialRampToValueAtTime(0.01, t + 4);

  humOsc.connect(phaser);
  phaser.connect(humGain);
  humGain.connect(ctx.destination);

  // High-frequency crystalline chimes
  const chimeOsc = ctx.createOscillator();
  const chimeGain = ctx.createGain();
  chimeOsc.type = 'sine'; // Crystalline
  chimeOsc.frequency.setValueAtTime(1200, t);
  chimeOsc.frequency.exponentialRampToValueAtTime(2400, t + 3);

  chimeGain.gain.setValueAtTime(0, t);
  chimeGain.gain.linearRampToValueAtTime(0.05, t + 0.5);
  chimeGain.gain.exponentialRampToValueAtTime(0.001, t + 3);
  chimeOsc.connect(chimeGain);
  chimeGain.connect(ctx.destination);

  humOsc.onended = () => {
    humOsc.disconnect();
    phaser.disconnect();
    humGain.disconnect();
  };

  chimeOsc.onended = () => {
    chimeOsc.disconnect();
    chimeGain.disconnect();
  };

  humOsc.start(t);
  humOsc.stop(t + 4);
  chimeOsc.start(t);
  chimeOsc.stop(t + 3);
}

function playLightningStrikeSFX() {
  const ctx = getAudioCtx();
  if (!ctx) return;
  const t = ctx.currentTime;

  // Crisp electrical snap/crackle burst
  const bufferSize = ctx.sampleRate * 0.5;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * (Math.random() > 0.8 ? 1 : 0); // Spiky noise for crackle
  }
  const noise = ctx.createBufferSource();
  noise.buffer = buffer;

  const noiseFilter = ctx.createBiquadFilter();
  noiseFilter.type = 'bandpass';
  noiseFilter.frequency.setValueAtTime(4000, t);
  noiseFilter.Q.setValueAtTime(1.5, t);

  const noiseGain = ctx.createGain();
  noiseGain.gain.setValueAtTime(0.6, t);
  noiseGain.gain.exponentialRampToValueAtTime(0.01, t + 0.4);

  noise.connect(noiseFilter);
  noiseFilter.connect(noiseGain);
  noiseGain.connect(ctx.destination);

  // Subtle distant thunder sub-kick
  const kickOsc = ctx.createOscillator();
  const kickGain = ctx.createGain();
  kickOsc.type = 'sine';
  kickOsc.frequency.setValueAtTime(80, t);
  kickOsc.frequency.exponentialRampToValueAtTime(20, t + 0.5);

  kickGain.gain.setValueAtTime(0.5, t);
  kickGain.gain.exponentialRampToValueAtTime(0.01, t + 1.5); // Long low rumble

  kickOsc.connect(kickGain);
  kickGain.connect(ctx.destination);

  noise.onended = () => {
    noise.disconnect();
    noiseFilter.disconnect();
    noiseGain.disconnect();
  };

  kickOsc.onended = () => {
    kickOsc.disconnect();
    kickGain.disconnect();
  };

  noise.start(t);
  noise.stop(t + 0.5);

  kickOsc.start(t);
  kickOsc.stop(t + 1.5);
}

function playFireworkBoomSFX() {
  const ctx = getAudioCtx();
  if (!ctx) return;
  const t = ctx.currentTime;

  // Ascending whistle (rocket launch)
  const whistleOsc = ctx.createOscillator();
  const whistleGain = ctx.createGain();
  whistleOsc.type = 'sine';
  whistleOsc.frequency.setValueAtTime(400, t);
  whistleOsc.frequency.exponentialRampToValueAtTime(1200, t + 0.6);

  whistleGain.gain.setValueAtTime(0.1, t);
  whistleGain.gain.linearRampToValueAtTime(0.2, t + 0.3);
  whistleGain.gain.exponentialRampToValueAtTime(0.01, t + 0.6);

  whistleOsc.connect(whistleGain);
  whistleGain.connect(ctx.destination);

  // Low-end muffled burst thud (explosion)
  const thudOsc = ctx.createOscillator();
  const thudGain = ctx.createGain();
  thudOsc.type = 'sine';
  thudOsc.frequency.setValueAtTime(100, t + 0.6); // Starts at the end of the whistle
  thudOsc.frequency.exponentialRampToValueAtTime(30, t + 1.2);

  thudGain.gain.setValueAtTime(0, t);
  thudGain.gain.setValueAtTime(0.6, t + 0.6); // Boom!
  thudGain.gain.exponentialRampToValueAtTime(0.01, t + 1.2);

  thudOsc.connect(thudGain);
  thudGain.connect(ctx.destination);

  // Crackling sparkle decay
  const bufferSize = ctx.sampleRate * 1.2;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * (Math.random() > 0.7 ? 1 : 0);
  }
  const noise = ctx.createBufferSource();
  noise.buffer = buffer;
  const noiseFilter = ctx.createBiquadFilter();
  noiseFilter.type = 'highpass';
  noiseFilter.frequency.setValueAtTime(3000, t + 0.6);

  const noiseGain = ctx.createGain();
  noiseGain.gain.setValueAtTime(0, t);
  noiseGain.gain.setValueAtTime(0.4, t + 0.6);
  noiseGain.gain.exponentialRampToValueAtTime(0.01, t + 1.8);

  noise.connect(noiseFilter);
  noiseFilter.connect(noiseGain);
  noiseGain.connect(ctx.destination);

  whistleOsc.onended = () => {
    whistleOsc.disconnect();
    whistleGain.disconnect();
  };

  thudOsc.onended = () => {
    thudOsc.disconnect();
    thudGain.disconnect();
  };

  noise.onended = () => {
    noise.disconnect();
    noiseFilter.disconnect();
    noiseGain.disconnect();
  };

  whistleOsc.start(t);
  whistleOsc.stop(t + 0.6);

  thudOsc.start(t + 0.6);
  thudOsc.stop(t + 1.2);

  noise.start(t + 0.6);
  noise.stop(t + 1.8);
}


function playMeteorWhooshSFX() {
  const ctx = getAudioCtx();
  if (!ctx) return;
  const t = ctx.currentTime;

  // Deep atmospheric re-entry whoosh (filtered noise sweep)
  const bufferSize = ctx.sampleRate * 2.0;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1; // White noise
  }
  const noise = ctx.createBufferSource();
  noise.buffer = buffer;

  const noiseFilter = ctx.createBiquadFilter();
  noiseFilter.type = 'lowpass';
  noiseFilter.frequency.setValueAtTime(8000, t);
  noiseFilter.frequency.exponentialRampToValueAtTime(200, t + 1.5); // Sweep down

  const noiseGain = ctx.createGain();
  noiseGain.gain.setValueAtTime(0, t);
  noiseGain.gain.linearRampToValueAtTime(0.3, t + 0.3); // Attack
  noiseGain.gain.exponentialRampToValueAtTime(0.01, t + 1.8); // Decay

  noise.connect(noiseFilter);
  noiseFilter.connect(noiseGain);
  noiseGain.connect(ctx.destination);

  noise.onended = () => {
    noise.disconnect();
    noiseFilter.disconnect();
    noiseGain.disconnect();
  };

  noise.start(t);
  noise.stop(t + 2.0);
}

function useResonanceCanvas(
  canvasRef: React.RefObject<HTMLCanvasElement>,
  effectGroup: EffectGroup
) {
  const stateRef = useRef({
    motes: [] as Mote[],
    dust: [] as Dust[],
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

    let width = 0;
    let height = 0;

    function resize() {
      const c = canvasRef.current;
      if (!c) return;
      const dpr = window.devicePixelRatio || 1;
      width = window.innerWidth;
      height = window.innerHeight;
      c.width = width * dpr;
      c.height = height * dpr;
      c.style.width = `${width}px`;
      c.style.height = `${height}px`;

      // Reset transform before scaling to avoid compounding scales on resize
      ctx!.setTransform(1, 0, 0, 1, 0, 0);
      ctx!.scale(dpr, dpr);
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


    function spawnDust() {
      s.dust.push({
        x: Math.random() * width,
        y: Math.random() * height,
        r: 0.5 + Math.random() * 1.5,
        vx: (Math.random() - 0.5) * 10,
        vy: (Math.random() - 0.5) * 10,
        life: 0,
        maxLife: 2 + Math.random() * 3,
      });
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
      // Max active meteors cap for performance
      if (s.meteors.length > (reduced ? 8 : 18)) return;
      const startX = Math.random() * width * 0.6 + width * 0.2;
      const speed = reduced ? 260 : 500 + Math.random() * 350;
      const angle = (55 + Math.random() * 10) * (Math.PI / 180);
      s.meteors.push({
        x: startX,
        y: -20,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        len: 120 + Math.random() * 100, // Longer, realistic tails
        width: 2.5 + Math.random() * 2.0, // Thicker glowing head
        trail: [],
        life: 0,
      });
    }

    function spawnBolt() {
      if (s.bolts.length > (reduced ? 2 : 4)) return; // Cap bolts

      const startX = width * (0.15 + Math.random() * 0.7);
      const endX = startX + (Math.random() - 0.5) * width * 0.4;

      // Recursive fractal branching function
      function createFractalBranch(sx: number, sy: number, ex: number, ey: number, depth: number): { x: number; y: number }[] {
        if (depth === 0) return [{ x: sx, y: sy }, { x: ex, y: ey }];

        const midX = (sx + ex) / 2 + (Math.random() - 0.5) * (ey - sy) * 0.3;
        const midY = (sy + ey) / 2 + (Math.random() - 0.5) * (ex - sx) * 0.1;

        const left = createFractalBranch(sx, sy, midX, midY, depth - 1);
        const right = createFractalBranch(midX, midY, ex, ey, depth - 1);

        return [...left.slice(0, -1), ...right];
      }

      const points = createFractalBranch(startX, 0, endX, height * (0.4 + Math.random() * 0.4), 4);

      const branches: { x: number; y: number }[][] = [];
      const branchCount = randomInt(2, 5);
      for (let b = 0; b < branchCount; b++) {
        const originIdx = randomInt(1, points.length - 3);
        const origin = points[originIdx];

        const bEndX = origin.x + (Math.random() - 0.5) * width * 0.25;
        const bEndY = origin.y + height * (0.1 + Math.random() * 0.2);

        branches.push(createFractalBranch(origin.x, origin.y, bEndX, bEndY, 2));
      }

      // Multi-stage flicker logic tied to life and age
      s.bolts.push({ points, branches, age: 0, life: 0.3 + Math.random() * 0.2 });
      s.flash = 0.5;
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
      const count = reduced ? 30 : 120;
      // Safety cap on total sparks
      if (s.sparks.length > (reduced ? 80 : 250)) return;

      for (let i = 0; i < count; i++) {
        // Bursting radial particle velocities
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(Math.random() * 2 - 1);

        // Realistic explosion physics: fast initial burst, rapid drag
        const speed = 150 + Math.random() * 300;

        const vx3d = speed * Math.sin(phi) * Math.cos(theta);
        const vy3d = speed * Math.cos(phi);
        const vz3d = speed * Math.sin(phi) * Math.sin(theta);

        const depth = (vz3d / speed + 1) / 2;

        const particleColor = Math.random() > 0.85 ? '255,255,255' : color;

        s.sparks.push({
          x,
          y,
          vx: vx3d,
          vy: vy3d,
          color: particleColor,
          age: 0,
          life: 1.2 + Math.random() * 1.0, // Longer lingering life
          size: 1.5 + depth * 2.0,
          trail: [],
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

    function drawCosmicDrift(dt: number) {
      if (Math.random() < dt * 4) spawnDust();
      ctx!.globalCompositeOperation = 'lighter';
      for (let i = s.dust.length - 1; i >= 0; i--) {
        const d = s.dust[i];
        d.life += dt;
        d.x += d.vx * dt;
        d.y += d.vy * dt;
        const alpha = Math.max(0, 1 - d.life / d.maxLife) * 0.6;
        ctx!.fillStyle = `rgba(200, 220, 255, ${alpha})`;
        ctx!.beginPath();
        ctx!.arc(d.x, d.y, d.r, 0, Math.PI * 2);
        ctx!.fill();
        if (d.life > d.maxLife) s.dust.splice(i, 1);
      }
    }

    function drawAurora(t: number, dt: number) {
      ctx!.globalCompositeOperation = 'lighter';
      const bands = 3;
      for (let b = 0; b < bands; b++) {
        const freq = 0.0016 + b * 0.0006;
        const amp = 60 + b * 26;
        const yBase = height * (0.28 + b * 0.14);
        const grad = ctx!.createLinearGradient(0, 0, width, 0);
        const hue = b % 2 === 0 ? '110,230,210' : '170,140,255';
        grad.addColorStop(0, `rgba(${hue},0)`);
        grad.addColorStop(0.5, `rgba(${hue},0.16)`);
        grad.addColorStop(1, `rgba(${hue},0)`);
        ctx!.strokeStyle = grad;
        ctx!.lineWidth = 26 + b * 10;
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
        s.nextMeteorAt = t + (reduced ? 0.8 : 0.2 + Math.random() * 0.3);
      }
      ctx!.globalCompositeOperation = 'lighter';
      for (let i = s.meteors.length - 1; i >= 0; i--) {
        const m = s.meteors[i];
        m.life += dt;
        m.x += m.vx * dt;
        m.y += m.vy * dt;
        m.trail.push({ x: m.x, y: m.y });
        // Longer tail memory for smooth tapers
        if (m.trail.length > 25) m.trail.shift();

        // Stardust along tail, limit sparks to prevent lag
        if (Math.random() < 0.8 && s.sparks.length < (reduced ? 30 : 80)) {
          s.sparks.push({
            x: m.x + (Math.random() - 0.5) * 12,
            y: m.y + (Math.random() - 0.5) * 12,
            vx: m.vx * 0.1 + (Math.random() - 0.5) * 50,
            vy: m.vy * 0.1 + (Math.random() - 0.5) * 50,
            color: '200,240,255',
            age: 0,
            life: 0.6 + Math.random() * 0.8,
            size: 1 + Math.random() * 1.5,
            trail: []
          });
        }

        // Tapered, smooth linear gradient tail
        if (m.trail.length > 1) {
          const tailEnd = m.trail[0];
          const tailStart = m.trail[m.trail.length - 1];
          const dist = Math.hypot(tailStart.x - tailEnd.x, tailStart.y - tailEnd.y);

          if (dist > 0) {
            const grad = ctx!.createLinearGradient(tailEnd.x, tailEnd.y, tailStart.x, tailStart.y);
            grad.addColorStop(0, 'rgba(180,210,255,0)');
            grad.addColorStop(0.8, 'rgba(210,230,255,0.4)');
            grad.addColorStop(1, 'rgba(255,255,255,0.8)');

            ctx!.strokeStyle = grad;
            ctx!.lineWidth = m.width;
            ctx!.lineCap = 'round';
            ctx!.beginPath();
            ctx!.moveTo(tailEnd.x, tailEnd.y);
            // Draw a single smooth line instead of segments for better gradient mapping
            ctx!.lineTo(tailStart.x, tailStart.y);
            ctx!.stroke();
          }
        }

        // Bright glowing core
        const glow = ctx!.createRadialGradient(m.x, m.y, 0, m.x, m.y, m.width * 4);
        glow.addColorStop(0, 'rgba(255,255,255,1)');
        glow.addColorStop(0.3, 'rgba(190,220,255,0.8)');
        glow.addColorStop(1, 'rgba(190,220,255,0)');
        ctx!.fillStyle = glow;
        ctx!.beginPath();
        ctx!.arc(m.x, m.y, m.width * 4, 0, Math.PI * 2);
        ctx!.fill();

        if (m.y > height + 100 || m.x < -100 || m.x > width + 100) {
          s.meteors.splice(i, 1);
        }
      }

      // Render stardust particles
      for (let i = s.sparks.length - 1; i >= 0; i--) {
        const sp = s.sparks[i];
        sp.age += dt;
        sp.vx *= 1 - dt * 1.2; // stronger drag
        sp.vy *= 1 - dt * 1.2;
        sp.x += sp.vx * dt;
        sp.y += sp.vy * dt;

        sp.trail.push({ x: sp.x, y: sp.y });
        if (sp.trail.length > 5) sp.trail.shift();

        const lifeRatio = sp.age / sp.life;
        const alpha = Math.max(0, 1 - lifeRatio);

        if (alpha <= 0) {
          s.sparks.splice(i, 1);
          continue;
        }

        for (let j = 1; j < sp.trail.length; j++) {
          const a = sp.trail[j - 1];
          const bpt = sp.trail[j];
          const pathAlpha = alpha * (j / sp.trail.length) * 0.6;
          ctx!.strokeStyle = `rgba(${sp.color},${pathAlpha})`;
          ctx!.lineWidth = sp.size * (j / sp.trail.length);
          ctx!.lineCap = 'round';
          ctx!.beginPath();
          ctx!.moveTo(a.x, a.y);
          ctx!.lineTo(bpt.x, bpt.y);
          ctx!.stroke();
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
        ctx!.fillStyle = `rgba(190,40,255,${s.flash * 0.4})`;
        ctx!.fillRect(0, 0, width, height);
        s.flash = Math.max(0, s.flash - dt * 2.5);
      }

      ctx!.globalCompositeOperation = 'lighter';
      for (let i = s.bolts.length - 1; i >= 0; i--) {
        const bolt = s.bolts[i];
        bolt.age += dt;

        // Multi-stage flicker: rapid on/off pulsing before fade
        const progress = bolt.age / bolt.life;
        if (progress >= 1) {
          s.bolts.splice(i, 1);
          continue;
        }

        let alpha = 1;
        if (progress < 0.2) alpha = progress * 5; // Fast in
        else if (progress > 0.8) alpha = (1 - progress) * 5; // Fast out
        else alpha = 0.5 + Math.random() * 0.5; // Flicker in middle

        const paths = [bolt.points, ...bolt.branches];

        ctx!.save();
        // Use shadowBlur for true luminescence
        ctx!.shadowColor = 'rgba(210, 100, 255, 1)';
        ctx!.shadowBlur = reduced ? 0 : 25;

        for (const path of paths) {
          // Wide neon-purple soft glow pass
          ctx!.strokeStyle = `rgba(190,40,255,${alpha * 0.7})`;
          ctx!.lineWidth = 6;
          ctx!.lineJoin = 'round';
          ctx!.beginPath();
          path.forEach((p, idx) =>
            idx === 0 ? ctx!.moveTo(p.x, p.y) : ctx!.lineTo(p.x, p.y)
          );
          ctx!.stroke();

          // Bright core pass
          ctx!.strokeStyle = `rgba(245,200,255,${alpha})`;
          ctx!.lineWidth = 2;
          ctx!.beginPath();
          path.forEach((p, idx) =>
            idx === 0 ? ctx!.moveTo(p.x, p.y) : ctx!.lineTo(p.x, p.y)
          );
          ctx!.stroke();
        }
        ctx!.restore();
      }
    }

    function drawFireworks(t: number, dt: number) {
      if (t > s.nextRocketBatchAt) {
        s.rocketsQueued = randomInt(4, 5);
        s.nextRocketBatchAt = t + (reduced ? 5 : 3.8); // Slower batches for perf
      }
      if (s.rocketsQueued > 0 && Math.random() < dt * 2.0 && s.rockets.length < (reduced ? 3 : 6)) {
        spawnRocket();
        s.rocketsQueued -= 1;
      }

      ctx!.globalCompositeOperation = 'lighter';

      for (let i = s.rockets.length - 1; i >= 0; i--) {
        const r = s.rockets[i];
        r.vy += 300 * dt; // gravity
        r.vx *= 1 - dt * 0.3; // drag
        r.x += r.vx * dt;
        r.y += r.vy * dt;
        r.trail.push({ x: r.x, y: r.y });
        if (r.trail.length > 15) r.trail.shift();

        for (let j = 1; j < r.trail.length; j++) {
          const a = r.trail[j - 1];
          const bpt = r.trail[j];
          const alpha = (j / r.trail.length) * 0.8;
          ctx!.strokeStyle = `rgba(${r.color},${alpha})`;
          ctx!.lineWidth = 2.5 * (j / r.trail.length);
          ctx!.lineCap = 'round';
          ctx!.beginPath();
          ctx!.moveTo(a.x, a.y);
          ctx!.lineTo(bpt.x, bpt.y);
          ctx!.stroke();
        }

        const apex = r.vy >= -40;
        const highEnough = r.y < height * 0.6;
        if ((apex && highEnough) || r.y < height * 0.15) {
          explode(r.x, r.y, r.color);
          r.exploded = true;
        }
        if (r.exploded || r.y < -50) s.rockets.splice(i, 1);
      }

      // Sparkle Glitter Rendering
      for (let i = s.sparks.length - 1; i >= 0; i--) {
        const sp = s.sparks[i];
        sp.age += dt;
        sp.vy += 180 * dt; // higher gravity for realistic arc

        // Rapid drag (air resistance)
        sp.vx *= 1 - dt * 2.0;
        sp.vy *= 1 - dt * 1.5;

        sp.x += sp.vx * dt;
        sp.y += sp.vy * dt;

        sp.trail.push({ x: sp.x, y: sp.y });
        if (sp.trail.length > (reduced ? 4 : 8)) sp.trail.shift();

        const lifeRatio = sp.age / sp.life;
        const alpha = Math.max(0, 1 - lifeRatio);

        if (alpha <= 0 || sp.y > height + 20) {
          s.sparks.splice(i, 1);
          continue;
        }

        // Twinkling effect
        const twinkle = 0.5 + Math.sin(sp.age * 20 + sp.x) * 0.5;
        const finalAlpha = alpha * (0.4 + twinkle * 0.6);

        // Draw trailing path
        for (let j = 1; j < sp.trail.length; j++) {
          const a = sp.trail[j - 1];
          const bpt = sp.trail[j];
          const pathAlpha = finalAlpha * (j / sp.trail.length);
          ctx!.strokeStyle = `rgba(${sp.color},${pathAlpha})`;
          ctx!.lineWidth = sp.size * (j / sp.trail.length);
          ctx!.lineCap = 'round';
          ctx!.beginPath();
          ctx!.moveTo(a.x, a.y);
          ctx!.lineTo(bpt.x, bpt.y);
          ctx!.stroke();
        }

        // Core glow
        ctx!.fillStyle = `rgba(255,255,255,${finalAlpha})`;
        ctx!.beginPath();
        ctx!.arc(sp.x, sp.y, sp.size * 0.8, 0, Math.PI * 2);
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
          drawCosmicDrift(dt);
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

export default function DailyResonance() {
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
    phase === 'idle' || !tier ? 'idle' : tier.id;

  useResonanceCanvas(canvasRef, effectGroup);

  const handleReveal = useCallback(() => {
    if (phase !== 'idle') return;

    try {
      // Initialize and resume AudioContext exactly on button click
      const ctx = getAudioCtx();
      if (ctx && ctx.state === 'suspended') {
        ctx.resume();
      }
      playClickSFX();
    } catch (e) {
      // Ignore if audio context fails
    }

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
    let startTime: number | null = null;
    const target = newScore;
    const duration = 2400; // 2.4s duration

    function tick(now: number) {
      // Capture startTime on the first animation frame to avoid time-origin bugs.
      // performance.now() isn't used here because DOMHighResTimeStamp (now) from
      // requestAnimationFrame may have a different time origin in some environments.
      if (startTime === null) startTime = now;
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);

      if (progress < 1) {
        // Base linear progression towards target
        const base = progress * target;
        // Dampened sine wave oscillation to create overshoot/undershoot jitter
        const amplitude = (1 - progress) * 22;
        const oscillation = Math.sin(progress * Math.PI * 7) * amplitude;

        let current = Math.round(base + oscillation);
        current = Math.max(0, Math.min(100, current)); // Clamp 0-100

        setDisplayScore(current);
        rollRef.current = requestAnimationFrame(tick);
      } else {
        setDisplayScore(target);
        rollRef.current = null;
        setPhase('locked');
        if (newScore < 25) {
          try { playCosmicDriftSFX(); } catch (e) {}
        } else if (newScore < 50) {
          try { playMeteorWhooshSFX(); } catch (e) {}
        } else if (newScore < 75) {
          try { playLightningStrikeSFX(); } catch (e) {}
        } else {
          try { playFireworkBoomSFX(); } catch (e) {}
        }
      }
    }
    rollRef.current = requestAnimationFrame(tick);
  }, [phase]);

  const handleShare = useCallback(async () => {
    try {
      playClickSFX();
    } catch (e) {
      // Ignore
    }

    const text =
      tier && score !== null && quoteIndex !== null
        ? `My Daily Resonance is ${score}%! '${LUCKY_QUOTES[quoteIndex]}' Discover your daily fortune at luckypickcanada.ca (For entertainment purposes only).`
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
      await navigator.clipboard.writeText(text);
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
    <div className="relative min-h-screen w-full overflow-hidden bg-[#05040e] text-white">
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
      <canvas ref={canvasRef} className="fixed inset-0 w-full h-full pointer-events-none z-0" />

      {/* Return to home */}
      <div className="relative z-10 flex justify-start p-4">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/60 backdrop-blur-md transition hover:border-white/20 hover:text-white/90 cursor-default"
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
                className="group relative overflow-hidden rounded-full bg-gradient-to-r from-purple-500/80 via-fuchsia-400/70 to-cyan-400/80 px-6 py-3 text-sm font-medium tracking-wide text-white shadow-lg shadow-purple-500/30 transition active:scale-95 btn-pulse cursor-default"
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
              <div className="relative flex items-center justify-center">
                <div className="waveform-ripple ripple-1 absolute inset-0 rounded-full border-2 border-cyan-300/40" />
                <div className="waveform-ripple ripple-2 absolute inset-0 rounded-full border-2 border-fuchsia-400/30" />
                <div className="waveform-ripple ripple-3 absolute inset-0 rounded-full border-2 border-cyan-200/20" />
                <div className="text-6xl font-bold tabular-nums text-transparent bg-clip-text bg-gradient-to-b from-white to-cyan-200/80 relative z-10">
                  {displayScore}%
                </div>
              </div>
              {quoteIndex !== null && (
                <p className="text-sm italic leading-relaxed text-white/70">
                  &ldquo;{LUCKY_QUOTES[quoteIndex]}&rdquo;
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
              {quoteIndex !== null && (
                <p className="text-sm italic leading-relaxed text-white/70 mt-2 max-w-xs transition-opacity duration-700">
                  &ldquo;{LUCKY_QUOTES[quoteIndex]}&rdquo;
                </p>
              )}

              <div className="mt-1 w-full border-t border-white/10 pt-4">
                <CountdownTimer />
              </div>
              <button
                onClick={handleShare}
                className="mt-2 rounded-full border border-white/15 bg-white/5 px-5 py-2.5 text-sm text-white/85 backdrop-blur-md transition hover:border-white/30 hover:bg-white/10 active:scale-95 cursor-default"
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
        @keyframes waveformRipple {
          0% {
            transform: scale(0.8);
            opacity: 1;
          }
          100% {
            transform: scale(2.5);
            opacity: 0;
          }
        }
        .waveform-ripple {
          animation: waveformRipple 2s cubic-bezier(0.1, 0.5, 0.3, 1) infinite;
          pointer-events: none;
        }
        .ripple-1 {
          animation-delay: 0s;
        }
        .ripple-2 {
          animation-delay: 0.6s;
        }
        .ripple-3 {
          animation-delay: 1.2s;
        }
      `}</style>
    </div>
  );
}
