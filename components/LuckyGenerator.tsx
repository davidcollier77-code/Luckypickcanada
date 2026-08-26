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

// Strict 9s reveal timer (never shortened for prefers-reduced-motion) and the
// ~60ms cadence used to rapidly spin the displayed number during the reveal.
const REVEAL_DURATION_MS = 9000;
const SPIN_INTERVAL_MS = 60;

const METEOR_SOUNDS = ['/dragon-studio-whoosh-cinematic-376875.mp3'];
const LIGHTNING_SOUNDS = ['/yodguard-lightning-magic-3-378649.mp3'];
const FIREWORKS_SOUNDS = ['/freesound_community-fireworks-1-94483.mp3'];
const BUILDUP_SOUND = '/freesound_community-starship-rail-gun-charge-35904.mp3';

const QUOTES: string[] = [
  'Like the Northern Lights dancing across the sky, your luck is uniquely yours today.',
  'A shiny loonie in your pocket and a sky full of stars. Today is looking bright.',
  'Catch a falling maple leaf and let the good vibes flow. True North, true luck.',
  'From coast to coast, the cosmic current is flowing your way.',
  'Keep your stick on the ice and your eyes on the stars. The universe has your back.',
  'Deep as the Great Lakes and bright as the winter snow, your resonance is strong.',
  'Like an Inukshuk guiding the way, good fortune is pointing directly at you.',
  'No golden tickets needed here, just pure True North energy. Enjoy the ride!',
  'As steadfast as the Rocky Mountains, your patience will bring reward.',
  'Like maple sap rising in spring, your potential is ready to sweeten the day.',
];

function getTier(score: number): Tier {
  if (score <= 33) return { id: 2, name: 'METEOR SHOWER RESONANCE' };
  if (score <= 66) return { id: 3, name: 'COSMIC LIGHTNING RESONANCE' };
  return { id: 4, name: 'GRAND FIREWORKS RESONANCE' };
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
    // localStorage unavailable — fail silently
  }
}

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
// CountdownTimer
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
// Resonance button — inlined per spec (breathing pulse + tactile click)
// ---------------------------------------------------------------------------

function ResonanceButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="btn-pulse inline-flex items-center justify-center rounded-full border border-white/15 bg-gradient-to-br from-fuchsia-500/80 via-purple-500/80 to-cyan-400/80 px-8 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-white backdrop-blur-md transition-transform duration-150 ease-out active:scale-95 cursor-default"
    >
      Reveal My Resonance
    </button>
  );
}

// ---------------------------------------------------------------------------
// Canvas VFX engine
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
  '255,80,80',
  '90,140,255',
  '110,255,150',
  '200,110,255',
  '255,205,90',
];

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

// These now play a preloaded, already-unlocked <audio> element (passed in
// from the refs created on mount) instead of constructing `new Audio(path)`
// on the fly — the latter is what mobile autoplay policy blocks when the
// call happens outside a direct user gesture (e.g. from inside a timer or
// the canvas RAF loop).
function playMeteorWhooshSFX(audio: HTMLAudioElement | null) {
  if (!audio) return;
  audio.currentTime = 0;
  audio.play().catch(() => {});
}

function playLightningStrikeSFX(audio: HTMLAudioElement | null) {
  if (!audio) return;
  audio.currentTime = 0;
  audio.play().catch(() => {});
}

function playFireworkBoomSFX(audio: HTMLAudioElement | null) {
  if (!audio) return;
  audio.currentTime = 0;
  audio.play().catch(() => {});
}

