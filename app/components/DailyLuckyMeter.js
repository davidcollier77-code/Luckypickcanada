"use client";

import { useEffect, useState, useRef } from "react";

export function DailyLuckyMeter({ compact = false }) {
  const [displayPercentage, setDisplayPercentage] = useState(null);
  const [isAwakening, setIsAwakening] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  const handleAwaken = () => {
    if (isAwakening) return;

    // Reset state before generating a new luck percentage
    setIsComplete(false);
    setDisplayPercentage(null);
    setIsAwakening(true);

    // Simulate complex calculation
    setTimeout(() => {
      const targetScore = Math.floor(Math.random() * 101); // 0% to 100%
      setDisplayPercentage(targetScore);
      setIsAwakening(false);
      setIsComplete(true);
    }, 2000);
  };

  const sizeClass = compact ? "w-[160px] h-[160px]" : "w-[320px] h-[320px]";

  return (
    <div className={`relative flex flex-col items-center gap-8 w-full max-w-lg mx-auto`}>

      {/* Title / Info */}
      {!compact && (
        <div className="text-center space-y-2 z-10 relative">
          <h1 className="text-xl tracking-[0.3em] text-green-400 uppercase font-bold drop-shadow-[0_0_15px_rgba(74,222,128,0.8)]">
            LUCKY GENERATOR
          </h1>
          <p className="text-sm text-green-100/70 max-w-sm mx-auto">
            Channel the cosmic energy. Generate your pure luck reading below.
          </p>
        </div>
      )}

      {/* Cinematic Faceplate Container */}
      <div className={`relative bg-black/40 backdrop-blur-3xl border border-white/10 rounded-[3rem] shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex flex-col items-center justify-center p-8 w-full overflow-hidden`}>

        {/* Subtle glassmorphic inner glow */}
        <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-black/40 pointer-events-none" />

        {/* Central Vortex UI */}
        <div className={`relative ${sizeClass} rounded-full flex items-center justify-center shadow-[0_0_80px_rgba(34,197,94,0.15)]`}>

          {/* Outer Ring Glow */}
          <div className="absolute inset-0 rounded-full border border-green-500/20 shadow-[inset_0_0_40px_rgba(34,197,94,0.2)]" />

          {/* Layered Vortex Animations */}
          <div className={`absolute inset-2 rounded-full overflow-hidden ${isAwakening ? 'animate-vortex-spin' : 'animate-[vortexSpin_20s_linear_infinite]'}`}>
             <div className="absolute inset-0 bg-[conic-gradient(from_0deg,transparent,rgba(34,197,94,0.6),rgba(134,239,172,0.8),transparent_60%)] mix-blend-screen" />
          </div>

          <div className={`absolute inset-6 rounded-full overflow-hidden ${isAwakening ? 'animate-vortex-spin-reverse' : 'animate-[vortexSpinReverse_25s_linear_infinite]'}`}>
             <div className="absolute inset-0 bg-[conic-gradient(from_180deg,transparent,rgba(21,128,61,0.5),rgba(74,222,128,0.7),transparent_50%)] mix-blend-screen" />
          </div>

          {/* Deep Center Void */}
          <div className="absolute inset-10 rounded-full bg-[radial-gradient(circle,rgba(0,0,0,0.9)_20%,rgba(0,0,0,0.6)_60%,transparent_100%)] shadow-[inset_0_0_30px_rgba(0,0,0,1)]" />

          {/* Reveal Text */}
          <div className="relative z-10 flex items-center justify-center w-full h-full">
            {isComplete && displayPercentage !== null && (
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pop-out flex items-baseline gap-1">
                <span className="text-6xl md:text-7xl font-extrabold tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-green-200 via-green-400 to-green-600 drop-shadow-[0_0_20px_rgba(74,222,128,0.8)]">
                  {displayPercentage}
                </span>
                <span className="text-3xl font-bold text-green-400 drop-shadow-[0_0_10px_rgba(74,222,128,0.8)]">%</span>
              </div>
            )}
            {!isAwakening && !isComplete && (
              <span className="text-sm font-mono tracking-widest text-green-500/50 uppercase">Ready</span>
            )}
          </div>
        </div>

      </div>

      {/* Generate Luck Button */}
      <button
        onClick={handleAwaken}
        disabled={isAwakening}
        className={`relative group overflow-hidden w-full max-w-xs rounded-full py-4 text-sm font-bold tracking-[0.25em] uppercase transition-all duration-300 ${
          isAwakening
            ? "bg-green-950 border-green-800 text-green-600 cursor-wait"
            : "bg-green-600 hover:bg-green-500 text-white shadow-[0_0_30px_rgba(34,197,94,0.4)] hover:shadow-[0_0_40px_rgba(34,197,94,0.6)] hover:scale-[1.02] active:scale-[0.98]"
        }`}
      >
        <span className="relative z-10">
          {isAwakening ? "GENERATING..." : "GENERATE LUCK"}
        </span>
        {/* Hover Highlight */}
        {!isAwakening && (
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer-sweep_1.5s_ease-out_infinite]" />
        )}
      </button>

    </div>
  );
}
