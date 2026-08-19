"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import Image from "next/image";

export function DailyLuckyMeter({ compact = false }) {
  const [displayPercentage, setDisplayPercentage] = useState(null);
  const [isAwakening, setIsAwakening] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [displayQuote, setDisplayQuote] = useState("");
  const [tierClass, setTierClass] = useState("animate-float-slow");
  const [textAnimation, setTextAnimation] = useState("animate-pop-out");
  const [textStyle, setTextStyle] = useState(
    "text-emerald-300 drop-shadow-[0_0_20px_rgba(52,211,153,0.8)]",
  );

  const [cooldownRemaining, setCooldownRemaining] = useState(null);
  const [isLocked, setIsLocked] = useState(false);

  const awakenTimeoutRef = useRef(null);
  const tierResetTimeoutRef = useRef(null);

  const fortuneQuotes = [
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

  useEffect(() => {
    return () => {
      // Cleanup any running timeouts when unmounting
      if (awakenTimeoutRef.current) clearTimeout(awakenTimeoutRef.current);
      if (tierResetTimeoutRef.current)
        clearTimeout(tierResetTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    const checkCooldown = () => {
      try {
        const nextAvailable = localStorage.getItem(
          "luckyGeneratorNextAvailable",
        );
        if (nextAvailable) {
          const remaining = parseInt(nextAvailable, 10) - Date.now();
          if (remaining > 0) {
            setIsLocked(true);
            const hours = Math.floor(remaining / (1000 * 60 * 60));
            const minutes = Math.floor((remaining / 1000 / 60) % 60);
            const seconds = Math.floor((remaining / 1000) % 60);
            setCooldownRemaining(
              `${hours.toString().padStart(2, "0")}:${minutes
                .toString()
                .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`,
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
      } catch (error) {
        console.error("Failed to access localStorage:", error);
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
    awakenTimeoutRef.current = setTimeout(() => {
      let targetScore;
      let selectedQuote;

      try {
        const previousScore = localStorage.getItem(
          "luckyGeneratorPreviousScore",
        );
        const previousQuote = localStorage.getItem(
          "luckyGeneratorPreviousQuote",
        );

        // Anti-repeat logic for score
        let scoreAttempts = 0;
        do {
          targetScore = Math.floor(Math.random() * 101); // 0% to 100%
          scoreAttempts++;
        } while (
          previousScore &&
          targetScore.toString() === previousScore &&
          scoreAttempts < 10
        );

        // Anti-repeat logic for quote
        let quoteAttempts = 0;
        do {
          selectedQuote =
            fortuneQuotes[Math.floor(Math.random() * fortuneQuotes.length)];
          quoteAttempts++;
        } while (
          previousQuote &&
          selectedQuote === previousQuote &&
          quoteAttempts < 10
        );

        localStorage.setItem(
          "luckyGeneratorPreviousScore",
          targetScore.toString(),
        );
        localStorage.setItem("luckyGeneratorPreviousQuote", selectedQuote);
      } catch (e) {
        console.error("Failed to read/write previous score in localStorage", e);
        targetScore = Math.floor(Math.random() * 101);
        selectedQuote =
          fortuneQuotes[Math.floor(Math.random() * fortuneQuotes.length)];
      }

      // Tier logic
      if (targetScore <= 40) {
        setTierClass("animate-shake-slight");
        setTextAnimation("animate-fade-in-dim");
        setTextStyle(
          "text-emerald-100/70 drop-shadow-[0_0_10px_rgba(52,211,153,0.3)]",
        );
      } else if (targetScore <= 84) {
        setTierClass("animate-pulse-rapid");
        setTextAnimation("animate-pop-bright");
        setTextStyle(
          "text-emerald-300 drop-shadow-[0_0_20px_rgba(52,211,153,0.8)]",
        );
      } else {
        setTierClass("animate-shake-heavy animate-surge-flash");
        setTextAnimation("animate-scale-dramatic-neon");
        setTextStyle(
          "text-emerald-400 drop-shadow-[0_0_30px_rgba(52,211,153,1)]",
        );
      }

      setDisplayPercentage(targetScore);
      setDisplayQuote(selectedQuote);
      setIsAwakening(false);
      setIsComplete(true);

      // Reset machine float animation after reveal effects
      tierResetTimeoutRef.current = setTimeout(() => {
        setTierClass("animate-float-slow");
      }, 1500);

      // Lock until exact midnight local time
      try {
        const now = new Date();
        const midnight = new Date(now);
        midnight.setHours(24, 0, 0, 0); // Next midnight

        localStorage.setItem(
          "luckyGeneratorNextAvailable",
          midnight.getTime().toString(),
        );
        setIsLocked(true);
      } catch (error) {
        console.error("Failed to set cooldown in localStorage:", error);
      }
    }, 2000);
  };

  const sizeClass = compact ? "w-[240px] h-[240px]" : "w-[400px] h-[400px]";

  return (
    <div
      className={`relative flex flex-col items-center gap-8 w-full max-w-2xl mx-auto p-4`}
    >
      {/* Navigation */}
      <Link
        href="/"
        className="px-5 py-2 text-sm font-bold tracking-widest text-emerald-400 uppercase transition-colors border border-emerald-500/50 rounded-full hover:bg-emerald-500/20 hover:text-emerald-300 backdrop-blur-sm"
      >
        Back to Home
      </Link>

      {/* Top Section: Title / Info */}
      {!compact && (
        <div className="relative z-10 space-y-3 text-center p-6 rounded-2xl bg-black/40 backdrop-blur-md border border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.5)]">
          <h1 className="text-3xl tracking-[0.2em] text-emerald-400 uppercase font-black drop-shadow-[0_0_15px_rgba(52,211,153,0.5)]">
            Your Daily Lucky Ritual
          </h1>
          <p className="max-w-md mx-auto text-base text-gray-300 leading-relaxed font-light">
            Power up the machine once a day to check your daily fortune and see
            what the universe has in store for you.
          </p>
          <div className="mt-4 pt-4 border-t border-white/10">
            <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">
              Disclaimer
            </p>
            <p className="text-xs text-gray-400 mt-1">
              This site is just for fun. It has no affiliation with gambling.
              There are no lottery prizes.
            </p>
          </div>
        </div>
      )}

      {/* Middle Section: The Machine */}
      <div
        className={`relative flex items-center justify-center ${sizeClass} ${isAwakening ? "animate-pulse-rapid" : tierClass}`}
      >
        {/* Underglow */}
        <div className="absolute inset-0 bg-emerald-500/20 blur-[100px] rounded-full pointer-events-none" />

        {/* Machine Image */}
        <div
          className={`relative w-full h-full drop-shadow-3d transition-transform duration-500`}
        >
          <Image
            src="/images/lucky-generator.png"
            alt="Lucky Generator Machine"
            fill
            className="object-contain"
            priority
          />
        </div>

        {/* Central UI / Percentage Overlay */}
        {/* We place this absolute center to match the machine's portal. Adjust as necessary if the portal isn't perfectly centered. */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none w-[50%] h-[50%]">
          {isComplete && displayPercentage !== null && (
            <div className={`flex items-baseline gap-1 ${textAnimation}`}>
              <span
                className={`text-7xl md:text-8xl font-black tracking-tighter ${textStyle}`}
              >
                {displayPercentage}
              </span>
              <span className={`text-4xl font-bold ${textStyle}`}>%</span>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Section: Generate Luck Button & Timer */}
      <div className="w-full max-w-sm space-y-6 flex flex-col items-center">
        {isLocked && cooldownRemaining ? (
          <div className="flex flex-col items-center p-5 space-y-2 border border-emerald-900/50 rounded-2xl bg-black/60 backdrop-blur-md shadow-lg w-full">
            <span className="text-sm font-bold tracking-[0.2em] text-emerald-600 uppercase">
              Powering Up...
            </span>
            <span className="font-mono text-3xl font-black text-emerald-500 drop-shadow-[0_0_10px_rgba(16,185,129,0.5)] tracking-widest">
              {cooldownRemaining}
            </span>
          </div>
        ) : (
          <button
            onClick={handleAwaken}
            disabled={isAwakening}
            className={`relative group overflow-hidden w-full rounded-2xl py-5 text-lg font-black tracking-[0.2em] uppercase transition-all duration-500 ${
              isAwakening
                ? "bg-emerald-950 border border-emerald-900 text-emerald-800 cursor-wait shadow-inner"
                : "bg-gradient-to-b from-emerald-400 to-emerald-600 text-black shadow-[0_0_30px_rgba(52,211,153,0.3)] hover:shadow-[0_0_50px_rgba(52,211,153,0.6)] hover:scale-[1.03] active:scale-[0.98] border border-emerald-300"
            }`}
          >
            <span className="relative z-10 flex items-center justify-center gap-2">
              {isAwakening ? (
                <>
                  <span className="animate-pulse">ACTIVATING</span>
                  <span className="flex space-x-1">
                    <span
                      className="w-1.5 h-1.5 bg-emerald-700 rounded-full animate-bounce"
                      style={{ animationDelay: "0ms" }}
                    ></span>
                    <span
                      className="w-1.5 h-1.5 bg-emerald-700 rounded-full animate-bounce"
                      style={{ animationDelay: "150ms" }}
                    ></span>
                    <span
                      className="w-1.5 h-1.5 bg-emerald-700 rounded-full animate-bounce"
                      style={{ animationDelay: "300ms" }}
                    ></span>
                  </span>
                </>
              ) : (
                "REVEAL LUCK"
              )}
            </span>
            {/* Glossy Overlay */}
            {!isAwakening && (
              <div className="absolute inset-0 bg-gradient-to-b from-white/30 to-transparent opacity-50 pointer-events-none" />
            )}
            {/* Hover Sweep */}
            {!isAwakening && (
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-[150%] group-hover:translate-x-[150%] transition-transform duration-1000 ease-in-out pointer-events-none" />
            )}
          </button>
        )}

        {/* Fortune Quote Area */}
        {!compact && isComplete && (
          <div className="w-full p-6 text-center rounded-2xl bg-black/40 backdrop-blur-md border border-white/5 shadow-xl animate-fade-in-dim">
            <p className="text-lg text-emerald-100 font-serif italic leading-relaxed">
              "{displayQuote}"
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
