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

const playBuffer = (ctx: AudioContext, buffer: AudioBuffer | null) => {
  if (!buffer) return;
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.connect(ctx.destination);
  source.start(0);
  source.onended = () => source.disconnect();
};

export default function DailyResonance() {
  const [percentage, setPercentage] = useState(0);
  const [displayPercentage, setDisplayPercentage] = useState(0);
  const [quote, setQuote] = useState("");
  const [isRevealed, setIsRevealed] = useState(false);
  const [tier, setTier] = useState<string>("");
  const [audioCtx, setAudioCtx] = useState<AudioContext | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>(0);
  const sequenceRef = useRef<number>(0);

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

  const handleReveal = async () => {
    const ctx = initAudio();
    // Prevent concurrent sequences
    if (isRevealed) return;
    if (isLoading) return;

    setIsLoading(true);

    // Cancel any previous animation sequence
    if (sequenceRef.current) cancelAnimationFrame(sequenceRef.current);


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

    localStorage.setItem('lucky_lastPct', newPct.toString());
    localStorage.setItem('lucky_lastQuote', newQuoteIdx.toString());

    setPercentage(newPct);
    setQuote(LUCKY_QUOTES[newQuoteIdx]);

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
    playBuffer(ctx, audioBuffers.buildup);

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
        playBuffer(ctx, audioBuffers[currentTier]);
      }

      // Impact Frame UI Transition (8.8s)
      if (elapsed >= IMPACT_TIME && !finalTierSet) {
        finalTierSet = true;
        setTier(currentTier);
        setIsRevealed(true);
      }

      if (elapsed < SEQUENCE_DURATION) {
         sequenceRef.current = requestAnimationFrame(sequenceLoop);
      } else {
         setDisplayPercentage(newPct); // Ensure final state
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

    const loop = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (tier === 'Meteor Shower') {
        if (Math.random() < 0.1 && particles.length < MAX_PARTICLES) {
          particles.push({
            x: Math.random() * canvas.width,
            y: -50,
            len: Math.random() * 80 + 20,
            speed: Math.random() * 10 + 5,
            opacity: 1
          });
        }
        particles.forEach((p, i) => {
          p.x -= p.speed * 0.5;
          p.y += p.speed;

          const grad = ctx.createLinearGradient(p.x, p.y, p.x + p.len, p.y - p.len);
          grad.addColorStop(0, `rgba(255, 255, 255, ${p.opacity})`);
          grad.addColorStop(1, 'rgba(100, 200, 255, 0)');

          ctx.beginPath();
          ctx.strokeStyle = grad;
          ctx.lineWidth = 3;
          ctx.shadowBlur = 10;
          ctx.shadowColor = '#00e5ff';
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x + p.len, p.y - p.len);
          ctx.stroke();
          ctx.shadowBlur = 0; // Reset for performance

          if (p.y > canvas.height) particles.splice(i, 1);
        });
      } else if (tier === 'Cosmic Lightning') {
        if (Math.random() < 0.05 && particles.length < MAX_PARTICLES) {
          const startX = Math.random() * canvas.width;
          const branches = [{ x: startX, y: 0 }];
          for (let i = 0; i < 10; i++) {
             branches.push({
               x: branches[i].x + (Math.random() - 0.5) * 40,
               y: branches[i].y + Math.random() * 50 + 20
             });
          }
          particles.push({ branches, opacity: 1 });
        }
        particles.forEach((p, i) => {
          ctx.beginPath();
          ctx.moveTo(p.branches[0].x, p.branches[0].y);
          p.branches.forEach((pt: any) => ctx.lineTo(pt.x, pt.y));
          ctx.strokeStyle = `rgba(200, 150, 255, ${p.opacity})`;
          ctx.lineWidth = 2;
          ctx.shadowBlur = 15;
          ctx.shadowColor = '#c896ff';
          ctx.stroke();
          ctx.shadowBlur = 0;
          p.opacity -= 0.05;
          if (p.opacity <= 0) particles.splice(i, 1);
        });
      } else if (tier === 'Fireworks') {
        if (Math.random() < 0.02 && particles.length < MAX_PARTICLES) {
          const startX = Math.random() * canvas.width;
          const startY = Math.random() * (canvas.height / 2);
          const colors = ['#ff5050', '#5a8cff', '#6eff96', '#c86eff', '#ffcd5a'];
          const color = colors[Math.floor(Math.random() * colors.length)];
          for (let i = 0; i < 40; i++) {
            const angle = Math.random() * Math.PI * 2;
            const velocity = Math.random() * 5 + 2;
            particles.push({
              x: startX,
              y: startY,
              vx: Math.cos(angle) * velocity,
              vy: Math.sin(angle) * velocity,
              opacity: 1,
              color: color
            });
          }
        }
        particles.forEach((p, i) => {
          p.x += p.vx;
          p.y += p.vy;
          p.vy += 0.05; // gravity decay
          p.opacity -= 0.015;
          ctx.fillStyle = p.color;
          ctx.globalAlpha = Math.max(0, p.opacity);
          ctx.fillRect(p.x - 2, p.y - 2, 4, 4);
          ctx.globalAlpha = 1.0;
          if (p.opacity <= 0) particles.splice(i, 1);
        });
      }

      requestRef.current = requestAnimationFrame(loop);
    };

    loop();

    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [tier]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    if (isRevealed) animateCanvas();
  }, [isRevealed, animateCanvas]);

  return (
    <div className="relative w-full h-screen bg-transparent flex flex-col items-center justify-center overflow-hidden">
      <canvas ref={canvasRef} className="absolute inset-0 z-0 pointer-events-none" />

      <div className="absolute top-4 left-4 z-20">
        <Link href="/" className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/60 backdrop-blur-md transition hover:border-white/20 hover:text-white/90">
          <span aria-hidden>←</span> Return to Home
        </Link>
      </div>

      <div className="z-10 bg-transparent backdrop-blur-md p-8 rounded-2xl shadow-[0_0_40px_rgba(100,100,255,0.1)] border border-slate-800 text-center max-w-md w-full mx-4">
        {!isRevealed ? (
          <>
            <h2 className="text-sm tracking-widest text-slate-400 uppercase mb-4">Daily Resonance Ritual</h2>
            <h1 className="text-3xl font-light text-white mb-8">AWAKEN TODAY'S RESONANCE</h1>
            <ResonanceButton onClick={handleReveal} />
          </>
        ) : (
          <div className="animate-fade-in flex flex-col items-center">
            <h2 className="text-sm tracking-widest text-cyan-400 uppercase mb-2">{tier} Resonance</h2>
            <div className="text-7xl font-bold text-white my-6 drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">
              {displayPercentage}%
            </div>
            <p className="text-slate-300 italic mb-8 min-h-[4rem]">"{quote}"</p>

            <button
              onClick={handleShare}
              className="border border-cyan-500/50 text-cyan-300 px-6 py-2 rounded-full hover:bg-cyan-500/10 transition-colors duration-200"
            >
              Share My Resonance
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
