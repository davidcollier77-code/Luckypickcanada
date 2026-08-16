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
    <div className="cosmic-aurora-background relative min-h-[100dvh] w-full bg-[#030712] flex flex-col items-center justify-between p-4 overflow-x-hidden select-none">
      <div className="lucky-moment-shell relative z-10 w-full max-w-sm flex flex-col items-center justify-center my-auto py-2">
        <div className="mb-6 flex flex-col items-center w-full relative z-10 pointer-events-auto top-header">
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

        <div className={`lucky-moment-stage lucky-moment-tier-${selectedCard?.tier || 'standard'} ${isGenerating ? 'is-generating' : ''} ${isAnnouncing ? 'is-announcing' : ''}`}>
          <div className={`card-stage-container relative w-[260px] xs:w-[280px] sm:w-[300px] aspect-[5/7] flex items-center justify-center [perspective:1200px] tier-${selectedCard?.tier || 'standard'}`}>
            
            <div className="pointer-events-none absolute inset-0 overflow-hidden z-0">
              <div className="hd-aurora-bg absolute -top-[20%] left-1/2 -translate-x-1/2 w-[600px] sm:w-[900px] h-[600px] sm:h-[900px] rounded-full opacity-80 mix-blend-screen pointer-events-none"></div>
              <div className="hd-aurora-accent absolute top-[10%] right-[-10%] w-[350px] h-[350px] rounded-full opacity-60 mix-blend-screen pointer-events-none"></div>
            </div>

            <div id="card-underglow" className={`tier-underglow tier-${selectedCard?.tier || 'standard'} absolute -inset-4 rounded-3xl pointer-events-none z-0`}></div>

            <div className="flip-card-wrapper z-10 w-full h-full relative">
              
              <div id="flippable-card" className="relative w-full h-full cursor-pointer shadow-[0_20px_50px_rgba(0,0,0,0.8)] rounded-2xl" aria-live="polite">
                <div className="shake-target relative w-full h-full">
                  
                  {/* FRONT FACE: INDEPENDENT ROTATION */}
                  <div className={`absolute inset-0 w-full h-full [backface-visibility:hidden] [-webkit-backface-visibility:hidden] transition-transform duration-700 rounded-2xl shadow-2xl ${isRevealed ? '[transform:rotateY(180deg)]' : '[transform:rotateY(0deg)]'}`} aria-hidden={isRevealed}>
                    <div className="relative w-full h-full rounded-2xl overflow-hidden border border-emerald-500/30 bg-slate-950/80">
                      <div className="card-aura-glow"></div>
                      <img src="/IMG_20260728_220305_112042.png" alt="Lucky Pick Canada" loading="lazy" className="card-image w-full h-full object-cover select-none pointer-events-none" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-white/10 pointer-events-none"></div>
                    </div>
                  </div>

                  {/* BACK FACE: INDEPENDENT ROTATION (Starts backward at -180, flips to 0) */}
                  <div className={`absolute inset-0 w-full h-full [backface-visibility:hidden] [-webkit-backface-visibility:hidden] transition-transform duration-700 rounded-2xl shadow-2xl ${isRevealed ? '[transform:rotateY(0deg)]' : '[transform:rotateY(-180deg)]'}`} aria-hidden={!isRevealed}>
                    <div className="relative w-full h-full rounded-2xl overflow-hidden border border-cyan-400/40 bg-slate-950/80 flex items-center justify-center">
                      {selectedCard && (selectedCard.image ? (
                        <>
                          <div className="card-aura-glow"></div>
                          <img id="revealed-card-img" src={selectedCard.image} alt={selectedCard.title || 'Revealed Card'} className="card-image w-full h-full object-cover select-none pointer-events-none" />
                        </>
                      ) : <span className="relative z-10 text-white">Lucky Pick 🍁 Canada.ca</span>)}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-white/15 pointer-events-none"></div>
                    </div>
                  </div>

                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="lucky-moment-actions mt-6 relative z-10 w-full max-w-md flex flex-col items-center gap-3 pb-4 pointer-events-auto footer-action">
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