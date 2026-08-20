'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';

// --- CANVAS PARTICLE SYSTEM ---
interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
  isBurst?: boolean;
}

const hexToRgb = (hex: string) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
};

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

const CANADIAN_QUOTES: string[] = [
  'May your momentum burn as bright and vibrant as the northern lights over the Yukon.',
  'Like the Canadian Shield, your foundation is immovable—good fortune follows your next move.',
  'The compass points true North: trust your inner instincts along the open trail.',
  'Clear skies over the Rockies bring peak perspective and high-frequency alignment today.',
  'Good vibes flow swift like a boreal river—harness the current and ride the momentum.',
  'From coast to coast to coast, quiet efforts are aligning to bring fortunate breakthroughs.',
  'Patience through the frost brings golden rewards when the season turns.',
  'A steady compass and a grounded spirit will navigate any wilderness toward success.',
  'Every maple leaf finds its golden hour; today your resonance is running at full power.',
  'Breathe in the crisp pine air: total clarity and lucky breaks are on your horizon.',
];

const STORAGE_KEY = 'daily_lucky_meter_v1';

// Extract static CSS to avoid recreating on every render
const STATIC_STYLES = `
  .lucky-meter-container {
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

  @keyframes heartbeatPulse {
    0% { transform: scale(1); filter: brightness(1); box-shadow: var(--vort-glow); }
    10% { transform: scale(1.08); filter: brightness(1.3); box-shadow: 0 0 60px var(--acc-glow), inset 0 0 40px var(--acc-glow); }
    20% { transform: scale(0.96); filter: brightness(0.85); box-shadow: var(--vort-glow); }
    32% { transform: scale(1.12); filter: brightness(1.5); box-shadow: 0 0 90px var(--acc-glow), inset 0 0 60px var(--acc-glow); }
    50% { transform: scale(1); filter: brightness(1); box-shadow: var(--vort-glow); }
    100% { transform: scale(1); filter: brightness(1); box-shadow: var(--vort-glow); }
  }

  @keyframes cardiacAura {
    0%, 100% { opacity: 0.2; transform: scale(0.9); }
    10% { opacity: 0.85; transform: scale(1.15); }
    20% { opacity: 0.3; transform: scale(0.95); }
    32% { opacity: 1; transform: scale(1.25); }
    50% { opacity: 0.2; transform: scale(0.9); }
  }

  .ritual-header {
    display: flex;
    flex-direction: column;
    align-items: center;
    margin-bottom: 32px;
    z-index: 10;
  }

  .ritual-header-icon {
    margin-bottom: 8px;
    color: var(--sec-color);
    filter: drop-shadow(0 0 8px var(--pri-color));
  }

  .ritual-title {
    font-size: 1.1rem;
    font-weight: 800;
    letter-spacing: 0.25em;
    text-transform: uppercase;
    color: #ffffff;
    text-shadow: 0 0 12px var(--sec-color);
    margin-bottom: 4px;
  }

  .ritual-subtitle {
    font-size: 0.75rem;
    color: #94a3b8;
    letter-spacing: 0.05em;
    text-align: center;
    max-width: 280px;
  }

  .aurora-backdrop {
    position: absolute;
    inset: -100px;
    z-index: 0;
    pointer-events: none;
    overflow: hidden;
    background: #020617; /* Deep cosmic dark */
  }

  .starfield-layer {
    position: absolute;
    inset: 0;
    background-image:
      radial-gradient(1px 1px at 10% 20%, rgba(255, 255, 255, 0.8) 1px, transparent 0),
      radial-gradient(1.5px 1.5px at 30% 40%, rgba(255, 255, 255, 0.9) 1px, transparent 0),
      radial-gradient(1px 1px at 50% 60%, rgba(255, 255, 255, 0.6) 1px, transparent 0),
      radial-gradient(2px 2px at 70% 80%, rgba(255, 255, 255, 1) 1px, transparent 0),
      radial-gradient(1px 1px at 90% 10%, rgba(255, 255, 255, 0.5) 1px, transparent 0);
    background-size: 200px 200px;
    opacity: 0.5;
    animation: slowStarDrift 100s linear infinite;
  }

  .aurora-gradient-1 {
    position: absolute;
    width: 150%;
    height: 150%;
    top: -25%;
    left: -25%;
    background: radial-gradient(ellipse at center, rgba(16, 185, 129, 0.15) 0%, transparent 60%);
    filter: blur(80px);
    animation: auroraDrift 30s infinite alternate ease-in-out;
  }

  .aurora-gradient-2 {
    position: absolute;
    width: 120%;
    height: 120%;
    bottom: -10%;
    right: -10%;
    background: radial-gradient(ellipse at center, rgba(20, 184, 166, 0.12) 0%, transparent 65%);
    filter: blur(60px);
    animation: auroraDrift2 25s infinite alternate-reverse ease-in-out;
  }

  .aurora-gradient-3 {
    position: absolute;
    width: 100%;
    height: 100%;
    top: 20%;
    left: 20%;
    background: radial-gradient(circle at center, rgba(2, 6, 23, 0.5) 0%, transparent 70%); /* Deep cosmic dark accents */
    filter: blur(40px);
    mix-blend-mode: multiply;
  }

  @keyframes slowStarDrift {
    from { background-position: 0 0; }
    to { background-position: -400px 400px; }
  }

  @keyframes auroraDrift {
    0% { transform: translate(-5%, -5%) rotate(0deg) scale(1); opacity: 0.6; }
    50% { transform: translate(5%, 2%) rotate(2deg) scale(1.05); opacity: 0.8; }
    100% { transform: translate(0%, 5%) rotate(-1deg) scale(1); opacity: 0.6; }
  }

  @keyframes auroraDrift2 {
    0% { transform: translate(5%, 5%) rotate(0deg) scale(1); opacity: 0.5; }
    50% { transform: translate(-2%, -5%) rotate(-2deg) scale(1.1); opacity: 0.7; }
    100% { transform: translate(-5%, 0%) rotate(1deg) scale(1.05); opacity: 0.5; }
  }

  .machine-frame {
    position: relative;
    z-index: 10;
    width: 320px;
    height: 320px;
    border-radius: 50%;
    /* Realistic brushed gold bezel: deep antique bronze, warm bullion, pale champagne */
    background: conic-gradient(from 0deg,
      #4a3b1a 0deg,
      #8c7335 45deg,
      #d4af37 90deg,
      #f8e287 135deg,
      #8c7335 180deg,
      #4a3b1a 225deg,
      #d4af37 270deg,
      #f8e287 315deg,
      #4a3b1a 360deg
    );
    box-shadow:
      0 20px 45px rgba(0, 0, 0, 0.75),
      0 0 0 1px rgba(255, 223, 128, 0.4),
      inset 0 4px 10px rgba(255, 255, 255, 0.3),
      inset 0 -6px 12px rgba(40, 30, 10, 0.8);
    display: flex;
    align-items: center;
    justify-content: center;
    transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1);
  }

  .machine-frame.vibrating { animation: machineVibrate 0.08s infinite ease-in-out alternate; }
  .machine-frame.vibrating-intense { animation: machineVibrateIntense 0.04s infinite ease-in-out alternate; }

  @keyframes machineVibrate {
    0% { transform: translate(calc(var(--vib-int) * -1px), calc(var(--vib-int) * 0.5px)) rotate(-0.3deg); }
    100% { transform: translate(calc(var(--vib-int) * 1px), calc(var(--vib-int) * -0.5px)) rotate(0.3deg); }
  }

  @keyframes machineVibrateIntense {
    0% { transform: translate(calc(var(--vib-int) * -2.5px), calc(var(--vib-int) * 1.5px)) rotate(-0.8deg); }
    100% { transform: translate(calc(var(--vib-int) * 2.5px), calc(var(--vib-int) * -1.5px)) rotate(0.8deg); }
  }

  .rivet {
    position: absolute;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    /* Polished, machined brass stud */
    background: radial-gradient(circle at 35% 35%, #fff2cc 0%, #b38600 40%, #4d3900 90%);
    box-shadow:
      0 2px 4px rgba(0, 0, 0, 0.8),
      inset 0 1px 1px rgba(255, 255, 255, 0.8),
      inset 0 -1px 2px rgba(0, 0, 0, 0.6);
    transform: translate(-50%, -50%);
  }

  .recessed-well {
    position: relative;
    width: 270px;
    height: 270px;
    border-radius: 50%;
    background: #030712;
    /* Inner dark shadow track to seat the core */
    box-shadow:
      0 0 0 4px #1a150c,
      inset 0 10px 20px rgba(0, 0, 0, 0.9),
      inset 0 0 30px rgba(0, 0, 0, 0.95),
      0 1px 1px rgba(255, 255, 255, 0.1);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .led-ring-container {
    position: absolute;
    inset: 0;
  }

  .led-indicator {
    position: absolute;
    width: 7px;
    height: 7px;
    border-radius: 50%;
    transform: translate(-50%, -50%);
    background: #020617;
    opacity: 0.2;
    box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.8), 0 1px 1px rgba(255, 255, 255, 0.1);
    transition: background 0.3s, box-shadow 0.3s, opacity 0.3s;
  }

  .led-indicator.idle-orbital, .led-indicator.spinning-chase {
    /* Continuous chaser animation */
    animation: chaserRing var(--chaser-dur, 7s) infinite linear;
  }

  @keyframes chaserRing {
    0%, 90%, 100% {
      opacity: 0.2;
      background: #020617;
      box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.8), 0 1px 1px rgba(255, 255, 255, 0.1);
    }
    5% {
      opacity: 1;
      background: #ffffff;
      box-shadow: 0 0 8px #ffffff, 0 0 16px var(--sec-color), 0 0 24px var(--pri-color);
    }
  }

  .led-indicator.active {
    background: #ffffff;
    opacity: 1;
    box-shadow: 0 0 10px #ffffff, 0 0 20px var(--sec-color), 0 0 30px var(--pri-color), inset 0 0 4px var(--sec-color);
    animation: none;
  }


  .plasma-vortex-wrapper {
    position: relative;
    width: 200px;
    height: 200px;
    border-radius: 50%;
    overflow: hidden;
    background: #020617;
    box-shadow: var(--vort-glow);
    transition: box-shadow 0.6s cubic-bezier(0.16, 1, 0.3, 1);
  }

  .plasma-vortex-wrapper.heartbeat-active { animation: heartbeatPulse 1.6s infinite cubic-bezier(0.4, 0, 0.2, 1); }
  .plasma-vortex-wrapper.reveal-bloom { animation: punchyBloom 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
  .plasma-vortex-wrapper.reveal-bloom.heartbeat-active { animation: punchyBloom 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275), heartbeatPulse 1.6s infinite cubic-bezier(0.4, 0, 0.2, 1) 0.2s; }

  @keyframes punchyBloom {
    0% { filter: brightness(1); box-shadow: var(--vort-glow); }
    50% { filter: brightness(2); box-shadow: 0 0 100px #ffffff, inset 0 0 50px #ffffff; }
    100% { filter: brightness(1); box-shadow: var(--vort-glow); }
  }

  .final-lock-bloom {
    animation: finalGlowBloom 0.3s ease-out forwards;
  }
  @keyframes finalGlowBloom {
    0% { filter: brightness(1) contrast(1); box-shadow: var(--vort-glow); }
    30% { filter: brightness(2) contrast(1.2); box-shadow: 0 0 120px #ffffff, inset 0 0 80px #ffffff; }
    100% { filter: brightness(1) contrast(1); box-shadow: var(--vort-glow); }
  }

  .final-lock-shudder {
    animation: lockShudder 0.3s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
  }
  @keyframes lockShudder {
    0% { transform: translate(0, 0) rotate(0deg); }
    15% { transform: translate(-2px, 1px) rotate(-0.5deg); }
    30% { transform: translate(2px, -2px) rotate(0.5deg); }
    45% { transform: translate(-1px, 2px) rotate(-0.25deg); }
    60% { transform: translate(1px, -1px) rotate(0.25deg); }
    75% { transform: translate(-1px, 0px) rotate(0deg); }
    100% { transform: translate(0, 0) rotate(0deg); }
  }

  /* Disable transitions while spinning to keep flicker sharp */
  .lucky-meter-container.is-spinning .plasma-vortex-wrapper,
  .lucky-meter-container.is-spinning .led-indicator,
  .lucky-meter-container.is-spinning .score-display {
    transition: none !important;
  }

  .plasma-layer-1 {
    position: absolute;
    inset: -20px;
    border-radius: 50%;
    background: conic-gradient(from 0deg, transparent 0deg, var(--plas-g0) 90deg, transparent 180deg, var(--plas-g1) 270deg, transparent 360deg);
    opacity: 0.75;
    animation: rotateClockwise var(--rot-dur1) linear infinite;
  }

  .plasma-layer-2 {
    position: absolute;
    inset: -20px;
    border-radius: 50%;
    background: conic-gradient(from 180deg, transparent 0deg, var(--sec-color) 80deg, transparent 170deg, var(--pri-color) 260deg, transparent 360deg);
    opacity: 0.55;
    mix-blend-mode: screen;
    animation: rotateCounter var(--rot-dur2) linear infinite;
  }

  .plasma-breathing-core {
    position: absolute;
    inset: 15px;
    border-radius: 50%;
    background: radial-gradient(circle, var(--sec-color) 0%, var(--pri-color) 35%, transparent 70%);
    opacity: 0.45;
    animation: cardiacAura var(--breath-dur) infinite cubic-bezier(0.4, 0, 0.2, 1);
  }

  .glass-reflection {
    position: absolute;
    inset: 0;
    border-radius: 50%;
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.35) 0%, rgba(255, 255, 255, 0.08) 35%, transparent 60%, rgba(255, 255, 255, 0.03) 100%);
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
    text-shadow: 0 0 16px var(--sec-color), 0 2px 4px rgba(0, 0, 0, 0.8);
    transition: all 0.1s;
  }

  .score-display.locked {
    animation: scorePop 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    text-shadow: 0 0 30px var(--sec-color), 0 0 60px var(--pri-color), 0 2px 4px rgba(0, 0, 0, 0.8);
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
    color: var(--sec-color);
    margin-top: 4px;
    text-shadow: 0 0 8px var(--pri-color);
  }

  @keyframes scorePop {
    0% { transform: scale(0.6); opacity: 0; }
    100% { transform: scale(1); opacity: 1; }
  }

  .activate-btn {
    z-index: 10;
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
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.5), inset 0 1px 1px rgba(255, 255, 255, 0.3);
    transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  }

  .activate-btn:not(:disabled):hover {
    transform: translateY(-2px);
    border-color: var(--sec-color);
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.6), 0 0 15px var(--acc-glow), inset 0 1px 1px rgba(255, 255, 255, 0.4);
  }

  .activate-btn:not(:disabled):active { transform: translateY(1px); }
  .activate-btn:disabled { opacity: 0.75; cursor: not-allowed; }

  .quote-card {
    z-index: 10;
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

  .share-btn {
    z-index: 10;
    margin-top: 14px;
    background: transparent;
    border: none;
    color: var(--sec-color);
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

  .share-btn:hover { background: rgba(255, 255, 255, 0.05); }

  .flash-overlay {
    position: absolute;
    inset: 0;
    border-radius: 50%;
    background: radial-gradient(circle, #ffffff 0%, var(--sec-color) 40%, transparent 80%);
    pointer-events: none;
    z-index: 40;
    opacity: 0;
    mix-blend-mode: screen;
  }

  .flash-overlay.trigger-flash {
    animation: novaFlash 1.2s cubic-bezier(0.1, 1, 0.3, 1) forwards;
  }

  @keyframes novaFlash {
    0% { opacity: 0; transform: scale(0.5); }
    10% { opacity: 1; transform: scale(1.2); }
    100% { opacity: 0; transform: scale(2); }
  }
`;

