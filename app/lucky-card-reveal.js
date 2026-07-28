'use client';

import { useEffect, useState } from 'react';
import { LUCKY_CARDS, selectWeightedLuckyCard } from './lucky-card-data';

const STORAGE_KEY = 'lucky-pick-canada-todays-lucky-moment';

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
  const [isRevealed, setIsRevealed] = useState(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const today = localDateKey();

    try {
      const storedReveal = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || 'null');
      const storedCard = storedReveal?.revealDate === today ? findCard(storedReveal.cardId) : null;

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
  }, []);

  function revealLuckyMoment() {
    if (isRevealed) return;

    const card = selectWeightedLuckyCard();
    setSelectedCard(card);
    setIsRevealed(true);

    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ cardId: card.id, revealDate: localDateKey() }));
    } catch {
      // The card remains visible for this visit when browser storage is unavailable.
    }
  }

  return (
    <div className="lucky-moment-shell" aria-busy={!isReady}>
      <div className={`lucky-moment-stage${isRevealed ? ' is-revealed' : ''}`}>
        <div className="lucky-moment-card" aria-live="polite">
          <div className="lucky-moment-card-face lucky-moment-card-back" aria-hidden={isRevealed}>
            <span className="lucky-moment-card-mark">LPC</span>
            <span className="lucky-moment-card-label">Today’s Lucky Moment</span>
            <span className="lucky-moment-card-detail">A quiet daily ritual</span>
          </div>
          <div className="lucky-moment-card-face lucky-moment-card-front" aria-hidden={!isRevealed}>
            {selectedCard && (
              <div className="lucky-moment-card-content">
                {selectedCard.image ? (
                  <img src={selectedCard.image} alt={selectedCard.title} />
                ) : (
                  <div className="lucky-moment-artwork-placeholder" aria-hidden="true">
                    <span>Lucky Pick Canada</span>
                  </div>
                )}
                <p className="lucky-moment-eyebrow">Today’s collectible card</p>
                <h3>{selectedCard.title}</h3>
                {selectedCard.quote ? (
                  <p className="lucky-moment-quote">“{selectedCard.quote}”</p>
                ) : (
                  <p className="lucky-moment-quote">Your approved daily message will appear with this card.</p>
                )}
                {selectedCard.isPremium && <span className="lucky-moment-rarity">Premium card</span>}
              </div>
            )}
          </div>
        </div>
      </div>
      {isReady && !isRevealed && (
        <button type="button" className="lucky-moment-reveal-button" onClick={revealLuckyMoment}>
          Reveal Your Lucky Moment
        </button>
      )}
      <p className="lucky-moment-instruction">
        {isRevealed ? 'Your lucky moment is saved for today.' : 'One calm, positive moment awaits each day.'}
      </p>
    </div>
  );
}
