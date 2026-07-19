'use client';

import { useState } from 'react';

const cardBackImage = {
  src: '/card-back.png',
  alt: 'Gold clover LuckyPickCanada card back',
};

const luckyCardImages = [
  {
    title: 'Ace of Spades',
    name: 'Ace of Spades lucky card',
    src: '/ace-spades.png',
    message: 'A powerful symbol of confidence, success, and taking your next lucky step.',
  },
  {
    title: 'Joker Luck',
    name: 'Joker lucky card',
    src: '/joker.png',
    message: 'Unexpected luck can appear when you least expect it.',
  },
  {
    title: 'Clover Fortune',
    name: 'Four-leaf clover lucky card',
    src: '/lucky-clover.png',
    message: 'A little extra luck is heading your way. Keep your eyes open for good moments.',
  },
  {
    title: 'Golden Horseshoe',
    name: 'Lucky horseshoe card',
    src: '/horseshoe.png',
    message: 'Good fortune is circling back toward you.',
  },
  {
    title: "Rabbit's Foot",
    name: "Rabbit's foot lucky card",
    src: '/rabbits-foot.png',
    message: 'A classic charm brings a gentle boost of luck to your path.',
  },
  {
    title: 'Lucky Fortune',
    name: 'Lucky fortune card',
    src: '/fortune-card.png',
    message: 'Your next bright moment is closer than it feels.',
  },
];

const sparklePositions = [
  { star: '✦', top: '3%', left: '18%', size: '1.05rem', delay: '0s' },
  { star: '✧', top: '16%', left: '76%', size: '1.25rem', delay: '0.2s' },
  { star: '✶', top: '42%', left: '7%', size: '1rem', delay: '0.45s' },
  { star: '✷', top: '70%', left: '82%', size: '1.3rem', delay: '0.7s' },
  { star: '✦', top: '86%', left: '26%', size: '0.9rem', delay: '0.95s' },
  { star: '✧', top: '28%', left: '89%', size: '0.95rem', delay: '1.15s' },
  { star: '✺', top: '60%', left: '16%', size: '1.15rem', delay: '1.35s' },
];

function getRandomIndex(length) {
  if (typeof window !== 'undefined' && window.crypto?.getRandomValues) {
    const values = new Uint32Array(1);
    window.crypto.getRandomValues(values);
    return values[0] % length;
  }

  return Math.floor(Math.random() * length);
}

function getLastCardIndex() {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const storedIndex = Number(window.localStorage.getItem('lastLuckyCardIndex'));
    return Number.isInteger(storedIndex) ? storedIndex : null;
  } catch {
    return null;
  }
}

function pickRandomLuckyCard() {
  const cardCount = luckyCardImages.length;
  const lastIndex = getLastCardIndex();
  let nextIndex = getRandomIndex(cardCount);

  if (cardCount > 1 && lastIndex !== null && nextIndex === lastIndex) {
    nextIndex = (nextIndex + 1 + getRandomIndex(cardCount - 1)) % cardCount;
  }

  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem('lastLuckyCardIndex', String(nextIndex));
    } catch {
      // The reveal still works if browser storage is unavailable.
    }
  }

  return luckyCardImages[nextIndex];
}

