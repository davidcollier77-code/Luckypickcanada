'use client';

import { useEffect, useRef, useState } from 'react';
import LuckyCardReveal from './lucky-card-reveal';

function getTodaysLuck() {
  return Math.floor(Math.random() * 101);
}

export default function LuckMeter() {
  const [luckLevel, setLuckLevel] = useState(0);
  const [targetLuck, setTargetLuck] = useState(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
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

  const needleRotation = -90 + (luckLevel / 100) * 180;

  return (
    <>
      <section aria-labelledby="luck-meter-title" style={{ marginTop: '2rem', padding: '1.5rem', borderRadius: 28, background: 'radial-gradient(circle at 12% 18%, rgba(250, 204, 21, 0.24), transparent 20%), radial-gradient(circle at 88% 5%, rgba(16, 185, 129, 0.26), transparent 24%), linear-gradient(145deg, rgba(8, 19, 41, 0.84), rgba(14, 44, 48, 0.68))', color: '#fff7d6', border: '1px solid rgba(255, 235, 160, 0.2)', boxShadow: '0 24px 70px rgba(0, 0, 0, 0.38), 0 0 34px rgba(250, 204, 21, 0.12)', overflow: 'hidden' }}>
      <style>{`
        @keyframes lucky-meter-glow {
          0%, 100% { box-shadow: 0 0 18px rgba(94, 234, 212, 0.45); }
          50% { box-shadow: 0 0 34px rgba(250, 204, 21, 0.72); }
        }

        @keyframes lucky-meter-shimmer {
          from { transform: translateX(-120%); }
          to { transform: translateX(220%); }
        }
      `}</style>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem', alignItems: 'center' }}>
        <div>
          <p style={{ margin: 0, textTransform: 'uppercase', letterSpacing: 2, color: '#facc15', fontWeight: 900 }}>
            Daily Luck Meter
          </p>
          <h2 id="luck-meter-title" style={{ margin: '0.4rem 0 0.75rem', fontSize: 'clamp(1.9rem, 5vw, 3.2rem)', lineHeight: 1 }}>
            Start your luck meter
          </h2>
          <p style={{ margin: 0, lineHeight: 1.6, maxWidth: 560 }}>
            Tap the button once and the meter will reveal your true luck percentage for today.
          </p>
          <button
            type="button"
            onClick={startMeter}
            disabled={isSpinning || hasStarted}
            style={{ marginTop: '1rem', padding: '0.9rem 1.4rem', border: 0, borderRadius: 999, background: isSpinning || hasStarted ? '#64748b' : 'linear-gradient(135deg, #fff1a8 0%, #facc15 45%, #b7791f 100%)', color: '#071225', fontSize: '1rem', fontWeight: 900, cursor: isSpinning ? 'wait' : hasStarted ? 'not-allowed' : 'pointer', boxShadow: '0 0 24px rgba(250, 204, 21, 0.38), 0 14px 28px rgba(183, 121, 31, 0.22)' }}
          >
            {isSpinning ? 'Meter spinning...' : hasStarted ? 'Luck locked in' : 'Start Meter'}
          </button>
        </div>

        <div style={{ display: 'grid', gap: '0.85rem' }}>
          <div style={{ position: 'relative', height: 128, borderRadius: '128px 128px 20px 20px', background: 'conic-gradient(from 270deg at 50% 100%, #10b981 0deg, #facc15 95deg, #dc2626 180deg, transparent 180deg)', animation: 'lucky-meter-glow 2.8s ease-in-out infinite', overflow: 'hidden' }}>
            <span aria-hidden="true" style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.42), transparent)', animation: 'lucky-meter-shimmer 1.5s ease-in-out infinite' }} />
            <div style={{ position: 'absolute', left: '50%', bottom: 0, width: 8, height: 92, borderRadius: 999, background: '#071225', transformOrigin: '50% 100%', transform: `translateX(-50%) rotate(${needleRotation}deg)`, transition: 'transform 120ms ease-out', boxShadow: '0 0 16px rgba(15, 23, 42, 0.28)' }} />
            <div style={{ position: 'absolute', left: '50%', bottom: -10, width: 36, height: 36, borderRadius: '50%', background: '#071225', transform: 'translateX(-50%)', border: '6px solid #fff7d6' }} />
          </div>

          <div style={{ padding: '1rem', borderRadius: 20, background: 'rgba(2, 8, 23, 0.72)', color: '#fff7d6', textAlign: 'center', border: '1px solid rgba(20, 184, 166, 0.4)' }}>
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
