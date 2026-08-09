'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

const CANADIAN_FORTUNES = [
  "Your intuition will guide you to something valuable.",
  "Great fortune favors those who take bold strides today.",
  "An unexpected opportunity will present itself soon.",
  "Clear vision and patience will yield rich rewards.",
  "A wave of positive momentum is heading your way.",
  "Trust the process—luck is aligning in your favor.",
  "A surprise victory will highlight your week.",
  "Your creative energy is at an all-time high."
];

export default function LuckyMeterPage() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [luckPercentage, setLuckPercentage] = useState(null);
  const [fortune, setFortune] = useState('');
  const [statusText, setStatusText] = useState('READY TO AWAKEN');
  const [timeLeft, setTimeLeft] = useState('');

  // Daily Countdown Timer to Midnight
  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const midnight = new Date();
      midnight.setHours(24, 0, 0, 0);
      const diff = midnight - now;

      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diff / 1000 / 60) % 60);
      const seconds = Math.floor((diff / 1000) % 60);

      setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, []);

  // Generate Luck Routine
  const handleGenerateLuck = () => {
    if (isGenerating) return;
    setIsGenerating(true);
    setLuckPercentage(0);
    setStatusText('CONNECTING TO STARS...');

    const targetLuck = Math.floor(Math.random() * 45) + 55; // 55% to 99%
    let current = 0;

    const stepInterval = setInterval(() => {
      current += 1;
      setLuckPercentage(current);

      if (current >= targetLuck) {
        clearInterval(stepInterval);
        setIsGenerating(false);
        setStatusText('DAILY READ COMPLETE');
        const randomFortune = CANADIAN_FORTUNES[Math.floor(Math.random() * CANADIAN_FORTUNES.length)];
        setFortune(randomFortune);
      }
    }, 35);
  };

  // Share Routine
  const handleShare = async () => {
    const shareData = {
      title: 'My Daily Lucky Meter Result',
      text: `🍁 I rolled ${luckPercentage}% Today's Luck on Lucky Pick Canada!`,
      url: window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.log('Share cancelled or failed', err);
      }
    } else {
      navigator.clipboard.writeText(`${shareData.text} ${shareData.url}`);
      alert('Result copied to clipboard!');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-between p-4 sm:p-6 font-sans">
      
      {/* Embedded CSS Animations for Vortex & Base LEDs */}
      <style jsx global>{`
        @keyframes vortexSpin {
          0% { transform: rotate(0deg) scale(1); }
          50% { transform: rotate(180deg) scale(1.08); }
          100% { transform: rotate(360deg) scale(1); }
        }
        @keyframes vortexPulse {
          0%, 100% { opacity: 0.45; }
          50% { opacity: 0.85; }
        }
        @keyframes ledFlicker1 {
          0%, 100% { opacity: 1; filter: drop-shadow(0 0 6px #10b981); }
          30% { opacity: 0.3; filter: none; }
          60% { opacity: 0.9; filter: drop-shadow(0 0 4px #10b981); }
          80% { opacity: 0.4; filter: none; }
        }
        @keyframes ledFlicker2 {
          0%, 100% { opacity: 0.4; filter: none; }
          20% { opacity: 1; filter: drop-shadow(0 0 6px #06b6d4); }
          50% { opacity: 0.2; filter: none; }
          75% { opacity: 0.95; filter: drop-shadow(0 0 5px #06b6d4); }
        }
        .vortex-layer-1 {
          animation: vortexSpin 8s linear infinite, vortexPulse 3s ease-in-out infinite;
          transform-origin: center;
        }
        .vortex-layer-2 {
          animation: vortexSpin 5s linear infinite reverse;
          transform-origin: center;
        }
        .vortex-active {
          animation-duration: 1.5s !important;
        }
        .led-1 { animation: ledFlicker1 2.2s infinite ease-in-out; }
        .led-2 { animation: ledFlicker2 1.8s infinite ease-in-out 0.4s; }
        .led-3 { animation: ledFlicker1 2.7s infinite ease-in-out 0.9s; }
      `}</style>

      {/* Header Info */}
      <header className="w-full max-w-md text-center mt-2 mb-4">
        <h1 className="text-xl sm:text-2xl font-bold tracking-wider text-emerald-400 flex items-center justify-center gap-2">
          <span>✨</span> DAILY LUCKY METER RITUAL
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Every night at midnight, your Lucky Meter resets for a new daily reading.
        </p>

        {/* Midnight Reset Banner */}
        <div className="mt-3 inline-flex items-center gap-2 bg-slate-900/80 border border-slate-800 px-4 py-1.5 rounded-full text-xs font-semibold text-emerald-300">
          <span>Reset happens in:</span>
          <span className="font-mono text-emerald-400 text-sm">{timeLeft || 'calculating...'}</span>
        </div>
      </header>

      {/* Navigation Return Button */}
      <Link 
        href="/"
        className="mb-4 text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 px-4 py-1.5 rounded-lg border border-slate-700 transition"
      >
        Return Home
      </Link>

      {/* CORE METER DEVICE */}
      <div className="relative w-full max-w-xs sm:max-w-sm aspect-square flex items-center justify-center my-auto">
        
        {/* SVG Device Housing */}
        <svg viewBox="0 0 400 400" className="w-full h-full drop-shadow-[0_0_25px_rgba(16,185,129,0.2)]">
          <defs>
            <radialGradient id="vortexGrad1" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.8" />
              <stop offset="60%" stopColor="#06b6d4" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#020617" stopOpacity="0" />
            </radialGradient>
            
            <radialGradient id="vortexGrad2" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#34d399" stopOpacity="0.6" />
              <stop offset="70%" stopColor="#0f172a" stopOpacity="0.1" />
              <stop offset="100%" stopColor="#020617" stopOpacity="0" />
            </radialGradient>

            <linearGradient id="arcGlow" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#10b981" />
              <stop offset="100%" stopColor="#06b6d4" />
            </linearGradient>
          </defs>

          {/* Outer Metallic Bezel */}
          <circle cx="200" cy="200" r="185" fill="#090d16" stroke="#1e293b" strokeWidth="8" />
          <circle cx="200" cy="200" r="175" fill="#020617" stroke="#0f172a" strokeWidth="4" />

          {/* SWIRLING ANIMATED VORTEX CORE */}
          <g className={`vortex-layer-1 ${isGenerating ? 'vortex-active' : ''}`}>
            <ellipse cx="200" cy="200" rx="140" ry="110" fill="url(#vortexGrad1)" />
          </g>
          <g className={`vortex-layer-2 ${isGenerating ? 'vortex-active' : ''}`}>
            <ellipse cx="200" cy="200" rx="110" ry="140" fill="url(#vortexGrad2)" />
          </g>

          {/* Progress Arc Track */}
          <circle 
            cx="200" 
            cy="200" 
            r="140" 
            fill="none" 
            stroke="#1e293b" 
            strokeWidth="14" 
            strokeDasharray="660" 
            strokeDashoffset="165" 
            strokeLinecap="round" 
            transform="rotate(135 200 200)"
          />

          {/* Active Progress Arc Fill */}
          {luckPercentage !== null && (
            <circle 
              cx="200" 
              cy="200" 
              r="140" 
              fill="none" 
              stroke="url(#arcGlow)" 
              strokeWidth="14" 
              strokeDasharray="660" 
              strokeDashoffset={660 - (495 * (luckPercentage / 100))} 
              strokeLinecap="round" 
              transform="rotate(135 200 200)"
              className="transition-all duration-75 ease-out"
            />
          )}

          {/* DEVICE BASE HARDWARE RIM & FLICKERING LEDS */}
          <path d="M 80 340 Q 200 375 320 340 L 300 375 Q 200 395 100 375 Z" fill="#0f172a" stroke="#334155" strokeWidth="2" />
          
          {/* Flickering LED Lights on Base */}
          <circle cx="140" cy="360" r="5" fill="#10b981" className="led-1" />
          <circle cx="180" cy="365" r="5" fill="#06b6d4" className="led-2" />
          <circle cx="220" cy="365" r="5" fill="#10b981" className="led-3" />
          <circle cx="260" cy="360" r="5" fill="#06b6d4" className="led-1" />
        </svg>

        {/* Center Text Display */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 z-10 pointer-events-none">
          {luckPercentage !== null ? (
            <div className="animate-fade-in">
              <span className="text-5xl sm:text-6xl font-black tracking-tight text-white drop-shadow-[0_0_15px_rgba(16,185,129,0.8)]">
                {luckPercentage}%
              </span>
              <p className="text-xs font-bold tracking-widest text-emerald-400 mt-1 uppercase">
                {isGenerating ? 'CALCULATING LUCK...' : 'TODAY\'S LUCK'}
              </p>
            </div>
          ) : (
            <div className="text-slate-400">
              <p className="text-sm font-semibold tracking-wider text-emerald-400 uppercase">
                METER STANDBY
              </p>
              <p className="text-xs text-slate-500 mt-1">Tap below to awaken</p>
            </div>
          )}
        </div>
      </div>

      {/* ACTION CONTROLS & RESULTS */}
      <div className="w-full max-w-xs sm:max-w-sm mt-4 flex flex-col items-center gap-3">
        
        {/* Generate / Action Button */}
        <button
          onClick={handleGenerateLuck}
          disabled={isGenerating}
          className={`w-full py-3.5 px-6 rounded-xl font-bold tracking-wider text-sm transition-all duration-200 uppercase shadow-lg ${
            isGenerating 
              ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
              : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/25 active:scale-95'
          }`}
        >
          {isGenerating ? 'Revealing Daily Luck...' : luckPercentage !== null ? 'Re-Test Luck' : 'Generate Luck'}
        </button>

        {/* Fortune Card Box (Revealed after generation) */}
        {fortune && !isGenerating && (
          <div className="w-full bg-slate-900/90 border border-emerald-500/30 rounded-xl p-4 text-center mt-2 shadow-xl animate-fade-in">
            <p className="text-xs font-bold text-emerald-400 uppercase tracking-widest mb-1">
              Today's Fortune
            </p>
            <p className="text-sm italic text-slate-200">
              "{fortune}"
            </p>
            
            {/* Share Reading Button */}
            <button
              onClick={handleShare}
              className="mt-3 w-full py-2 bg-slate-800 hover:bg-slate-700 text-emerald-300 text-xs font-semibold rounded-lg border border-emerald-500/20 flex items-center justify-center gap-2 transition"
            >
              <span>📤</span> Share Daily Reading
            </button>
          </div>
        )}
      </div>

      <footer className="mt-6 text-center text-[10px] text-slate-600">
        Lucky Pick Canada © 2026 • Daily Luck Meter
      </footer>
    </div>
  );
}
