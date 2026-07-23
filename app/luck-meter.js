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
      <section aria-labelledby="luck-meter-title" className="lucky-meter premium-surface" style={{ marginTop: '2rem', padding: 'clamp(1.25rem, 3vw, 1.8rem)', borderRadius: 30, background: 'radial-gradient(circle at 12% 18%, rgba(250, 204, 21, 0.3), transparent 24%), radial-gradient(circle at 88% 5%, rgba(16, 185, 129, 0.38), transparent 28%), linear-gradient(145deg, rgba(3, 8, 14, 0.94), rgba(4, 44, 40, 0.84) 54%, rgba(7, 18, 37, 0.9))', color: '#fff7d6', border: '1px solid rgba(255, 235, 160, 0.26)', boxShadow: '0 32px 96px rgba(0, 0, 0, 0.52), 0 0 54px rgba(16, 185, 129, 0.2), 0 0 34px rgba(250, 204, 21, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.1)', overflow: 'hidden', position: 'relative', backdropFilter: 'blur(18px) saturate(130%)' }}>
      <style>{`
        @keyframes lucky-meter-glow {
          0%, 100% { box-shadow: 0 0 18px rgba(94, 234, 212, 0.45); }
          50% { box-shadow: 0 0 34px rgba(250, 204, 21, 0.72); }
        }

        @keyframes lucky-meter-shimmer {
          from { transform: translateX(-120%); }
          to { transform: translateX(220%); }
        }

        @keyframes lucky-meter-aurora {
          0% { transform: translateX(-18%) rotate(-4deg); opacity: 0.36; }
          50% { transform: translateX(9%) rotate(5deg); opacity: 0.7; }
          100% { transform: translateX(20%) rotate(-2deg); opacity: 0.44; }
        }

        .luck-meter { font-family: var(--lpc-body); }
        .luck-meter h2 { font-family: var(--lpc-display); }
        .luck-meter-button { transition: transform 180ms ease, filter 180ms ease, box-shadow 180ms ease; }
        .luck-meter-button:not(:disabled):hover { transform: translateY(-2px); filter: saturate(1.12); }
      `}</style>
      <div aria-hidden="true" style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 18, left: -140, width: 620, height: 130, borderRadius: '999px', background: 'linear-gradient(90deg, rgba(16,185,129,0), rgba(20,184,166,0.52), rgba(250,204,21,0.3), rgba(16,185,129,0))', filter: 'blur(15px)', animation: 'lucky-meter-aurora 11s ease-in-out infinite alternate' }} />
        <div style={{ position: 'absolute', bottom: -120, right: -120, width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(250,204,21,0.16), transparent 64%)' }} />
      </div>

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
          <button
            type="button"
            onClick={startMeter}
            disabled={isSpinning || hasStarted}
            className="luck-meter-button" style={{ marginTop: '1rem', padding: '0.95rem 1.45rem', border: '1px solid rgba(255, 242, 180, 0.78)', borderRadius: 999, background: isSpinning || hasStarted ? 'linear-gradient(135deg, #64748b, #334155)' : 'linear-gradient(135deg, #fff8c8 0%, #f9d86c 22%, #facc15 48%, #b7791f 100%)', color: isSpinning || hasStarted ? '#e5e7eb' : '#06110d', fontSize: '1rem', fontWeight: 950, cursor: isSpinning ? 'wait' : hasStarted ? 'not-allowed' : 'pointer', boxShadow: isSpinning || hasStarted ? '0 12px 28px rgba(0, 0, 0, 0.2)' : '0 0 28px rgba(250, 204, 21, 0.46), 0 16px 32px rgba(183, 121, 31, 0.24), inset 0 1px 0 rgba(255, 255, 255, 0.6)' }}
          >
            {isSpinning ? 'Meter spinning...' : hasStarted ? 'Luck locked in' : 'Start Meter'}
          </button>
        </div>

        <div style={{ display: 'grid', gap: '0.85rem' }}>
          <div role="img" aria-label="LuckyPickCanada Luck Meter generator" style={{ position: 'relative', height: 148, borderRadius: '148px 148px 24px 24px', background: 'conic-gradient(from 270deg at 50% 100%, #063b2f 0deg, #10b981 48deg, #facc15 108deg, #b7791f 154deg, #5f120f 180deg, transparent 180deg)', animation: 'lucky-meter-glow 2.8s ease-in-out infinite', overflow: 'hidden', border: '1px solid rgba(255,235,160,0.34)', boxShadow: 'inset 0 0 0 10px rgba(2,8,23,0.34), 0 18px 42px rgba(0,0,0,0.34)' }}>
            <span aria-hidden="true" style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.48), transparent)', animation: 'lucky-meter-shimmer 1.5s ease-in-out infinite' }} />
            <span aria-hidden="true" style={{ position: 'absolute', inset: 18, borderRadius: '128px 128px 18px 18px', border: '1px solid rgba(255, 247, 214, 0.24)' }} />
            <div style={{ position: 'absolute', left: '50%', bottom: 4, width: 8, height: 106, borderRadius: 999, background: 'linear-gradient(180deg, #fff7d6, #facc15 22%, #071225 24%)', transformOrigin: '50% 100%', transform: `translateX(-50%) rotate(${needleRotation}deg)`, transition: 'transform 120ms ease-out', boxShadow: '0 0 18px rgba(250, 204, 21, 0.32)' }} />
            <div style={{ position: 'absolute', left: '50%', bottom: -8, width: 42, height: 42, borderRadius: '50%', background: '#071225', transform: 'translateX(-50%)', border: '7px solid #facc15', boxShadow: '0 0 28px rgba(250, 204, 21, 0.55), inset 0 0 12px rgba(255,255,255,0.12)' }} />
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
