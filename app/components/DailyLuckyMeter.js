"use client";

import { useEffect, useState, useRef } from "react";

const ORACLE_READINGS = {
  low: [
    "A quiet day to recharge. The stars suggest patience and steady steps.",
    "Conserve your energy today; cosmic currents favor preparation over haste.",
  ],
  mid: [
    "Steady vibes and solid luck. The northern skies bring balanced harmony.",
    "Favorable alignment today—trust your instincts on timely decisions.",
  ],
  high: [
    "Like an aurora over the North, your brightest opportunities align today!",
    "Cosmic energy is surging—bold ventures and creative leaps are favored!",
  ],
};

function useMidnightCountdown() {
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const midnight = new Date();
      midnight.setHours(24, 0, 0, 0);

      const diff = midnight - now;
      if (diff <= 0) {
        setTimeLeft("0h 0m 0s");
        return;
      }

      const hrs = Math.floor(diff / 1000 / 60 / 60);
      const mins = Math.floor((diff / 1000 / 60) % 60);
      const secs = Math.floor((diff / 1000) % 60);

      setTimeLeft(`${hrs}h ${mins}m ${secs}s`);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, []);

  return timeLeft;
}

export function DailyLuckyMeter({ compact = false }) {
  const timeLeft = useMidnightCountdown();
  const [displayPercentage, setDisplayPercentage] = useState(0);
  const [status, setStatus] = useState("STANDBY");
  const [isAwakening, setIsAwakening] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [reading, setReading] = useState("");
  const intervalRef = useRef(null);

  const handleAwaken = () => {
    if (isAwakening || isComplete) return;

    setIsAwakening(true);
    const targetScore = Math.floor(Math.random() * 85) + 15; // Target score between 15% - 99%

    // Select reading
    const pool =
      targetScore < 40
        ? ORACLE_READINGS.low
        : targetScore < 75
        ? ORACLE_READINGS.mid
        : ORACLE_READINGS.high;
    const selectedReading = pool[Math.floor(Math.random() * pool.length)];

    let phase = 0;
    const startTime = Date.now();
    const totalDuration = 6000; // 6 seconds cinematic sequence

    intervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;

      if (elapsed < 2000) {
        // Phase 1: Rapid cosmic noise
        setStatus("READING COSMIC CURRENTS...");
        setDisplayPercentage(Math.floor(Math.random() * 100));
      } else if (elapsed < 4200) {
        // Phase 2: Resonance calibration
        setStatus("CONNECTING TO STARS...");
        const swing = Math.floor(
          targetScore + (Math.sin(elapsed / 150) * 20)
        );
        setDisplayPercentage(Math.max(1, Math.min(99, swing)));
      } else if (elapsed < 5800) {
        // Phase 3: Smooth ease into final score
        setStatus("CALIBRATING FINAL RESONANCE...");
        const progress = (elapsed - 4200) / 1600;
        const currentInterp = Math.round(
          displayPercentage + (targetScore - displayPercentage) * progress
        );
        setDisplayPercentage(currentInterp);
      } else {
        // Final completion
        clearInterval(intervalRef.current);
        setDisplayPercentage(targetScore);
        setStatus(
          targetScore < 40
            ? "STEADY VIBES AND GOOD LUCK."
            : targetScore < 75
            ? "PREMIUM FLOW AND HIGH LUCK."
            : "FLAGSHIP LUCK – COSMIC ALIGNMENT."
        );
        setReading(selectedReading);
        setIsAwakening(false);
        setIsComplete(true);
      }
    }, 60);
  };

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const sizeClass = compact ? "w-[160px] h-[160px]" : "w-[300px] h-[300px]";

  return (
    <div className={`relative flex flex-col items-center ${compact ? "gap-3" : "gap-5"} w-full max-w-md`}>
      {!compact && (
        <div className="text-center space-y-1">
          <h1 className="text-base tracking-[0.25em] text-amber-200 uppercase font-bold drop-shadow-[0_0_10px_rgba(255,215,106,0.5)]">
            DAILY LUCKY GENERATOR
          </h1>
          <p className="text-xs text-cyan-100/70 max-w-xs mx-auto">
            Every night at midnight, your Lucky Generator resets. Activate the vortex core to reveal your daily reading.
          </p>
        </div>
      )}

      {/* Countdown Badge */}
      <div className="inline-flex items-center rounded-full border border-cyan-300/30 bg-black/50 backdrop-blur-md px-3.5 py-1 text-xs">
        <span className="mr-2 text-cyan-100/70">Resets in:</span>
        <span className="font-semibold text-amber-300">{timeLeft}</span>
      </div>

      {/* Faceplate Container */}
      <div className={`relative bg-gradient-to-b from-gray-800 to-black border-2 border-gray-700 rounded-2xl shadow-2xl flex flex-col items-center justify-center ${compact ? "p-3 pt-6 pb-2" : "p-6 pt-10"} w-full`}>

        {/* Nameplate */}
        <div className="bg-gray-900 border border-gray-600 rounded px-4 py-1 shadow-inner absolute top-0 -translate-y-1/2">
          <span className="font-mono text-gray-400 tracking-widest text-[8px] sm:text-[10px] drop-shadow-[0_0_5px_rgba(255,255,255,0.3)]">
            LUCKY GENERATOR - MODEL 01
          </span>
        </div>

        {/* Futuristic Gauge Dial */}
        <div className={`relative ${sizeClass} rounded-full bg-black/80 border border-cyan-400/30 shadow-[0_0_50px_rgba(0,255,255,0.25)] flex items-center justify-center backdrop-blur-xl`}>
          {/* Outer Scale Dial SVG */}
        <svg className="absolute inset-0 w-full h-full p-3" viewBox="0 0 200 200">
          <defs>
            <linearGradient id="meterGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#00eaff" />
              <stop offset="50%" stopColor="#ffd56a" />
              <stop offset="100%" stopColor="#ff4d4d" />
            </linearGradient>
          </defs>

          {/* Background Arc Track */}
          <circle
            cx="100"
            cy="100"
            r="80"
            stroke="rgba(55, 65, 81, 0.8)"
            strokeWidth="10"
            fill="none"
            strokeDasharray="360"
            strokeDashoffset="90"
            strokeLinecap="round"
            transform="rotate(135 100 100)"
          />

          {/* Active Fill Arc */}
          <circle
            cx="100"
            cy="100"
            r="80"
            stroke="url(#meterGradient)"
            strokeWidth="12"
            fill="none"
            strokeDasharray="360"
            strokeDashoffset={360 - (270 * (isComplete || isAwakening ? displayPercentage : 0)) / 100}
            strokeLinecap="round"
            transform="rotate(135 100 100)"
            style={{
              transition: isAwakening ? "stroke-dashoffset 0.08s linear" : "stroke-dashoffset 0.8s ease-out",
            }}
          />

          {/* Scale Numbers & Ticks */}
          {[0, 20, 40, 60, 80, 100].map((val, idx) => {
            const angle = 135 + idx * (270 / 5);
            const rad = (angle * Math.PI) / 180;
            const x = 100 + 64 * Math.cos(rad);
            const y = 100 + 64 * Math.sin(rad);
            return (
              <text
                key={val}
                x={x}
                y={y + 3}
                fill="rgba(200, 230, 255, 0.6)"
                fontSize="9"
                fontWeight="bold"
                textAnchor="middle"
              >
                {val}
              </text>
            );
          })}
        </svg>

        {/* Center Rotating Vortex */}
        <div className={`absolute w-32 h-32 rounded-full border border-cyan-300/30 overflow-hidden shadow-[inset_0_0_20px_rgba(0,0,0,1)] animate-spin`} style={{ animationDuration: isAwakening ? "0.5s" : "3s" }}>
          <div className="absolute inset-0 bg-[conic-gradient(from_0deg,transparent,rgba(0,255,255,0.4),transparent)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(0,0,0,0.8),transparent)]" />
        </div>

        {/* Center Text Readouts */}
        <div className="relative z-10 flex flex-col items-center justify-center text-center px-4">
          <div className="text-3xl font-extrabold tracking-tight">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-200 via-amber-200 to-amber-400 drop-shadow-[0_0_12px_rgba(255,215,106,0.6)]">
              {isAwakening || isComplete ? `${displayPercentage}%` : "STANDBY"}
            </span>
          </div>
          <div className="mt-1 text-[10px] tracking-[0.18em] font-medium uppercase text-cyan-200/90 max-w-[170px] leading-tight">
            {status}
          </div>
        </div>
        </div>

        {/* Sequential Base LEDs */}
        <div className="flex gap-2 mt-4 z-10">
          {[0, 150, 300, 450, 600].map((delay, index) => {
            let ledClass = "bg-gray-800";
            if (isAwakening) {
              ledClass = "bg-cyan-400 animate-pulse";
            } else if (isComplete) {
              if (displayPercentage >= 75) ledClass = "bg-amber-400 shadow-[0_0_10px_#fbbf24]";
              else if (displayPercentage >= 40) ledClass = "bg-amber-200 shadow-[0_0_10px_#fde68a]";
              else ledClass = "bg-cyan-400 shadow-[0_0_10px_#22d3ee]";
            }
            return (
              <div
                key={index}
                className={`w-3 h-3 rounded-full transition-colors duration-300 ${ledClass}`}
                style={{ animationDelay: `${delay}ms` }}
              />
            );
          })}
        </div>
      </div>

      {/* Awaken Button */}
      <button
        onClick={handleAwaken}
        disabled={isAwakening || isComplete}
        className={`w-full max-w-xs rounded-full py-3 text-xs font-bold tracking-[0.2em] uppercase transition-all duration-300 ${
          isComplete
            ? "bg-cyan-950/60 border border-cyan-500/40 text-cyan-300/80 cursor-default"
            : isAwakening
            ? "bg-amber-500/50 border border-amber-300/50 text-amber-200 animate-pulse cursor-wait"
            : "bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 text-black shadow-[0_0_25px_rgba(255,215,106,0.6)] hover:brightness-110 active:scale-95"
        }`}
      >
        {isComplete ? "TODAY'S RESONANCE COMPLETE" : isAwakening ? "CONNECTING TO STARS..." : "ACTIVATE LUCKY GENERATOR"}
      </button>

      {/* Canadian Oracle Fortune Card */}
      {isComplete && reading && (
        <div className="w-full max-w-xs rounded-xl border border-amber-400/40 bg-black/60 backdrop-blur-md p-4 text-center space-y-1.5 animate-fade-in shadow-[0_0_20px_rgba(255,215,106,0.2)]">
          <div className="text-[10px] tracking-[0.2em] font-bold text-amber-300 uppercase">
            TODAY&apos;S ORACLE READING
          </div>
          <p className="text-xs text-cyan-100/90 italic">
            &ldquo;{reading}&rdquo;
          </p>
        </div>
      )}
    </div>
  );
}
