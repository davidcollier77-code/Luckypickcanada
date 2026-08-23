'use client';

import React, { useEffect, useRef, useState, useCallback } from "react";
import styles from "./LuckyMeter.module.css";

type TierKey = "dormant" | "kindling" | "rising" | "northern" | "peak";

interface TierConfig {
  key: TierKey;
  name: string;
  min: number;
  max: number;
  color: string;
}

const TIERS: TierConfig[] = [
  { key: "dormant", name: "DORMANT VOID", min: 1, max: 15, color: "#64748b" },
  { key: "kindling", name: "KINDLING SPARK", min: 16, max: 40, color: "#f97316" },
  { key: "rising", name: "RISING CURRENT", min: 41, max: 70, color: "#38bdf8" },
  { key: "northern", name: "NORTHERN RESONANCE", min: 71, max: 90, color: "#4ade80" },
  { key: "peak", name: "PEAK RADIANCE", min: 91, max: 100, color: "#facc15" },
];

const QUOTES: string[] = [
  "Your resonance echoes across the northern lights tonight.",
  "Today, the maple winds carry fortune in your favour.",
  "The St. Lawrence whispers: stay bold, stay curious.",
  "From coast to coast, your luck rides the aurora’s wave.",
  "The Rockies stand tall behind your choices today.",
  "A quiet cabin, a warm fire, and fortune at your door.",
  "Your path glows like fresh snow under moonlight.",
];

const STORAGE_KEY = "dailyLuckyMeter";
type MeterState = "idle" | "resonating" | "locked";

interface StoredResult {
  date: string;
  score: number;
  quote: string;
}

const getTodayKey = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getTierForScore = (score: number): TierConfig => {
  return TIERS.find((t) => score >= t.min && score <= t.max) || TIERS[0];
};

const getNextMidnight = () => {
  const now = new Date();
  const next = new Date(now);
  next.setHours(24, 0, 0, 0);
  return next;
};

