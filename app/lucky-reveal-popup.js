'use client';
import {
  REVEAL_GLOW_PULSE_MS,
  playButtonClick,
  playRevealFinishChime,
  playRevealSparkle,
  preloadRevealFinishChime,
  preloadRevealGlowPulse,
  preloadRevealSparkle,
  startRevealGlowPulse,
  stopRevealGlowPulse,
} from './lib/audio';

import { useState, useEffect, useCallback } from 'react';
import LuckyRevealCelebration from './lucky-reveal-celebration';
import ShareLuckyPickButton from './share-lucky-pick-button';
import {
  getLuckyColorSwatch,
  getLuckyColorSwatchGradient,
  splitLuckyNumberRows,
} from './lucky-reveal-presentation';

// The finishing flourish: four gentle golden pulses ripple across the revealed
// number balls once every maple leaf has left the screen, then the balls return
// to their normal appearance. Kept here so the timer and the CSS agree.
const NUMBER_FINISH_PULSE_MS = 1050;
const NUMBER_FINISH_PULSES = 4;
const NUMBER_FINISH_STAGGER_MS = 120;
const NUMBER_FINISH_MAX_DELAY_MS = NUMBER_FINISH_STAGGER_MS * 6;
const NUMBER_FINISH_TOTAL_MS =
  NUMBER_FINISH_PULSE_MS * NUMBER_FINISH_PULSES + NUMBER_FINISH_MAX_DELAY_MS + 150;

// The first number ball starts its glow 0.9 s after it begins revealing 2.0 s
// after the popup opens. The atmosphere starts on that exact frame, so its swell
// peaks with the glow's brightest point, and it stops when the reveal closes.
const GLOW_START_MS = (2.0 + 0.9) * 1000;

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

// The homepage paints its sky through `.homepage-sky-backdrop`, which uses this
// same Milky Way / starfield artwork (AVIF, WebP, then JPEG). The reveal reuses
// that artwork only; the homepage's animated star canvases and shooting-star
// effects are deliberately not carried into this experience.
const MILKY_WAY_BACKDROP_IMAGE =
  "image-set(url('/assets/crystal-ball-bg-desktop.avif') type('image/avif'), url('/assets/crystal-ball-bg-desktop.webp') type('image/webp'), url('/assets/crystal-ball-bg-desktop.jpeg') type('image/jpeg'))";

const overlayStyle = {
  position: 'fixed',
  inset: 0,
  zIndex: 50,
  display: 'grid',
  placeItems: 'center',
  padding: '1rem',
  backgroundColor: '#02050a',
  backgroundImage: `linear-gradient(180deg, rgba(2, 6, 13, 0.1) 0%, rgba(2, 5, 11, 0.05) 34%, rgba(2, 5, 10, 0.1) 64%, rgba(1, 4, 8, 0.4) 100%), ${MILKY_WAY_BACKDROP_IMAGE}`,
  backgroundPosition: 'center, center 45%',
  backgroundSize: 'auto, cover',
  backgroundRepeat: 'no-repeat, no-repeat',
};

const dialogStyle = {
  position: 'relative',
  // The celebration layer sits above the panel, so the panel needs its own stack
  // level to keep the results and controls above the overlay background.
  zIndex: 2,
  width: 'min(100%, 720px)',
  maxHeight: '92vh',
  // The panel itself does not scroll: the body scrolls inside it, so the close
  // control stays pinned in the corner instead of scrolling out of reach.
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
  padding: 0,
  borderRadius: 28,
  color: '#fff7d6',
  border: '1px solid',
  // Matches the homepage's translucent card surface so the Milky Way shows through.
  backdropFilter: 'blur(16px)',
  WebkitBackdropFilter: 'blur(16px)',
};

