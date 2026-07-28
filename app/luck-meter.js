'use client';

import { useEffect, useState } from 'react';

const labels = [0, 20, 40, 60, 80, 100];

export default function LuckyMeter() {
  const [luckLevel, setLuckLevel] = useState(0);
  const [displayNumber, setDisplayNumber] = useState('—');
  const [isAnimating, setIsAnimating] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);
  const [comment, setComment] = useState('The aurora is waiting for your signal.');

  const getComment = (value) => {
    if (value < 40) return 'A quiet glow is still a glow. Keep your heart open today.';
    if (value < 75) return 'A steady current of good energy is moving your way.';
    return 'Maximum Canadian luck: the aurora is shining bright for you.';
  };

  useEffect(() => {
    if (!isAnimating) return undefined;
    const interval = window.setInterval(() => {
      setDisplayNumber(String(Math.floor(Math.random() * 90 + 10)));
    }, 70);
    return () => window.clearInterval(interval);
  }, [isAnimating]);

  const handleTestLuck = () => {
    if (isAnimating || hasGenerated) return;
    setIsAnimating(true);
    setComment('Reading the northern lights…');
    const finalLuck = Math.floor(Math.random() * 90) + 10;
    window.setTimeout(() => {
      setLuckLevel(finalLuck);
      setDisplayNumber(`${finalLuck}%`);
      setComment(getComment(finalLuck));
      setIsAnimating(false);
      setHasGenerated(true);
    }, 2500);
  };

  const needleAngle = -130 + (luckLevel / 100) * 260;

  return (
    <div className="lucky-meter-shell">
      <div className="lucky-meter-aura lucky-meter-aura-one" />
      <div className="lucky-meter-aura lucky-meter-aura-two" />
      <div className="lucky-meter-grid">
        <div className="lucky-meter-copy">
          <p className="lucky-meter-kicker">The Aurora Instrument</p>
          <h3 className="lucky-meter-title">Lucky<br />Meter</h3>
          <p className="lucky-meter-description">Take a breath, make a wish, and let the dial find a playful reading for your day.</p>
          <div className="lucky-meter-copy-rule"><span /> <i>One reading each visit</i></div>
        </div>
        <div className="lucky-meter-stage">
          <div className={`lucky-meter-dial${isAnimating ? ' is-spinning' : ''}`}>
            <div className="lucky-meter-dial-stars" />
            <div className="lucky-meter-rings" />
            <div className="lucky-meter-ticks" aria-hidden="true">
              {Array.from({ length: 21 }, (_, index) => <span key={index} className={index % 4 === 0 ? 'is-major' : ''} style={{ '--tick-angle': `${-130 + index * 13}deg` }} />)}
            </div>
            <div className="lucky-meter-labels" aria-hidden="true">
              {labels.map((label) => <span key={label} style={{ '--label-angle': `${-130 + (label / 100) * 260}deg` }}>{label}</span>)}
            </div>
            <div className="lucky-meter-needle" style={{ '--needle-angle': `${isAnimating ? -130 + (Number(displayNumber) || 0) / 100 * 260 : needleAngle}deg` }}>
              <div className="lucky-meter-needle-shaft" />
              <div className="lucky-meter-needle-tip" />
            </div>
            <div className="lucky-meter-hub"><span /><i /></div>
            <span className="lucky-meter-maple lucky-meter-maple-top">✦</span>
            <span className="lucky-meter-maple lucky-meter-maple-left">🍁</span>
            <span className="lucky-meter-maple lucky-meter-maple-right">🍁</span>
            <div className="lucky-meter-result-number"><strong>{displayNumber}</strong><span>{hasGenerated ? 'Today’s reading' : 'Your signal'}</span></div>
          </div>
          <button type="button" className="lucky-meter-button" onClick={handleTestLuck} disabled={isAnimating || hasGenerated}>
            {isAnimating ? 'Finding your signal…' : hasGenerated ? 'Your luck has arrived' : 'Read my lucky energy'}
          </button>
          <p className="lucky-meter-status" aria-live="polite">{comment}</p>
        </div>
      </div>
    </div>
  );
}
