'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import LuckyCardReveal from './lucky-card-reveal';

function getTodaysLuck() {
  return Math.floor(Math.random() * 100) + 1;
}

export default function LuckMeter() {
  const [luckLevel, setLuckLevel] = useState(0);
  const [targetLuck, setTargetLuck] = useState(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const needleAngle = -126 + (luckLevel / 100) * 252;
  const meterTicks = Array.from({ length: 25 }, (_, index) => index);
  const frameRef = useRef(null);

  useEffect(() => {
    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, []);

  function startMeter() {
    if (hasStarted || isSpinning) {
      return;
    }

    if (frameRef.current) {
      cancelAnimationFrame(frameRef.current);
    }

    const target = getTodaysLuck();
    const duration = 1800;
    const start = performance.now();

    setTargetLuck(target);
    setHasStarted(true);
    setIsSpinning(true);
    setLuckLevel(0);

    function tick(now) {
      const progress = Math.min((now - start) / duration, 1);
      const easedProgress = 1 - Math.pow(1 - progress, 3);
      const spin = Math.sin(progress * Math.PI * 8) * (1 - progress) * 16;
      const nextLevel = Math.round(target * easedProgress + spin);

      setLuckLevel(Math.max(0, Math.min(100, nextLevel)));

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(tick);
      } else {
        setLuckLevel(target);
        setIsSpinning(false);
      }
    }

    frameRef.current = requestAnimationFrame(tick);
  }


  return (
    <>
      <section aria-labelledby="luck-meter-title" className="lucky-meter premium-surface" style={{ marginTop: '2rem', padding: 'clamp(1.25rem, 3vw, 1.8rem)', borderRadius: 30, background: 'radial-gradient(circle at 12% 18%, rgba(250, 204, 21, 0.3), transparent 24%), radial-gradient(circle at 88% 5%, rgba(16, 185, 129, 0.38), transparent 28%), linear-gradient(145deg, rgba(3, 8, 14, 0.94), rgba(4, 44, 40, 0.84) 54%, rgba(7, 18, 37, 0.9))', color: '#fff7d6', border: '1px solid rgba(255, 235, 160, 0.26)', boxShadow: '0 32px 96px rgba(0, 0, 0, 0.52), 0 0 54px rgba(16, 185, 129, 0.2), 0 0 34px rgba(250, 204, 21, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.1)', overflow: 'hidden', position: 'relative', backdropFilter: 'blur(18px) saturate(130%)' }}>
      <style>{`
        @keyframes lucky-meter-glow {
          0%, 100% { box-shadow: 0 0 18px rgba(94, 234, 212, 0.45); }
          50% { box-shadow: 0 0 34px rgba(250, 204, 21, 0.72); }
        }

        @keyframes lucky-meter-artwork-reveal {
          0% { opacity: 0.78; transform: scale(0.985); filter: saturate(0.92) brightness(0.88); }
          55% { opacity: 1; transform: scale(1.012); filter: saturate(1.12) brightness(1.08); }
          100% { opacity: 0.94; transform: scale(1); filter: saturate(1) brightness(1); }
        }

        @keyframes lucky-meter-artwork-sparkle {
          0%, 100% { opacity: 0.18; transform: translate3d(-5%, 3%, 0) scale(0.94); }
          50% { opacity: 0.72; transform: translate3d(5%, -3%, 0) scale(1.05); }
        }

        @keyframes lucky-meter-dial-spin {
          to { transform: rotate(360deg); }
        }

        @keyframes lucky-meter-button-press {
          0% { transform: translateY(0) scale(1); }
          45% { transform: translateY(3px) scale(.975); }
          100% { transform: translateY(0) scale(1); }
        }

        @keyframes lucky-meter-aurora {
          0% { transform: translateX(-18%) rotate(-4deg); opacity: 0.36; }
          50% { transform: translateX(9%) rotate(5deg); opacity: 0.7; }
          100% { transform: translateX(20%) rotate(-2deg); opacity: 0.44; }
        }

        .luck-meter { font-family: var(--lpc-body); }
        .luck-meter h2 { font-family: var(--lpc-display); }
      `}</style>
      <div aria-hidden="true" style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 18, left: -140, width: 620, height: 130, borderRadius: '999px', background: 'linear-gradient(90deg, rgba(16,185,129,0), rgba(20,184,166,0.52), rgba(250,204,21,0.3), rgba(16,185,129,0))', filter: 'blur(15px)', animation: 'lucky-meter-aurora 11s ease-in-out infinite alternate' }} />
        <div style={{ position: 'absolute', bottom: -120, right: -120, width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(250,204,21,0.16), transparent 64%)' }} />
      </div>

      <div className="experience-brand"><Image src="/BackgroundEraser_20260724_163638777.png" alt="LuckyPickCanada official maple clover logo" width={52} height={52} sizes="52px" quality={90} /><span>LuckyPickCanada.ca</span></div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem', alignItems: 'center' }}>
        <div>
          <p style={{ margin: 0, textTransform: 'uppercase', letterSpacing: 2, color: '#facc15', fontWeight: 900 }}>
            Daily Luck Meter
          </p>
          <h2 id="luck-meter-title" style={{ margin: '0.4rem 0 0.75rem', fontSize: 'clamp(1.9rem, 5vw, 3.2rem)', lineHeight: 1, letterSpacing: '-0.04em', textShadow: '0 0 24px rgba(250, 204, 21, 0.2)' }}>
            Start your luck meter
          </h2>
          <p style={{ margin: 0, lineHeight: 1.6, maxWidth: 560 }}>
            Tap the button once and the meter will reveal your true luck percentage for today.
          </p>

        </div>

        <div style={{ display: 'grid', gap: '0.85rem' }}>
          <div className={`lucky-meter-artwork ${isSpinning ? 'is-spinning' : ''} ${hasStarted ? 'has-result' : ''}`}>
            <div className="lucky-meter-aurora" aria-hidden="true" />
            <div className="lucky-meter-frame">
              <span aria-hidden="true" className="lucky-meter-reference-layer lucky-meter-reference-housing" />
              <div className="lucky-meter-frame-rim" />
              <div className="lucky-meter-frame-lights" />
              <div className="lucky-meter-face">
                <span aria-hidden="true" className="lucky-meter-reference-layer lucky-meter-reference-dial" />
                <div className="lucky-meter-face-glass" />
                <div className="lucky-meter-scale" aria-hidden="true">
                  {meterTicks.map((tick) => (
                    <span
                      key={tick}
                      className={`lucky-meter-tick ${tick % 6 === 0 ? 'is-major' : ''}`}
                      style={{ '--tick-angle': `${-126 + tick * 10.5}deg` }}
                    />
                  ))}
                </div>
                <div className="lucky-meter-dial-numbers" aria-hidden="true">
                  <span className="lucky-meter-number is-zero">0</span>
                  <span className="lucky-meter-number is-twenty-five">25</span>
                  <span className="lucky-meter-number is-fifty">50</span>
                  <span className="lucky-meter-number is-seventy-five">75</span>
                  <span className="lucky-meter-number is-hundred">100</span>
                </div>
                <div className="lucky-meter-scale-label lucky-meter-scale-label-low">LOW</div>
                <div className="lucky-meter-scale-label lucky-meter-scale-label-high">HIGH</div>
                <div className="lucky-meter-score" aria-live="polite">{hasStarted ? luckLevel : '—'}<small>%</small></div>
                <span
                  aria-hidden="true"
                  className="lucky-meter-needle"
                  style={{ '--lucky-meter-needle-angle': `${needleAngle}deg` }}
                />
                <span aria-hidden="true" className="lucky-meter-hub" />
                <span aria-hidden="true" className="lucky-meter-artwork-sparkle" />
              </div>
            </div>
            <div className="lucky-meter-plinth" aria-hidden="true" />
            <button
              type="button"
              onClick={startMeter}
              disabled={isSpinning || hasStarted}
              className="lucky-meter-image-start"
              aria-label={isSpinning ? 'Lucky Meter is running' : hasStarted ? `Luck locked in at ${luckLevel} percent` : 'Generate your luck'}
            >
              <span className="lucky-meter-button-sheen" aria-hidden="true" />
              <span>Generate Your Luck</span>
              <small>{isSpinning ? 'Powering the meter…' : hasStarted ? 'Luck generated' : 'Tap to begin'}</small>
            </button>
          </div>

          <div style={{ padding: '1rem', borderRadius: 20, background: 'linear-gradient(145deg, rgba(2, 8, 23, 0.82), rgba(6, 39, 36, 0.66))', color: '#fff7d6', textAlign: 'center', border: '1px solid rgba(255, 235, 160, 0.26)', boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.08)' }}>
            <p style={{ margin: 0, fontSize: 'clamp(1.45rem, 5vw, 2.4rem)', fontWeight: 900 }}>
              Luck Level Today: {hasStarted ? `${luckLevel}%` : 'Ready'}
            </p>
            <p role="status" aria-live="polite" style={{ margin: '0.35rem 0 0', color: '#34d399', fontWeight: 800 }}>
              {isSpinning ? 'Spinning now...' : targetLuck === null ? 'Press Start Meter to begin' : `Final luck: ${targetLuck}% today`}
            </p>
          </div>
        </div>
      </div>
      </section>

      {targetLuck !== null && !isSpinning ? <LuckyCardReveal luckScore={targetLuck} /> : null}
    </>
  );
}
