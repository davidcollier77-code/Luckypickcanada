'use client';

import React, { useEffect, useRef, useState, useId } from "react";
import html2canvas from "html2canvas";
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

const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

const getTodayKey = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getTierForScore = (score: number): TierConfig => {
  return (
    TIERS.find((tier) => score >= tier.min && score <= tier.max) || TIERS[0]
  );
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
  } catch {
    // ignore
  }
};

const clearStoredResult = () => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
};

const getRandomScore = () => {
  return Math.floor(Math.random() * (100 - 5 + 1)) + 5;
};

const getRandomQuote = () => {
  const index = Math.floor(Math.random() * QUOTES.length);
  return QUOTES[index];
};

interface DailyLuckyMeterProps {
  onStateChange?: (state: MeterState) => void;
}

const DailyLuckyMeter: React.FC<DailyLuckyMeterProps> = ({ onStateChange }) => {
  const ledGlowId = useId();

  const [meterState, setMeterState] = useState<MeterState>("idle");
  const [score, setScore] = useState<number | null>(null);
  const [tier, setTier] = useState<TierConfig | null>(null);
  const [quote, setQuote] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<string>("00h 00m 00s");
  const [showToast, setShowToast] = useState(false);

  const svgCircleRef = useRef<SVGCircleElement | null>(null);
  const percentageRef = useRef<HTMLDivElement | null>(null);
  const vortexRef = useRef<HTMLDivElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const countdownIntervalRef = useRef<number | null>(null);
  const meterShellRef = useRef<HTMLDivElement | null>(null);

  const todayKey = getTodayKey();

  const updateCountdown = () => {
    const nextMidnight = getNextMidnight();
    const now = new Date();
    const diff = nextMidnight.getTime() - now.getTime();
    setCountdown(formatCountdown(diff));
    if (diff <= 0) {
      clearStoredResult();
      setMeterState("idle");
      setScore(null);
      setTier(null);
      setQuote(null);
    }
  };

  useEffect(() => {
    const stored = loadStoredResult();
    if (stored && stored.date === todayKey) {
      setMeterState("locked");
      setScore(stored.score);
      const t = getTierForScore(stored.score);
      setTier(t);
      setQuote(stored.quote);
    } else {
      setMeterState("idle");
    }

    updateCountdown();
    countdownIntervalRef.current = window.setInterval(updateCountdown, 1000);

    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (countdownIntervalRef.current !== null) {
        clearInterval(countdownIntervalRef.current);
      }
    };
  }, [todayKey]);


  useEffect(() => {
    if (onStateChange) {
      onStateChange(meterState);
    }
  }, [meterState, onStateChange]);

  useEffect(() => {
    if (!vortexRef.current) return;
    vortexRef.current.dataset.state = meterState;
  }, [meterState]);

  useEffect(() => {
    if (!svgCircleRef.current || !tier) return;
    svgCircleRef.current.style.stroke = tier.color;
  }, [tier]);

  const startResonance = () => {
    if (meterState !== "idle") return;

    const previous = loadStoredResult();
    let newScore = getRandomScore();
    let newQuote = getRandomQuote();

    if (previous) {
      let attempts = 0;
      while ((newScore === previous.score || newQuote === previous.quote) && attempts < 100) {
        newScore = getRandomScore();
        newQuote = getRandomQuote();
        attempts++;
      }
    }

    const targetTier = getTierForScore(newScore);
    setTier(targetTier);
    setMeterState("resonating");

    const startTime = performance.now();
    const duration = 10000; // 10 seconds

    const circle = svgCircleRef.current;
    const percentageEl = percentageRef.current;

    let circumference = 0;
    if (circle) {
      const radius = circle.r.baseVal.value;
      circumference = 2 * Math.PI * radius;
      circle.style.strokeDasharray = `${circumference}`;
    }

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const t = Math.min(elapsed / duration, 1);
      const eased = easeOutCubic(t);
      const currentScore = Math.round(newScore * eased);

      if (percentageEl) {
        percentageEl.textContent = `${currentScore}%`;
      }

      if (circle && circumference > 0) {
        const offset = circumference - (circumference * currentScore) / 100;
        circle.style.strokeDashoffset = `${offset}`;
      }

      if (t < 1) {
        animationFrameRef.current = requestAnimationFrame(animate);
      } else {
        setScore(newScore);
        setQuote(newQuote);
        setMeterState("locked");
        if (percentageEl) {
          percentageEl.textContent = `${newScore}%`;
        }
        if (circle && circumference > 0) {
          const offset = circumference - (circumference * newScore) / 100;
          circle.style.strokeDashoffset = `${offset}`;
        }
        saveStoredResult({
          date: todayKey,
          score: newScore,
          quote: newQuote,
        });
      }
    };

    animationFrameRef.current = requestAnimationFrame(animate);
  };

  const fallbackCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } catch {
      // ignore
    }
  };

  const restoreElements = (elements: NodeListOf<Element> | HTMLElement[] | Element[]) => {
    elements.forEach((el) => {
      (el as HTMLElement).style.display = '';
    });
  };

    const handleShare = async () => {
    if (!score || !tier) return;
    const text = `My Daily Lucky Meter resonance: ${score}% — ${tier.name} on luckypickcanada.ca`;

    const buttons = meterShellRef.current ? Array.from(meterShellRef.current.querySelectorAll('button')) : [];
    const countdowns = meterShellRef.current ? Array.from(meterShellRef.current.querySelectorAll('.' + styles.meterCountdownRow)) : [];
    let styleTag = null;

    try {
      if (meterShellRef.current) {
        // Temporarily hide share button and countdown during capture
        buttons.forEach(b => (b as HTMLElement).style.display = 'none');
        countdowns.forEach(c => (c as HTMLElement).style.display = 'none');

        // Freeze animations to ensure a sharp still snapshot
        styleTag = document.createElement('style');
        styleTag.innerHTML = '[data-meter-shell] * { animation: none !important; transition: none !important; }';
        document.head.appendChild(styleTag);

        const canvas = await html2canvas(meterShellRef.current, {
          backgroundColor: '#020617', // Match the card background roughly or transparent
          scale: 2,
          useCORS: true,
        });

        const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/png'));

        if (blob) {
          const file = new File([blob], 'lucky-resonance.png', { type: 'image/png' });
          if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
            try {
              await navigator.share({
                title: 'Daily Lucky Meter',
                text: text,
                files: [file]
              });
            } catch (shareErr: any) {
              if (shareErr.name !== 'AbortError') {
                await fallbackCopy(text);
              }
            }
          } else {
            await fallbackCopy(text);
          }
        } else {
          await fallbackCopy(text);
        }
      } else {
        await fallbackCopy(text);
      }
    } catch (e) {
      await fallbackCopy(text);
    } finally {
      if (meterShellRef.current) {
        restoreElements(buttons);
        restoreElements(countdowns);
      }
      if (styleTag && styleTag.parentNode) {
        styleTag.parentNode.removeChild(styleTag);
      }
    }
  };

  const currentTierName = tier?.name ?? "NORTHERN RESONANCE";

  return (
    <div className={styles.meterContainer}>
      <div className={styles.meterShell} ref={meterShellRef} data-meter-shell>
        <div className={styles.meterHeader}>
          <span className={styles.meterTitle}>Daily Lucky Meter</span>

          <span className={styles.meterSubtitle}>Canada Resonance Index</span>
          <div className={styles.meterRitualInfo}>
            <p>Every day, the universe hums with a unique frequency.</p>
            <p>Engage the meter to discover your daily resonance—a moment of digital divination just for fun. Will you reach Peak Radiance?</p>
          </div>

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

              <svg
                className={styles.meterRingSvg}
                viewBox="0 0 200 200"
                aria-hidden="true"
              >
                <defs>
                  <filter id={ledGlowId}>
                    <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                    <feMerge>
                      <feMergeNode in="coloredBlur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>
                <circle
                  ref={svgCircleRef}
                  className={styles.meterRingCircle}
                  cx="100"
                  cy="100"
                  r="78"
                  style={{ strokeDasharray: 490, strokeDashoffset: 490 }}
                  filter={`url(#${ledGlowId})`}
                />
              </svg>

              <div className={styles.meterCenterHub}>
                <div
                  ref={vortexRef}
                  className={styles.meterVortex}
                  data-state={meterState}
                >
                  <div className={styles.meterVortexLayer} />
                </div>

                <div className={styles.meterCenterContent}>
                  {meterState === "idle" && (
                    <>
                      <div className={styles.meterIconBolt}>⚡</div>
                      <div className={styles.meterCenterLabel}>READY</div>
                    </>
                  )}

                  {meterState === "resonating" && (
                    <>
                      <div className={styles.meterCenterLabelResonating}>
                        RESONATING...
                      </div>
                    </>
                  )}

                  {meterState === "locked" && (
                    <>
                      <div
                        ref={percentageRef}
                        className={styles.meterCenterPercentage}
                      >
                        {score !== null ? `${score}%` : ""}
                      </div>
                      <div className={styles.meterCenterTier}>
                        {currentTierName}
                      </div>
                    </>
                  )}

                  {meterState !== "locked" && meterState !== "resonating" && (
                    <div
                      ref={percentageRef}
                      className={styles.meterCenterPercentageIdle}
                    >
                      0%
                    </div>
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
                <div className={styles.meterAttunementHeader}>
                  Attunement Card
                </div>
                <div className={styles.meterAttunementBody}>
                  {quote}
                </div>
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
            </>
          )}

          <div className={styles.meterCountdownRow}>
            <span className={styles.meterCountdownLabel}>
              Next Resonance in:
            </span>
            <span className={styles.meterCountdownValue}>{countdown}</span>
          </div>
        </div>
      </div>

      {showToast && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: 'rgba(15, 23, 42, 0.95)',
          color: '#fbbf24',
          padding: '12px 24px',
          borderRadius: '8px',
          border: '1px solid rgba(251, 191, 36, 0.3)',
          boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
          zIndex: 9999,
          fontWeight: 600,
          fontSize: '0.9rem',
          letterSpacing: '0.05em',
          backdropFilter: 'blur(8px)',
          animation: 'pulseNeon 1.5s infinite'
        }}>
          Copied resonance to clipboard!
        </div>
      )}
    </div>
  );
};

export default DailyLuckyMeter;
