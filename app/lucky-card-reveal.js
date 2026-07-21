'use client';

import { useState } from 'react';

const premiumLuckyCards = [
  {
    id: 'clover',
    title: 'Emerald Clover Card',
    name: 'Premium emerald clover collectible card',
    eyebrow: 'Clover Card',
    emblem: '♣',
    signature: 'Lucky Clover',
    footer: 'Emerald fortune edition',
    message: 'A glowing clover brings premium lucky energy, confidence, and a little magic to your next move.',
  },
  {
    id: 'canada',
    title: 'Canada Maple Card',
    name: 'Premium Canadian maple leaf collectible card',
    eyebrow: 'Canada Card',
    emblem: '✦',
    signature: 'Maple Luck',
    footer: 'Canadian collector finish',
    message: 'A raised maple-leaf keepsake celebrates Canadian luck with a polished red, white, and gold finish.',
  },
  {
    id: 'gold',
    title: 'Gold Treasure Card',
    name: 'Premium brushed gold clover collectible card',
    eyebrow: 'Gold Card',
    emblem: '♣',
    signature: 'Golden Fortune',
    footer: 'Treasure vault edition',
    message: 'A full metallic gold card signals treasure-style luck, abundance, and a bright reveal ahead.',
  },
];

const sparklePositions = [
  { star: '✦', top: '4%', left: '16%', size: '1.05rem', delay: '0s' },
  { star: '✧', top: '13%', left: '76%', size: '1.3rem', delay: '0.18s' },
  { star: '✶', top: '34%', left: '6%', size: '1rem', delay: '0.34s' },
  { star: '✷', top: '61%', left: '86%', size: '1.28rem', delay: '0.5s' },
  { star: '✦', top: '84%', left: '23%', size: '0.95rem', delay: '0.72s' },
  { star: '✧', top: '25%', left: '91%', size: '0.95rem', delay: '0.88s' },
  { star: '✺', top: '67%', left: '13%', size: '1.15rem', delay: '1.04s' },
  { star: '✦', top: '47%', left: '78%', size: '0.86rem', delay: '1.2s' },
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
    const storedIndex = Number(window.localStorage.getItem('lastPremiumLuckyCardIndex'));
    return Number.isInteger(storedIndex) ? storedIndex : null;
  } catch {
    return null;
  }
}

function pickRandomLuckyCard() {
  const cardCount = premiumLuckyCards.length;
  const lastIndex = getLastCardIndex();
  let nextIndex = getRandomIndex(cardCount);

  if (cardCount > 1 && lastIndex !== null && nextIndex === lastIndex) {
    nextIndex = (nextIndex + 1 + getRandomIndex(cardCount - 1)) % cardCount;
  }

  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem('lastPremiumLuckyCardIndex', String(nextIndex));
    } catch {
      // The reveal still works if browser storage is unavailable.
    }
  }

  return premiumLuckyCards[nextIndex];
}

function PremiumCard({ card, isBack = false }) {
  return (
    <span className={`premium-card ${isBack ? 'premium-card-back' : `premium-card-${card.id}`}`}>
      <span className="premium-card-foil" />
      <span className="premium-card-inner-border" />
      <span className="premium-card-corner premium-card-corner-top">LPC</span>
      <span className="premium-card-corner premium-card-corner-bottom">HD</span>

      {isBack ? (
        <span className="premium-card-back-content">
          <span className="premium-card-back-mark">♣</span>
          <strong>LuckyPickCanada</strong>
          <small>Premium lucky reveal</small>
        </span>
      ) : (
        <span className="premium-card-content">
          <span className="premium-card-eyebrow">{card.eyebrow}</span>
          <span className="premium-card-emblem-wrap">
            {card.id === 'canada' ? <span className="premium-maple-leaf" aria-hidden="true" /> : null}
            <span className="premium-card-emblem" aria-hidden="true">{card.emblem}</span>
          </span>
          <strong>{card.signature}</strong>
          <small>{card.footer}</small>
        </span>
      )}
    </span>
  );
}

