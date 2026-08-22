'use client';

import React, { useState, useEffect, useRef, useCallback, useId } from 'react';
import styles from '../lucky-meter/LuckyMeter.module.css';

interface TierConfig {
  name: string;
  label: string;
  minScore: number;
  maxScore: number;
  primaryColor: string;
  secondaryColor: string;
  glowColor: string;
  description: string;
}

const TIERS: TierConfig[] = [
  {
    name: 'void',
    label: 'Dormant Void',
    minScore: 1,
    maxScore: 15,
    primaryColor: '#64748b',
    secondaryColor: '#94a3b8',
    glowColor: 'rgba(100, 116, 139, 0.4)',
    description: 'The canvas is clear. Stillness precedes the spark of extraordinary momentum.',
  },
  {
    name: 'spark',
    label: 'Kindling Spark',
    minScore: 16,
    maxScore: 40,
    primaryColor: '#f97316',
    secondaryColor: '#fdba74',
    glowColor: 'rgba(249, 115, 22, 0.45)',
    description: 'Small embers catch the autumn wind. Take the first intentional step today.',
  },
  {
    name: 'ember',
    label: 'Rising Current',
    minScore: 41,
    maxScore: 70,
    primaryColor: '#38bdf8',
    secondaryColor: '#93c5fd',
    glowColor: 'rgba(56, 189, 248, 0.45)',
    description: 'Momentum is building across the horizon. Trust the timing of your journey.',
  },
  {
    name: 'aurora',
    label: 'Northern Resonance',
    minScore: 71,
    maxScore: 90,
    primaryColor: '#4ade80',
    secondaryColor: '#86efac',
    glowColor: 'rgba(74, 222, 128, 0.5)',
    description: 'The northern sky shifts with quiet possibilities. Clarity and fortune are within reach.',
  },
  {
    name: 'solstice',
    label: 'Peak Radiance',
    minScore: 91,
    maxScore: 100,
    primaryColor: '#facc15',
    secondaryColor: '#fef08a',
    glowColor: 'rgba(250, 204, 21, 0.55)',
    description: 'A day of maximum alignment. Bold actions carry extraordinary resonance.',
  },
];

const CANADIAN_QUOTES = [
  'A steady compass and a grounded spirit will navigate any wilderness toward success.',
  'Like the Canadian Shield, your foundation is immovable—good fortune follows your next move.',
  'Momentum is building across the horizon. Trust the timing of your journey.',
  'The northern sky shifts with quiet possibilities. Clarity and fortune are within reach.',
  'From Pacific tides to Atlantic shores, every small step ripples into extraordinary fortune.',
  'Even the deepest winter yields to steady light. Keep your fire burning bright.',
  'Stand tall like the boreal pine; winds of change carry seeds of luck.',
];

function getLocalDateString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getMsUntilMidnight(): number {
  const now = new Date();
  const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0, 0);
  return Math.max(0, midnight.getTime() - now.getTime());
}

function formatCountdown(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const hours = String(Math.floor(totalSec / 3600)).padStart(2, '0');
  const minutes = String(Math.floor((totalSec % 3600) / 60)).padStart(2, '0');
  const seconds = String(totalSec % 60).padStart(2, '0');
  return `${hours}h ${minutes}m ${seconds}s`;
}

const CountdownTimer = React.memo(() => {
  const [timeLeft, setTimeLeft] = useState(getMsUntilMidnight());
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    const timer = setInterval(() => {
      if (isMountedRef.current) {
        setTimeLeft(getMsUntilMidnight());
      }
    }, 1000);
    return () => {
      isMountedRef.current = false;
      clearInterval(timer);
    };
  }, []);

  return (
    <div className={styles.lmCountdownText}>
      Next Resonance in: <strong>{formatCountdown(timeLeft)}</strong>
    </div>
  );
});

CountdownTimer.displayName = 'CountdownTimer';

const StaticStuds = React.memo(() => {
  const uniqueId = useId();
  return (
    <div className={styles.lmStudsContainer}>
      {Array.from({ length: 12 }).map((_, i) => (
        <div
          key={`stud-${uniqueId}-${i}`}
          className={styles.lmStud}
          style={{ transform: `rotate(${i * 30}deg) translateY(-118px)` }}
        />
      ))}
    </div>
  );
});

