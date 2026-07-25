'use client';

import { useState } from 'react';

export default function LuckMeter({ onLuckCalculated }) {
  const [score, setScore] = useState(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [hasSpun, setHasSpun] = useState(false);
  const [tier, setTier] = useState(''); // 'low' | 'medium' | 'high'
  const [showSparkles, setShowSparkles] = useState(false);

  const startMeter = () => {
    if (hasSpun || isSpinning) return;

    setIsSpinning(true);
    setHasSpun(true);
    setShowSparkles(false);

    // Random luck calculation (0-100)
    const targetLuck = Math.floor(Math.random() * 101);

    // Determine Luck Tier
    let currentTier = 'low';
    if (targetLuck >= 75) {
      currentTier = 'high';
    } else if (targetLuck >= 40) {
      currentTier = 'medium';
    }

    // 4-second spin timing
    setTimeout(() => {
      setScore(targetLuck);
      setTier(currentTier);
      setIsSpinning(false);
      setShowSparkles(true);

      if (onLuckCalculated) {
        onLuckCalculated(targetLuck);
      }
    }, 4000);
  };

  // Convert 0-100 targetLuck score to gauge rotation (-90deg at 0% to +90deg at 100%)
  const needleAngle = score !== null ? (score / 100) * 180 - 90 : -90;

  return (
    <div className="relative flex flex-col items-center justify-center p-6 my-6 bg-slate-950/90 rounded-3xl border-2 border-amber-500/40 backdrop-blur-xl max-w-sm mx-auto shadow-[0_0_50px_rgba(0,0,0,0.9)] overflow-hidden">
      
      {/* Ambient Radial Backlight */}
      <div 
        className={`absolute inset-0 transition-opacity duration-1000 pointer-events-none ${
          isSpinning 
            ? 'opacity-80 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-amber-500/20 via-yellow-600/10 to-transparent animate-pulse' 
            : showSparkles 
            ? tier === 'high'
              ? 'opacity-100 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-amber-400/30 via-yellow-500/15 to-transparent'
              : 'opacity-50 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-amber-500/15 via-transparent to-transparent'
            : 'opacity-20 bg-gradient-to-b from-amber-500/10 to-transparent'
        }`}
      />

      {/* Sparkle / Energy Burst Overlay on Reveal */}
      {showSparkles && (
        <div className="absolute inset-0 pointer-events-none z-20 flex items-center justify-center overflow-hidden">
          <div className={`w-full h-full absolute transition-all duration-1000 ${
            tier === 'high' ? 'animate-ping opacity-30 bg-amber-300 rounded-full scale-125' : 'opacity-0'
          }`} />
          {/* Micro Spark Elements */}
          <div className="absolute top-1/4 left-1/4 w-1.5 h-1.5 bg-amber-200 rounded-full animate-bounce shadow-[0_0_8px_#fef08a]" />
          <div className="absolute top-1/3 right-1/4 w-2 h-2 bg-yellow-300 rounded-full animate-pulse shadow-[0_0_10px_#fde047]" />
          <div className="absolute bottom-1/3 left-1/3 w-1 h-1 bg-white rounded-full animate-ping shadow-[0_0_6px_#ffffff]" />
        </div>
      )}

      {/* Main Gauge Frame */}
      <div 
        className={`relative w-72 h-44 flex items-end justify-center overflow-visible transition-all duration-700 z-10 ${
          isSpinning 
            ? 'drop-shadow-[0_0_20px_rgba(245,158,11,0.6)] animate-[bounce_2s_infinite]' 
            : showSparkles && tier === 'high'
            ? 'drop-shadow-[0_0_35px_rgba(252,211,77,0.9)] scale-105'
            : showSparkles && tier === 'medium'
            ? 'drop-shadow-[0_0_20px_rgba(245,158,11,0.6)]'
            : 'drop-shadow-[0_0_12px_rgba(0,0,0,0.8)]'
        }`}
      >
        {/* SVG Custom Dial Face */}
        <svg viewBox="0 0 200 115" className="w-full h-full overflow-visible">
          <defs>
            {/* Bezel Metallic Gold Gradient */}
            <linearGradient id="goldBezel" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fef08a" />
              <stop offset="30%" stopColor="#d97706" />
              <stop offset="70%" stopColor="#b45309" />
              <stop offset="100%" stopColor="#78350f" />
            </linearGradient>

            {/* Inner Ring Metallic Gradient */}
            <linearGradient id="innerRim" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#451a03" />
              <stop offset="50%" stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#78350f" />
            </linearGradient>

            {/* Gauge Arc Track Glow */}
            <linearGradient id="luckSpectrum" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#0284c7" />
              <stop offset="35%" stopColor="#10b981" />
              <stop offset="70%" stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#ef4444" />
            </linearGradient>

            {/* Dark Glass Dial Face Background */}
            <radialGradient id="darkGlass" cx="50%" cy="100%" r="100%">
              <stop offset="0%" stopColor="#1e1b4b" />
              <stop offset="60%" stopColor="#0f172a" />
              <stop offset="100%" stopColor="#020617" />
            </radialGradient>
          </defs>

          {/* Outer Gold Frame Bezel */}
          <path
            d="M 6,105 A 94,94 0 0,1 194,105 Z"
            fill="url(#darkGlass)"
            stroke="url(#goldBezel)"
            strokeWidth="5"
          />

          {/* Inner Accent Ring */}
          <path
            d="M 16,105 A 84,84 0 0,1 184,105"
            fill="none"
            stroke="url(#innerRim)"
            strokeWidth="1.5"
            opacity="0.8"
          />

          {/* Arc Spectrum Track */}
          <path
            d="M 26,105 A 74,74 0 0,1 174,105"
            fill="none"
            stroke="url(#luckSpectrum)"
            strokeWidth="5"
            strokeLinecap="round"
            opacity="0.9"
          />

          {/* Scale Markings & Ticks */}
          {/* 0% */}
          <line x1="26" y1="105" x2="34" y2="105" stroke="#fef08a" strokeWidth="2" />
          {/* 25% */}
          <line x1="47" y1="52" x2="53" y2="57" stroke="#94a3b8" strokeWidth="1.5" />
          {/* 50% */}
          <line x1="100" y1="31" x2="100" y2="39" stroke="#fef08a" strokeWidth="2" />
          {/* 75% */}
          <line x1="153" y1="52" x2="147" y2="57" stroke="#94a3b8" strokeWidth="1.5" />
          {/* 100% */}
          <line x1="174" y1="105" x2="166" y2="105" stroke="#fef08a" strokeWidth="2" />

          {/* Dial Face Text Labels */}
          <text x="34" y="97" fill="#cbd5e1" fontSize="7.5" fontWeight="bold">0%</text>
          <text x="100" y="49" fill="#fef08a" fontSize="8.5" fontWeight="black" textAnchor="middle">50%</text>
          <text x="166" y="97" fill="#cbd5e1" fontSize="7.5" fontWeight="bold">100%</text>
        </svg>

        {/* Dynamic Metallic Animated Needle */}
        <div
          className="absolute bottom-0 w-1.5 h-32 origin-bottom z-10 transition-transform"
          style={{
            transform: `rotate(${isSpinning ? (needleAngle + (Math.sin(Date.now()) * 15)) : needleAngle}deg)`,
            transitionDuration: isSpinning ? '4000ms' : '600ms',
            transitionTimingFunction: isSpinning 
              ? 'cubic-bezier(0.25, 1, 0.5, 1)' 
              : tier === 'high' || tier === 'medium' 
              ? 'cubic-bezier(0.34, 1.56, 0.64, 1)' 
              : 'ease-out'
          }}
        >
          {/* Needle Shaft with Gold Gradient & Neon Core */}
          <div className={`w-full h-full rounded-full transition-all duration-500 ${
            isSpinning 
              ? 'bg-gradient-to-t from-amber-600 via-yellow-300 to-white shadow-[0_0_15px_#f59e0b]' 
              : showSparkles && tier === 'high'
              ? 'bg-gradient-to-t from-amber-500 via-yellow-200 to-white shadow-[0_0_20px_#fef08a]'
              : 'bg-gradient-to-t from-amber-700 via-amber-400 to-yellow-100 shadow-[0_0_8px_#d97706]'
          }`} />
        </div>

        {/* Center Pivot Cap */}
        <div className="absolute -bottom-2 w-8 h-8 bg-gradient-to-tr from-amber-800 via-yellow-400 to-amber-200 rounded-full border-2 border-slate-950 shadow-lg flex items-center justify-center z-20">
          <div className="w-2.5 h-2.5 bg-slate-950 rounded-full border border-amber-400/50" />
        </div>
      </div>

      {/* Magical Score Output Display */}
      <div className="mt-6 text-center z-10">
        {score !== null ? (
          <div className="transition-all duration-700 transform scale-100">
            <span className="text-[11px] uppercase tracking-widest text-amber-200/70 font-semibold">Your Fortune Score</span>
            <div className={`text-5xl font-black mt-1 tracking-tight transition-all duration-500 ${
              tier === 'high' 
                ? 'text-amber-300 drop-shadow-[0_0_20px_rgba(252,211,77,0.9)] animate-pulse' 
                : tier === 'medium' 
                ? 'text-amber-400 drop-shadow-[0_0_12px_rgba(245,158,11,0.7)]' 
                : 'text-slate-200 drop-shadow-[0_0_6px_rgba(255,255,255,0.3)]'
            }`}>
              {score}%
            </div>
            
            {/* Dynamic Fortune Message */}
            <p className="text-xs mt-2 text-amber-100/90 font-medium italic max-w-[240px] mx-auto leading-relaxed">
              {tier === 'high' && '🔥 Exceptional Luck! Fortune smiles bright upon you today!'}
              {tier === 'medium' && '✨ Great Energy! Strong momentum is on your side.'}
              {tier === 'low' && '☘️ Steady roll! A solid foundation to build your luck.'}
            </p>
          </div>
        ) : (
          <p className="text-xs text-slate-400 tracking-wider uppercase font-medium">
            {isSpinning ? 'Consulting the stars...' : 'Ready to test your fortune?'}
          </p>
        )}
      </div>

      {/* Spin Button */}
      <button
        onClick={startMeter}
        disabled={hasSpun || isSpinning}
        className={`mt-5 px-8 py-3 rounded-full font-bold text-xs tracking-widest uppercase transition-all duration-300 shadow-xl z-10 ${
          hasSpun
            ? 'bg-slate-900 text-slate-500 border border-slate-800 cursor-not-allowed shadow-none'
            : 'bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-amber-400 hover:to-yellow-300 text-slate-950 shadow-amber-500/25 hover:shadow-amber-500/40 active:scale-95'
        }`}
      >
        {isSpinning ? 'Measuring Luck...' : hasSpun ? 'Fortune Recorded' : 'Spin Your Luck'}
      </button>

      {hasSpun && !isSpinning && (
        <span className="text-[10px] text-slate-500 mt-2.5 z-10">Refresh page to spin again</span>
      )}
    </div>
  );
}
