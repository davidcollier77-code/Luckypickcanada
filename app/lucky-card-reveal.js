'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import Image from 'next/image';
import { motion, useAnimate, useReducedMotion } from 'framer-motion';
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

// --- WEB AUDIO SYNTHESIS ENGINE ---
// Replaces static Howler assets for a premium, perfectly synced soundscape

const playTone = (ctx, type, freq, time, duration, vol, detune = 0) => {
  if (!ctx || ctx.state === 'closed') return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, time);
  if (detune) osc.detune.value = detune;

  gain.gain.setValueAtTime(0, time);
  gain.gain.linearRampToValueAtTime(vol, time + duration * 0.1);
  gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(time);
  osc.stop(time + duration);
  return { osc, gain };
};

const playNoise = (ctx, time, duration, vol, filterFreq, filterType = 'bandpass') => {
  if (!ctx || ctx.state === 'closed') return;
  const bufferSize = ctx.sampleRate * duration;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }

  const noise = ctx.createBufferSource();
  noise.buffer = buffer;
  const filter = ctx.createBiquadFilter();
  filter.type = filterType;
  filter.frequency.setValueAtTime(filterFreq, time);

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0, time);
  gain.gain.linearRampToValueAtTime(vol, time + duration * 0.1);
  gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

  noise.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);

  noise.start(time);
  return { noise, gain, filter };
};

