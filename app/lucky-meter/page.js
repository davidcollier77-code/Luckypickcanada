'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import MidnightCountdown from '../../components/midnight-countdown';

const CANADIAN_FORTUNES = [
  "Like an aurora over the North, your brightest moment can arrive when you least expect it.",
  "From coast to coast, every small hopeful step carries its own kind of Canadian magic.",
  "Let today unfold like a fresh trail after snowfall: open, bright, and full of possibility.",
  "A warm hello can travel farther than a Trans-Canada highway and open an unexpected door.",
  "Steady as a lighthouse on the Atlantic, trust the good direction you are taking.",
  "There is room for a little more joy in every season, even on the chilliest Canadian morning.",
  "Your next lucky turn can begin with the courage to try one small new thing.",
  "Like a maple leaf catching the light, your strengths are worth noticing today.",
  "Good things grow patiently, from prairie fields to the plans you tend with care.",
  "Carry your optimism forward; it is a warm companion on any journey across Canada.",
  "Like the ancient stone of the Canadian Shield, your inner resilience is a foundation for future success.",
  "A sudden warm Chinook wind can clear the greyest skies—trust that your breakthrough is on its way.",
  "As deep and vast as the Great Lakes, your potential holds more treasures than you have yet discovered.",
  "Even the quietest snowmelt feeds the rushing rivers of spring; your small efforts are building toward something grand.",
  "Like a shooting star over the dark sky of Jasper, a sudden flash of brilliance is waiting to light up your path.",
  "May your day be filled with warm hearths, friendly smiles, and the quiet assurance that good things are coming.",
  "The best journeys are often like the winding mountain pass—full of wonder and leading to spectacular views.",
  "Like the tireless wild geese flying in perfect harmony, trust that your path is aligning beautifully today."
];