const LED_COUNT = 32;
const RIVET_COUNT = 16;
const ANIMATION_DURATION_MS = 10000;

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


// Localized countdown component to prevent parent re-renders every second
const LockedCountdown = ({ loadState }: { loadState: () => void }) => {
  const [countdown, setCountdown] = useState<string>("");

  useEffect(() => {
    let countInterval: NodeJS.Timeout | null = null;
    let midnightTimer: NodeJS.Timeout | null = null;

    const scheduleMidnightUnlock = () => {
      if (midnightTimer) clearTimeout(midnightTimer);
      if (countInterval) clearInterval(countInterval);

      const msUntilMidnight = getTimeUntilMidnight();
      setCountdown(formatCountdown(msUntilMidnight));

      countInterval = setInterval(() => {
        const remaining = getTimeUntilMidnight();
        setCountdown(formatCountdown(remaining));
        if (remaining <= 1000) {
          if (countInterval) clearInterval(countInterval);
          countInterval = null;
        }
      }, 1000);

      midnightTimer = setTimeout(() => {
        loadState();
        scheduleMidnightUnlock();
      }, msUntilMidnight + 1000);
    };

    scheduleMidnightUnlock();

    return () => {
      if (midnightTimer) clearTimeout(midnightTimer);
      if (countInterval) clearInterval(countInterval);
    };
  }, [loadState]);

  return <>{countdown}</>;
};

