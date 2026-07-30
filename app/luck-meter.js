'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useMemo, useRef, useState } from 'react';

const TWELVE_HOURS_MS = 12 * 60 * 60 * 1000;
const INITIAL_GLOBAL_COUNT = 148920;

function AuroraBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0" aria-hidden="true">
      <div className="absolute inset-0 bg-[#05070a]" />
      <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.35, 0.2], x: [-20, 20, -20], y: [-10, 30, -10] }} transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }} className="absolute top-1/4 left-1/3 w-[500px] h-[500px] bg-teal-500/20 rounded-full blur-[120px]" />
      <motion.div animate={{ scale: [1.2, 1, 1.2], opacity: [0.15, 0.3, 0.15], x: [30, -20, 30], y: [20, -10, 20] }} transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }} className="absolute bottom-1/4 right-1/3 w-[600px] h-[600px] bg-purple-600/20 rounded-full blur-[140px]" />
      <motion.div animate={{ scale: [1, 1.3, 1], opacity: [0.1, 0.25, 0.1] }} transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-pink-500/15 rounded-full blur-[160px]" />
    </div>
  );
}

function VortexCanvas({ isCharging, isLocked }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const ctx = canvas.getContext('2d');
    if (!ctx) return undefined;

    let animationFrameId;
    let width = (canvas.width = canvas.offsetWidth);
    let height = (canvas.height = canvas.offsetHeight);
    const handleResize = () => {
      width = canvas.width = canvas.offsetWidth;
      height = canvas.height = canvas.offsetHeight;
    };
    window.addEventListener('resize', handleResize);

    const colors = ['#00ffd5', '#0d9488', '#8b5cf6', '#d946ef', '#38bdf8'];
    const particles = Array.from({ length: 180 }, () => ({
      angle: Math.random() * Math.PI * 2,
      radius: Math.random() * (width / 2) * 0.9,
      speed: 0.005 + Math.random() * 0.012,
      radialSpeed: 0.2 + Math.random() * 0.4,
      size: 0.8 + Math.random() * 2.2,
      color: colors[Math.floor(Math.random() * colors.length)],
      opacity: 0.2 + Math.random() * 0.8,
    }));
    let currentSpeedMult = 1;

    const render = () => {
      const targetSpeed = isCharging ? 4.5 : isLocked ? 0.3 : 1;
      currentSpeedMult += (targetSpeed - currentSpeedMult) * 0.05;
      ctx.fillStyle = 'rgba(2, 6, 12, 0.22)';
      ctx.fillRect(0, 0, width, height);
      const cx = width / 2;
      const cy = height / 2;

      particles.forEach((particle) => {
        particle.angle += particle.speed * currentSpeedMult;
        particle.radius -= particle.radialSpeed * (currentSpeedMult * 0.8);
        if (particle.radius <= 3) {
          particle.radius = (width / 2) * (0.85 + Math.random() * 0.15);
          particle.angle = Math.random() * Math.PI * 2;
        }
        const x = cx + Math.cos(particle.angle) * particle.radius;
        const y = cy + Math.sin(particle.angle) * particle.radius;
        ctx.beginPath();
        ctx.arc(x, y, particle.size, 0, Math.PI * 2);
        ctx.fillStyle = particle.color;
        ctx.globalAlpha = particle.opacity;
        ctx.shadowBlur = isCharging ? 12 : 6;
        ctx.shadowColor = particle.color;
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.shadowBlur = 0;
      });

      const coreGradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, width / 2);
      coreGradient.addColorStop(0, isCharging ? 'rgba(0, 255, 213, 0.4)' : 'rgba(139, 92, 246, 0.15)');
      coreGradient.addColorStop(0.5, 'rgba(13, 148, 136, 0.08)');
      coreGradient.addColorStop(1, 'rgba(2, 6, 12, 0.9)');
      ctx.fillStyle = coreGradient;
      ctx.fillRect(0, 0, width, height);
      animationFrameId = requestAnimationFrame(render);
    };

    render();
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, [isCharging, isLocked]);

  return <canvas ref={canvasRef} className="w-full h-full block rounded-full" aria-label="Animated luck vortex" role="img" />;
}

