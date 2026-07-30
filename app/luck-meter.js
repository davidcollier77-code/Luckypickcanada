'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';

export default function LuckyMeter() {
  const [displayNumber, setDisplayNumber] = useState('—');
  const [isAnimating, setIsAnimating] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);
  const [comment, setComment] = useState('The aurora is waiting for your signal.');
  const [resultTier, setResultTier] = useState('idle');

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

  const getResultTier = (value) => (value < 40 ? 'low' : value < 75 ? 'medium' : 'high');

  const handleTestLuck = () => {
    if (isAnimating || hasGenerated) return;
    setIsAnimating(true);
    setResultTier('generating');
    setComment('Reading the northern lights…');
    const finalLuck = Math.floor(Math.random() * 90) + 10;
    window.setTimeout(() => {
      setDisplayNumber(`${finalLuck}%`);
      setComment(getComment(finalLuck));
      setResultTier(getResultTier(finalLuck));
      setIsAnimating(false);
      setHasGenerated(true);
    }, 2500);
  };


  return (
    <div className={`lucky-meter-shell lucky-meter-tier-${resultTier}`}>
      <div className="lucky-meter-vortex" aria-hidden="true" />
      <div className="lucky-meter-aura lucky-meter-aura-one" aria-hidden="true" />
      <div className="lucky-meter-aura lucky-meter-aura-two" aria-hidden="true" />
      <div className="lucky-meter-grid">
        <div className="lucky-meter-copy">
          <p className="lucky-meter-kicker">The Aurora Instrument</p>
          <h3 className="lucky-meter-title">Lucky<br />Meter</h3>
          <p className="lucky-meter-description">Take a breath, make a wish, and let the dial find a playful reading for your day.</p>
          <div className="lucky-meter-copy-rule"><span /> <i>One reading each visit</i></div>
        </div>
        <div className="lucky-meter-stage">
          <div
            className={`lucky-meter-dial${isAnimating ? ' is-spinning' : ''}`}
            role="button"
            tabIndex={hasGenerated ? -1 : 0}
            aria-disabled={isAnimating || hasGenerated}
            aria-label="Read my lucky energy"
            onClick={handleTestLuck}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                handleTestLuck();
              }
            }}
          >
            <Image
              src="/1785101753301.png"
              alt="Lucky Pick Canada Lucky Meter"
              width={600}
              height={600}
              sizes="(max-width: 780px) min(100vw - 2rem, 400px), (max-width: 1200px) 800px, 1600px"
              priority
            />
            <div className="lucky-meter-glass-vortex" aria-hidden="true" />
            <output className="lucky-meter-result-number" aria-live="polite" aria-label="Lucky score">{displayNumber}</output>
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
