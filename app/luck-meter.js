'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import LuckyCardReveal from './lucky-card-reveal';

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
            <p className="lucky-meter-description">Turn the dial to discover your lucky percentage for today. Every result is generated just for fun.</p>
            <div className="lucky-meter-copy-rule"><span /> <i>Maple luck, made for Canada</i> <span /></div>
          </div>

          <div className="lucky-meter-stage">
            <div className={`lucky-meter-dial ${isSpinning ? 'is-spinning' : ''}`}>
              <div className="lucky-meter-dial-stars" />
              <div className="lucky-meter-rings" />
              <div className="lucky-meter-ticks" aria-hidden="true">
                {DIAL_MARKS.map((mark) => <span key={mark} style={{ '--tick-angle': `${MIN_ANGLE + (mark * (MAX_ANGLE - MIN_ANGLE)) / 50}deg` }} className={mark % 5 === 0 ? 'is-major' : ''} />)}
              </div>
              <div className="lucky-meter-labels" aria-hidden="true">
                {DIAL_LABELS.map((label) => <span key={label} style={{ '--label-angle': `${angleForLuck(label)}deg` }}>{label}</span>)}
              </div>
              <div className="lucky-meter-needle" style={{ '--needle-angle': `${needleAngle}deg` }} aria-hidden="true">
                <span className="lucky-meter-needle-shaft" />
                <span className="lucky-meter-needle-tip" />
              </div>
              <div className="lucky-meter-hub"><span /><i /></div>
              <div className="lucky-meter-result-number" aria-live="polite">
                <strong>{isSpinning ? luckLevel : targetLuck ?? '—'}{targetLuck !== null && !isSpinning ? '%' : ''}</strong>
                <span>{isSpinning ? 'reading luck' : targetLuck === null ? 'ready to begin' : 'luck today'}</span>
              </div>
              <span className="lucky-meter-maple lucky-meter-maple-top">✦</span>
              <span className="lucky-meter-maple lucky-meter-maple-left">✦</span>
              <span className="lucky-meter-maple lucky-meter-maple-right">✦</span>
            </div>

            <button type="button" onClick={startMeter} disabled={isSpinning || hasSpun} className="lucky-meter-button" aria-label={isSpinning ? 'Lucky Meter is spinning' : hasSpun ? 'Lucky Meter result generated for this page session' : 'Generate your luck'}>
              <span>{isSpinning ? 'Reading the stars...' : hasSpun ? 'Luck Revealed' : 'Generate Your Luck'}</span>
            </button>
            <p role="status" className="lucky-meter-status">
              {isSpinning ? 'Your needle is finding today’s number.' : targetLuck === null ? 'Tap to reveal your luck percentage.' : `Your luck is locked in at ${targetLuck}%.`}
            </p>
          </div>
        </div>
      </section>

      {targetLuck !== null && !isSpinning ? <LuckyCardReveal luckScore={targetLuck} /> : null}
    </>
  );
}
