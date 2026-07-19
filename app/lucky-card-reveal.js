'use client';

import { useMemo, useState } from 'react';

const luckyCards = [
  {
    title: 'Four-Leaf Clover Card',
    symbol: '🍀',
    message: 'A Little Extra Luck Is Coming Your Way',
    design: 'Glowing four-leaf clover design',
    faceBackground: 'radial-gradient(circle at 50% 34%, rgba(74, 222, 128, 0.42), transparent 34%), linear-gradient(145deg, #052e16 0%, #166534 54%, #fef3c7 100%)',
  },
  {
    title: 'Ace of Spades Card',
    symbol: '🂡',
    message: 'The Ace of Luck',
    design: 'Premium black and gold design',
    faceBackground: 'radial-gradient(circle at 50% 18%, rgba(250, 204, 21, 0.28), transparent 28%), linear-gradient(145deg, #020617 0%, #111827 58%, #b7791f 100%)',
  },
  {
    title: 'Joker Card',
    symbol: '🃏',
    message: 'Your Wild Card of Luck',
    design: 'Fun mystery wild card design',
    faceBackground: 'radial-gradient(circle at 24% 24%, rgba(248, 113, 113, 0.34), transparent 28%), radial-gradient(circle at 78% 20%, rgba(96, 165, 250, 0.34), transparent 30%), linear-gradient(145deg, #581c87 0%, #7c2d12 52%, #fef3c7 100%)',
  },
  {
    title: 'Lucky Horseshoe Card',
    symbol: '🐴',
    message: 'Good Fortune Is On Your Side',
    design: 'Golden horseshoe design',
    faceBackground: 'radial-gradient(circle at 50% 42%, rgba(254, 243, 199, 0.46), transparent 34%), linear-gradient(145deg, #78350f 0%, #b7791f 48%, #fff7d6 100%)',
  },
  {
    title: "Rabbit's Foot Card",
    symbol: '🐇',
    message: 'A Classic Symbol of Luck',
    design: 'Classic lucky charm design',
    faceBackground: 'radial-gradient(circle at 50% 28%, rgba(255, 255, 255, 0.5), transparent 32%), linear-gradient(145deg, #0f172a 0%, #475569 55%, #fef3c7 100%)',
  },
  {
    title: 'Golden Path Fortune Card',
    symbol: '✨',
    message: 'A New Opportunity May Be Closer Than You Think',
    design: 'Golden path leading forward',
    faceBackground: 'linear-gradient(150deg, #1e1b4b 0%, #854d0e 46%, #facc15 70%, #fff7d6 100%)',
  },
  {
    title: 'Lucky Star Fortune Card',
    symbol: '🌙',
    message: 'A Little Extra Luck Is Shining Your Way',
    design: 'Shooting star and magical night sky design',
    faceBackground: 'radial-gradient(circle at 76% 18%, rgba(255, 247, 214, 0.58), transparent 20%), linear-gradient(145deg, #020617 0%, #1e3a8a 58%, #facc15 100%)',
  },
  {
    title: 'Mystery Fortune Card',
    symbol: '🔮',
    message: 'A Surprise Of Luck Awaits',
    design: 'Crystal ball and magical glow design',
    faceBackground: 'radial-gradient(circle at 50% 38%, rgba(216, 180, 254, 0.58), transparent 34%), linear-gradient(145deg, #312e81 0%, #6b21a8 52%, #fef3c7 100%)',
  },
  {
    title: 'Lucky Tree Fortune Card',
    symbol: '🌳',
    message: 'Good Things Grow With Patience And Positivity',
    design: 'Glowing tree with lucky leaves',
    faceBackground: 'radial-gradient(circle at 50% 34%, rgba(187, 247, 208, 0.46), transparent 34%), linear-gradient(145deg, #052e16 0%, #365314 56%, #fef3c7 100%)',
  },
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
    <section aria-labelledby="lucky-card-title" style={{ marginTop: '1.25rem', padding: '1.5rem', borderRadius: 28, background: 'radial-gradient(circle at 16% 18%, rgba(250, 204, 21, 0.3), transparent 24%), radial-gradient(circle at 84% 10%, rgba(255, 255, 255, 0.22), transparent 18%), linear-gradient(145deg, rgba(48, 27, 6, 0.92), rgba(92, 54, 8, 0.8) 48%, rgba(12, 20, 38, 0.88))', color: '#fff7d6', border: '1px solid rgba(255, 235, 160, 0.28)', boxShadow: '0 24px 70px rgba(0, 0, 0, 0.36), 0 0 42px rgba(250, 204, 21, 0.18)', overflow: 'hidden', textAlign: 'center', position: 'relative' }}>
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
        {['✦', '✧', '✶', '✷', '✦', '✧', '✺'].map((star, index) => (
          <span key={`${star}-${index}`} style={{ position: 'absolute', top: `${10 + (index % 4) * 19}%`, left: `${8 + index * 13}%`, color: index % 2 ? '#fff7d6' : '#facc15', fontSize: `${1 + index * 0.14}rem`, animation: `lucky-card-twinkle ${1.8 + index * 0.24}s ease-in-out infinite` }}>
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

      <div style={{ position: 'relative', minHeight: 292, display: 'grid', placeItems: 'center', perspective: 1200 }}>
        {isRevealing ? (
          <div aria-hidden="true" style={{ position: 'absolute', top: '50%', left: '50%', width: 290, height: 290, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255, 247, 214, 0.78), rgba(250, 204, 21, 0.34) 42%, transparent 70%)', animation: 'lucky-card-burst 0.75s ease forwards', pointerEvents: 'none' }} />
        ) : null}

        <button
          type="button"
          onClick={revealCard}
          disabled={isRevealed}
          aria-label={isRevealed ? `Revealed lucky card: ${luckyCard.title}` : 'Reveal your lucky card'}
          style={{ position: 'relative', display: 'block', width: 186, height: 262, border: 0, borderRadius: 24, background: 'transparent', padding: 0, cursor: isRevealed ? 'default' : 'pointer', transformStyle: 'preserve-3d', transition: 'transform 720ms cubic-bezier(.2,.8,.2,1)', transform: isRevealed ? 'rotateY(180deg)' : 'rotateY(0deg)', animation: isRevealing ? 'lucky-card-wiggle 0.82s ease-in-out' : 'lucky-card-glow 2.8s ease-in-out infinite' }}
        >
          <span aria-hidden="true" style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', borderRadius: 24, backfaceVisibility: 'hidden', background: 'radial-gradient(circle at 50% 22%, rgba(255, 255, 255, 0.66), transparent 18%), linear-gradient(135deg, #fff7d6 0%, #facc15 28%, #b7791f 58%, #fff1a8 100%)', border: '3px solid rgba(255, 247, 214, 0.84)', boxShadow: 'inset 0 0 28px rgba(255, 255, 255, 0.46), 0 18px 34px rgba(0, 0, 0, 0.28)' }}>
            <span style={{ position: 'absolute', inset: 12, borderRadius: 18, border: '2px solid rgba(92, 54, 8, 0.42)' }} />
            <span style={{ position: 'absolute', top: 24, left: 0, right: 0, textTransform: 'uppercase', letterSpacing: 1.6, color: '#5c3608', fontSize: '0.72rem', fontWeight: 900 }}>LuckyPickCanada</span>
            <span style={{ fontSize: '4.4rem', textShadow: '0 0 18px rgba(255, 255, 255, 0.72)' }}>🍀</span>
            <span style={{ position: 'absolute', bottom: 24, left: 0, right: 0, color: '#5c3608', fontSize: '0.82rem', fontWeight: 900 }}>Gold Lucky Card</span>
          </span>

          <span style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', gap: '0.45rem', alignContent: 'center', borderRadius: 24, backfaceVisibility: 'hidden', transform: 'rotateY(180deg)', background: luckyCard.faceBackground, color: '#fff7d6', border: '3px solid #facc15', boxShadow: 'inset 0 0 30px rgba(250, 204, 21, 0.28), 0 18px 34px rgba(0, 0, 0, 0.28)', overflow: 'hidden' }}>
            <span aria-hidden="true" style={{ position: 'absolute', inset: 12, borderRadius: 18, border: '1px solid rgba(255, 247, 214, 0.48)' }} />
            <span style={{ fontSize: '3.7rem', lineHeight: 1, textShadow: '0 0 18px rgba(255, 247, 214, 0.52)' }}>{luckyCard.symbol}</span>
            <strong style={{ fontSize: '1rem', padding: '0 0.85rem', textShadow: '0 2px 8px rgba(0, 0, 0, 0.42)' }}>{luckyCard.title}</strong>
            <span style={{ padding: '0 0.9rem', fontSize: '0.72rem', lineHeight: 1.25, color: '#fef3c7', textShadow: '0 2px 8px rgba(0, 0, 0, 0.42)' }}>{luckyCard.design}</span>
          </span>
        </button>
      </div>

      {isRevealed ? (
        <p role="status" aria-live="polite" style={{ margin: '1rem auto 0', maxWidth: 560, padding: '1rem', borderRadius: 18, background: 'rgba(255, 247, 214, 0.12)', border: '1px solid rgba(255, 235, 160, 0.28)', color: '#fef3c7', fontSize: '1.1rem', lineHeight: 1.6, fontWeight: 900 }}>
          {luckyCard.message}
        </p>
      ) : null}
    </section>
  );
}
