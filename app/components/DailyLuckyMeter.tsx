'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';

// ==========================================
// CONFIGURATION & CONSTANTS
// ==========================================

interface TierConfig {
  name: string;
  minScore: number;
  maxScore: number;
  primaryColor: string;
  secondaryColor: string;
  accentGlow: string;
  plasmaGradients: [string, string];
  vortexGlow: string;
  vibrationIntensity: number;
  sparksCount: number;
  flashes: boolean;
}

const TIERS: TierConfig[] = [
  {
    name: 'Dormant Void',
    minScore: 0,
    maxScore: 39,
    primaryColor: '#64748b',
    secondaryColor: '#94a3b8',
    accentGlow: 'rgba(100, 116, 139, 0.4)',
    plasmaGradients: ['#334155', '#1e293b'],
    vortexGlow: '0 0 35px rgba(148, 163, 184, 0.3), inset 0 0 20px rgba(100, 116, 139, 0.5)',
    vibrationIntensity: 2,
    sparksCount: 4,
    flashes: false,
  },
  {
    name: 'Emerald Surge',
    minScore: 40,
    maxScore: 69,
    primaryColor: '#10b981',
    secondaryColor: '#34d399',
    accentGlow: 'rgba(16, 185, 129, 0.5)',
    plasmaGradients: ['#059669', '#10b981'],
    vortexGlow: '0 0 50px rgba(52, 211, 153, 0.55), inset 0 0 30px rgba(16, 185, 129, 0.65)',
    vibrationIntensity: 4,
    sparksCount: 8,
    flashes: false,
  },
  {
    name: 'Kinetic Lime',
    minScore: 70,
    maxScore: 89,
    primaryColor: '#84cc16',
    secondaryColor: '#a3e635',
    accentGlow: 'rgba(132, 204, 22, 0.6)',
    plasmaGradients: ['#65a30d', '#a3e635'],
    vortexGlow: '0 0 65px rgba(163, 230, 53, 0.7), inset 0 0 40px rgba(132, 204, 22, 0.8)',
    vibrationIntensity: 6,
    sparksCount: 14,
    flashes: true,
  },
  {
    name: 'Supernova Gold',
    minScore: 90,
    maxScore: 100,
    primaryColor: '#eab308',
    secondaryColor: '#facc15',
    accentGlow: 'rgba(234, 179, 8, 0.8)',
    plasmaGradients: ['#ca8a04', '#fef08a'],
    vortexGlow: '0 0 85px rgba(250, 204, 21, 0.9), inset 0 0 50px rgba(234, 179, 8, 0.95)',
    vibrationIntensity: 9,
    sparksCount: 22,
    flashes: true,
  },
];

const FORTUNES: Record<string, string[]> = {
  'Dormant Void': [
    'Conserve your energy; the quiet before momentum builds.',
    'A subtle pivot today creates massive leverage tomorrow.',
    'Patience is an active strategy, not a passive delay.',
    'Low noise brings high clarity. Focus on fundamentals.',
  ],
  'Emerald Surge': [
    'The currents are turning in your favor. Lean into action.',
    'Clear pathways open where resistance once stood.',
    'Trust your immediate instincts on critical decisions.',
    'A minor calculated risk yields immediate momentum.',
  ],
  'Kinetic Lime': [
    'High-voltage alignment across all your active efforts.',
    'Synchronicity is on your side today—accelerate boldly.',
    'Opportunities compound rapidly when you initiate.',
    'You are in the flow state. Execute without hesitation.',
  ],
  'Supernova Gold': [
    'Peak planetary resonance! Everything clicks today.',
    'Maximum serendipity unlocked. Take your biggest swing.',
    'Unstoppable creative and strategic breakthrough.',
    'The jackpot timeline is active. Own the day.',
  ],
};

const STORAGE_KEY = 'daily_lucky_meter_v1';
const LED_COUNT = 20;
const RIVET_COUNT = 16;
const ANIMATION_DURATION_MS = 3000;