export default function DailyLuckyMeter() {

  const [mounted, setMounted] = useState(false);


  const [isLocked, setIsLocked] = useState(false);
  const [isSpinning, setIsSpinning] = useState(false);
  const [isRevealing, setIsRevealing] = useState(false);
  const [displayedScore, setDisplayedScore] = useState<number | null>(null);
  const [scrambleValue, setScrambleValue] = useState<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);


  const [currentTier, setCurrentTier] = useState<TierConfig>(TIERS[1]);
  const [fortune, setFortune] = useState<string>('');

  const [copied, setCopied] = useState(false);

  const isMountedRef = useRef(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const scoreRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const tierRef = useRef(currentTier);

  useEffect(() => {
    tierRef.current = currentTier;
  }, [currentTier]);

  // Canvas render loop
  useEffect(() => {
    let isActive = true;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let lastTime = performance.now();

    const renderParticles = (time: number) => {
      if (!isActive) return;

      const dt = (time - lastTime) / 16.66; // Normalize to 60fps
      lastTime = time;

      // Ensure canvas sizing is correct
      if (canvas.width !== canvas.clientWidth || canvas.height !== canvas.clientHeight) {
        canvas.width = canvas.clientWidth;
        canvas.height = canvas.clientHeight;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const cx = canvas.width / 2;
      const cy = canvas.height / 2;
      const particles = particlesRef.current;

      // Spawn ambient/spinning particles
      if (isSpinning) {
        // High intensity spawning
        if (particles.length < 200 && Math.random() < 0.6 * dt) {
          const angle = Math.random() * Math.PI * 2;
          const speed = 2 + Math.random() * 8;
          particles.push({
            x: cx + Math.cos(angle) * 100,
            y: cy + Math.sin(angle) * 100,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            life: 1,
            maxLife: 20 + Math.random() * 30,
            size: 1 + Math.random() * 2.5,
            color: tierRef.current.secondaryColor
          });
        }
      } else {
        // Ambient heartbeat spawns
        if (particles.length < 50 && Math.random() < 0.05 * dt) {
          const angle = Math.random() * Math.PI * 2;
          particles.push({
            x: cx + Math.cos(angle) * 120,
            y: cy + Math.sin(angle) * 120,
            vx: Math.cos(angle) * 0.5,
            vy: Math.sin(angle) * -0.5 - Math.random() * 0.5, // float up slowly
            life: 1,
            maxLife: 60 + Math.random() * 60,
            size: 1 + Math.random() * 1.5,
            color: tierRef.current.primaryColor
          });
        }
      }

      // Update and draw particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.life += dt;

        if (p.life >= p.maxLife) {
          particles.splice(i, 1);
          continue;
        }

        const progress = p.life / p.maxLife;
        // Fade in quickly, then fade out
        let alpha = progress < 0.1 ? progress * 10 : 1 - Math.pow(progress, 2);

        ctx.globalAlpha = Math.max(0, alpha);
        ctx.fillStyle = p.color;
        // Optimization: Use fillRect instead of arc
        ctx.fillRect(p.x - p.size/2, p.y - p.size/2, p.size, p.size);
      }
      ctx.globalAlpha = 1.0;

      animationId = requestAnimationFrame(renderParticles);
    };

    animationId = requestAnimationFrame(renderParticles);
    return () => {
      isActive = false;
      cancelAnimationFrame(animationId);
    };
  }, [isSpinning]);

  const triggerBurst = useCallback((tierConfig: TierConfig) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;

    // Create explosion burst
    for (let i = 0; i < 80; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 5 + Math.random() * 15;
      particlesRef.current.push({
        x: cx + Math.cos(angle) * 50,
        y: cy + Math.sin(angle) * 50,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        maxLife: 30 + Math.random() * 40,
        size: 2 + Math.random() * 3,
        color: i % 2 === 0 ? tierConfig.secondaryColor : '#ffffff',
        isBurst: true
      });
    }
  }, []);

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
        setFortune(data.fortune || CANADIAN_QUOTES[0]);
      } else {
        setIsLocked(false);
        setDisplayedScore(null);
      }
    } catch {
      // LocalStorage unavailable
    }
  }, []);


  useEffect(() => {
    setMounted(true);
    loadState();

    return () => {
      isMountedRef.current = false;
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    };
  }, [loadState]);

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
    
    // Explicitly clamp score between 0 and 100
    score = Math.max(0, Math.min(100, score));

    const tier = TIERS.find((t) => score >= t.minScore && score <= t.maxScore) || TIERS[1];
    const quotes = CANADIAN_QUOTES;

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
    setIsRevealing(false);
    setDisplayedScore(null);
    setScrambleValue(0);
    setFortune('');

    const { score: finalScore, tier: targetTier, quote: finalQuote } = rollMetrics();

    const startTime = performance.now();
    let lastScrambleTime = startTime;

    const animateDisplay = (now: number) => {
      if (!isMountedRef.current) return;
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / ANIMATION_DURATION_MS, 1);

      if (progress < 1) {
        // Scrambling logic based on time phases
        let scrambleInterval = 50; // 0-5s: rapid 50ms
        if (elapsed > 5000 && elapsed <= 8500) {
           // 5.0s - 8.5s: Deceleration (50ms -> ~300ms)
           const decelProgress = (elapsed - 5000) / 3500;
           scrambleInterval = 50 + (decelProgress * 250);
        } else if (elapsed > 8500) {
           // 8.5s - 10.0s: Final crawl (~300ms -> ~600ms)
           const crawlProgress = (elapsed - 8500) / 1500;
           scrambleInterval = 300 + (crawlProgress * 300);
        }

        if (now - lastScrambleTime > scrambleInterval) {
          let nextVal;
          if (elapsed > 8500) {
             const timeLeft = 10000 - elapsed;
             const ticksLeft = Math.max(1, Math.floor(timeLeft / scrambleInterval));
             const diff = finalScore - (scrambleValue || 0);
             nextVal = (scrambleValue || 0) + Math.round(diff / ticksLeft);
          } else {
             nextVal = Math.floor(Math.random() * 100);
          }
          setScrambleValue(nextVal);

          const randomTier = TIERS[Math.floor(Math.random() * TIERS.length)];
          tierRef.current = randomTier;
          if (containerRef.current) {
            containerRef.current.style.setProperty('--pri-color', randomTier.primaryColor);
            containerRef.current.style.setProperty('--sec-color', randomTier.secondaryColor);
            containerRef.current.style.setProperty('--acc-glow', randomTier.accentGlow);
            containerRef.current.style.setProperty('--vort-glow', randomTier.vortexGlow);
            containerRef.current.style.setProperty('--plas-g0', randomTier.plasmaGradients[0]);
            containerRef.current.style.setProperty('--plas-g1', randomTier.plasmaGradients[1]);
            containerRef.current.style.setProperty('--vib-int', randomTier.vibrationIntensity.toString());
          }
          lastScrambleTime = now;
        }
        animationFrameRef.current = requestAnimationFrame(animateDisplay);
      } else {
        // Exact 10.0s Lock: Final Reveal
        setScrambleValue(null);
        setDisplayedScore(finalScore);
        setCurrentTier(targetTier); // Set the actual tier at the very end
        setIsSpinning(false);
        setIsLocked(true);
        setIsRevealing(true);
        // Explicitly set the DOM styles to the target tier to ensure they lock in correctly
        // even if React decides not to re-render the inline style object due to prop diffing.
        if (containerRef.current) {
          containerRef.current.style.setProperty('--pri-color', targetTier.primaryColor);
          containerRef.current.style.setProperty('--sec-color', targetTier.secondaryColor);
          containerRef.current.style.setProperty('--acc-glow', targetTier.accentGlow);
          containerRef.current.style.setProperty('--vort-glow', targetTier.vortexGlow);
          containerRef.current.style.setProperty('--plas-g0', targetTier.plasmaGradients[0]);
          containerRef.current.style.setProperty('--plas-g1', targetTier.plasmaGradients[1]);
          containerRef.current.style.setProperty('--vib-int', targetTier.vibrationIntensity.toString());
        }
        if (isMountedRef.current) {
          triggerBurst(targetTier); // Trigger the canvas particle explosion
        }

        // 10.5s (0.5s after lock): Fade in quote
        setTimeout(() => {
          if (isMountedRef.current) {
            setFortune(finalQuote);
            setIsRevealing(false);
          }
        }, 500); // 0.5s after exact lock

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

    // Defensively check Web Share API availability
    try {
      if (navigator.share && typeof navigator.canShare === 'function' && navigator.canShare(shareData)) {
        await navigator.share(shareData);
        return; // Successfully shared natively
      }
    } catch (err) {
      // Web Share API failed or user cancelled, fallback gracefully
      console.warn('Native share failed, falling back to clipboard.', err);
    }

    // Fallback: copy to clipboard
    try {
      if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
        await navigator.clipboard.writeText(`${shareData.text} ${shareData.url}`);
        if (isMountedRef.current) {
          setCopied(true);
          setTimeout(() => {
            if (isMountedRef.current) setCopied(false);
          }, 2200);
        }
      } else {
         console.warn('Clipboard API not available.');
      }
    } catch (err) {
      // Clipboard fallback failed
      console.warn('Clipboard fallback failed.', err);
    }
  };

  if (!mounted) return null;

  // Inject dynamic theme values via CSS variables
  const cssVars = {
    '--pri-color': currentTier.primaryColor,
    '--sec-color': currentTier.secondaryColor,
    '--acc-glow': currentTier.accentGlow,
    '--vort-glow': currentTier.vortexGlow,
    '--plas-g0': currentTier.plasmaGradients[0],
    '--plas-g1': currentTier.plasmaGradients[1],
    '--vib-int': currentTier.vibrationIntensity.toString(),
    '--rot-dur1': isSpinning ? '0.8s' : '9s',
    '--rot-dur2': isSpinning ? '0.6s' : '6s',
    '--breath-dur': isSpinning ? '0.4s' : '1.6s',
    '--chaser-dur': isSpinning ? '1s' : '7s',
  } as React.CSSProperties;

  return (
    <div className={`lucky-meter-container ${isSpinning ? 'is-spinning' : ''}`} style={cssVars} ref={containerRef}>
      {/* High-Performance Canvas Particles */}
      <canvas
        ref={canvasRef}
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 20 }}
      />
      <style>{STATIC_STYLES}</style>

      {/* Ritual Header Branding */}
      <div className="ritual-header">
        <div className="text-[10px] tracking-widest text-emerald-400/80 uppercase font-medium mb-2 text-center">
          ENTERTAINMENT & MOTIVATIONAL EXPERIENCE | FOR FUN ONLY
        </div>
        <div className="ritual-title">DAILY RESONANCE RITUAL</div>
        <div className="ritual-subtitle">Tune in once every 24 hours to sync your daily momentum.</div>
      </div>

      {/* Deep-Space Starfield & Aurora Backdrop */}
      <div className="aurora-backdrop">
        <div className="starfield-layer" />
        <div className="aurora-gradient-1" />
        <div className="aurora-gradient-2" />
        <div className="aurora-gradient-3" />
      </div>

      {/* Primary Metallic Machine Bezel */}
      <div className={`machine-frame ${isSpinning ? (scrambleValue !== null && scrambleValue % 3 === 0 ? 'vibrating-intense' : 'vibrating') : ''} ${isRevealing ? 'final-lock-shudder' : ''}`}>
        {/* Bezel Structural Rivets */}
        {Array.from({ length: RIVET_COUNT }).map((_, i) => {
          const pos = ringPosition(i, RIVET_COUNT, 46.5);
          return <div key={`rivet-${i}`} className="rivet" style={{ left: pos.left, top: pos.top }} />;
        })}

        {/* Recessed Internal Well */}
        <div className="recessed-well">
          {/* Flash Overlay inside well to isolate color */}
          <div className={`flash-overlay ${isRevealing ? 'trigger-flash' : ''}`} />
          {/* LED Ring Array */}
          <div className="led-ring-container">
            {Array.from({ length: LED_COUNT }).map((_, i) => {
              const pos = ringPosition(i, LED_COUNT, 42);
              const isChase = isSpinning;
              const isLit = displayedScore !== null && i / LED_COUNT <= displayedScore / 100;

              // Calculate staggered delay dynamically for both spinning and ambient chases
              const duration = isSpinning ? 1 : 7;
              const staggerDelay = isLit ? '0s' : `-${(duration - (i * duration / LED_COUNT)).toFixed(3)}s`;

              return (
                <div
                  key={`led-${i}`}
                  className={`led-indicator ${
                    isChase ? 'spinning-chase' : isLit ? 'active' : 'idle-orbital'
                  }`}
                  style={{
                    left: pos.left,
                    top: pos.top,
                    animationDelay: staggerDelay,
                    ...(isLit ? { backgroundColor: '#ffffff' } : {}), // override to hot white core if lit
                  }}
                />
              );
            })}
          </div>

          {/* Plasma Vortex Core (with Dynamic Heartbeat before & after reveal) */}
          <div className={`plasma-vortex-wrapper ${!isSpinning ? 'heartbeat-active' : ''} ${isRevealing ? 'reveal-bloom final-lock-bloom' : ''}`}>
            <div className="plasma-layer-1" />
            <div className="plasma-layer-2" />
            <div className="plasma-breathing-core" />
            <div className="glass-reflection" />

            {/* Central Meter Readout */}
            <div className="core-content">
              {displayedScore !== null ? (
                <>
                  <div className="score-display locked">
                    {displayedScore}
                    <span className="score-percent">%</span>
                  </div>
                  <div className="tier-label">{currentTier.name}</div>
                </>
              ) : scrambleValue !== null ? (
                <>
                  <div className="score-display" style={{ filter: 'blur(1px)' }}>
                    {scrambleValue}
                    <span className="score-percent">%</span>
                  </div>
                  <div className="tier-label" style={{ opacity: 0.5 }}>CALCULATING...</div>
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
        {isSpinning ? 'RESONATING...' : isLocked ? <>LOCKED (<LockedCountdown loadState={loadState} />)</> : 'ENGAGE METER'}
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

          <button className="share-btn" onClick={handleShare} aria-label="Share your daily attunement result">
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
