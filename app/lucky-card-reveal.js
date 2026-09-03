'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { motion, useAnimate, useReducedMotion, AnimationPlaybackControls } from 'framer-motion';
import { useSound } from 'react-sounds';
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
  const activeTimeoutsRef = useRef([]);
  const animationControlsRef = useRef(null);
  const particleParamsRef = useRef(null);
  const cardRef = useRef(null);

  const { play: playTick, stop: stopTick } = useSound('ui/button_soft');
  const { play: playWhoosh, stop: stopWhoosh } = useSound('game/hit'); // good for initial reveal
  const { play: playImpact, stop: stopImpact } = useSound('game/portal_opening'); // good for flip
  const { play: playShimmerStandard, stop: stopShimmerStandard } = useSound('notification/success');
  const { play: playShimmerPremium, stop: stopShimmerPremium } = useSound('notification/completed');
  const { play: playShimmerFlagship, stop: stopShimmerFlagship } = useSound('arcade/upgrade');

  const stopAllAudio = () => {
    stopTick();
    stopWhoosh();
    stopImpact();
    stopShimmerStandard();
    stopShimmerPremium();
    stopShimmerFlagship();
  };



  useEffect(() => {
    return () => {
      stopAllAudio();
      if (activeTimeoutsRef.current) {
        activeTimeoutsRef.current.forEach(window.clearTimeout);
      activeTimeoutsRef.current = [];
      }
      // Cancel any running animations on unmount
      if (animationControlsRef.current) {
        animationControlsRef.current.stop();
        animationControlsRef.current = null;
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
    activeTimeoutsRef.current.forEach(window.clearTimeout);
    activeTimeoutsRef.current = [];
    stopAllAudio();
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
    const particleCount = card.tier === 'flagship' ? 30 : card.tier === 'premium' ? 20 : 12;
    particleParamsRef.current = Array.from({ length: particleCount }, (_, i) => ({
      randomX: (i * 0.3 - 0.5) * 200,
      randomY: -100 - (i * 15),
      randomDuration: 0.5 + (i * 0.05) % 0.5,
    }));

    const shakeSteps = 10;
    const buildupTime = timing.anticipation / 1000 - 0.5; // Reserve 0.5s for climax
    const stepTime = buildupTime / shakeSteps;

    // We wait 1 tick for React to render the conditional elements
    setTimeout(() => {
      if (shouldReduceMotion) return;

      const baseShake = card.tier === 'flagship' ? 4 : card.tier === 'premium' ? 2 : 1;
      const rot = card.tier === 'flagship' ? 2 : card.tier === 'premium' ? 1 : 0.5;

      const sequence = [];

      // 1. Beginning: Subtle glow begins
      sequence.push(['.aurora-glow', { opacity: 0.3, scale: 1 }, { duration: 0.4 }]);

      // 2. Energy buildup & escalating shake

      for (let i = 1; i <= shakeSteps; i++) {
        const intensity = (i / shakeSteps) ** 2; // exponential buildup
        const xShake = (i % 2 === 0 ? 1 : -1) * baseShake * intensity * 2.5;
        const yShake = (i % 2 === 0 ? -1 : 1) * baseShake * intensity * 2.5;
        const rShake = (i % 2 === 0 ? 1 : -1) * rot * intensity;

        sequence.push([cardRef.current, { x: xShake, y: yShake, rotateZ: rShake }, { duration: stepTime, ease: 'easeInOut', at: '<' }]);

        // Gradually brighten aurora
        sequence.push(['.aurora-glow', { opacity: 0.3 + 0.3 * intensity, scale: 1 + 0.1 * intensity }, { duration: stepTime, at: '<' }]);
      }

      // 3. Reveal climax: major flare and strong final shake
      sequence.push([cardRef.current, { x: -baseShake * 4, y: baseShake * 2, rotateZ: -rot * 2, scale: 1.05 }, { duration: 0.1 }]);
      sequence.push([cardRef.current, { x: baseShake * 4, y: -baseShake * 2, rotateZ: rot * 2 }, { duration: 0.1 }]);
      sequence.push([cardRef.current, { x: 0, y: 0, rotateZ: 0, scale: 1 }, { duration: 0.1 }]);

      // Aurora flare
      sequence.push(['.aurora-glow', { opacity: 1, scale: 1.3, filter: 'brightness(1.5)' }, { duration: 0.3, at: '-0.3' }]);

      // Particles burst
      if (particleParamsRef.current) {
        sequence.push(['.particle', { opacity: [0, 1, 0], y: particleParamsRef.current.map(p => p.randomY), x: particleParamsRef.current.map(p => p.randomX) }, { duration: 0.5, at: '-0.3' }]);
      }

      // Bright flash
      sequence.push(['.reveal-flash', { opacity: [0, 1, 0], scale: [0.9, 1.2, 1.3] }, { duration: 0.5, at: '-0.3' }]);

      animationControlsRef.current = animate(sequence);
    }, 0);


      // --- AUDIO SEQUENCE ---
      // 1. Tension building (Tick sounds mapped to shake steps)
      for (let i = 1; i <= shakeSteps; i++) {
        activeTimeoutsRef.current.push(window.setTimeout(() => {
          playTick({ volume: 0.2 + (0.5 * (i / shakeSteps)), rate: 0.8 + (i * 0.05) });
        }, stepTime * i * 1000));
      }

      // 2. Initial movement / anticipation crescendo
      activeTimeoutsRef.current.push(window.setTimeout(() => {
        playWhoosh({ volume: 0.6 });
      }, buildupTime * 1000 - 300));

      // 3. Reveal moment & Impact
      activeTimeoutsRef.current.push(window.setTimeout(() => {
        playImpact({ volume: 0.8 });
      }, timing.anticipation));

      // 4. Shimmer / Reward accent based on tier
      activeTimeoutsRef.current.push(window.setTimeout(() => {
        if (card.tier === 'flagship') {
          playShimmerFlagship({ volume: 0.9 });
        } else if (card.tier === 'premium') {
          playShimmerPremium({ volume: 0.8 });
        } else {
          playShimmerStandard({ volume: 0.6 });
        }
      }, timing.anticipation + 400));
      // ----------------------


    revealTimer.current = window.setTimeout(() => {
      showLuckyCard(card);
    }, timing.anticipation);

    const flipDuration = 700;
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
      <div ref={scope} className="w-full flex justify-center py-2 flex-shrink-0 relative">
        {/* Ambient/Aura Effects */}
        {isGenerating && selectedCard && (
          <div
            className={`aurora-glow absolute inset-0 z-[-1] blur-2xl rounded-2xl ${
              selectedCard.tier === 'standard' ? 'bg-amber-400/40' :
              selectedCard.tier === 'premium' ? 'bg-blue-400/60' :
              'bg-gradient-to-r from-amber-400/70 via-yellow-300/80 to-amber-500/70'
            }`}
            style={{ opacity: 0, scale: 0.8 }}
          />
        )}

        {/* Energy Wisps (only for premium/flagship) */}
        {isGenerating && selectedCard && selectedCard.tier !== 'standard' && (
          <div className="absolute inset-x-0 bottom-0 h-32 z-[-1] overflow-hidden pointer-events-none mix-blend-screen opacity-50">
            <div className="w-full h-full animate-mote-1 bg-gradient-to-t from-white/20 to-transparent blur-md" />
            {selectedCard.tier === 'flagship' && (
              <div className="w-full h-full animate-mote-2 bg-gradient-to-t from-yellow-200/30 to-transparent blur-lg" />
            )}
          </div>
        )}

        {/* Particles Burst Container */}
        {isGenerating && selectedCard && (
          <div className="absolute inset-0 z-[-1] pointer-events-none overflow-visible">
            {particleParamsRef.current?.map((_, i) => (
              <div
                key={i}
                className={`particle absolute bottom-8 left-1/2 w-2 h-2 rounded-full transform -translate-x-1/2 ${
                  selectedCard.tier === 'standard' ? 'bg-amber-200' :
                  selectedCard.tier === 'premium' ? 'bg-blue-200 shadow-[0_0_8px_2px_rgba(147,197,253,0.8)]' :
                  'bg-yellow-100 shadow-[0_0_12px_3px_rgba(253,200,48,0.9)]'
                }`}
                style={{ opacity: 0 }}
              />
            ))}
          </div>
        )}

        {/* Reveal Flash */}
        {isGenerating && selectedCard && (
          <div
            className={`reveal-flash absolute inset-0 z-10 pointer-events-none rounded-2xl mix-blend-screen ${
              selectedCard.tier === 'standard' ? 'bg-white' :
              selectedCard.tier === 'premium' ? 'bg-blue-200' :
              'bg-yellow-200'
            }`}
            style={{ opacity: 0, scale: 0.9 }}
          />
        )}

        <motion.div
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
          ref={cardRef}
          className="card-container relative w-[280px] h-[405px] cursor-pointer mx-auto flex-shrink-0 [WebkitTapHighlightColor:transparent] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-amber-400 rounded-2xl"
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
