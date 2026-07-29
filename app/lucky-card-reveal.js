'use client';

import { useEffect, useRef, useState } from 'react';
import { LUCKY_CARDS, selectWeightedLuckyCard } from './lucky-card-data';
import { isLuckyCardTestModeEnabled } from './developer-tools/lucky-card-test-mode/toggle-card-test-mode';
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
  const isTestMode = isLuckyCardTestModeEnabled;
  const [selectedCard, setSelectedCard] = useState(null);
  const [isRevealed, setIsRevealed] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isAnnouncing, setIsAnnouncing] = useState(false);
  const revealTimer = useRef(null);
  const announcementTimer = useRef(null);

  useEffect(() => {
    const today = localDateKey();

    try {
      const storedReveal = JSON.parse(
        window.localStorage.getItem(STORAGE_KEY) || 'null'
      );

      const storedCard =
        !isTestMode && storedReveal?.revealDate === today
          ? findCard(storedReveal.cardId)
          : null;

      if (storedCard) {
        setSelectedCard(storedCard);
        setIsRevealed(true);
      } else {
        window.localStorage.removeItem(STORAGE_KEY);
      }
    } catch {
      window.localStorage.removeItem(STORAGE_KEY);
    }

    setIsReady(true);
  }, [isTestMode]);

  function showLuckyCard(card) {
    setIsAnnouncing(false);
    setIsGenerating(false);
    setIsRevealed(true);

    if (isTestMode) return;

    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          cardId: card.id,
          revealDate: localDateKey(),
        })
      );
    } catch {
      // The card remains visible for this visit when browser storage is unavailable.
    }
  }

  useEffect(() => () => {
    window.clearTimeout(revealTimer.current);
    window.clearTimeout(announcementTimer.current);
  }, []);

  function revealLuckyMoment() {
    if (isGenerating || (!isTestMode && isRevealed)) return;

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
  }

  return (
    <div className="lucky-moment-shell" aria-busy={!isReady || isGenerating}>
      <div className={`lucky-moment-stage lucky-moment-tier-${selectedCard?.tier || 'standard'}${isRevealed ? ' is-revealed' : ''}${isGenerating ? ' is-generating' : ''}${isAnnouncing ? ' is-announcing' : ''}`}>
        <div className="lucky-moment-card" aria-live="polite">
          <div
            className="lucky-moment-card-face lucky-moment-card-back"
            aria-hidden={isRevealed}
          >
            <img
              src="/IMG_20260728_220305_112042.png"
              alt=""
              loading="lazy"
            />
          </div>
          <div
            className="lucky-moment-card-face lucky-moment-card-front"
            aria-hidden={!isRevealed}
          >
            {selectedCard && (selectedCard.image ? (
              <img
                className="lucky-moment-card-image"
                src={selectedCard.image}
                alt={selectedCard.title}
                loading="lazy"
              />
            ) : (
              <div className="lucky-moment-artwork-placeholder" aria-hidden="true">
                <span>Lucky Pick Canada</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {isAnnouncing && selectedCard && TIER_MESSAGES[selectedCard.tier] && (
        <p className={`lucky-moment-tier-message lucky-moment-tier-message-${selectedCard.tier}`} role="status">
          {TIER_MESSAGES[selectedCard.tier]}
        </p>
      )}

      {isRevealed && selectedCard && (
        <div className="lucky-moment-details">
          {TIER_MESSAGES[selectedCard.tier] && <p className={`lucky-moment-tier-message lucky-moment-tier-message-${selectedCard.tier}`}>{TIER_MESSAGES[selectedCard.tier]}</p>}
          <p className="lucky-moment-eyebrow">Today’s collectible card</p>
          <h3>{selectedCard.title}</h3>
          <p className="lucky-moment-quote">
            “{selectedCard.quote || 'Your approved daily message will appear with this card.'}”
          </p>
        </div>
      )}

      <div className="lucky-moment-actions">
        {isReady && (!isRevealed || isTestMode) && (
          <button
            type="button"
            className="lucky-moment-reveal-button"
            onClick={revealLuckyMoment}
            disabled={isGenerating}
          >
            {isGenerating
              ? 'Generating Luck…'
              : (isRevealed ? 'Reveal Another Test Card' : 'Reveal Your Lucky Moment')}
          </button>
        )}
        {isReady && isRevealed && selectedCard && <LuckyCardShare card={selectedCard} />}
      </div>

      <p className="lucky-moment-instruction">
        {isGenerating
          ? 'Generating a little luck…'
          : (isRevealed
            ? (isTestMode
              ? 'Test mode is on. Reveal another card any time.'
              : 'Your lucky moment is saved for today.')
            : 'One calm, positive moment awaits each day.')}
      </p>
    </div>
  );
}