export default function LuckyCardReveal() {
  const [selectedCard, setSelectedCard] = useState(null);
  const [previousCardId, setPreviousCardId] = useState(null);
  const [isRevealed, setIsRevealed] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [imageError, setImageError] = useState(false);
  const shouldReduceMotion = useReducedMotion();

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

    return () => stopAll();
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
  const playAudioSequence = (tier) => {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;

    if (audioCtxRef.current) {
      audioCtxRef.current.close().catch(() => {});
    }

    const ctx = new AudioContextClass();
    audioCtxRef.current = ctx;
    ctx.resume(); // For mobile

    const now = ctx.currentTime;

    // 0.0s: Tap / Activation
    playTone(ctx, 'sine', 880, now, 0.5, 0.1);
    playTone(ctx, 'sine', 1760, now, 0.5, 0.05);

    // 0.0s - 4.0s: Deep atmospheric drone
    const drone = ctx.createOscillator();
    const droneGain = ctx.createGain();
    drone.type = 'sine';
    drone.frequency.setValueAtTime(55, now); // Low A
    drone.frequency.linearRampToValueAtTime(65, now + 4);
    droneGain.gain.setValueAtTime(0, now);
    droneGain.gain.linearRampToValueAtTime(0.3, now + 2);
    droneGain.gain.linearRampToValueAtTime(0, now + 8);
    drone.connect(droneGain);
    droneGain.connect(ctx.destination);
    drone.start(now);
    drone.stop(now + 8);

    // 4.0s - 7.5s: Energy Gathering (Rising Whoosh + Rumble)
    const gatherStart = now + 4.0;
    const { filter: gatherFilter, gain: gatherGain } = playNoise(ctx, gatherStart, 3.5, 0, 400, 'bandpass') || {};
    if (gatherFilter && gatherGain) {
      gatherFilter.frequency.exponentialRampToValueAtTime(4000, gatherStart + 3.5);
      gatherGain.gain.linearRampToValueAtTime(0.5, gatherStart + 3.0);
      gatherGain.gain.linearRampToValueAtTime(0, gatherStart + 3.5);
    }

    const rumble = ctx.createOscillator();
    const rumbleGain = ctx.createGain();
    rumble.type = 'sawtooth';
    rumble.frequency.setValueAtTime(40, gatherStart);
    rumble.frequency.linearRampToValueAtTime(80, gatherStart + 3.5);
    rumbleGain.gain.setValueAtTime(0, gatherStart);
    rumbleGain.gain.linearRampToValueAtTime(0.2, gatherStart + 3.0);
    rumbleGain.gain.linearRampToValueAtTime(0, gatherStart + 3.5);

    const bq = ctx.createBiquadFilter();
    bq.type = 'lowpass';
    bq.frequency.setValueAtTime(200, gatherStart);
    bq.frequency.linearRampToValueAtTime(800, gatherStart + 3.5);

    rumble.connect(bq);
    bq.connect(rumbleGain);
    rumbleGain.connect(ctx.destination);
    rumble.start(gatherStart);
    rumble.stop(gatherStart + 3.5);

    // 8.0s: Impact
    const impactTime = now + 8.0;
    // Sub bass drop
    const sub = ctx.createOscillator();
    const subGain = ctx.createGain();
    sub.type = 'sine';
    sub.frequency.setValueAtTime(120, impactTime);
    sub.frequency.exponentialRampToValueAtTime(30, impactTime + 1);
    subGain.gain.setValueAtTime(0, impactTime);
    subGain.gain.setValueAtTime(0.8, impactTime + 0.05);
    subGain.gain.exponentialRampToValueAtTime(0.001, impactTime + 1.5);
    sub.connect(subGain);
    subGain.connect(ctx.destination);
    sub.start(impactTime);
    sub.stop(impactTime + 1.5);

    // Magic spark (noise burst)
    const { filter: sparkFilt } = playNoise(ctx, impactTime, 0.5, 0.6, 5000, 'highpass') || {};
    if (sparkFilt) {
      sparkFilt.frequency.linearRampToValueAtTime(1000, impactTime + 0.5);
    }

    // 8.5s: Card Flip starts
    const flipTime = now + 8.5;
    const flipResult = playNoise(ctx, flipTime, 0.7, 0.3, 1000, 'bandpass');
    const { filter: flipFilt } = flipResult || {};
    if (flipFilt) {
      flipFilt.frequency.exponentialRampToValueAtTime(8000, flipTime + 0.35);
      flipFilt.frequency.exponentialRampToValueAtTime(1000, flipTime + 0.7);
    }

    // 9.2s: Chime / Shimmer (Card Face Appears)
    const chimeTime = now + 9.2;
    const root = tier === 'flagship' ? 1046.50 : (tier === 'premium' ? 880 : 523.25); // C6, A5, C5
    playTone(ctx, 'sine', root, chimeTime, 3.0, 0.3);
    playTone(ctx, 'sine', root * 1.5, chimeTime + 0.1, 2.5, 0.2); // Perfect fifth
    playTone(ctx, 'sine', root * 2.0, chimeTime + 0.2, 2.0, 0.15); // Octave
    if (tier !== 'standard') {
      playTone(ctx, 'sine', root * 1.25, chimeTime + 0.15, 2.5, 0.1); // Major third
      // Shimmer detune
      playTone(ctx, 'sine', root * 2.0, chimeTime + 0.2, 2.0, 0.1, 15);
      playTone(ctx, 'sine', root * 2.0, chimeTime + 0.2, 2.0, 0.1, -15);
    }
  };

  // --- CANVAS VISUAL EFFECTS ---
  const renderCanvas = (time) => {
    if (!timelineStartRef.current) timelineStartRef.current = time;
    const elapsed = (time - timelineStartRef.current) / 1000; // in seconds
    const tier = activeTierRef.current;

    // Background Canvas (Atmosphere & Gathering)
    const bg = bgCanvasRef.current;
    if (bg && bg.getContext) {
      const ctx = bg.getContext('2d');
      const w = bg.width;
      const h = bg.height;
      ctx.clearRect(0, 0, w, h);

      const cx = w / 2;
      const cy = h / 2;

      // Phase 1 & 2: Gathering (0 to 7.5s)
      if (elapsed > 0 && elapsed < 8.0) {
        let intensity = 0;
        if (elapsed < 4.0) intensity = elapsed / 4.0 * 0.3; // Slow build
        else if (elapsed < 7.5) intensity = 0.3 + ((elapsed - 4.0) / 3.5) * 0.7; // Fast gather
        else intensity = 1.0; // Tension breath

        ctx.save();
        ctx.globalCompositeOperation = 'screen';

        // Energy ribbons
        const ribbonCount = tier === 'flagship' ? 6 : (tier === 'premium' ? 4 : 2);
        for (let i = 0; i < ribbonCount; i++) {
          const isLeft = i % 2 === 0;
          const progress = (elapsed * 0.5 + i * 0.2) % 1.0;

          // Ribbons start from edges and move to center
          const startX = isLeft ? -50 : w + 50;
          const endX = cx;
          const currentX = startX + (endX - startX) * Math.pow(intensity, 2);

          ctx.beginPath();
          ctx.moveTo(startX, cy + (Math.sin(time*0.001 + i) * 100));

          // Bezier wave to center
          const cp1x = startX + (currentX - startX) * 0.5;
          const cp1y = cy + (Math.sin(time*0.002 + i) * 200);
          const cp2x = currentX;
          const cp2y = cy + (Math.cos(time*0.0015 + i) * 50);

          ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, currentX, cy);

          // Styling
          ctx.lineWidth = 2 + (intensity * 10);
          ctx.lineCap = 'round';

          let grad = ctx.createLinearGradient(startX, cy, currentX, cy);
          const baseColor = tier === 'standard' ? '255, 255, 255' : (tier === 'premium' ? '100, 200, 255' : '255, 220, 100');
          grad.addColorStop(0, `rgba(${baseColor}, 0)`);
          grad.addColorStop(1, `rgba(${baseColor}, ${intensity * 0.6})`);

          ctx.strokeStyle = grad;
          ctx.filter = `blur(${5 + intensity * 5}px)`;
          ctx.stroke();
        }
        ctx.restore();
      }

      // Phase 3: Impact Burst (8.0s)
      if (elapsed >= 8.0 && elapsed < 9.5) {
        const burstAge = elapsed - 8.0;
        const burstProgress = Math.min(burstAge / 1.5, 1);
        const invProgress = 1 - burstProgress;

        ctx.save();
        ctx.globalCompositeOperation = 'screen';

        // Radial pulse
        const radius = burstProgress * w * 1.5;
        const pulseGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
        const pulseColor = tier === 'flagship' ? '255, 200, 50' : (tier === 'premium' ? '150, 220, 255' : '255, 255, 255');
        pulseGrad.addColorStop(0, `rgba(${pulseColor}, ${invProgress * 0.8})`);
        pulseGrad.addColorStop(0.5, `rgba(${pulseColor}, ${invProgress * 0.4})`);
        pulseGrad.addColorStop(1, `rgba(${pulseColor}, 0)`);

        ctx.fillStyle = pulseGrad;
        ctx.fillRect(0, 0, w, h);

        // Flagship electrical veins
        if (tier === 'flagship' && burstAge < 0.5) {
          ctx.filter = 'blur(2px)';
          for (let j = 0; j < 5; j++) {
            ctx.beginPath();
            ctx.moveTo(cx, cy);
            let px = cx;
            let py = cy;
            for (let k = 0; k < 5; k++) {
              px += (Math.random() - 0.5) * 150;
              py += (Math.random() - 0.5) * 150;
              ctx.lineTo(px, py);
            }
            ctx.strokeStyle = `rgba(255, 255, 200, ${1 - (burstAge/0.5)})`;
            ctx.lineWidth = 3;
            ctx.stroke();
          }
        }

        ctx.restore();
      }
    }

    if (elapsed < 12.0) {
      rafRef.current = requestAnimationFrame(renderCanvas);
    }
  };

  const triggerCardDraw = () => {
    stopAll();

    const card = selectWeightedLuckyCard(previousCardId);
    activeTierRef.current = card.tier;
    setSelectedCard(card);
    setIsRevealed(false);
    setIsGenerating(true);
    setImageError(false);

    // Setup Canvas
    if (bgCanvasRef.current) {
      bgCanvasRef.current.width = window.innerWidth;
      bgCanvasRef.current.height = window.innerHeight;
    }

    timelineStartRef.current = 0;
    if (!shouldReduceMotion) {
      rafRef.current = requestAnimationFrame(renderCanvas);
    }

    playAudioSequence(card.tier);

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
        <canvas
          ref={bgCanvasRef}
          className="fixed inset-0 w-full h-full pointer-events-none z-[-10]"
          style={{ mixBlendMode: 'screen' }}
        />
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
