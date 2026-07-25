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
        {/* [Keep your existing dial/header markup here] */}
        
        <div className="lucky-meter-stage">
          {/* [Keep existing meter dial and button code here] */}
        </div>
      </section>

      {/* Integrated Lucky Aura Display */}
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