const formatCountdown = (msRemaining: number) => {
  if (msRemaining <= 0) return "00h 00m 00s";
  const totalSeconds = Math.floor(msRemaining / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${String(hours).padStart(2, "0")}h ${String(minutes).padStart(2, "0")}m ${String(seconds).padStart(2, "0")}s`;
};

const loadStoredResult = (): StoredResult | null => {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredResult;
    if (!parsed || typeof parsed.score !== "number") return null;
    return parsed;
  } catch {
    return null;
  }
};

const saveStoredResult = (result: StoredResult) => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(result));
  } catch {}
};

const clearStoredResult = () => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {}
};

const MidnightCountdown: React.FC<{ onMidnight: () => void }> = ({ onMidnight }) => {
  const [countdown, setCountdown] = useState<string>("00h 00m 00s");

  useEffect(() => {
    const update = () => {
      const nextMidnight = getNextMidnight();
      const now = new Date();
      const diff = nextMidnight.getTime() - now.getTime();
      setCountdown(formatCountdown(diff));
      if (diff <= 0) onMidnight();
    };

    update();
    const interval = window.setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [onMidnight]);

  return <>{countdown}</>;
};

const DailyLuckyMeter: React.FC = () => {
  const [meterState, setMeterState] = useState<MeterState>("idle");
  const [score, setScore] = useState<number>(0);
  const [tier, setTier] = useState<TierConfig | null>(null);
  const [quote, setQuote] = useState<string | null>(null);
  const [ringColor, setRingColor] = useState<string>("#3a4048");

  const timerRef = useRef<number | null>(null);
  const todayKey = getTodayKey();

  const handleMidnight = useCallback(() => {
    clearStoredResult();
    setMeterState("idle");
    setScore(0);
    setTier(null);
    setQuote(null);
    setRingColor("#3a4048");
  }, []);

  useEffect(() => {
    const stored = loadStoredResult();
    if (stored && stored.date === todayKey) {
      setMeterState("locked");
      setScore(stored.score);
      const t = getTierForScore(stored.score);
      setTier(t);
      setQuote(stored.quote);
      setRingColor(t.color);
    } else {
      setMeterState("idle");
    }

    return () => {
      if (timerRef.current !== null) {
        clearInterval(timerRef.current);
      }
    };
  }, [todayKey]);

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, []);

  const startResonance = () => {
    if (meterState !== "idle") return;

    const finalScore = Math.floor(Math.random() * (100 - 5 + 1)) + 5;
    const finalQuote = QUOTES[Math.floor(Math.random() * QUOTES.length)];
    const finalTier = getTierForScore(finalScore);

    setMeterState("resonating");

    const startTime = Date.now();
    const duration = 10000;

    if (timerRef.current !== null) {
      clearInterval(timerRef.current);
    }

    timerRef.current = window.setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(Math.max(elapsed / duration, 0), 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const currentVal = Math.min(Math.round(finalScore * eased), finalScore);

      setScore(currentVal);

      const colorIdx = Math.floor(elapsed / 120) % TIERS.length;
      if (TIERS[colorIdx]) {
        setRingColor(TIERS[colorIdx].color);
      }

      if (progress >= 1) {
        if (timerRef.current !== null) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
        setScore(finalScore);
        setTier(finalTier);
        setQuote(finalQuote);
        setRingColor(finalTier.color);
        setMeterState("locked");
        saveStoredResult({
          date: todayKey,
          score: finalScore,
          quote: finalQuote,
        });
      }
    }, 40);
  };

  const handleShare = async () => {
    if (!tier || score === 0) return;
    const text = `My Daily Lucky Meter resonance: ${score}% — ${tier.name} on luckypickcanada.ca`;
    try {
      await navigator.clipboard.writeText(text);
    } catch {}
  };

  const circumference = 490;
  const strokeDashoffset = meterState === "idle"
    ? circumference
    : circumference - (circumference * score) / 100;

  return (
    <div className={styles.meterContainer}>
      <div className={styles.meterNav}>
        <a href="/" className={styles.backHomeButton}>
          ← Back to Home
        </a>
      </div>

      <div className={styles.introCard}>
        <div className={styles.introBadge}>DAILY CANADIAN RITUAL</div>
        <h1 className={styles.introHeading}>Canada Resonance Index</h1>
        <p className={styles.introText}>
          Calibrate your daily fortune across the northern expanse. Engage the resonance instrument once every 24 hours to measure your energetic alignment from coast to coast, reveal your tier rating, and unlock your daily attunement wisdom.
        </p>
      </div>

      <div className={styles.meterShell}>
        <div className={styles.meterHeader}>
          <span className={styles.meterTitle}>Daily Lucky Meter</span>
          <span className={styles.meterSubtitle}>Canada Resonance Index</span>
        </div>

        <div className={styles.meterDialWrapper}>
          <div className={styles.meterBezel}>
            <div className={styles.meterBezelInner}>
              {Array.from({ length: 12 }).map((_, idx) => (
                <div
                  key={idx}
                  className={styles.meterRivet}
                  style={{
                    transform: `rotate(${idx * 30}deg) translateY(-106px)`,
                  }}
                />
              ))}

              <svg className={styles.meterRingSvg} viewBox="0 0 200 200" aria-hidden="true">
                <defs>
                  <filter id="ledGlow">
                    <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                    <feMerge>
                      <feMergeNode in="coloredBlur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>
                <circle
                  className={styles.meterRingCircle}
                  cx="100"
                  cy="100"
                  r="78"
                  filter="url(#ledGlow)"
                  style={{
                    strokeDasharray: circumference,
                    strokeDashoffset: strokeDashoffset,
                    stroke: ringColor,
                  }}
                />
              </svg>

              <div className={styles.meterCenterHub}>
                <div className={styles.meterVortex} data-state={meterState}>
                  <div className={styles.meterVortexLayer} />
                </div>

                {meterState === "resonating" && (
                  <div className={styles.sparkEmitter}>
                    {Array.from({ length: 8 }).map((_, idx) => (
                      <div
                        key={idx}
                        className={styles.spark}
                        style={{ "--i": idx } as React.CSSProperties}
                      />
                    ))}
                  </div>
                )}

                <div className={styles.meterCenterContent}>
                  {meterState === "idle" && (
                    <>
                      <div className={styles.meterIconBolt}>⚡</div>
                      <div className={styles.meterCenterLabel}>READY</div>
                      <div className={styles.meterCenterPercentageIdle}>0%</div>
                    </>
                  )}

                  {meterState === "resonating" && (
                    <>
                      <div className={styles.meterCenterLabelResonating}>RESONATING...</div>
                      <div className={styles.meterCenterPercentage}>{score}%</div>
                    </>
                  )}

                  {meterState === "locked" && (
                    <>
                      <div className={styles.meterCenterPercentage}>{score}%</div>
                      <div className={styles.meterCenterTier}>{tier?.name ?? "NORTHERN RESONANCE"}</div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.meterFooter}>
          {meterState === "idle" && (
            <button
              type="button"
              className={styles.meterEngageButton}
              onClick={startResonance}
            >
              ENGAGE METER
            </button>
          )}

          {meterState === "resonating" && (
            <div className={styles.meterResonatingText}>RESONATING...</div>
          )}

          {meterState === "locked" && (
            <>
              <div className={styles.meterAttunementCard}>
                <div className={styles.meterAttunementHeader}>Attunement Card</div>
                <div className={styles.meterAttunementBody}>{quote}</div>
              </div>
              <div className={styles.meterActionsRow}>
                <button
                  type="button"
                  className={styles.meterShareButton}
                  onClick={handleShare}
                >
                  SHARE RESONANCE
                </button>
              </div>
              <div className={styles.meterCountdownRow}>
                <span className={styles.meterCountdownLabel}>Next Resonance in:</span>
                <span className={styles.meterCountdownValue}>
                  <MidnightCountdown onMidnight={handleMidnight} />
                </span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default DailyLuckyMeter;
