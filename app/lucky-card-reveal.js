import React, { useState, useEffect } from 'react';

const CARD_DATA = [
  { id: 'golden-maple-leaf-clover', name: 'Golden Maple Leaf Clover', imagePath: '/cards/placeholder-golden-maple-leaf-clover.png', quote: "Nature's rarest treasure is found in your journey today." },
  { id: 'emerald-clover', name: 'Emerald Clover', imagePath: '/cards/placeholder-emerald-clover.png', quote: 'Luck follows those who appreciate the little things.' },
  { id: 'canada-maple', name: 'Canada Maple', imagePath: '/cards/placeholder-canada-maple.png', quote: 'Rooted in strength, growing in grace.' },
  { id: 'gold-treasure', name: 'Gold Treasure', imagePath: '/cards/placeholder-gold-treasure.png', quote: 'Your potential is the greatest wealth you own.' },
  { id: 'horseshoe', name: 'Horseshoe', imagePath: '/cards/placeholder-horseshoe.png', quote: 'A positive path leads to positive outcomes.' },
  { id: 'rabbit-foot', name: 'Rabbit Foot', imagePath: '/cards/placeholder-rabbit-foot.png', quote: 'Fortune favors the kind and the bold.' },
  { id: 'fortune', name: 'Fortune', imagePath: '/cards/placeholder-fortune.png', quote: 'Great things are blooming just for you.' },
  { id: 'ace-of-spades', name: 'Ace of Spades', imagePath: '/cards/placeholder-ace-of-spades.png', quote: 'You have the winning spirit to tackle any challenge.' },
  { id: 'joker', name: 'Joker', imagePath: '/cards/placeholder-joker.png', quote: 'A little laughter is the secret ingredient to a lucky day.' },
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
    const randomIndex = Math.floor(Math.random() * CARD_DATA.length);
    setSelectedCard(CARD_DATA[randomIndex]);
    setFlipped(true);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleFlip();
    }
  };

  return (
    <div style={styles.container}>
      <div
        onClick={handleFlip}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        role="button"
        aria-label="Daily card, press Enter or Space to reveal"
        className={`card-3d ${!flipped ? 'pulse-card' : ''}`}
        style={{
          ...styles.card,
          transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
          cursor: flipped ? 'default' : 'pointer',
        }}
      >
        {/* Card Back */}
        <div style={{ ...styles.cardFace, ...styles.cardBack }}>
          <div style={styles.cardBackIcon}>🍁</div>
          <div style={styles.cardBackText}>Tap or Press Enter</div>
        </div>

        {/* Card Front */}
        <div style={{ ...styles.cardFace, ...styles.cardFront }}>
          {selectedCard && (
            <div
              style={{
                ...styles.content,
                opacity: contentVisible ? 1 : 0,
                transition: 'opacity 200ms ease-out',
              }}
              aria-live="polite"
            >
              <h3 style={styles.title}>{selectedCard.name}</h3>
              <div style={styles.imageContainer}>
                <img 
                  src={selectedCard.imagePath} 
                  alt={selectedCard.name} 
                  style={styles.image}
                  onError={(e) => {
                    e.target.style.display = 'none';
                    if (e.target.nextSibling) {
                      e.target.nextSibling.style.display = 'flex';
                    }
                  }}
                />
                <div style={styles.imageFallback}>🍁</div>
              </div>
              <p style={styles.quote}>"{selectedCard.quote}"</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: { perspective: '1000px', width: '300px', height: '420px', margin: '20px auto' },
  card: { width: '100%', height: '100%', transition: 'transform 0.6s ease-in-out', transformStyle: 'preserve-3d', position: 'relative', borderRadius: '16px' },
  cardFace: { position: 'absolute', width: '100%', height: '100%', backfaceVisibility: 'hidden', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderRadius: '16px', border: '3px solid #FFB300', boxSizing: 'border-box' },
  cardBack: { backgroundColor: '#00205B', color: '#FFB300', gap: '12px' },
  cardBackIcon: { fontSize: '3.5rem' },
  cardBackText: { fontSize: '1.1rem', fontWeight: 'bold' },
  cardFront: { backgroundColor: '#FFFFFF', color: '#00205B', transform: 'rotateY(180deg)', padding: '24px', textAlign: 'center' },
  content: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', height: '100%', justifyContent: 'space-between' },
  title: { margin: '0', fontSize: '1.25rem', color: '#00205B', fontWeight: '700' },
  imageContainer: { width: '120px', height: '120px', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' },
  image: { width: '100%', height: '100%', objectFit: 'contain', borderRadius: '12px' },
  imageFallback: { display: 'none', width: '120px', height: '120px', backgroundColor: '#F4F6F8', border: '2px dashed #CBD5E1', borderRadius: '12px', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem' },
  quote: { fontStyle: 'italic', fontWeight: '500', fontSize: '0.95rem', margin: '0', color: '#334155' }
};