const ringPosition = (index: number, total: number, radiusPct: number) => {
  const angle = (index / total) * 2 * Math.PI - Math.PI / 2;
  const x = 50 + radiusPct * Math.cos(angle);
  const y = 50 + radiusPct * Math.sin(angle);
  return { left: `${x.toFixed(3)}%`, top: `${y.toFixed(3)}%` };
};

const getTodayKey = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
};

const getTimeUntilMidnight = () => {
  const now = new Date();
  const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0, 0);
  return Math.max(0, midnight.getTime() - now.getTime());
};

const formatCountdown = (ms: number) => {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, '0');
  const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0');
  const seconds = String(totalSeconds % 60).padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
};

// ==========================================
// COMPONENT
// ==========================================

export default function DailyLuckyMeter() {
  const [mounted, setMounted] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [isSpinning, setIsSpinning] = useState(false);
  const [displayedScore, setDisplayedScore] = useState<number | null>(null);
  const [currentTier, setCurrentTier] = useState<TierConfig>(TIERS[1]);
  const [fortune, setFortune] = useState<string>('');
  const [countdown, setCountdown] = useState<string>('');
  const [copied, setCopied] = useState(false);

  const animationFrameRef = useRef<number | null>(null);
  const midnightTimerRef = useRef<NodeJS.Timeout | null>(null);
  const countIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const loadState = useCallback(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;

      const data = JSON.parse(raw);
      const today = getTodayKey();

      if (data && data.date === today) {
        setIsLocked(true);
        setDisplayedScore(data.score);
        const tier = TIERS.find((t) => data.score >= t.minScore && data.score <= t.maxScore) || TIERS[1];
        setCurrentTier(tier);
        setFortune(data.fortune || FORTUNES[tier.name][0]);
      } else {
        setIsLocked(false);
        setDisplayedScore(null);
      }
    } catch {
      // LocalStorage unavailable
    }
  }, []);

  const scheduleMidnightUnlock = useCallback(() => {
    if (midnightTimerRef.current) clearTimeout(midnightTimerRef.current);
    if (countIntervalRef.current) clearInterval(countIntervalRef.current);

    const msUntilMidnight = getTimeUntilMidnight();
    setCountdown(formatCountdown(msUntilMidnight));

    countIntervalRef.current = setInterval(() => {
      const remaining = getTimeUntilMidnight();
      setCountdown(formatCountdown(remaining));
      if (remaining <= 1000) {
        if (countIntervalRef.current) clearInterval(countIntervalRef.current);
      }
    }, 1000);

    midnightTimerRef.current = setTimeout(() => {
      loadState();
      scheduleMidnightUnlock();
    }, msUntilMidnight + 1000);
  }, [loadState]);

  useEffect(() => {
    setMounted(true);
    loadState();
    scheduleMidnightUnlock();

    return () => {
      if (midnightTimerRef.current) clearTimeout(midnightTimerRef.current);
      if (countIntervalRef.current) clearInterval(countIntervalRef.current);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [loadState, scheduleMidnightUnlock]);

  const rollMetrics = () => {
    let lastScore = -1;
    let lastFortune = '';

    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        lastScore = parsed.score ?? -1;
        lastFortune = parsed.fortune ?? '';
      }
    } catch {
      // Ignore
    }

    let score = Math.floor(Math.random() * 101);
    let attempts = 0;
    while (score === lastScore && attempts < 10) {
      score = Math.floor(Math.random() * 101);
      attempts++;
    }
    if (score === lastScore) score = (lastScore + 37) % 101;

    const tier = TIERS.find((t) => score >= t.minScore && score <= t.maxScore) || TIERS[1];
    const quotes = FORTUNES[tier.name];

    let pickedQuote = quotes[Math.floor(Math.random() * quotes.length)];
    let quoteAttempts = 0;
    while (pickedQuote === lastFortune && quoteAttempts < 10 && quotes.length > 1) {
      pickedQuote = quotes[Math.floor(Math.random() * quotes.length)];
      quoteAttempts++;
    }

    return { score, tier, quote: pickedQuote };
  };

  const handleActivate = () => {
    if (isLocked || isSpinning) return;

    setIsSpinning(true);
    setDisplayedScore(null);
    setFortune('');

    const { score: finalScore, tier: targetTier, quote: finalQuote } = rollMetrics();
    setCurrentTier(targetTier);

    const startTime = performance.now();

    const animateDisplay = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / ANIMATION_DURATION_MS, 1);

      if (progress > 0.45) {
        const localProgress = (progress - 0.45) / 0.55;
        const eased = 1 - Math.pow(1 - localProgress, 4);
        setDisplayedScore(Math.floor(eased * finalScore));
      }

      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(animateDisplay);
      } else {
        setDisplayedScore(finalScore);
        setFortune(finalQuote);
        setIsSpinning(false);
        setIsLocked(true);

        try {
          localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify({
              date: getTodayKey(),
              score: finalScore,
              fortune: finalQuote,
              timestamp: Date.now(),
            })
          );
        } catch {
          // LocalStorage fallback
        }
      }
    };

    animationFrameRef.current = requestAnimationFrame(animateDisplay);
  };

  const handleShare = async () => {
    if (displayedScore === null) return;

    const shareData = {
      title: 'Daily Lucky Meter',
      text: `⚡ My Daily Resonance: ${displayedScore}% [${currentTier.name}]\n"${fortune}"\nCheck your luck today:`,
      url: typeof window !== 'undefined' ? window.location.href : '',
    };

    if (navigator.share && typeof navigator.canShare === 'function' && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
        return;
      } catch {
        // Fallback to clipboard
      }
    }

    try {
      await navigator.clipboard.writeText(`${shareData.text} ${shareData.url}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      // Clipboard fallback
    }
  };

  if (!mounted) return null;

  return (
    <div className="lucky-meter-container">
      <style>{`
        .lucky-meter-container {
          --primary: ${currentTier.primaryColor};
          --secondary: ${currentTier.secondaryColor};
          --accent-glow: ${currentTier.accentGlow};
          width: 100%;
          max-width: 440px;
          margin: 0 auto;
          padding: 24px 16px;
          display: flex;
          flex-direction: column;
          align-items: center;
          color: #f8fafc;
          font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          user-select: none;
        }

        /* Heartbeat (Systole / Diastole Dual-Thump) Keyframes */
        @keyframes heartbeatPulse {
          0% {
            transform: scale(1);
            filter: brightness(1);
          }
          10% {
            transform: scale(1.035);
            filter: brightness(1.22);
          }
          20% {
            transform: scale(0.99);
            filter: brightness(0.95);
          }
          32% {
            transform: scale(1.055);
            filter: brightness(1.35);
          }
          50% {
            transform: scale(1);
            filter: brightness(1);
          }
          100% {
            transform: scale(1);
            filter: brightness(1);
          }
        }

        @keyframes cardiacAura {
          0%, 100% {
            opacity: 0.3;
            transform: scale(0.92);
          }
          10% {
            opacity: 0.75;
            transform: scale(1.04);
          }
          20% {
            opacity: 0.4;
            transform: scale(0.98);
          }
          32% {
            opacity: 0.9;
            transform: scale(1.08);
          }
          50% {
            opacity: 0.3;
            transform: scale(0.92);
          }
        }

        /* Machine Housing */
        .machine-frame {
          position: relative;
          width: 320px;
          height: 320px;
          border-radius: 50%;
          background: conic-gradient(
            from 0deg,
            #1e293b,
            #475569,
            #0f172a,
            #64748b,
            #1e293b,
            #475569,
            #0f172a,
            #1e293b
          );
          box-shadow:
            0 20px 45px rgba(0, 0, 0, 0.75),
            0 0 0 1px rgba(255, 255, 255, 0.12),
            inset 0 2px 4px rgba(255, 255, 255, 0.25),
            inset 0 -4px 6px rgba(0, 0, 0, 0.8);
          display: flex;
          align-items: center;
          justify-content: center;
          transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .machine-frame.vibrating {
          animation: machineVibrate 0.08s infinite ease-in-out alternate;
        }

        @keyframes machineVibrate {
          0% { transform: translate(-${currentTier.vibrationIntensity}px, ${currentTier.vibrationIntensity * 0.5}px) rotate(-0.3deg); }
          100% { transform: translate(${currentTier.vibrationIntensity}px, -${currentTier.vibrationIntensity * 0.5}px) rotate(0.3deg); }
        }

        /* Rivets */
        .rivet {
          position: absolute;
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: radial-gradient(circle at 35% 35%, #94a3b8, #1e293b 80%);
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.8), inset 0 0.5px 1px rgba(255, 255, 255, 0.6);
          transform: translate(-50%, -50%);
        }

        /* Recessed Well */
        .recessed-well {
          position: relative;
          width: 270px;
          height: 270px;
          border-radius: 50%;
          background: #030712;
          box-shadow:
            inset 0 10px 20px rgba(0, 0, 0, 0.9),
            inset 0 0 30px rgba(0, 0, 0, 0.95),
            0 1px 1px rgba(255, 255, 255, 0.1);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        /* 20-LED Ring */
        .led-indicator {
          position: absolute;
          width: 7px;
          height: 7px;
          border-radius: 50%;
          transform: translate(-50%, -50%);
          background: #1e293b;
          transition: background 0.3s, box-shadow 0.3s;
        }

        .led-indicator.idle-heartbeat {
          animation: ledCardiacPulse 1.6s infinite cubic-bezier(0.4, 0, 0.2, 1);
        }

        .led-indicator.active {
          background: var(--secondary);
          box-shadow: 0 0 8px var(--secondary), 0 0 14px var(--primary);
        }

        .led-indicator.spinning-chase {
          animation: ledSpin 0.9s infinite linear;
        }

        @keyframes ledCardiacPulse {
          0%, 100% { opacity: 0.25; background: #334155; box-shadow: none; }
          10% { opacity: 0.85; background: var(--secondary); box-shadow: 0 0 6px var(--primary); }
          20% { opacity: 0.35; background: #334155; box-shadow: none; }
          32% { opacity: 1; background: var(--secondary); box-shadow: 0 0 10px var(--secondary); }
          50% { opacity: 0.25; background: #334155; box-shadow: none; }
        }

        @keyframes ledSpin {
          0% { opacity: 0.2; transform: translate(-50%, -50%) scale(0.9); }
          50% { opacity: 1; transform: translate(-50%, -50%) scale(1.3); background: var(--secondary); box-shadow: 0 0 10px var(--secondary); }
          100% { opacity: 0.2; transform: translate(-50%, -50%) scale(0.9); }
        }

        /* Plasma Vortex Wrapper with Heartbeat */
        .plasma-vortex-wrapper {
          position: relative;
          width: 200px;
          height: 200px;
          border-radius: 50%;
          overflow: hidden;
          background: #020617;
          box-shadow: ${currentTier.vortexGlow};
          transition: box-shadow 0.6s cubic-bezier(0.16, 1, 0.3, 1);
        }

        /* Censorship / Cardiac Pulse on Idle & Locked States */
        .plasma-vortex-wrapper.heartbeat-active {
          animation: heartbeatPulse 1.6s infinite cubic-bezier(0.4, 0, 0.2, 1);
        }

        /* Counter-Rotating Plasma Layers */
        .plasma-layer-1 {
          position: absolute;
          inset: -20px;
          border-radius: 50%;
          background: conic-gradient(
            from 0deg,
            transparent 0deg,
            ${currentTier.plasmaGradients[0]} 90deg,
            transparent 180deg,
            ${currentTier.plasmaGradients[1]} 270deg,
            transparent 360deg
          );
          opacity: 0.75;
          animation: rotateClockwise ${isSpinning ? '0.8s' : '9s'} linear infinite;
        }

        .plasma-layer-2 {
          position: absolute;
          inset: -20px;
          border-radius: 50%;
          background: conic-gradient(
            from 180deg,
            transparent 0deg,
            ${currentTier.secondaryColor} 80deg,
            transparent 170deg,
            ${currentTier.primaryColor} 260deg,
            transparent 360deg
          );
          opacity: 0.55;
          mix-blend-mode: screen;
          animation: rotateCounter ${isSpinning ? '0.6s' : '6s'} linear infinite;
        }

        .plasma-breathing-core {
          position: absolute;
          inset: 15px;
          border-radius: 50%;
          background: radial-gradient(circle, var(--secondary) 0%, var(--primary) 35%, transparent 70%);
          opacity: 0.45;
          animation: cardiacAura ${isSpinning ? '0.4s' : '1.6s'} infinite cubic-bezier(0.4, 0, 0.2, 1);
        }

        .glass-reflection {
          position: absolute;
          inset: 0;
          border-radius: 50%;
          background: linear-gradient(
            135deg,
            rgba(255, 255, 255, 0.35) 0%,
            rgba(255, 255, 255, 0.08) 35%,
            transparent 60%,
            rgba(255, 255, 255, 0.03) 100%
          );
          pointer-events: none;
          z-index: 10;
        }

        @keyframes rotateClockwise {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @keyframes rotateCounter {
          0% { transform: rotate(360deg); }
          100% { transform: rotate(0deg); }
        }

        /* Vortex Core Content */
        .core-content {
          position: relative;
          z-index: 20;
          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: 16px;
        }

        .score-display {
          font-size: 3.5rem;
          font-weight: 900;
          letter-spacing: -0.05em;
          line-height: 1;
          color: #ffffff;
          text-shadow: 0 0 16px var(--secondary), 0 2px 4px rgba(0, 0, 0, 0.8);
          animation: scorePop 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }

        .score-percent {
          font-size: 1.75rem;
          opacity: 0.8;
          font-weight: 600;
          margin-left: 2px;
        }

        .tier-label {
          font-size: 0.75rem;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--secondary);
          margin-top: 4px;
          text-shadow: 0 0 8px var(--primary);
        }

        @keyframes scorePop {
          0% { transform: scale(0.6); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }

        /* Interactive Trigger / Button */
        .activate-btn {
          margin-top: 24px;
          padding: 14px 32px;
          font-size: 0.95rem;
          font-weight: 700;
          letter-spacing: 0.05em;
          color: #ffffff;
          background: linear-gradient(180deg, #334155 0%, #0f172a 100%);
          border: 1px solid rgba(255, 255, 255, 0.15);
          border-radius: 9999px;
          cursor: pointer;
          position: relative;
          box-shadow:
            0 4px 15px rgba(0, 0, 0, 0.5),
            inset 0 1px 1px rgba(255, 255, 255, 0.3);
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .activate-btn:not(:disabled):hover {
          transform: translateY(-2px);
          border-color: var(--secondary);
          box-shadow:
            0 6px 20px rgba(0, 0, 0, 0.6),
            0 0 15px var(--accent-glow),
            inset 0 1px 1px rgba(255, 255, 255, 0.4);
        }

        .activate-btn:not(:disabled):active {
          transform: translateY(1px);
        }

        .activate-btn:disabled {
          opacity: 0.75;
          cursor: not-allowed;
        }

        /* Fortune Quote Card */
        .quote-card {
          margin-top: 20px;
          padding: 14px 18px;
          background: rgba(15, 23, 42, 0.6);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 12px;
          backdrop-filter: blur(8px);
          max-width: 320px;
          text-align: center;
          font-size: 0.85rem;
          line-height: 1.45;
          color: #cbd5e1;
          animation: fadeIn 0.4s ease-out;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }

        /* Share Button */
        .share-btn {
          margin-top: 14px;
          background: transparent;
          border: none;
          color: var(--secondary);
          font-size: 0.8rem;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          border-radius: 6px;
          transition: background 0.2s;
        }

        .share-btn:hover {
          background: rgba(255, 255, 255, 0.05);
        }
      `}</style>

      {/* Primary Metallic Machine Bezel */}
      <div className={`machine-frame ${isSpinning ? 'vibrating' : ''}`}>
        {/* Bezel Structural Rivets */}
        {Array.from({ length: RIVET_COUNT }).map((_, i) => {
          const pos = ringPosition(i, RIVET_COUNT, 46.5);
          return <div key={`rivet-${i}`} className="rivet" style={{ left: pos.left, top: pos.top }} />;
        })}

        {/* Recessed Internal Well */}
        <div className="recessed-well">
          {/* 20-LED Ring Array */}
          {Array.from({ length: LED_COUNT }).map((_, i) => {
            const pos = ringPosition(i, LED_COUNT, 44);
            const isChase = isSpinning;
            const isLit = displayedScore !== null && i / LED_COUNT <= displayedScore / 100;
            const staggerDelay = `${(i * 0.045).toFixed(3)}s`;

            return (
              <div
                key={`led-${i}`}
                className={`led-indicator ${
                  isChase ? 'spinning-chase' : isLit ? 'active' : 'idle-heartbeat'
                }`}
                style={{
                  left: pos.left,
                  top: pos.top,
                  animationDelay: staggerDelay,
                  ...(isLit ? { backgroundColor: currentTier.secondaryColor } : {}),
                }}
              />
            );
          })}

          {/* Plasma Vortex Core (with Dynamic Heartbeat before & after reveal) */}
          <div className={`plasma-vortex-wrapper ${!isSpinning ? 'heartbeat-active' : ''}`}>
            <div className="plasma-layer-1" />
            <div className="plasma-layer-2" />
            <div className="plasma-breathing-core" />
            <div className="glass-reflection" />

            {/* Central Meter Readout */}
            <div className="core-content">
              {displayedScore !== null ? (
                <>
                  <div className="score-display">
                    {displayedScore}
                    <span className="score-percent">%</span>
                  </div>
                  <div className="tier-label">{currentTier.name}</div>
                </>
              ) : (
                <div style={{ textAlign: 'center' }}>
                  <svg
                    width="42"
                    height="42"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{
                      color: currentTier.secondaryColor,
                      filter: `drop-shadow(0 0 6px ${currentTier.primaryColor})`,
                    }}
                  >
                    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                  </svg>
                  <div style={{ fontSize: '0.65rem', letterSpacing: '0.1em', opacity: 0.6, marginTop: 4 }}>
                    READY
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Activation Control */}
      <button className="activate-btn" onClick={handleActivate} disabled={isLocked || isSpinning}>
        {isSpinning ? 'RESONATING...' : isLocked ? `LOCKED (${countdown})` : 'ENGAGE METER'}
      </button>

      {/* Fortune Reading & Sharing (Post-Reveal) */}
      {fortune && !isSpinning && (
        <>
          <div className="quote-card">
            <div style={{ fontSize: '0.7rem', color: currentTier.secondaryColor, marginBottom: 4, fontWeight: 700 }}>
              DAILY ATTUNEMENT
            </div>
            &ldquo;{fortune}&rdquo;
          </div>

          <button className="share-btn" onClick={handleShare}>
            {copied ? (
              <>✓ Copied Result</>
            ) : (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="18" cy="5" r="3" />
                  <circle cx="6" cy="12" r="3" />
                  <circle cx="18" cy="19" r="3" />
                  <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                  <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                </svg>
                Share Resonance
              </>
            )}
          </button>
        </>
      )}
    </div>
  );
}
