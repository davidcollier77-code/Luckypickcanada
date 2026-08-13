'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import MidnightCountdown from '../../../components/midnight-countdown';

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
  const year = d.getUTCFullYear();
  const month = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export default function DailyMeterWidget() {
  const canvasRef = useRef(null);
  const [savedState, setSavedState] = useState(null);
  const [visualPercentage, setVisualPercentage] = useState(null);
  const [luckPercentage, setLuckPercentage] = useState(null);
  const [fortune, setFortune] = useState('');
  const [statusText, setStatusText] = useState('STANDBY');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRevealed, setIsRevealed] = useState(false);

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
      // Fixed widget size
      canvas.width = 300;
      canvas.height = 250;
      initStars();
    };

    const initStars = () => {
      stars = [];
      const numStars = 40; // reduced for smaller area
      for (let i = 0; i < numStars; i++) {
        stars.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          radius: Math.random() * 1.0 + 0.2,
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
      if (Math.random() < 0.0008 && shootingStars.length < 1) {
        shootingStars.push({
          x: Math.random() * canvas.width * 0.7,
          y: Math.random() * canvas.height * 0.4,
          dx: 3.5 + Math.random() * 4,
          dy: 1.5 + Math.random() * 2,
          length: 30 + Math.random() * 40,
          opacity: 1,
          speed: 1.2 + Math.random() * 1.5,
        });
      }

      // Draw and update Shooting Stars with a reverse for loop to prevent splicing bugs
      for (let idx = shootingStars.length - 1; idx >= 0; idx--) {
        const ss = shootingStars[idx];
        ctx.beginPath();
        const gradient = ctx.createLinearGradient(ss.x, ss.y, ss.x - ss.length, ss.y - (ss.dx !== 0 ? ss.length * (ss.dy / ss.dx) : 0));
        gradient.addColorStop(0, `rgba(255, 244, 211, ${ss.opacity})`);
        gradient.addColorStop(1, 'rgba(255, 244, 211, 0)');

        ctx.strokeStyle = gradient;
        ctx.lineWidth = 1.0;
        ctx.moveTo(ss.x, ss.y);
        ctx.lineTo(ss.x - ss.length, ss.y - (ss.dx !== 0 ? ss.length * (ss.dy / ss.dx) : 0));
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

    resizeCanvas();
    draw();

    return () => {
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
          setStatusText('READ COMPLETE');
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
        setStatusText('AWAKENING...');
        const noise = Math.sin(Date.now() / 60) * 4;
        const val = Math.max(0, Math.min(100, Math.round(8 + noise)));
        setVisualPercentage(val);
      } else if (progress < 0.75) {
        // Phase 2 (2s to 6s): Calibrating / sweeping cosmic winds
        setStatusText('READING...');
        const sweep = Math.sin(Date.now() / 120) * 38 + 55;
        setVisualPercentage(Math.max(0, Math.min(100, Math.round(sweep))));
      } else {
        // Phase 3 (6s to 8s): Settling dynamically to target
        setStatusText('CALIBRATING...');
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
        setStatusText('READ COMPLETE');

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

  // Caching the ticks
  const ticks = useMemo(() => {
    const arr = [];
    for (let i = 0; i <= 100; i += 5) {
      const angle = -135 + i * 2.7;
      const isMajor = i % 10 === 0;
      const strokeColor = isMajor ? '#e8ba52' : 'rgba(232, 186, 82, 0.4)';
      const strokeWidth = isMajor ? 1.5 : 0.8;
      const tickLen = isMajor ? 8 : 4;
      arr.push(
        <line
          key={`tick-${i}`}
          x1="100"
          y1={100 - 75}
          x2="100"
          y2={100 - 75 + tickLen}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          transform={`rotate(${angle} 100 100)`}
        />
      );
    }
    return arr;
  }, []);

  // Caching the labels
  const labels = useMemo(() => {
    const arr = [];
    for (let i = 0; i <= 100; i += 20) {
      const angle = -135 + i * 2.7;
      const radius = 60;
      const rad = ((angle - 90) * Math.PI) / 180;
      const lx = 100 + radius * Math.cos(rad);
      const ly = 100 + radius * Math.sin(rad);
      arr.push(
        <text
          key={`label-${i}`}
          x={lx}
          y={ly + 3}
          fill="#ffe29a"
          fontSize="6"
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
    <div className="w-[300px] h-[250px] bg-[#030507] text-[#fff8df] font-sans relative overflow-hidden flex flex-col items-center justify-center m-0 p-0">

      {/* Dynamic Aurora Atmospheric Background Effects & Canvas Layers */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden bg-[#030507]">
        {/* Starfield & Shooting Stars Canvas */}
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full block" />

        {/* Dynamic Vector Aurora Beams */}
        <div className="absolute inset-0 opacity-40">
          <div className="absolute top-[-20%] left-[-10%] w-[80%] h-[90%] rounded-full bg-gradient-to-br from-[#18b978]/25 via-[#57e5d0]/15 to-transparent blur-[40px] animate-aurora-slow" />
          <div className="absolute top-[-15%] right-[-10%] w-[75%] h-[85%] rounded-full bg-gradient-to-bl from-[#69b8ff]/20 via-[#bf8bff]/15 to-transparent blur-[40px] animate-aurora-mid" />
          <div className="absolute top-[10%] left-[20%] w-[90%] h-[70%] rounded-full bg-gradient-to-tr from-[#18b978]/12 via-[#e8ba52]/10 to-transparent blur-[50px] animate-aurora-delayed" />
        </div>

        {/* Dynamic Glow Core tied to Daily Luck Tier or active generation */}
        <div
          className="absolute top-[-10%] left-[50%] translate-x-[-50%] w-[120%] h-[60%] rounded-full opacity-30 blur-[40px] transition-all duration-1000"
          style={{
            background: isGenerating
              ? 'radial-gradient(circle, #57e5d0 0%, #18b978 40%, transparent 70%)'
              : `radial-gradient(circle, ${tierColor} 0%, rgba(6, 26, 28, 0.8) 50%, transparent 80%)`
          }}
        />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:12px_12px] opacity-25" />
      </div>

      <style jsx global>{`
        body { margin: 0; padding: 0; background-color: transparent !important; }
        @keyframes auroraSlow {
          0% { transform: translate3d(0, 0, 0) rotate(0deg) scale(1); opacity: 0.35; }
          50% { transform: translate3d(20px, -10px, 0) rotate(5deg) scale(1.15); opacity: 0.65; }
          100% { transform: translate3d(-10px, 15px, 0) rotate(-3deg) scale(0.95); opacity: 0.35; }
        }
        @keyframes auroraMid {
          0% { transform: translate3d(0, 0, 0) rotate(0deg) scale(1); opacity: 0.3; }
          50% { transform: translate3d(-15px, 20px, 0) rotate(-6deg) scale(0.9); opacity: 0.55; }
          100% { transform: translate3d(25px, -7px, 0) rotate(4deg) scale(1.1); opacity: 0.3; }
        }
        @keyframes auroraDelayed {
          0% { transform: translate3d(0, 0, 0) rotate(0deg) scale(1); opacity: 0.2; }
          50% { transform: translate3d(17px, 15px, 0) rotate(3deg) scale(1.12); opacity: 0.45; }
          100% { transform: translate3d(-20px, -15px, 0) rotate(-5deg) scale(0.92); opacity: 0.2; }
        }
        .animate-aurora-slow { animation: auroraSlow 28s ease-in-out infinite alternate; }
        .animate-aurora-mid { animation: auroraMid 24s ease-in-out infinite alternate; }
        .animate-aurora-delayed { animation: auroraDelayed 32s ease-in-out infinite alternate; }
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
          0%, 100% { opacity: 0.35; filter: blur(2px); }
          50% { opacity: 0.7; filter: blur(1px); }
        }
        @keyframes ledFlickerA {
          0%, 100% { opacity: 1; filter: drop-shadow(0 0 4px #eac56d); }
          25% { opacity: 0.4; filter: drop-shadow(0 0 1px #eac56d); }
          50% { opacity: 0.9; filter: drop-shadow(0 0 3px #eac56d); }
          75% { opacity: 0.2; filter: none; }
        }
        @keyframes ledFlickerB {
          0%, 100% { opacity: 0.3; filter: none; }
          30% { opacity: 1; filter: drop-shadow(0 0 4px #57e5d0); }
          60% { opacity: 0.2; filter: none; }
          80% { opacity: 0.95; filter: drop-shadow(0 0 3px #57e5d0); }
        }
        .vortex-layer-slow {
          animation: vortexSlowSpin 14s linear infinite;
          transform-origin: 100px 100px;
        }
        .vortex-layer-fast {
          animation: vortexFastSpin 3.5s linear infinite;
          transform-origin: 100px 100px;
        }
        .pulse-layer { animation: subtlePulse 4s ease-in-out infinite; }
        .led-active-a { animation: ledFlickerA 1.8s infinite ease-in-out; }
        .led-active-b { animation: ledFlickerB 2.2s infinite ease-in-out; }
      `}</style>

      {/* WIDGET CONTENT */}
      <div className="relative z-10 w-full h-full flex flex-col items-center justify-between py-2 px-3">

        {/* Title */}
        <div className="text-center w-full z-20">
          <h2 className="text-[11px] font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-b from-[#fff9db] via-[#ffe28a] to-[#eeb333] font-serif filter drop-shadow-[0_1px_3px_rgba(0,0,0,0.6)] uppercase m-0 leading-tight">
            DAILY LUCKY METER
          </h2>
          {isRevealed ? (
            <div className="mt-1 flex items-center justify-center gap-1.5 bg-[#02070c]/90 border border-[#eeb83f]/20 px-2 py-0.5 rounded-full shadow-[0_2px_8px_rgba(0,0,0,0.5)]">
              <span className="text-[9px] font-semibold text-[#fff1b2] opacity-75">Resets in:</span>
              <span className="font-mono text-[9px] text-[#e8ba52] tracking-wider">
                <MidnightCountdown />
              </span>
            </div>
          ) : (
            <div className="text-[8px] text-[#fff4d3]/70 font-medium tracking-wide mt-1 leading-tight">
              Awaken core for today's reading.
            </div>
          )}
        </div>

        {/* Core SVG (Scaled to 130x130 for widget) */}
        {!isRevealed || isGenerating ? (
          <div className="relative w-[130px] h-[130px] flex items-center justify-center shrink-0 z-10 mt-1">
            <svg
              viewBox="0 0 200 200"
              className="w-full h-full select-none"
              style={{ filter: `drop-shadow(0 5px 15px rgba(0, 0, 0, 0.85)) drop-shadow(0 0 15px ${tierGlow})` }}
            >
              <defs>
                <linearGradient id="dlm-widget-goldBezel" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#fff8df" />
                  <stop offset="15%" stopColor="#e8ba52" />
                  <stop offset="45%" stopColor="#8d6210" />
                  <stop offset="55%" stopColor="#3d2802" />
                  <stop offset="70%" stopColor="#a5791c" />
                  <stop offset="85%" stopColor="#ffe49a" />
                  <stop offset="100%" stopColor="#8d6210" />
                </linearGradient>
                <linearGradient id="dlm-widget-darkBezel" x1="100%" y1="100%" x2="0%" y2="0%">
                  <stop offset="0%" stopColor="#070a0e" />
                  <stop offset="50%" stopColor="#1a222c" />
                  <stop offset="100%" stopColor="#020305" />
                </linearGradient>
                <linearGradient id="dlm-widget-glowTeal" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#18b978" />
                  <stop offset="50%" stopColor="#57e5d0" />
                  <stop offset="100%" stopColor="#69b8ff" />
                </linearGradient>
                <radialGradient id="dlm-widget-dialBg" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#0b1118" />
                  <stop offset="70%" stopColor="#05080c" />
                  <stop offset="100%" stopColor="#020305" />
                </radialGradient>
                <radialGradient id="dlm-widget-vortexGradA" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#57e5d0" stopOpacity="0.45" />
                  <stop offset="60%" stopColor="#18b978" stopOpacity="0.15" />
                  <stop offset="100%" stopColor="transparent" stopOpacity="0" />
                </radialGradient>
                <radialGradient id="dlm-widget-vortexGradB" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#ffe49a" stopOpacity="0.35" />
                  <stop offset="65%" stopColor="#e8ba52" stopOpacity="0.1" />
                  <stop offset="100%" stopColor="transparent" stopOpacity="0" />
                </radialGradient>
              </defs>

              <circle cx="100" cy="100" r="94" fill="#020305" />
              <circle cx="100" cy="100" r="92.5" fill="url(#dlm-widget-goldBezel)" />
              <circle cx="100" cy="100" r="86" fill="url(#dlm-widget-darkBezel)" />
              <circle cx="100" cy="100" r="84.5" fill="none" stroke="#ffe29a" strokeWidth="0.4" strokeOpacity="0.35" />
              <circle cx="100" cy="100" r="83" fill="url(#dlm-widget-dialBg)" />

              <g className={`${isGenerating ? 'vortex-layer-fast' : 'vortex-layer-slow'}`}>
                <ellipse cx="100" cy="100" rx="60" ry="47.5" fill="url(#dlm-widget-vortexGradA)" transform="rotate(45 100 100)" />
                <ellipse cx="100" cy="100" rx="47.5" ry="60" fill="url(#dlm-widget-vortexGradB)" transform="rotate(-30 100 100)" />
              </g>
              <circle cx="100" cy="100" r="52.5" fill="url(#dlm-widget-vortexGradA)" className="pulse-layer" opacity="0.6" />

              <g>{ticks}</g>
              <g>{labels}</g>

              <circle
                cx="100"
                cy="100"
                r="75"
                fill="none"
                stroke="#0f172a"
                strokeWidth="2.5"
                strokeDasharray="353.5"
                strokeDashoffset="88.375"
                strokeLinecap="round"
                transform="rotate(135 100 100)"
                opacity="0.8"
              />

              {visualPercentage !== null && (
                <circle
                  cx="100"
                  cy="100"
                  r="75"
                  fill="none"
                  stroke="url(#dlm-widget-glowTeal)"
                  strokeWidth="2.5"
                  strokeDasharray="353.5"
                  strokeDashoffset={353.5 - (265.125 * (visualPercentage / 100))}
                  strokeLinecap="round"
                  transform="rotate(135 100 100)"
                  style={{
                    filter: `drop-shadow(0 0 3px ${tierColor})`,
                    transition: 'stroke-dashoffset 0.15s ease-out'
                  }}
                />
              )}

              <g transform="translate(100, 145) scale(0.325)" opacity="0.25">
                <path
                  d="M0 -30 L8 -12 L28 -14 L16 3 L25 21 L3 13 L0 32 L-3 13 L-25 21 L-16 3 L-28 -14 L-8 -12 Z"
                  fill="none"
                  stroke="#e8ba52"
                  strokeWidth="2.5"
                  strokeLinejoin="round"
                />
                <circle cx="0" cy="3" r="3" fill="#e8ba52" />
              </g>

              <circle cx="100" cy="100" r="11" fill="url(#darkBezel)" stroke="#e8ba52" strokeWidth="0.75" />
              <circle cx="100" cy="100" r="11" fill="url(#dlm-widget-darkBezel)" stroke="#e8ba52" strokeWidth="0.75" />
              <circle cx="100" cy="100" r="7.5" fill="url(#dlm-widget-goldBezel)" />
              <circle cx="100" cy="100" r="1.5" fill={tierColor} />

              <path d="M 50 172.5 Q 100 188 150 172.5 L 142.5 186 Q 100 197.5 57.5 186 Z" fill="#090d12" stroke="#e8ba52" strokeWidth="0.6" strokeOpacity="0.4" />
              <circle cx="60" cy="179" r="1.5" fill="url(#goldBezel)" />
              <circle cx="60" cy="179" r="1.5" fill="url(#dlm-widget-goldBezel)" />
              <circle cx="140" cy="179" r="1.5" fill="url(#dlm-widget-goldBezel)" />
              <circle cx="80" cy="181" r="2.25" fill="#131d27" stroke="#000" strokeWidth="0.5" />
              <circle cx="80" cy="181" r="1.75" fill={isGenerating ? '#eac56d' : (luckPercentage !== null && luckPercentage < 40) ? '#ffe49a' : '#131d27'} className={isGenerating ? 'led-active-a' : ''} />

              <circle cx="100" cy="182" r="2.25" fill="#131d27" stroke="#000" strokeWidth="0.5" />
              <circle cx="100" cy="182" r="1.75" fill={isGenerating ? '#57e5d0' : (luckPercentage !== null && luckPercentage >= 40 && luckPercentage < 70) ? '#57e5d0' : '#131d27'} className={isGenerating ? 'led-active-b' : ''} />

              <circle cx="120" cy="181" r="2.25" fill="#131d27" stroke="#000" strokeWidth="0.5" />
              <circle cx="120" cy="181" r="1.75" fill={isGenerating ? '#eac56d' : (luckPercentage !== null && luckPercentage >= 70) ? '#ffe49a' : '#131d27'} className={isGenerating ? 'led-active-a' : ''} />
            </svg>

            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-2 z-10 pointer-events-none mt-[-10px]">
              {visualPercentage !== null ? (
                <div className="animate-fade-in">
                  <span
                    className="text-2xl font-black tracking-tight font-mono select-none drop-shadow-[0_2px_6px_rgba(0,0,0,0.95)]"
                    style={{ color: tierColor, textShadow: `0 0 8px ${tierColor}` }}
                  >
                    {visualPercentage}%
                  </span>
                  <div
                    className="mt-0.5 text-[6px] font-black tracking-[0.2em] uppercase select-none"
                    style={{ color: tierColor }}
                  >
                    {tierName}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <span className="text-[14px] font-extrabold text-[#ffe29a]/60 select-none tracking-wider font-serif">
                    STANDBY
                  </span>
                </div>
              )}
              <div className="mt-1.5 text-[6px] font-bold tracking-[0.2em] text-[#fff4d3]/50 uppercase bg-black/40 px-1.5 py-0.5 rounded-full border border-white/5 select-none inline-block whitespace-nowrap">
                {statusText}
              </div>
            </div>
          </div>
        ) : (
          <div className="w-full flex-1 flex flex-col items-center justify-center px-2 py-1 mt-1 z-20">
            <div className="w-full h-full bg-[#0a1118]/90 border border-[#eac56d]/30 rounded-xl p-3 text-center shadow-lg relative overflow-hidden flex flex-col justify-center gap-1.5">
              <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/[0.02] to-transparent pointer-events-none" />

              <div className="flex items-center justify-center gap-2">
                <span className="text-3xl font-black font-mono drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]" style={{ color: tierColor, textShadow: `0 0 8px ${tierColor}` }}>
                  {luckPercentage}%
                </span>
              </div>

              <div className="flex-1 flex items-center justify-center">
                <p className="text-[11px] sm:text-[12px] italic text-[#fff8df] font-serif leading-tight px-1 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                  "{fortune}"
                </p>
              </div>

              <p className="text-[8px] font-black text-[#e8ba52] uppercase tracking-[0.1em] mt-1 opacity-80 truncate px-2">
                TODAY'S ORACLE READING
              </p>
            </div>
          </div>
        )}

        {/* Button */}
        {!isRevealed && (
          <div className="w-full mt-1.5 z-20">
            <button
              onClick={handleGenerateLuck}
              disabled={isGenerating}
              className={`w-full py-2 px-3 rounded-full font-black tracking-[0.1em] text-[10px] transition-all duration-300 uppercase shadow-md relative overflow-hidden group select-none ${
                isGenerating
                  ? 'bg-[#131d27]/90 text-[#fff4d3]/30 border border-[#fff4d3]/10 cursor-not-allowed'
                  : 'cta-glow text-black'
              }`}
              style={!isGenerating ? {
                background: 'linear-gradient(135deg, #fff7cc, #efbe47 55%, #c37a16)',
                border: '1px solid #ffe2a0',
                boxShadow: 'inset 0 1px rgba(255,255,255,0.7), 0 4px 10px rgba(0,0,0,0.45), 0 0 10px rgba(239,190,71,0.3)'
              } : {}}
            >
              {isGenerating ? (
                <span className="flex items-center justify-center gap-1.5">
                  <span className="w-3 h-3 border-2 border-t-transparent border-[#ffe29a] rounded-full animate-spin" />
                  CONNECTING...
                </span>
              ) : (
                'AWAKEN METER'
              )}
            </button>
          </div>
        )}

        {isRevealed && (
          <div className="w-full mt-1 z-20">
            <a
              href="https://luckypickcanada.ca/lucky-meter"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full block text-center py-1.5 px-3 rounded-full font-bold tracking-widest text-[9px] uppercase shadow-md transition-all duration-300 bg-gradient-to-r from-[#1b4332] to-[#2d6a4f] hover:brightness-110 active:scale-[0.98] text-[#effff4] border border-[#49c99f]/30"
            >
              Share Your Score
            </a>
          </div>
        )}

      </div>
    </div>
  );
}
