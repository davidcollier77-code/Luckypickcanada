'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';

import ResonanceButton from './ResonanceButton';

const LUCKY_QUOTES = [
  "Deep as the Great Lakes and bright as the winter snow, your resonance is strong.",
  "Like an Inukshuk guiding the way, good fortune is pointing directly at you.",
  "The northern lights dance in your favor today; trust the journey ahead.",
  "As steadfast as the Rocky Mountains, your patience will bring reward.",
  "A fresh breeze from the Pacific brings clarity and new opportunities.",
  "Energy flows like the mighty St. Lawrence—steady, powerful, and unstoppable.",
  "Golden fields under wide prairie skies remind you that abundance is near.",
  "Like maple sap rising in spring, your potential is ready to sweeten the day."
];


// Audio Buffers Cache
const audioBuffers: Record<string, AudioBuffer | null> = {
  buildup: null,
  'Meteor Shower': null,
  'Cosmic Lightning': null,
  'Fireworks': null,
};

const loadAudioBuffer = async (ctx: AudioContext, url: string): Promise<AudioBuffer | null> => {
  try {
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    return await ctx.decodeAudioData(arrayBuffer);
  } catch (err) {
    console.error('Failed to load audio:', url, err);
    return null;
  }
};

const preloadAllAudio = async (ctx: AudioContext) => {
  if (!audioBuffers.buildup) {
    audioBuffers.buildup = await loadAudioBuffer(ctx, '/freesound_community-starship-rail-gun-charge-35904.mp3');
  }
  if (!audioBuffers['Meteor Shower']) {
    audioBuffers['Meteor Shower'] = await loadAudioBuffer(ctx, '/dragon-studio-whoosh-cinematic-376875.mp3');
  }
  if (!audioBuffers['Cosmic Lightning']) {
    audioBuffers['Cosmic Lightning'] = await loadAudioBuffer(ctx, '/yodguard-lightning-magic-3-378649.mp3');
  }
  if (!audioBuffers['Fireworks']) {
    audioBuffers['Fireworks'] = await loadAudioBuffer(ctx, '/freesound_community-fireworks-1-94483.mp3');
  }
};

const playBuffer = (ctx: AudioContext, buffer: AudioBuffer | null, volume: number = 1.0) => {
  if (!buffer) return null;
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  const gainNode = ctx.createGain();
  gainNode.gain.value = volume;
  source.connect(gainNode);
  gainNode.connect(ctx.destination);
  source.start(0);
  source.onended = () => {
    source.disconnect();
    gainNode.disconnect();
  };
  return { source, gainNode };
};