function useResonanceCanvas(
  canvasRef: React.RefObject<HTMLCanvasElement>,
  effectGroupRef: React.MutableRefObject<EffectGroup>,
  lightningAudioRef: React.RefObject<HTMLAudioElement | null>
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

      ctx!.setTransform(1, 0, 0, 1, 0, 0);
      ctx!.scale(dpr, dpr);
    }
    resize();
    window.addEventListener('resize', resize);

    const s = stateRef.current;

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
      // Rule: max 15-20 sparks per explosion (was a fixed 20).
      const count = reduced ? 10 : 15 + Math.floor(Math.random() * 6);

      for (let i = 0; i < count; i++) {
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(Math.random() * 2 - 1);
        const speed = 90 + Math.random() * 170;

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
          life: 0.9 + Math.random() * 0.6,
          size: 1.0 + depth * 2.2,
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
        ctx!.fillStyle = '#c8dcff';
        ctx!.globalAlpha = alpha;
        ctx!.fillRect(d.x - d.r, d.y - d.r, d.r * 2, d.r * 2);
        ctx!.globalAlpha = 1.0;
        if (d.life > d.maxLife) s.dust.splice(i, 1);
      }
    }

    function drawMeteors(t: number, dt: number) {
      if (t > s.nextMeteorAt && s.meteors.length < 20) {
        spawnMeteor();
        s.nextMeteorAt = t + (reduced ? 2.5 : 1.2 + Math.random() * 1.0);
      }
      ctx!.globalCompositeOperation = 'lighter';
      for (let i = s.meteors.length - 1; i >= 0; i--) {
        const m = s.meteors[i];
        m.life += dt;
        m.x += m.vx * dt;
        m.y += m.vy * dt;
        m.trail.push({ x: m.x, y: m.y });
        if (m.trail.length > 14) m.trail.shift();

        if (Math.random() < 0.6 && s.sparks.length < 20) {
          s.sparks.push({
            x: m.x + (Math.random() - 0.5) * 10,
            y: m.y + (Math.random() - 0.5) * 10,
            vx: (Math.random() - 0.5) * 40,
            vy: (Math.random() - 0.5) * 40,
            color: '200,240,255',
            age: 0,
            life: 0.5 + Math.random() * 0.5,
            size: 1 + Math.random() * 1.5,
            trail: []
          });
        }

        for (let j = 1; j < m.trail.length; j++) {
          const a = m.trail[j - 1];
          const bpt = m.trail[j];
          const alpha = (j / m.trail.length) * 0.5;
          ctx!.strokeStyle = `rgba(180,210,255,${alpha})`;
          ctx!.lineWidth = m.width * (j / m.trail.length);
          ctx!.beginPath();
          ctx!.moveTo(a.x, a.y);
          ctx!.lineTo(bpt.x, bpt.y);
          ctx!.stroke();
        }

        const glow = ctx!.createRadialGradient(m.x, m.y, 0, m.x, m.y, 9);
        glow.addColorStop(0, 'rgba(255,255,255,0.95)');
        glow.addColorStop(0.4, 'rgba(190,220,255,0.6)');
        glow.addColorStop(1, 'rgba(190,220,255,0)');
        ctx!.fillStyle = glow;
        ctx!.beginPath();
        ctx!.arc(m.x, m.y, 9, 0, Math.PI * 2);
        ctx!.fill();

        if (m.y > height + 40 || m.x < -60 || m.x > width + 60) {
          s.meteors.splice(i, 1);
        }
      }

      for (let i = s.sparks.length - 1; i >= 0; i--) {
        const sp = s.sparks[i];
        sp.age += dt;
        sp.vx *= 1 - dt * 0.6;
        sp.vy *= 1 - dt * 0.6;
        sp.x += sp.vx * dt;
        sp.y += sp.vy * dt;

        sp.trail.push({ x: sp.x, y: sp.y });
        if (sp.trail.length > 6) sp.trail.shift();

        const lifeRatio = sp.age / sp.life;
        const alpha = Math.max(0, 1 - lifeRatio);

        if (alpha <= 0) {
          s.sparks.splice(i, 1);
          continue;
        }

        for (let j = 1; j < sp.trail.length; j++) {
          const a = sp.trail[j - 1];
          const bpt = sp.trail[j];
          const pathAlpha = alpha * (j / sp.trail.length) * 0.5;
          ctx!.strokeStyle = `rgba(${sp.color},${pathAlpha})`;
          ctx!.lineWidth = sp.size * (j / sp.trail.length);
          ctx!.lineCap = 'round';
          ctx!.beginPath();
          ctx!.moveTo(a.x, a.y);
          ctx!.lineTo(bpt.x, bpt.y);
          ctx!.stroke();
        }

        const sparkGlow = ctx!.createRadialGradient(sp.x, sp.y, 0, sp.x, sp.y, sp.size * 3);
        sparkGlow.addColorStop(0, `rgba(${sp.color},${alpha})`);
        sparkGlow.addColorStop(1, `rgba(${sp.color},0)`);
        ctx!.fillStyle = sparkGlow;
        ctx!.beginPath();
        ctx!.arc(sp.x, sp.y, sp.size * 3, 0, Math.PI * 2);
        ctx!.fill();
      }
    }

    function drawLightning(t: number, dt: number) {
      if (t > s.nextBoltAt) {
        spawnBolt();
        try {
          playLightningStrikeSFX(lightningAudioRef.current);
        } catch (e) {}
        s.nextBoltAt = t + (reduced ? 1.4 : 0.6 + Math.random() * 0.7);
      }

      if (s.flash > 0) {
        ctx!.globalCompositeOperation = 'lighter';
        ctx!.fillStyle = `rgba(190,40,255,${s.flash * 0.35})`;
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
          ctx!.strokeStyle = `rgba(190,40,255,${alpha * 0.6})`;
          ctx!.lineWidth = 10;
          ctx!.lineJoin = 'round';
          ctx!.beginPath();
          path.forEach((p, idx) =>
            idx === 0 ? ctx!.moveTo(p.x, p.y) : ctx!.lineTo(p.x, p.y)
          );
          ctx!.stroke();

          ctx!.strokeStyle = `rgba(245,200,255,${alpha})`;
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
        r.vy += 260 * dt;
        r.vx *= 1 - dt * 0.2;
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
        sp.vy += 130 * dt;
        sp.vx *= 1 - dt * 0.6;
        sp.vy *= 1 - dt * 0.35;
        sp.x += sp.vx * dt;
        sp.y += sp.vy * dt;

        sp.trail.push({ x: sp.x, y: sp.y });
        if (sp.trail.length > 8) sp.trail.shift();

        const lifeRatio = sp.age / sp.life;
        const alpha = Math.max(0, 1 - lifeRatio);

        if (alpha <= 0) {
          s.sparks.splice(i, 1);
          continue;
        }

        for (let j = 1; j < sp.trail.length; j++) {
          const a = sp.trail[j - 1];
          const bpt = sp.trail[j];
          const pathAlpha = alpha * (j / sp.trail.length) * 0.7;
          ctx!.strokeStyle = `rgba(${sp.color},${pathAlpha})`;
          ctx!.lineWidth = sp.size * (j / sp.trail.length);
          ctx!.lineCap = 'round';
          ctx!.beginPath();
          ctx!.moveTo(a.x, a.y);
          ctx!.lineTo(bpt.x, bpt.y);
          ctx!.stroke();
        }

        const glow = ctx!.createRadialGradient(
          sp.x,
          sp.y,
          0,
          sp.x,
          sp.y,
          sp.size * 4
        );
        glow.addColorStop(0, `rgba(${sp.color},${alpha})`);
        glow.addColorStop(0.3, `rgba(${sp.color},${alpha * 0.6})`);
        glow.addColorStop(1, `rgba(${sp.color},0)`);
        ctx!.fillStyle = glow;
        ctx!.beginPath();
        ctx!.arc(sp.x, sp.y, sp.size * 4, 0, Math.PI * 2);
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
      dt = Math.min(dt, 1 / 30);
      last = now;
      s.elapsed += dt;

      ctx!.globalCompositeOperation = 'source-over';
      ctx!.fillStyle = 'rgba(5,4,14,0.28)';
      ctx!.fillRect(0, 0, width, height);

      drawMotes(dt);

      // Read from the ref (not a prop) so switching build-up -> finale never
      // tears down and restarts this effect / the RAF loop below.
      switch (effectGroupRef.current) {
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
    // Intentionally NOT depending on the effectGroup value itself — only on
    // the stable ref/canvas objects — so this setup (listeners + RAF loop)
    // runs once and never unmounts when the tier/phase changes mid-roll.
  }, [canvasRef, effectGroupRef, lightningAudioRef]);
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function LuckyGenerator() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const buildUpAudioRef = useRef<HTMLAudioElement | null>(null);
  const meteorAudioRef = useRef<HTMLAudioElement | null>(null);
  const lightningAudioRef = useRef<HTMLAudioElement | null>(null);
  const fireworkAudioRef = useRef<HTMLAudioElement | null>(null);

  const [phase, setPhase] = useState<Phase>('idle');
  const [score, setScore] = useState<number | null>(null);
  const [displayScore, setDisplayScore] = useState(0);
  const [quoteIndex, setQuoteIndex] = useState<number | null>(null);
  const [shareStatus, setShareStatus] = useState<'idle' | 'copied'>('idle');

  // Holds the freshly-generated score/quote between click and the moment the
  // 9s reveal actually completes — kept out of React state so nothing leaks
  // into the UI (or localStorage) before the animation finishes.
  const pendingResultRef = useRef<{ score: number; quoteIndex: number } | null>(
    null
  );
  const spinIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const revealTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    buildUpAudioRef.current = new Audio(BUILDUP_SOUND);
    meteorAudioRef.current = new Audio(METEOR_SOUNDS[0]);
    lightningAudioRef.current = new Audio(LIGHTNING_SOUNDS[0]);
    fireworkAudioRef.current = new Audio(FIREWORKS_SOUNDS[0]);

    [
      buildUpAudioRef.current,
      meteorAudioRef.current,
      lightningAudioRef.current,
      fireworkAudioRef.current,
    ].forEach((a) => {
      a.preload = 'auto';
    });

    const stored = readStoredResonance();
    if (stored && stored.lastSpinDate === getLocalDateKey()) {
      setScore(stored.lastScore);
      setDisplayScore(stored.lastScore);
      setQuoteIndex(stored.lastQuoteIndex);
      setPhase('locked');
    }

    return () => {
      // Ghost-audio prevention: if we unmount mid-roll (e.g. the user taps
      // "Return to Home" during the 9-second reveal), stop everything.
      [
        buildUpAudioRef.current,
        meteorAudioRef.current,
        lightningAudioRef.current,
        fireworkAudioRef.current,
      ].forEach((a) => {
        if (!a) return;
        a.pause();
        a.src = '';
      });
      buildUpAudioRef.current = null;
      meteorAudioRef.current = null;
      lightningAudioRef.current = null;
      fireworkAudioRef.current = null;

      if (spinIntervalRef.current) clearInterval(spinIntervalRef.current);
      if (revealTimeoutRef.current) clearTimeout(revealTimeoutRef.current);
    };
  }, []);

  const tier = useMemo(() => (score === null ? null : getTier(score)), [
    score,
  ]);

  // 'revealing' always drives effect group 1 (the build-up look) regardless
  // of tier — tier itself is intentionally still null at this point now that
  // requirement 2 defers setScore() until the reveal completes, so the
  // `phase === 'revealing'` check has to come before the `!tier` fallback.
  const effectGroup: EffectGroup =
    phase === 'idle'
      ? 'idle'
      : phase === 'revealing'
      ? 1
      : tier
      ? tier.id
      : 'idle';

  const effectGroupRef = useRef<EffectGroup>('idle');
  useEffect(() => {
    effectGroupRef.current = effectGroup;
  }, [effectGroup]);

  useResonanceCanvas(canvasRef, effectGroupRef, lightningAudioRef);

  const handleReveal = useCallback(() => {
    if (phase !== 'idle') return;

    try {
      playClickSFX();
    } catch (e) {
      // Ignore
    }

    // Mobile audio unlock: briefly play() then pause() every element inside
    // this direct click handler so the .play() calls made later (inside the
    // 9s timeout, and from the ambient lightning-strike loop) aren't blocked
    // by mobile autoplay policy.
    [
      buildUpAudioRef.current,
      meteorAudioRef.current,
      lightningAudioRef.current,
      fireworkAudioRef.current,
    ].forEach((audio) => {
      if (!audio) return;
      audio.play().catch(() => {});
      audio.pause();
      audio.currentTime = 0;
    });

    if (buildUpAudioRef.current) {
      buildUpAudioRef.current.loop = true;
      buildUpAudioRef.current.currentTime = 0;
      buildUpAudioRef.current.play().catch(() => {});
    }

    const previous = readStoredResonance();
    const { score: newScore, quoteIndex: newQuoteIndex } =
      generateTodaysResonance(previous);

    // Calculated now, but NOT written to state/localStorage until the 9s
    // timer below actually fires — see requirement 2.
    pendingResultRef.current = { score: newScore, quoteIndex: newQuoteIndex };

    setDisplayScore(0);
    setPhase('revealing');

    // Rapid slot-machine-style spin of the displayed number while we wait.
    spinIntervalRef.current = setInterval(() => {
      setDisplayScore(randomInt(0, 100));
    }, SPIN_INTERVAL_MS);

    // Strict wall-clock 9000ms via setTimeout — not requestAnimationFrame —
    // so a throttled/backgrounded mobile tab can't cause this to skip ahead
    // or resolve early the way the old RAF-delta math did.
    revealTimeoutRef.current = setTimeout(() => {
      if (spinIntervalRef.current) {
        clearInterval(spinIntervalRef.current);
        spinIntervalRef.current = null;
      }

      const pending = pendingResultRef.current;
      if (!pending) return;

      if (buildUpAudioRef.current) {
        buildUpAudioRef.current.pause();
        buildUpAudioRef.current.currentTime = 0;
      }

      if (pending.score <= 33) {
        try {
          playMeteorWhooshSFX(meteorAudioRef.current);
        } catch (e) {}
      } else if (pending.score <= 66) {
        try {
          playLightningStrikeSFX(lightningAudioRef.current);
        } catch (e) {}
      } else {
        try {
          playFireworkBoomSFX(fireworkAudioRef.current);
        } catch (e) {}
      }

      writeStoredResonance({
        lastSpinDate: getLocalDateKey(),
        lastScore: pending.score,
        lastQuoteIndex: pending.quoteIndex,
      });

      setScore(pending.score);
      setQuoteIndex(pending.quoteIndex);
      setDisplayScore(pending.score);
      setPhase('locked');

      pendingResultRef.current = null;
      revealTimeoutRef.current = null;
    }, REVEAL_DURATION_MS);
  }, [phase]);

  const handleShare = useCallback(async () => {
    try {
      playClickSFX();
    } catch (e) {
      // Ignore
    }

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
      // Fall through to clipboard
    }
    try {
      await navigator.clipboard.writeText(`${text} ${shareData.url ?? ''}`.trim());
      setShareStatus('copied');
      window.setTimeout(() => setShareStatus('idle'), 2200);
    } catch {
      // Ignore
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

      <canvas ref={canvasRef} className="fixed inset-0 w-full h-full pointer-events-none z-0" />

      <div className="relative z-10 flex justify-start p-4">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/60 backdrop-blur-md transition hover:border-white/20 hover:text-white/90 cursor-default"
        >
          <span aria-hidden>←</span> Return to Home
        </Link>
      </div>

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
              <ResonanceButton onClick={handleReveal} />
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
                <p className="text-sm italic leading-relaxed text-white/70">
                  &ldquo;{QUOTES[quoteIndex]}&rdquo;
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
            opacity: 0.88;
            box-shadow: 0 0 18px 2px rgba(217, 70, 239, 0.35);
          }
          50% {
            transform: scale(1.045);
            opacity: 1;
            box-shadow: 0 0 34px 8px rgba(103, 232, 249, 0.55);
          }
        }
        .btn-pulse {
          animation: pulseButton 2.8s ease-in-out infinite;
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