const themeGlows = {
  'Aurora Green': {
    borderColor: 'rgba(52, 211, 153, 0.45)',
    boxShadow: '0 30px 80px rgba(0, 0, 0, 0.85), 0 0 50px rgba(16, 185, 129, 0.3), inset 0 1px 1px rgba(255, 255, 255, 0.1)',
  },
  'Star Gold': {
    borderColor: 'rgba(251, 191, 36, 0.55)',
    boxShadow: '0 30px 80px rgba(0, 0, 0, 0.85), 0 0 50px rgba(245, 158, 11, 0.4), inset 0 1px 1px rgba(255, 255, 255, 0.15)',
  },
  'Midnight Blue': {
    borderColor: 'rgba(96, 165, 250, 0.45)',
    boxShadow: '0 30px 80px rgba(0, 0, 0, 0.85), 0 0 50px rgba(59, 130, 246, 0.3), inset 0 1px 1px rgba(255, 255, 255, 0.1)',
  },
  'Lucky Red': {
    borderColor: 'rgba(248, 113, 113, 0.45)',
    boxShadow: '0 30px 80px rgba(0, 0, 0, 0.85), 0 0 50px rgba(239, 68, 68, 0.3), inset 0 1px 1px rgba(255, 255, 255, 0.1)',
  },
  'Moonlight Silver': {
    borderColor: 'rgba(226, 232, 240, 0.5)',
    boxShadow: '0 30px 80px rgba(0, 0, 0, 0.85), 0 0 50px rgba(226, 232, 240, 0.25), inset 0 1px 1px rgba(255, 255, 255, 0.1)',
  },
  'Northern Purple': {
    borderColor: 'rgba(167, 139, 250, 0.45)',
    boxShadow: '0 30px 80px rgba(0, 0, 0, 0.85), 0 0 50px rgba(139, 92, 246, 0.3), inset 0 1px 1px rgba(255, 255, 255, 0.1)',
  },
  'Sky Blue': {
    borderColor: 'rgba(34, 211, 238, 0.45)',
    boxShadow: '0 30px 80px rgba(0, 0, 0, 0.85), 0 0 50px rgba(6, 182, 212, 0.3), inset 0 1px 1px rgba(255, 255, 255, 0.1)',
  }
};

const closeButtonStyle = {
  position: 'absolute',
  top: 15,
  right: 15,
  // 44px keeps the control at the minimum reliable touch target; the visual
  // circle is unchanged apart from being 6px larger.
  width: 44,
  height: 44,
  // The reveal body sits in a positioned wrapper (z-index 2) that used to paint
  // over the button's lower half, so most of the circle ignored taps. The button
  // now sits above all panel content.
  zIndex: 3,
  padding: 0,
  lineHeight: 1,
  border: '1px solid rgba(255, 235, 160, 0.2)',
  borderRadius: '50%',
  background: 'rgba(15, 23, 42, 0.6)',
  color: '#fff7d6',
  fontSize: '1.2rem',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  touchAction: 'manipulation',
  WebkitTapHighlightColor: 'transparent',
  transition: 'all 0.2s ease',
};

