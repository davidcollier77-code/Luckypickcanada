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
      <section aria-labelledby="luck-meter-title" className="lucky-meter premium-surface lucky-meter-shell" style={{ marginTop: '2rem', padding: 'clamp(1.25rem, 3vw, 1.8rem)', borderRadius: 30, background: 'radial-gradient(circle at 12% 18%, rgba(250, 204, 21, 0.3), transparent 24%), radial-gradient(circle at 88% 5%, rgba(16, 185, 129, 0.38), transparent 28%), linear-gradient(145deg, rgba(3, 8, 14, 0.94), rgba(4, 44, 40, 0.84) 54%, rgba(7, 18, 37, 0.9))', color: '#fff7d6', border: '1px solid rgba(255, 235, 160, 0.26)', boxShadow: '0 32px 96px rgba(0, 0, 0, 0.52), 0 0 54px rgba(16, 185, 129, 0.2), 0 0 34px rgba(250, 204, 21, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.1)', overflow: 'hidden', position: 'relative', backdropFilter: 'blur(18px) saturate(130%)' }}>
      <style>{`
        .luck-meter { font-family: var(--lpc-body); }
        .luck-meter h2 { font-family: var(--lpc-display); }
      `}</style>
      <div className="experience-brand"><Image src="/BackgroundEraser_20260724_163638777.png" alt="LuckyPickCanada official maple clover logo" width={52} height={52} sizes="52px" quality={90} /><span>LuckyPickCanada.ca</span></div>

      <div className="lucky-meter-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem', alignItems: 'center' }}>
        <div className="lucky-meter-copy">
          <p className="lucky-meter-kicker" style={{ margin: 0, textTransform: 'uppercase', letterSpacing: 2, color: '#facc15', fontWeight: 900 }}>
            Daily Luck Meter
          </p>
          <h2 id="luck-meter-title" className="lucky-meter-title" style={{ margin: '0.4rem 0 0.75rem', fontSize: 'clamp(1.9rem, 5vw, 3.2rem)', lineHeight: 1, letterSpacing: '-0.04em', textShadow: '0 0 24px rgba(250, 204, 21, 0.2)' }}>
            Start your luck meter
          </h2>
          <p className="lucky-meter-description" style={{ margin: 0, lineHeight: 1.6, maxWidth: 560 }}>
            Tap the button once and the meter will reveal your true luck percentage for today.
          </p>

        </div>

        <div className="lucky-meter-stage" style={{ display: 'grid', gap: '0.85rem' }}>
          <div className={`lucky-meter-artwork ${isSpinning ? 'is-spinning' : ''} ${hasStarted ? 'has-result' : ''}`}>
            <Image
              src="/1784931654864.png"
              alt="LuckyPickCanada Lucky Meter"
              width={704}
              height={1524}
              sizes="(max-width: 420px) 100vw, (max-width: 760px) 390px, 470px"
              quality={90}
              priority
              className="lucky-meter-finished-art"
            />
            <button
              type="button"
              onClick={startMeter}
              disabled={isSpinning || hasStarted}
              className="lucky-meter-button-overlay"
              aria-label={isSpinning ? 'Lucky Meter is running' : hasStarted ? `Luck locked in at ${luckLevel} percent` : 'Generate your luck'}
            />
          </div>

          <div className="lucky-meter-result" style={{ padding: '1rem', borderRadius: 20, background: 'linear-gradient(145deg, rgba(2, 8, 23, 0.82), rgba(6, 39, 36, 0.66))', color: '#fff7d6', textAlign: 'center', border: '1px solid rgba(255, 235, 160, 0.26)', boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.08)' }}>
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
