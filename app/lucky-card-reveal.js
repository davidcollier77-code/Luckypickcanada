'use client';

import { useEffect, useRef, useState } from 'react';
import { LUCKY_CARDS, selectWeightedLuckyCard } from './lucky-card-data';
import LuckyCardShare from './lucky-card-share';

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
  const [isRevealed, setIsRevealed] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isAnnouncing, setIsAnnouncing] = useState(false);
  const [timeLeft, setTimeLeft] = useState('');
  const revealTimer = useRef(null);
  const announcementTimer = useRef(null);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date();
      const midnight = new Date();
      midnight.setHours(24, 0, 0, 0);
      const diff = midnight - now;

      const h = Math.floor(diff / (1000 * 60 * 60));
      const m = Math.floor((diff / 1000 / 60) % 60);
      const s = Math.floor((diff / 1000) % 60);
      setTimeLeft(`${h}h ${m}m ${s}s`);
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const today = localDateKey();
    try {
      const storedReveal = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || 'null');
      const storedCard = storedReveal?.revealDate === today ? findCard(storedReveal.cardId) : null;
      if (storedCard) {
        setSelectedCard(storedCard);
        setIsRevealed(true);
      }
    } catch (e) {
      window.localStorage.removeItem(STORAGE_KEY);
    }
    setIsReady(true);
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
    const card = selectWeightedLuckyCard();
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
    <div className="lucky-moment-shell">
      <div className="mb-6 flex flex-col items-center">
        {timeLeft && (
          <div className="text-center font-bold text-gray-700 mb-4 text-lg">
            Next card available in: {timeLeft}
          </div>
        )}

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
        <div className="lucky-moment-card" aria-live="polite">
          <div className="lucky-moment-card-face lucky-moment-card-back" aria-hidden={isRevealed}>
            <img src="/IMG_20260728_220305_112042.png" alt="Lucky Pick Canada" loading="lazy" />
          </div>
          <div className="lucky-moment-card-face lucky-moment-card-front" aria-hidden={!isRevealed}>
            {selectedCard && (selectedCard.image ? <img src={selectedCard.image} alt={selectedCard.title || 'Lucky Card'} className="lucky-moment-card-image" /> : <span>Lucky Pick Canada</span>)}
          </div>
        </div>
      </div>

      <div className="lucky-moment-actions mt-6">
        {isReady && isRevealed && selectedCard && (
          <>
            <div className="text-center p-6 mb-4 bg-white/80 rounded-xl shadow-sm border border-gray-100">
              <p className="text-xl italic text-gray-800 font-serif">"{selectedCard.quote || 'Your lucky moment awaits'}"</p>
            </div>
            <LuckyCardShare card={selectedCard} />
          </>
        )}
      </div>
    </div>
  );
}
