'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import Image from 'next/image';
import { motion, useAnimate, useReducedMotion } from 'framer-motion';
import useSound from 'use-sound';
import Particles from '@tsparticles/react';
import { loadSlim } from '@tsparticles/slim';
import { LUCKY_CARDS, selectWeightedLuckyCard } from './lucky-card-data';
import LuckyCardShare from './lucky-card-share';
import MidnightCountdown from '../components/midnight-countdown';

const STORAGE_KEY = 'lucky-pick-canada-todays-lucky-moment';

function localDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// --- AUDIO ASSETS ---
const AUDIO_ASSETS = {
  drone: '/dragon-studio-whoosh-cinematic-376875.mp3',
  charge: '/freesound_community-starship-rail-gun-charge-35904.mp3',
  impact: '/yodguard-lightning-magic-3-378649.mp3',
  shimmer: '/freesound_community-shaking-coins-105774.mp3',
};

export default function LuckyCardReveal() {
  const [selectedCard, setSelectedCard] = useState(null);
  const [previousCardId, setPreviousCardId] = useState(null);
  const [isRevealed, setIsRevealed] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [imageError, setImageError] = useState(false);
  const shouldReduceMotion = useReducedMotion();

  const particlesInit = useCallback(async (engine) => {
    await loadSlim(engine);
  }, []);

  const particlesOptions = {
    fpsLimit: 60,
    fullScreen: { enable: false, zIndex: -10 },
    particles: {
      number: { value: shouldReduceMotion ? 20 : 60, density: { enable: true, value_area: 800 } },
      color: { value: ["#ffffff", "#facc15", "#60a5fa"] },
      shape: { type: "circle" },
      opacity: { value: { min: 0.1, max: 0.8 }, animation: { enable: !shouldReduceMotion, speed: 1, sync: false } },
      size: { value: { min: 1, max: 3 } },
      move: {
        enable: !shouldReduceMotion,
        speed: 1.5,
        direction: "none",
        random: true,
        straight: false,
        outModes: "out",
      },
    },
    interactivity: {
      events: { onHover: { enable: false }, onClick: { enable: false } }
    },
    detectRetina: true,
  };

  const [playDrone, { stop: stopDrone }] = useSound(AUDIO_ASSETS.drone, { volume: 0.4 });
  const [playCharge, { stop: stopCharge }] = useSound(AUDIO_ASSETS.charge, { volume: 0.6 });
  const [playImpact, { stop: stopImpact }] = useSound(AUDIO_ASSETS.impact, { volume: 0.8 });
  const [playShimmer, { stop: stopShimmer }] = useSound(AUDIO_ASSETS.shimmer, { volume: 0.3 });

  const stopAllAudio = useCallback(() => {
    stopDrone(); stopCharge(); stopImpact(); stopShimmer();
  }, [stopDrone, stopCharge, stopImpact, stopShimmer]);

  const [scope, animate] = useAnimate();
  const activeTimeoutsRef = useRef([]);
  const animationControlsRef = useRef(null);
  const audioCtxRef = useRef(null);
  const cardRef = useRef(null);

  // Canvas refs for visual effects
  const bgCanvasRef = useRef(null);
  const fgCanvasRef = useRef(null);
  const rafRef = useRef(null);
  const timelineStartRef = useRef(0);
  const activeTierRef = useRef('standard');

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.revealDate === localDateKey()) {
          const card = LUCKY_CARDS.find(c => c.id === parsed.cardId);
          if (card) {
            setSelectedCard(card);
            setIsRevealed(true);
          }
        } else {
          setPreviousCardId(parsed.cardId);
        }
      }
    } catch (e) {}
    setIsReady(true);

    return () => {
      stopAll();
      if (typeof stopAllAudio === 'function') stopAllAudio();
    };
  }, []);

  const stopAll = useCallback(() => {
    activeTimeoutsRef.current.forEach(window.clearTimeout);
    activeTimeoutsRef.current = [];
    if (animationControlsRef.current) {
      animationControlsRef.current.stop();
      animationControlsRef.current = null;
    }
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
      audioCtxRef.current.close().catch(() => {});
      audioCtxRef.current = null;
    }
  }, []);

  // --- AUDIO ORCHESTRATION ---
  const triggerAudioSequence = (tier) => {
    if (shouldReduceMotion) return;

    stopAllAudio();
    playDrone();

    activeTimeoutsRef.current.push(window.setTimeout(() => playCharge(), 4000));
    activeTimeoutsRef.current.push(window.setTimeout(() => {
      stopDrone();
      playImpact();
    }, 8000));
    activeTimeoutsRef.current.push(window.setTimeout(() => playShimmer(), 8500));
  };

  const triggerCardDraw = () => {
    stopAll();

    const card = selectWeightedLuckyCard(previousCardId);
    activeTierRef.current = card.tier;
    setSelectedCard(card);
    setIsRevealed(false);
    setIsGenerating(true);
    setImageError(false);

    triggerAudioSequence(card.tier);

    // --- FRAMER MOTION CHOREOGRAPHY ---
    // Total sequence ~ 9.2s
    activeTimeoutsRef.current.push(window.setTimeout(() => {
      const sequence = [];

      // 0.0s - 4.0s: Anticipation
      sequence.push([cardRef.current, { y: [0, -10], scale: [1, 1.02] }, { duration: 4.0, ease: 'easeInOut' }]);

      // 4.0s - 7.5s: Energy Gathering
      const intensity = card.tier === 'flagship' ? 1.5 : (card.tier === 'premium' ? 1.2 : 1.0);
      sequence.push([cardRef.current, {
        y: [-10, -15, -8, -18, -12],
        rotateZ: [-1, 2, -2, 1, 0],
        scale: [1.02, 1.05]
      }, { duration: 3.5, ease: 'easeInOut', at: '4.0' }]);

      // 7.5s - 8.0s: Convergence (Tension)
      sequence.push([cardRef.current, { y: 0, rotateZ: 0, scale: 0.98 }, { duration: 0.5, ease: 'easeIn', at: '7.5' }]);

      // 8.0s: IMPACT
      sequence.push([cardRef.current, { scale: 1.15, z: 100 }, { duration: 0.1, ease: 'easeOut', at: '8.0' }]);

      // 8.1s - 8.5s: Silence/Freeze (Flagship holds longer)
      const holdTime = card.tier === 'flagship' ? 0.4 : 0.1;

      // 8.5s: Card Reveal (Flip)
      const flipAt = 8.0 + holdTime;
      sequence.push([cardRef.current, { scale: 1, z: 0 }, { duration: 0.7, ease: 'easeInOut', at: flipAt.toString() }]);

      animationControlsRef.current = animate(sequence);
    }, 0));

    // Handle actual state flip
    const holdTimeMs = card.tier === 'flagship' ? 400 : 100;
    const flipStartTime = 8000 + holdTimeMs;

    // 8.5s: Trigger React state for flip
    activeTimeoutsRef.current.push(window.setTimeout(() => {
      setIsRevealed(true);
    }, flipStartTime));

    // 9.2s: Sequence Complete
    activeTimeoutsRef.current.push(window.setTimeout(() => {
      setIsGenerating(false);
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify({
          cardId: card.id,
          revealDate: localDateKey(),
        }));
        const unlockedStr = window.localStorage.getItem('unlockedCards');
        let unlocked = unlockedStr ? JSON.parse(unlockedStr) : [];
        if (!unlocked.includes(card.id)) {
          unlocked.push(card.id);
          window.localStorage.setItem('unlockedCards', JSON.stringify(unlocked));
          window.dispatchEvent(new Event('unlockedCardsUpdated'));
        }
      } catch (e) {}
    }, flipStartTime + 700));
  };

  return (
    <div className="w-full max-w-sm mx-auto flex flex-col items-center px-4 py-4 space-y-6 select-none relative z-10">
      
      {/* Background Effects Canvas */}
      {isGenerating && (
        <div className="fixed inset-0 w-full h-full pointer-events-none z-[-10]" style={{ mixBlendMode: 'screen' }}>
          <Particles
            id="tsparticles"
            init={particlesInit}
            options={particlesOptions}
            className="w-full h-full"
          />
        </div>
      )}

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
            disabled={isGenerating}
            className="mt-2 px-6 py-2.5 rounded-full bg-gradient-to-r from-amber-400 to-amber-600 text-slate-950 font-bold text-base shadow-lg hover:brightness-110 active:scale-95 transition-all"
          >
            {isGenerating ? 'Revealing...' : 'Reveal Today’s Luck'}
          </button>
        )}
      </div>

      {/* 2. 3D Card Stage */}
      <div ref={scope} className="w-full flex justify-center py-2 flex-shrink-0 relative">
        <motion.div
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
                  <Image alt="Card Back Face" className="object-cover rounded-2xl" fill priority quality={100} src="/IMG_20260728_220305_112042.png"/>
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
        </motion.div>
      </div>

      {/* 3. Quote & Share Actions */}
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
