"use client";

import { useEffect, useState } from "react";

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
  const [percentage, setPercentage] = useState(0);
  const [status, setStatus] = useState("STANDBY");
  const [awakened, setAwakened] = useState(false);

  useEffect(() => {
    if (!awakened) return;

    setStatus("AWAKENING...");
    const t1 = setTimeout(() => {
      const value = 72;
      setPercentage(value);
      setStatus(
        value < 35
          ? "STEADY VIBES AND GOOD LUCK."
          : value < 80
          ? "PREMIUM FLOW AND HIGH LUCK."
          : "FLAGSHIP LUCK – COSMIC ALIGNMENT."
      );
    }, 1200);

    return () => clearTimeout(t1);
  }, [awakened]);

  const handleAwaken = () => {
    if (!awakened) {
      setAwakened(true);
    }
  };

  const sizeClass = compact ? "w-[210px] h-[210px]" : "w-[360px] h-[360px]";
  const fontScale = compact ? "text-xs" : "text-sm";

  return (
    <div
      className={`relative flex flex-col items-center ${
        compact ? "gap-2" : "gap-4"
      }`}
    >
      {!compact && (
        <div className="text-center space-y-2">
          <h1 className="text-sm tracking-[0.25em] text-cyan-200 uppercase font-semibold">
            DAILY LUCKY METER
          </h1>
          <p className="text-xs text-cyan-100/80 max-w-xl mx-auto">
            Every night at midnight, your Lucky Meter resets. Awaken the vector
            core to reveal your daily reading.
          </p>
        </div>
      )}

      <div
        className={`inline-flex items-center rounded-full border border-cyan-300/40 bg-black/40 backdrop-blur-md px-3 py-1 ${fontScale}`}
      >
        <span className="mr-2 text-cyan-100/80">Resets in:</span>
        <span className="font-semibold text-cyan-200">{timeLeft}</span>
      </div>

      <div
        className={`relative ${sizeClass} rounded-full bg-gradient-to-br from-cyan-500/10 via-black/60 to-amber-500/10 border border-cyan-300/40 shadow-[0_0_40px_rgba(0,255,255,0.35)] overflow-hidden backdrop-blur-xl`}
      >
        <div className="absolute inset-0 rounded-full border border-cyan-300/30 shadow-[0_0_60px_rgba(0,255,255,0.45)]" />

        <svg
          className="absolute inset-0"
          viewBox="0 0 200 200"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="meterArcGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#00eaff" />
              <stop offset="50%" stopColor="#00ffc3" />
              <stop offset="100%" stopColor="#ffd56a" />
            </linearGradient>
            <filter id="meterGlow">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feColorMatrix
                in="blur"
                type="matrix"
                values="0 0 0 0 0.0  0 0 0 0 1.0  0 0 0 0 0.9  0 0 0 0 0.8 0"
              />
            </filter>
          </defs>

          <circle
            cx="100"
            cy="100"
            r="78"
            stroke="rgba(0, 255, 255, 0.18)"
            strokeWidth="10"
            fill="none"
            strokeDasharray="260"
            strokeDashoffset="0"
            strokeLinecap="round"
          />

          <circle
            cx="100"
            cy="100"
            r="78"
            stroke="url(#meterArcGradient)"
            strokeWidth="10"
            fill="none"
            strokeDasharray="260"
            strokeDashoffset={260 - (260 * percentage) / 100}
            strokeLinecap="round"
            style={{
              transition: "stroke-dashoffset 1.2s ease-out",
              filter: "url(#meterGlow)",
            }}
          />
        </svg>

        <div className="absolute inset-[26%] rounded-full bg-gradient-to-tr from-cyan-500/40 via-black to-amber-400/40 border border-cyan-300/40 overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(0,255,255,0.6),transparent_55%),radial-gradient(circle_at_70%_80%,rgba(255,215,106,0.7),transparent_55%)] animate-spin" />
          <div className="absolute inset-[22%] rounded-full bg-black/70 border border-cyan-200/40 shadow-inner" />
        </div>

        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
          <div className={compact ? "text-2xl font-semibold" : "text-4xl font-semibold"}>
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-200 via-cyan-50 to-amber-200 drop-shadow-[0_0_12px_rgba(0,255,255,0.7)]">
              {awakened ? `${percentage}%` : "— —"}
            </span>
          </div>
          <div className={`mt-1 ${compact ? "text-[10px]" : "text-xs"} tracking-[0.18em] uppercase text-cyan-100/80`}>
            {status}
          </div>
        </div>

        <div className="absolute inset-[10%]">
          {[...Array(24)].map((_, i) => {
            const angle = (i / 24) * 360;
            return (
              <div
                key={i}
                className="absolute w-[2px] h-[10px] bg-cyan-200/40 origin-center"
                style={{
                  left: "50%",
                  top: "4%",
                  transform: `rotate(${angle}deg) translateX(-50%)`,
                }}
              />
            );
          })}
        </div>
      </div>

      <button
        onClick={handleAwaken}
        className={`mt-2 inline-flex items-center justify-center rounded-full bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 px-6 py-2 text-xs font-semibold tracking-[0.18em] uppercase text-black shadow-[0_0_30px_rgba(255,215,106,0.7)] hover:shadow-[0_0_40px_rgba(255,215,106,0.9)] hover:brightness-110 transition-all ${
          awakened ? "opacity-70 cursor-default" : ""
        }`}
        disabled={awakened}
      >
        AWAKEN LUCKY METER
      </button>

      {!compact && (
        <div className="mt-3 text-[11px] text-cyan-100/70 flex flex-wrap justify-center gap-3">
          <span className="border border-cyan-300/30 rounded-full px-3 py-1 bg-black/40 backdrop-blur-md">
            Vector core calibration: real-time cosmic sampling.
          </span>
          <span className="border border-cyan-300/30 rounded-full px-3 py-1 bg-black/40 backdrop-blur-md">
            Daily ritual log available in your dashboard.
          </span>
        </div>
      )}
    </div>
  );
}
