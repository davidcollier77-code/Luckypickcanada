"use client"; 

import { useState, useEffect, useRef } from "react";
import Link from "next/link";

// 16 Mystical Canadian Luck Quotes
const LUCK_QUOTES = [
  "A wave of Canadian luck is quietly forming behind you.",
  "Someone will brighten your day in an unexpected way.",
  "Your patience today will unlock tomorrow’s reward.",
  "A small risk will turn into a big opportunity.",
  "Your kindness will return to you before the week ends.",
  "A lucky break is waiting in a familiar place.",
  "Your energy today attracts good fortune.",
  "A positive surprise is on its way.",
  "Your intuition will guide you to something valuable.",
  "A new connection will bring unexpected luck.",
  "Your calm mindset strengthens your luck today.",
  "A moment of clarity will lead to a lucky decision.",
  "The northern lights align to guide your steps today.",
  "Great fortune flows like the strong currents of the Great Lakes.",
  "The frost clears to reveal a bright, lucky day ahead.",
  "Your energy attracts prosperity from coast to coast."
];

export default function LuckyMeterPage() {
  const [isMounted, setIsMounted] = useState(false);
  const [percentage, setPercentage] = useState(0);
  const [displayedPercentage, setDisplayedPercentage] = useState(0);
  const [tier, setTier] = useState("");
  const [quote, setQuote] = useState("");
  const [hasRolledToday, setHasRolledToday] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [revealProgress, setRevealProgress] = useState(0); // 0 -> 1 during reveal
  const [timeLeft, setTimeLeft] = useState("");
  const [shareToast, setShareToast] = useState(false);
  const [imageError, setImageError] = useState(false);

  const animIntervalRef = useRef(null);
  const animTimeoutRef = useRef(null);

  // Clean up animation timers on component unmount
  useEffect(() => {
    return () => {
      if (animIntervalRef.current) clearInterval(animIntervalRef.current);
      if (animTimeoutRef.current) clearTimeout(animTimeoutRef.current);
    };
  }, []);

  // Helper: Get user's local YYYY-MM-DD date key
  const getTodayDateKey = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  // Strict 3-Tier Calculation Helper
  const calculateTier = (pct) => {
    if (pct >= 80) return "FLAGSHIP LUCK";
    if (pct >= 50) return "PREMIUM LUCK";
    return "STANDARD LUCK";
  };

  // Hydration safety & restore saved daily roll
  useEffect(() => {
    setIsMounted(true);
    const todayKey = getTodayDateKey();

    try {
      const savedData = localStorage.getItem(`luckymeter_${todayKey}`);
      if (savedData) {
        const parsed = JSON.parse(savedData);
        setPercentage(parsed.percentage);
        setDisplayedPercentage(parsed.percentage);
        setTier(parsed.tier);
        setQuote(parsed.quote);
        setHasRolledToday(true);
        setRevealProgress(1);
      }
    } catch (e) {
      console.warn("Storage access failed:", e);
    }
  }, []);

  // Live countdown timer targeting local midnight
  useEffect(() => {
    if (!isMounted) return;

    function updateCountdown() {
      const now = new Date();
      const midnight = new Date();
      midnight.setHours(24, 0, 0, 0);

      const diff = midnight.getTime() - now.getTime();
      if (diff <= 0) {
        setTimeLeft("0h 0m 0s");
        setHasRolledToday(false);
        setPercentage(0);
        setDisplayedPercentage(0);
        setRevealProgress(0);
        setTier("");
        setQuote("");

        try {
          const todayKey = getTodayDateKey();
          localStorage.removeItem(`luckymeter_${todayKey}`);
        } catch (e) {
          console.warn("Storage cleanup failed:", e);
        }
        return;
      }

      const hrs = Math.floor(diff / 1000 / 60 / 60);
      const mins = Math.floor((diff / 1000 / 60) % 60);
      const secs = Math.floor((diff / 1000) % 60);

      setTimeLeft(`${hrs}h ${mins}m ${secs}s`);
    }

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [isMounted]);

  // Generate Daily Luck Reading Action
  const handleGenerateLuck = () => {
    if (hasRolledToday || isAnimating) return;

    setIsAnimating(true);
    const todayKey = getTodayDateKey();

    // Consecutive day duplicate rejection check
    let lastResult = null;
    let lastQuote = null;
    try {
      const prevData = localStorage.getItem("luckymeter_last_result");
      if (prevData) {
        const parsedPrev = JSON.parse(prevData);
        lastResult = parsedPrev.percentage;
        lastQuote = parsedPrev.quote;
      }
    } catch (e) {
      console.warn("Storage read error:", e);
    }

    // Roll percentage (0-100) with capped attempt loop to prevent infinite hangs
    let newPct;
    let pctAttempts = 0;
    do {
      newPct = Math.floor(Math.random() * 101);
      pctAttempts++;
    } while (newPct === lastResult && lastResult !== null && pctAttempts < 10);

    // Pick quote with capped attempt loop
    let newQuote;
    let quoteAttempts = 0;
    do {
      newQuote = LUCK_QUOTES[Math.floor(Math.random() * LUCK_QUOTES.length)];
      quoteAttempts++;
    } while (newQuote === lastQuote && lastQuote !== null && LUCK_QUOTES.length > 1 && quoteAttempts < 10);

    const newTier = calculateTier(newPct);

    // Reduced motion preference support
    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const duration = prefersReducedMotion ? 1000 : 8000;
    const start = Date.now();

    if (animIntervalRef.current) clearInterval(animIntervalRef.current);
    animIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - start;
      const t = Math.min(elapsed / duration, 1);

      setRevealProgress(t);
      setDisplayedPercentage(Math.round(newPct * t));
    }, 50);

    if (animTimeoutRef.current) clearTimeout(animTimeoutRef.current);
    animTimeoutRef.current = setTimeout(() => {
      if (animIntervalRef.current) clearInterval(animIntervalRef.current);

      setPercentage(newPct);
      setDisplayedPercentage(newPct);
      setRevealProgress(1);
      setTier(newTier);
      setQuote(newQuote);
      setHasRolledToday(true);
      setIsAnimating(false);

      const resultObj = { percentage: newPct, tier: newTier, quote: newQuote };
      try {
        localStorage.setItem(`luckymeter_${todayKey}`, JSON.stringify(resultObj));
        localStorage.setItem("luckymeter_last_result", JSON.stringify(resultObj));
      } catch (e) {
        console.warn("Storage write error:", e);
      }
    }, duration);
  };

  // Share Reading Action
  const handleShare = async () => {
    const shareData = {
      title: "My Lucky Meter Result — LuckyPickCanada",
      text: `🍁 I rolled ${percentage}% (${tier}) on LuckyPickCanada today! "${quote}"`,
      url: "https://luckypickcanada.ca"
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (e) {
        // Dismissed by user
      }
    } else if (navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(
          `${shareData.text} Check yours at ${shareData.url}`
        );
        setShareToast(true);
        setTimeout(() => setShareToast(false), 3000);
      } catch (e) {
        console.warn("Clipboard failed:", e);
      }
    }
  };

  if (!isMounted) {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: "#00060a", display: "flex", alignItems: "center", justifyContent: "center", color: "#00eaff", fontFamily: "sans-serif" }}>
        Loading Lucky Meter...
      </div>
    );
  }

  // Layout Styles
  const pageStyle = {
    padding: "40px 16px",
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    color: "white",
    fontFamily: "Inter, system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
    background: "radial-gradient(circle at top, #02131f 0%, #00060a 40%, #000000 100%)"
  };

  const headerStyle = {
    textAlign: "center",
    marginBottom: "20px",
    maxWidth: "640px",
    lineHeight: "1.5"
  };

  const countdownStyle = {
    marginTop: "10px",
    fontSize: "18px",
    opacity: 0.9
  };

  const homeButtonStyle = {
    marginTop: "20px",
    display: "inline-block",
    padding: "10px 20px",
    background: "#00eaff",
    color: "#003b45",
    borderRadius: "8px",
    fontWeight: "600",
    textDecoration: "none",
    boxShadow: "0 0 12px rgba(0,234,255,0.6)"
  };

  const meterContainer = {
    position: "relative",
    width: "100%",
    maxWidth: "420px",
    marginTop: "30px",
    display: "flex",
    justifyContent: "center",
    alignItems: "center"
  };

  const meterImage = {
    width: "100%",
    height: "auto",
    display: "block",
    clipPath: "inset(0 8% 0 0)", // Crop ~8% off right edge to trim AI logo
    pointerEvents: "none",
    userSelect: "none"
  };

  const percentageStyle = {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: `translate(-50%, -50%) scale(${0.7 + 0.3 * revealProgress})`,
    fontSize: "48px",
    fontWeight: "700",
    textShadow: "0 0 16px rgba(0,255,255,0.9)",
    letterSpacing: "0.06em",
    opacity: isAnimating || hasRolledToday ? revealProgress : 0.3,
    transition: "opacity 0.3s linear"
  };

  const tierStyle = {
    position: "absolute",
    bottom: "12%",
    left: "50%",
    transform: "translateX(-50%)",
    fontSize: "20px",
    fontWeight: "700",
    letterSpacing: "1px",
    color: tier === "FLAGSHIP LUCK" ? "#ffd700" : tier === "PREMIUM LUCK" ? "#00eaff" : "#5ce1e6",
    textShadow: "0 0 10px rgba(0,255,255,0.6)",
    opacity: hasRolledToday ? 1 : isAnimating ? 0.6 : 0,
    transition: "opacity 0.6s ease-out",
    textTransform: "uppercase"
  };

  const fortuneCardStyle = {
    marginTop: "30px",
    width: "100%",
    maxWidth: "420px",
    background: "rgba(0, 20, 30, 0.7)",
    padding: "20px",
    borderRadius: "12px",
    boxShadow: "0 0 24px rgba(0,255,255,0.25)",
    backdropFilter: "blur(8px)",
    textAlign: "center"
  };

  const vortexIntensity = isAnimating ? 0.25 + 0.75 * revealProgress : hasRolledToday ? 0.8 : 0.25;

  return (
    <main style={pageStyle}>
      {/* HEADER + RITUAL DESCRIPTION */}
      <div style={headerStyle}>
        <h1 style={{ color: "#ffd700", textShadow: "0 0 10px rgba(255,215,0,0.5)" }}>
          ✨ Daily Lucky Meter Ritual
        </h1>
        <p style={{ color: "#cbd5e1", fontSize: "15px", marginTop: "8px" }}>
          Every night at local midnight, your Lucky Meter resets for a new daily reading.
          Tap below to awaken the vortex and reveal your daily luck percentage.
        </p>

        {/* COUNTDOWN */}
        <div style={countdownStyle}>
          Reset happens in: <strong style={{ color: "#00eaff", fontFamily: "monospace" }}>{timeLeft}</strong>
        </div>

        {/* HOME BUTTON */}
        <Link href="/" style={homeButtonStyle}>
          Return Home
        </Link>
      </div>

      {/* LUCKY METER */}
      <div style={meterContainer}>
        {/* Base artwork with crop & fallback */}
        {!imageError ? (
          <img
            src="/copilot_image_1785515250260.jpeg"
            alt="Lucky Meter"
            onError={() => setImageError(true)}
            style={meterImage}
          />
        ) : (
          <div style={{ width: "100%", height: "320px", backgroundColor: "#001420", display: "flex", alignItems: "center", justifyContent: "center", color: "#ffd700", fontWeight: "700", borderRadius: "12px", border: "1px solid rgba(0,234,255,0.3)" }}>
            ✨ Lucky Meter ✨
          </div>
        )}

        {/* HYBRID VORTEX OVERLAY (SMOKE + AURORA) */}
        <svg
          width="60%"
          height="60%"
          viewBox="0 0 200 200"
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            pointerEvents: "none"
          }}
        >
          <defs>
            <radialGradient id="smokeBase" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor={tier === "FLAGSHIP LUCK" ? "rgba(255,215,0,0.95)" : "rgba(0,255,200,0.95)"} />
              <stop offset="40%" stopColor="rgba(0,180,150,0.7)" />
              <stop offset="80%" stopColor="rgba(0,60,80,0.4)" />
              <stop offset="100%" stopColor="rgba(0,10,20,0)" />
            </radialGradient>

            <linearGradient id="auroraRibbon" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#00ffe0" />
              <stop offset="50%" stopColor="#00b0ff" />
              <stop offset="100%" stopColor="#00ff88" />
            </linearGradient>

            <filter id="smokeNoise">
              <feTurbulence
                type="fractalNoise"
                baseFrequency="0.9"
                numOctaves="3"
                stitchTiles="noStitch"
              />
              <feGaussianBlur stdDeviation="2" />
            </filter>
          </defs>

          {/* SMOKE VORTEX */}
          <g style={{ transformOrigin: "100px 100px", animation: "vortexSpin 30s linear infinite" }}>
            <circle
              cx="100"
              cy="100"
              r="70"
              fill="url(#smokeBase)"
              filter="url(#smokeNoise)"
              style={{
                opacity: vortexIntensity,
                transition: "opacity 0.6s ease-out"
              }}
            />
          </g>

          {/* AURORA RIBBONS */}
          <g style={{ animation: "auroraDrift 18s ease-in-out infinite", opacity: 0.35 + 0.65 * (hasRolledToday ? 1 : revealProgress) }}>
            <path
              d="M10 120 C 40 80, 80 60, 130 80 C 160 95, 185 120, 190 140"
              fill="none"
              stroke="url(#auroraRibbon)"
              strokeWidth="10"
              strokeLinecap="round"
            />
            <path
              d="M20 90 C 60 60, 110 50, 160 70"
              fill="none"
              stroke="url(#auroraRibbon)"
              strokeWidth="6"
              strokeLinecap="round"
              style={{ opacity: 0.7 }}
            />
          </g>

          <style>{`
            @keyframes vortexSpin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
            @keyframes auroraDrift {
              0% { transform: translateY(0px); }
              50% { transform: translateY(-6px); }
              100% { transform: translateY(0px); }
            }
          `}</style>
        </svg>

        {/* PERCENTAGE DISPLAY */}
        <div style={percentageStyle}>
          {hasRolledToday ? `${percentage}%` : `${displayedPercentage}%`}
        </div>

        {/* TIER LABEL */}
        <div style={tierStyle}>
          {isAnimating ? "Consulting Stars..." : tier || "Ready"}
        </div>
      </div>

      {/* TODAY'S FORTUNE CARD */}
      {hasRolledToday && quote && (
        <div style={fortuneCardStyle}>
          <h3 style={{ marginBottom: "8px", color: "#00eaff", fontSize: "16px" }}>Today's Fortune</h3>
          <p style={{ fontSize: "15px", lineHeight: "1.5", color: "#e2e8f0" }}>"{quote}"</p>
        </div>
      )}

      {/* ACTIONS: GENERATE OR SHARE */}
      <div style={{ marginTop: "24px", width: "100%", maxWidth: "420px", display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
        {!hasRolledToday ? (
          <button
            onClick={handleGenerateLuck}
            disabled={isAnimating}
            style={{
              width: "100%",
              padding: "16px",
              borderRadius: "30px",
              border: "none",
              background: isAnimating ? "linear-gradient(90deg, #334155, #1e293b)" : "linear-gradient(90deg, #d4af37, #ffd700)",
              color: "#0b1320",
              fontSize: "18px",
              fontWeight: "700",
              cursor: isAnimating ? "not-allowed" : "pointer",
              boxShadow: "0 0 20px rgba(255,215,0,0.4)"
            }}
          >
            {isAnimating ? "Revealing Your Daily Luck..." : "Generate Luck"}
          </button>
        ) : (
          <button
            onClick={handleShare}
            style={{
              width: "100%",
              padding: "14px",
              borderRadius: "30px",
              border: "1px solid #00eaff",
              background: "rgba(0,234,255,0.1)",
              color: "#00eaff",
              fontSize: "16px",
              fontWeight: "600",
              cursor: "pointer",
              boxShadow: "0 0 12px rgba(0,234,255,0.3)"
            }}
          >
            📤 Share Daily Reading
          </button>
        )}

        {shareToast && (
          <div style={{ fontSize: "13px", color: "#4ade80", backgroundColor: "rgba(74,222,128,0.1)", padding: "6px 12px", borderRadius: "6px" }}>
            Copied to clipboard!
          </div>
        )}
      </div>
    </main>
  );
}
