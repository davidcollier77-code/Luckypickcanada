'use client';

import { useState } from 'react';
import ShareLuckyPickButton from './share-lucky-pick-button';

const colorDescriptions = {
  'Aurora Green': 'Vibrant and shifting, like the northern lights dancing over the boreal forest.',
  'Star Gold': 'Radiant and bright, like a guiding star over the vast Canadian prairies.',
  'Midnight Blue': 'Deep and peaceful, like the silent night sky over Jasper National Park.',
  'Lucky Red': 'Warm, bold, and resilient, like a maple leaf in autumn.',
  'Moonlight Silver': 'Glistening and pure, like fresh mountain snow under a full winter moon.',
  'Northern Purple': 'Majestic and mysterious, like twilight cascading across the Yukon hills.',
  'Sky Blue': 'Clear and boundless, like the endless summer sky over the Great Lakes.'
};

const dayDescriptions = {
  'Monday': 'A day of fresh paths, like starting a new trail through pristine wilderness.',
  'Tuesday': 'A day of quiet momentum, like a canoe gliding across a calm, mist-shrouded lake.',
  'Wednesday': 'A day of balanced strength, like a towering pine standing resilient in the forest.',
  'Thursday': 'A day of warm expectation, like the golden afternoon sun filtering through birch trees.',
  'Friday': 'A day of joyful transition, like the lively crackle of a warm campfire under the stars.',
  'Saturday': 'A day of spacious freedom, like the open road winding through the majestic Rockies.',
  'Sunday': 'A day of quiet reflection, like the gentle lapping of waves on a quiet Atlantic shore.'
};

const overlayStyle = {
  position: 'fixed',
  inset: 0,
  zIndex: 50,
  display: 'grid',
  placeItems: 'center',
  padding: '1rem',
  background: 'rgba(2, 4, 8, 0.90)',
  backdropFilter: 'blur(12px)',
};

const dialogStyle = {
  position: 'relative',
  width: 'min(100%, 720px)',
  maxHeight: '92vh',
  overflow: 'auto',
  padding: 'clamp(1.5rem, 5vw, 2.5rem)',
  borderRadius: 28,
  border: '1px solid rgba(250, 204, 21, 0.25)',
  color: '#fff7d6',
  background: 'radial-gradient(circle at 50% -20%, rgba(16, 185, 129, 0.15) 0%, transparent 60%), radial-gradient(circle at 10% 20%, rgba(59, 130, 246, 0.12) 0%, transparent 40%), linear-gradient(180deg, #020617 0%, #030712 100%)',
  boxShadow: '0 30px 80px rgba(0, 0, 0, 0.8), 0 0 50px rgba(16, 185, 129, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
};

