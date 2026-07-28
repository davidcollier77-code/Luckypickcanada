'use client';

import { useEffect, useState } from 'react';

const CARD_DATA = [
  { id: 'logo-official', name: 'Lucky Pick Canada', imagePath: '/logo-official.svg', quote: 'Your positive energy creates your own luck every day.' },
  { id: 'maple-clover', name: 'Maple Clover', imagePath: '/logo-maple-clover-20260719.svg', quote: 'Luck follows those who appreciate the little things.' },
];

export default function LuckyCardReveal() {
  const [flipped, setFlipped] = useState(false);
  const [selectedCard, setSelectedCard] = useState(null);
  const [contentVisible, setContentVisible] = useState(false);

  useEffect(() => {
    if (!flipped) return undefined;
    const timer = window.setTimeout(() => setContentVisible(true), 350);
    return () => window.clearTimeout(timer);
  }, [flipped]);

  const handleFlip = () => {
    if (flipped) return;
    setSelectedCard(CARD_DATA[Math.floor(Math.random() * CARD_DATA.length)]);
    setFlipped(true);
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleFlip();
    }
  };

  return (
    <div className="lucky-card-reveal-shell">
      <div
        className={`lucky-card-reveal${flipped ? ' is-flipped' : ''}`}
        onClick={handleFlip}
        onKeyDown={handleKeyDown}
        role="button"
        aria-label={flipped ? `Revealed card: ${selectedCard?.name}` : 'Reveal your lucky card'}
        tabIndex={0}
      >
        <div className="lucky-card-face lucky-card-back-face">
          <span className="lucky-card-corner">LPC</span>
          <img src="/logo-official.svg" alt="" />
          <p>Tap to reveal</p>
          <span className="lucky-card-ornament">✦</span>
        </div>
        <div className="lucky-card-face lucky-card-front-face">
          {selectedCard && (
            <div className={`lucky-card-content${contentVisible ? ' is-visible' : ''}`}>
              <p className="lucky-card-eyebrow">Today’s lucky sign</p>
              <img src={selectedCard.imagePath} alt={selectedCard.name} />
              <h3>{selectedCard.name}</h3>
              <p>“{selectedCard.quote}”</p>
            </div>
          )}
        </div>
      </div>
      <p className="lucky-card-instruction">{flipped ? 'Your message has been revealed.' : 'Choose the card when you are ready.'}</p>
    </div>
  );
}
