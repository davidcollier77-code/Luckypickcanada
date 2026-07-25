'use client';

import { useState } from 'react';

export default function LuckMeter({ onLuckCalculated }) {
  const [score, setScore] = useState(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [hasSpun, setHasSpun] = useState(false);
  const [tier, setTier] = useState(''); // 'low' | 'medium' | 'high'
  const [showSparkles, setShowSparkles] = useState(false);
  const [rotationDeg, setRotationDeg] = useState(-90);

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

    // Convert targetLuck (0-100) to gauge arc (-90deg to +90deg)
    const finalAngle = (targetLuck / 100) * 180 - 90;

    // Spin needle 3 full extra rotations (1080 deg) + land on final angle
    const totalSpinAngle = 1080 + finalAngle;
    setRotationDeg(totalSpinAngle);

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

  return (
    <div 
      className="relative flex flex-col items-center justify-center p-6 my-6 rounded-3xl backdrop-blur-xl max-w-sm mx-auto overflow-hidden"
      style={{
        backgroundColor: 'rgba(2, 6, 23, 0.92)',
        border: '2px solid rgba(245, 158, 11, 0.4)',
        boxShadow: '0 0 50px rgba(0, 0, 0, 0.9)'
      }}
    >
      {/* Ambient Radial Backlight */}
      <div 
        className={`absolute inset-0 transition-opacity duration-1000 pointer-events-none ${
          isSpinning 
            ? 'opacity-80 animate-pulse' 
            : showSparkles 
            ? tier === 'high' ? 'opacity-100' : 'opacity-50'
            : 'opacity-20'
        }`}
        style={{
          background: isSpinning || showSparkles
            ? 'radial-gradient(ellipse at center, rgba(245, 158, 11, 0.25) 0%, rgba(217, 119, 6, 0.1) 50%, transparent 70%)'
            : 'linear-gradient(to bottom, rgba(245, 158, 11, 0.1), transparent)'
        }}
      />

      {/* Sparkle / Energy Burst Overlay on Reveal */}
      {showSparkles && (
        <div className="absolute inset-0 pointer-events-none z-20 flex items-center justify-center overflow-hidden">
          <div 
            className={`w-full h-full absolute transition-all duration-1000 ${
              tier === 'high' ? 'animate-ping opacity-30 rounded-full scale-125' : 'opacity-0'
            }`}
            style={{ backgroundColor: '#fef08a' }}
          />
          <div className="absolute top-1/4 left-1/4 w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: '#fef08a', boxShadow: '0 0 8px #fef08a' }} />
          <div className="absolute top-1/3 right-1/4 w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: '#fde047', boxShadow: '0 0 10px #fde047' }} />
          <div className="absolute bottom-1/3 left-1/3 w-1.5 h-1.5 rounded-full animate-ping" style={{ backgroundColor: '#ffffff', boxShadow: '0 0 6px #ffffff' }} />
        </div>
      )}

      {/* Main Gauge Frame */}
      <div 
        className={`relative w-72 h-44 flex items-end justify-center overflow-visible transition-all duration-700 z-10 ${
          isSpinning 
            ? 'animate-[bounce_2s_infinite]' 
            : showSparkles && tier === 'high'
            ? 'scale-105'
            : ''
        }`}
        style={{
          filter: isSpinning 
            ? 'drop-shadow(0 0 20px rgba(245, 158, 11, 0.6))'
            : showSparkles && tier === 'high'
            ? 'drop-shadow(0 0 35px rgba(252, 211, 77, 0.9))'
            : 'drop-shadow(0 0 12px rgba(0, 0, 0, 0.8))'
        }}
      >
        {/* SVG Custom Dial Face */}
        <svg viewBox="0 0 200 115" className="w-full h-full overflow-visible">
          <defs>
            <linearGradient id="goldBezel" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fef08a" />
              <stop offset="30%" stopColor="#d97706" />
              <stop offset="70%" stopColor="#b45309" />
              <stop offset="100%" stopColor="#78350f" />
            </linearGradient>

            <linearGradient id="innerRim" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#451a03" />
              <stop offset="50%" stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#78350f" />
            </linearGradient>

            <linearGradient id="luckSpectrum" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#0284c7" />
              <stop offset="35%" stopColor="#10b981" />
              <stop offset="70%" stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#ef4444" />
            </linearGradient>

            <radialGradient id="darkGlass" cx="50%" cy="100%" r="100%">
              <stop offset="0%" stopColor="#1e1b4b" />
              <stop offset="60%" stopColor="#0f172a" />
              <stop offset="100%" stopColor="#020617" />
            </radialGradient>
          </defs>

          {/* Outer Gold Frame Bezel */}
          <path d="M 6,105 A 94,94 0 0,1 194,105 Z" fill="url(#darkGlass)" stroke="url(#goldBezel)" strokeWidth="5" />

          {/* Inner Accent Ring */}
          <path d="M 16,105 A 84,84 0 0,1 184,105" fill="none" stroke="url(#innerRim)" strokeWidth="1.5" opacity="0.8" />

          {/* Arc Spectrum Track */}
          <path d="M 26,105 A 74,74 0 0,1 174,105" fill="none" stroke="url(#luckSpectrum)" strokeWidth="5" strokeLinecap="round" opacity="0.9" />

          {/* Ticks */}
          <line x1="26" y1="105" x2="34" y2="105" stroke="#fef08a" strokeWidth="2" />
          <line x1="47" y1="52" x2="53" y2="57" stroke="#94a3b8" strokeWidth="1.5" />
          <line x1="100" y1="31" x2="100" y2="39" stroke="#fef08a" strokeWidth="2" />
          <line x1="153" y1="52" x2="147" y2="57" stroke="#94a3b8" strokeWidth="1.5" />
          <line x1="174" y1="105" x2="166" y2="105" stroke="#fef08a" strokeWidth="2" />

          {/* Labels */}
          <text x="34" y="97" fill="#cbd5e1" fontSize="7.5" fontWeight="bold">0%</text>
          <text x="100" y="49" fill="#fef08a" fontSize="8.5" fontWeight="black" textAnchor="middle">50%</text>
          <text x="168" y="97" fill="#cbd5e1" fontSize="7.5" fontWeight="bold">100%</text>
        </svg>

        {/* Dynamic Metallic Animated Needle */}
        <div
          className="absolute bottom-0 w-1.5 h-32 origin-bottom z-10"
          style={{
            transform: `rotate(${rotationDeg}deg)`,
            transitionProperty: 'transform',
            transitionDuration: isSpinning ? '4000ms' : '600ms',
            transitionTimingFunction: isSpinning 
              ? 'cubic-bezier(0.15, 0.85, 0.35, 1)' 
              : 'cubic-bezier(0.34, 1.56, 0.64, 1)'
          }}
        >
          {/* Needle Shaft */}
          <div 
            className="w-full h-full rounded-full transition-all duration-500" 
            style={{
              background: isSpinning 
                ? 'linear-gradient(to top, #d97706, #fde047, #ffffff)' 
                : 'linear-gradient(to top, #b45309, #fbbf24, #fef08a)',
              boxShadow: isSpinning 
                ? '0 0 15px #f59e0b' 
                : '0 0 8px #d97706'
            }}
          />
        </div>

        {/* Center Pivot Cap */}
        <div 
          className="absolute -bottom-2 w-8 h-8 rounded-full border-2 border-slate-950 flex items-center justify-center z-20"
          style={{
            background: 'linear-gradient(to top right, #92400e, #facc15, #fef08a)',
            boxShadow: '0 4px 10px rgba(0,0,0,0.5)'
          }}
        >
          <div className="w-2.5 h-2.5 bg-slate-950 rounded-full border border-amber-400/50" />
        </div>
      </div>

      {/* Score Output Display */}
      <div className="mt-6 text-center z-10">
        {score !== null ? (
          <div>
            <span className="text-[11px] uppercase tracking-widest font-semibold" style={{ color: 'rgba(253, 230, 138, 0.8)' }}>
              Your Fortune Score
            </span>
            <div 
              className={`text-5xl font-black mt-1 tracking-tight transition-all duration-500 ${
                tier === 'high' ? 'animate-pulse' : ''
              }`}
              style={{
                color: tier === 'high' ? '#fef08a' : tier === 'medium' ? '#fbbf24' : '#e2e8f0',
                textShadow: tier === 'high' 
                  ? '0 0 20px rgba(252, 211, 77, 0.9)' 
                  : tier === 'medium' 
                  ? '0 0 12px rgba(245, 158, 11, 0.7)' 
                  : '0 0 6px rgba(255, 255, 255, 0.3)'
              }}
            >
              {score}%
            </div>
            
            <p className="text-xs mt-2 font-medium italic max-w-[240px] mx-auto leading-relaxed" style={{ color: 'rgba(254, 243, 199, 0.9)' }}>
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
        className="mt-5 px-8 py-3 rounded-full font-bold text-xs tracking-widest uppercase transition-all duration-300 z-10 cursor-pointer disabled:cursor-not-allowed"
        style={{
          background: hasSpun
            ? '#0f172a'
            : 'linear-gradient(to right, #f59e0b, #facc15, #f59e0b)',
          color: hasSpun ? '#64748b' : '#020617',
          border: hasSpun ? '1px solid #1e293b' : 'none',
          boxShadow: hasSpun ? 'none' : '0 4px 20px rgba(245, 158, 11, 0.3)'
        }}
      >
        {isSpinning ? 'Measuring Luck...' : hasSpun ? 'Fortune Recorded' : 'Spin Your Luck'}
      </button>

      {hasSpun && !isSpinning && (
        <span className="text-[10px] text-slate-500 mt-2.5 z-10">Refresh page to spin again</span>
      )}
    </div>
  );
}
