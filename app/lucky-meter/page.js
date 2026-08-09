"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

// --- 16 Mystical Canadian Luck Quotes ---
const LUCK_QUOTES = [
  "The northern lights align to guide your steps today.",
  "Great fortune flows like the strong currents of the Great Lakes.",
  "A quiet clarity brings golden opportunities your way.",
  "The winds of the North carry fresh luck to your door.",
  "Trust your instincts today—the stars favor bold choices.",
  "An unexpected spark of luck will illuminate your path.",
  "Serendipity surrounds you; keep your eyes wide open.",
  "Like the enduring pine, your luck remains steadfast and strong.",
  "A wave of positive momentum is building around you.",
  "The frost clears to reveal a bright, lucky day ahead.",
  "Small choices today lead to grand rewards tomorrow.",
  "Your energy attracts prosperity from coast to coast.",
  "The celestial compass points directly toward good fortune.",
  "A golden opportunity is quietly making its way to you.",
  "Embrace the day with confidence—luck is in your corner.",
  "Mystic aurora lights signal a breakthrough moment for you."
];

export default function LuckyMeterPage() {
  const [isMounted, setIsMounted] = useState(false);
  const [percentage, setPercentage] = useState(0);
  const [tier, setTier] = useState("");
  const [quote, setQuote] = useState("");
  const [hasRolledToday, setHasRolledToday] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [countdown, setCountdown] = useState("00:00:00");
  const [shareToast, setShareToast] = useState(false);

  // Helper: Get user's local YYYY-MM-DD date key
  const getTodayDateKey = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  // Tier calculation helper (Strict 3-Tier System)
  const calculateTier = (pct) => {
    if (pct >= 80) return "FLAGSHIP LUCK";
    if (pct >= 50) return "PREMIUM LUCK";
    return "STANDARD LUCK";
  };

  // --- Hydration Safety & Persistence Load ---
  useEffect(() => {
    setIsMounted(true);
    const todayKey = getTodayDateKey();

    try {
      const savedData = localStorage.getItem(`luckymeter_${todayKey}`);
      if (savedData) {
        const parsed = JSON.parse(savedData);
        setPercentage(parsed.percentage);
        setTier(parsed.tier);
        setQuote(parsed.quote);
        setHasRolledToday(true);
      }
    } catch (e) {
      console.warn("Storage access failed:", e);
    }
  }, []);

  // --- Live Countdown Timer targeting Local Midnight ---
  useEffect(() => {
    if (!isMounted) return;

    const updateCountdown = () => {
      const now = new Date();
      const nextMidnight = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() + 1,
        0,
        0,
        0
      );
      const diff = nextMidnight.getTime() - now.getTime();

      if (diff <= 0) {
        // Midnight reached: automatically unlock new daily roll
        setHasRolledToday(false);
        setPercentage(0);
        setTier("");
        setQuote("");
        return;
      }

      const hours = String(Math.floor((diff / (1000 * 60 * 60)) % 24)).padStart(2, "0");
      const minutes = String(Math.floor((diff / (1000 * 60)) % 60)).padStart(2, "0");
      const seconds = String(Math.floor((diff / 1000) % 60)).padStart(2, "0");
      setCountdown(`${hours}:${minutes}:${seconds}`);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [isMounted]);

  // --- Generate Daily Reading ---
  const handleGenerateLuck = () => {
    if (hasRolledToday || isAnimating) return;

    setIsAnimating(true);
    const todayKey = getTodayDateKey();

    // Check yesterday's score to prevent back-to-back duplicates
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

    // Roll random percentage (0-100) rejecting consecutive match
    let newPct;
    do {
      newPct = Math.floor(Math.random() * 101);
    } while (newPct === lastResult);

    // Select random quote rejecting consecutive match
    let newQuote;
    do {
      newQuote = LUCK_QUOTES[Math.floor(Math.random() * LUCK_QUOTES.length)];
    } while (newQuote === lastQuote && LUCK_QUOTES.length > 1);

    const newTier = calculateTier(newPct);

    // Reduced motion preference support
    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const animationDuration = prefersReducedMotion ? 1000 : 8000;

    // Smooth counting effect during reveal
    let currentPct = 0;
    const stepTime = Math.max(10, Math.floor(animationDuration / Math.max(1, newPct)));
    const counterInterval = setInterval(() => {
      currentPct += 1;
      if (currentPct >= newPct) {
        clearInterval(counterInterval);
        setPercentage(newPct);
      } else {
        setPercentage(currentPct);
      }
    }, stepTime);

    setTimeout(() => {
      clearInterval(counterInterval);
      setPercentage(newPct);
      setTier(newTier);
      setQuote(newQuote);
      setHasRolledToday(true);
      setIsAnimating(false);

      // Save today's result locally
      const resultObj = { percentage: newPct, tier: newTier, quote: newQuote };
      try {
        localStorage.setItem(`luckymeter_${todayKey}`, JSON.stringify(resultObj));
        localStorage.setItem("luckymeter_last_result", JSON.stringify(resultObj));
      } catch (e) {
        console.warn("Storage write error:", e);
      }
    }, animationDuration);
  };

  // --- Share Button Action ---
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
        // Share modal dismissed by user
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

  // Loading state guard prevents React Hydration Errors
  if (!isMounted) {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: "#0b1320", display: "flex", alignItems: "center", justifyContent: "center", color: "#d4af37", fontFamily: "sans-serif" }}>
        Loading Lucky Meter...
      </div>
    );
  }

  // Dynamic Tier Colors
  const tierColor =
    tier === "FLAGSHIP LUCK" ? "#ffd700" :
    tier === "PREMIUM LUCK" ? "#00f0ff" : "#5ce1e6";

  const glowStrength = isAnimating ? 0.9 : hasRolledToday ? Math.max(0.3, percentage / 100) : 0.25;

  return (
    <main style={{ minHeight: "100vh", backgroundColor: "#0b1320", color: "#ffffff", padding: "20px 16px", fontFamily: "'Inter', system-ui, sans-serif", display: "flex", flexDirection: "column", alignItems: "center" }}>
      
      {/* Navigation Bar */}
      <div style={{ width: "100%", maxWidth: "420px", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
        <Link href="/" style={{ color: "#d4af37", textDecoration: "none", fontSize: "14px", fontWeight: "600", padding: "8px 16px", borderRadius: "20px", border: "1px solid rgba(212,175,55,0.4)", backgroundColor: "rgba(212,175,55,0.08)" }}>
          ← Back to Home
        </Link>
        <div style={{ fontSize: "12px", color: "#a0aec0" }}>🍁 LuckyPickCanada</div>
      </div>

      {/* Ritual Header */}
      <h1 style={{ fontSize: "22px", fontWeight: "700", color: "#ffd700", textShadow: "0 0 10px rgba(255,215,0,0.5)", margin: "8px 0 20px", textAlign: "center" }}>
        ✨ Your Daily Luck Ritual
      </h1>

      {/* Main Meter Machine Area */}
      <div style={{ position: "relative", width: "100%", maxWidth: "420px", borderRadius: "16px", overflow: "hidden", boxShadow: "0 0 30px rgba(0,240,255,0.15)" }}>
        
        {/* Background Meter Image */}
        <img
          src="/copilot_image_1785515250260.jpeg"
          alt="Lucky Meter Artwork"
          style={{ width: "100%", height: "auto", display: "block", pointerEvents: "none", userSelect: "none" }}
        />

        {/* Inline SVG Aurora Overlay */}
        <svg
          width="100%"
          height="100%"
          style={{ position: "absolute", top: 0, left: 0, pointerEvents: "none" }}
        >
          <defs>
            <radialGradient id="auroraGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor={tier === "FLAGSHIP LUCK" ? "rgba(255,215,0,0.9)" : "rgba(0,240,255,0.9)"} />
              <stop offset="60%" stopColor="rgba(0,240,255,0.25)" />
              <stop offset="100%" stopColor="rgba(0,240,255,0)" />
            </radialGradient>
          </defs>

          <circle
            cx="50%"
            cy="50%"
            r="38%"
            fill="url(#auroraGlow)"
            style={{ opacity: glowStrength, transition: "opacity 0.8s ease-out" }}
          />

          <rect
            x="0"
            y="0"
            width="100%"
            height="100%"
            fill="rgba(0,255,255,0.08)"
            style={{ mixBlendMode: "overlay", animation: isAnimating ? "shimmer 1s infinite linear" : "shimmer 3.5s infinite linear" }}
          />

          <style>{`
            @keyframes shimmer {
              0% { opacity: 0.05; }
              50% { opacity: 0.25; }
              100% { opacity: 0.05; }
            }
          `}</style>
        </svg>

        {/* Percentage Display */}
        <div style={{ position: "absolute", top: "46%", left: "50%", transform: "translate(-50%, -50%)", fontSize: "44px", fontWeight: "800", color: "#ffffff", textShadow: "0 0 14px rgba(0,240,255,0.8)" }}>
          {isAnimating || hasRolledToday ? `${percentage}%` : "0%"}
        </div>

        {/* Tier Label */}
        <div style={{ position: "absolute", bottom: "12%", left: "50%", transform: "translateX(-50%)", fontSize: "20px", fontWeight: "700", color: tierColor, textShadow: "0 0 10px rgba(0,240,255,0.6)", letterSpacing: "1px", textTransform: "uppercase" }}>
          {isAnimating ? "Consulting Stars..." : tier || "Ready"}
        </div>
      </div>

      {/* Quote Display */}
      {hasRolledToday && quote && (
        <div style={{ marginTop: "20px", width: "100%", maxWidth: "420px", textAlign: "center", padding: "16px", backgroundColor: "rgba(15,23,42,0.8)", borderRadius: "12px", border: "1px solid rgba(0,240,255,0.2)", color: "#e2e8f0", fontSize: "15px", lineHeight: "1.5" }}>
          "{quote}"
        </div>
      )}

      {/* Interactive Actions */}
      <div style={{ marginTop: "20px", width: "100%", maxWidth: "420px", display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
        {!hasRolledToday ? (
          <button
            onClick={handleGenerateLuck}
            disabled={isAnimating}
            style={{ width: "100%", padding: "16px", borderRadius: "30px", border: "none", background: isAnimating ? "linear-gradient(90deg, #4a5568, #2d3748)" : "linear-gradient(90deg, #d4af37, #ffd700)", color: "#0b1320", fontSize: "18px", fontWeight: "700", cursor: isAnimating ? "not-allowed" : "pointer", boxShadow: "0 0 20px rgba(255,215,0,0.4)" }}
          >
            {isAnimating ? "Revealing Your Daily Luck..." : "Generate Luck"}
          </button>
        ) : (
          <button
            onClick={handleShare}
            style={{ width: "100%", padding: "14px", borderRadius: "30px", border: "1px solid #00f0ff", background: "rgba(0,240,255,0.1)", color: "#00f0ff", fontSize: "16px", fontWeight: "600", cursor: "pointer", boxShadow: "0 0 12px rgba(0,240,255,0.2)" }}
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

      {/* Countdown Timer */}
      <div style={{ marginTop: "24px", textAlign: "center", color: "#a0aec0", fontSize: "14px" }}>
        <div style={{ marginBottom: "4px" }}>Next Lucky Reading In</div>
        <div style={{ fontSize: "22px", fontWeight: "700", color: "#d4af37", fontFamily: "monospace", letterSpacing: "2px" }}>
          {countdown}
        </div>
      </div>
    </main>
  );
}
