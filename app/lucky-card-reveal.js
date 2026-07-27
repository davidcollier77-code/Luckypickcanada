'use client';
import React, { useState, useEffect } from 'react';

const CARD_DATA = [
  { id: 'logo-official', name: 'Lucky Pick Canada', imagePath: '/logo-official.svg', quote: "Your positive energy creates your own luck every day." },
  { id: 'maple-clover', name: 'Maple Clover', imagePath: '/logo-maple-clover-20260719.svg', quote: 'Luck follows those who appreciate the little things.' },
];

export default function LuckyCardReveal() {
  const [flipped, setFlipped] = useState(false);
  const [selectedCard, setSelectedCard] = useState(null);
  const [contentVisible, setContentVisible] = useState(false);

  useEffect(() => {
    if (!flipped) return;
    const timer = window.setTimeout(() => setContentVisible(true), 350);
    return () => window.clearTimeout(timer);
  }, [flipped]);

  const handleFlip = () => {
    if (flipped) return;
    const randomIndex = Math.floor(Math.random() * CARD_DATA.length);
    setSelectedCard(CARD_DATA[randomIndex]);
    setFlipped(true);
  };

  return (
    <div style={styles.container}>
      <div
        onClick={handleFlip}
        role="button"
        tabIndex={0}
        style={{
          ...styles.card,
          transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
          cursor: flipped ? 'default' : 'pointer',
        }}
      >
        {/* Card Back */}
        <div style={{ ...styles.cardFace, ...styles.cardBack }}>
          <div style={styles.cardBackIcon}>🍁</div>
          <div style={styles.cardBackText}>Tap to Reveal</div>
        </div>

        {/* Card Front */}
        <div style={{ ...styles.cardFace, ...styles.cardFront }}>
          {selectedCard && (
            <div style={{ ...styles.content, opacity: contentVisible ? 1 : 0 }}>
              <h3 style={styles.title}>{selectedCard.name}</h3>
              <img src={selectedCard.imagePath} alt={selectedCard.name} style={styles.image} />
              <p style={styles.quote}>"{selectedCard.quote}"</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const styles = {
  // Mobile responsive container
  container: { perspective: '1000px', width: '100%', maxWidth: '300px', height: '420px', margin: '20px auto' },
  card: { width: '100%', height: '100%', transition: 'transform 0.6s ease-in-out', transformStyle: 'preserve-3d', position: 'relative', borderRadius: '16px' },
  cardFace: { position: 'absolute', width: '100%', height: '100%', backfaceVisibility: 'hidden', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderRadius: '16px', border: '2px solid #fbbf24', boxSizing: 'border-box' }, // Amber-400 border
  cardBack: { backgroundColor: '#0f172a', color: '#fbbf24' }, // Slate-900 bg, Amber-400 text
  cardFront: { backgroundColor: '#020617', color: '#f1f5f9', transform: 'rotateY(180deg)', padding: '20px', textAlign: 'center' }, // Slate-950 bg, Slate-100 text
  content: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', transition: 'opacity 300ms' },
  title: { margin: '0', fontSize: '1.25rem', color: '#fbbf24' },
  image: { width: '80px', height: '80px', objectFit: 'contain' },
  quote: { fontStyle: 'italic', fontSize: '0.9rem', color: '#cbd5e1' }
};