export default function LuckyCardReveal({ luckScore }) {
  const [revealState, setRevealState] = useState('closed');
  const [selectedCard, setSelectedCard] = useState(null);
  const isRevealing = revealState === 'revealing';
  const isRevealed = revealState === 'revealed';
  const activeCard = selectedCard || premiumLuckyCards[0];

  function revealCard() {
    if (revealState !== 'closed') {
      return;
    }

    const nextCard = pickRandomLuckyCard();
    setSelectedCard(nextCard);
    setRevealState('revealing');
    window.setTimeout(() => setRevealState('revealed'), 1450);
  }

  return (
    <section aria-labelledby="lucky-card-title" style={{ marginTop: '1.25rem', padding: 'clamp(1.25rem, 3vw, 1.9rem)', borderRadius: 34, background: 'radial-gradient(circle at 16% 18%, rgba(250, 204, 21, 0.34), transparent 28%), radial-gradient(circle at 84% 10%, rgba(16, 185, 129, 0.34), transparent 24%), radial-gradient(circle at 50% 105%, rgba(185, 28, 28, 0.18), transparent 34%), linear-gradient(145deg, rgba(2, 6, 23, 0.98), rgba(4, 31, 27, 0.9) 48%, rgba(14, 9, 5, 0.96))', color: '#fff7d6', border: '1px solid rgba(255, 235, 160, 0.38)', boxShadow: '0 36px 110px rgba(0, 0, 0, 0.58), 0 0 64px rgba(250, 204, 21, 0.26), 0 0 42px rgba(16,185,129,0.16), inset 0 1px 0 rgba(255, 255, 255, 0.12)', overflow: 'hidden', textAlign: 'center', position: 'relative', backdropFilter: 'blur(18px) saturate(140%)' }}>
      <style>{`
        @keyframes premium-deck-shake {
          0%, 100% { transform: rotateX(0deg) rotateY(0deg) rotateZ(0deg) translate3d(0, 0, 0); }
          12% { transform: rotateX(5deg) rotateY(-10deg) rotateZ(-2.8deg) translate3d(-4px, -2px, 16px); }
          24% { transform: rotateX(-3deg) rotateY(10deg) rotateZ(2.6deg) translate3d(4px, 2px, 18px); }
          38% { transform: rotateX(4deg) rotateY(-7deg) rotateZ(-1.8deg) translate3d(-3px, 0, 20px); }
          54% { transform: rotateX(-2deg) rotateY(7deg) rotateZ(1.6deg) translate3d(3px, -1px, 18px); }
          70% { transform: rotateX(0deg) rotateY(0deg) rotateZ(0deg) translate3d(0, 0, 8px); }
        }

        @keyframes premium-card-idle-glow {
          0%, 100% { filter: drop-shadow(0 0 18px rgba(250, 204, 21, 0.44)); transform: translateY(0) rotateX(0deg); }
          50% { filter: drop-shadow(0 0 34px rgba(255, 247, 214, 0.74)); transform: translateY(-3px) rotateX(2deg); }
        }

        @keyframes premium-card-twinkle {
          0%, 100% { opacity: 0.18; transform: scale(0.58) rotate(0deg); }
          45% { opacity: 1; transform: scale(1.36) rotate(28deg); }
        }

        @keyframes premium-card-orbit {
          from { transform: rotate(0deg) translateX(8px) rotate(0deg); }
          to { transform: rotate(360deg) translateX(8px) rotate(-360deg); }
        }

        @keyframes premium-final-glow {
          from { opacity: 0.78; transform: scale(0.97) translateY(8px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }

        @keyframes premium-edge-light {
          0% { transform: translateX(-145%) rotate(16deg); opacity: 0; }
          34% { opacity: 0.86; }
          100% { transform: translateX(145%) rotate(16deg); opacity: 0; }
        }

        .premium-card-stage { perspective: 1200px; transform-style: preserve-3d; }
        .premium-card-button { transition: transform 240ms ease, box-shadow 240ms ease, filter 240ms ease; transform-style: preserve-3d; }
        .premium-card-button::before { content: ''; position: absolute; inset: 7% -18% -12%; border-radius: 44px; background: radial-gradient(ellipse at center, rgba(250,204,21,0.34), rgba(16,185,129,0.18) 42%, transparent 68%); filter: blur(20px); z-index: -1; transform: translateZ(-36px); }
        .premium-card-button:not(:disabled):hover { transform: translateY(-7px) rotateX(4deg) rotateY(-5deg); filter: saturate(1.13); box-shadow: 0 30px 68px rgba(0, 0, 0, 0.5), 0 0 58px rgba(250, 204, 21, 0.44) !important; }
        .premium-card-button.is-idle { animation: premium-card-idle-glow 3s ease-in-out infinite; }
        .premium-card-button.is-revealing { animation: premium-deck-shake 0.62s ease-in-out both; }
        .premium-card-button.is-revealed { animation: premium-final-glow 0.42s ease-out both; }
        .premium-card-flipper { position: relative; display: block; width: 100%; height: 100%; transform-style: preserve-3d; transition: transform 0.86s cubic-bezier(.18,.78,.24,1); transition-delay: 0.58s; }
        .premium-card-button.is-revealing .premium-card-flipper,
        .premium-card-button.is-revealed .premium-card-flipper { transform: rotateY(180deg); }
        .premium-card-face { position: absolute; display: block; inset: 0; backface-visibility: hidden; transform-style: preserve-3d; }
        .premium-card-face-front { transform: rotateY(180deg); }
        .premium-card { position: absolute; display: block; inset: 0; overflow: hidden; border-radius: 28px; border: 2px solid rgba(255, 247, 214, 0.72); box-shadow: inset 0 0 0 1px rgba(121, 69, 12, 0.7), inset 0 0 0 7px rgba(255, 219, 103, 0.2), inset 0 16px 26px rgba(255,255,255,0.18), inset 0 -26px 38px rgba(0,0,0,0.34); }
        .premium-card::before { content: ''; position: absolute; inset: -30%; background: linear-gradient(115deg, transparent 30%, rgba(255,255,255,0.48) 44%, rgba(255,238,168,0.22) 50%, transparent 63%); transform: translateX(-145%) rotate(16deg); animation: premium-edge-light 3.4s ease-in-out infinite; }
        .premium-card::after { content: ''; position: absolute; inset: 0; background-image: radial-gradient(circle at 22% 18%, rgba(255,255,255,0.36), transparent 9%), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(0deg, rgba(255,255,255,0.035) 1px, transparent 1px); background-size: auto, 13px 13px, 13px 13px; mix-blend-mode: screen; opacity: 0.5; pointer-events: none; }
        .premium-card-foil { position: absolute; inset: 0; background: conic-gradient(from 35deg at 50% 45%, rgba(255,255,255,0.18), transparent 16%, rgba(250,204,21,0.28) 24%, transparent 38%, rgba(16,185,129,0.18) 50%, transparent 68%, rgba(255,255,255,0.16) 82%, transparent); mix-blend-mode: screen; opacity: 0.76; }
        .premium-card-inner-border { position: absolute; inset: 13px; border-radius: 20px; border: 1px solid rgba(255, 247, 214, 0.5); box-shadow: inset 0 0 18px rgba(255, 247, 214, 0.22), 0 0 18px rgba(250, 204, 21, 0.2); }
        .premium-card-corner { position: absolute; z-index: 3; width: 42px; height: 42px; display: grid; placeItems: center; border-radius: 12px; border: 1px solid rgba(255,247,214,0.48); background: rgba(2,6,23,0.36); color: #ffe88d; font-size: 0.64rem; font-weight: 950; letter-spacing: 1px; text-shadow: 0 1px 2px #000; }
        .premium-card-corner-top { top: 18px; left: 18px; }
        .premium-card-corner-bottom { right: 18px; bottom: 18px; }
        .premium-card-content, .premium-card-back-content { position: relative; z-index: 2; height: 100%; display: grid; place-items: center; align-content: center; gap: 0.8rem; padding: 2.4rem 1.25rem; text-transform: uppercase; }
        .premium-card-eyebrow { margin: 0; color: #fff0a8; font-size: 0.72rem; letter-spacing: 2.4px; font-weight: 950; text-shadow: 0 2px 8px rgba(0,0,0,0.7); }
        .premium-card-content strong, .premium-card-back-content strong { color: #fff7d6; font-size: clamp(1.45rem, 6vw, 2rem); line-height: 0.95; letter-spacing: -0.04em; text-shadow: 0 2px 0 rgba(86,50,8,0.9), 0 0 22px rgba(250,204,21,0.58); }
        .premium-card-content small, .premium-card-back-content small { color: rgba(255,247,214,0.82); font-weight: 900; letter-spacing: 1.6px; font-size: 0.68rem; }
        .premium-card-emblem-wrap { position: relative; width: 7.6rem; height: 7.6rem; display: grid; placeItems: center; border-radius: 50%; background: radial-gradient(circle at 30% 22%, rgba(255,255,255,0.8), rgba(250,204,21,0.82) 24%, rgba(183,121,31,0.8) 50%, rgba(2,6,23,0.22) 72%); box-shadow: 0 0 34px rgba(250,204,21,0.72), inset 0 4px 10px rgba(255,255,255,0.56), inset 0 -10px 18px rgba(54,25,5,0.5); }
        .premium-card-emblem-wrap::before { content: ''; position: absolute; inset: -12px; border-radius: inherit; border: 1px solid rgba(255,247,214,0.52); animation: premium-card-orbit 8s linear infinite; }
        .premium-card-emblem { position: relative; z-index: 2; color: #4a2a05; font-size: 5.2rem; line-height: 1; text-shadow: 0 2px 0 rgba(255,247,214,0.42), 0 0 24px rgba(255,247,214,0.78); filter: drop-shadow(0 10px 8px rgba(0,0,0,0.3)); }
        .premium-card-clover { background: radial-gradient(circle at 50% 40%, rgba(16,185,129,0.36), transparent 30%), linear-gradient(150deg, #020a08 0%, #064e3b 38%, #01140f 68%, #030712 100%); }
        .premium-card-clover .premium-card-emblem { color: #1f3b0b; }
        .premium-card-canada { background: radial-gradient(circle at 50% 42%, rgba(255,255,255,0.7), transparent 24%), linear-gradient(90deg, #8f1118 0 24%, #f8fafc 24% 76%, #a80f18 76% 100%); }
        .premium-card-canada .premium-card-eyebrow, .premium-card-canada .premium-card-content strong, .premium-card-canada .premium-card-content small { color: #fff7d6; text-shadow: 0 2px 8px rgba(54,8,8,0.84), 0 0 18px rgba(250,204,21,0.42); }
        .premium-card-canada .premium-card-emblem-wrap { background: radial-gradient(circle at 32% 22%, #ffffff, #fee2e2 19%, #ef4444 48%, #8f1118 78%); box-shadow: 0 0 34px rgba(250,204,21,0.6), inset 0 4px 10px rgba(255,255,255,0.76), inset 0 -10px 18px rgba(90,5,5,0.5); }
        .premium-card-canada .premium-card-emblem { opacity: 0; }
        .premium-maple-leaf { position: absolute; z-index: 3; width: 4.8rem; height: 4.8rem; background: linear-gradient(155deg, #fff1f2, #ef4444 42%, #7f1d1d 100%); clip-path: polygon(50% 0%, 58% 23%, 78% 12%, 72% 35%, 96% 34%, 76% 51%, 87% 72%, 60% 66%, 61% 96%, 50% 76%, 39% 96%, 40% 66%, 13% 72%, 24% 51%, 4% 34%, 28% 35%, 22% 12%, 42% 23%); filter: drop-shadow(0 8px 8px rgba(0,0,0,0.32)) drop-shadow(0 0 18px rgba(250,204,21,0.6)); }
        .premium-card-gold { background: linear-gradient(105deg, #5c3307 0%, #d69b28 16%, #fff2a8 28%, #b7791f 42%, #facc15 58%, #8a4f0a 72%, #ffe88d 86%, #6b3d07 100%); }
        .premium-card-gold::after { opacity: 0.76; background-image: repeating-linear-gradient(100deg, rgba(255,255,255,0.18) 0 1px, transparent 1px 7px), radial-gradient(circle at 24% 18%, rgba(255,255,255,0.32), transparent 10%); }
        .premium-card-back { background: radial-gradient(circle at 50% 38%, rgba(250,204,21,0.32), transparent 24%), radial-gradient(circle at 16% 12%, rgba(16,185,129,0.32), transparent 28%), linear-gradient(150deg, #03150f 0%, #064e3b 38%, #100904 74%, #020617 100%); }
        .premium-card-back-mark { display: grid; placeItems: center; width: 8.2rem; height: 8.2rem; border-radius: 50%; color: #5a3708; font-size: 5.4rem; background: radial-gradient(circle at 30% 22%, #fff8c8, #facc15 42%, #9a5f10 100%); box-shadow: 0 0 42px rgba(250,204,21,0.62), inset 0 3px 8px rgba(255,255,255,0.62), inset 0 -12px 20px rgba(79,45,8,0.54); text-shadow: 0 2px 0 rgba(255,255,255,0.36); }
        .premium-reveal-sparkles { opacity: 0.72; transition: opacity 240ms ease; }
        .premium-reveal-sparkles.is-active { opacity: 1; }
      `}</style>

      <div aria-hidden="true" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }} className={`premium-reveal-sparkles ${isRevealing || isRevealed ? 'is-active' : ''}`}>
        {(isRevealing || isRevealed ? sparklePositions : sparklePositions.slice(0, 4)).map((sparkle, index) => (
          <span key={`${sparkle.star}-${index}`} style={{ position: 'absolute', top: sparkle.top, left: sparkle.left, color: index % 2 ? '#fff7d6' : '#facc15', fontSize: sparkle.size, animation: `premium-card-twinkle ${1.35 + index * 0.12}s ease-in-out infinite`, animationDelay: sparkle.delay, textShadow: '0 0 18px rgba(250, 204, 21, 0.9), 0 0 34px rgba(16, 185, 129, 0.32)' }}>
            {sparkle.star}
          </span>
        ))}
      </div>

      <p style={{ margin: 0, textTransform: 'uppercase', letterSpacing: 2.4, color: '#fde68a', fontWeight: 950 }}>
        Premium HD Lucky Card Reveal
      </p>
      <h3 id="lucky-card-title" style={{ margin: '0.5rem 0 0.4rem', fontSize: 'clamp(1.9rem, 5vw, 3.2rem)', lineHeight: 1 }}>
        Your Luck Score: {luckScore}%
      </h3>
      <p style={{ margin: '0 auto 1.55rem', maxWidth: 610, lineHeight: 1.62, fontWeight: 850, color: '#fff7d6' }}>
        Tap the luxury deck once. It will shake, sparkle, flip with depth, then reveal a premium collectible Clover, Canada, or Gold card.
      </p>

      <div className="premium-card-stage" style={{ position: 'relative', minHeight: 380, display: 'grid', placeItems: 'center' }}>
        <button
          type="button"
          onClick={revealCard}
          disabled={revealState !== 'closed'}
          aria-label={isRevealed && selectedCard ? `LuckyPickCanada lucky card reveal: ${selectedCard.name}` : 'LuckyPickCanada lucky card reveal'}
          className={`premium-card-button ${isRevealing ? 'is-revealing' : ''} ${isRevealed ? 'is-revealed' : ''} ${revealState === 'closed' ? 'is-idle' : ''}`}
          style={{ position: 'relative', width: 'min(72vw, 252px)', aspectRatio: '210 / 296', border: 0, borderRadius: 30, background: 'transparent', padding: 0, cursor: revealState === 'closed' ? 'pointer' : 'default', boxShadow: '0 28px 64px rgba(0, 0, 0, 0.52), 0 0 42px rgba(250, 204, 21, 0.28)', transformStyle: 'preserve-3d' }}
        >
          <span className="premium-card-flipper" aria-hidden="true">
            <span className="premium-card-face premium-card-face-back">
              <PremiumCard card={activeCard} isBack />
            </span>
            <span className="premium-card-face premium-card-face-front">
              <PremiumCard card={activeCard} />
            </span>
          </span>
        </button>
      </div>

      {isRevealed && selectedCard ? (
        <p role="status" aria-live="polite" style={{ margin: '1rem auto 0', maxWidth: 610, padding: '1rem 1.1rem', borderRadius: 20, background: 'linear-gradient(145deg, rgba(2, 6, 23, 0.62), rgba(6, 78, 59, 0.28))', border: '1px solid rgba(255, 235, 160, 0.34)', color: '#fff7d6', fontSize: '1rem', lineHeight: 1.55, fontWeight: 850, boxShadow: '0 0 34px rgba(250,204,21,0.14), inset 0 1px 0 rgba(255,255,255,0.08)' }}>
          <strong>{selectedCard.title}:</strong> {selectedCard.message}
        </p>
      ) : null}
    </section>
  );
}