export default function DailyResonance() {
  const [percentage, setPercentage] = useState(0);
  const [displayPercentage, setDisplayPercentage] = useState(0);
  const [quote, setQuote] = useState("");
  const [isRevealed, setIsRevealed] = useState(false);
  const [isRevealing, setIsRevealing] = useState(false);
  const [tier, setTier] = useState<string>("");
  const [isLockedOut, setIsLockedOut] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState('');

  const [totalVisits, setTotalVisits] = useState<number | null>(null);

  const [audioCtx, setAudioCtx] = useState<AudioContext | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>(0);
  const sequenceRef = useRef<number>(0);
  const isAnimatingRef = useRef(false);
  const bgCanvasRef = useRef<HTMLCanvasElement>(null);
  const bgRequestRef = useRef<number>(0);
  const activeAudioNodesRef = useRef<any[]>([]);

  const lastAudioTimeRef = useRef<number>(0);
  const initAudio = () => {
    let ctx = audioCtx;
    if (!ctx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      ctx = new AudioContextClass();
      setAudioCtx(ctx);
    }
    if (ctx.state === 'suspended') {
      ctx.resume();
    }
    return ctx;
  };


  // Check for daily lockout on mount
  useEffect(() => {
    const lastDate = localStorage.getItem('lucky_lastDate');
    const today = new Date().toLocaleDateString();

    if (lastDate === today) {
      const lastPct = localStorage.getItem('lucky_lastPct');
      const lastQuoteIdx = localStorage.getItem('lucky_lastQuote');

      if (lastPct && lastQuoteIdx) {
        setIsLockedOut(true);
        setPercentage(parseInt(lastPct, 10));
        setDisplayPercentage(parseInt(lastPct, 10));
        const quoteIdx = parseInt(lastQuoteIdx, 10);
        setQuote(LUCKY_QUOTES[quoteIdx] || LUCKY_QUOTES[0]);

        const pct = parseInt(lastPct, 10);
        if (pct <= 33) setTier('Meteor Shower');
        else if (pct <= 66) setTier('Cosmic Lightning');
        else setTier('Fireworks');

        setIsRevealed(true);
      }
    }
  }, []);

  // Timer logic for countdown until midnight local time
  useEffect(() => {
    if (!isLockedOut && !isRevealed) return;

    const calculateTimeRemaining = () => {
      const now = new Date();
      const midnight = new Date();
      midnight.setHours(24, 0, 0, 0); // Midnight tonight

      const diff = midnight.getTime() - now.getTime();

      const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeRemaining(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`);
    };

    calculateTimeRemaining(); // initial call
    const timer = setInterval(calculateTimeRemaining, 1000);

    return () => clearInterval(timer);
  }, [isLockedOut, isRevealed]);

  const handleReveal = async () => {
    const ctx = initAudio();
    // Prevent concurrent sequences
    if (isAnimatingRef.current) return;
    if (isRevealed) return;
    if (isLoading) return;
    if (isRevealing) return;

    isAnimatingRef.current = true;
    setIsLoading(true);
    setIsRevealing(true);

    // Clear previous audio nodes
    // Increment visit counter on explicit user action (spinning the meter)
    fetch('/api/visits', { method: 'POST' })
      .then((res) => res.json())
      .then((data) => {
        if (data && typeof data.visits === 'number') {
          setTotalVisits(data.visits);
        }
      })
      .catch((err) => console.error("Failed to update visits:", err));

    activeAudioNodesRef.current = [];

    // Cancel any previous animation sequence
    if (sequenceRef.current) cancelAnimationFrame(sequenceRef.current);

    // Instant pre-roll visual feedback
    setDisplayPercentage(0);

    // Collision Prevention Logic
    const lastPct = localStorage.getItem('lucky_lastPct');
    const lastQuote = localStorage.getItem('lucky_lastQuote');
    let newPct, newQuoteIdx;

    do {
      newPct = Math.floor(Math.random() * 101);
    } while (newPct.toString() === lastPct);

    do {
      newQuoteIdx = Math.floor(Math.random() * LUCKY_QUOTES.length);
    } while (newQuoteIdx.toString() === lastQuote);

    // We set the date to localStorage here to lockout immediately
    const today = new Date().toLocaleDateString();
    localStorage.setItem('lucky_lastDate', today);
    localStorage.setItem('lucky_lastPct', newPct.toString());
    localStorage.setItem('lucky_lastQuote', newQuoteIdx.toString());
    // setIsLockedOut shouldn't be called until the animation sequence finishes,
    // or we can call it now, and the UI handles it based on isRevealed and isRevealing.
    // wait, we shouldn't change isLockedOut yet, otherwise the view might jump.

    // Store but do not reveal yet
    setPercentage(newPct);

    // Determine 3 Tiers
    let currentTier = '';
    if (newPct <= 33) currentTier = 'Meteor Shower';
    else if (newPct <= 66) currentTier = 'Cosmic Lightning';
    else currentTier = 'Fireworks';

    // Preload audio first
    try {
      await preloadAllAudio(ctx);
    } finally {
      setIsLoading(false);
    }

    // Play buildup exactly at 0s
    const buildupNode = playBuffer(ctx, audioBuffers.buildup);
    if (buildupNode) activeAudioNodesRef.current.push(buildupNode);

    // Strict 9 second cinematic sequence
    const SEQUENCE_DURATION = 9000;
    const IMPACT_TIME = 8800; // 8.8s frame for impact
    const TENSION_TIME = 7500; // 7.5s tension shift

    let startTime: number | null = null;
    let impactPlayed = false;
    let finalTierSet = false;


    const sequenceLoop = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;

      // Update displayed number based on phase
      if (elapsed < TENSION_TIME) {
        // Standard score roll build-up (0.0 - 7.5s)
        setDisplayPercentage(Math.floor(Math.random() * 101));
      } else if (elapsed < IMPACT_TIME) {
        // High-speed tension roll (7.5 - 8.8s)
        setDisplayPercentage(Math.floor(Math.random() * 101));
      } else {
        // Final locked value
        setDisplayPercentage(newPct);
      }

      // Impact Frame (8.8s)
      if (elapsed >= IMPACT_TIME && !impactPlayed) {
        impactPlayed = true;
        // Trigger exact tier audio instantly without latency
        const impactNode = playBuffer(ctx, audioBuffers[currentTier]);
        if (impactNode) activeAudioNodesRef.current.push(impactNode);
      }

      // Impact Frame UI Transition (8.8s)
      if (elapsed >= IMPACT_TIME && !finalTierSet) {
        finalTierSet = true;
        setTier(currentTier);
        setQuote(LUCKY_QUOTES[newQuoteIdx]);
        setIsRevealed(true);
        setIsRevealing(false);
      }
      if (elapsed < SEQUENCE_DURATION) {
         sequenceRef.current = requestAnimationFrame(sequenceLoop);
      } else {
         setDisplayPercentage(newPct); // Ensure final state
         isAnimatingRef.current = false;
      }
    };

    sequenceRef.current = requestAnimationFrame(sequenceLoop);
  };

  const handleShare = async () => {
    const shareText = `My Daily Resonance is ${percentage}%! '${quote}' Discover your daily fortune at luckypickcanada.ca (For entertainment purposes only).`;
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: 'My Daily Resonance',
          text: shareText,
          url: 'https://luckypickcanada.ca/lucky-meter'
        });
      } catch (err) {
        console.log('Share dismissed or failed', err);
        try { await navigator.clipboard.writeText(shareText); } catch(e) {}
      }
    } else if (typeof navigator !== 'undefined' && navigator.clipboard) {
      try { await navigator.clipboard.writeText(shareText); } catch(e) {}
    }
  };

  // Canvas Animation Logic
  const animateCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !tier) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let particles: any[] = [];
    const MAX_PARTICLES = tier === 'Cosmic Lightning' ? 30 : 150; // Performance cap
    const startTime = Date.now();

    const loop = () => {
      const now = Date.now();
      const canSpawn = (now - startTime) < 4500;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (tier === 'Meteor Shower') {
        if (Math.random() < 0.1 && particles.length < 50 && canSpawn) { // Cap slightly lower for longer tails
          if (audioCtx && now - lastAudioTimeRef.current >= 600) {
            const node = playBuffer(audioCtx, audioBuffers['Meteor Shower'], 0.3);
            if (node) activeAudioNodesRef.current.push(node);
            lastAudioTimeRef.current = now;
          }
          particles.push({
            x: Math.random() * canvas.width,
            y: -50,
            len: Math.random() * 150 + 80, // Longer tail
            speed: Math.random() * 15 + 8,  // Slightly faster
            opacity: 1
          });
        }

        ctx.globalCompositeOperation = 'lighter';
        for (let i = particles.length - 1; i >= 0; i--) {
          const p = particles[i];
          p.x -= p.speed * 0.5;
          p.y += p.speed;

          const grad = ctx.createLinearGradient(p.x, p.y, p.x + p.len, p.y - p.len);
          grad.addColorStop(0, `rgba(255, 255, 255, ${p.opacity})`);
          grad.addColorStop(0.2, `rgba(100, 200, 255, ${p.opacity * 0.8})`);
          grad.addColorStop(1, 'rgba(100, 200, 255, 0)');

          ctx.beginPath();
          ctx.strokeStyle = grad;
          ctx.lineWidth = 4; // Slightly thicker core
          ctx.shadowBlur = 15;
          ctx.shadowColor = '#00e5ff';
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x + p.len, p.y - p.len);
          ctx.stroke();
          ctx.shadowBlur = 0; // Reset for performance

          if (p.y > canvas.height + p.len) particles.splice(i, 1);
        }
        ctx.globalCompositeOperation = 'source-over';
      } else if (tier === 'Cosmic Lightning') {
        if (Math.random() < 0.05 && particles.length < MAX_PARTICLES && canSpawn) {
          if (audioCtx && now - lastAudioTimeRef.current >= 600) {
            const node = playBuffer(audioCtx, audioBuffers['Cosmic Lightning'], 0.3);
            if (node) activeAudioNodesRef.current.push(node);
            lastAudioTimeRef.current = now;
          }
          const startX = Math.random() * canvas.width;
          const mainBranch = [{ x: startX, y: 0 }];
          const secondaryBranch = [];

          let splitIndex = Math.floor(Math.random() * 4) + 2; // Split somewhere in the top half

          for (let i = 0; i < 12; i++) {
             mainBranch.push({
               x: mainBranch[i].x + (Math.random() - 0.5) * 60,
               y: mainBranch[i].y + Math.random() * 60 + 20
             });

             if (i === splitIndex) {
               secondaryBranch.push({ x: mainBranch[i].x, y: mainBranch[i].y });
             } else if (i > splitIndex) {
               let lastSec = secondaryBranch[secondaryBranch.length - 1];
               secondaryBranch.push({
                 x: lastSec.x + (Math.random() - 0.5) * 80,
                 y: lastSec.y + Math.random() * 50 + 10
               });
             }
          }
          particles.push({ mainBranch, secondaryBranch, opacity: 1, flash: 1 });
        }

        ctx.globalCompositeOperation = 'lighter';
        for (let i = particles.length - 1; i >= 0; i--) {
          const p = particles[i];
          // Background flash
          if (p.flash > 0) {
             ctx.fillStyle = `rgba(220, 200, 255, ${p.flash * 0.15})`;
             ctx.fillRect(0, 0, canvas.width, canvas.height);
             p.flash -= 0.2;
          }

          // Draw Main Branch
          ctx.beginPath();
          ctx.moveTo(p.mainBranch[0].x, p.mainBranch[0].y);
          p.mainBranch.forEach((pt: any) => ctx.lineTo(pt.x, pt.y));
          ctx.strokeStyle = `rgba(220, 180, 255, ${p.opacity})`;
          ctx.lineWidth = 3;
          ctx.shadowBlur = 20;
          ctx.shadowColor = '#c896ff';
          ctx.stroke();

          // Draw Secondary Branch with defensive check
          if (p.secondaryBranch && p.secondaryBranch.length > 0) {
            ctx.beginPath();
            ctx.moveTo(p.secondaryBranch[0].x, p.secondaryBranch[0].y);
            p.secondaryBranch.forEach((pt: any) => ctx.lineTo(pt.x, pt.y));
            ctx.strokeStyle = `rgba(200, 150, 255, ${p.opacity * 0.7})`; // Slightly dimmer
            ctx.lineWidth = 2;
            ctx.stroke();
          }

          ctx.shadowBlur = 0;
          p.opacity -= 0.05;
          if (p.opacity <= 0) particles.splice(i, 1);
        }
        ctx.globalCompositeOperation = 'source-over';
      } else if (tier === 'Fireworks') {
        if (Math.random() < 0.03 && particles.length < 120 && canSpawn) { // Cap slightly lower than 150 for safety with trails
          if (audioCtx && now - lastAudioTimeRef.current >= 600) {
            const node = playBuffer(audioCtx, audioBuffers['Fireworks'], 0.3);
            if (node) activeAudioNodesRef.current.push(node);
            lastAudioTimeRef.current = now;
          }
          const startX = Math.random() * canvas.width;
          const startY = Math.random() * (canvas.height / 2);
          const colors = ['#ff5050', '#5a8cff', '#6eff96', '#c86eff', '#ffcd5a', '#ffffff'];

          // Mix colors in a single burst occasionally
          const burstColorPrimary = colors[Math.floor(Math.random() * colors.length)];
          const burstColorSecondary = colors[Math.floor(Math.random() * colors.length)];

          for (let i = 0; i < 35; i++) {
            const angle = Math.random() * Math.PI * 2;
            const velocity = Math.random() * 6 + 2;
            particles.push({
              x: startX,
              y: startY,
              vx: Math.cos(angle) * velocity,
              vy: Math.sin(angle) * velocity,
              opacity: 1,
              color: Math.random() > 0.3 ? burstColorPrimary : burstColorSecondary,
              history: [] // For trails
            });
          }
        }

        ctx.globalCompositeOperation = 'lighter';
        for (let i = particles.length - 1; i >= 0; i--) {
          const p = particles[i];
          // Track history for trails
          p.history.push({ x: p.x, y: p.y });
          if (p.history.length > 5) p.history.shift(); // Keep last 5 positions

          p.x += p.vx;
          p.y += p.vy;
          p.vy += 0.08; // Slightly stronger gravity decay
          p.opacity -= 0.015;

          // Draw trail
          if (p.history.length > 1) {
             ctx.beginPath();
             ctx.moveTo(p.history[0].x, p.history[0].y);
             for(let j=1; j < p.history.length; j++){
                ctx.lineTo(p.history[j].x, p.history[j].y);
             }
             ctx.strokeStyle = p.color;
             ctx.lineWidth = 2;
             ctx.globalAlpha = Math.max(0, p.opacity * 0.5);
             ctx.stroke();
          }

          // Draw head
          ctx.fillStyle = p.color;
          ctx.globalAlpha = Math.max(0, p.opacity);

          // Using fillRect for particle head instead of arc for performance
          ctx.fillRect((p.x | 0) - 1.5, (p.y | 0) - 1.5, 3, 3);

          ctx.globalAlpha = 1.0;
          if (p.opacity <= 0) particles.splice(i, 1);
        }
        ctx.globalCompositeOperation = 'source-over';
      }

      if (!canSpawn) {
        // Fade out all active audio smoothly as soon as spawning stops
        if (audioCtx && audioCtx.state === 'running') {
          activeAudioNodesRef.current.forEach((node) => {
            if (node?.gainNode && node.gainNode.gain.value > 0.01) {
              try {
                node.gainNode.gain.setTargetAtTime(0, audioCtx.currentTime, 0.5);
              } catch (e) {}
            }
          });
        }

        // Only stop the render loop when all particles are actually gone
        if (particles.length === 0) {
          return;
        }
      }
      requestRef.current = requestAnimationFrame(loop);
    };

    loop();

    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [tier, audioCtx]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    if (isRevealed) animateCanvas();
  }, [isRevealed, animateCanvas]);

  // Background Starfield Animation
  useEffect(() => {
    const bgCanvas = bgCanvasRef.current;
    if (!bgCanvas) return;
    const bgCtx = bgCanvas.getContext('2d');
    if (!bgCtx) return;

    bgCanvas.width = window.innerWidth;
    bgCanvas.height = window.innerHeight;

    const stars = Array.from({ length: 150 }, () => ({
      x: Math.random() * bgCanvas.width,
      y: Math.random() * bgCanvas.height,
      radius: Math.random() * 1.5 + 0.5,
      alpha: Math.random(),
      speed: Math.random() * 0.02 + 0.005,
    }));

    const drawBg = () => {
      bgCtx.clearRect(0, 0, bgCanvas.width, bgCanvas.height);
      bgCtx.fillStyle = '#ffffff';
      stars.forEach(star => {
        star.alpha += star.speed;
        if (star.alpha > 1 || star.alpha < 0.2) star.speed *= -1;

        // PERFORMANCE OPTIMIZATION (Bolt ⚡):
        // Replaced expensive path/arc rendering with fillRect for tiny particles.
        // Bypassing trigonometric curve calculations for particles
        // keeps main thread execution time low and maintains a smooth 60fps.
        // Also removed string interpolation for dynamic transparency,
        // relying on globalAlpha instead to reduce garbage collection pressure.
        bgCtx.globalAlpha = star.alpha;
        bgCtx.fillRect(star.x - star.radius, star.y - star.radius, star.radius * 2, star.radius * 2);
      });
      bgCtx.globalAlpha = 1.0;
      bgRequestRef.current = requestAnimationFrame(drawBg);
    };

    drawBg();

    const handleResize = () => {
      bgCanvas.width = window.innerWidth;
      bgCanvas.height = window.innerHeight;
      // Reposition stars for new canvas dimensions
      stars.forEach(star => {
        if (star.x > bgCanvas.width) star.x = Math.random() * bgCanvas.width;
        if (star.y > bgCanvas.height) star.y = Math.random() * bgCanvas.height;
      });
    };
    window.addEventListener('resize', handleResize);

    return () => {
      if (bgRequestRef.current) cancelAnimationFrame(bgRequestRef.current);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <div className="relative w-full h-screen bg-gradient-to-b from-slate-900 via-indigo-950 to-slate-900 flex flex-col items-center justify-center overflow-hidden">
      <div className="absolute inset-0 bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />
      <canvas ref={bgCanvasRef} className="absolute inset-0 z-0 pointer-events-none opacity-60" />
      <canvas ref={canvasRef} className="absolute inset-0 z-10 pointer-events-none" />

      <div className="absolute top-4 left-4 z-20">
        <Link href="/" className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/60 backdrop-blur-md transition hover:border-white/20 hover:text-white/90">
          <span aria-hidden>←</span> Return to Home
        </Link>
      </div>

      <div className="z-10 flex flex-col items-center max-w-md w-full mx-4">
        {totalVisits !== null && (
          <div className="mb-6 inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-900/50 border border-slate-700/50 shadow-lg backdrop-blur-sm animate-fade-in text-slate-300 text-sm tracking-widest uppercase">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span>Total Resonance Rituals: <strong className="text-emerald-400 font-bold ml-1">{totalVisits.toLocaleString()}</strong></span>
          </div>
        )}
        <div className="bg-transparent backdrop-blur-md p-6 rounded-2xl shadow-[0_0_40px_rgba(100,100,255,0.1)] border border-slate-800 text-center w-full">
        {!isRevealed && !isRevealing ? (
          <>
            <h2 className="text-sm tracking-widest text-slate-400 uppercase mb-4">Daily Resonance Ritual</h2>
            <h1 className="text-3xl font-light text-white mb-8">AWAKEN TODAY'S RESONANCE</h1>
            <ResonanceButton onClick={handleReveal} />
          </>
        ) : isRevealing ? (
           <div className="animate-fade-in flex flex-col items-center justify-center min-h-[16rem]">
              <div className="animate-plasma-glow my-6 flex items-center justify-center min-w-[200px]">
                <div className="text-7xl font-bold text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">
                  {displayPercentage}%
                </div>
              </div>
           </div>
        ) : (
          <div className="animate-fade-in flex flex-col items-center h-[26rem]">
            <h2 className="text-sm tracking-widest text-cyan-400 uppercase mb-2">{tier} Resonance</h2>
            <div className={`plasma-glow-settled my-2 flex items-center justify-center min-w-[200px]`}>
              <div className="text-7xl font-bold text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">
                {displayPercentage}%
              </div>
            </div>
            <p className="text-slate-300 italic mb-4 min-h-[4rem]">"{quote}"</p>

            <div className="flex flex-col items-center mt-auto w-full">
              <button
                onClick={handleShare}
                className="border border-cyan-500/50 text-cyan-300 px-6 py-2 rounded-full hover:bg-cyan-500/10 transition-colors duration-200 mb-6"
              >
                Share My Resonance
              </button>

              <p className="text-slate-400 text-sm mb-2 uppercase tracking-widest">Next Resonance In</p>
              <div className="text-3xl font-mono text-cyan-300 tracking-wider shadow-cyan-500/20 drop-shadow-md">
                {timeRemaining}
              </div>
            </div>
          </div>
        )}
        </div>
      </div>
    </div>
  );
}
