'use client';

import { useState } from 'react';

const cardBackImage = {
  src: '/lucky-card-back.svg',
  alt: 'Gold mystery LuckyPickCanada card back',
};

const luckyCardFrontImages = [
  {
    title: 'Ace of Spades',
    name: 'Ace of Spades lucky card',
    src: '/lucky-card-ace-spades.svg',
    accent: '#facc15',
    message: 'A powerful symbol of confidence, success, and taking your next lucky step.',
    faceBackground: 'linear-gradient(145deg, #020617 0%, #111827 58%, #b7791f 100%)',
  },
  {
    title: 'Joker Luck',
    name: 'Joker lucky card',
    src: '/lucky-card-joker.svg',
    accent: '#fb7185',
    message: 'Unexpected luck can appear when you least expect it.',
    faceBackground: 'linear-gradient(145deg, #581c87 0%, #7c2d12 54%, #fef3c7 100%)',
  },
  {
    title: 'Clover Fortune',
    name: 'Four-leaf clover lucky card',
    src: '/lucky-card-clover.svg',
    accent: '#86efac',
    message: 'A little extra luck is heading your way. Keep your eyes open for good moments.',
    faceBackground: 'linear-gradient(145deg, #052e16 0%, #166534 50%, #fef3c7 100%)',
  },
  {
    title: 'Golden Horseshoe',
    name: 'Lucky horseshoe card',
    src: '/lucky-card-horseshoe.svg',
    accent: '#facc15',
    message: 'Good fortune is circling back toward you.',
    faceBackground: 'linear-gradient(145deg, #78350f 0%, #b7791f 50%, #fff7d6 100%)',
  },
  {
    title: "Rabbit's Foot",
    name: "Rabbit's foot lucky card",
    src: '/lucky-card-rabbit-foot.svg',
    accent: '#cbd5e1',
    message: 'A classic charm brings a gentle boost of luck to your path.',
    faceBackground: 'linear-gradient(145deg, #0f172a 0%, #475569 55%, #fef3c7 100%)',
  },
  {
    title: 'Lucky Fortune',
    name: 'Lucky fortune message card',
    src: '/lucky-card-fortune.svg',
    accent: '#fde68a',
    message: 'Your next bright moment is closer than it feels.',
    faceBackground: 'linear-gradient(145deg, #1e1b4b 0%, #854d0e 48%, #facc15 100%)',
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
  { star: '✦', top: '9%', left: '48%', size: '0.82rem', delay: '1.55s' },
];

function pickRandomLuckyCard() {
  return luckyCardFrontImages[Math.floor(Math.random() * luckyCardFrontImages.length)];
}

function CardBackImage() {
  return (
    <img
      src={cardBackImage.src}
      alt={cardBackImage.alt}
      width="210"
      height="296"
      style={{ width: '100%', height: '100%', display: 'block', objectFit: 'cover', borderRadius: 28 }}
    />
  );
}

function CardFrontImage({ card }) {
  return (
    <img
      src={card.src}
      alt={card.name}
      width="210"
      height="296"
      style={{ width: '100%', height: '100%', display: 'block', objectFit: 'cover', borderRadius: 28 }}
    />
  );
}

export default function LuckyCardReveal({ luckScore }) {
  const [isRevealing, setIsRevealing] = useState(false);
  const [isRevealed, setIsRevealed] = useState(false);
  const [selectedCard, setSelectedCard] = useState(null);
  const cardFrontImage = selectedCard || luckyCardFrontImages[0];

  function revealCard() {
    if (isRevealing || isRevealed) {
      return;
    }

    setSelectedCard(pickRandomLuckyCard());
    setIsRevealing(true);
    window.setTimeout(() => {
      setIsRevealed(true);
      setIsRevealing(false);
    }, 900);
  }

  return (
    <section aria-labelledby="lucky-card-title" style={{ marginTop: '1.25rem', padding: '1.5rem', borderRadius: 28, background: 'radial-gradient(circle at 16% 18%, rgba(250, 204, 21, 0.3), transparent 24%), radial-gradient(circle at 84% 10%, rgba(255, 255, 255, 0.22), transparent 18%), linear-gradient(145deg, rgba(48, 27, 6, 0.92), rgba(92, 54, 8, 0.8) 48%, rgba(12, 20, 38, 0.88))', color: '#fff7d6', border: '1px solid rgba(255, 235, 160, 0.28)', boxShadow: '0 24px 70px rgba(0, 0, 0, 0.36), 0 0 42px rgba(250, 204, 21, 0.18)', overflow: 'hidden', textAlign: 'center', position: 'relative' }}>
      <style>{`
        @keyframes lucky-card-glow {
          0%, 100% { filter: drop-shadow(0 0 18px rgba(250, 204, 21, 0.45)); }
          50% { filter: drop-shadow(0 0 34px rgba(255, 247, 214, 0.72)); }
        }

        @keyframes lucky-card-shake {
          0%, 100% { transform: rotate(0deg) translate(0, 0); }
          14% { transform: rotate(-2.5deg) translate(-2px, -1px); }
          28% { transform: rotate(2.5deg) translate(2px, 1px); }
          42% { transform: rotate(-2deg) translate(-1px, 0); }
          56% { transform: rotate(2deg) translate(1px, -1px); }
          70% { transform: rotate(-1deg) translate(-1px, 1px); }
        }

        @keyframes lucky-card-twinkle {
          0%, 100% { opacity: 0.2; transform: scale(0.62) rotate(0deg); }
          45% { opacity: 1; transform: scale(1.28) rotate(22deg); }
        }

        @keyframes lucky-card-burst {
          from { opacity: 0; transform: translate(-50%, -50%) scale(0.25); }
          54% { opacity: 1; }
          to { opacity: 0; transform: translate(-50%, -50%) scale(1.45); }
        }
      `}</style>

      <div aria-hidden="true" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        {sparklePositions.map((sparkle, index) => (
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
        Tap the gold mystery deck once. A rare lucky card image will choose you.
      </p>

      <div style={{ position: 'relative', minHeight: 330, display: 'grid', placeItems: 'center', perspective: 1200 }}>
        {isRevealing || isRevealed ? (
          <div aria-hidden="true" style={{ position: 'absolute', top: '50%', left: '50%', width: 330, height: 330, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255, 247, 214, 0.74), rgba(250, 204, 21, 0.34) 38%, rgba(134, 239, 172, 0.12) 56%, transparent 72%)', animation: isRevealing ? 'lucky-card-burst 0.9s ease forwards' : 'none', opacity: isRevealed ? 0.3 : undefined, pointerEvents: 'none' }} />
        ) : null}

        <button
          type="button"
          onClick={revealCard}
          disabled={isRevealed}
          aria-label={isRevealed ? `Revealed lucky card: ${cardFrontImage.name}` : 'Reveal your one special lucky card'}
          style={{ position: 'relative', display: 'block', width: 210, height: 296, border: 0, borderRadius: 28, background: 'transparent', padding: 0, cursor: isRevealed ? 'default' : 'pointer', transformStyle: 'preserve-3d', transition: 'transform 760ms cubic-bezier(.18,.82,.24,1)', transform: isRevealed ? 'rotateY(180deg)' : 'rotateY(0deg)', animation: isRevealing ? 'lucky-card-shake 0.72s ease-in-out' : 'lucky-card-glow 2.8s ease-in-out infinite' }}
        >
          <span aria-hidden="true" style={{ position: 'absolute', inset: 0, display: 'block', borderRadius: 28, backfaceVisibility: 'hidden', boxShadow: '0 18px 34px rgba(0, 0, 0, 0.3)', overflow: 'hidden' }}>
            <CardBackImage />
          </span>

          <span style={{ position: 'absolute', inset: 0, display: 'block', borderRadius: 28, backfaceVisibility: 'hidden', transform: 'rotateY(180deg)', background: cardFrontImage.faceBackground, boxShadow: `0 0 34px ${cardFrontImage.accent}66, 0 18px 34px rgba(0, 0, 0, 0.3)`, overflow: 'hidden' }}>
            <CardFrontImage card={cardFrontImage} />
          </span>
        </button>
      </div>
    </section>
  );
}