function getLocalDateString() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export default function LuckyMeterPage() {
  const canvasRef = useRef(null);
  const [savedState, setSavedState] = useState(null);
  const [visualPercentage, setVisualPercentage] = useState(null);
  const [luckPercentage, setLuckPercentage] = useState(null);
  const [fortune, setFortune] = useState('');
  const [statusText, setStatusText] = useState('METER STANDBY');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRevealed, setIsRevealed] = useState(false);
  const [shareStatus, setShareStatus] = useState('');

  // Values for animation target
  const [targetLuck, setTargetLuck] = useState(null);
  const [targetQuote, setTargetQuote] = useState(null);

  // Sky Starfield & Shooting Stars Canvas Animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId;
    let stars = [];
    let shootingStars = [];

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initStars();
    };

    const initStars = () => {
      stars = [];
      const numStars = Math.floor((canvas.width * canvas.height) / 8000);
      const boundedNum = Math.max(60, Math.min(numStars, 180));
      for (let i = 0; i < boundedNum; i++) {
        stars.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          radius: Math.random() * 1.2 + 0.3,
          alpha: Math.random(),
          twinkleSpeed: 0.005 + Math.random() * 0.015,
          colorPhase: Math.random() * Math.PI,
        });
      }
    };

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw Twinkling Starfield
      stars.forEach((star) => {
        star.alpha += star.twinkleSpeed;
        const currentOpacity = Math.abs(Math.sin(star.alpha + star.colorPhase));

        ctx.beginPath();
        ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
        // Cream-colored stars matching LPC theme
        ctx.fillStyle = `rgba(255, 248, 223, ${0.15 + currentOpacity * 0.75})`;
        ctx.fill();
      });

      // Spawn Shooting Stars at randomized intervals
      if (Math.random() < 0.0012 && shootingStars.length < 2) {
        shootingStars.push({
          x: Math.random() * canvas.width * 0.7,
          y: Math.random() * canvas.height * 0.4,
          dx: 3.5 + Math.random() * 4,
          dy: 1.5 + Math.random() * 2,
          length: 50 + Math.random() * 80,
          opacity: 1,
          speed: 1.2 + Math.random() * 1.5,
        });
      }

      // Draw and update Shooting Stars with a reverse for loop to prevent splicing bugs
      for (let idx = shootingStars.length - 1; idx >= 0; idx--) {
        const ss = shootingStars[idx];
        ctx.beginPath();
        const gradient = ctx.createLinearGradient(ss.x, ss.y, ss.x - ss.length, ss.y - (ss.length * (ss.dy / ss.dx)));
        gradient.addColorStop(0, `rgba(255, 244, 211, ${ss.opacity})`);
        gradient.addColorStop(1, 'rgba(255, 244, 211, 0)');

        ctx.strokeStyle = gradient;
        ctx.lineWidth = 1.5;
        ctx.moveTo(ss.x, ss.y);
        ctx.lineTo(ss.x - ss.length, ss.y - (ss.length * (ss.dy / ss.dx)));
        ctx.stroke();

        ss.x += ss.dx * ss.speed;
        ss.y += ss.dy * ss.speed;
        ss.opacity -= 0.015;

        if (ss.opacity <= 0 || ss.x > canvas.width || ss.y > canvas.height) {
          shootingStars.splice(idx, 1);
        }
      }

      animationFrameId = requestAnimationFrame(draw);
    };

    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();
    draw();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  // Load persistence state on mount
  useEffect(() => {
    if (typeof window === 'undefined' || !window.localStorage) return;

    let savedStr;
    try {
      savedStr = window.localStorage.getItem('lucky_meter_daily_state');
    } catch (e) {
      console.error('Error accessing localStorage', e);
      return;
    }
    if (savedStr) {
      try {
        const state = JSON.parse(savedStr);
        setSavedState(state);
        const today = getLocalDateString();
        if (state?.currentResult?.date === today) {
          // Already revealed today
          const p = state.currentResult.percentage;
          setLuckPercentage(p);
          setVisualPercentage(p);
          setFortune(state.currentResult.quote);
          setIsRevealed(true);
          setStatusText('DAILY READ COMPLETE');
        }
      } catch (e) {
        console.error('Error loading daily state', e);
      }
    }
  }, []);

  // Smooth Reveal Animation Loop (8 seconds)
  useEffect(() => {
    if (!isGenerating || targetLuck === null || targetQuote === null) return;

    let rafId;
    const startTime = Date.now();
    const duration = 8000; // 8 seconds

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      if (progress < 0.25) {
        // Phase 1 (0s to 2s): Powering up / LED flicker
        setStatusText('AWAKENING SYSTEMS...');
        const noise = Math.sin(Date.now() / 60) * 4;
        const val = Math.max(0, Math.min(100, Math.round(8 + noise)));
        setVisualPercentage(val);
      } else if (progress < 0.75) {
        // Phase 2 (2s to 6s): Calibrating / sweeping cosmic winds
        setStatusText('READING COSMIC CURRENTS...');
        const sweep = Math.sin(Date.now() / 120) * 38 + 55;
        setVisualPercentage(Math.max(0, Math.min(100, Math.round(sweep))));
      } else {
        // Phase 3 (6s to 8s): Settling dynamically to target
        setStatusText('CALIBRATING FINAL READ...');
        const phaseProgress = (progress - 0.75) / 0.25; // 0 to 1
        // Smooth cubic ease out
        const ease = 1 - Math.pow(1 - phaseProgress, 3);
        const startVal = 55;
        const val = startVal + (targetLuck - startVal) * ease;
        setVisualPercentage(Math.max(0, Math.min(100, Math.round(val))));
      }

      if (progress < 1) {
        rafId = requestAnimationFrame(animate);
      } else {
        // Complete!
        setVisualPercentage(targetLuck);
        setLuckPercentage(targetLuck);
        setFortune(targetQuote);
        setIsGenerating(false);
        setIsRevealed(true);
        setStatusText('DAILY READ COMPLETE');

        // Persist
        const today = getLocalDateString();
        const newState = {
          currentResult: {
            date: today,
            percentage: targetLuck,
            quote: targetQuote
          },
          lastResult: savedState?.currentResult || null
        };
        setSavedState(newState);
        if (typeof window !== 'undefined' && window.localStorage) {
          try {
            window.localStorage.setItem('lucky_meter_daily_state', JSON.stringify(newState));
          } catch (e) {
            console.error('Error saving to localStorage', e);
          }
        }
      }
    };

    rafId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafId);
  }, [isGenerating, targetLuck, targetQuote, savedState]);

  // Handle Generate Request
  const handleGenerateLuck = () => {
    if (isGenerating || isRevealed) return;

    let lastPercent = null;
    let lastQuote = null;

    if (savedState?.currentResult) {
      lastPercent = savedState.currentResult.percentage;
      lastQuote = savedState.currentResult.quote;
    } else if (savedState?.lastResult) {
      lastPercent = savedState.lastResult.percentage;
      lastQuote = savedState.lastResult.quote;
    }

    // Percentage: 0 to 100 ensuring no duplicate consecutive days
    let targetPercent;
    let attempts = 0;
    const maxAttempts = 100;
    do {
      targetPercent = Math.floor(Math.random() * 101);
      attempts++;
    } while (lastPercent !== null && targetPercent === lastPercent && attempts < maxAttempts);

    // Quote: select ensuring no duplicate consecutive days
    let targetQ;
    attempts = 0;
    do {
      targetQ = CANADIAN_FORTUNES[Math.floor(Math.random() * CANADIAN_FORTUNES.length)];
      attempts++;
    } while (lastQuote !== null && targetQ === lastQuote && attempts < maxAttempts);

    setTargetLuck(targetPercent);
    setTargetQuote(targetQ);
    setIsGenerating(true);
  };

  // Handle Share Routine
  const handleShare = async () => {
    if (luckPercentage === null) return;
    const shareData = {
      title: 'My Daily Lucky Meter',
      text: `🍁 I got ${luckPercentage}% today on the Lucky Pick Canada Lucky Meter! Can you beat my score?`,
      url: window.location.origin + '/lucky-meter',
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        setShareStatus('Shared successfully!');
      } catch (err) {
        console.log('Share cancelled or failed', err);
      }
    } else {
      try {
        await navigator.clipboard.writeText(`${shareData.text} ${shareData.url}`);
        setShareStatus('Copied to clipboard! 📋');
        setTimeout(() => setShareStatus(''), 4000);
      } catch (err) {
        console.error('Failed to copy to clipboard', err);
      }
    }
  };

  // Tier Classification
  let tierColor = '#76bdfd'; // Low Luck (Blue/Slate)
  let tierGlow = 'rgba(118, 189, 253, 0.45)';
  let tierName = 'Low Luck';

  if (visualPercentage !== null) {
    if (visualPercentage < 40) {
      tierColor = '#76bdfd';
      tierGlow = 'rgba(118, 189, 253, 0.45)';
      tierName = 'Low Luck';
    } else if (visualPercentage < 70) {
      tierColor = '#49c99f'; // Good Luck (Teal/Emerald)
      tierGlow = 'rgba(73, 201, 159, 0.6)';
      tierName = 'Good Luck';
    } else {
      tierColor = '#e8ba52'; // High Luck (Gold/Aurora)
      tierGlow = 'rgba(232, 186, 82, 0.75)';
      tierName = 'High Luck';
    }
  }

  // PERFORMANCE OPTIMIZATION (Bolt ⚡):
  // Cache programmatically-generated static SVG ticks and labels to prevent recreating 27 React elements
  // on every frame of the 8-second requestAnimationFrame animation.
  // This reduces object allocation from ~12,960 elements to exactly 27 elements per mount, avoiding GC jank.
  const ticks = useMemo(() => {
    const arr = [];
    for (let i = 0; i <= 100; i += 5) {
      const angle = -135 + i * 2.7;
      const isMajor = i % 10 === 0;
      const strokeColor = isMajor ? '#e8ba52' : 'rgba(232, 186, 82, 0.4)';
      const strokeWidth = isMajor ? 2.5 : 1.2;
      const tickLen = isMajor ? 14 : 7;
      arr.push(
        <line
          key={`tick-${i}`}
          x1="200"
          y1={200 - 150}
          x2="200"
          y2={200 - 150 + tickLen}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          transform={`rotate(${angle} 200 200)`}
        />
      );
    }
    return arr;
  }, []);

  const labels = useMemo(() => {
    const arr = [];
    for (let i = 0; i <= 100; i += 20) {
      const angle = -135 + i * 2.7;
      const radius = 122;
      const rad = ((angle - 90) * Math.PI) / 180;
      const lx = 200 + radius * Math.cos(rad);
      const ly = 200 + radius * Math.sin(rad);
      arr.push(
        <text
          key={`label-${i}`}
          x={lx}
          y={ly + 4}
          fill="#ffe29a"
          fontSize="11"
          fontWeight="bold"
          textAnchor="middle"
          className="select-none font-mono opacity-80"
        >
          {i}
        </text>
      );
    }
    return arr;
  }, []);

  return (
    <div className="min-h-screen bg-[#030507] text-[#fff8df] flex flex-col justify-between font-sans relative overflow-x-hidden">
      
      {/* Dynamic Aurora Atmospheric Background Effects & Canvas Layers */}
      <div className="fixed inset-0 z-[-1] pointer-events-none overflow-hidden bg-[#030507]">
        {/* Starfield & Shooting Stars Canvas */}
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full block" />

        {/* Dynamic Vector Aurora Beams */}
        <div className="absolute inset-0 opacity-40">
          <div className="absolute top-[-20%] left-[-10%] w-[80%] h-[90%] rounded-full bg-gradient-to-br from-[#18b978]/25 via-[#57e5d0]/15 to-transparent blur-[110px] animate-aurora-slow" />
          <div className="absolute top-[-15%] right-[-10%] w-[75%] h-[85%] rounded-full bg-gradient-to-bl from-[#69b8ff]/20 via-[#bf8bff]/15 to-transparent blur-[110px] animate-aurora-mid" />
          <div className="absolute top-[10%] left-[20%] w-[90%] h-[70%] rounded-full bg-gradient-to-tr from-[#18b978]/12 via-[#e8ba52]/10 to-transparent blur-[120px] animate-aurora-delayed" />
        </div>

        {/* Dynamic Glow Core tied to Daily Luck Tier or active generation */}
        <div
          className="absolute top-[-10%] left-[50%] translate-x-[-50%] w-[120%] h-[60%] rounded-full opacity-30 blur-[100px] transition-all duration-1000"
          style={{
            background: isGenerating
              ? 'radial-gradient(circle, #57e5d0 0%, #18b978 40%, transparent 70%)'
              : `radial-gradient(circle, ${tierColor} 0%, rgba(6, 26, 28, 0.8) 50%, transparent 80%)`
          }}
        />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:24px_24px] opacity-25" />
      </div>

      {/* Styled JSX for vortex, led flickering and aurora animations */}
      <style jsx global>{`
        @keyframes auroraSlow {
          0% { transform: translate3d(0, 0, 0) rotate(0deg) scale(1); opacity: 0.35; }
          50% { transform: translate3d(40px, -20px, 0) rotate(5deg) scale(1.15); opacity: 0.65; }
          100% { transform: translate3d(-20px, 30px, 0) rotate(-3deg) scale(0.95); opacity: 0.35; }
        }
        @keyframes auroraMid {
          0% { transform: translate3d(0, 0, 0) rotate(0deg) scale(1); opacity: 0.3; }
          50% { transform: translate3d(-30px, 40px, 0) rotate(-6deg) scale(0.9); opacity: 0.55; }
          100% { transform: translate3d(50px, -15px, 0) rotate(4deg) scale(1.1); opacity: 0.3; }
        }
        @keyframes auroraDelayed {
          0% { transform: translate3d(0, 0, 0) rotate(0deg) scale(1); opacity: 0.2; }
          50% { transform: translate3d(35px, 30px, 0) rotate(3deg) scale(1.12); opacity: 0.45; }
          100% { transform: translate3d(-40px, -30px, 0) rotate(-5deg) scale(0.92); opacity: 0.2; }
        }
        .animate-aurora-slow {
          animation: auroraSlow 28s ease-in-out infinite alternate;
        }
        .animate-aurora-mid {
          animation: auroraMid 24s ease-in-out infinite alternate;
        }
        .animate-aurora-delayed {
          animation: auroraDelayed 32s ease-in-out infinite alternate;
        }
        @keyframes vortexSlowSpin {
          0% { transform: rotate(0deg) scale(1); }
          50% { transform: rotate(180deg) scale(1.05); }
          100% { transform: rotate(360deg) scale(1); }
        }
        @keyframes vortexFastSpin {
          0% { transform: rotate(0deg) scale(1); }
          50% { transform: rotate(180deg) scale(1.1); }
          100% { transform: rotate(360deg) scale(1); }
        }
        @keyframes subtlePulse {
          0%, 100% { opacity: 0.35; filter: blur(3px); }
          50% { opacity: 0.7; filter: blur(1px); }
        }
        @keyframes ledFlickerA {
          0%, 100% { opacity: 1; filter: drop-shadow(0 0 8px #eac56d); }
          25% { opacity: 0.4; filter: drop-shadow(0 0 2px #eac56d); }
          50% { opacity: 0.9; filter: drop-shadow(0 0 6px #eac56d); }
          75% { opacity: 0.2; filter: none; }
        }
        @keyframes ledFlickerB {
          0%, 100% { opacity: 0.3; filter: none; }
          30% { opacity: 1; filter: drop-shadow(0 0 8px #57e5d0); }
          60% { opacity: 0.2; filter: none; }
          80% { opacity: 0.95; filter: drop-shadow(0 0 7px #57e5d0); }
        }
        .vortex-layer-slow {
          animation: vortexSlowSpin 14s linear infinite;
          transform-origin: 200px 200px;
        }
        .vortex-layer-fast {
          animation: vortexFastSpin 3.5s linear infinite;
          transform-origin: 200px 200px;
        }
        .pulse-layer {
          animation: subtlePulse 4s ease-in-out infinite;
        }
        .led-active-a {
          animation: ledFlickerA 1.8s infinite ease-in-out;
        }
        .led-active-b {
          animation: ledFlickerB 2.2s infinite ease-in-out;
        }
      `}</style>

      {/* HEADER NAVIGATION - Matches homepage brand/header system */}
      <header className="relative z-30 w-full bg-[#030303]/92 border-b border-[#eeb83f]/18 backdrop-blur-[16px] px-4 py-3 sm:px-6">
        <nav className="max-w-[1200px] mx-auto flex items-center justify-between gap-4">
          <Link href="/" className="inline-flex items-center gap-2 group min-w-0">
            <Image
              src="/BackgroundEraser_20260724_163638777.png"
              alt="Lucky Pick Canada logo"
              width={42}
              height={42}
              priority
              className="group-hover:scale-105 transition duration-200"
            />
            <span className="text-[#f4cc68] font-serif text-sm sm:text-base font-extrabold tracking-wide select-none drop-shadow-[0_0_8px_rgba(239,184,61,0.35)] truncate">
              Lucky Pick Canada
            </span>
          </Link>
          <div className="flex items-center gap-1 sm:gap-2">
            <Link
              href="/"
              className="px-3 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider text-[#f6edd4] hover:text-[#ffd86d] hover:shadow-[inset_0_-2px_0_#e8b83f] transition duration-150"
            >
              Home
            </Link>
            <Link
              href="/#cards"
              className="px-3 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider text-[#f6edd4] hover:text-[#ffd86d] hover:shadow-[inset_0_-2px_0_#e8b83f] transition duration-150"
            >
              Lucky Cards
            </Link>
            <Link
              href="/map"
              className="px-3 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider text-[#f6edd4] hover:text-[#ffd86d] hover:shadow-[inset_0_-2px_0_#e8b83f] transition duration-150"
            >
              Map
            </Link>
          </div>
        </nav>
      </header>

      {/* MAIN CONTENT HOUSING */}
      <div className="relative z-10 w-full max-w-xl mx-auto px-4 py-8 flex flex-col items-center flex-grow justify-center gap-6">

        {/* UPPER DISPLAY CARD */}
        <div className="text-center w-full">
          <h2 className="text-2xl sm:text-3xl font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-b from-[#fff9db] via-[#ffe28a] to-[#eeb333] font-serif filter drop-shadow-[0_2px_6px_rgba(0,0,0,0.6)] select-none uppercase">
            DAILY LUCKY METER
          </h2>
          <p className="text-xs sm:text-sm text-[#fff4d3]/70 font-medium tracking-wide mt-1.5 max-w-md mx-auto leading-relaxed">
            Every night at midnight, your Lucky Meter resets. Awaken the vector core to reveal your daily reading.
          </p>

          {/* Midnight Reset Capsule */}
          <div className="mt-4 inline-flex items-center gap-2 bg-[#02070c]/95 border border-[#eeb83f]/20 px-5 py-2 rounded-full text-xs font-semibold text-[#fff1b2] shadow-[0_6px_20px_rgba(0,0,0,0.5)]">
            <span className="opacity-75">Resets in:</span>
            <span className="font-mono text-[#e8ba52] text-sm tracking-widest bg-[#030507] px-2.5 py-0.5 rounded border border-[#e8ba52]/20 shadow-[inset_0_1px_3px_rgba(0,0,0,0.8)]">
              <MidnightCountdown />
            </span>
          </div>
        </div>

        {/* CORE SVG DEVICE HOUSING */}
        <div className="relative w-full max-w-[340px] sm:max-w-[380px] aspect-square flex items-center justify-center">

          {/* HIGH-DEFINITION METALLIC DIAL SVG */}
          <svg
            viewBox="0 0 400 400"
            className="w-full h-full select-none"
            style={{ filter: `drop-shadow(0 15px 45px rgba(0, 0, 0, 0.85)) drop-shadow(0 0 30px ${tierGlow})` }}
          >
            <defs>
              {/* Gold Bezel Linear Gradient representing luxurious metal */}
              <linearGradient id="goldBezel" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#fff8df" />
                <stop offset="15%" stopColor="#e8ba52" />
                <stop offset="45%" stopColor="#8d6210" />
                <stop offset="55%" stopColor="#3d2802" />
                <stop offset="70%" stopColor="#a5791c" />
                <stop offset="85%" stopColor="#ffe49a" />
                <stop offset="100%" stopColor="#8d6210" />
              </linearGradient>

              {/* Dark Inner Bezel ring */}
              <linearGradient id="darkBezel" x1="100%" y1="100%" x2="0%" y2="0%">
                <stop offset="0%" stopColor="#070a0e" />
                <stop offset="50%" stopColor="#1a222c" />
                <stop offset="100%" stopColor="#020305" />
              </linearGradient>

              {/* Progress Sweep Metallic Accent */}
              <linearGradient id="glowTeal" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#18b978" />
                <stop offset="50%" stopColor="#57e5d0" />
                <stop offset="100%" stopColor="#69b8ff" />
              </linearGradient>

              {/* Carbon Plate Radial Gradient for Dial Face */}
              <radialGradient id="dialBg" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#0b1118" />
                <stop offset="70%" stopColor="#05080c" />
                <stop offset="100%" stopColor="#020305" />
              </radialGradient>

              {/* Vortex/Smoke Particle Gradients */}
              <radialGradient id="vortexGradA" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#57e5d0" stopOpacity="0.45" />
                <stop offset="60%" stopColor="#18b978" stopOpacity="0.15" />
                <stop offset="100%" stopColor="transparent" stopOpacity="0" />
              </radialGradient>
              <radialGradient id="vortexGradB" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#ffe49a" stopOpacity="0.35" />
                <stop offset="65%" stopColor="#e8ba52" stopOpacity="0.1" />
                <stop offset="100%" stopColor="transparent" stopOpacity="0" />
              </radialGradient>
            </defs>

            {/* 1. OUTER HOUSING & BEZEL */}
            {/* Dark outer casing shadow ring */}
            <circle cx="200" cy="200" r="188" fill="#020305" />

            {/* Gorgeous Multi-stop Golden Bezel */}
            <circle cx="200" cy="200" r="185" fill="url(#goldBezel)" />

            {/* Bezel inner dark shadow */}
            <circle cx="200" cy="200" r="172" fill="url(#darkBezel)" />

            {/* Glass Face Rim Accent */}
            <circle cx="200" cy="200" r="169" fill="none" stroke="#ffe29a" strokeWidth="0.8" strokeOpacity="0.35" />

            {/* Dial Face Plate */}
            <circle cx="200" cy="200" r="166" fill="url(#dialBg)" />

            {/* 2. ATMOSPHERIC VORTEX CORES */}
            <g className={`${isGenerating ? 'vortex-layer-fast' : 'vortex-layer-slow'}`}>
              <ellipse cx="200" cy="200" rx="120" ry="95" fill="url(#vortexGradA)" transform="rotate(45 200 200)" />
              <ellipse cx="200" cy="200" rx="95" ry="120" fill="url(#vortexGradB)" transform="rotate(-30 200 200)" />
            </g>
            <circle cx="200" cy="200" r="105" fill="url(#vortexGradA)" className="pulse-layer" opacity="0.6" />

            {/* 3. MEASUREMENT TICK MARKS & LABELS (Drawn Programmatically) */}
            <g>{ticks}</g>
            <g>{labels}</g>

            {/* 4. CHRONO GAUGE TRACKS */}
            {/* Inactive Outer Track */}
            <circle 
              cx="200" 
              cy="200" 
              r="150"
              fill="none" 
              stroke="#0f172a"
              strokeWidth="5"
              strokeDasharray="707"
              strokeDashoffset="176.75"
              strokeLinecap="round" 
              transform="rotate(135 200 200)"
              opacity="0.8"
            />

            {/* Active Glow/Progress Track */}
            {visualPercentage !== null && (
              <circle
                cx="200"
                cy="200"
                r="150"
                fill="none"
                stroke="url(#glowTeal)"
                strokeWidth="5"
                strokeDasharray="707"
                strokeDashoffset={707 - (530 * (visualPercentage / 100))}
                strokeLinecap="round"
                transform="rotate(135 200 200)"
                style={{
                  filter: `drop-shadow(0 0 6px ${tierColor})`,
                  transition: 'stroke-dashoffset 0.15s ease-out'
                }}
              />
            )}

            {/* 5. BRANDING DECORATION INSIDE DIAL (Maple Leaf/Clover Emblem) */}
            <g transform="translate(200, 290) scale(0.65)" opacity="0.25">
              {/* Maple Leaf Outline */}
              <path
                d="M0 -30 L8 -12 L28 -14 L16 3 L25 21 L3 13 L0 32 L-3 13 L-25 21 L-16 3 L-28 -14 L-8 -12 Z"
                fill="none"
                stroke="#e8ba52"
                strokeWidth="2.5"
                strokeLinejoin="round"
              />
              <circle cx="0" cy="3" r="3" fill="#e8ba52" />
            </g>

            {/* Center Cap Anchor (Detailed Metallic Polish) */}
            <circle cx="200" cy="200" r="22" fill="url(#darkBezel)" stroke="#e8ba52" strokeWidth="1.5" />
            <circle cx="200" cy="200" r="15" fill="url(#goldBezel)" />
            <circle cx="200" cy="200" r="7" fill="#030507" />
            <circle cx="200" cy="200" r="3" fill={tierColor} />

            {/* 7. DETAILED BASE HOUSING WITH LED INDICATORS */}
            {/* Lower Beveled Base Attachment */}
            <path d="M 100 345 Q 200 376 300 345 L 285 372 Q 200 395 115 372 Z" fill="#090d12" stroke="#e8ba52" strokeWidth="1.2" strokeOpacity="0.4" />

            {/* Hardware Accent Screws */}
            <circle cx="120" cy="358" r="3" fill="url(#goldBezel)" />
            <circle cx="280" cy="358" r="3" fill="url(#goldBezel)" />

            {/* Embedded Indicator Lights (LEDs) */}
            {/* LED 1 (Left-Center) */}
            <circle cx="160" cy="362" r="4.5" fill="#131d27" stroke="#000" strokeWidth="1" />
            <circle cx="160" cy="362" r="3.5" fill={isGenerating ? '#eac56d' : (luckPercentage !== null && luckPercentage < 40) ? '#ffe49a' : '#131d27'} className={isGenerating ? 'led-active-a' : ''} />

            {/* LED 2 (Center-Center) */}
            <circle cx="200" cy="364" r="4.5" fill="#131d27" stroke="#000" strokeWidth="1" />
            <circle cx="200" cy="364" r="3.5" fill={isGenerating ? '#57e5d0' : (luckPercentage !== null && luckPercentage >= 40 && luckPercentage < 70) ? '#57e5d0' : '#131d27'} className={isGenerating ? 'led-active-b' : ''} />

            {/* LED 3 (Right-Center) */}
            <circle cx="240" cy="362" r="4.5" fill="#131d27" stroke="#000" strokeWidth="1" />
            <circle cx="240" cy="362" r="3.5" fill={isGenerating ? '#eac56d' : (luckPercentage !== null && luckPercentage >= 70) ? '#ffe49a' : '#131d27'} className={isGenerating ? 'led-active-a' : ''} />
          </svg>

          {/* DYNAMIC TEXT DISPLAY OVERLAY IN DIAL EYE */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 z-10 pointer-events-none">
            <div className="mt-[-20px] transition-all duration-300">

              {/* Visual Percentage Display */}
              {visualPercentage !== null ? (
                <div className="animate-fade-in">
                  <span
                    className="text-5xl sm:text-6xl font-black tracking-tight font-mono select-none drop-shadow-[0_4px_12px_rgba(0,0,0,0.95)]"
                    style={{ color: tierColor, textShadow: `0 0 16px ${tierColor}` }}
                  >
                    {visualPercentage}%
                  </span>

                  {/* Tier Label Display */}
                  <div
                    className="mt-1 text-xs font-black tracking-[0.22em] uppercase select-none transition-all duration-300"
                    style={{ color: tierColor }}
                  >
                    {tierName}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <span className="text-3xl sm:text-4xl font-extrabold text-[#ffe29a]/60 select-none tracking-wider font-serif">
                    STANDBY
                  </span>
                  <p className="text-[10px] sm:text-xs font-bold tracking-[0.16em] text-[#fff4d3]/40 uppercase mt-1 select-none">
                    Awaken the Device
                  </p>
                </div>
              )}

              {/* Status Indicator text */}
              <div className="mt-3 text-[9px] sm:text-[10px] font-bold tracking-[0.2em] text-[#fff4d3]/50 uppercase bg-black/40 px-3 py-1 rounded-full border border-white/5 select-none inline-block">
                {statusText}
              </div>

            </div>
          </div>

        </div>

        {/* CONTROLS & DYNAMIC RESULTS CARD */}
        <div className="w-full flex flex-col items-center gap-4 mt-6">

          {/* Core Interactive Action Button - Styled precisely to match homepage-offer-action / cta-glow */}
          <button
            onClick={handleGenerateLuck}
            disabled={isGenerating || isRevealed}
            className={`w-full py-4 px-8 rounded-full font-black tracking-[0.12em] text-sm transition-all duration-300 uppercase shadow-xl relative overflow-hidden group select-none ${
              isGenerating
                ? 'bg-[#131d27]/90 text-[#fff4d3]/30 border border-[#fff4d3]/10 cursor-not-allowed'
                : isRevealed
                  ? 'bg-[#0a1118]/80 text-[#e8ba52]/50 border border-[#e8ba52]/10 cursor-default shadow-none'
                  : 'cta-glow text-black'
            }`}
            style={(!isGenerating && !isRevealed) ? {
              background: 'linear-gradient(135deg, #fff7cc, #efbe47 55%, #c37a16)',
              border: '1px solid #ffe2a0',
              boxShadow: 'inset 0 1px rgba(255,255,255,0.7), 0 12px 28px rgba(0,0,0,0.45), 0 0 24px rgba(239,190,71,0.3)'
            } : {}}
          >
            {isGenerating ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-t-transparent border-[#ffe29a] rounded-full animate-spin" />
                CONNECTING TO STARS...
              </span>
            ) : isRevealed ? (
              'TODAY’S RESONANCE COMPLETE'
            ) : (
              'AWAKEN LUCKY METER'
            )}
          </button>

          {/* Revealed Quote & Sharing Panel */}
          {fortune && !isGenerating && (
            <div className="w-full bg-[#0a1118]/90 border border-[#eac56d]/30 rounded-2xl p-5 text-center shadow-2xl animate-fade-in relative overflow-hidden">
              {/* Gloss Highlight inside Card */}
              <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/[0.02] to-transparent pointer-events-none" />

              <p className="text-[10px] font-black text-[#e8ba52] uppercase tracking-[0.24em] mb-2 select-none">
                TODAY'S ORACLE READING
              </p>

              <p className="text-sm sm:text-base italic text-[#fff8df] font-serif leading-relaxed px-1">
                "{fortune}"
              </p>

              {/* Share Interaction Panel */}
              <div className="mt-5 pt-4 border-t border-white/[0.05] flex flex-col items-center gap-2">
                <button
                  onClick={handleShare}
                  className="w-full py-2.5 px-4 bg-gradient-to-r from-[#1b4332] to-[#2d6a4f] hover:brightness-110 active:scale-[0.98] text-[#effff4] text-xs font-black rounded-full border border-[#49c99f]/30 flex items-center justify-center gap-2 transition-all duration-200 uppercase tracking-widest shadow-md cursor-pointer"
                >
                  <span>📤</span> Share Daily Resonance
                </button>
                {shareStatus && (
                  <p className="text-[11px] font-bold text-[#49c99f] animate-pulse mt-1">
                    {shareStatus}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Navigation Return Hook */}
          <div className="mt-2 text-center">
            <Link
              href="/"
              className="text-xs font-bold text-[#eac56d] hover:text-[#fff1b2] transition-colors duration-200 uppercase tracking-widest flex items-center gap-1 hover:underline"
            >
              <span>←</span> Return to LPC Hearth
            </Link>
          </div>

        </div>

      </div>

      {/* FOOTER - Matches existing styling */}
      <footer className="w-full py-6 text-center text-[10px] text-[#fff8df]/30 font-semibold tracking-wider select-none z-10 border-t border-[#eeb83f]/10 mt-auto">
        LUCKY PICK CANADA © 2026 • THE REALM OF OPTIMISM
      </footer>
    </div>
  );
}