export default function LuckyCardReveal({ luckScore }) {
  const [revealState, setRevealState] = useState('closed');
  const [selectedCard, setSelectedCard] = useState(null);
  const isRevealing = revealState === 'revealing';
  const isRevealed = revealState === 'revealed';
  const visibleImage = isRevealed && selectedCard ? selectedCard : cardBackImage;

  function revealCard() {
    if (revealState !== 'closed') {
      return;
    }

    const nextCard = pickRandomLuckyCard();
    setSelectedCard(nextCard);
    setRevealState('revealing');
    window.setTimeout(() => setRevealState('revealed'), 850);
  }

  return (
    <section aria-labelledby="lucky-card-title" style={{ marginTop: '1.25rem', padding: 'clamp(1.25rem, 3vw, 1.8rem)', borderRadius: 30, background: 'radial-gradient(circle at 16% 18%, rgba(250, 204, 21, 0.32), transparent 26%), radial-gradient(circle at 84% 10%, rgba(16, 185, 129, 0.24), transparent 22%), linear-gradient(145deg, rgba(20, 11, 3, 0.94), rgba(75, 46, 8, 0.82) 42%, rgba(5, 13, 24, 0.9))', color: '#fff7d6', border: '1px solid rgba(255, 235, 160, 0.34)', boxShadow: '0 28px 84px rgba(0, 0, 0, 0.44), 0 0 46px rgba(250, 204, 21, 0.22), inset 0 1px 0 rgba(255, 255, 255, 0.09)', overflow: 'hidden', textAlign: 'center', position: 'relative', backdropFilter: 'blur(16px)' }}>
      <style>{`
        @keyframes lucky-card-shake {
          0%, 100% { transform: rotate(0deg) translate(0, 0); }
          14% { transform: rotate(-2.5deg) translate(-2px, -1px); }
          28% { transform: rotate(2.5deg) translate(2px, 1px); }
          42% { transform: rotate(-2deg) translate(-1px, 0); }
          56% { transform: rotate(2deg) translate(1px, -1px); }
          70% { transform: rotate(-1deg) translate(-1px, 1px); }
        }

        @keyframes lucky-card-glow {
          0%, 100% { filter: drop-shadow(0 0 18px rgba(250, 204, 21, 0.45)); }
          50% { filter: drop-shadow(0 0 34px rgba(255, 247, 214, 0.72)); }
        }

        @keyframes lucky-card-twinkle {
          0%, 100% { opacity: 0.2; transform: scale(0.62) rotate(0deg); }
          45% { opacity: 1; transform: scale(1.28) rotate(22deg); }
        }

        @keyframes lucky-card-pop {
          from { opacity: 0.4; transform: scale(0.96); }
          to { opacity: 1; transform: scale(1); }
        }

        .lucky-card-button { transition: transform 220ms ease, box-shadow 220ms ease, filter 220ms ease; }
        .lucky-card-button:not(:disabled):hover { transform: translateY(-4px) rotate(-1deg); filter: saturate(1.08); box-shadow: 0 22px 48px rgba(0, 0, 0, 0.36), 0 0 42px rgba(250, 204, 21, 0.38) !important; }
      `}</style>

      <div aria-hidden="true" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        {(isRevealing || isRevealed ? sparklePositions : sparklePositions.slice(0, 3)).map((sparkle, index) => (
          <span key={`${sparkle.star}-${index}`} style={{ position: 'absolute', top: sparkle.top, left: sparkle.left, color: index % 2 ? '#fff7d6' : '#facc15', fontSize: sparkle.size, animation: `lucky-card-twinkle ${1.6 + index * 0.14}s ease-in-out infinite`, animationDelay: sparkle.delay, textShadow: '0 0 16px rgba(250, 204, 21, 0.82)' }}>
            {sparkle.star}
          </span>
        ))}
      </div>

      <p style={{ margin: 0, textTransform: 'uppercase', letterSpacing: 2, color: '#fde68a', fontWeight: 900 }}>
        One Special Lucky Card Reveal
      </p>
      <h3 id="lucky-card-title" style={{ margin: '0.5rem 0 0.4rem', fontSize: 'clamp(1.8rem, 5vw, 3rem)', lineHeight: 1 }}>
        Your Luck Score: {luckScore}%
      </h3>
      <p style={{ margin: '0 auto 1.4rem', maxWidth: 560, lineHeight: 1.6, fontWeight: 800, color: '#fff7d6' }}>
        Tap the gold card once. It will shake, sparkle, then reveal one random lucky card image.
      </p>

      <div style={{ position: 'relative', minHeight: 330, display: 'grid', placeItems: 'center' }}>
        <button
          type="button"
          onClick={revealCard}
          disabled={revealState !== 'closed'}
          aria-label={isRevealed && selectedCard ? `Revealed lucky card: ${selectedCard.name}` : 'Reveal your one special lucky card'}
          className="lucky-card-button" style={{ position: 'relative', width: 210, height: 296, border: '1px solid rgba(255, 235, 160, 0.36)', borderRadius: 30, background: 'linear-gradient(145deg, rgba(255, 235, 160, 0.12), rgba(16, 185, 129, 0.08))', padding: 4, cursor: revealState === 'closed' ? 'pointer' : 'default', boxShadow: '0 20px 40px rgba(0, 0, 0, 0.36), 0 0 32px rgba(250, 204, 21, 0.18)', animation: isRevealing ? 'lucky-card-shake 0.72s ease-in-out' : isRevealed ? 'lucky-card-pop 0.28s ease-out' : 'lucky-card-glow 2.8s ease-in-out infinite' }}
        >
          <img
            key={visibleImage.src}
            src={visibleImage.src}
            alt={visibleImage.alt || visibleImage.name}
            width="210"
            height="296"
            style={{ width: '100%', height: '100%', display: 'block', objectFit: 'cover', borderRadius: 26, boxShadow: 'inset 0 0 0 1px rgba(255, 235, 160, 0.18)' }}
          />
        </button>
      </div>

      {isRevealed && selectedCard ? (
        <p role="status" aria-live="polite" style={{ margin: '1rem auto 0', maxWidth: 560, padding: '0.95rem 1rem', borderRadius: 18, background: 'rgba(2, 6, 23, 0.42)', border: '1px solid rgba(255, 235, 160, 0.28)', color: '#fff7d6', fontSize: '1rem', lineHeight: 1.5, fontWeight: 800 }}>
          <strong>{selectedCard.title}:</strong> {selectedCard.message}
        </p>
      ) : null}
    </section>
  );
}
