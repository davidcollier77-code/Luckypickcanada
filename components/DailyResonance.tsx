'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
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

// Audio API Synthesizers
const playAudioEffect = (ctx: AudioContext, effect: string) => {
  const t = ctx.currentTime;

  if (effect === 'Meteor Shower') {
    // Deep atmospheric re-entry whoosh (Filtered noise)
    const bufferSize = ctx.sampleRate * 2;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(100, t);
    filter.frequency.exponentialRampToValueAtTime(1200, t + 1);
    filter.frequency.exponentialRampToValueAtTime(100, t + 2);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.5, t + 0.5);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 2);

    noise.connect(filter).connect(gain).connect(ctx.destination);
    noise.start(t);
    noise.stop(t + 2);
    noise.onended = () => { noise.disconnect(); filter.disconnect(); gain.disconnect(); };
  }

  else if (effect === 'Cosmic Lightning') {
    // Electrical snap/crackle + sub-kick
    const osc = ctx.createOscillator();
    osc.frequency.setValueAtTime(150, t);
    osc.frequency.exponentialRampToValueAtTime(40, t + 0.5);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(1, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.5);

    osc.connect(gain).connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.5);
    osc.onended = () => { osc.disconnect(); gain.disconnect(); };

    // Crackle
    for(let i=0; i<5; i++) {
      const crackle = ctx.createOscillator();
      crackle.type = 'square';
      crackle.frequency.setValueAtTime(400 + Math.random()*1000, t + i*0.05);
      const cGain = ctx.createGain();
      cGain.gain.setValueAtTime(0.1, t + i*0.05);
      cGain.gain.exponentialRampToValueAtTime(0.001, t + i*0.05 + 0.1);
      crackle.connect(cGain).connect(ctx.destination);
      crackle.start(t + i*0.05);
      crackle.stop(t + i*0.05 + 0.1);
      crackle.onended = () => { crackle.disconnect(); cGain.disconnect(); };
    }
  }

  else if (effect === 'Fireworks') {
    // Ascending whistle
    const whistle = ctx.createOscillator();
    whistle.frequency.setValueAtTime(300, t);
    whistle.frequency.exponentialRampToValueAtTime(1200, t + 1);
    const wGain = ctx.createGain();
    wGain.gain.setValueAtTime(0, t);
    wGain.gain.linearRampToValueAtTime(0.2, t + 0.5);
    wGain.gain.linearRampToValueAtTime(0, t + 1);
    whistle.connect(wGain).connect(ctx.destination);
    whistle.start(t);
    whistle.stop(t + 1);
    whistle.onended = () => { whistle.disconnect(); wGain.disconnect(); };

    // Muffled burst thud
    setTimeout(() => {
      const thud = ctx.createOscillator();
      thud.frequency.setValueAtTime(100, ctx.currentTime);
      thud.frequency.exponentialRampToValueAtTime(20, ctx.currentTime + 0.8);
      const tGain = ctx.createGain();
      tGain.gain.setValueAtTime(0.8, ctx.currentTime);
      tGain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.8);
      thud.connect(tGain).connect(ctx.destination);
      thud.start(ctx.currentTime);
      thud.stop(ctx.currentTime + 0.8);
      thud.onended = () => { thud.disconnect(); tGain.disconnect(); };
    }, 1000);
  }

  // Aurora & Pulse included as ambient beds that can be triggered on init
  else if (effect === 'Aurora Borealis') {
    const osc = ctx.createOscillator();
    const lfo = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.value = 220;
    lfo.frequency.value = 0.5;

    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 50;
    lfo.connect(lfoGain).connect(osc.frequency);

    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.1, t + 2);

    osc.connect(gain).connect(ctx.destination);
    osc.start(t);
    lfo.start(t);
    osc.stop(t + 5);
    lfo.stop(t + 5);
    osc.onended = () => { osc.disconnect(); lfo.disconnect(); lfoGain.disconnect(); gain.disconnect(); };
  }
};

export default function DailyResonance() {
  const [percentage, setPercentage] = useState(0);
  const [displayPercentage, setDisplayPercentage] = useState(0);
  const [quote, setQuote] = useState("");
  const [isRevealed, setIsRevealed] = useState(false);
  const [tier, setTier] = useState<string>("");
  const [audioCtx, setAudioCtx] = useState<AudioContext | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>(0);

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

  const handleReveal = () => {
    const ctx = initAudio();

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

    setTier(currentTier);
    setIsRevealed(true);

    playAudioEffect(ctx, currentTier);
    playAudioEffect(ctx, 'Aurora Borealis'); // Background atmospheric hum

    // Fluctuating Number Animation
    let startTime: number | null = null;
    const duration = 2500;

    const animateNumber = (timestamp: number) => {
      if (!startTime) startTime = timestamp; // Capture strictly on first frame
      const progress = timestamp - startTime;
      const t = Math.min(progress / duration, 1);

      // Elastic easing (overshoot/undershoot)
      const easeElasticOut = t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * ((2 * Math.PI) / 3)) + 1;

      setDisplayPercentage(Math.round(newPct * easeElasticOut));

      if (progress < duration) {
        requestAnimationFrame(animateNumber);
      } else {
        setDisplayPercentage(newPct);
      }
    };
    requestAnimationFrame(animateNumber);
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
      ctx.fillStyle = 'rgba(10, 5, 20, 0.2)'; // Trailing clear
      ctx.fillRect(0, 0, canvas.width, canvas.height);

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
          ctx.beginPath();
          ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
          ctx.fillStyle = p.color;
          ctx.globalAlpha = Math.max(0, p.opacity);
          ctx.fill();
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
    <div className="relative w-full h-screen bg-slate-950 flex flex-col items-center justify-center overflow-hidden">
      <canvas ref={canvasRef} className="absolute inset-0 z-0 pointer-events-none" />

      <div className="z-10 bg-slate-900/80 backdrop-blur-md p-8 rounded-2xl shadow-[0_0_40px_rgba(100,100,255,0.1)] border border-slate-800 text-center max-w-md w-full mx-4">
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
