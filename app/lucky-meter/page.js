'use client';

import React, { useState, useRef, useEffect } from 'react';

// ==========================================
// 1. Core Lucky Meter Animation Engine
// ==========================================
class LuckyMeterEngine {
  constructor(onUpdate) {
    this.value = 0;
    this.onUpdate = onUpdate;
    this.animId = null;
  }

  setValue(newValue) {
    this.value = Math.max(0, Math.min(100, newValue));
    if (this.onUpdate) this.onUpdate(this.value);
  }

  animateTo(target, duration = 2500) {
    if (this.animId) cancelAnimationFrame(this.animId);
    const start = this.value;
    const diff = target - start;
    const startTime = performance.now();

    const tick = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function: smooth quadratic ease-out
      const eased = start + diff * (1 - (1 - progress) * (1 - progress));
      this.setValue(eased);

      if (progress < 1) {
        this.animId = requestAnimationFrame(tick);
      }
    };

    this.animId = requestAnimationFrame(tick);
  }
}

// ==========================================
// 2. SSR-Safe State Manager (Persistence)
// ==========================================
class LuckyMeterStateManager {
  constructor({ meter, storageKey = "luckyMeterValue" }) {
    this.meter = meter;
    this.storageKey = storageKey;
  }

  save(value) {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(value));
    } catch (err) {
      console.warn("LuckyMeterStateManager: Could not save state", err);
    }
  }

  load() {
    if (typeof window === 'undefined') return null;
    try {
      const raw = localStorage.getItem(this.storageKey);
      return raw ? JSON.parse(raw) : null;
    } catch (err) {
      console.warn("LuckyMeterStateManager: Could not load state", err);
      return null;
    }
  }

  init() {
    const saved = this.load();
    if (saved !== null) {
      this.meter.setValue(saved);
      return saved;
    }
    return 0;
  }

  animateAndStore(target, duration = 2500) {
    this.meter.animateTo(target, duration);
    setTimeout(() => {
      this.save(target);
    }, duration + 50);
  }

  reset() {
    this.meter.setValue(0);
    this.save(0);
  }
}

// ==========================================
// 3. Event Bridge (External & Custom Triggers)
// ==========================================
class LuckyMeterEventBridge {
  constructor({ stateManager }) {
    this.stateManager = stateManager;
    this.listeners = {};
  }

  on(eventName, callback) {
    if (!this.listeners[eventName]) {
      this.listeners[eventName] = [];
    }
    this.listeners[eventName].push(callback);
  }

  emit(eventName, data) {
    const callbacks = this.listeners[eventName];
    if (!callbacks) return;

    callbacks.forEach((cb) => {
      try {
        cb(data);
      } catch (err) {
        console.warn(`LuckyMeterEventBridge: Error in '${eventName}' listener`, err);
      }
    });
  }

  bindDefaultEvents() {
    this.on("luck:update", (value) => {
      const safeValue = Math.max(0, Math.min(100, value));
      this.stateManager.animateAndStore(safeValue);
    });

    this.on("luck:reset", () => {
      this.stateManager.reset();
    });
  }
}

// ==========================================
// Fortune Definitions
// ==========================================
const COSMIC_FORTUNES = [
  { min: 90, text: "✨ Supreme Cosmic Alignment! The universe is bending probability in your favor." },
  { min: 75, text: "🌟 High Vibrational Sync! Fortune favors your boldest moves today." },
  { min: 50, text: "⚡ Balanced Energy Grid! Steady momentum guides your next pick." },
  { min: 25, text: "🌙 Fluxing Starlight! Trust your intuition over pure chance." },
  { min: 0, text: "🌌 Cosmic Reset! Charge your energy and manifest a new path." }
];