export default function GenerateLuckDevice() {
  const [isCharging, setIsCharging] = useState(false);
  const [luckResult, setLuckResult] = useState(null);
  const [lastGeneratedTime, setLastGeneratedTime] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [globalCount, setGlobalCount] = useState(INITIAL_GLOBAL_COUNT);

  useEffect(() => {
    const storedTime = localStorage.getItem('luck_last_gen_time');
    const storedResult = localStorage.getItem('luck_last_result');
    const storedCount = localStorage.getItem('luck_global_count');
    if (storedCount) setGlobalCount(Number.parseInt(storedCount, 10));
    if (!storedTime) return;

    const parsedTime = Number.parseInt(storedTime, 10);
    const elapsed = Date.now() - parsedTime;
    if (elapsed < TWELVE_HOURS_MS) {
      setLastGeneratedTime(parsedTime);
      setTimeRemaining(TWELVE_HOURS_MS - elapsed);
      if (storedResult) setLuckResult(JSON.parse(storedResult));
    } else {
      localStorage.removeItem('luck_last_gen_time');
      localStorage.removeItem('luck_last_result');
    }
  }, []);

  useEffect(() => {
    if (!lastGeneratedTime) return undefined;
    const timer = window.setInterval(() => {
      const remaining = TWELVE_HOURS_MS - (Date.now() - lastGeneratedTime);
      if (remaining <= 0) {
        setLastGeneratedTime(null);
        setLuckResult(null);
        setTimeRemaining(0);
        localStorage.removeItem('luck_last_gen_time');
        localStorage.removeItem('luck_last_result');
        window.clearInterval(timer);
      } else {
        setTimeRemaining(remaining);
      }
    }, 1000);
    return () => window.clearInterval(timer);
  }, [lastGeneratedTime]);

  const formattedCountdown = useMemo(() => {
    if (timeRemaining <= 0) return '00:00:00';
    const hours = Math.floor(timeRemaining / 3600000);
    const minutes = Math.floor((timeRemaining % 3600000) / 60000);
    const seconds = Math.floor((timeRemaining % 60000) / 1000);
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }, [timeRemaining]);

  const handleGenerate = () => {
    if (isCharging || lastGeneratedTime) return;
    setIsCharging(true);
    window.setTimeout(() => {
      const numbers = Array.from({ length: 5 }, () => Math.floor(Math.random() * 49) + 1).sort((a, b) => a - b);
      const resultData = {
        numbers,
        powerPick: Math.floor(Math.random() * 10) + 1,
        multiplier: `${(Math.random() * 1.5 + 2.5).toFixed(1)}x`,
      };
      const now = Date.now();
      const newGlobalCount = globalCount + 1;
      setLuckResult(resultData);
      setLastGeneratedTime(now);
      setGlobalCount(newGlobalCount);
      setIsCharging(false);
      localStorage.setItem('luck_last_gen_time', String(now));
      localStorage.setItem('luck_last_result', JSON.stringify(resultData));
      localStorage.setItem('luck_global_count', String(newGlobalCount));
    }, 2800);
  };

  const isLocked = Boolean(lastGeneratedTime);

  return (
    <div className="lucky-meter-shell relative w-full bg-[#03070d] text-white flex flex-col items-center justify-center p-4 sm:p-8 overflow-hidden font-sans select-none">
      <AuroraBackground />
      <div className="relative z-10 flex flex-col items-center max-w-xl w-full">
        <div className="text-center mb-6">
          <span className="text-xs font-bold tracking-[0.4em] text-teal-400 uppercase bg-teal-950/40 border border-teal-800/40 px-3 py-1 rounded-full backdrop-blur-md shadow-lg shadow-teal-950/50">Lucky Pick Canada</span>
          <h3 className="text-3xl sm:text-4xl font-extrabold tracking-tight mt-3 text-transparent bg-clip-text bg-gradient-to-r from-slate-100 via-slate-300 to-slate-400">Quantum Luck Synthesizer</h3>
        </div>

        <div className="relative w-[340px] sm:w-[420px] flex flex-col items-center">
          <div className="relative w-full bg-gradient-to-b from-[#1c2026] via-[#121519] to-[#0a0c0e] rounded-t-[210px] rounded-b-[40px] p-[3px] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9),0_0_40px_rgba(13,148,136,0.1)] border border-slate-700/40">
            <div className="w-full bg-[#0c0e11] rounded-t-[207px] rounded-b-[37px] p-6 sm:p-8 flex flex-col items-center relative overflow-hidden shadow-inner">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-1 bg-gradient-to-r from-transparent via-slate-400/30 to-transparent blur-[1px]" />
              <div className="relative w-60 h-60 sm:w-72 sm:h-72 rounded-full p-2 bg-gradient-to-b from-[#2a2f38] via-[#15181c] to-[#0d0f12] shadow-[inset_0_2px_15px_rgba(0,0,0,0.9),0_10px_25px_rgba(0,0,0,0.8)] border border-slate-700/30 flex items-center justify-center my-4">
                <div className="w-full h-full rounded-full relative overflow-hidden bg-[#020509] shadow-[inset_0_0_25px_rgba(0,0,0,1)] border border-teal-500/20">
                  <VortexCanvas isCharging={isCharging} isLocked={isLocked} />
                  <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-transparent via-white/[0.03] to-white/[0.08] pointer-events-none" />
                  <AnimatePresence>
                    {luckResult && (
                      <motion.div initial={{ scale: 0, opacity: 0, filter: 'blur(12px)' }} animate={{ scale: 1, opacity: 1, filter: 'blur(0px)' }} exit={{ scale: 0, opacity: 0, filter: 'blur(10px)' }} transition={{ type: 'spring', stiffness: 220, damping: 20 }} className="absolute inset-0 flex flex-col items-center justify-center p-4 bg-black/60 backdrop-blur-md rounded-full text-center z-20 border border-teal-500/30 shadow-[inset_0_0_30px_rgba(0,255,213,0.2)]">
                        <span className="text-[10px] font-bold tracking-[0.25em] text-teal-300 uppercase mb-1">Synthesized Luck</span>
                        <div className="flex gap-1.5 my-2 justify-center">
                          {luckResult.numbers.map((number, index) => <motion.span key={index} initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 + index * 0.08 }} className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-b from-teal-400 to-teal-700 text-slate-950 font-black text-xs sm:text-sm flex items-center justify-center shadow-lg shadow-teal-500/20 border border-teal-200/50">{number < 10 ? `0${number}` : number}</motion.span>)}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] uppercase tracking-wider text-purple-300 font-semibold">Power: <strong className="text-pink-400">{luckResult.powerPick}</strong></span><span className="text-neutral-500">•</span><span className="text-[10px] uppercase tracking-wider text-teal-300 font-semibold">Boost: <strong className="text-teal-200">{luckResult.multiplier}</strong></span>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              <div className="flex items-center gap-2 my-2" aria-label={isCharging ? 'Charging' : isLocked ? 'Locked until next cycle' : 'Ready'}>
                <span className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${isCharging ? 'bg-teal-300 shadow-[0_0_8px_#00ffd5] animate-ping' : isLocked ? 'bg-purple-500' : 'bg-teal-400 shadow-[0_0_6px_#00ffd5]'}`} />
                <div className="flex gap-1"><span className={`w-1 h-1 rounded-full ${isCharging ? 'bg-teal-400 animate-pulse' : 'bg-neutral-600'}`} /><span className={`w-1 h-1 rounded-full ${isCharging ? 'bg-teal-400 animate-pulse' : 'bg-neutral-600'}`} /></div>
                <span className={`w-1.5 h-1.5 rounded-full ${isCharging ? 'bg-teal-300 shadow-[0_0_8px_#00ffd5]' : 'bg-neutral-500'}`} />
                <div className="flex gap-1"><span className={`w-1 h-1 rounded-full ${isCharging ? 'bg-teal-400 animate-pulse' : 'bg-neutral-600'}`} /><span className={`w-1 h-1 rounded-full ${isCharging ? 'bg-teal-400 animate-pulse' : 'bg-neutral-600'}`} /></div>
                <span className={`w-1.5 h-1.5 rounded-full ${isLocked ? 'bg-purple-400' : 'bg-teal-400 shadow-[0_0_6px_#00ffd5]'}`} />
              </div>

              <button type="button" onClick={handleGenerate} disabled={isCharging || isLocked} className={`mt-2 group relative w-full py-3 px-6 rounded-xl transition-all duration-300 flex flex-col items-center justify-center overflow-hidden focus:outline-none ${isLocked ? 'cursor-not-allowed opacity-80' : 'cursor-pointer hover:scale-[1.02] active:scale-[0.98]'}`}>
                <span className="relative z-10 text-sm sm:text-base font-bold tracking-[0.35em] uppercase text-neutral-200 group-hover:text-white transition-colors">{isCharging ? <span className="text-teal-300 animate-pulse">Charging Vortex...</span> : 'Generate Luck'}</span>
                <span className="relative z-10 text-[10px] tracking-widest text-neutral-400 mt-1 uppercase font-medium">{isCharging ? 'Synthesizing Quantum Frequencies' : isLocked ? <span className="text-purple-300 font-mono">Next Cycle: {formattedCountdown}</span> : 'Tap to initialize continuous sequence'}</span>
              </button>
            </div>
          </div>
          <div className="w-[85%] h-3 bg-gradient-to-b from-[#0c0e11] to-[#040507] rounded-b-lg border-x border-b border-slate-800/50 shadow-2xl" />
        </div>

        <div className="mt-8 flex flex-col sm:flex-row items-center gap-4 text-xs text-neutral-400">
          <div className="flex items-center gap-2 bg-slate-900/60 border border-slate-800 px-4 py-2 rounded-full backdrop-blur-md shadow-lg"><span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /><span className="text-neutral-400">Global Generations:</span><span className="font-mono font-bold text-teal-300 text-sm">{globalCount.toLocaleString()}</span></div>
          <div className="flex items-center gap-2 bg-slate-900/60 border border-slate-800 px-4 py-2 rounded-full backdrop-blur-md shadow-lg"><span className="text-neutral-400">Cycle Constraint:</span><span className="font-semibold text-neutral-200">12-Hour Sync</span></div>
        </div>
      </div>
    </div>
  );
}
