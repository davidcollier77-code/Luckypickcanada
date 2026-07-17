'use client';

import { useState } from 'react';

const overlayStyle = {
  position: 'fixed',
  inset: 0,
  zIndex: 50,
  display: 'grid',
  placeItems: 'center',
  padding: '1rem',
  background: 'rgba(2, 6, 23, 0.72)',
  backdropFilter: 'blur(8px)',
};

const dialogStyle = {
  position: 'relative',
  width: 'min(100%, 720px)',
  maxHeight: '92vh',
  overflow: 'auto',
  padding: 'clamp(1.25rem, 4vw, 2rem)',
  borderRadius: 28,
  border: '1px solid rgba(153, 246, 228, 0.42)',
  color: '#f8fafc',
  background: 'radial-gradient(circle at 10% 5%, rgba(250, 204, 21, 0.22), transparent 18%), radial-gradient(circle at 82% 12%, rgba(94, 234, 212, 0.32), transparent 24%), linear-gradient(140deg, #03131f, #0f172a 52%, #164e63)',
  boxShadow: '0 30px 90px rgba(0, 0, 0, 0.48)',
};

const closeButtonStyle = {
  position: 'absolute',
  top: 16,
  right: 16,
  width: 38,
  height: 38,
  border: '1px solid rgba(255, 255, 255, 0.3)',
  borderRadius: '50%',
  background: 'rgba(15, 23, 42, 0.55)',
  color: '#fff',
  fontSize: '1.25rem',
  cursor: 'pointer',
};

function SlowWords({ children, startDelay = 0 }) {
  const words = String(children).split(' ');

  return words.map((word, index) => (
    <span
      key={`${word}-${index}`}
      style={{
        display: 'inline-block',
        marginRight: '0.35ch',
        opacity: 0,
        transform: 'translateY(14px)',
        animation: 'lucky-word-rise 0.78s ease forwards',
        animationDelay: `${startDelay + index * 0.18}s`,
      }}
    >
      {word}
    </span>
  ));
}

export default function LuckyRevealPopup({ reveal }) {
  const [isOpen, setIsOpen] = useState(Boolean(reveal));

  if (!isOpen || !reveal) {
    return null;
  }

  return (
    <div role="presentation" style={overlayStyle}>
      <section role="dialog" aria-modal="true" aria-labelledby="lucky-reveal-title" style={dialogStyle}>
        <button type="button" aria-label="Close lucky reveal" onClick={() => setIsOpen(false)} style={closeButtonStyle}>
          ×
        </button>

        <style>{`
          @keyframes lucky-word-rise {
            to { opacity: 1; transform: translateY(0); }
          }

          @keyframes lucky-aurora-sweep {
            0% { transform: translateX(-20%) rotate(0deg); opacity: 0.34; }
            50% { transform: translateX(8%) rotate(5deg); opacity: 0.72; }
            100% { transform: translateX(24%) rotate(-3deg); opacity: 0.36; }
          }

          @keyframes lucky-star-pulse {
            0%, 100% { opacity: 0.35; transform: scale(0.86); }
            50% { opacity: 1; transform: scale(1.12); }
          }
        `}</style>

        <div aria-hidden="true" style={{ position: 'absolute', inset: 0, overflow: 'hidden', borderRadius: 28, pointerEvents: 'none' }}>
          <div style={{ position: 'absolute', top: 30, left: -90, width: 520, height: 110, borderRadius: '999px', background: 'linear-gradient(90deg, rgba(45, 212, 191, 0), rgba(94, 234, 212, 0.55), rgba(192, 132, 252, 0.45), rgba(45, 212, 191, 0))', filter: 'blur(10px)', animation: 'lucky-aurora-sweep 7s ease-in-out infinite alternate' }} />
          {['✦', '✧', '✶', '✷', '✦'].map((star, index) => (
            <span key={`${star}-${index}`} style={{ position: 'absolute', top: `${12 + index * 15}%`, left: `${12 + index * 17}%`, color: '#fde68a', fontSize: `${1 + index * 0.18}rem`, animation: `lucky-star-pulse ${2.1 + index * 0.35}s ease-in-out infinite` }}>
              {star}
            </span>
          ))}
        </div>

        <div style={{ position: 'relative' }}>
          <p style={{ margin: 0, textTransform: 'uppercase', letterSpacing: 2, color: '#99f6e4', fontWeight: 800 }}>
            <SlowWords>Payment complete</SlowWords>
          </p>
          <h2 id="lucky-reveal-title" style={{ margin: '0.6rem 0 1rem', fontSize: 'clamp(2rem, 7vw, 4rem)', lineHeight: 1 }}>
            <SlowWords startDelay={0.4}>Your lucky reveal is here</SlowWords>
          </h2>
          <p style={{ maxWidth: 560, lineHeight: 1.7, fontSize: '1.08rem' }}>
            <SlowWords startDelay={1.15}>Auroras and stars are revealing your 6 Pick, 7 Pick, lucky color, and lucky day of the week.</SlowWords>
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '1rem', marginTop: '1.4rem' }}>
            {reveal.games.map((game, gameIndex) => (
              <article key={game.name} style={{ padding: '1rem', borderRadius: 20, background: 'rgba(255, 255, 255, 0.12)', border: '1px solid rgba(255, 255, 255, 0.2)' }}>
                <h3 style={{ marginTop: 0, marginBottom: '0.75rem' }}>
                  <SlowWords startDelay={1.9 + gameIndex * 0.55}>{game.name}</SlowWords>
                </h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem' }}>
                  {game.numbers.map((number, numberIndex) => (
                    <span key={number} style={{ display: 'inline-grid', placeItems: 'center', width: 42, height: 42, borderRadius: '50%', background: '#fef3c7', color: '#0f172a', fontWeight: 900, boxShadow: '0 0 22px rgba(250, 204, 21, 0.65)', opacity: 0, transform: 'translateY(14px)', animation: 'lucky-word-rise 0.78s ease forwards', animationDelay: `${2.35 + gameIndex * 0.7 + numberIndex * 0.16}s` }}>
                      {number}
                    </span>
                  ))}
                </div>
              </article>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
            <div style={{ padding: '1rem', borderRadius: 18, background: 'rgba(153, 246, 228, 0.16)', border: '1px solid rgba(153, 246, 228, 0.34)' }}>
              <p style={{ margin: '0 0 0.35rem', color: '#99f6e4', fontWeight: 800 }}>Lucky color</p>
              <strong style={{ fontSize: '1.35rem' }}><SlowWords startDelay={4.15}>{reveal.luckyColor}</SlowWords></strong>
            </div>
            <div style={{ padding: '1rem', borderRadius: 18, background: 'rgba(253, 230, 138, 0.15)', border: '1px solid rgba(253, 230, 138, 0.34)' }}>
              <p style={{ margin: '0 0 0.35rem', color: '#fde68a', fontWeight: 800 }}>Lucky day</p>
              <strong style={{ fontSize: '1.35rem' }}><SlowWords startDelay={4.55}>{reveal.luckyDay}</SlowWords></strong>
            </div>
          </div>

          <button type="button" onClick={() => setIsOpen(false)} style={{ marginTop: '1.4rem', padding: '0.9rem 1.4rem', border: 0, borderRadius: 999, background: '#5eead4', color: '#042f2e', fontSize: '1rem', fontWeight: 900, cursor: 'pointer' }}>
            Add me to the Little Luck Map
          </button>
        </div>
      </section>
    </div>
  );
}
