'use client';

import React, { useState, useEffect, useRef } from 'react';
import styles from './LuckyMeter.module.css';

const STORAGE_KEY = 'lm_daily_luck_v1';

function getDateKey(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function getNextMidnight(now = new Date()) {
  const next = new Date(now);
  next.setHours(24, 0, 0, 0);
  return next;
}

function getTierFromPercentage(p) {
  if (p >= 80) return 'flagship';
  if (p >= 36) return 'premium';
  return 'standard';
}

function generateDailyPercentage() {
  const seed = getDateKey();
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return hash % 101;
}

export default function LuckyMeterPage() {
  const [percentage, setPercentage] = useState(null);
  const [tier, setTier] = useState(null);
  const [revealed, setRevealed] = useState(false);
  const [locked, setLocked] = useState(false);
  const [countdownText, setCountdownText] = useState('Next reset at midnight.');
  const [message, setMessage] = useState({ text: '', type: '' });
  const [warnLock, setWarnLock] = useState(false);

  const canvasRef = useRef(null);
  const animFrameRef = useRef(null);
  const vortexModeRef = useRef('idle');
  const particlesRef = useRef([]);

  // Hydration state check
  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    const now = new Date();
    const todayKey = getDateKey(now);

    if (raw) {
      try {
        const data = JSON.parse(raw);
        if (data.dateKey === todayKey && typeof data.percentage === 'number') {
          setPercentage(data.percentage);
          setTier(getTierFromPercentage(data.percentage));
          setRevealed(true);
          setLocked(true);
          return;
        }
      } catch (e) {
        console.error('Failed to parse lucky meter state:', e);
      }
    }
  }, []);

  // Reset countdown interval
  useEffect(() => {
    function updateCountdown() {
      const nextReset = getNextMidnight();
      const diff = nextReset.getTime() - new Date().getTime();
      if (diff <= 0) {
        setCountdownText('Resetting… reload to get a new reading.');
        setLocked(false);
        setWarnLock(false);
        return;
      }
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      if (hours <= 0 && minutes <= 0) {
        setCountdownText('Less than a minute until reset.');
      } else {
        setCountdownText(`Next reset in ${hours}h ${minutes}m.`);
      }
    }

    updateCountdown();
    const timer = setInterval(updateCountdown, 30000);
    return () => clearInterval(timer);
  }, []);

  // Canvas particle animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');

    function resizeCanvas() {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * window.devicePixelRatio;
      canvas.height = rect.height * window.devicePixelRatio;
    }

    function initParticles() {
      particlesRef.current = [];
      const count = 80;
      const w = canvas.width || 200;
      const h = canvas.height || 200;
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const radius = (Math.random() * 0.4 + 0.1) * (Math.min(w, h) / 2);
        particlesRef.current.push({
          x: w / 2 + Math.cos(angle) * radius,
          y: h / 2 + Math.sin(angle) * radius,
          angle,
          speed: 0.0008 + Math.random() * 0.0012,
          size: 18 + Math.random() * 22,
          alpha: 0.12 + Math.random() * 0.18,
        });
      }
    }

    resizeCanvas();
    initParticles();
    window.addEventListener('resize', resizeCanvas);

    function animate() {
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      const centerX = w / 2;
      const centerY = h / 2;

      let speedFactor = 1;
      let pullFactor = 0.0004;
      let alphaBoost = 0;

      if (vortexModeRef.current === 'activate') {
        speedFactor = 3.2;
        pullFactor = 0.0012;
        alphaBoost = 0.08;
      } else if (vortexModeRef.current === 'post') {
        speedFactor = 1.4;
        pullFactor = 0.0004;
        alphaBoost = 0.02;
      }

      ctx.globalCompositeOperation = 'lighter';

      particlesRef.current.forEach((p) => {
        p.angle += p.speed * speedFactor;

        const dx = centerX - p.x;
        const dy = centerY - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const pull = pullFactor * dist;

        p.x += Math.cos(p.angle) * 0.6 + dx * pull;
        p.y += Math.sin(p.angle) * 0.6 + dy * pull;

        const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size);
        gradient.addColorStop(0, `rgba(148, 163, 184, ${p.alpha + alphaBoost})`);
        gradient.addColorStop(0.4, `rgba(56, 189, 248, ${p.alpha * 0.8 + alphaBoost})`);
        gradient.addColorStop(1, 'rgba(15, 23, 42, 0)');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      });

      ctx.globalCompositeOperation = 'source-over';
      animFrameRef.current = requestAnimationFrame(animate);
    }

    animate();

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      window.removeEventListener('resize', resizeCanvas);
    };
  }, []);

  const handleReveal = () => {
    if (locked) {
      setMessage({
        text: 'You’ve already revealed today’s luck. Come back after midnight.',
        type: 'alert',
      });
      setWarnLock(true);
      return;
    }

    const p = generateDailyPercentage();
    const t = getTierFromPercentage(p);

    setPercentage(p);
    setTier(t);
    setRevealed(true);
    setLocked(true);

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ dateKey: getDateKey(), percentage: p })
    );

    vortexModeRef.current = 'activate';
    setTimeout(() => {
      vortexModeRef.current = 'post';
    }, 1800);

    if (t === 'flagship') {
      setMessage({ text: 'Flagship luck unlocked. Make today count.', type: 'success' });
    } else if (t === 'premium') {
      setMessage({ text: 'Premium luck. Strong odds in your favor.', type: 'success' });
    } else {
      setMessage({ text: 'Standard luck. Stay sharp and intentional.', type: '' });
    }
  };

  const handleShare = () => {
    if (!revealed || percentage == null) return;
    const tierLabel = tier ? tier.charAt(0).toUpperCase() + tier.slice(1) : 'Standard';
    const text = `My Lucky Meter reading today is ${percentage}% (${tierLabel} tier).`;
    const url = window.location.href;

    if (navigator.share) {
      navigator.share({ title: 'Lucky Meter Reading', text, url }).catch(() => {});
    } else {
      navigator.clipboard
        .writeText(`${text} ${url}`)
        .then(() => {
          setMessage({ text: 'Copied today’s luck to your clipboard.', type: 'success' });
        })
        .catch(() => {
          setMessage({ text: 'Unable to share automatically.', type: 'alert' });
        });
    }
  };

  const getTierColor = () => {
    if (tier === 'flagship') return 'var(--flagship)';
    if (tier === 'premium') return 'var(--premium)';
    return 'var(--standard)';
  };

  const getTierLabel = () => {
    if (tier === 'flagship') return 'Tier: Flagship';
    if (tier === 'premium') return 'Tier: Premium';
    if (tier === 'standard') return 'Tier: Standard';
    return 'Tier: —';
  };

  return (
    <div className={styles.lmRoot}>
      <div className={styles.lmAurora}></div>
      <div className={styles.lmInner}>
        <div className={styles.lmHeader}>
          <div className={styles.lmTitle}>Lucky Meter</div>
          <div className={styles.lmIndicators}>
            <div className={`${styles.lmIndicator} ${styles.lmIndicatorOn}`}></div>
            <div className={`${styles.lmIndicator} ${revealed ? styles.lmIndicatorOn : ''}`}></div>
            <div
              className={`${styles.lmIndicator} ${
                warnLock ? styles.lmIndicatorWarn : locked ? styles.lmIndicatorOn : ''
              }`}
            ></div>
          </div>
        </div>

        <div className={styles.lmDevice}>
          <div className={styles.lmDeviceTop}>
            <div className={styles.lmDeviceLabel}>Daily Luck Device</div>
            <div className={styles.lmTierPill}>
              <span
                className={styles.lmTierDot}
                style={{ background: getTierColor() }}
              ></span>
              <span>{getTierLabel()}</span>
            </div>
          </div>

          <div className={styles.lmMeterShell}>
            <div className={styles.lmMeterRing}></div>
            <div className={styles.lmMeterGlass}></div>
            <div className={styles.lmMeterCanvasWrap}>
              <canvas ref={canvasRef} className={styles.lmSmokeCanvas}></canvas>
            </div>
            <div className={styles.lmMeterCore}>
              <div className={styles.lmPercentageWrap}>
                <div
                  className={`${styles.lmPercentageValue} ${
                    revealed ? styles.lmPercentageValueVisible : ''
                  }`}
                >
                  {revealed ? `${percentage}%` : '--%'}
                </div>
                <div
                  className={`${styles.lmPercentageLabel} ${
                    revealed ? styles.lmPercentageLabelVisible : ''
                  }`}
                >
                  {revealed ? 'Today’s luck' : 'Awaiting reveal'}
                </div>
              </div>
            </div>
            <div className={styles.lmTierBadge}>
              <span
                className={styles.lmTierBadgeDot}
                style={{ background: getTierColor() }}
              ></span>
              <span>{getTierLabel()}</span>
            </div>
          </div>
        </div>

        <div className={styles.lmFooter}>
          <div className={styles.lmStatusRow}>
            <div className={styles.lmStatusLabel}>Status</div>
            <div
              className={`${styles.lmStatusValue} ${
                locked ? styles.lmStatusLocked : ''
              }`}
            >
              {locked ? 'Used for today' : 'Ready'}
            </div>
          </div>
          <div className={styles.lmCountdown}>{countdownText}</div>

          <div className={styles.lmActions}>
            <button
              onClick={handleReveal}
              className={`${styles.lmBtn} ${styles.lmBtnPrimary} ${
                locked ? styles.lmBtnPrimaryDisabled : ''
              }`}
            >
              <span>Reveal Today’s Luck</span>
            </button>
            <button
              onClick={handleShare}
              className={`${styles.lmBtn} ${styles.lmBtnSecondary} ${
                !revealed ? styles.lmBtnHidden : ''
              }`}
            >
              <span>Share</span>
              <span className={styles.lmBtnIcon}></span>
            </button>
          </div>

          <div
            className={`${styles.lmMessage} ${
              message.type === 'alert'
                ? styles.lmMessageAlert
                : message.type === 'success'
                ? styles.lmMessageSuccess
                : ''
            }`}
          >
            {message.text}
          </div>
        </div>
      </div>
    </div>
  );
}
