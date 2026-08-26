'use client';

/**
 * LuckyGenerator.tsx
 * "Daily Resonance Ritual" — luckypickcanada.ca
 *
 * Pure digital entertainment / motivational novelty. No gambling affiliation,
 * no prizes. Deployed on Cloudflare Pages (Next.js + Tailwind).
 *
 * Cinematic Upgrade: Synchronized 8-second reveal with deterministic canvas timeline.
 */

import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
  useMemo,
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
  id: 2 | 3 | 4;
  name: string;
}

// ---------------------------------------------------------------------------
// Constants & Quotes
// ---------------------------------------------------------------------------

const STORAGE_KEY = 'luckyPickCanada:dailyResonance';

// Cinematic Timing
const REVEAL_DURATION_MS = 9500;
const TENSION_TIME_MS = 7000;
const IMPACT_TIME_MS = 7800;

const SPIN_INTERVAL_MS = 60;
const SPIN_INTERVAL_FAST_MS = 20;

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
// Helpers
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
    // Fail silently
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
// CountdownTimer (Hydration Safe)
// ---------------------------------------------------------------------------

const CountdownTimer = memo(function CountdownTimer() {
  const [mounted, setMounted] = useState(false);
  const [remainingMs, setRemainingMs] = useState(0);

  useEffect(() => {
    setMounted(true);
    setRemainingMs(msUntilLocalMidnight());
    const id = window.setInterval(() => {
      setRemainingMs(msUntilLocalMidnight());
    }, 1000);
    return () => window.clearInterval(id);
  }, []);

  if (!mounted) {
    return (
      <div className="flex flex-col items-center gap-1 select-none opacity-0">
        <span className="text-[10px] uppercase tracking-[0.2em]">Next resonance in</span>
        <span className="font-mono text-lg tabular-nums tracking-wider">00:00:00</span>
      </div>
    );
  }

  const totalSeconds = Math.max(0, Math.floor(remainingMs / 1000));
  const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, '0');
  const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0');
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
// Resonance button
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
// Canvas VFX engine & Interfaces
// ---------------------------------------------------------------------------

interface Star { x: number; y: number; r: number; phase: number; speed: number; baseAlpha: number; }
interface Mote { x: number; y: number; r: number; driftPhase: number; speed: number; hue: 'cyan' | 'purple'; }
interface Dust { x: number; y: number; r: number; vx: number; vy: number; life: number; maxLife: number; }
interface Meteor { x: number; y: number; vx: number; vy: number; len: number; width: number; trail: { x: number; y: number; alpha: number }[]; life: number; isHero?: boolean; }
interface BoltSegment { x: number; y: number; }
interface BoltBranch { segments: BoltSegment[]; branches: BoltBranch[]; thickness: number; }
interface Bolt { main: BoltBranch; age: number; life: number; isHero: boolean; }
interface Spark { x: number; y: number; vx: number; vy: number; color: string; age: number; life: number; size: number; trail: { x: number; y: number }[]; }
interface Rocket { x: number; y: number; vx: number; vy: number; color: string; trail: { x: number; y: number }[]; exploded: boolean; isHero: boolean; }

const FIREWORK_COLORS = ['255,100,100', '100,150,255', '120,255,160', '220,120,255', '255,220,100'];

function useResonanceCanvas(
  canvasRef: React.RefObject<HTMLCanvasElement>,
  phaseRef: React.MutableRefObject<Phase>,
  pendingTierRef: React.MutableRefObject<Tier | null>,
  revealStartTimeRef: React.MutableRefObject<number>,
  audioRefs: {
    buildUp: React.MutableRefObject<HTMLAudioElement | null>,
    meteor: React.MutableRefObject<HTMLAudioElement | null>,
    lightning: React.MutableRefObject<HTMLAudioElement | null>,
    firework: React.MutableRefObject<HTMLAudioElement | null>,
  },
  setDisplayScore: React.Dispatch<React.SetStateAction<number>>,
  setImpactFired: React.Dispatch<React.SetStateAction<boolean>>,
  pendingResultRef: React.MutableRefObject<{ score: number; quoteIndex: number; tier: Tier } | null>,
  trackTimeout: (handler: TimerHandler, timeout?: number) => number
) {
  const stateRef = useRef({
    stars: [] as Star[],
    motes: [] as Mote[],
    dust: [] as Dust[],
    meteors: [] as Meteor[],
    bolts: [] as Bolt[],
    sparks: [] as Spark[],
    rockets: [] as Rocket[],
    flash: 0,
    lastStartTime: 0,
    nextAmbientEffectAt: 0,
    impactTriggered: false,
    scoreLastUpdate: 0,
    scoreInterval: SPIN_INTERVAL_MS,
    bgGradientCache: null as CanvasGradient | null,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false }); // Optimize for no transparency on base canvas
    if (!ctx) return;

    const reduced = prefersReducedMotion();
    let width = 0; let height = 0;

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

      // Update background gradient cache
      const grad = ctx!.createRadialGradient(width / 2, height / 2, 0, width / 2, height / 2, Math.max(width, height) * 0.8);
      grad.addColorStop(0, '#0c102b'); // Deep indigo/navy core
      grad.addColorStop(1, '#03050b'); // Dark space black edges
      stateRef.current.bgGradientCache = grad;
    }
    resize();
    window.addEventListener('resize', resize);

    const s = stateRef.current;

    // Initialize stars
    if (s.stars.length === 0) {
      const starCount = reduced ? 50 : 200;
      for (let i = 0; i < starCount; i++) {
        s.stars.push({
          x: Math.random() * window.innerWidth,
          y: Math.random() * window.innerHeight,
          r: 0.2 + Math.random() * 1.5,
          phase: Math.random() * Math.PI * 2,
          speed: 0.5 + Math.random() * 1.5,
          baseAlpha: 0.2 + Math.random() * 0.8
        });
      }
    }

    if (s.motes.length === 0) {
      const count = reduced ? 20 : 45;
      for (let i = 0; i < count; i++) {
        s.motes.push({
          x: Math.random() * window.innerWidth, y: Math.random() * window.innerHeight,
          r: 0.6 + Math.random() * 2.0, driftPhase: Math.random() * Math.PI * 2,
          speed: 0.1 + Math.random() * 0.2, hue: Math.random() > 0.5 ? 'cyan' : 'purple',
        });
      }
    }

    // -----------------------------------------------------------------------
    // Canvas Generators
    // -----------------------------------------------------------------------
    
    function spawnDust(x: number, y: number, isHero: boolean = false) {
       if (s.dust.length > 150) return; // Strict particle limit
       const count = isHero ? randomInt(2, 5) : 1;
       for (let i = 0; i < count; i++) {
         if (s.dust.length > 150) break;
         s.dust.push({
           x, y,
           r: 0.5 + Math.random() * 2,
           vx: (Math.random() - 0.5) * (isHero ? 30 : 15),
           vy: (Math.random() - 0.5) * (isHero ? 30 : 15),
           life: 0,
           maxLife: 0.5 + Math.random() * 1.5
         });
       }
    }

    function generateBoltBranch(x: number, y: number, tx: number, ty: number, depth: number): BoltBranch {
      const dx = tx - x, dy = ty - y;
      const dist = Math.hypot(dx, dy);
      const segments: BoltSegment[] = [];
      let cx = x, cy = y;
      
      const stepSize = depth === 3 ? 15 : 25;
      const steps = Math.max(4, Math.floor(dist / stepSize));

      for(let i = 0; i <= steps; i++) {
          segments.push({x: cx, y: cy});
          if (i < steps) {
             const jitter = (depth * 10) + 5;
             cx += (dx / steps) + (Math.random() - 0.5) * jitter;
             cy += (dy / steps) + (Math.random() - 0.5) * jitter;
          }
      }
      segments.push({x: tx, y: ty});
      
      const branches: BoltBranch[] = [];
      if (depth > 0) {
          const numBranches = reduced ? 1 : randomInt(2, depth === 3 ? 5 : 3);
          for(let i = 0; i < numBranches; i++) {
              const idx = randomInt(1, segments.length - 2);
              if(!segments[idx]) continue;
              const pt = segments[idx];
              const angle = Math.atan2(dy, dx) + (Math.random() > 0.5 ? 1 : -1) * (0.5 + Math.random() * 1.5);
              const len = dist * (0.2 + Math.random() * 0.4);
              branches.push(generateBoltBranch(pt.x, pt.y, pt.x + Math.cos(angle) * len, pt.y + Math.sin(angle) * len, depth - 1));
          }
      }
      return { segments, branches, thickness: depth * 1.8 + 1 };
    }

    function spawnBolt(isHero: boolean) {
      const startX = isHero ? width * 0.5 + (Math.random() - 0.5) * 150 : width * (0.1 + Math.random() * 0.8);
      const targetX = startX + (Math.random() - 0.5) * width * (isHero ? 0.8 : 0.6);
      const depth = isHero ? 3 : randomInt(1, 2);
      const targetY = height * (isHero ? (0.8 + Math.random() * 0.3) : (0.5 + Math.random() * 0.4));

      const mainBranch = generateBoltBranch(startX, -50, targetX, targetY, depth);
      s.bolts.push({ main: mainBranch, age: 0, life: isHero ? 0.8 : (0.2 + Math.random() * 0.2), isHero });
      s.flash = isHero ? 1.5 : (s.flash + 0.4);
    }

    function spawnMeteor(isHero: boolean) {
      const startX = (Math.random() * 1.5 * width) - (width * 0.2);
      const startY = isHero ? (Math.random() * -300 - 100) : (Math.random() * -100 - 50);

      const speed = reduced ? 400 : (isHero ? 1200 + Math.random() * 600 : 600 + Math.random() * 400);
      const angle = (35 + Math.random() * 30) * (Math.PI / 180);

      s.meteors.push({
        x: startX, y: startY,
        vx: Math.cos(angle) * (startX > width * 0.8 ? -1 : 1) * speed,
        vy: Math.sin(angle) * speed,
        len: isHero ? 150 + Math.random() * 100 : 60 + Math.random() * 60,
        width: isHero ? 4 + Math.random() * 3 : 1.5 + Math.random() * 2,
        trail: [], life: 0, isHero
      });
    }

    function spawnRocket(isHero: boolean, xOverride?: number, speedOverride?: number) {
      const color = FIREWORK_COLORS[randomInt(0, FIREWORK_COLORS.length - 1)];
      const x = xOverride !== undefined ? xOverride : (isHero ? (width * 0.5 + (Math.random()-0.5)*300) : (width * (0.1 + Math.random() * 0.8)));
      s.rockets.push({
        x, y: height,
        vx: (Math.random() - 0.5) * (isHero ? 100 : 50),
        vy: speedOverride !== undefined ? -speedOverride : -(isHero ? 650 + Math.random()*200 : 450 + Math.random() * 150),
        color, trail: [], exploded: false, isHero
      });
    }

    function explode(x: number, y: number, color: string, isHero: boolean) {
      const count = reduced ? 15 : (isHero ? 80 : 25 + Math.floor(Math.random() * 15));
      // Cap sparks if we have too many
      let actualCount = Math.min(count, 150 - s.sparks.length);
      for (let i = 0; i < actualCount; i++) {
        const t = Math.random() * Math.PI * 2;
        const p = Math.acos(Math.random() * 2 - 1);
        const speed = (isHero ? 200 : 120) + Math.random() * (isHero ? 400 : 250);
        s.sparks.push({
          x, y,
          vx: speed * Math.sin(p) * Math.cos(t),
          vy: speed * Math.cos(p),
          color: Math.random() > (isHero ? 0.6 : 0.8) ? '255,255,255' : color,
          age: 0,
          life: (isHero ? 1.5 : 1.0) + Math.random() * 1.0,
          size: 1.5 + ((speed * Math.sin(p) * Math.sin(t)) / speed + 1) / 2 * (isHero ? 4.0 : 2.5),
          trail: []
        });
      }
      if (isHero) s.flash = Math.max(s.flash, 0.4);
    }

    // -----------------------------------------------------------------------
    // Render Loop
    // -----------------------------------------------------------------------

    let raf = 0;
    let last = performance.now();
    let hidden = false;
    function onVisibility() { hidden = document.hidden; if (!hidden) last = performance.now(); }
    document.addEventListener('visibilitychange', onVisibility);

    function frame(now: number) {
      raf = requestAnimationFrame(frame);
      if (hidden) { last = now; return; }
      const dt = Math.min((now - last) / 1000, 1 / 30);
      last = now;

      // Handle Reset from React state
      const currentStart = revealStartTimeRef.current;
      if (currentStart !== s.lastStartTime) {
        s.lastStartTime = currentStart;
        s.impactTriggered = false;
        s.flash = 0;
        s.scoreInterval = SPIN_INTERVAL_MS;
        s.scoreLastUpdate = now;
        s.meteors = []; s.bolts = []; s.rockets = []; s.sparks = []; s.dust = [];
      }

      // Draw Background
      ctx!.globalCompositeOperation = 'source-over';
      if (s.bgGradientCache) {
          ctx!.fillStyle = s.bgGradientCache;
      } else {
          ctx!.fillStyle = '#0c102b';
      }
      ctx!.fillRect(0, 0, width, height);

      const phase = phaseRef.current;
      const tier = pendingTierRef.current;
      let globalIntensity = 0;
      let tReveal = 0;

      // Cinematic Timeline Logic
      if (phase === 'revealing') {
        tReveal = now - currentStart;
        
        // 0 - 7000: Build up
        if (tReveal < TENSION_TIME_MS) {
          globalIntensity = tReveal / TENSION_TIME_MS;
          if (now - s.scoreLastUpdate > s.scoreInterval) {
             setDisplayScore(randomInt(0, 100));
             s.scoreLastUpdate = now;
          }
          if (tReveal > 5500 && tier && now > s.nextAmbientEffectAt) {
            if (tier.id === 2 && Math.random() > 0.5) spawnMeteor(false);
            if (tier.id === 3 && Math.random() > 0.6) spawnBolt(false);
            if (tier.id === 4 && Math.random() > 0.7) spawnRocket(false);
            s.nextAmbientEffectAt = now + 400 + Math.random() * 400;
          }
        } 
        // 7000 - 7800: Final Tension
        else if (tReveal >= TENSION_TIME_MS && tReveal < IMPACT_TIME_MS) {
          globalIntensity = 1.5;
          s.scoreInterval = SPIN_INTERVAL_FAST_MS;

          if (now - s.scoreLastUpdate > s.scoreInterval) {
             setDisplayScore(randomInt(0, 100));
             s.scoreLastUpdate = now;
          }

          // Audio fade
          const audio = audioRefs.buildUp.current;
          if (audio) {
             // Linear fade from 1 to 0 over the 800ms
             const fadeProgress = (tReveal - TENSION_TIME_MS) / (IMPACT_TIME_MS - TENSION_TIME_MS);
             audio.volume = Math.max(0, 1 - fadeProgress);
          }

          // Darken slightly
          ctx!.fillStyle = `rgba(0,0,0,${((tReveal - TENSION_TIME_MS) / (IMPACT_TIME_MS - TENSION_TIME_MS)) * 0.4})`;
          ctx!.fillRect(0, 0, width, height);
        }
        // 7800: THE IMPACT
        else if (tReveal >= IMPACT_TIME_MS && !s.impactTriggered) {
          s.impactTriggered = true;
          setImpactFired(true); // Triggers CSS
          s.flash = 1.0;

          if (pendingResultRef.current) {
             setDisplayScore(pendingResultRef.current.score);
          }

          const audio = audioRefs.buildUp.current;
          if (audio) {
             audio.volume = 0;
             audio.pause();
          }

          if (tier) {
            if (tier.id === 2) {
              const a = audioRefs.meteor.current; if (a) { a.currentTime = 0; a.play().catch(()=>{}); }
              const clusterSize = reduced ? 4 : 15;
              for(let i=0; i<clusterSize; i++) {
                trackTimeout(() => spawnMeteor(true), Math.random() * 400); // Small deviation fine here
              }
              const speed = 1800;
              const angle = 45 * (Math.PI / 180);
              s.meteors.push({
                x: width * 0.2, y: -200,
                vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
                len: 300, width: 8, trail: [], life: 0, isHero: true
              });
            }
            else if (tier.id === 3) {
              const a = audioRefs.lightning.current; if (a) { a.currentTime = 0; a.play().catch(()=>{}); }
              spawnBolt(true);
              trackTimeout(() => spawnBolt(true), 150);
              spawnBolt(false);
            }
            else if (tier.id === 4) {
              const a = audioRefs.firework.current; if (a) { a.currentTime = 0; a.play().catch(()=>{}); }
              spawnRocket(true, width * 0.5, 750);
              trackTimeout(() => spawnRocket(true, width * 0.3, 600), 100);
              trackTimeout(() => spawnRocket(true, width * 0.7, 600), 150);
              trackTimeout(() => spawnRocket(true, width * 0.4, 700), 250);
              trackTimeout(() => spawnRocket(true, width * 0.6, 700), 300);
              trackTimeout(() => spawnRocket(true, width * 0.5, 850), 450);
            }
          }
        }
      } else if (phase === 'locked') {
        globalIntensity = 1.0;
        if (tier && now > s.nextAmbientEffectAt) {
          if (tier.id === 2) { spawnMeteor(false); s.nextAmbientEffectAt = now + (reduced ? 2500 : 1500 + Math.random()*1000); }
          if (tier.id === 3) { spawnBolt(false); s.nextAmbientEffectAt = now + (reduced ? 2000 : 800 + Math.random()*1500); }
          if (tier.id === 4) { 
             const burst = randomInt(1, 3);
             for(let i=0; i<burst; i++) spawnRocket(false);
             s.nextAmbientEffectAt = now + (reduced ? 4000 : 2500 + Math.random()*2000); 
          }
        }
      } else {
        globalIntensity = 0.2;
      }

      // Draw Stars
      ctx!.globalCompositeOperation = 'source-over';
      for (let i = 0; i < s.stars.length; i++) {
         const star = s.stars[i];
         star.phase += dt * star.speed;
         // Twinkle logic
         const alpha = star.baseAlpha + Math.sin(star.phase) * 0.3;
         if (alpha > 0) {
             ctx!.fillStyle = `rgba(255, 255, 255, ${Math.min(1, alpha)})`;
             ctx!.beginPath();
             ctx!.arc(star.x | 0, star.y | 0, star.r, 0, Math.PI * 2);
             ctx!.fill();
         }
      }

      ctx!.globalCompositeOperation = 'lighter';

      // Draw Motes
      for (const m of s.motes) {
        m.driftPhase += dt * m.speed * (1 + globalIntensity * 2); 
        m.y -= dt * (4 + globalIntensity * 10); 
        if (m.y < -20) m.y = height + 20;
        const x = (m.x + Math.sin(m.driftPhase) * 14) | 0;
        const y = m.y | 0;
        const baseAlpha = phase === 'idle' ? 0.3 : Math.min(0.8, 0.3 + globalIntensity * 0.5);
        const glow = ctx!.createRadialGradient(x, y, 0, x, y, m.r * 6);
        glow.addColorStop(0, `rgba(${m.hue === 'cyan' ? '120,220,255' : '170,120,255'},${baseAlpha})`);
        glow.addColorStop(1, 'rgba(0,0,0,0)');
        ctx!.fillStyle = glow; ctx!.beginPath(); ctx!.arc(x, y, m.r * 6, 0, Math.PI * 2); ctx!.fill();
      }

      // Dust
      for (let i = s.dust.length - 1; i >= 0; i--) { 
        const d = s.dust[i]; d.life += dt; d.x += d.vx * dt; d.y += d.vy * dt; 
        ctx!.fillStyle = `rgba(200,220,255,${Math.max(0, 1 - d.life / d.maxLife) * 0.6})`; 
        ctx!.fillRect((d.x - d.r) | 0, (d.y - d.r) | 0, (d.r * 2) | 0, (d.r * 2) | 0);
        if (d.life > d.maxLife) s.dust.splice(i, 1); 
      }

      // Draw Meteors
      for (let i = s.meteors.length - 1; i >= 0; i--) { 
        const m = s.meteors[i]; m.life += dt; m.x += m.vx * dt; m.y += m.vy * dt; 
        m.trail.unshift({ x: m.x, y: m.y, alpha: 1.0 }); 
        if (m.trail.length > (m.isHero ? 35 : 20)) m.trail.pop();
        
        ctx!.beginPath(); 
        m.trail.forEach((t, j) => { 
          t.alpha *= 0.88;
          const progress = j / m.trail.length;
          ctx!.strokeStyle = m.isHero
             ? `rgba(140,220,255,${t.alpha * (1 - progress)})`
             : `rgba(180,210,255,${t.alpha * (1 - progress)})`;
          ctx!.lineWidth = m.width * Math.max(0.1, 1 - progress);
          ctx!.lineCap = 'round';
          j === 0 ? ctx!.moveTo(t.x | 0, t.y | 0) : ctx!.lineTo(t.x | 0, t.y | 0);
        }); 
        ctx!.stroke(); 
        
        const coreSize = m.isHero ? (m.width > 5 ? 24 : 18) : 10;
        const cx = m.x | 0; const cy = m.y | 0;
        const glow = ctx!.createRadialGradient(cx, cy, 0, cx, cy, coreSize);
        glow.addColorStop(0, 'rgba(255,255,255,1.0)'); 
        glow.addColorStop(0.2, m.isHero ? 'rgba(200,240,255,1.0)' : 'rgba(220,240,255,0.9)');
        glow.addColorStop(0.5, m.isHero ? 'rgba(100,180,255,0.6)' : 'rgba(150,200,255,0.4)');
        glow.addColorStop(1, 'rgba(100,180,255,0)');
        ctx!.fillStyle = glow; ctx!.beginPath(); ctx!.arc(cx, cy, coreSize, 0, Math.PI * 2); ctx!.fill();
        
        if (m.isHero && Math.random() > 0.6) {
           spawnDust(m.x, m.y, true);
        }

        if (m.y > height + 200 || m.x < -200 || m.x > width + 200) s.meteors.splice(i, 1);
      }

      // Draw Lightning Bolts
      function drawBranch(branch: BoltBranch, alpha: number, isGlow: boolean) {
         ctx!.beginPath();
         ctx!.lineWidth = isGlow ? branch.thickness * 5 : branch.thickness;
         ctx!.strokeStyle = isGlow
             ? `rgba(160,80,255,${alpha * 0.45})`
             : `rgba(220,240,255,${alpha})`;
         ctx!.lineJoin = 'miter';
         branch.segments.forEach((p, idx) => idx === 0 ? ctx!.moveTo(p.x | 0, p.y | 0) : ctx!.lineTo(p.x | 0, p.y | 0));
         ctx!.stroke();
         branch.branches.forEach(b => drawBranch(b, alpha, isGlow));
      }

      for (let i = s.bolts.length - 1; i >= 0; i--) { 
        const bolt = s.bolts[i]; 
        bolt.age += dt; 

        const alpha = bolt.isHero 
           ? Math.max(0, 1 - (bolt.age / bolt.life)) * (Math.random() > 0.15 ? 1 : 0.1)
           : Math.max(0, 1 - (bolt.age / bolt.life)); 
        
        if (alpha <= 0) { s.bolts.splice(i, 1); continue; } 

        drawBranch(bolt.main, alpha, true);
        if (bolt.isHero && alpha > 0.3) {
            ctx!.beginPath();
            ctx!.lineWidth = bolt.main.thickness * 2;
            ctx!.strokeStyle = `rgba(100,200,255,${alpha * 0.8})`;
            bolt.main.segments.forEach((p, idx) => idx === 0 ? ctx!.moveTo(p.x | 0, p.y | 0) : ctx!.lineTo(p.x | 0, p.y | 0));
            ctx!.stroke();
        }
        drawBranch(bolt.main, alpha, false);
      }

      // Draw Fireworks & Sparks
      for (let i = s.rockets.length - 1; i >= 0; i--) { 
        const r = s.rockets[i]; r.vy += 260 * dt; r.vx *= 1 - dt * 0.2; r.x += r.vx * dt; r.y += r.vy * dt; 
        r.trail.unshift({ x: r.x, y: r.y }); if (r.trail.length > (r.isHero ? 20 : 15)) r.trail.pop();
        
        ctx!.beginPath(); 
        r.trail.forEach((t, j) => { 
          const progress = j / r.trail.length;
          ctx!.strokeStyle = `rgba(255,200,100,${1 - progress})`;
          ctx!.lineWidth = (r.isHero ? 5 : 3) * (1 - progress);
          ctx!.lineCap = 'round';
          j === 0 ? ctx!.moveTo(t.x | 0, t.y | 0) : ctx!.lineTo(t.x | 0, t.y | 0);
        }); 
        ctx!.stroke(); 
        
        if (Math.random() > 0.5) spawnDust(r.x, r.y);

        if (r.vy >= -50 || r.y < height * (r.isHero ? 0.15 : 0.3)) {
          explode(r.x, r.y, r.color, r.isHero); 
          r.exploded = true; 
        } 
        if (r.exploded || r.y < -20) s.rockets.splice(i, 1); 
      }

      for (let i = s.sparks.length - 1; i >= 0; i--) { 
        const sp = s.sparks[i]; sp.age += dt; sp.vy += 120 * dt; sp.vx *= 1 - dt * 0.7; sp.vy *= 1 - dt * 0.4; 
        sp.x += sp.vx * dt; sp.y += sp.vy * dt; sp.trail.unshift({ x: sp.x, y: sp.y }); 
        if (sp.trail.length > (reduced ? 8 : 12)) sp.trail.pop();
        
        const alpha = Math.max(0, 1 - Math.pow(sp.age / sp.life, 2));
        if (alpha <= 0) { s.sparks.splice(i, 1); continue; } 
        
        ctx!.beginPath(); 
        sp.trail.forEach((t, j) => { 
          const progress = j / sp.trail.length;
          ctx!.strokeStyle = `rgba(${sp.color},${alpha * (1 - progress)})`;
          ctx!.lineWidth = sp.size * (1 - progress);
          ctx!.lineCap = 'round';
          j === 0 ? ctx!.moveTo(t.x | 0, t.y | 0) : ctx!.lineTo(t.x | 0, t.y | 0);
        }); 
        ctx!.stroke(); 
        
        const cx = sp.x | 0; const cy = sp.y | 0;
        const glow = ctx!.createRadialGradient(cx, cy, 0, cx, cy, sp.size * 3);
        glow.addColorStop(0, `rgba(${sp.color},${alpha})`); 
        glow.addColorStop(1, 'rgba(0,0,0,0)'); 
        ctx!.fillStyle = glow; ctx!.beginPath(); ctx!.arc(cx, cy, sp.size * 3, 0, Math.PI * 2); ctx!.fill();

        if (sp.size > 2.5 && Math.random() > 0.8) {
           spawnDust(sp.x, sp.y);
        }
      }

      // Master Flash
      if (s.flash > 0) {
        ctx!.fillStyle = `rgba(255, 255, 255, ${s.flash * 0.8})`;
        ctx!.fillRect(0, 0, width, height);
        s.flash = Math.max(0, s.flash - dt * (s.flash > 0.5 ? 2.5 : 1.0));
      }

    }

    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [canvasRef, phaseRef, pendingTierRef, revealStartTimeRef, audioRefs, setDisplayScore, setImpactFired, pendingResultRef]);
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function LuckyGenerator() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const buildUpAudioRef = useRef<HTMLAudioElement | null>(null);
  const meteorAudioRef = useRef<HTMLAudioElement | null>(null);
  const lightningAudioRef = useRef<HTMLAudioElement | null>(null);
  const fireworkAudioRef = useRef<HTMLAudioElement | null>(null);

  const audioRefs = useMemo(() => ({
      buildUp: buildUpAudioRef,
      meteor: meteorAudioRef,
      lightning: lightningAudioRef,
      firework: fireworkAudioRef
  }), []);

  const [phase, setPhase] = useState<Phase>('idle');
  const [score, setScore] = useState<number | null>(null);
  const [displayScore, setDisplayScore] = useState(0);
  const [quoteIndex, setQuoteIndex] = useState<number | null>(null);
  const [shareStatus, setShareStatus] = useState<'idle' | 'copied'>('idle');
  
  const [impactFired, setImpactFired] = useState(false);

  const pendingResultRef = useRef<{ score: number; quoteIndex: number; tier: Tier } | null>(null);
  const phaseRef = useRef<Phase>('idle');
  const pendingTierRef = useRef<Tier | null>(null);
  const revealStartTimeRef = useRef<number>(0);

  const timeoutIds = useRef<number[]>([]);
  const intervalIds = useRef<number[]>([]);

  const trackTimeout = useCallback((handler: TimerHandler, timeout?: number) => {
      const id = window.setTimeout(handler, timeout);
      timeoutIds.current.push(id);
      return id;
  }, []);

  const clearAllTimers = useCallback(() => {
      timeoutIds.current.forEach(window.clearTimeout);
      timeoutIds.current = [];
      intervalIds.current.forEach(window.clearInterval);
      intervalIds.current = [];
  }, []);

  useEffect(() => {
    buildUpAudioRef.current = new Audio(BUILDUP_SOUND);
    meteorAudioRef.current = new Audio(METEOR_SOUNDS[0]);
    lightningAudioRef.current = new Audio(LIGHTNING_SOUNDS[0]);
    fireworkAudioRef.current = new Audio(FIREWORKS_SOUNDS[0]);

    [buildUpAudioRef.current, meteorAudioRef.current, lightningAudioRef.current, fireworkAudioRef.current].forEach(a => { if (a) a.preload = 'auto'; });

    const stored = readStoredResonance();
    if (stored && stored.lastSpinDate === getLocalDateKey()) {
      const storedTier = getTier(stored.lastScore);
      setScore(stored.lastScore);
      setDisplayScore(stored.lastScore);
      setQuoteIndex(stored.lastQuoteIndex);
      setPhase('locked');
      phaseRef.current = 'locked';
      pendingTierRef.current = storedTier;
    }

    return () => {
      [buildUpAudioRef.current, meteorAudioRef.current, lightningAudioRef.current, fireworkAudioRef.current].forEach(a => {
        if (a) { a.pause(); a.src = ''; }
      });
      clearAllTimers();
    };
  }, [clearAllTimers]);

  const handleReveal = useCallback(() => {
    if (phase !== 'idle') return;

    // Silent Audio Unlock for Android
    [meteorAudioRef.current, lightningAudioRef.current, fireworkAudioRef.current].forEach(audio => {
      if (!audio) return;
      audio.muted = true;
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.then(() => {
          audio.pause();
          audio.currentTime = 0;
          audio.muted = false; 
        }).catch(() => { audio.muted = false; });
      }
    });

    if (buildUpAudioRef.current) {
      buildUpAudioRef.current.loop = false; 
      buildUpAudioRef.current.volume = 1.0;
      buildUpAudioRef.current.currentTime = 0;
      buildUpAudioRef.current.play().catch(() => {});
    }

    const previous = readStoredResonance();
    const { score: newScore, quoteIndex: newQuoteIndex } = generateTodaysResonance(previous);
    const newTier = getTier(newScore);

    pendingResultRef.current = { score: newScore, quoteIndex: newQuoteIndex, tier: newTier };
    pendingTierRef.current = newTier;
    revealStartTimeRef.current = performance.now();
    
    setDisplayScore(0);
    setPhase('revealing');
    phaseRef.current = 'revealing';
    setImpactFired(false);

    // LOCK POINT: Write storage, switch UI to full final state seamlessly during the afterglow
    trackTimeout(() => {
      const pending = pendingResultRef.current;
      if (!pending) return;

      writeStoredResonance({
        lastSpinDate: getLocalDateKey(),
        lastScore: pending.score,
        lastQuoteIndex: pending.quoteIndex,
      });

      setScore(pending.score);
      setQuoteIndex(pending.quoteIndex);
      setPhase('locked');
      phaseRef.current = 'locked';
      pendingResultRef.current = null;
    }, REVEAL_DURATION_MS);
  }, [phase, trackTimeout]);

  const handleShare = useCallback(async () => {
    const finalTier = pendingTierRef.current;
    const text = finalTier && score !== null ? `My Daily Resonance today is ${score}% — ${finalTier.name} ✨ luckypickcanada.ca` : 'luckypickcanada.ca';
    try {
      if (typeof navigator !== 'undefined' && navigator.share) {
        await navigator.share({ title: 'Lucky Pick Canada', text, url: window.location.href });
        return;
      }
    } catch {}
    try {
      await navigator.clipboard.writeText(text);
      setShareStatus('copied');
      window.setTimeout(() => setShareStatus('idle'), 2200);
    } catch {}
  }, [score]);

  useResonanceCanvas(
      canvasRef, phaseRef, pendingTierRef, revealStartTimeRef,
      audioRefs, setDisplayScore, setImpactFired, pendingResultRef,
      trackTimeout
  );

  const pulseClass = phase === 'idle'
     ? 'card-pulse-idle'
     : phase === 'revealing'
        ? (impactFired ? 'card-pulse-impact' : 'card-pulse-reveal')
        : 'card-pulse-locked';
  const tierName = pendingTierRef.current?.name || '';

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#05040e] text-white">
      {/* 1. Deep Space Base Layer is now drawn by canvas directly */}
      
      {/* 2. Ambient Nebula Glows */}
      <div
        className="fixed inset-0 -z-10 transition-opacity duration-1000"
        style={{
          opacity: phase === 'revealing' && !impactFired ? 0.3 : 1, // Dims during build-up tension
          background:
            'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(76,29,149,0.55), transparent 60%), ' +
            'radial-gradient(ellipse 70% 50% at 85% 90%, rgba(8,47,73,0.6), transparent 60%), ' +
            'radial-gradient(ellipse 60% 60% at 10% 85%, rgba(20,83,45,0.18), transparent 55%)'
        }}
      />

      <canvas ref={canvasRef} className="fixed inset-0 w-full h-full pointer-events-none -z-20" />

      <div className="relative z-10 flex justify-start p-4 pt-12 sm:pt-6">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/60 backdrop-blur-md transition hover:border-white/20 hover:text-white/90 cursor-default"
        >
          <span aria-hidden>←</span> Return to Home
        </Link>
      </div>

      <main className="relative z-10 flex min-h-[80vh] items-center justify-center px-4 pb-12">
        <div
          className={`card-pulse ${pulseClass} w-[92%] max-w-sm rounded-2xl border-t border-white/15 bg-black/40 p-6 text-center backdrop-blur-xl motion-reduce:animate-none transition-all duration-500`}
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
            <div className="flex flex-col items-center gap-5 py-4 min-h-[200px] justify-center">
              <p className={`text-xs uppercase tracking-[0.3em] text-cyan-200/80 transition-opacity duration-300 ${impactFired ? 'opacity-0' : 'animate-pulse'}`}>
                THE SKY IS ANSWERING...
              </p>
              <div className="relative flex items-center justify-center">
                {!impactFired && (
                  <>
                    <div className="waveform-ripple ripple-1 absolute inset-0 rounded-full border-2 border-cyan-300/40" />
                    <div className="waveform-ripple ripple-2 absolute inset-0 rounded-full border-2 border-fuchsia-400/30" />
                    <div className="waveform-ripple ripple-3 absolute inset-0 rounded-full border-2 border-cyan-200/20" />
                  </>
                )}
                
                <div className={`tabular-nums transition-all duration-300 ease-out flex flex-col items-center
                  ${impactFired 
                    ? 'text-8xl font-bold text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-cyan-50 scale-110 drop-shadow-[0_0_40px_rgba(255,255,255,1)] brightness-150'
                    : 'text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-b from-white to-cyan-200/80 scale-100'}`}
                >
                  {impactFired && (
                    <span className="text-[10px] uppercase tracking-[0.35em] text-white/90 mb-2 block animate-fade-in-up">
                      {tierName}
                    </span>
                  )}
                  {displayScore}%
                </div>
              </div>
            </div>
          )}

          {phase === 'locked' && score !== null && (
            <div className="flex flex-col items-center gap-4 py-2 animate-fade-in">
              <p className="text-xs uppercase tracking-[0.35em] text-fuchsia-200/80">
                {tierName}
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
          0%, 100% { transform: scale(1); opacity: 0.88; box-shadow: 0 0 18px 2px rgba(217, 70, 239, 0.35); }
          50% { transform: scale(1.045); opacity: 1; box-shadow: 0 0 34px 8px rgba(103, 232, 249, 0.55); }
        }
        .btn-pulse { animation: pulseButton 2.8s ease-in-out infinite; }
        
        @keyframes pulseIdle {
          0%, 100% { transform: scale(1); box-shadow: 0 0 30px 6px rgba(139, 92, 246, 0.22); }
          50% { transform: scale(1.012); box-shadow: 0 0 48px 10px rgba(103, 232, 249, 0.28); }
        }
        @keyframes pulseReveal {
          0%, 100% { transform: scale(1.01); box-shadow: 0 0 40px 10px rgba(217, 70, 239, 0.3); }
          50% { transform: scale(1.03); box-shadow: 0 0 80px 20px rgba(103, 232, 249, 0.6); }
        }
        @keyframes pulseImpact {
          0% { transform: scale(1.05); box-shadow: 0 0 120px 40px rgba(255, 255, 255, 0.8), inset 0 0 40px 10px rgba(255,255,255,0.4); background-color: rgba(255,255,255,0.15); }
          100% { transform: scale(1); box-shadow: 0 0 70px 18px rgba(139, 92, 246, 0.28); }
        }
        @keyframes pulseLocked {
          0%, 100% { transform: scale(1); box-shadow: 0 0 70px 18px rgba(139, 92, 246, 0.28); }
          50% { transform: scale(1.018); box-shadow: 0 0 140px 36px rgba(250, 204, 21, 0.24); }
        }
        .card-pulse { will-change: transform, box-shadow, background-color; }
        .card-pulse-idle { animation: pulseIdle 4.2s ease-in-out infinite; }
        .card-pulse-reveal { animation: pulseReveal 1.5s ease-in-out infinite; }
        .card-pulse-impact { animation: pulseImpact 1.5s ease-out forwards; }
        .card-pulse-locked { animation: pulseLocked 5.6s ease-in-out infinite; }
        
        @keyframes waveformRipple {
          0% { transform: scale(0.8); opacity: 1; }
          100% { transform: scale(2.5); opacity: 0; }
        }
        .waveform-ripple { animation: waveformRipple 2s cubic-bezier(0.1, 0.5, 0.3, 1) infinite; pointer-events: none; }
        .ripple-1 { animation-delay: 0s; }
        .ripple-2 { animation-delay: 0.6s; }
        .ripple-3 { animation-delay: 1.2s; }

        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up { animation: fadeInUp 0.4s ease-out forwards; }
        
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fade-in { animation: fadeIn 0.4s ease-out forwards; }
      `}</style>
    </div>
  );
}
