'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import Image from 'next/image';
import { motion, useAnimate, useReducedMotion, AnimationPlaybackControls } from 'framer-motion';
import { useSound } from 'react-sounds';
import { Howl, Howler } from 'howler';
import { LUCKY_CARDS, selectWeightedLuckyCard } from './lucky-card-data';
import LuckyCardShare from './lucky-card-share';
import MidnightCountdown from '../components/midnight-countdown';

const STORAGE_KEY = 'lucky-pick-canada-todays-lucky-moment';

let audioAssets = null;
if (typeof window !== 'undefined') {
  audioAssets = {
    drone: new Howl({ src: ['/yodguard-lightning-magic-3-378649.mp3'], volume: 0, loop: true }),
    buildup: new Howl({ src: ['/freesound_community-starship-rail-gun-charge-35904.mp3'], volume: 0 }),
    impact: new Howl({ src: ['/dragon-studio-whoosh-cinematic-376875.mp3'], volume: 0 })
  };
}
const REVEAL_TIMINGS = {
  standard: { anticipation: 8000, announcement: 0 },
  premium: { anticipation: 8000, announcement: 900 },
  flagship: { anticipation: 8000, announcement: 1200 },
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
  const audioCtxRef = useRef(null);
  const activeSourcesRef = useRef([]);
  const cardRef = useRef(null);

  const { play: playTick, stop: stopTick } = useSound('ui/button_soft');
  const { play: playShimmerStandard, stop: stopShimmerStandard } = useSound('notification/success');
  const { play: playShimmerPremium, stop: stopShimmerPremium } = useSound('notification/completed');
  // Removed unverified sounds.

  const stopAllAudio = useCallback(() => {
    stopTick();
    stopShimmerStandard();
    stopShimmerPremium();
    if (audioAssets) {
      Object.values(audioAssets).forEach(howl => {
        howl.stop();
        howl.volume(0);
      });
    }
    if (activeSourcesRef.current) {
      activeSourcesRef.current.forEach(source => {
        try {
          source.stop();
          source.disconnect();
        } catch (e) {}
      });
      activeSourcesRef.current = [];
    }
    if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
      audioCtxRef.current.close().catch(() => {});
      audioCtxRef.current = null;
    }
  }, [stopTick, stopShimmerStandard, stopShimmerPremium]);



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
}, [stopAllAudio]);

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
    particleParamsRef.current = Array.from({ length: particleCount }, (_, i) => {
      const angle = (i / particleCount) * Math.PI * 2 + (Math.random() * 0.5);
      const distance = 150 + Math.random() * 150;
      return {
        startX: Math.cos(angle) * (distance * 0.2),
        startY: Math.sin(angle) * (distance * 0.2),
        endX: Math.cos(angle) * distance,
        endY: Math.sin(angle) * distance,
        randomDuration: 0.8 + Math.random() * 0.4,
      };
    });

    const shakeSteps = 10;
    const buildupTime = timing.anticipation / 1000 - 0.5; // Reserve 0.5s for climax
    const stepTime = buildupTime / shakeSteps;

    // We wait 1 tick for React to render the conditional elements
    activeTimeoutsRef.current.push(window.setTimeout(() => {
      if (shouldReduceMotion) return;



      const sequence = [];
      // The 8.5s Cinematic Sequence

      // 0.0s - 4.0s: Anticipation - Deep Space Atmosphere
      // Very slow, majestic scaling and rotation to establish a magical field
      sequence.push(['.deep-vortex', { opacity: 0.5, scale: 1.1 }, { duration: 4.0, ease: 'easeOut' }]);
      sequence.push([cardRef.current, { y: [0, -15, -5], scale: [1, 1.02, 1.02], rotateZ: [0, 0.5, -0.5] }, { duration: 4.0, ease: 'easeInOut', at: '<' }]);

      // 4.0s - 7.2s: Energy Gathering (Smooth Levitation & Escalation)
      // Removing the violent shake, replacing with an accelerating, elegant float
      const gatherDuration = 3.2;
      const baseIntensity = card.tier === 'flagship' ? 1.5 : card.tier === 'premium' ? 1.2 : 1.0;

      // We'll use a continuous spring-like motion by defining keyframes
      sequence.push([cardRef.current, {
        y: [-5 * baseIntensity, -20 * baseIntensity, -5 * baseIntensity, -25 * baseIntensity, -10 * baseIntensity],
        rotateZ: [-0.5 * baseIntensity, 1 * baseIntensity, -1 * baseIntensity, 1.5 * baseIntensity, -0.5 * baseIntensity],
        scale: [1.02, 1.02 + 0.01 * baseIntensity, 1.02 + 0.02 * baseIntensity, 1.02 + 0.03 * baseIntensity, 1.02 + 0.04 * baseIntensity]
      }, { duration: gatherDuration, ease: 'easeInOut', at: '4.0' }]);

      sequence.push(['.deep-vortex', { opacity: 0.8, scale: 1.3, filter: 'brightness(1.2)' }, { duration: gatherDuration, ease: 'easeIn', at: '4.0' }]);

      // 7.2s - 8.0s: The Breath (Tension Before Release)
      // Card pulls back slightly and freezes, gathering the final energy
      sequence.push([cardRef.current, { y: 0, rotateZ: 0, scale: 0.95 }, { duration: 0.7, ease: [0.4, 0, 0.2, 1], at: '7.2' }]);
      sequence.push(['.deep-vortex', { opacity: 1, scale: 1.0, filter: 'brightness(1.5)' }, { duration: 0.7, ease: 'easeIn', at: '7.2' }]);

      // 8.0s: Reveal Climax (Impact & Forward Surge)
      // Elegant, powerful thrust forward
      sequence.push([cardRef.current, { scale: 1.15, z: 150 }, { duration: 0.4, ease: [0.2, 0.8, 0.2, 1], at: '8.0' }]);
      sequence.push([cardRef.current, { scale: 1, z: 0 }, { duration: 0.8, ease: 'easeOut', at: '8.4' }]);
      sequence.push(['.deep-vortex', { opacity: 0.6, scale: 1.5, filter: 'brightness(1.0)' }, { duration: 1.0, ease: 'easeOut', at: '8.0' }]);

      // Particle Choreography
      if (particleParamsRef.current) {
        // Particles drift lazily during anticipation
        sequence.push(['.particle', { opacity: [0, 0.3], x: particleParamsRef.current.map(p => p.startX * 0.5), y: particleParamsRef.current.map(p => p.startY * 0.5) }, { duration: 4.0, ease: 'easeOut', at: '0.0' }]);

        // Particles orbit outward during gathering
        sequence.push(['.particle', { opacity: 0.6, x: particleParamsRef.current.map(p => p.endX * 0.8), y: particleParamsRef.current.map(p => p.endY * 0.8) }, { duration: gatherDuration, ease: 'easeInOut', at: '4.0' }]);

        // Particles suck into the center during the breath
        sequence.push(['.particle', { opacity: 1, x: 0, y: 0, scale: 0.5 }, { duration: 0.7, ease: [0.4, 0, 1, 1], at: '7.2' }]);

        // Particles burst elegantly at climax
        sequence.push(['.particle', { opacity: [1, 0.8, 0], scale: [1, 1.5, 0], x: particleParamsRef.current.map(p => p.endX * 1.5), y: particleParamsRef.current.map(p => p.endY * 1.5) }, { duration: 2.0, ease: [0.2, 0.8, 0.2, 1], at: '8.0' }]);
      }

      // Restrained, cinematic light bloom
      sequence.push(['.reveal-flash', { opacity: [0, 1.0, 0], scale: [0.2, 1.5, 2.0] }, { duration: 1.5, ease: [0.2, 0.8, 0.2, 1], at: '8.0' }]);

      animationControlsRef.current = animate(sequence);
    }, 0));


      // --- AUDIO SEQUENCE (8.5s total) ---

      // 0.0s: Tactile Button Press Confirmation
      playTick({ volume: 0.5 });

      // Layer B: Early Atmosphere Drone (0.0s - 8.5s)
      if (audioAssets && audioAssets.drone) {
        audioAssets.drone.volume(0);
        audioAssets.drone.play();
        audioAssets.drone.fade(0, 0.4, 2000); // Fade in over 2s
        
        // Fade out during breath/climax
        activeTimeoutsRef.current.push(window.setTimeout(() => {
          audioAssets.drone.fade(0.4, 0, 1000);
        }, 7200));
      }

      // Layer C: Rising Buildup (4.0s - 7.5s)
      if (audioAssets && audioAssets.buildup) {
        activeTimeoutsRef.current.push(window.setTimeout(() => {
          audioAssets.buildup.volume(0);
          audioAssets.buildup.play();
          audioAssets.buildup.fade(0, 0.8, 1000);

          // Cut slightly before impact
          activeTimeoutsRef.current.push(window.setTimeout(() => {
             audioAssets.buildup.fade(0.8, 0, 300);
          }, 3200)); // 4000 + 3200 = 7200
        }, 4000));
      }

      // Layer E: Climax Impact (8.0s)
      if (audioAssets && audioAssets.impact) {
        activeTimeoutsRef.current.push(window.setTimeout(() => {
          audioAssets.impact.volume(0.9);
          audioAssets.impact.play();
        }, 8000));
      }

      // Layer G: Resolution Shimmer (8.2s - 8.5s+)
      // Elegant finish using verified react-sounds success tones as the card settles.
      activeTimeoutsRef.current.push(window.setTimeout(() => {
        if (card.tier === 'flagship' || card.tier === 'premium') {
          playShimmerPremium({ volume: 0.7 });
        } else {
          playShimmerStandard({ volume: 0.6 });
        }
      }, 8200));
      // ----------------------


    revealTimer.current = activeTimeoutsRef.current[activeTimeoutsRef.current.push(window.setTimeout(() => {
      showLuckyCard(card);
    }, timing.anticipation)) - 1];

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
            className={`deep-vortex absolute inset-[-50%] z-[-1] rounded-full blur-[60px] ${
              selectedCard.tier === 'standard' ? 'bg-[radial-gradient(circle,rgba(49,46,129,0.8)_0%,transparent_70%)]' :
              selectedCard.tier === 'premium' ? 'bg-[radial-gradient(circle,rgba(30,58,138,0.8)_0%,transparent_70%)]' :
              'bg-[radial-gradient(circle,rgba(88,28,135,0.8)_0%,transparent_70%)]'
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
                className={`particle absolute top-1/2 left-1/2 w-[3px] h-[3px] rounded-full transform -translate-x-1/2 -translate-y-1/2 ${
                  selectedCard.tier === 'standard' ? 'bg-white shadow-[0_0_8px_2px_rgba(255,255,255,0.8)]' :
                  selectedCard.tier === 'premium' ? 'bg-blue-100 shadow-[0_0_12px_3px_rgba(147,197,253,0.9)]' :
                  'bg-yellow-100 shadow-[0_0_12px_3px_rgba(253,200,48,1)]'
                }`}
                style={{ opacity: 0 }}
              />
            ))}
          </div>
        )}

        {/* Reveal Flash */}
        {isGenerating && selectedCard && (
          <div
            className={`reveal-flash absolute inset-[-100%] z-0 pointer-events-none mix-blend-screen rounded-full opacity-0 radial-light-burst ${
              selectedCard.tier === 'standard' ? 'bg-[radial-gradient(circle,rgba(255,255,255,0.4)_0%,transparent_70%)]' :
              selectedCard.tier === 'premium' ? 'bg-[radial-gradient(circle,rgba(180,220,255,0.5)_0%,transparent_70%)]' :
              'bg-[radial-gradient(circle,rgba(255,230,150,0.6)_0%,transparent_70%)]'
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
          className="card-container relative z-20 w-[280px] h-[405px] cursor-pointer mx-auto flex-shrink-0 [WebkitTapHighlightColor:transparent] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-amber-400 rounded-2xl"
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
