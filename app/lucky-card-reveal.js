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
    setIsGenerating(true);
    setImageError(false);

    revealTimer.current = window.setTimeout(() => {
      showLuckyCard(card);
    }, timing.anticipation);
  };

  return (
    <div className="w-full max-w-sm mx-auto flex flex-col items-center px-4 py-4 space-y-6 select-none">
      
      {/* 1. Countdown & Draw Button */}
      <div className="w-full flex flex-col items-center text-center space-y-2">
        <div className="text-lg font-bold text-gray-300">
          Resets in: <MidnightCountdown fallback="--h --m --s"/>
        </div>

        {isReady && !isRevealed && !selectedCard && (
          <button
            type="button"
            onClick={triggerCardDraw}
            disabled={isRevealed || isGenerating}
            className="mt-2 px-6 py-2.5 rounded-full bg-gradient-to-r from-amber-400 to-amber-600 text-slate-950 font-bold text-base shadow-lg hover:brightness-110 active:scale-95 transition-all"
          >
            {isGenerating ? 'Revealing...' : 'Reveal Today’s Luck'}
          </button>
        )}
      </div>

      {/* 2. 3D Card Stage */}
      <div className="w-full flex justify-center py-2 flex-shrink-0">
        <div
          role="button"
          aria-pressed={isRevealed}
          onClick={() => isRevealed && setIsRevealed((s) => !s)}
          className="relative w-[280px] h-[400px] cursor-pointer mx-auto flex-shrink-0 [WebkitTapHighlightColor:transparent]"
          style={{ perspective: '1200px' }}
        >
          <div
            className="w-full h-full relative"
            style={{
              transformStyle: 'preserve-3d',
              transition: 'transform 700ms cubic-bezier(0.2, 0.8, 0.2, 1)',
              transform: isRevealed ? 'rotateY(180deg)' : 'rotateY(0deg)',
            }}
          >
            {/* Front Face (Card Back Design) */}
            <div
              className="absolute inset-0 bg-slate-950 rounded-2xl overflow-hidden shadow-2xl border border-amber-400/20"
              style={{ backfaceVisibility: 'hidden' }}
            >
              <div className="relative w-full h-full">
                <Image alt="Card Back Face" className="object-contain" fill priority quality={100} src="/IMG_20260728_220305_112042.png"/>
              </div>
            </div>

            {/* Back Face (Revealed Artwork) */}
            <div
              className="absolute inset-0 bg-slate-950 rounded-2xl overflow-hidden shadow-2xl border border-amber-400/20"
              style={{
                backfaceVisibility: 'hidden',
                transform: 'rotateY(180deg)',
              }}
            >
              <div className="relative w-full h-full">
                {selectedCard && selectedCard.image && !imageError ? (
                  <Image alt={selectedCard.title || 'Revealed Card'} className="object-contain" fill onError={() => setImageError(true)} priority quality={100} src={selectedCard.image} />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-center p-4 text-amber-200">
                    Lucky Pick 🍁 Canada.ca
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Quote & Share Actions (Strictly Stacked Below) */}
      {isReady && isRevealed && selectedCard && (
        <div className="w-full flex flex-col items-center space-y-4 pt-2 animate-fade-in">
          <div className="w-full p-4 bg-white/95 backdrop-blur-md rounded-2xl shadow-lg border border-white/20 text-center">
            <p className="text-base italic text-gray-800 font-serif leading-relaxed">
              "{selectedCard.quote || 'Your lucky moment awaits.'}"
            </p>
          </div>

          <div className="w-full flex justify-center pb-4">
            <LuckyCardShare card={selectedCard}/>
          </div>
        </div>
      )}
    </div>
  );
}
