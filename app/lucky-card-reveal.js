'use client';

import { useMemo, useState } from 'react';

const luckyCards = [
  { title: 'Ace of Spades', symbol: '♠️', message: 'Sharp instincts are guiding your luck today.' },
  { title: 'Lucky Horseshoe', symbol: '🐴', message: 'Good fortune is turning toward you.' },
  { title: 'Four-Leaf Clover', symbol: '🍀', message: 'A rare lucky moment is ready to bloom.' },
  { title: "Lucky Rabbit's Foot", symbol: '🐇', message: 'Quick chances and happy surprises are close by.' },
  { title: 'Golden Opportunity', symbol: '✦', message: 'A bright opportunity is opening in your favor.' },
  { title: 'Lucky Star Message', symbol: '✧', message: 'A little magic is following your next choice.' },
  { title: 'Wish Spark', symbol: '✶', message: 'Your wish has extra sparkle behind it today.' },
  { title: 'Good News Glow', symbol: '✷', message: 'Good news is moving closer than you think.' },
];

function getLuckyCard(luckScore) {
  return luckyCards[luckScore % luckyCards.length];
}

export default function LuckyCardReveal({ luckScore }) {
  const [isRevealing, setIsRevealing] = useState(false);
  const [isRevealed, setIsRevealed] = useState(false);
  const luckyCard = useMemo(() => getLuckyCard(luckScore), [luckScore]);

  function revealCard() {
    if (isRevealing || isRevealed) {
      return;
    }

    setIsRevealing(true);
    window.setTimeout(() => {
      setIsRevealed(true);
      setIsRevealing(false);
    }, 850);
  }

  return (
    <section aria-labelledby="lucky-card-title" style={{ marginTop: '1.25rem', padding: '1.5rem', borderRadius: 28, background: 'radial-gradient(circle at 16% 18%, rgba(250, 204, 21, 0.28), transparent 24%), radial-gradient(circle at 84% 10%, rgba(255, 255, 255, 0.2), transparent 18%), linear-gradient(145deg, rgba(48, 27, 6, 0.9), rgba(92, 54, 8, 0.78) 48%, rgba(12, 20, 38, 0.86))', color: '#fff7d6', border: '1px solid rgba(255, 235, 160, 0.28)', boxShadow: '0 24px 70px rgba(0, 0, 0, 0.36), 0 0 42px rgba(250, 204, 21, 0.18)', overflow: 'hidden', textAlign: 'center', position: 'relative' }}>
      <style>{`
        @keyframes lucky-card-glow {
          0%, 100% { filter: drop-shadow(0 0 18px rgba(250, 204, 21, 0.45)); }
          50% { filter: drop-shadow(0 0 34px rgba(255, 247, 214, 0.72)); }
        }

        @keyframes lucky-card-wiggle {
          0%, 100% { transform: rotate(0deg) translateY(0); }
          15% { transform: rotate(-4deg) translateY(-2px); }
          30% { transform: rotate(4deg) translateY(1px); }
          45% { transform: rotate(-3deg) translateY(-1px); }
          60% { transform: rotate(3deg) translateY(1px); }
          75% { transform: rotate(-1deg) translateY(0); }
        }

        @keyframes lucky-card-twinkle {
          0%, 100% { opacity: 0.28; transform: scale(0.72) rotate(0deg); }
          50% { opacity: 1; transform: scale(1.2) rotate(16deg); }
        }

        @keyframes lucky-card-burst {
          from { opacity: 0; transform: translate(-50%, -50%) scale(0.35); }
          to { opacity: 1; transform: translate(-50%, -50%) scale(1.2); }
        }
      `}</style>

      <div aria-hidden="true" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        {['✦', '✧', '✶', '✷', '✦', '✧'].map((star, index) => (
          <span key={`${star}-${index}`} style={{ position: 'absolute', top: `${12 + (index % 3) * 24}%`, left: `${10 + index * 15}%`, color: index % 2 ? '#fff7d6' : '#facc15', fontSize: `${1 + index * 0.16}rem`, animation: `lucky-card-twinkle ${1.8 + index * 0.28}s ease-in-out infinite` }}>
            {star}
          </span>
        ))}
      </div>

      <p style={{ margin: 0, textTransform: 'uppercase', letterSpacing: 2, color: '#fde68a', fontWeight: 900 }}>
        Free Lucky Card Reward
      </p>
      <h3 id="lucky-card-title" style={{ margin: '0.5rem 0 0.4rem', fontSize: 'clamp(1.8rem, 5vw, 3rem)', lineHeight: 1 }}>
        Your Luck Score: {luckScore}%
      </h3>
      <p style={{ margin: '0 auto 1.4rem', maxWidth: 560, lineHeight: 1.6, fontWeight: 800, color: '#fff7d6' }}>
        Your Lucky Card is waiting... Tap the deck to reveal!
      </p>

      <div style={{ position: 'relative', minHeight: 252, display: 'grid', placeItems: 'center', perspective: 1200 }}>
        {isRevealing ? (
          <div aria-hidden="true" style={{ position: 'absolute', top: '50%', left: '50%', width: 260, height: 260, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255, 247, 214, 0.76), rgba(250, 204, 21, 0.34) 42%, transparent 70%)', animation: 'lucky-card-burst 0.75s ease forwards', pointerEvents: 'none' }} />
        ) : null}

        <button
          type="button"
          onClick={revealCard}
          disabled={isRevealed}
          aria-label={isRevealed ? `Revealed lucky card: ${luckyCard.title}` : 'Reveal your lucky card'}
          style={{ position: 'relative', display: 'block', width: 164, height: 230, border: 0, borderRadius: 22, background: 'transparent', padding: 0, cursor: isRevealed ? 'default' : 'pointer', transformStyle: 'preserve-3d', transition: 'transform 720ms cubic-bezier(.2,.8,.2,1)', transform: isRevealed ? 'rotateY(180deg)' : 'rotateY(0deg)', animation: isRevealing ? 'lucky-card-wiggle 0.82s ease-in-out' : 'lucky-card-glow 2.8s ease-in-out infinite' }}
        >
          <span aria-hidden="true" style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', borderRadius: 22, backfaceVisibility: 'hidden', background: 'linear-gradient(135deg, #fff7d6 0%, #facc15 28%, #b7791f 58%, #fff1a8 100%)', border: '3px solid rgba(255, 247, 214, 0.78)', boxShadow: 'inset 0 0 24px rgba(255, 255, 255, 0.42), 0 18px 34px rgba(0, 0, 0, 0.28)' }}>
            <span style={{ position: 'absolute', inset: 12, borderRadius: 16, border: '2px solid rgba(92, 54, 8, 0.42)' }} />
            <span style={{ fontSize: '4.2rem', textShadow: '0 0 18px rgba(255, 255, 255, 0.72)' }}>🍀</span>
          </span>

          <span style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', gap: '0.35rem', alignContent: 'center', borderRadius: 22, backfaceVisibility: 'hidden', transform: 'rotateY(180deg)', background: 'linear-gradient(145deg, #fffdf2 0%, #fff7d6 52%, #fef3c7 100%)', color: '#301b06', border: '3px solid #facc15', boxShadow: 'inset 0 0 24px rgba(250, 204, 21, 0.28), 0 18px 34px rgba(0, 0, 0, 0.28)' }}>
            <span style={{ fontSize: '3.4rem', lineHeight: 1 }}>{luckyCard.symbol}</span>
            <strong style={{ fontSize: '1.05rem', padding: '0 0.7rem' }}>{luckyCard.title}</strong>
          </span>
        </button>
      </div>

      {isRevealed ? (
        <p role="status" aria-live="polite" style={{ margin: '1rem auto 0', maxWidth: 520, padding: '1rem', borderRadius: 18, background: 'rgba(255, 247, 214, 0.12)', border: '1px solid rgba(255, 235, 160, 0.28)', color: '#fef3c7', fontSize: '1.1rem', lineHeight: 1.6, fontWeight: 800 }}>
          {luckyCard.message}
        </p>
      ) : null}
    </section>
  );
}