function SlowWords({ children, startDelay = 0 }) {
  const words = String(children).split(' ');

  return words.map((word, index) => (
    <span
      key={`${word}-${index}`}
      className="lucky-reveal-word"
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
  // Set only after the celebration reports that the confetti has completely
  // disappeared, so the four pulses can never start over falling leaves.
  const [isNumberFinishActive, setIsNumberFinishActive] = useState(false);

  const closeReveal = useCallback(() => {
    setIsOpen(false);
    onClose?.();
  }, [onClose]);

  // The finishing chime starts while a few maple leaves are still falling, so the
  // cue closes the reveal instead of waiting for the last leaf.
  const startFinishingChime = useCallback(() => {
    if (typeof window === 'undefined') return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    playRevealFinishChime().catch((error) => {
      console.warn('Reveal finishing chime unavailable', error);
    });
  }, []);

  // Starts the finishing flourish: four gentle golden pulses on the number balls,
  // once the confetti has completely gone.
  const startNumberFinish = useCallback(() => {
    if (typeof window === 'undefined') return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    setIsNumberFinishActive(true);
  }, []);

  // Return the balls to their normal appearance once the fourth pulse is done.
  useEffect(() => {
    if (!isNumberFinishActive) return undefined;
    const timer = window.setTimeout(() => setIsNumberFinishActive(false), NUMBER_FINISH_TOTAL_MS);
    return () => window.clearTimeout(timer);
  }, [isNumberFinishActive]);

  useEffect(() => {
    if (!isOpen) return;
    
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        closeReveal();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [closeReveal, isOpen]);

  // Opening sparkle: the reveal previously appeared in silence, so it now opens
  // with one brief same-origin chime. Reduced-motion visitors keep the silent
  // reveal, matching the celebration's existing sound policy.
  useEffect(() => {
    if (!isOpen) return undefined;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;

    let isActive = true;
    preloadRevealSparkle()
      .then(() => {
        if (!isActive) return undefined;
        return playRevealSparkle();
      })
      .catch((error) => {
        console.warn('Reveal opening sparkle unavailable', error);
      });

    // Prepare the finishing shimmer now so it can play on its exact leaf cue.
    preloadRevealFinishChime().catch((error) => {
      console.warn('Reveal finishing chime unavailable', error);
    });

    return () => {
      isActive = false;
    };
  }, [isOpen]);

  // Pulsating atmosphere: started on the same frame as the number-ball glow and
  // stopped with the reveal, so the sound and the visual pulse share one start
  // and one end. Reduced-motion visitors keep the silent reveal.
  useEffect(() => {
    if (!isOpen) return undefined;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;

    preloadRevealGlowPulse().catch((error) => {
      console.warn('Reveal glow pulse unavailable', error);
    });

    const timer = window.setTimeout(() => {
      startRevealGlowPulse().catch((error) => {
        console.warn('Reveal glow pulse playback failed', error);
      });
    }, GLOW_START_MS);

    return () => {
      window.clearTimeout(timer);
      stopRevealGlowPulse();
    };
  }, [isOpen]);

  if (!isOpen || !reveal) {
    return null;
  }

  const colorDesc = colorDescriptions[reveal.luckyColor] || '';
  const dayDesc = dayDescriptions[reveal.luckyDay] || '';

  // Timing constants
  const startNumbersDelay = 2.0;
  const numItems = reveal.game.numbers.length;
  // Let colors card start after all numbers are fully animating
  const startColorsDelay = startNumbersDelay + (numItems * 0.35) + 0.6;
  const startDaysDelay = startColorsDelay + 0.6;
  // Celebrate once the final number has landed, not when the popup opens.
  const celebrationDelayMs = (startNumbersDelay + (numItems - 1) * 0.35 + 0.95) * 1000;

  const theme = themeGlows[reveal.luckyColor] || themeGlows['Aurora Green'];
  // The panel uses the same translucent black glass as the homepage cards, so the
  // Milky Way artwork and the celebration show through it. The lucky colour still
  // drives the border glow and the outer shadow.
  const dynamicDialogStyle = {
    ...dialogStyle,
    borderColor: theme.borderColor,
    boxShadow: theme.boxShadow,
    background:
      'linear-gradient(145deg, rgba(5, 11, 18, 0.7), rgba(7, 19, 27, 0.52) 52%, rgba(8, 7, 18, 0.62))',
  };

  // Six picks read as 3 + 3 and seven as 4 + 3, centred, in the stored order.
  const numberRows = splitLuckyNumberRows(reveal.game.numbers);
  const rowOffsets = numberRows.map((_, rowIndex) =>
    numberRows.slice(0, rowIndex).reduce((total, row) => total + row.length, 0),
  );
  const colorSwatch = getLuckyColorSwatch(reveal.luckyColor);
  const colorSwatchGradient = getLuckyColorSwatchGradient(reveal.luckyColor);

  return (
    <div role="presentation" style={overlayStyle}>
      <section role="dialog" aria-modal="true" aria-labelledby="lucky-reveal-title" style={dynamicDialogStyle}>
        <button type="button" aria-label="Close lucky reveal" onClick={closeReveal} style={closeButtonStyle} className="lucky-close-btn-hover" autoFocus>
          <span aria-hidden="true">×</span>
        </button>

        <style>{`
          @keyframes lucky-word-rise {
            to { opacity: 1; transform: translateY(0); }
          }

          @keyframes lucky-number-reveal {
            0% {
              opacity: 0;
              transform: translateY(24px) scale(0.5);
              filter: blur(2px);
              box-shadow: 0 0 0 rgba(250, 204, 21, 0);
            }
            70% {
              opacity: 1;
              transform: translateY(-6px) scale(1.18);
              filter: blur(0px);
              box-shadow: 0 0 35px rgba(250, 204, 21, 0.95), inset 0 1px 6px rgba(255, 255, 255, 0.4);
            }
            100% {
              opacity: 1;
              transform: translateY(0) scale(1);
              filter: blur(0px);
              box-shadow: 0 0 18px rgba(250, 204, 21, 0.5), inset 0 1px 4px rgba(255, 255, 255, 0.2);
            }
          }

          @keyframes lucky-glow-pulse {
            0% {
              box-shadow: 0 0 15px rgba(250, 204, 21, 0.45), inset 0 1px 4px rgba(255, 255, 255, 0.15);
              border-color: rgba(232, 186, 82, 0.8);
            }
            50% {
              box-shadow: 0 0 28px rgba(250, 204, 21, 0.85), inset 0 1px 6px rgba(255, 255, 255, 0.35);
              border-color: rgba(250, 204, 21, 1);
            }
            100% {
              box-shadow: 0 0 15px rgba(250, 204, 21, 0.45), inset 0 1px 4px rgba(255, 255, 255, 0.15);
              border-color: rgba(232, 186, 82, 0.8);
            }
          }

          @keyframes lucky-premium-fade-in {
            0% { opacity: 0; transform: translateY(18px) scale(0.96); }
            100% { opacity: 1; transform: translateY(0) scale(1); }
          }

          @keyframes lucky-reveal-shimmer-sweep {
            0% { transform: translateX(-120%); opacity: 0; }
            18% { opacity: 0.9; }
            100% { transform: translateX(120%); opacity: 0; }
          }

          @keyframes lucky-reveal-sparkle-twinkle {
            0%, 100% { opacity: 0.35; transform: scale(0.85) rotate(-8deg); }
            50% { opacity: 1; transform: scale(1.08) rotate(8deg); }
          }

          .lucky-reveal-number {
            width: clamp(2.5rem, 11.5vw, 3.25rem);
            height: clamp(2.5rem, 11.5vw, 3.25rem);
            font-size: clamp(1rem, 3.4vw, 1.2rem);
            position: relative;
          }

          /* The finishing flourish: a soft golden ring that pulses four times
             around each ball, rippling across the row. It is a pseudo-element
             so the ball's own animation is untouched. */
          .lucky-reveal-number::after {
            content: '';
            position: absolute;
            inset: -7px;
            border-radius: 999px;
            pointer-events: none;
            opacity: 0;
            box-shadow: 0 0 0 rgba(250, 204, 21, 0);
          }

          .lucky-reveal-numbers--finishing .lucky-reveal-number::after {
            animation: lucky-number-finish-glow ${NUMBER_FINISH_PULSE_MS}ms ease-in-out ${NUMBER_FINISH_PULSES};
            animation-delay: var(--finish-delay, 0s);
          }

          @keyframes lucky-number-finish-glow {
            0%, 100% { opacity: 0; box-shadow: 0 0 0 rgba(250, 204, 21, 0); }
            40% { opacity: 1; box-shadow: 0 0 20px 3px rgba(250, 204, 21, 0.62); }
          }

          .lucky-reveal-number-row {
            display: flex;
            justify-content: center;
            gap: 0.6rem;
            width: 100%;
          }

          .lucky-reveal-swatch {
            width: 1.65rem;
            height: 1.65rem;
            border-radius: 999px;
            flex: 0 0 auto;
            border: 1px solid rgba(255, 255, 255, 0.45);
          }

          .lucky-reveal-shimmer {
            position: absolute;
            inset: 0;
            pointer-events: none;
            opacity: 0;
            background: linear-gradient(115deg, transparent 32%, rgba(255, 240, 180, 0.22) 45%, rgba(255, 255, 255, 0.42) 50%, rgba(255, 240, 180, 0.22) 55%, transparent 68%);
            transform: translateX(-120%);
            animation: lucky-reveal-shimmer-sweep 2.4s cubic-bezier(0.22, 1, 0.36, 1) forwards;
          }

          .lucky-reveal-sparkle {
            position: absolute;
            top: 10px;
            right: 12px;
            width: 22px;
            height: 22px;
            opacity: 0;
            pointer-events: none;
            filter: drop-shadow(0 0 8px rgba(250, 204, 21, 0.65));
            animation: lucky-reveal-sparkle-twinkle 4.5s ease-in-out infinite;
          }

          @media (prefers-reduced-motion: reduce) {
            .lucky-reveal-word,
            .lucky-reveal-number,
            .lucky-reveal-card {
              animation: none !important;
              opacity: 1 !important;
              transform: none !important;
            }
            .lucky-reveal-shimmer { display: none !important; }
            .lucky-reveal-numbers--finishing .lucky-reveal-number::after {
              animation: none !important;
              opacity: 0 !important;
            }
            .lucky-reveal-sparkle {
              animation: none !important;
              opacity: 0.7 !important;
              transform: none !important;
            }
          }

          .lucky-close-btn-hover:hover {
            border-color: rgba(255, 235, 160, 0.6) !important;
            background: rgba(15, 23, 42, 0.9) !important;
            transform: scale(1.05);
          }

          .lucky-map-button-enhanced {
            transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1) !important;
            touch-action: manipulation;
          }
          .lucky-map-button-enhanced:hover {
            transform: translateY(-2px) scale(1.03) !important;
            box-shadow: 0 14px 30px rgba(245, 158, 11, 0.55), 0 6px 15px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.5) !important;
            filter: brightness(1.05);
          }
          .lucky-map-button-enhanced:active {
            transform: translateY(1px) scale(0.97) !important;
            box-shadow: 0 6px 15px rgba(245, 158, 11, 0.3), 0 2px 5px rgba(0, 0, 0, 0.4) !important;
            filter: brightness(0.95);
          }
        `}</style>

        <div
          className="lucky-reveal-scroll"
          style={{
            position: 'relative',
            zIndex: 2,
            flex: '1 1 auto',
            minHeight: 0,
            overflowY: 'auto',
            overflowX: 'hidden',
            overscrollBehavior: 'contain',
            padding: 'clamp(1.5rem, 5vw, 2.5rem)',
          }}
        >
          <p style={{ margin: 0, textTransform: 'uppercase', letterSpacing: 2.5, color: '#10b981', fontWeight: 900, fontSize: '0.85rem' }}>
            <SlowWords>Payment complete</SlowWords>
          </p>
          <h2 id="lucky-reveal-title" style={{ margin: '0.6rem 0 1.2rem', fontSize: 'clamp(2.1rem, 7.5vw, 4.2rem)', lineHeight: 1.1, color: '#fff' }}>
            <SlowWords startDelay={0.4}>Your lucky reveal is here</SlowWords>
          </h2>
          <p style={{ maxWidth: 560, lineHeight: 1.8, fontSize: '1.1rem', color: '#e2e8f0', marginBottom: '2rem' }}>
            <SlowWords startDelay={1.15}>The Milky Way and a sky full of stars are revealing your randomly generated lucky pick, lucky color, and lucky day of the week.</SlowWords>
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
            <span
              aria-hidden="true"
              className="lucky-reveal-shimmer"
              style={{ animationDelay: `${startNumbersDelay + numItems * 0.35 + 0.15}s` }}
            />
            <svg
              aria-hidden="true"
              focusable="false"
              viewBox="0 0 24 24"
              className="lucky-reveal-sparkle"
              style={{ animationDelay: `${startNumbersDelay + numItems * 0.35 + 0.45}s` }}
            >
              <defs>
                <linearGradient id="lucky-reveal-maple-gold" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#fff7d6" />
                  <stop offset="55%" stopColor="#facc15" />
                  <stop offset="100%" stopColor="#b8801f" />
                </linearGradient>
              </defs>
              <path
                d="M12 1.9l1.9 4.3 3.6-2.2-.9 4.1 4.2-.5-3 3.1 3 3.1-4.2-.5.9 4.1-3.6-2.2L12 20.1l-1.9-4.9-3.6 2.2.9-4.1-4.2.5 3-3.1-3-3.1 4.2.5-.9-4.1 3.6 2.2z"
                fill="url(#lucky-reveal-maple-gold)"
              />
            </svg>
            <h3 style={{ marginTop: 0, marginBottom: '0.9rem', color: '#f6edd4', fontFamily: 'serif', fontSize: '1.4rem', fontWeight: 800, letterSpacing: '0.5px' }}>
              <SlowWords startDelay={1.9}>{reveal.game.name}</SlowWords>
            </h3>
            <span
              aria-hidden="true"
              style={{ display: 'block', height: 1, margin: '0 0 1.1rem', background: 'linear-gradient(90deg, rgba(250, 204, 21, 0), rgba(250, 204, 21, 0.55), rgba(250, 204, 21, 0))' }}
            />
            <div
              className={`lucky-reveal-numbers${isNumberFinishActive ? ' lucky-reveal-numbers--finishing' : ''}`}
              style={{ display: 'grid', gap: '0.6rem', justifyItems: 'center' }}
            >
              {numberRows.map((row, rowIndex) => (
                <div key={`lucky-row-${rowIndex}`} className="lucky-reveal-number-row">
                  {row.map((number, columnIndex) => {
                    const numberIndex = rowOffsets[rowIndex] + columnIndex;

                    return (
                      <span
                        key={`${number}-${numberIndex}`}
                        className="lucky-reveal-number"
                        style={{
                          display: 'inline-grid',
                          placeItems: 'center',
                          borderRadius: '50%',
                          background: 'radial-gradient(circle at 35% 30%, #064e3b 0%, #022c22 70%, #011c15 100%)',
                          color: '#facc15',
                          fontWeight: 900,
                          fontFamily: 'monospace',
                          border: '2px solid #e8ba52',
                          textShadow: '0 1px 2px rgba(0, 0, 0, 0.8)',
                          opacity: 0,
                          transform: 'translateY(24px) scale(0.5)',
                          animationName: 'lucky-number-reveal, lucky-glow-pulse',
                          // The glow cycle and the atmosphere share REVEAL_GLOW_PULSE_MS.
                          animationDuration: `0.9s, ${REVEAL_GLOW_PULSE_MS / 1000}s`,
                          animationTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1), ease-in-out',
                          animationDelay: `${startNumbersDelay + numberIndex * 0.35}s, ${startNumbersDelay + numberIndex * 0.35 + 0.9}s`,
                          animationIterationCount: '1, infinite',
                          animationDirection: 'normal, alternate',
                          animationFillMode: 'forwards, none',
                          // Staggers the four finishing pulses across the row.
                          '--finish-delay': `${numberIndex * 0.12}s`,
                        }}
                      >
                        {number}
                      </span>
                    );
                  })}
                </div>
              ))}
            </div>
          </article>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '1.25rem', marginTop: '1.25rem' }}>
            <div className="lucky-reveal-card" style={{
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
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.5rem' }}>
                <span
                  aria-hidden="true"
                  className="lucky-reveal-swatch"
                  style={{
                    background: colorSwatchGradient,
                    boxShadow: `0 0 14px ${colorSwatch.ring}`,
                  }}
                />
                <strong style={{ fontSize: '1.45rem', display: 'block', color: '#fff', textShadow: '0 1px 4px rgba(0,0,0,0.5)' }}>{reveal.luckyColor}</strong>
              </div>
              {colorDesc && <p style={{ margin: 0, fontSize: '0.92rem', color: '#94a3b8', lineHeight: 1.5 }}>{colorDesc}</p>}
            </div>

            <div className="lucky-reveal-card" style={{
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

          <button
            type="button"
            onClick={() => { playButtonClick(); closeReveal(); }}
            className="lucky-map-button-enhanced gold-3d-btn"
            style={{
              marginTop: '1.8rem',
              padding: '1.1rem 2.2rem',
              border: '1px solid #fff2a8',
              borderRadius: 999,
              background: 'linear-gradient(180deg, #fff2a8 0%, #fbe59a 14%, #e8c970 38%, #dcae4e 62%, #c8942c 82%, #b8801f 100%)',
              color: '#1c1200',
              boxShadow: '0 3px 0 #8a550c, 0 6px 0 rgba(95, 55, 5, 0.45), 0 10px 25px rgba(138, 85, 12, 0.34), 0 4px 10px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.4)',
              fontSize: '1.05rem',
              fontWeight: 900,
              cursor: 'pointer',
              width: '100%',
              maxWidth: '360px',
              textAlign: 'center',
              display: 'inline-block'
            }}
          >
            <span className="gold-cta-emoji" aria-hidden="true">📍</span>Add me to the Little Luck Map
          </button>
        </div>
      </section>

      {/* Behind the panel (z-index 1 vs 2) so the decorative pile can never cover a
          number, the copy, the share control, or the map button. */}
      <LuckyRevealCelebration
        startDelayMs={celebrationDelayMs}
        onConfettiFinishing={startFinishingChime}
        onConfettiSettled={startNumberFinish}
      />
    </div>
  );
}
