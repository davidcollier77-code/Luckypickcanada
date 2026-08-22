'use client';

import React, { useState, useEffect, useRef, useId, useCallback } from 'react';
import styles from '../lucky-meter/LuckyMeter.module.css';

interface DailyLuckyMeterProps {
  onScoreGenerated?: (score: number) => void;
}

const ATTUNEMENTS: Record<string, { label: string; attunement: string }> = {
  void: {
    label: 'Dormant Void',
    attunement: 'A steady compass and a grounded spirit will navigate any wilderness toward success.',
  },
  spark: {
    label: 'Kindling Spark',
    attunement: 'Small embers catch the autumn wind. Take the first intentional step today.',
  },
  ember: {
    label: 'Rising Current',
    attunement: 'Momentum is building across the horizon. Trust the timing of your journey.',
  },
  aurora: {
    label: 'Northern Resonance',
    attunement: 'The skies align with quiet possibilities. Clarity and fortune are within reach.',
  },
  solstice: {
    label: 'Peak Radiance',
    attunement: 'A day of maximum alignment. Bold actions carry extraordinary resonance.',
  },
};

function getAttunementData(score: number) {
  if (score <= 15) return ATTUNEMENTS.void;
  if (score <= 40) return ATTUNEMENTS.spark;
  if (score <= 70) return ATTUNEMENTS.ember;
  if (score <= 90) return ATTUNEMENTS.aurora;
  return ATTUNEMENTS.solstice;
}

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

function CountdownTimer() {
  const [timeLeft, setTimeLeft] = useState(getMsUntilMidnight());

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(getMsUntilMidnight());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div style={{ marginTop: '0.75rem', fontSize: '0.85rem', color: '#fbbf24', letterSpacing: '0.05em' }}>
      Next Resonance in: <strong>{formatCountdown(timeLeft)}</strong>
    </div>
  );
}

export default function DailyLuckyMeter({ onScoreGenerated }: DailyLuckyMeterProps) {
  const uniqueId = useId();
  const [status, setStatus] = useState<'idle' | 'resonating' | 'locked'>('idle');
  const [score, setScore] = useState<number>(0);
  const [displayScore, setDisplayScore] = useState<number>(0);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);

  const checkLockStatus = useCallback(() => {
    try {
      const storedDate = localStorage.getItem('lucky_meter_sync_date');
      const storedScore = localStorage.getItem('lucky_meter_sync_score');
      const today = getLocalDateString();

      if (storedDate === today && storedScore !== null) {
        const parsed = parseInt(storedScore, 10) || 10;
        setScore(parsed);
        setDisplayScore(parsed);
        setStatus('locked');
        return true;
      }
    } catch {
      // Storage unavailable
    }
    return false;
  }, []);

  useEffect(() => {
    checkLockStatus();
  }, [checkLockStatus]);

  const handleEngage = () => {
    if (status !== 'idle') return;

    setStatus('resonating');
    const newScore = Math.floor(Math.random() * 95) + 5;
    const startTime = performance.now();
    const duration = 2400;

    // Run capped canvas particles
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        canvas.width = 300;
        canvas.height = 300;
        const particleCount = 10;
        const particles = Array.from({ length: particleCount }, () => ({
          x: 150,
          y: 150,
          vx: (Math.random() - 0.5) * 3,
          vy: (Math.random() - 0.5) * 3,
          alpha: 1,
          size: Math.random() * 2 + 1,
        }));

        const draw = () => {
          ctx.clearRect(0, 0, 300, 300);
          particles.forEach((p) => {
            p.x += p.vx;
            p.y += p.vy;
            p.alpha -= 0.015;
            if (p.alpha > 0) {
              ctx.fillStyle = `rgba(251, 191, 36, ${Math.max(0, p.alpha)})`;
              ctx.beginPath();
              ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
              ctx.fill();
            }
          });

          if (particles.some((p) => p.alpha > 0)) {
            animFrameRef.current = requestAnimationFrame(draw);
          }
        };
        draw();
      }
    }

    const animateNumber = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeOut = 1 - Math.pow(1 - progress, 3);
      setDisplayScore(Math.round(newScore * easeOut));

      if (progress < 1) {
        animFrameRef.current = requestAnimationFrame(animateNumber);
      } else {
        setScore(newScore);
        setDisplayScore(newScore);
        setStatus('locked');

        try {
          localStorage.setItem('lucky_meter_sync_date', getLocalDateString());
          localStorage.setItem('lucky_meter_sync_score', newScore.toString());
        } catch {
          // Storage unavailable
        }

        if (onScoreGenerated) {
          onScoreGenerated(newScore);
        }
      }
    };

    animFrameRef.current = requestAnimationFrame(animateNumber);
  };

  useEffect(() => {
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  const attunement = getAttunementData(displayScore || score || 1);
  const radius = 105;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (circumference * (displayScore || score || 1)) / 100;

  return (
    <div className={styles.lmWrapper}>
      <div className={styles.lmDialContainer}>
        {/* Brass Bezel Frame */}
        <div className={styles.lmBezel}>
          <div className={styles.lmRivetsContainer}>
            {Array.from({ length: 12 }).map((_, i) => (
              <span key={`rivet-${uniqueId}-${i}`} className={styles.lmRivet} style={{ transform: `rotate(${i * 30}deg) translateY(-120px)` }} />
            ))}
          </div>

          {/* GPU SVG Progress Ring */}
          <svg className={styles.lmSvgRing} viewBox="0 0 260 260">
            <circle cx="130" cy="130" r={radius} className={styles.lmTrackCircle} />
            <circle
              cx="130"
              cy="130"
              r={radius}
              className={styles.lmProgressCircle}
              style={{
                strokeDasharray: circumference,
                strokeDashoffset: status === 'idle' ? circumference : strokeDashoffset,
                transition: status === 'resonating' ? 'none' : 'stroke-dashoffset 0.6s ease-out',
              }}
            />
          </svg>

          {/* Central Glass Disk */}
          <div className={styles.lmCenterHub}>
            <canvas ref={canvasRef} className={styles.lmCanvas} />
            <div className={styles.lmScoreContent}>
              {status === 'idle' ? (
                <div className={styles.lmReadyState}>
                  <span className={styles.lmReadyIcon}>⚡</span>
                  <span className={styles.lmReadyText}>READY</span>
                </div>
              ) : (
                <div className={styles.lmActiveState}>
                  <div className={styles.lmScoreNumber}>{displayScore}%</div>
                  <div className={styles.lmScoreLabel}>{attunement.label.toUpperCase()}</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Persistent Static Container */}
      <div className={styles.lmBottomContainer}>
        {status === 'idle' && (
          <button type="button" onClick={handleEngage} className={styles.lmEngageButton}>
            ENGAGE METER
          </button>
        )}

        {status === 'resonating' && (
          <div className={styles.lmResonatingText}>RESONATING...</div>
        )}

        {status === 'locked' && (
          <div className={styles.lmLockedContainer}>
            <div className={styles.lmAttunementCard}>
              <div className={styles.lmAttunementTitle}>DAILY ATTUNEMENT</div>
              <p className={styles.lmAttunementQuote}>"{attunement.attunement}"</p>
            </div>
            <CountdownTimer />
          </div>
        )}
      </div>
    </div>
  );
}
