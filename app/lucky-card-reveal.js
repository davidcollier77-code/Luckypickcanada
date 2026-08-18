'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { LUCKY_CARDS, selectWeightedLuckyCard } from './lucky-card-data';
import LuckyCardShare from './lucky-card-share';
import MidnightCountdown from '../components/midnight-countdown';

const STORAGE_KEY = 'lucky-pick-canada-todays-lucky-moment';
const REVEAL_TIMINGS = {
  standard: { anticipation: 1500, announcement: 0 },
  premium: { anticipation: 2600, announcement: 900 },
  flagship: { anticipation: 3600, announcement: 1200 },
};

function localDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function findCard(cardId) {
  return LUCKY_CARDS.find((card) => card.id === cardId) ?? null;
}

export default function LuckyCardReveal() {
  const [selectedCard, setSelectedCard] = useState(null);
  const [previousCardId, setPreviousCardId] = useState(null);
  const [isRevealed, setIsRevealed] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isAnnouncing, setIsAnnouncing] = useState(false);
  const [imageError, setImageError] = useState(false);
  const revealTimer = useRef(null);
  const announcementTimer = useRef(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const today = localDateKey();
      try {
        const storedReveal = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || 'null');
        if (storedReveal) {
          if (storedReveal.revealDate === today) {
            const storedCard = findCard(storedReveal.cardId);
            if (storedCard) {
              setSelectedCard(storedCard);
              setIsRevealed(true);
            }
          } else {
            setPreviousCardId(storedReveal.cardId);
          }
        }
      } catch (e) {
        window.localStorage.removeItem(STORAGE_KEY);
      }
      setIsReady(true);
    }
  }, []);

  function showLuckyCard(card) {
    setIsAnnouncing(false);
    setIsGenerating(false);
    setIsRevealed(true);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({
        cardId: card.id,
        revealDate: localDateKey(),
      }));
    } catch (e) {}
  }

  const triggerCardDraw = () => {
    window.clearTimeout(revealTimer.current);
    window.clearTimeout(announcementTimer.current);
    const card = selectWeightedLuckyCard(previousCardId);
    const timing = REVEAL_TIMINGS[card.tier] || REVEAL_TIMINGS.standard;
    setSelectedCard(card);
    setIsRevealed(false);
    setIsAnnouncing(false);
    setIsGenerating(true);
    setImageError(false);

    revealTimer.current = window.setTimeout(() => {
      if (!timing.announcement) {
        showLuckyCard(card);
        return;
      }
      setIsAnnouncing(true);
      announcementTimer.current = window.setTimeout(() => showLuckyCard(card), timing.announcement);
    }, timing.anticipation);
  };

  return (
    <div className="relative w-full overflow-hidden flex flex-col items-center py-6 space-y-4 select-none">
      <div className="lucky-moment-shell relative z-10 w-full max-w-sm flex flex-col items-center justify-center">

        <div className="mb-3 flex flex-col items-center w-full relative z-50 pointer-events-auto top-header">
          <div className="text-center font-bold text-gray-700 mb-4 text-lg">
            Resets in: <MidnightCountdown fallback="--h --m --s" />
          </div>

          {isReady && !isRevealed && !selectedCard && (
            <button
              type="button"
              onClick={triggerCardDraw}
              disabled={isRevealed || isGenerating}
              className={`lucky-moment-reveal-button ${isGenerating ? 'scale-95 opacity-80' : ''}`}
            >
              {isGenerating ? 'Revealing...' : 'Reveal Your Lucky Moment'}
            </button>
          )}
        </div>

        {/* ISOLATE creates a strict boundary so layers cannot cross over each other */}
        <div className={`lucky-moment-stage ${
          selectedCard?.tier === 'flagship' ? 'lucky-moment-tier-flagship' :
          selectedCard?.tier === 'premium' ? 'lucky-moment-tier-premium' :
          'lucky-moment-tier-standard'
        } ${isGenerating ? 'is-generating' : ''} ${isRevealed ? 'is-revealed' : ''} relative isolate z-[100] max-w-full`}>
          <div className="card-stage-container relative w-full p-4 sm:p-6 flex items-center justify-center overflow-hidden" style={{ perspective: '1200px', zIndex: 999 }}>
            
            {/* BACKGROUND AURORAS: Forced to the absolute back */}
            <div className="pointer-events-none absolute inset-0 overflow-hidden z-[-10]">
              <div className="hd-aurora-bg absolute -top-[20%] left-1/2 -translate-x-1/2 w-[600px] sm:w-[900px] h-[600px] sm:h-[900px] rounded-full opacity-80 mix-blend-screen pointer-events-none"></div>
              <div className="hd-aurora-accent absolute top-[10%] right-[-10%] w-[350px] h-[350px] rounded-full opacity-60 mix-blend-screen pointer-events-none"></div>
            </div>

            {/* UNDERGLOW: Forced behind the card */}
            <div id="card-underglow" className={`tier-underglow tier-${selectedCard?.tier === 'premium' ? 'premium' : selectedCard?.tier === 'flagship' ? 'flagship' : 'standard'} absolute -inset-4 rounded-3xl pointer-events-none z-[-5]`}></div>

            {/* CARD WRAPPER: Forced to the absolute front */}
            <div
              role="button"
              aria-pressed={isRevealed}
              onClick={() => setIsRevealed((s) => !s)}
              className="flip-card-wrapper flex-shrink-0 relative z-10 w-[280px] h-[400px] mx-auto cursor-pointer [WebkitTapHighlightColor:transparent]"
              style={{ perspective: "1200px", WebkitPerspective: "1200px" }}
            >
              <div
                className="relative w-full h-full select-none"
                style={{
                  minWidth: "280px",
                  minHeight: "400px",
                  backgroundColor: "transparent",
                }}
              >
                <div
                  className="absolute inset-0"
                  style={{
                    transformStyle: "preserve-3d",
                    WebkitTransformStyle: "preserve-3d",
                    transition: "transform 700ms cubic-bezier(0.2, 0.8, 0.2, 1)",
                    transform: isRevealed ? "rotateY(180deg)" : "rotateY(0deg)",
                    WebkitTransform: isRevealed ? "rotateY(180deg)" : "rotateY(0deg)",
                  }}
                >
                  {/* CELEBRATORY PULSE */}
                  {isRevealed && selectedCard && (selectedCard.tier === 'premium' || selectedCard.tier === 'flagship') && (
                    <div className="celebratory-pulse"></div>
                  )}

                  {/* Front face */}
                  <div
                    className="absolute inset-0 rounded-lg overflow-hidden shadow-lg"
                    style={{
                      backfaceVisibility: "hidden",
                      WebkitBackfaceVisibility: "hidden",
                      transform: "rotateY(0deg)",
                      WebkitTransform: "rotateY(0deg)",
                    }}
                  >
                    <div className="relative w-full h-full">
                      <Image alt="Card front" className="object-contain" fill quality={100} src="/IMG_20260728_220305_112042.png"/>
                    </div>
                  </div>

                  {/* Back face */}
                  <div
                    className="absolute inset-0 rounded-lg overflow-hidden"
                    style={{
                      backfaceVisibility: "hidden",
                      WebkitBackfaceVisibility: "hidden",
                      transform: "rotateY(180deg)",
                      WebkitTransform: "rotateY(180deg)",
                    }}
                  >
                    <div className="relative w-full h-full">
                      {selectedCard && (selectedCard.image && !imageError ? (
                        <Image alt={selectedCard.title || 'Revealed Card'} className="object-contain" fill quality={100} src={selectedCard.image} onError={() => setImageError(true)} />
                      ) : <span className="absolute inset-0 flex items-center justify-center z-10 text-white">Lucky Pick 🍁 Canada.ca</span>)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="lucky-moment-actions mt-6 relative z-50 w-full max-w-md flex flex-col items-center gap-3 pb-4 pointer-events-auto footer-action">
          {isReady && isRevealed && selectedCard && (
            <>
              <div className="glass-quote-container text-center p-6 mb-4 bg-white/80 rounded-xl shadow-sm border border-gray-100">
                <p className="text-xl italic text-gray-800 font-serif">"{selectedCard.quote || 'Your lucky moment awaits'}"</p>
              </div>
              <LuckyCardShare card={selectedCard} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
