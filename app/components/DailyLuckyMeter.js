"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";

export function DailyLuckyMeter({ compact = false }) {
  const [displayPercentage, setDisplayPercentage] = useState(null);
  const [isAwakening, setIsAwakening] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  const [cooldownRemaining, setCooldownRemaining] = useState(null);
  const [isLocked, setIsLocked] = useState(false);

  useEffect(() => {
    const checkCooldown = () => {
      const nextAvailable = localStorage.getItem("luckyGeneratorNextAvailable");
      if (nextAvailable) {
        const remaining = parseInt(nextAvailable, 10) - Date.now();
        if (remaining > 0) {
          setIsLocked(true);
          const hours = Math.floor((remaining / (1000 * 60 * 60)) % 24);
          const minutes = Math.floor((remaining / 1000 / 60) % 60);
          const seconds = Math.floor((remaining / 1000) % 60);
          setCooldownRemaining(
            `${hours.toString().padStart(2, "0")}:${minutes
              .toString()
              .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
          );
        } else {
          setIsLocked(false);
          setCooldownRemaining(null);
          localStorage.removeItem("luckyGeneratorNextAvailable");
        }
      } else {
        setIsLocked(false);
        setCooldownRemaining(null);
      }
    };

    checkCooldown();
    const interval = setInterval(checkCooldown, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleAwaken = () => {
    if (isAwakening || isLocked) return;

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

      // Lock for 24 hours
      localStorage.setItem(
        "luckyGeneratorNextAvailable",
        (Date.now() + 24 * 60 * 60 * 1000).toString()
      );
      setIsLocked(true);
    }, 2000);
  };

  const sizeClass = compact ? "w-[160px] h-[160px]" : "w-[320px] h-[320px]";

  return (
    <div className={`relative flex flex-col items-center gap-6 w-full max-w-lg mx-auto p-4`}>

      {/* Navigation */}
      <Link href="/" className="px-4 py-2 text-sm font-bold tracking-widest text-yellow-500 uppercase transition-colors border border-yellow-500 rounded-full hover:bg-yellow-500 hover:text-black">
        Back to Home
      </Link>

      {/* Title / Info */}
      {!compact && (
        <div className="relative z-10 space-y-2 text-center">
          <h1 className="text-2xl tracking-[0.3em] text-yellow-500 uppercase font-black drop-shadow-[0_0_10px_rgba(234,179,8,0.8)]">
            LUCKY GENERATOR
          </h1>
          <p className="max-w-sm mx-auto text-sm text-yellow-200/70">
            Channel the cosmic energy. Generate your pure luck reading below.
          </p>
        </div>
      )}

      {/* Wacky Metallic Machine Container */}
      <div className={`relative bg-gray-900 bg-gradient-to-br from-gray-800 via-gray-700 to-gray-900 border-4 border-yellow-500 rounded-[2rem] shadow-[0_20px_60px_rgba(0,0,0,0.8),inset_0_5px_15px_rgba(255,255,255,0.1)] flex flex-col items-center justify-center p-10 w-full overflow-hidden`}>

        {/* Machine structural lines/rivets decoration */}
        <div className="absolute top-4 left-4 w-3 h-3 bg-gray-400 rounded-full shadow-[inset_0_2px_4px_rgba(0,0,0,0.6)]" />
        <div className="absolute top-4 right-4 w-3 h-3 bg-gray-400 rounded-full shadow-[inset_0_2px_4px_rgba(0,0,0,0.6)]" />
        <div className="absolute bottom-4 left-4 w-3 h-3 bg-gray-400 rounded-full shadow-[inset_0_2px_4px_rgba(0,0,0,0.6)]" />
        <div className="absolute bottom-4 right-4 w-3 h-3 bg-gray-400 rounded-full shadow-[inset_0_2px_4px_rgba(0,0,0,0.6)]" />

        {/* Flickering Lights */}
        <div className="absolute top-8 left-8 w-4 h-4 bg-red-500 rounded-full animate-flicker shadow-[0_0_10px_rgba(239,68,68,1)]" />
        <div className="absolute bottom-8 right-8 w-4 h-4 bg-blue-500 rounded-full animate-flicker shadow-[0_0_10px_rgba(59,130,246,1)] delay-75" />
        <div className="absolute top-1/2 left-4 w-2 h-6 bg-yellow-400 rounded-sm animate-flicker shadow-[0_0_8px_rgba(250,204,21,1)] delay-150" />
        <div className="absolute top-1/2 right-4 w-2 h-6 bg-green-400 rounded-sm animate-flicker shadow-[0_0_8px_rgba(74,222,128,1)] delay-300" />


        {/* Central Vortex UI */}
        <div className={`relative ${sizeClass} rounded-full flex items-center justify-center bg-black/50 shadow-[inset_0_0_30px_rgba(0,0,0,1)] border-8 border-gray-800`}>

          {/* Vortex Image container with dynamic spin */}
          <div className={`absolute inset-0 overflow-hidden rounded-full ${isAwakening ? 'animate-vortex-spin-fast' : 'animate-spin-slow'}`}>
            <Image
              src="/images/vortex.png"
              alt="Energy Vortex"
              fill
              className="object-contain scale-110"
              priority
            />
          </div>

          {/* Machine inner ring overlay */}
          <div className="absolute inset-0 rounded-full border-4 border-yellow-500/30 pointer-events-none" />

          {/* Reveal Text */}
          <div className="relative z-10 flex items-center justify-center w-full h-full pointer-events-none">
            {isComplete && displayPercentage !== null && (
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pop-out flex items-baseline gap-1">
                <span className="text-6xl md:text-7xl font-extrabold tracking-tighter text-white drop-shadow-[0_0_20px_rgba(0,0,0,1)]">
                  {displayPercentage}
                </span>
                <span className="text-3xl font-bold text-yellow-400 drop-shadow-[0_0_15px_rgba(0,0,0,1)]">%</span>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Generate Luck Button & Timer */}
      <div className="w-full max-w-xs space-y-4">
        {isLocked && cooldownRemaining ? (
           <div className="flex flex-col items-center p-4 space-y-2 border-2 border-red-900 rounded-xl bg-black/60">
             <span className="text-xs font-bold tracking-widest text-red-500 uppercase">Recharging...</span>
             <span className="font-mono text-2xl font-bold text-red-400 drop-shadow-[0_0_8px_rgba(248,113,113,0.8)]">{cooldownRemaining}</span>
           </div>
        ) : (
          <button
            onClick={handleAwaken}
            disabled={isAwakening}
            className={`relative group overflow-hidden w-full rounded-full py-4 text-sm font-bold tracking-[0.25em] uppercase transition-all duration-300 ${
              isAwakening
                ? "bg-yellow-900 border-yellow-800 text-yellow-600 cursor-wait"
                : "bg-yellow-500 hover:bg-yellow-400 text-black shadow-[0_0_20px_rgba(234,179,8,0.4)] hover:shadow-[0_0_30px_rgba(234,179,8,0.6)] hover:scale-[1.02] active:scale-[0.98]"
            }`}
          >
            <span className="relative z-10">
              {isAwakening ? "GENERATING..." : "GENERATE LUCK"}
            </span>
            {/* Hover Highlight */}
            {!isAwakening && (
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full group-hover:animate-[shimmer-sweep_1.5s_ease-out_infinite]" />
            )}
          </button>
        )}
      </div>

    </div>
  );
}
