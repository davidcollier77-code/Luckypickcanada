"use client";
/**
 * DailyLuckyMeter.jsx
 * ---------------------------------------------------------------------------
 * luckypickcanada.ca — Daily Lucky Ritual widget
 *
 * Pure JavaScript version for standard .jsx / .js setups.
 * ---------------------------------------------------------------------------
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRollingScore } from "../hooks/useRollingScore";

const STORAGE_KEY = "lpc_daily_lucky_meter_v1";
const SHARE_URL = "https://luckypickcanada.ca";

const QUOTES = [
  "Your luck is like a spring bloom – abundant and beautiful.",
  "The stars are aligned for an unexpected positive turn.",
  "Fortune favors the bold, and today, you are bold.",
  "Luck is preparation meeting opportunity. Today is your day.",
  "A wave of good fortune is rolling in just for you.",
  "Your lucky break is just around the corner, keep walking.",
  "The universe is conspiring in your favor today.",
  "Today's vibe is 100% luck. Catch it.",
  "Lucky number... check. Lucky day... check. Let's go.",
  "Positive thoughts attract positive outcomes. Dream big.",
  "A chance encounter will lead to a lucky result.",
  "You don't just find luck, you are luck.",
];

function getLocalDateString(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function msUntilNextLocalMidnight() {
  const now = new Date();
  const next = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() + 1,
    0, 0, 0, 0
  );
  return Math.max(next.getTime() - now.getTime(), 1000);
}

function formatCountdown(ms) {
  const totalSeconds = Math.max(Math.floor(ms / 1000), 0);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return [h, m, s].map((v) => String(v).padStart(2, "0")).join(":");
}

function readStored() {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (
      parsed &&
      typeof parsed.lastPlayedDate === "string" &&
      typeof parsed.lastScore === "number" &&
      typeof parsed.lastQuoteIndex === "number"
    ) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

function writeStored(data) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // fail silently
  }
}

function generateNonRepeatingScore(prevScore) {
  let score = Math.floor(Math.random() * 101);
  let attempts = 0;
  while (prevScore !== null && score === prevScore && attempts < 10) {
    score = Math.floor(Math.random() * 101);
    attempts += 1;
  }
  if (prevScore !== null && score === prevScore) {
    score = (score + 1) % 101;
  }
  return score;
}

function generateNonRepeatingQuoteIndex(prevIndex) {
  let idx = Math.floor(Math.random() * QUOTES.length);
  let attempts = 0;
  while (prevIndex !== null && idx === prevIndex && attempts < 10) {
    idx = Math.floor(Math.random() * QUOTES.length);
    attempts += 1;
  }
  if (prevIndex !== null && idx === prevIndex) {
    idx = (idx + 1) % QUOTES.length;
  }
  return idx;
}

function getTier(score) {
  if (score <= 40) return 1;
  if (score <= 84) return 2;
  return 3;
}

function ledTiming(index, total) {
  const delay = ((index * 173) % 2600) / 1000;
  const duration = 1.6 + ((index * 47) % (total * 30)) / 100;
  return { delay, duration };
}

function ringPosition(index, total, radiusPct) {
  const angle = (index / total) * Math.PI * 2 - Math.PI / 2;
  const x = 50 + radiusPct * Math.cos(angle);
  const y = 50 + radiusPct * Math.sin(angle);
  return { left: `${x}%`, top: `${y}%` };
}

export default function DailyLuckyMeter() {
  const [phase, setPhase] = useState("idle");
  const [locked, setLocked] = useState(false);
  const [tier, setTier] = useState(1);
  const [score, setScore] = useState(null);
  const [quoteIndex, setQuoteIndex] = useState(null);
  const [showShare, setShowShare] = useState(false);
  const [shareLabel, setShareLabel] = useState("Share My Luck");
  const [nextResetMs, setNextResetMs] = useState(null);

  const revealTimeoutRef = useRef(null);
  const midnightTimeoutRef = useRef(null);
  const countdownIntervalRef = useRef(null);

  const isRevealing = phase === "revealing";
  const isRevealed = phase === "revealed";
  const displayScore = useRollingScore(score || 0, isRevealing, 3000);

  const scheduleMidnightReset = useCallback(() => {
    if (midnightTimeoutRef.current) clearTimeout(midnightTimeoutRef.current);
    const ms = msUntilNextLocalMidnight();
    midnightTimeoutRef.current = setTimeout(() => {
      setLocked(false);
      setPhase("idle");
      setScore(null);
      setQuoteIndex(null);
      setShowShare(false);
      scheduleMidnightReset();
    }, ms);
  }, []);

  useEffect(() => {
    const today = getLocalDateString();
    const stored = readStored();
    if (stored && stored.lastPlayedDate === today) {
      setLocked(true);
      setScore(stored.lastScore);
      setQuoteIndex(stored.lastQuoteIndex);
      setTier(getTier(stored.lastScore));
      setPhase("revealed");
      setShowShare(true);
    }
    scheduleMidnightReset();
    return () => {
      if (revealTimeoutRef.current) clearTimeout(revealTimeoutRef.current);
      if (midnightTimeoutRef.current) clearTimeout(midnightTimeoutRef.current);
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    };
  }, [scheduleMidnightReset]);

  useEffect(() => {
    if (!locked) {
      setNextResetMs(null);
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
      return;
    }
    const tick = () => setNextResetMs(msUntilNextLocalMidnight());
    tick();
    countdownIntervalRef.current = setInterval(tick, 1000);
    return () => {
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    };
  }, [locked]);

  const handleReveal = useCallback(() => {
    if (locked || phase === "revealing") return;
    const stored = readStored();
    const prevScore = stored ? stored.lastScore : null;
    const prevQuoteIndex = stored ? stored.lastQuoteIndex : null;
    const finalScore = generateNonRepeatingScore(prevScore);
    const finalQuoteIndex = generateNonRepeatingQuoteIndex(prevQuoteIndex);
    const finalTier = getTier(finalScore);

    setTier(finalTier);
    setScore(finalScore);
    setShowShare(false);
    setShareLabel("Share My Luck");
    setPhase("revealing");

    revealTimeoutRef.current = setTimeout(() => {
      setQuoteIndex(finalQuoteIndex);
      setPhase("revealed");
      setLocked(true);
      writeStored({
        lastPlayedDate: getLocalDateString(),
        lastScore: finalScore,
        lastQuoteIndex: finalQuoteIndex,
      });
      setTimeout(() => setShowShare(true), 550);
    }, 3000);
  }, [locked, phase]);

  const handleShare = useCallback(async () => {
    if (score === null) return;
    const text = `I just generated a ${score}% lucky score on Lucky Pick Canada! Check your daily fortune here: ${SHARE_URL}`;
    const nav = typeof navigator !== "undefined" ? navigator : null;
    try {
      if (nav && typeof nav.share === "function") {
        await nav.share({ text });
        return;
      }
    } catch {}
    try {
      if (nav && nav.clipboard && typeof nav.clipboard.writeText === "function") {
        await nav.clipboard.writeText(text);
        setShareLabel("Copied!");
        setTimeout(() => setShareLabel("Share My Luck"), 2000);
      }
    } catch {}
  }, [score]);

  const quote = quoteIndex !== null ? QUOTES[quoteIndex] : null;

  const leds = useMemo(() => Array.from({ length: 20 }, (_, i) => i), []);
  const bolts = useMemo(() => Array.from({ length: 8 }, (_, i) => i), []);
  const sparks = useMemo(() => Array.from({ length: 7 }, (_, i) => i), []);
  const bolts2 = useMemo(() => Array.from({ length: 5 }, (_, i) => i), []);

  const tierGlow = tier === 3
    ? "shadow-[0_0_140px_40px_rgba(163,230,53,0.55)]"
    : tier === 2
    ? "shadow-[0_0_100px_30px_rgba(74,222,128,0.4)]"
    : "shadow-[0_0_70px_20px_rgba(16,185,129,0.28)]";

  const machineAnimClass = isRevealing && tier === 1
    ? "animate-[dlm-shake_0.32s_ease-in-out_infinite]"
    : isRevealing && tier === 3
    ? "animate-[dlm-shake_0.18s_ease-in-out_infinite]"
    : "";

  const vortexRotateSpeed = isRevealing
    ? tier === 3
      ? "animate-[dlm-rotate-fast_1.1s_linear_infinite]"
      : tier === 2
      ? "animate-[dlm-rotate-fast_1.8s_linear_infinite]"
      : "animate-[dlm-rotate-slow_9s_linear_infinite]"
    : "animate-[dlm-rotate-slow_22s_linear_infinite]";

  return (
    <div className="relative w-full min-h-screen bg-[#04070a] overflow-x-hidden flex flex-col items-center px-4 py-10 sm:py-14">
      <div className="pointer-events-none fixed inset-0 opacity-40" style={{ backgroundImage: "radial-gradient(circle at 20% 15%, rgba(16,185,129,0.10), transparent 40%), radial-gradient(circle at 82% 78%, rgba(52,211,153,0.08), transparent 45%), radial-gradient(circle at 50% 100%, rgba(163,230,53,0.06), transparent 50%)" }} />
      <div className="pointer-events-none fixed inset-0 mix-blend-screen will-change-[opacity] animate-[dlm-twinkle_5s_ease-in-out_infinite]" style={{ backgroundSize: "200px 200px", backgroundImage: "radial-gradient(1px 1px at 20px 30px, #fff, rgba(0,0,0,0)), radial-gradient(1.5px 1.5px at 100px 50px, rgba(255,255,255,0.8), rgba(0,0,0,0)), radial-gradient(1px 1px at 150px 120px, #fff, rgba(0,0,0,0)), radial-gradient(2px 2px at 50px 180px, rgba(255,255,255,0.6), rgba(0,0,0,0)), radial-gradient(1px 1px at 180px 180px, rgba(255,255,255,0.9), rgba(0,0,0,0))" }} />
      <div className="pointer-events-none fixed inset-0 opacity-[0.05] mix-blend-overlay" style={{ backgroundImage: "repeating-linear-gradient(0deg, #fff 0px, transparent 1px, transparent 3px)" }} />
      <style>{`
        @keyframes dlm-twinkle { 0%, 100% { opacity: 0.5; transform: scale(1); } 50% { opacity: 1; transform: scale(1.1); } }
        @keyframes dlm-breathe { 0% { transform: scale(0.96); filter: brightness(0.92); } 50% { transform: scale(1.045); filter: brightness(1.12); } 100% { transform: scale(0.96); filter: brightness(0.92); } }
        @keyframes dlm-rotate-slow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes dlm-rotate-slow-rev { from { transform: rotate(360deg); } to { transform: rotate(0deg); } }
        @keyframes dlm-rotate-fast { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes dlm-led { 0%, 100% { opacity: 0.25; filter: brightness(0.8); } 50% { opacity: 1; filter: brightness(1.6); } }
        @keyframes dlm-shadow-shift { 0% { box-shadow: inset 0 3px 6px rgba(255,255,255,0.35), inset 0 -10px 18px rgba(0,0,0,0.65), 0 22px 45px -10px rgba(0,0,0,0.75), 0 0 0 2px rgba(255,255,255,0.06); } 50% { box-shadow: inset 0 4px 9px rgba(255,255,255,0.45), inset 0 -14px 22px rgba(0,0,0,0.7), 0 28px 55px -8px rgba(0,0,0,0.8), 0 0 0 2px rgba(255,255,255,0.09); } 100% { box-shadow: inset 0 3px 6px rgba(255,255,255,0.35), inset 0 -10px 18px rgba(0,0,0,0.65), 0 22px 45px -10px rgba(0,0,0,0.75), 0 0 0 2px rgba(255,255,255,0.06); } }
        @keyframes dlm-shake { 0% { transform: translate(0, 0) rotate(0deg); } 25% { transform: translate(-1.5px, 1px) rotate(-0.3deg); } 50% { transform: translate(1.5px, -1px) rotate(0.3deg); } 75% { transform: translate(-1px, -1.5px) rotate(-0.2deg); } 100% { transform: translate(0, 0) rotate(0deg); } }
        @keyframes dlm-spark { 0%, 100% { opacity: 0; transform: scale(0.4); } 50% { opacity: 1; transform: scale(1); } }
        @keyframes dlm-flash { 0%, 100% { opacity: 0; } 50% { opacity: 1; } }
        @keyframes dlm-pop-in { 0% { opacity: 0; transform: scale(0.35); } 60% { opacity: 1; transform: scale(1.18); } 80% { transform: scale(0.94); } 100% { opacity: 1; transform: scale(1); } }
        @keyframes dlm-fade-up { 0% { opacity: 0; transform: translateY(10px); } 100% { opacity: 1; transform: translateY(0); } }
        @keyframes dlm-glow-pulse { 0%, 100% { opacity: 0.55; transform: scale(0.94); } 50% { opacity: 0.9; transform: scale(1.06); } }
        @keyframes dlm-lightning-jitter { 0%, 100% { opacity: 0; } 8% { opacity: 1; } 12% { opacity: 0; } 20% { opacity: 0.85; } 24% { opacity: 0; } 55% { opacity: 0.7; } 60% { opacity: 0; } }
        @media (prefers-reduced-motion: reduce) { .dlm-motion-safe { animation: none !important; transition: none !important; } }
      `}</style>

      {/* TOP BANNER */}
      <div className="w-full max-w-xl mb-10">
        <div className="relative rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-xl px-5 py-4 sm:px-7 sm:py-5 shadow-[0_1px_0_rgba(255,255,255,0.12)_inset,0_20px_40px_-20px_rgba(0,0,0,0.8)]">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />
          <h1 className="text-center font-semibold tracking-wide text-transparent bg-clip-text bg-gradient-to-b from-emerald-100 via-emerald-300 to-emerald-500 text-lg sm:text-2xl">
            Your Daily Lucky Ritual
          </h1>
          <p className="mt-1.5 text-center text-[11px] sm:text-xs leading-relaxed text-white/45">
            This site is just for fun. It has no affiliation with gambling. There are no lottery prizes.
          </p>
        </div>
      </div>

      {/* MACHINE */}
      <div className="relative w-[300px] h-[300px] sm:w-[360px] sm:h-[360px] shrink-0">
        <div className={`absolute -inset-6 rounded-full blur-3xl dlm-motion-safe ${isRevealing || isRevealed ? (tier === 3 ? "bg-lime-400/40" : tier === 2 ? "bg-emerald-400/30" : "bg-emerald-600/20") : "bg-emerald-500/15"} animate-[dlm-glow-pulse_4.5s_ease-in-out_infinite]`} />

        <div className={`absolute inset-0 rounded-full dlm-motion-safe animate-[dlm-shadow-shift_6s_ease-in-out_infinite] ${machineAnimClass}`} style={{ background: "conic-gradient(from 210deg, #e6ecef, #97a3ab, #4b545c, #232a30, #4b545c, #97a3ab, #cfd8dc, #97a3ab, #4b545c, #e6ecef)" }}>
          <div className="absolute inset-0 rounded-full mix-blend-overlay opacity-60" style={{ background: "radial-gradient(circle at 30% 22%, rgba(255,255,255,0.9), transparent 45%), radial-gradient(circle at 75% 80%, rgba(255,255,255,0.25), transparent 55%)" }} />
          {bolts.map((i) => {
            const pos = ringPosition(i, bolts.length, 47.5);
            return (
              <div key={`bolt-${i}`} className="absolute w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full -translate-x-1/2 -translate-y-1/2 dlm-motion-safe animate-[dlm-shadow-shift_6s_ease-in-out_infinite]" style={{ left: pos.left, top: pos.top, background: "radial-gradient(circle at 35% 30%, #f5f7f8, #9aa5ab 45%, #2b3236 100%)", boxShadow: "inset 0 -1px 1px rgba(0,0,0,0.6), 0 1px 1px rgba(255,255,255,0.4)" }} />
            );
          })}
        </div>

        <div className="absolute inset-[9%] rounded-full" style={{ background: "radial-gradient(circle at 50% 35%, #0d1a16 0%, #050a08 70%, #020403 100%)", boxShadow: "inset 0 8px 18px rgba(0,0,0,0.85), inset 0 -3px 8px rgba(255,255,255,0.05)" }}>
          {leds.map((i) => {
            const pos = ringPosition(i, leds.length, 44);
            const { delay, duration } = ledTiming(i, leds.length);
            const isAmber = i % 5 === 0;
            return (
              <div key={`led-${i}`} className="absolute w-[5px] h-[5px] sm:w-[6px] sm:h-[6px] rounded-full -translate-x-1/2 -translate-y-1/2 dlm-motion-safe" style={{ left: pos.left, top: pos.top, background: isAmber ? "#fbbf24" : "#f8fafc", boxShadow: isAmber ? "0 0 6px 1px rgba(251,191,36,0.9)" : "0 0 6px 1px rgba(248,250,252,0.9)", animation: `dlm-led ${duration}s ease-in-out ${delay}s infinite` }} />
            );
          })}

          <div className={`absolute inset-[13%] rounded-full overflow-hidden dlm-motion-safe transition-shadow duration-500 ${isRevealing || isRevealed ? tierGlow : ""}`}>
            <div className="absolute inset-0 rounded-full bg-[#020604]" />
            <div className={`absolute -inset-4 dlm-motion-safe ${vortexRotateSpeed}`} style={{ background: "conic-gradient(from 0deg, #052e19, #0f7a45, #34d399, #052e19, #0a5c33, #0f7a45, #052e19)", opacity: isRevealing || isRevealed ? 0.9 : 0.55, mixBlendMode: "screen" }} />
            <div className="absolute -inset-6 dlm-motion-safe animate-[dlm-rotate-slow-rev_16s_linear_infinite]" style={{ background: "conic-gradient(from 90deg, transparent, rgba(163,230,53,0.5), transparent 40%, transparent 60%, rgba(74,222,128,0.35), transparent)", opacity: isRevealing ? (tier === 3 ? 0.95 : 0.6) : 0.3, mixBlendMode: "screen" }} />
            <div className="absolute inset-[18%] rounded-full dlm-motion-safe animate-[dlm-breathe_4s_ease-in-out_infinite]" style={{ background: "radial-gradient(circle at 45% 40%, rgba(220,255,230,0.95), rgba(52,211,153,0.55) 35%, rgba(6,78,44,0.25) 65%, transparent 75%)" }} />
            <div className="absolute inset-0 rounded-full opacity-40 mix-blend-soft-light pointer-events-none" style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.9) 0%, transparent 30%, transparent 70%, rgba(255,255,255,0.15) 100%)" }} />

            {isRevealing && sparks.map((i) => {
              const pos = ringPosition(i, sparks.length, 30 + (i % 3) * 5);
              const dur = 0.4 + (i % 4) * 0.15;
              const del = (i * 0.09) % 0.6;
              return (
                <div key={`spark-${i}`} className="absolute w-[3px] h-[3px] sm:w-1 sm:h-1 rounded-full bg-white" style={{ left: pos.left, top: pos.top, boxShadow: "0 0 8px 2px rgba(190,255,210,0.9)", animation: `dlm-spark ${dur}s ease-in-out ${del}s infinite` }} />
              );
            })}

            {isRevealing && tier === 3 && (
              <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full">
                {bolts2.map((i) => {
                  const rot = (360 / bolts2.length) * i;
                  const del = (i * 0.11) % 0.5;
                  return (
                    <g key={`bolt2-${i}`} style={{ transformOrigin: "50px 50px", transform: `rotate(${rot}deg)`, animation: `dlm-lightning-jitter ${0.9 + (i % 3) * 0.2}s ease-in-out ${del}s infinite` }}>
                      <path d="M50 6 L44 34 L54 34 L40 62 L58 40 L48 40 Z" fill="#d9f99d" opacity={0.9} />
                    </g>
                  );
                })}
              </svg>
            )}

            {isRevealing && tier === 3 && (
              <div className="absolute inset-0 rounded-full bg-lime-200 dlm-motion-safe animate-[dlm-flash_0.45s_ease-in-out_infinite]" style={{ mixBlendMode: "overlay" }} />
            )}

            <div className="absolute inset-0 flex flex-col items-center justify-center">
              {phase === "idle" && (
                <div className="flex flex-col items-center gap-1 dlm-motion-safe animate-[dlm-breathe_4s_ease-in-out_infinite]">
                  <svg width="30" height="30" viewBox="0 0 24 24" fill="none" className="opacity-70">
                    <path d="M12 2 L14.2 9.2 L21.5 9.5 L15.6 14 L17.8 21.2 L12 16.8 L6.2 21.2 L8.4 14 L2.5 9.5 L9.8 9.2 Z" stroke="#6ee7b7" strokeWidth="1" fill="rgba(110,231,183,0.15)" />
                  </svg>
                  <span className="text-[9px] sm:text-[10px] tracking-[0.25em] text-emerald-200/50 font-medium">TAP TO REVEAL</span>
                </div>
              )}
              {isRevealing && (
                <span className="absolute top-[20%] text-[11px] sm:text-xs tracking-[0.3em] font-semibold text-emerald-100/80">
                  ANALYZING <span className="inline-block animate-pulse">...</span>
                </span>
              )}
              {(isRevealing || isRevealed) && score !== null && (
                <div className="relative flex items-center justify-center my-6">
                  {/* Ambient Optical Bloom */}
                  <div className="absolute inset-0 rounded-full bg-emerald-500/20 blur-2xl animate-cinematic-pulse pointer-events-none" />

                  {/* Specular Rim Light */}
                  <div className="absolute inset-0 rounded-full border border-emerald-400/20 animate-specular-glint pointer-events-none" />

                  {/* Micro Stardust Motes */}
                  <span className="absolute top-8 left-12 w-1.5 h-1.5 rounded-full bg-emerald-300/80 blur-[0.5px] animate-mote-1 pointer-events-none" />
                  <span className="absolute bottom-10 right-14 w-1 h-1 rounded-full bg-amber-200/70 blur-[0.5px] animate-mote-2 pointer-events-none" />
                  <span className="absolute top-1/2 right-6 w-1.5 h-1.5 rounded-full bg-teal-200/60 blur-[0.5px] animate-mote-3 pointer-events-none" />

                  {/* Center Score Display */}
                  <div className="z-10 text-center">
                    <div className="text-4xl font-extrabold text-emerald-300 drop-shadow-[0_0_12px_rgba(52,211,153,0.6)]">
                      {displayScore}%
                    </div>
                    <div className="text-xs uppercase tracking-widest text-emerald-400/80 mt-1 font-semibold">
                      Luck Score
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* CONTROLS */}
      <div className="w-full max-w-xl mt-10 flex flex-col items-center gap-5">
        <button type="button" onClick={handleReveal} disabled={locked || isRevealing} className={`relative min-w-[220px] px-8 py-3.5 rounded-2xl font-semibold tracking-wide text-sm sm:text-base transition-transform duration-150 active:scale-[0.97] disabled:active:scale-100 ${locked ? "cursor-not-allowed text-white/35" : "text-amber-950 cursor-pointer hover:brightness-110"}`} style={{ background: locked ? "linear-gradient(180deg, #3a4038, #23271f)" : "linear-gradient(180deg, #fef3c7 0%, #fde68a 12%, #f59e0b 55%, #b45309 100%)", boxShadow: locked ? "inset 0 2px 3px rgba(255,255,255,0.06), inset 0 -4px 8px rgba(0,0,0,0.6)" : "inset 0 2px 2px rgba(255,255,255,0.8), inset 0 -6px 10px rgba(120,53,15,0.5), 0 10px 25px -8px rgba(245,158,11,0.7)" }}>
          {isRevealing ? "Reading The Signs…" : locked ? "Revealed For Today" : "Reveal Luck"}
        </button>

        {locked && nextResetMs !== null && (
          <p className="text-[11px] sm:text-xs text-white/35 tracking-wide -mt-2">
            Next ritual unlocks in <span className="text-emerald-300/70 tabular-nums font-medium">{formatCountdown(nextResetMs)}</span>
          </p>
        )}

        <div className="w-full min-h-[76px] rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-xl px-5 py-4 sm:px-7 sm:py-5 flex items-center justify-center text-center shadow-[0_1px_0_rgba(255,255,255,0.1)_inset,0_15px_35px_-15px_rgba(0,0,0,0.8)]">
          {quote ? (
            <p key={quote} className="text-sm sm:text-base text-emerald-50/85 italic leading-relaxed dlm-motion-safe animate-[dlm-fade-up_0.5s_ease_both]">
              “{quote}”
            </p>
          ) : (
            <p className="text-xs sm:text-sm text-white/30 tracking-wide">
              {isRevealing ? "Your fortune is taking shape…" : "Your daily fortune will appear here."}
            </p>
          )}
        </div>

        {showShare && quote && (
          <button type="button" onClick={handleShare} className="w-full py-3.5 px-6 rounded-xl font-bold text-neutral-950 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 shadow-[0_0_24px_rgba(245,158,11,0.35)] hover:shadow-[0_0_32px_rgba(245,158,11,0.55)] active:scale-95 transition-all duration-300">
            {shareLabel}
          </button>
        )}
      </div>
    </div>
  );
}