const closeButtonStyle = {
  position: 'absolute',
  top: 18,
  right: 18,
  width: 38,
  height: 38,
  border: '1px solid rgba(255, 235, 160, 0.2)',
  borderRadius: '50%',
  background: 'rgba(15, 23, 42, 0.6)',
  color: '#fff7d6',
  fontSize: '1.2rem',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'all 0.2s ease',
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

export default function LuckyRevealPopup({ reveal, onClose }) {
  const [isOpen, setIsOpen] = useState(Boolean(reveal));

  function closeReveal() {
    setIsOpen(false);
    onClose?.();
  }

  if (!isOpen || !reveal) {
    return null;
  }

  const starPositions = [
    { top: '8%', left: '15%', size: '2px', delay: '0.2s', duration: '4s' },
    { top: '15%', left: '82%', size: '1.5px', delay: '1.5s', duration: '5s' },
    { top: '24%', left: '48%', size: '3px', delay: '0.7s', duration: '3s' },
    { top: '42%', left: '12%', size: '1.2px', delay: '2.1s', duration: '6s' },
    { top: '58%', left: '88%', size: '2.5px', delay: '1.1s', duration: '4.5s' },
    { top: '72%', left: '25%', size: '1.8px', delay: '3.2s', duration: '5.5s' },
    { top: '85%', left: '76%', size: '2px', delay: '0.5s', duration: '4.2s' },
    { top: '33%', left: '92%', size: '2.2px', delay: '1.8s', duration: '3.8s' },
    { top: '65%', left: '5%', size: '1.5px', delay: '2.7s', duration: '5.2s' },
  ];

  const colorDesc = colorDescriptions[reveal.luckyColor] || '';
  const dayDesc = dayDescriptions[reveal.luckyDay] || '';

  // Timing constants
  const startNumbersDelay = 2.0;
  const numItems = reveal.game.numbers.length;
  // Let colors card start after all numbers are fully animating
  const startColorsDelay = startNumbersDelay + (numItems * 0.22) + 0.3;
  const startDaysDelay = startColorsDelay + 0.5;

  return (
    <div role="presentation" style={overlayStyle}>
      <section role="dialog" aria-modal="true" aria-labelledby="lucky-reveal-title" style={dialogStyle}>
        <button type="button" aria-label="Close lucky reveal" onClick={closeReveal} style={closeButtonStyle} className="lucky-close-btn-hover">
          ×
        </button>

        <style>{`
          @keyframes lucky-word-rise {
            to { opacity: 1; transform: translateY(0); }
          }

          @keyframes lucky-aurora-glow-1 {
            0% { transform: translate(-30%, -20%) scale(1) rotate(0deg); opacity: 0.25; }
            50% { transform: translate(-10%, -10%) scale(1.15) rotate(15deg); opacity: 0.45; }
            100% { transform: translate(-30%, -20%) scale(1) rotate(0deg); opacity: 0.25; }
          }

          @keyframes lucky-aurora-glow-2 {
            0% { transform: translate(20%, -30%) scale(1.2) rotate(0deg); opacity: 0.2; }
            50% { transform: translate(5%, -15%) scale(1) rotate(-10deg); opacity: 0.38; }
            100% { transform: translate(20%, -30%) scale(1.2) rotate(0deg); opacity: 0.2; }
          }

          @keyframes lucky-twinkle {
            0%, 100% { opacity: 0.15; transform: scale(0.8); }
            50% { opacity: 1; transform: scale(1.2); }
          }

          @keyframes lucky-premium-fade-in {
            0% { opacity: 0; transform: translateY(18px) scale(0.96); }
            100% { opacity: 1; transform: translateY(0) scale(1); }
          }

          .lucky-close-btn-hover:hover {
            border-color: rgba(255, 235, 160, 0.6) !important;
            background: rgba(15, 23, 42, 0.9) !important;
            transform: scale(1.05);
          }

          .lucky-map-button:hover {
            transform: translateY(-2px) scale(1.02);
            box-shadow: 0 12px 35px rgba(250, 204, 21, 0.5), 0 0 30px rgba(250, 204, 21, 0.3) !important;
            border-color: rgba(250, 204, 21, 1) !important;
          }

          .lucky-map-button:active {
            transform: translateY(0) scale(0.98);
            box-shadow: 0 6px 20px rgba(250, 204, 21, 0.4), 0 0 15px rgba(250, 204, 21, 0.2) !important;
          }
        `}</style>

        <div aria-hidden="true" style={{ position: 'absolute', inset: 0, overflow: 'hidden', borderRadius: 28, pointerEvents: 'none' }}>
          <div style={{
            position: 'absolute',
            top: '-20%',
            left: '-20%',
            width: '100%',
            height: '100%',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(16, 185, 129, 0.3) 0%, rgba(45, 212, 191, 0.1) 50%, transparent 80%)',
            filter: 'blur(45px)',
            animation: 'lucky-aurora-glow-1 14s ease-in-out infinite'
          }} />

          <div style={{
            position: 'absolute',
            top: '-30%',
            right: '-20%',
            width: '100%',
            height: '100%',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(139, 92, 246, 0.25) 0%, rgba(59, 130, 246, 0.1) 60%, transparent 80%)',
            filter: 'blur(50px)',
            animation: 'lucky-aurora-glow-2 18s ease-in-out infinite'
          }} />

          {starPositions.map((star, index) => (
            <span
              key={index}
              style={{
                position: 'absolute',
                top: star.top,
                left: star.left,
                width: star.size,
                height: star.size,
                borderRadius: '50%',
                background: '#fff8e7',
                boxShadow: '0 0 6px #fff, 0 0 12px rgba(250, 204, 21, 0.5)',
                animation: `lucky-twinkle ${star.duration} ease-in-out infinite`,
                animationDelay: star.delay,
              }}
            />
          ))}
        </div>

        <div style={{ position: 'relative', zIndex: 2 }}>
          <p style={{ margin: 0, textTransform: 'uppercase', letterSpacing: 2.5, color: '#10b981', fontWeight: 900, fontSize: '0.85rem' }}>
            <SlowWords>Payment complete</SlowWords>
          </p>
          <h2 id="lucky-reveal-title" style={{ margin: '0.6rem 0 1.2rem', fontSize: 'clamp(2.1rem, 7.5vw, 4.2rem)', lineHeight: 1.1, color: '#fff' }}>
            <SlowWords startDelay={0.4}>Your lucky reveal is here</SlowWords>
          </h2>
          <p style={{ maxWidth: 560, lineHeight: 1.8, fontSize: '1.1rem', color: '#e2e8f0', marginBottom: '2rem' }}>
            <SlowWords startDelay={1.15}>Auroras and stars are revealing your randomly generated lucky pick, lucky color, and lucky day of the week.</SlowWords>
          </p>

          <article style={{
            padding: '1.5rem',
            borderRadius: 24,
            background: 'linear-gradient(145deg, rgba(15, 23, 42, 0.5), rgba(6, 78, 59, 0.15))',
            border: '1px solid rgba(250, 204, 21, 0.2)',
            boxShadow: '0 15px 35px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
            marginTop: '1.5rem',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <h3 style={{ marginTop: 0, marginBottom: '1rem', color: '#f6edd4', fontFamily: 'serif', fontSize: '1.4rem', fontWeight: 800, letterSpacing: '0.5px' }}>
              <SlowWords startDelay={1.9}>{reveal.game.name}</SlowWords>
            </h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.65rem' }}>
              {reveal.game.numbers.map((number, numberIndex) => (
                <span
                  key={number}
                  style={{
                    display: 'inline-grid',
                    placeItems: 'center',
                    width: 48,
                    height: 48,
                    borderRadius: '50%',
                    background: 'radial-gradient(circle at 35% 30%, #064e3b 0%, #022c22 70%, #011c15 100%)',
                    color: '#facc15',
                    fontWeight: 900,
                    fontSize: '1.15rem',
                    fontFamily: 'monospace',
                    border: '2px solid #e8ba52',
                    boxShadow: '0 4px 15px rgba(0, 0, 0, 0.5), inset 0 1px 4px rgba(255, 255, 255, 0.15), 0 0 12px rgba(232, 186, 82, 0.25)',
                    textShadow: '0 1px 2px rgba(0, 0, 0, 0.8)',
                    opacity: 0,
                    transform: 'translateY(14px)',
                    animation: 'lucky-word-rise 0.78s ease forwards',
                    animationDelay: `${startNumbersDelay + numberIndex * 0.22}s`
                  }}
                >
                  {number}
                </span>
              ))}
            </div>
          </article>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '1.25rem', marginTop: '1.25rem' }}>
            <div style={{
              padding: '1.25rem',
              borderRadius: 20,
              background: 'rgba(16, 185, 129, 0.08)',
              border: '1px solid rgba(52, 211, 153, 0.25)',
              boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15)',
              opacity: 0,
              animation: 'lucky-premium-fade-in 0.85s cubic-bezier(0.16, 1, 0.3, 1) forwards',
              animationDelay: `${startColorsDelay}s`
            }}>
              <p style={{ margin: '0 0 0.5rem', color: '#34d399', fontWeight: 800, fontSize: '0.85rem', letterSpacing: '1px', textTransform: 'uppercase' }}>Lucky color</p>
              <strong style={{ fontSize: '1.45rem', display: 'block', color: '#fff', marginBottom: '0.5rem', textShadow: '0 1px 4px rgba(0,0,0,0.5)' }}>{reveal.luckyColor}</strong>
              {colorDesc && <p style={{ margin: 0, fontSize: '0.92rem', color: '#94a3b8', lineHeight: 1.5 }}>{colorDesc}</p>}
            </div>

            <div style={{
              padding: '1.25rem',
              borderRadius: 20,
              background: 'rgba(253, 230, 138, 0.08)',
              border: '1px solid rgba(253, 230, 138, 0.22)',
              boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15)',
              opacity: 0,
              animation: 'lucky-premium-fade-in 0.85s cubic-bezier(0.16, 1, 0.3, 1) forwards',
              animationDelay: `${startDaysDelay}s`
            }}>
              <p style={{ margin: '0 0 0.5rem', color: '#fde68a', fontWeight: 800, fontSize: '0.85rem', letterSpacing: '1px', textTransform: 'uppercase' }}>Lucky day</p>
              <strong style={{ fontSize: '1.45rem', display: 'block', color: '#fff', marginBottom: '0.5rem', textShadow: '0 1px 4px rgba(0,0,0,0.5)' }}>{reveal.luckyDay}</strong>
              {dayDesc && <p style={{ margin: 0, fontSize: '0.92rem', color: '#94a3b8', lineHeight: 1.5 }}>{dayDesc}</p>}
            </div>
          </div>

          <ShareLuckyPickButton reveal={reveal} />

          <button type="button" onClick={closeReveal} style={{ marginTop: '1.8rem', padding: '1rem 1.6rem', border: '1px solid rgba(255, 235, 160, 0.6)', borderRadius: 999, background: 'linear-gradient(135deg, #fff8c8 0%, #f9d86c 22%, #facc15 48%, #b7791f 100%)', color: '#071225', boxShadow: '0 8px 24px rgba(250, 204, 21, 0.3)', fontSize: '1.05rem', fontWeight: 900, cursor: 'pointer', transition: 'all 0.2s ease' }}>
            Add me to the Little Luck Map
          </button>
        </div>
      </section>
    </div>
  );
}
