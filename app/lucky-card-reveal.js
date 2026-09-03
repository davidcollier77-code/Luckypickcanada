'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { motion, useAnimate, useReducedMotion, AnimationPlaybackControls } from 'framer-motion';
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
  const [isFlashing, setIsFlashing] = useState(false);
  const shouldReduceMotion = useReducedMotion();
  const [scope, animate] = useAnimate();
  const revealTimer = useRef(null);
  const announcementTimer = useRef(null);
  const audioRef = useRef(null);
  const audioTimeoutRef = useRef(null);
  const animationControlsRef = useRef(null);
  const particleParamsRef = useRef(null);


  useEffect(() => {
    if (typeof window !== 'undefined') {
      audioRef.current = new Audio('/freesound_community-shaking-coins-105774.mp3');
      audioRef.current.loop = true;
      audioRef.current.volume = 0.6;
    }
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      if (audioTimeoutRef.current) {
        window.clearTimeout(audioTimeoutRef.current);
      // Cancel any running animations on unmount
      if (animationControlsRef.current) {
        animationControlsRef.current.stop();
        animationControlsRef.current = null;
      }
      }
    };
  }, []);

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
    setIsFlashing(true);
    setTimeout(() => setIsFlashing(false), 700);
    setIsRevealed(true);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({
        cardId: card.id,
        revealDate: localDateKey(),
      }));

      // Update unlocked cards for Binder
      const unlockedCardsStr = window.localStorage.getItem('unlockedCards');
      let unlockedCards = [];
      try {
        if (unlockedCardsStr) {
          unlockedCards = JSON.parse(unlockedCardsStr);
        }
      } catch (parseError) {
        console.warn('Failed to parse unlocked cards, resetting:', parseError);
        unlockedCards = [];
      }
      if (!unlockedCards.includes(card.id)) {
        unlockedCards.push(card.id);
        window.localStorage.setItem('unlockedCards', JSON.stringify(unlockedCards));
        // Dispatch custom event to notify binder
        window.dispatchEvent(new Event('unlockedCardsUpdated'));
      }
    } catch (e) {}
  }

  const triggerCardDraw = () => {
    window.clearTimeout(revealTimer.current);
    window.clearTimeout(announcementTimer.current);
    window.clearTimeout(audioTimeoutRef.current);
    // Cancel any previous animation before starting a new one
    if (animationControlsRef.current) {
      animationControlsRef.current.stop();
      animationControlsRef.current = null;
    }
    const card = selectWeightedLuckyCard(previousCardId);
    const timing = REVEAL_TIMINGS[card.tier] || REVEAL_TIMINGS.standard;
    setSelectedCard(card);
    setIsRevealed(false);
    setIsGenerating(true);
    setImageError(false);
    setIsFlashing(false);

    // Generate stable particle parameters for this reveal
    const particleCount = card.tier === 'flagship' ? 12 : card.tier === 'premium' ? 8 : 4;
    particleParamsRef.current = Array.from({ length: particleCount }, (_, i) => ({
      randomX: (i * 0.3 - 0.5) * 100,
      randomY: -50 - (i * 5),
      randomXEnd: (i * 0.3 - 0.5) * 150,
      randomDuration: 1 + (i * 0.1),
      randomDelay: i * 0.1,
    }));

    // Animate the buildup
    const buildupDuration = (timing.anticipation / 1000);

    if (!shouldReduceMotion) {
      if (card.tier === 'standard') {
        animationControlsRef.current = animate(scope.current, { x: [-1, 1, -1, 1, 0], y: [-1, 1, -1, 1, 0] }, { duration: buildupDuration, ease: 'linear' });
      } else if (card.tier === 'premium') {
        animationControlsRef.current = animate(scope.current, { x: [-2, 2, -2, 2, 0], y: [-1, 2, -2, 1, 0] }, { duration: buildupDuration, ease: 'linear' });
      } else if (card.tier === 'flagship') {
        animationControlsRef.current = animate(scope.current, { x: [-3, 3, -3, 3, 0], y: [-2, 3, -3, 2, 0], scale: [1, 1.02, 1.04, 1.02, 1] }, { duration: buildupDuration, ease: 'linear' });
      }
    }

    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(err => console.warn('Audio playback error:', err));
    }

    revealTimer.current = window.setTimeout(() => {
      showLuckyCard(card);
    }, timing.anticipation);

    const flipDuration = 700;
    audioTimeoutRef.current = window.setTimeout(() => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    }, timing.anticipation);
  };

  return (
    <div className="w-full max-w-sm mx-auto flex flex-col items-center px-4 py-4 space-y-6 select-none">
      
      {/* 1. Countdown & Draw Button */}
      <div className="w-full flex flex-col items-center text-center space-y-2">
        {isReady && isRevealed && selectedCard && (
          <div className="text-lg font-bold text-gray-300">
            Resets in: <MidnightCountdown fallback="--h --m --s"/>
          </div>
        )}

        {isReady && !isRevealed && !selectedCard && (
          <button
            type="button"
            onClick={triggerCardDraw}
            disabled={isRevealed || isGenerating}
            aria-disabled={isRevealed || isGenerating}
            className="mt-2 px-6 py-2.5 rounded-full bg-gradient-to-r from-amber-400 to-amber-600 text-slate-950 font-bold text-base shadow-lg hover:brightness-110 active:scale-95 transition-all"
          >
            {isGenerating ? 'Revealing...' : 'Reveal Today’s Luck'}
          </button>
        )}
      </div>


      {/* 2. 3D Card Stage */}
      <div className="w-full flex justify-center py-2 flex-shrink-0 relative">
        {/* Ambient/Aura Effects */}
        {isGenerating && selectedCard && !shouldReduceMotion && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1.1 }}
            transition={{ duration: REVEAL_TIMINGS[selectedCard.tier].anticipation / 1000 }}
            className={`absolute inset-0 z-[-1] blur-2xl rounded-2xl ${
              selectedCard.tier === 'standard' ? 'bg-amber-400/30' :
              selectedCard.tier === 'premium' ? 'bg-blue-400/40 animate-plasma-glow' :
              'bg-gradient-to-r from-amber-400/50 via-yellow-300/60 to-amber-500/50 animate-pulse-glow'
            }`}
          />
        )}

        {/* Particles */}
        {isGenerating && selectedCard && !shouldReduceMotion && (
          <div className="absolute inset-0 z-[-1] pointer-events-none overflow-visible">
            {particleParamsRef.current?.map((params, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20, x: params.randomX }}
                animate={{ opacity: [0, 1, 0], y: params.randomY, x: params.randomXEnd }}
                transition={{ duration: params.randomDuration, repeat: Infinity, delay: params.randomDelay }}
                className={`absolute bottom-0 left-1/2 w-2 h-2 rounded-full ${
                  selectedCard.tier === 'standard' ? 'bg-amber-200' :
                  selectedCard.tier === 'premium' ? 'bg-blue-200' :
                  'bg-yellow-100 shadow-[0_0_10px_2px_rgba(253,200,48,0.8)]'
                }`}
              />
            ))}
          </div>
        )}

        {/* Reveal Flash */}
        {isFlashing && !shouldReduceMotion && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: [0, 1, 0], scale: [0.9, 1.1, 1.2] }}
            transition={{ duration: 0.7 }}
            className={`absolute inset-0 z-10 pointer-events-none rounded-2xl mix-blend-screen ${
              selectedCard?.tier === 'standard' ? 'bg-white' :
              selectedCard?.tier === 'premium' ? 'bg-blue-200' :
              'bg-yellow-200'
            }`}
          />
        )}

        <motion.div
          ref={scope}
          role="button"
          tabIndex={0}
          aria-pressed={isRevealed}
          onClick={() => isRevealed && setIsRevealed((s) => !s)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              if (isRevealed) setIsRevealed((s) => !s);
            }
          }}
          className="relative w-[280px] h-[405px] cursor-pointer mx-auto flex-shrink-0 [WebkitTapHighlightColor:transparent] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-amber-400 rounded-2xl"
          style={{ perspective: '1200px' }}
        >
          <div className="relative w-full h-full">
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
                className="absolute inset-0"
                style={{ backfaceVisibility: 'hidden' }}
              >
                <div className="absolute inset-0 bg-transparent rounded-2xl overflow-hidden shadow-2xl border-none">
                  <div className="relative w-full h-full">
                    <Image alt="Card Back Face" className="object-cover rounded-2xl" fill priority quality={100} src="/IMG_20260728_220305_112042.png"/>
                  </div>
                </div>
              </div>

              {/* Back Face (Revealed Artwork) */}
              <div
                className={`absolute inset-0 rounded-2xl transition-shadow duration-700 ${isRevealed && selectedCard ? `tier-glow-${selectedCard.tier}` : ''}`}
                style={{
                  backfaceVisibility: 'hidden',
                  transform: 'rotateY(180deg)',
                }}
              >
                <div className="absolute inset-0 bg-transparent rounded-2xl overflow-hidden shadow-2xl border-none">
                  <div className="relative w-full h-full">
                    {selectedCard && selectedCard.image && !imageError ? (
                      <Image alt={selectedCard.title || 'Revealed Card'} className="object-cover rounded-2xl" fill onError={() => setImageError(true)} priority quality={100} src={selectedCard.image} />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-center p-4 text-amber-200">
                        Lucky Pick 🍁 Canada.ca
                      </div>
                    )}
                    {/* Cinematic Sweep Effect */}
                    {isRevealed && (
                      <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden rounded-2xl">
                        <div className="absolute top-0 left-0 w-[50%] h-[150%] bg-gradient-to-r from-transparent via-white/40 to-transparent shimmer-sweep -translate-y-[20%]" />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
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
