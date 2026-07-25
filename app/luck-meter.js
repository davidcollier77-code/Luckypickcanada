'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';

const MIN_ANGLE = -140;
const MAX_ANGLE = 140;
const DIAL_MARKS = Array.from({ length: 51 }, (_, index) => index);
const DIAL_LABELS = Array.from({ length: 11 }, (_, index) => index * 10);

function getTodaysLuck() {
  return Math.floor(Math.random() * 101);
}

function angleForLuck(luck) {
  return MIN_ANGLE + ((MAX_ANGLE - MIN_ANGLE) * luck) / 100;
}

export default function LuckMeter() {
  const [luckLevel, setLuckLevel] = useState(0);
  const [needleAngle, setNeedleAngle] = useState(MIN_ANGLE);
  const [targetLuck, setTargetLuck] = useState(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [hasSpun, setHasSpun] = useState(false);
  const frameRef = useRef(null);

  useEffect(() => () => frameRef.current && cancelAnimationFrame(frameRef.current), []);

  function startMeter() {
    if (isSpinning || hasSpun) return;

    const target = getTodaysLuck();
    const duration = 2600;
    const start = performance.now();
    const startingAngle = targetLuck === null ? MIN_ANGLE : angleForLuck(luckLevel);
    const finalAngle = angleForLuck(target);
    const travel = finalAngle - startingAngle + 1440;

    setTargetLuck(null);
    setIsSpinning(true);

    function tick(now) {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 4);
      const wobble = Math.sin(progress * Math.PI * 11) * (1 - progress) * 14;
      const currentAngle = startingAngle + travel * eased + wobble;
      const displayedLuck = Math.round(target * eased);

      setNeedleAngle(currentAngle);
      setLuckLevel(Math.max(0, Math.min(100, displayedLuck)));

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(tick);
      } else {
        setLuckLevel(target);
        setNeedleAngle(finalAngle);
        setTargetLuck(target);
        setHasSpun(true);
        setIsSpinning(false);
      }
    }

    frameRef.current = requestAnimationFrame(tick);
  }

  return (
    <>
      <section aria-labelledby="luck-meter-title" className="lucky-meter premium-surface lucky-meter-shell">
        <div className="lucky-meter-aura lucky-meter-aura-one" />
        <div className="lucky-meter-aura lucky-meter-aura-two" />
        <div className="experience-brand">
          <Image src="/BackgroundEraser_20260724_163638777.png" alt="LuckyPickCanada official maple clover logo" width={52} height={52} sizes="52px" quality={90} />
          <span>LuckyPickCanada.ca</span>
        </div>

        <div className="lucky-meter-grid">
          <div className="lucky-meter-copy">
            <p className="lucky-meter-kicker">Your personalized luck generator</p>
            <h2 id="luck-meter-title" className="lucky-meter-title">Lucky Meter</h2>
            <p className="lucky-meter-description">Turn the dial to discover your lucky percentage for today.</p>
          </div>

          <div className="lucky-meter-stage">
            <div className={`lucky-meter-dial ${isSpinning ? 'is-spinning' : ''}`}>
              <div className="lucky-meter-ticks" aria-hidden="true">
                {DIAL_MARKS.map((mark) => <span key={mark} style={{ '--tick-angle': `${MIN_ANGLE + (mark * (MAX_ANGLE - MIN_ANGLE)) / 50}deg` }} className={mark % 5 === 0 ? 'is-major' : ''} />)}
              </div>
              <div className="lucky-meter-needle" style={{ '--needle-angle': `${needleAngle}deg` }} aria-hidden="true">
                <span className="lucky-meter-needle-shaft" />
                <span className="lucky-meter-needle-tip" />
              </div>
              <div className="lucky-meter-result-number" aria-live="polite">
                <strong>{isSpinning ? luckLevel : targetLuck ?? '—'}</strong>
                <span>{isSpinning ? 'reading' : targetLuck === null ? 'ready' : 'luck'}</span>
              </div>
            </div>

            <button type="button" onClick={startMeter} disabled={isSpinning || hasSpun} className="lucky-meter-button">
              <span>{isSpinning ? 'Reading...' : hasSpun ? 'Luck Revealed' : 'Generate Your Luck'}</span>
            </button>
          </div>
        </div>
      </section>

      {/* The Lucky Aura Reveal */}
      {targetLuck !== null && !isSpinning && (
        <div className="lucky-aura-display">
          <div className="lucky-aura-arc" style={{ '--fill-percentage': `${targetLuck}%` }} />
          <div className="lucky-aura-glow" />
          <div className="lucky-aura-content">
            <strong className="lucky-aura-percentage">{targetLuck}%</strong>
            <span className="lucky-aura-label">Luck Today</span>
          </div>
          <p className="lucky-aura-affirmation">
            {targetLuck > 80 ? "The stars are perfectly aligned for you." : "Keep believing in possibilities—your next lucky moment is close."}
          </p>
        </div>
      )}
    </>
  );
}