StaticStuds.displayName = 'StaticStuds';

export default function DailyLuckyMeter() {
  const [isLocked, setIsLocked] = useState(false);
  const [isSpinning, setIsSpinning] = useState(false);
  const [currentTier, setCurrentTier] = useState<TierConfig>(TIERS[0]);
  const [fortune, setFortune] = useState<string>(CANADIAN_QUOTES[0]);
  const [copied, setCopied] = useState(false);

  // Ref for the final score, bypassing state updates during animation
  const finalScoreRef = useRef<number | null>(null);
  const scoreDisplayRef = useRef<HTMLDivElement | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }
    };
  }, []);

  const checkLockState = useCallback(() => {
    if (typeof window === 'undefined') return false;
    try {
      const storedDate = localStorage.getItem('lucky_meter_sync_date');
      const storedScore = localStorage.getItem('lucky_meter_sync_score');
      const storedQuote = localStorage.getItem('lucky_meter_sync_quote');
      const today = getLocalDateString();

      if (storedDate === today && storedScore !== null) {
        const parsedScore = parseInt(storedScore, 10) || 10;
        finalScoreRef.current = parsedScore;
        const tier = TIERS.find((t) => parsedScore >= t.minScore && parsedScore <= t.maxScore) || TIERS[0];
        setCurrentTier(tier);
        if (storedQuote) setFortune(storedQuote);
        setIsLocked(true);
        if (scoreDisplayRef.current) {
           scoreDisplayRef.current.innerText = `${parsedScore}%`;
        }
        return true;
      }
    } catch {
      // Storage unavailable
    }
    return false;
  }, []);

  useEffect(() => {
    checkLockState();
  }, [checkLockState]);

  const handleActivate = () => {
    if (isLocked || isSpinning) return;
    setIsSpinning(true);

    let newScore = Math.floor(Math.random() * 95) + 5;
    let lastQuote = '';

    if (typeof window !== 'undefined') {
      try {
        const storedScore = localStorage.getItem('lucky_meter_sync_score');
        lastQuote = localStorage.getItem('lucky_meter_sync_quote') || '';
        if (storedScore) {
          const lastScore = parseInt(storedScore, 10);
          let attempts = 0;
          while (newScore === lastScore && attempts < 10) {
            newScore = Math.floor(Math.random() * 95) + 5;
            attempts++;
          }
          if (newScore === lastScore) {
            newScore = ((lastScore + 37) % 95) + 5;
          }
        }
      } catch {
        // Storage unavailable
      }
    }

    let availableQuotes = CANADIAN_QUOTES.filter((q) => q !== lastQuote);
    if (availableQuotes.length === 0) availableQuotes = CANADIAN_QUOTES;
    const selectedQuote = availableQuotes[Math.floor(Math.random() * availableQuotes.length)];
    setFortune(selectedQuote);

    const calculatedTier = TIERS.find((t) => newScore >= t.minScore && newScore <= t.maxScore) || TIERS[0];
    setCurrentTier(calculatedTier);

    const startTime = performance.now();
    const duration = 2200;

    // Canvas animation setup
    const canvas = canvasRef.current;
    let particles: {x: number, y: number, vx: number, vy: number, alpha: number, size: number}[] = [];
    if (canvas) {
      canvas.width = canvas.clientWidth;
      canvas.height = canvas.clientHeight;
      const particleCount = 12;
      particles = Array.from({ length: particleCount }, () => ({
        x: canvas.width / 2,
        y: canvas.height / 2,
        vx: (Math.random() - 0.5) * 4,
        vy: (Math.random() - 0.5) * 4,
        alpha: 1,
        size: Math.random() * 2 + 1.5,
      }));
    }

    let isAnimationActive = true;

    const animate = (now: number) => {
      if (!isMountedRef.current || !isAnimationActive) return;

      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeOut = 1 - Math.pow(1 - progress, 3);

      const currentVal = Math.round(newScore * easeOut);
      if (scoreDisplayRef.current) {
         scoreDisplayRef.current.innerText = `${currentVal}%`;
      }

      // Draw canvas particles
      if (canvas && particles.length > 0) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
           ctx.clearRect(0, 0, canvas.width, canvas.height);
           particles.forEach((p) => {
             p.x += p.vx;
             p.y += p.vy;
             p.alpha -= 0.012;
             if (p.alpha > 0) {
               ctx.fillStyle = `rgba(251, 191, 36, ${Math.max(0, p.alpha)})`;
               ctx.fillRect(p.x - p.size, p.y - p.size, p.size * 2, p.size * 2);
             }
           });
        }
      }

      if (progress < 1) {
        animFrameRef.current = requestAnimationFrame(animate);
      } else {
        isAnimationActive = false;
        finalScoreRef.current = newScore;
        if (scoreDisplayRef.current) {
          scoreDisplayRef.current.innerText = `${newScore}%`;
        }
        setIsSpinning(false);
        setIsLocked(true);

        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem('lucky_meter_sync_date', getLocalDateString());
            localStorage.setItem('lucky_meter_sync_score', newScore.toString());
            localStorage.setItem('lucky_meter_sync_quote', selectedQuote);
          } catch {
            // Storage unavailable
          }
        }
      }
    };

    animFrameRef.current = requestAnimationFrame(animate);
  };

  const handleShare = async () => {
    const text = `I resonated at ${finalScoreRef.current}% (${currentTier.label}) today on Lucky Pick Canada!`;
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Daily Resonance Ritual', text, url: window.location.href });
      } catch {
        // Fallback or cancelled
        try {
          await navigator.clipboard.writeText(`${text} ${window.location.href}`);
          if (isMountedRef.current) {
            setCopied(true);
            setTimeout(() => { if (isMountedRef.current) setCopied(false); }, 2000);
          }
        } catch {
           // Clipboard failed
        }
      }
    } else {
      try {
        await navigator.clipboard.writeText(`${text} ${window.location.href}`);
        if (isMountedRef.current) {
          setCopied(true);
          setTimeout(() => { if (isMountedRef.current) setCopied(false); }, 2000);
        }
      } catch {
        // Clipboard failed
      }
    }
  };

  return (
    <div className={styles.lmMainContainer}>
      <div className={styles.lmDialWrapper}>
        <div className={`${styles.lmMeterRing} ${isSpinning ? styles.lmSpinning : ''}`}>
          <StaticStuds />

          {/* Central Glass Disk */}
          <div
            className={styles.lmCenterDisc}
            style={{
              boxShadow: isLocked
                ? `0 0 35px ${currentTier.glowColor}, inset 0 0 25px rgba(0,0,0,0.85)`
                : 'inset 0 0 25px rgba(0,0,0,0.85)',
            }}
          >
            <canvas ref={canvasRef} className={styles.lmParticleCanvas} />

            {!isLocked && !isSpinning && (
              <div className={styles.lmInitialContent}>
                <div className={styles.lmReadyIcon}>⚡</div>
                <div className={styles.lmReadyLabel}>READY</div>
              </div>
            )}

            {(isSpinning || isLocked) && (
              <div className={styles.lmScoreDisplay}>
                <div className={styles.lmScoreValue} ref={scoreDisplayRef}>
                  {finalScoreRef.current !== null ? `${finalScoreRef.current}%` : ''}
                </div>
                <div className={styles.lmScoreTier} style={{ color: currentTier.primaryColor }}>
                  {currentTier.label.toUpperCase()}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Button & Attunement Section */}
      <div className={styles.lmActionArea}>
        {!isLocked && !isSpinning && (
          <button type="button" onClick={handleActivate} className={styles.lmActivateButton}>
            ENGAGE METER
          </button>
        )}

        {isSpinning && (
          <div className={styles.lmResonatingStatus}>RESONATING...</div>
        )}

        {isLocked && (
          <div className={styles.lmResultCard}>
            <div className={styles.lmCardHeader}>DAILY ATTUNEMENT</div>
            <p className={styles.lmCardQuote}>"{fortune}"</p>
            <button type="button" onClick={handleShare} className={styles.lmShareButton}>
              {copied ? '✓ COPIED LINK' : '🔗 SHARE RESONANCE'}
            </button>
            <CountdownTimer />
          </div>
        )}
      </div>
    </div>
  );
}