// ==========================================
// 4. Main React Page Component
// ==========================================
export default function LuckyMeterPage() {
  const [displayScore, setDisplayScore] = useState(0);
  const [isCalculating, setIsCalculating] = useState(false);
  const [fortune, setFortune] = useState('');
  
  const engineRef = useRef(null);
  const managerRef = useRef(null);
  const bridgeRef = useRef(null);

  useEffect(() => {
    // Initialize Core System
    const engine = new LuckyMeterEngine((val) => {
      setDisplayScore(Math.round(val));
    });

    const manager = new LuckyMeterStateManager({ meter: engine });
    const bridge = new LuckyMeterEventBridge({ stateManager: manager });
    
    bridge.bindDefaultEvents();

    engineRef.current = engine;
    managerRef.current = manager;
    bridgeRef.current = bridge;

    // Load persisted luck score on initial mount
    const savedScore = manager.init();
    if (savedScore > 0) {
      const matchedFortune = COSMIC_FORTUNES.find(f => savedScore >= f.min)?.text || COSMIC_FORTUNES[4].text;
      setFortune(matchedFortune);
    }

    return () => {
      if (engineRef.current && engineRef.current.animId) {
        cancelAnimationFrame(engineRef.current.animId);
      }
    };
  }, []);

  const handleGenerateLuck = () => {
    if (isCalculating) return;

    setIsCalculating(true);
    setFortune('');

    const targetScore = Math.floor(Math.random() * 100) + 1;

    // Trigger state manager animation & persistence save
    if (managerRef.current) {
      managerRef.current.animateAndStore(targetScore, 2500);
    }

    // Resolve ritual UI state after 2.5 seconds
    setTimeout(() => {
      setIsCalculating(false);
      const matchedFortune = COSMIC_FORTUNES.find(f => targetScore >= f.min)?.text || COSMIC_FORTUNES[4].text;
      setFortune(matchedFortune);
    }, 2500);
  };

  return (
    <main className="lm-cosmic-container">
      {/* Ambient Cosmic Background */}
      <div className="lm-starfield" />
      <div className="lm-aurora-glow" />

      {/* Watermark Cropping Container */}
      <div className="lm-watermark-crop">
        <div className={`lm-dome-frame ${isCalculating ? 'is-active' : ''}`}>
          
          {/* Metallic Dome Top Branding */}
          <div className="lm-dome-header">
            <span className="lm-header-title">GENERATE LUCK</span>
            <div className={`lm-status-indicator ${isCalculating ? 'active' : ''}`} />
          </div>

          {/* Central Energy Chamber */}
          <div className="lm-vortex-chamber">
            <div className={`lm-vortex-core ${isCalculating ? 'spinning' : ''}`} />
            <div className="lm-glass-reflection" />

            {/* LED Status Ring */}
            <div className="lm-led-ring">
              {[...Array(8)].map((_, i) => (
                <span 
                  key={i} 
                  className={`lm-led-dot ${isCalculating ? 'pulse' : ''}`}
                  style={{ animationDelay: `${i * 0.12}s` }}
                />
              ))}
            </div>

            {/* Score Display Overlay */}
            <div className="lm-score-overlay">
              <div className="lm-score-value">
                {displayScore}<span className="lm-percent-symbol">%</span>
              </div>
              <div className="lm-score-label">
                {isCalculating ? 'ALIGNING ENERGIES...' : 'LUCK RESONANCE'}
              </div>
            </div>
          </div>

          {/* Cosmic Fortune Output */}
          {fortune && (
            <div className="lm-fortune-card">
              <p>{fortune}</p>
            </div>
          )}

          {/* Interactive Ritual Button */}
          <div className="lm-action-wrapper">
            <button
              onClick={handleGenerateLuck}
              disabled={isCalculating}
              className={`lm-generate-btn ${isCalculating ? 'loading' : ''}`}
            >
              <span className="lm-btn-glow" />
              <span className="lm-btn-text">
                {isCalculating ? 'CALCULATING...' : 'GENERATE LUCK'}
              </span>
            </button>
          </div>

        </div>
      </div>
    </main>
  );
}
