'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import Image from 'next/image';
import { motion, useAnimate, useReducedMotion, AnimationPlaybackControls } from 'framer-motion';
import { useSound } from 'react-sounds';
import { LUCKY_CARDS, selectWeightedLuckyCard } from './lucky-card-data';
import LuckyCardShare from './lucky-card-share';
import MidnightCountdown from '../components/midnight-countdown';

const STORAGE_KEY = 'lucky-pick-canada-todays-lucky-moment';
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
    particleParamsRef.current = Array.from({ length: particleCount }, (_, i) => ({
      randomX: (i * 0.3 - 0.5) * 200,
      randomY: -100 - (i * 15),
      randomDuration: 0.5 + (i * 0.05) % 0.5,
    }));

    const shakeSteps = 10;
    const buildupTime = timing.anticipation / 1000 - 0.5; // Reserve 0.5s for climax
    const stepTime = buildupTime / shakeSteps;

    // We wait 1 tick for React to render the conditional elements
    activeTimeoutsRef.current.push(window.setTimeout(() => {
      if (shouldReduceMotion) return;



      const sequence = [];
      // The 8.5s Cinematic Sequence
      // 0.0s - 4.0s: Early Atmosphere (Aurora fades in, card breathes slowly)
      sequence.push(['.aurora-glow', { opacity: 0.4, scale: 1.05 }, { duration: 4.0, ease: 'easeOut' }]);
      sequence.push([cardRef.current, { y: [0, -10, 0] }, { duration: 4.0, ease: 'easeInOut', at: '<' }]);

      // 4.0s - 7.2s: Rising Buildup (Escalating vibration)
      const buildDuration = 3.2;
      const buildSteps = 20;
      const stepTime = buildDuration / buildSteps;
      const baseShake = card.tier === 'flagship' ? 3 : card.tier === 'premium' ? 2 : 1;
      const rot = card.tier === 'flagship' ? 1.5 : card.tier === 'premium' ? 1 : 0.5;

      for (let i = 1; i <= buildSteps; i++) {
        const intensity = (i / buildSteps) ** 3; // Exponential tension
        const xShake = (i % 2 === 0 ? 1 : -1) * baseShake * intensity * 2;
        const yShake = (i % 2 === 0 ? -1 : 1) * baseShake * intensity * 2;
        const rShake = (i % 2 === 0 ? 1 : -1) * rot * intensity;

        sequence.push([cardRef.current, { x: xShake, y: yShake, rotateZ: rShake }, { duration: stepTime, ease: 'linear', at: i === 1 ? '4.0' : '<' }]);
        // Aurora brightens with tension
        sequence.push(['.aurora-glow', { opacity: 0.4 + 0.4 * intensity, scale: 1.05 + 0.1 * intensity }, { duration: stepTime, at: '<' }]);
      }

      // 7.2s - 8.0s: The Breath / Swell (Complete freeze)
      sequence.push([cardRef.current, { x: 0, y: 0, rotateZ: 0, scale: 1 }, { duration: 0.05, at: '7.2' }]); // snap to center
      sequence.push(['.aurora-glow', { opacity: 0.9, scale: 1.2, filter: 'brightness(1.5)' }, { duration: 0.8, at: '7.2' }]); // flare up

      // 8.0s: Reveal Climax (Impact & Flip)
      sequence.push([cardRef.current, { scale: 1.05 }, { duration: 0.1, at: '8.0' }]);
      sequence.push([cardRef.current, { scale: 1 }, { duration: 0.2, at: '8.1' }]);
      sequence.push(['.aurora-glow', { opacity: 1, scale: 1.3, filter: 'brightness(1.2)' }, { duration: 0.3, at: '8.0' }]);

      // Particles burst at climax
      if (particleParamsRef.current) {
        sequence.push(['.particle', { opacity: [0, 1, 0], y: particleParamsRef.current.map(p => p.randomY), x: particleParamsRef.current.map(p => p.randomX) }, { duration: 0.5, at: '8.0' }]);
      }

      // Bright flash at climax
      sequence.push(['.reveal-flash', { opacity: [0, 1, 0], scale: [0.9, 1.2, 1.3] }, { duration: 0.5, at: '8.0' }]);

      animationControlsRef.current = animate(sequence);
    }, 0));


      // --- AUDIO SEQUENCE (8.5s total) ---

      // 0.0s: Tactile Button Press Confirmation
      playTick({ volume: 0.5 });

      // We use Web Audio API for smooth, sophisticated cinematic tension without arcade/game artifacts.
      if (typeof window !== 'undefined' && (window.AudioContext || window.webkitAudioContext)) {
        if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') {
          audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
        }
        const ctx = audioCtxRef.current;

        // Mobile requires resume() triggered during user interaction
        if (ctx.state === 'suspended') {
          ctx.resume();
        }

        const now = ctx.currentTime;

        // Layer B: Early Atmosphere Drone (0.5s - 4.0s)
        const droneOsc = ctx.createOscillator();
        const droneGain = ctx.createGain();
        droneOsc.type = 'sine';
        droneOsc.frequency.setValueAtTime(55, now); // Low A (musical and unobtrusive)

        droneGain.gain.setValueAtTime(0, now);
        droneGain.gain.setTargetAtTime(0.2, now + 0.5, 1.0); // Gentle fade-in
        droneGain.gain.setTargetAtTime(0, now + 7.2, 0.2); // Fade out during the breath

        droneOsc.connect(droneGain);
        droneGain.connect(ctx.destination);
        droneOsc.start(now);
        droneOsc.stop(now + 8.0);
        activeSourcesRef.current.push(droneOsc);

        // Layer C: Rising Buildup (4.0s - 7.2s)
        const riserOsc = ctx.createOscillator();
        const riserGain = ctx.createGain();
        const riserFilter = ctx.createBiquadFilter();

        riserOsc.type = 'triangle';
        riserOsc.frequency.setValueAtTime(110, now + 4.0);
        riserOsc.frequency.exponentialRampToValueAtTime(440, now + 7.2); // Smooth pitch bend

        riserFilter.type = 'lowpass';
        riserFilter.frequency.setValueAtTime(200, now + 4.0);
        riserFilter.frequency.linearRampToValueAtTime(1500, now + 7.2); // Filter opens up gradually

        riserGain.gain.setValueAtTime(0, now + 4.0);
        riserGain.gain.linearRampToValueAtTime(0.3, now + 7.2); // Volume swells
        riserGain.gain.setTargetAtTime(0, now + 7.2, 0.05); // Sharp cut for the breath

        riserOsc.connect(riserFilter);
        riserFilter.connect(riserGain);
        riserGain.connect(ctx.destination);

        riserOsc.start(now + 4.0);
        riserOsc.stop(now + 8.0);
        activeSourcesRef.current.push(riserOsc);

        // Layer E: Climax Impact (8.0s - 8.5s)
        // A sophisticated cinematic sub-hit, avoiding cheap game sounds.
        const impactOsc = ctx.createOscillator();
        const impactGain = ctx.createGain();

        impactOsc.type = 'sine';
        impactOsc.frequency.setValueAtTime(150, now + 8.0);
        impactOsc.frequency.exponentialRampToValueAtTime(30, now + 8.3); // Deep sub drop

        impactGain.gain.setValueAtTime(0, now + 8.0);
        impactGain.gain.linearRampToValueAtTime(1.0, now + 8.02); // Fast attack
        impactGain.gain.exponentialRampToValueAtTime(0.01, now + 8.5); // Cinematic decay
        impactGain.connect(ctx.destination);

        impactOsc.start(now + 8.0);
        impactOsc.stop(now + 9.0);
        activeSourcesRef.current.push(impactOsc);
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
