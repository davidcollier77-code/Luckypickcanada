'use client';

import { useEffect, useRef, useState } from 'react';
import { LUCKY_CARDS, selectWeightedLuckyCard } from './lucky-card-data';
import LuckyCardShare from './lucky-card-share';
import MidnightCountdown from '../components/midnight-countdown';

const STORAGE_KEY = 'lucky-pick-canada-todays-lucky-moment';
const REVEAL_TIMINGS = {
  standard: { anticipation: 1500, announcement: 0 },
  premium: { anticipation: 2600, announcement: 900 },
  flagship: { anticipation: 3600, announcement: 1200 },
};

const TIER_MESSAGES = {
  premium: '✨ You discovered a Premium Lucky Card! ✨',
  flagship: '⭐ Congratulations! You discovered the rarest Lucky Card! ⭐',
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
  const isTestMode = false;

  const [selectedCard, setSelectedCard] = useState(null);
  const [previousCardId, setPreviousCardId] = useState(null);
  const [isRevealed, setIsRevealed] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isAnnouncing, setIsAnnouncing] = useState(false);
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
            // It's a previous day, store the old card ID so we don't draw it again today
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
    <div className="cosmic-aurora-background">
      <div className="lucky-moment-shell">
        <div className="mb-6 flex flex-col items-center w-full relative z-10 pointer-events-auto">
          <div className="text-center font-bold text-gray-700 mb-4 text-lg">
            Resets in: <MidnightCountdown fallback="--h --m --s" />
          </div>

          {isReady && !isRevealed && !isGenerating && !selectedCard && (
            <button
              type="button"
              onClick={triggerCardDraw}
              disabled={isRevealed || isGenerating}
              className="lucky-moment-reveal-button"
            >
              Reveal Your Lucky Moment
            </button>
          )}
        </div>

        <div className={`lucky-moment-stage lucky-moment-tier-${selectedCard?.tier || 'standard'}${isRevealed ? ' is-revealed' : ''}${isGenerating ? ' is-generating' : ''}${isAnnouncing ? ' is-announcing' : ''}`}>
          <div className={`card-stage-container tier-${selectedCard?.tier || 'standard'}`}>
            <div className={`flip-card-wrapper ${isRevealed ? 'is-revealed' : ''}`}>
              <div className="lucky-moment-card" aria-live="polite">
                <div className="lucky-moment-card-face lucky-moment-card-back" aria-hidden={isRevealed}>
                  <div className="card-reveal-wrapper">
                    <div className="card-aura-glow"></div>
                    <img src="/IMG_20260728_220305_112042.png" alt="Lucky Pick Canada" loading="lazy" className="card-image" />
                  </div>
                </div>
                <div className="lucky-moment-card-face lucky-moment-card-front" aria-hidden={!isRevealed}>
                  {selectedCard && (selectedCard.image ? (
                    <div className="card-reveal-wrapper">
                      <div className="card-aura-glow"></div>
                      <img src={selectedCard.image} alt={selectedCard.title || 'Lucky Card'} className="lucky-moment-card-image card-image" />
                    </div>
                  ) : <span>Lucky Pick 🍁 Canada.ca</span>)}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="lucky-moment-actions mt-6 relative z-10 pointer-events-auto">
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
