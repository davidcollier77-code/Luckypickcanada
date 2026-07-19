'use client';

import { useMemo, useState } from 'react';

const luckyCards = [
  {
    title: 'Clover Fortune Card',
    symbols: [{ icon: '🍀', label: 'Four-leaf clover' }],
    accent: '#86efac',
    message: 'A little extra luck is heading your way. Keep your eyes open for good moments.',
    faceBackground: 'radial-gradient(circle at 50% 27%, rgba(134, 239, 172, 0.58), transparent 29%), radial-gradient(circle at 18% 74%, rgba(250, 204, 21, 0.22), transparent 28%), linear-gradient(145deg, #052e16 0%, #166534 54%, #fef3c7 100%)',
  },
  {
    title: 'Royal Luck Card',
    symbols: [{ icon: '🂡', label: 'Ace of Spades' }],
    accent: '#facc15',
    message: 'A powerful symbol of confidence, success, and taking your next lucky step.',
    faceBackground: 'radial-gradient(circle at 50% 19%, rgba(250, 204, 21, 0.34), transparent 27%), radial-gradient(circle at 72% 78%, rgba(255, 247, 214, 0.18), transparent 31%), linear-gradient(145deg, #020617 0%, #111827 58%, #b7791f 100%)',
  },
  {
    title: 'Mystery Charm Card',
    symbols: [
      { icon: '🃏', label: 'Joker' },
      { icon: '∩', label: 'Lucky horseshoe' },
      { icon: '🐇', label: "Rabbit's foot" },
    ],
    accent: '#f0abfc',
    message: 'Unexpected luck can appear when you least expect it.',
    faceBackground: 'radial-gradient(circle at 24% 24%, rgba(248, 113, 113, 0.34), transparent 28%), radial-gradient(circle at 78% 20%, rgba(96, 165, 250, 0.34), transparent 30%), radial-gradient(circle at 50% 76%, rgba(250, 204, 21, 0.24), transparent 30%), linear-gradient(145deg, #581c87 0%, #7c2d12 52%, #fef3c7 100%)',
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

        @keyframes lucky-card-face-shimmer {
          from { transform: translateX(-135%) rotate(18deg); }
          to { transform: translateX(145%) rotate(18deg); }
        }

        @keyframes lucky-symbol-rise {
          from { opacity: 0; transform: translateY(10px) scale(0.88); }
          to { opacity: 1; transform: translateY(0) scale(1); }
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
        Tap the gold deck once. A rare fortune card will choose you.
      </p>

      <div style={{ position: 'relative', minHeight: 330, display: 'grid', placeItems: 'center', perspective: 1200 }}>
        {isRevealing || isRevealed ? (
          <div aria-hidden="true" style={{ position: 'absolute', top: '50%', left: '50%', width: 330, height: 330, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255, 247, 214, 0.74), rgba(250, 204, 21, 0.34) 38%, rgba(134, 239, 172, 0.12) 56%, transparent 72%)', animation: isRevealing ? 'lucky-card-burst 0.9s ease forwards' : 'none', opacity: isRevealed ? 0.3 : undefined, pointerEvents: 'none' }} />
        ) : null}

        <button
          type="button"
          onClick={revealCard}
          disabled={isRevealed}
          aria-label={isRevealed ? `Revealed lucky card: ${luckyCard.title}` : 'Reveal your one special lucky card'}
          style={{ position: 'relative', display: 'block', width: 210, height: 296, border: 0, borderRadius: 28, background: 'transparent', padding: 0, cursor: isRevealed ? 'default' : 'pointer', transformStyle: 'preserve-3d', transition: 'transform 760ms cubic-bezier(.18,.82,.24,1)', transform: isRevealed ? 'rotateY(180deg)' : 'rotateY(0deg)', animation: isRevealing ? 'lucky-card-shake 0.72s ease-in-out' : 'lucky-card-glow 2.8s ease-in-out infinite' }}
        >
          <span aria-hidden="true" style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', borderRadius: 28, backfaceVisibility: 'hidden', background: 'radial-gradient(circle at 50% 20%, rgba(255, 255, 255, 0.7), transparent 17%), linear-gradient(135deg, #fff7d6 0%, #facc15 28%, #b7791f 58%, #fff1a8 100%)', border: '3px solid rgba(255, 247, 214, 0.86)', boxShadow: 'inset 0 0 30px rgba(255, 255, 255, 0.48), 0 18px 34px rgba(0, 0, 0, 0.3)' }}>
            <span style={{ position: 'absolute', inset: 13, borderRadius: 21, border: '2px solid rgba(92, 54, 8, 0.42)' }} />
            <span style={{ position: 'absolute', inset: 25, borderRadius: 16, border: '1px solid rgba(255, 247, 214, 0.62)' }} />
            <span style={{ position: 'absolute', top: 27, left: 0, right: 0, textTransform: 'uppercase', letterSpacing: 1.6, color: '#5c3608', fontSize: '0.74rem', fontWeight: 900 }}>LuckyPickCanada</span>
            <span style={{ display: 'grid', placeItems: 'center', width: 104, height: 104, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255, 247, 214, 0.92), rgba(250, 204, 21, 0.52), transparent 72%)', fontSize: '4.7rem', textShadow: '0 0 20px rgba(255, 255, 255, 0.76)' }}>🍀</span>
            <span style={{ position: 'absolute', bottom: 27, left: 0, right: 0, color: '#5c3608', fontSize: '0.82rem', fontWeight: 900 }}>Gold Lucky Card Deck</span>
          </span>

          <span style={{ position: 'absolute', inset: 0, display: 'grid', gridTemplateRows: 'auto 1fr auto', gap: '0.45rem', alignItems: 'center', borderRadius: 28, backfaceVisibility: 'hidden', transform: 'rotateY(180deg)', background: luckyCard.faceBackground, color: '#fff7d6', border: '3px solid #facc15', boxShadow: `inset 0 0 34px rgba(250, 204, 21, 0.3), 0 0 34px ${luckyCard.accent}66, 0 18px 34px rgba(0, 0, 0, 0.3)`, overflow: 'hidden', padding: '1.05rem 0.85rem' }}>
            <span aria-hidden="true" style={{ position: 'absolute', inset: 12, borderRadius: 20, border: '1px solid rgba(255, 247, 214, 0.5)' }} />
            <span aria-hidden="true" style={{ position: 'absolute', top: -40, bottom: -40, left: 0, width: '42%', background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.36), transparent)', animation: isRevealed ? 'lucky-card-face-shimmer 1.35s ease 0.16s both' : 'none', pointerEvents: 'none' }} />

            <strong style={{ position: 'relative', zIndex: 1, alignSelf: 'start', textTransform: 'uppercase', letterSpacing: 1.2, fontSize: '0.78rem', color: '#fef3c7', textShadow: '0 2px 8px rgba(0, 0, 0, 0.48)' }}>
              {luckyCard.title}
            </strong>

            <span style={{ position: 'relative', zIndex: 1, display: 'grid', gap: '0.35rem', justifyItems: 'center' }}>
              <span aria-hidden="true" style={{ display: 'flex', gap: '0.35rem', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap' }}>
                {luckyCard.symbols.map((symbol, index) => (
                  <span key={`${symbol.label}-${index}`} aria-label={symbol.label} title={symbol.label} style={{ display: 'inline-grid', placeItems: 'center', width: luckyCard.symbols.length > 1 ? 54 : 92, height: luckyCard.symbols.length > 1 ? 54 : 92, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255, 247, 214, 0.92), rgba(250, 204, 21, 0.24), transparent 72%)', fontSize: luckyCard.symbols.length > 1 ? '2.15rem' : '4.9rem', lineHeight: 1, textShadow: '0 0 18px rgba(255, 247, 214, 0.68)', opacity: isRevealed ? 1 : 0, animation: isRevealed ? `lucky-symbol-rise 0.52s ease ${0.2 + index * 0.12}s both` : 'none' }}>
                    {symbol.icon}
                  </span>
                ))}
              </span>
              <span style={{ color: luckyCard.accent, fontSize: '0.78rem', fontWeight: 900, letterSpacing: 1.4, textTransform: 'uppercase' }}>Chosen Fortune</span>
            </span>

            <span role="status" aria-live="polite" style={{ position: 'relative', zIndex: 1, alignSelf: 'end', padding: '0.75rem', borderRadius: 16, background: 'rgba(2, 6, 23, 0.42)', border: '1px solid rgba(255, 247, 214, 0.3)', color: '#fff7d6', fontSize: '0.84rem', lineHeight: 1.35, fontWeight: 800, textShadow: '0 2px 8px rgba(0, 0, 0, 0.52)' }}>
              {luckyCard.message}
            </span>
          </span>
        </button>
      </div>
    </section>
  );
}
