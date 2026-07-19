'use client';

import { useState } from 'react';

const luckyCards = [
  {
    title: 'Clover Fortune',
    name: 'Clover Fortune Card',
    artwork: 'clover',
    accent: '#86efac',
    titleColor: '#dcfce7',
    message: 'A little extra luck is heading your way. Keep your eyes open for good moments.',
    faceBackground: 'radial-gradient(circle at 50% 31%, rgba(134, 239, 172, 0.62), transparent 30%), radial-gradient(circle at 18% 74%, rgba(250, 204, 21, 0.22), transparent 28%), linear-gradient(145deg, #052e16 0%, #166534 50%, #fef3c7 100%)',
    artworkFrame: 'radial-gradient(circle, rgba(220, 252, 231, 0.96), rgba(134, 239, 172, 0.32), transparent 72%)',
  },
  {
    title: 'Royal Luck',
    name: 'Royal Luck Card',
    artwork: 'spade',
    accent: '#facc15',
    titleColor: '#fef3c7',
    message: 'A powerful symbol of confidence, success, and taking your next lucky step.',
    faceBackground: 'radial-gradient(circle at 50% 19%, rgba(250, 204, 21, 0.38), transparent 27%), radial-gradient(circle at 72% 78%, rgba(255, 247, 214, 0.18), transparent 31%), linear-gradient(145deg, #020617 0%, #111827 56%, #b7791f 100%)',
    artworkFrame: 'linear-gradient(145deg, rgba(255, 247, 214, 0.96), rgba(250, 204, 21, 0.42), rgba(2, 6, 23, 0.24))',
  },
  {
    title: 'Mystery Charm',
    name: 'Mystery Charm Card',
    artwork: 'mystery',
    accent: '#f0abfc',
    titleColor: '#fae8ff',
    message: 'Unexpected luck can appear when you least expect it.',
    faceBackground: 'radial-gradient(circle at 24% 24%, rgba(248, 113, 113, 0.34), transparent 28%), radial-gradient(circle at 78% 20%, rgba(96, 165, 250, 0.34), transparent 30%), radial-gradient(circle at 50% 76%, rgba(250, 204, 21, 0.24), transparent 30%), linear-gradient(145deg, #581c87 0%, #7c2d12 52%, #fef3c7 100%)',
    artworkFrame: 'radial-gradient(circle, rgba(250, 232, 255, 0.92), rgba(240, 171, 252, 0.36), transparent 72%)',
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
  return luckyCards[Math.floor(Math.random() * luckyCards.length)];
}

function CloverArtwork({ size = 106 }) {
  return (
    <svg viewBox="0 0 120 120" aria-label="Four-leaf clover artwork" style={{ width: size, height: size, display: 'block' }}>
      <path d="M63 72 C73 82 80 94 82 108" fill="none" stroke="#166534" strokeWidth="9" strokeLinecap="round" />
      <circle cx="45" cy="43" r="25" fill="#22c55e" stroke="#dcfce7" strokeWidth="3" />
      <circle cx="75" cy="43" r="25" fill="#16a34a" stroke="#dcfce7" strokeWidth="3" />
      <circle cx="45" cy="70" r="25" fill="#16a34a" stroke="#dcfce7" strokeWidth="3" />
      <circle cx="75" cy="70" r="25" fill="#22c55e" stroke="#dcfce7" strokeWidth="3" />
      <circle cx="60" cy="56" r="17" fill="#15803d" />
      <path d="M60 35 L66 53 L84 53 L69 64 L75 82 L60 71 L45 82 L51 64 L36 53 L54 53 Z" fill="#fef3c7" opacity="0.42" />
    </svg>
  );
}

function SpadeArtwork() {
  return (
    <svg viewBox="0 0 120 150" aria-label="Ace of Spades playing card artwork" style={{ width: 96, height: 120, display: 'block' }}>
      <rect x="11" y="8" width="98" height="134" rx="14" fill="#fff7ed" stroke="#111827" strokeWidth="4" />
      <text x="24" y="34" fill="#111827" fontSize="22" fontWeight="900" fontFamily="Georgia, serif">A</text>
      <text x="96" y="126" fill="#111827" fontSize="22" fontWeight="900" fontFamily="Georgia, serif" transform="rotate(180 96 126)">A</text>
      <path d="M60 34 C34 58 26 76 43 91 C52 99 59 92 60 87 C61 92 68 99 77 91 C94 76 86 58 60 34 Z" fill="#020617" />
      <path d="M60 84 C58 101 51 112 39 116 L81 116 C69 112 62 101 60 84 Z" fill="#020617" />
      <path d="M60 22 L65 32 L76 33 L68 41 L70 52 L60 47 L50 52 L52 41 L44 33 L55 32 Z" fill="#facc15" opacity="0.72" />
    </svg>
  );
}

function MysteryArtwork() {
  return (
    <svg viewBox="0 0 150 120" aria-label="Joker, horseshoe, and rabbit's foot artwork" style={{ width: 138, height: 110, display: 'block' }}>
      <rect x="10" y="18" width="48" height="72" rx="8" fill="#fff7ed" stroke="#7e22ce" strokeWidth="3" transform="rotate(-8 34 54)" />
      <text x="25" y="43" fill="#be123c" fontSize="18" fontWeight="900" fontFamily="Georgia, serif" transform="rotate(-8 34 54)">J</text>
      <path d="M25 60 C31 46 42 47 47 60 C43 73 30 73 25 60 Z" fill="#f97316" transform="rotate(-8 34 54)" />
      <circle cx="34" cy="57" r="3" fill="#fff7ed" />
      <circle cx="42" cy="57" r="3" fill="#fff7ed" />

      <path d="M74 28 C54 36 53 84 75 91 C97 84 96 36 76 28" fill="none" stroke="#facc15" strokeWidth="14" strokeLinecap="round" />
      <path d="M64 31 L58 20 M87 31 L93 20 M60 82 L51 91 M90 82 L99 91" stroke="#fff7d6" strokeWidth="4" strokeLinecap="round" />
      <path d="M64 28 C58 44 60 72 75 78 C90 72 92 44 86 28" fill="none" stroke="#92400e" strokeWidth="4" strokeLinecap="round" />

      <path d="M112 38 C123 24 139 31 136 45 C133 59 116 60 109 50 C99 64 102 82 117 91 C103 96 91 88 92 75 C93 62 99 51 112 38 Z" fill="#f8fafc" stroke="#64748b" strokeWidth="3" />
      <ellipse cx="124" cy="42" rx="6" ry="12" fill="#fecdd3" transform="rotate(33 124 42)" />
      <circle cx="130" cy="48" r="3" fill="#0f172a" />
      <path d="M114 92 C121 104 133 105 139 94" fill="none" stroke="#f8fafc" strokeWidth="8" strokeLinecap="round" />
    </svg>
  );
}

function FortuneArtwork({ card }) {
  if (card.artwork === 'spade') {
    return <SpadeArtwork />;
  }

  if (card.artwork === 'mystery') {
    return <MysteryArtwork />;
  }

  return <CloverArtwork />;
}

export default function LuckyCardReveal({ luckScore }) {
  const [isRevealing, setIsRevealing] = useState(false);
  const [isRevealed, setIsRevealed] = useState(false);
  const [selectedCard, setSelectedCard] = useState(null);
  const cardFace = selectedCard || luckyCards[0];

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

        @keyframes lucky-card-face-shimmer {
          from { transform: translateX(-135%) rotate(18deg); }
          to { transform: translateX(145%) rotate(18deg); }
        }

        @keyframes lucky-artwork-rise {
          from { opacity: 0; transform: translateY(12px) scale(0.9); }
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
          aria-label={isRevealed ? `Revealed lucky card: ${cardFace.name}` : 'Reveal your one special lucky card'}
          style={{ position: 'relative', display: 'block', width: 210, height: 296, border: 0, borderRadius: 28, background: 'transparent', padding: 0, cursor: isRevealed ? 'default' : 'pointer', transformStyle: 'preserve-3d', transition: 'transform 760ms cubic-bezier(.18,.82,.24,1)', transform: isRevealed ? 'rotateY(180deg)' : 'rotateY(0deg)', animation: isRevealing ? 'lucky-card-shake 0.72s ease-in-out' : 'lucky-card-glow 2.8s ease-in-out infinite' }}
        >
          <span aria-hidden="true" style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', borderRadius: 28, backfaceVisibility: 'hidden', background: 'radial-gradient(circle at 50% 20%, rgba(255, 255, 255, 0.7), transparent 17%), linear-gradient(135deg, #fff7d6 0%, #facc15 28%, #b7791f 58%, #fff1a8 100%)', border: '3px solid rgba(255, 247, 214, 0.86)', boxShadow: 'inset 0 0 30px rgba(255, 255, 255, 0.48), 0 18px 34px rgba(0, 0, 0, 0.3)' }}>
            <span style={{ position: 'absolute', inset: 13, borderRadius: 21, border: '2px solid rgba(92, 54, 8, 0.42)' }} />
            <span style={{ position: 'absolute', inset: 25, borderRadius: 16, border: '1px solid rgba(255, 247, 214, 0.62)' }} />
            <span style={{ position: 'absolute', top: 27, left: 0, right: 0, textTransform: 'uppercase', letterSpacing: 1.6, color: '#5c3608', fontSize: '0.74rem', fontWeight: 900 }}>LuckyPickCanada</span>
            <span style={{ display: 'grid', placeItems: 'center', width: 104, height: 104, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255, 247, 214, 0.92), rgba(250, 204, 21, 0.52), transparent 72%)' }}>
              <CloverArtwork size={88} />
            </span>
            <span style={{ position: 'absolute', bottom: 27, left: 0, right: 0, color: '#5c3608', fontSize: '0.82rem', fontWeight: 900 }}>Gold Lucky Card Deck</span>
          </span>

          <span style={{ position: 'absolute', inset: 0, display: 'grid', gridTemplateRows: 'auto 1fr auto', gap: '0.45rem', alignItems: 'center', borderRadius: 28, backfaceVisibility: 'hidden', transform: 'rotateY(180deg)', background: cardFace.faceBackground, color: '#fff7d6', border: '3px solid #facc15', boxShadow: `inset 0 0 34px rgba(250, 204, 21, 0.3), 0 0 34px ${cardFace.accent}66, 0 18px 34px rgba(0, 0, 0, 0.3)`, overflow: 'hidden', padding: '0.95rem 0.78rem' }}>
            <span aria-hidden="true" style={{ position: 'absolute', inset: 10, borderRadius: 20, border: `1px solid ${cardFace.accent}`, boxShadow: `inset 0 0 22px ${cardFace.accent}33` }} />
            <span aria-hidden="true" style={{ position: 'absolute', top: -40, bottom: -40, left: 0, width: '42%', background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.36), transparent)', animation: isRevealed ? 'lucky-card-face-shimmer 1.35s ease 0.16s both' : 'none', pointerEvents: 'none' }} />

            <strong style={{ position: 'relative', zIndex: 1, alignSelf: 'start', textTransform: 'uppercase', letterSpacing: 1.4, fontSize: '0.8rem', color: cardFace.titleColor, textShadow: '0 2px 8px rgba(0, 0, 0, 0.56)' }}>
              {cardFace.title}
            </strong>

            <span aria-label={`${cardFace.name} artwork`} style={{ position: 'relative', zIndex: 1, display: 'grid', placeItems: 'center', minHeight: 122, borderRadius: 22, background: cardFace.artworkFrame, border: `1px solid ${cardFace.accent}88`, boxShadow: `inset 0 0 28px rgba(255, 247, 214, 0.16), 0 0 24px ${cardFace.accent}55`, opacity: isRevealed ? 1 : 0, animation: isRevealed ? 'lucky-artwork-rise 0.52s ease 0.2s both' : 'none' }}>
              <span aria-hidden="true" style={{ position: 'absolute', inset: 10, borderRadius: 16, border: '1px solid rgba(2, 6, 23, 0.18)' }} />
              <span style={{ position: 'relative', zIndex: 1, display: 'grid', placeItems: 'center' }}>
                <FortuneArtwork card={cardFace} />
              </span>
            </span>

            <span role="status" aria-live="polite" style={{ position: 'relative', zIndex: 1, alignSelf: 'end', padding: '0.66rem', borderRadius: 16, background: 'rgba(2, 6, 23, 0.46)', border: `1px solid ${cardFace.accent}88`, color: '#fff7d6', fontSize: '0.78rem', lineHeight: 1.3, fontWeight: 800, textShadow: '0 2px 8px rgba(0, 0, 0, 0.56)' }}>
              {cardFace.message}
            </span>
          </span>
        </button>
      </div>
    </section>
  );
}
