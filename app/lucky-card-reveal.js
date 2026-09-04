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

const STRIKE_SCHEDULES = {
  standard: [3.0, 5.0, 8.0],
  premium: [2.5, 4.2, 5.6, 6.8, 8.0],
  flagship: [2.0, 3.5, 4.8, 5.8, 6.6, 7.3, 8.0]
};

export default function LuckyCardReveal() {
  const [selectedCard, setSelectedCard] = useState(null);
  const [previousCardId, setPreviousCardId] = useState(null);
  const [isRevealed, setIsRevealed] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [imageError, setImageError] = useState(false);
  const shouldReduceMotion = useReducedMotion();

  // Audio Loading State
  const [audioBuffers, setAudioBuffers] = useState(null);
  const [audioLoading, setAudioLoading] = useState(true);

  const [scope, animate] = useAnimate();
  const activeTimeoutsRef = useRef([]);
  const animationControlsRef = useRef(null);
  const audioCtxRef = useRef(null);
  const activeAudioNodesRef = useRef([]);
  const cardRef = useRef(null);

  // Canvas refs for visual effects
  const bgCanvasRef = useRef(null);
  const rafRef = useRef(null);
  const timelineStartRef = useRef(0);
  const activeTierRef = useRef('standard');

  // Load Audio Assets
  useEffect(() => {
    let mounted = true;
    const loadAudio = async () => {
      try {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        const ctx = new AudioContextClass();
        const files = {
          lightning: '/yodguard-lightning-magic-3-378649.mp3',
          coin: '/freesound_community-shaking-coins-105774.mp3',
          whoosh: '/dragon-studio-whoosh-cinematic-376875.mp3'
        };

        const buffers = {};
        for (const [key, url] of Object.entries(files)) {
          const response = await fetch(url);
          const arrayBuffer = await response.arrayBuffer();
          buffers[key] = await ctx.decodeAudioData(arrayBuffer);
        }

        if (mounted) {
          setAudioBuffers(buffers);
          setAudioLoading(false);
        }
        // Don't keep this context alive, we create a fresh one per reveal
        ctx.close().catch(() => {});
      } catch (err) {
        console.error("Failed to preload audio:", err);
        if (mounted) setAudioLoading(false); // Fail gracefully
      }
    };
    loadAudio();
    return () => { mounted = false; };
  }, []);

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
  }, []);

  const stopAll = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (animationControlsRef.current) animationControlsRef.current.stop();
    activeTimeoutsRef.current.forEach(clearTimeout);
    activeTimeoutsRef.current = [];
    activeAudioNodesRef.current.forEach(node => {
      try { node.stop(); } catch (e) {}
    });
    activeAudioNodesRef.current = [];
    if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
      audioCtxRef.current.close().catch(() => {});
    }
  }, []);

  useEffect(() => {
    return stopAll;
  }, [stopAll]);

  // Audio Playback Helpers
  const playBuffer = (ctx, buffer, time, vol = 1.0, playbackRate = 1.0, duration = null) => {
    if (!ctx || !buffer) return;
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.playbackRate.value = playbackRate;

    const gainNode = ctx.createGain();
    gainNode.gain.setValueAtTime(vol, Math.max(0, time));

    source.connect(gainNode);
    gainNode.connect(ctx.destination);

    source.start(Math.max(0, time));

    if (duration !== null) {
        // Apply fade out instead of an abrupt stop
        const fadeOutTime = 0.05;
        gainNode.gain.setTargetAtTime(0, Math.max(0, time + duration - fadeOutTime), fadeOutTime / 3);
        source.stop(Math.max(0, time + duration));
    }

    activeAudioNodesRef.current.push(source);

    // Cleanup reference after it finishes
    const cleanupTime = duration !== null ? duration : buffer.duration / playbackRate;
    const timeoutMs = Math.max(0, (time - ctx.currentTime) + cleanupTime + 0.1) * 1000;

    activeTimeoutsRef.current.push(window.setTimeout(() => {
        activeAudioNodesRef.current = activeAudioNodesRef.current.filter(n => n !== source);
    }, timeoutMs));

    return source;
  };

  const playAudioSequence = (tier, schedule) => {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;

    if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
      audioCtxRef.current.close().catch(() => {});
    }

    const ctx = new AudioContextClass();
    audioCtxRef.current = ctx;
    ctx.resume(); // For mobile

    const now = ctx.currentTime;
    activeAudioNodesRef.current = [];

    if (!audioBuffers) return;

    const finalStrikeTime = now + schedule[schedule.length - 1];

    // 1. Initial Activation Cue
    const initOsc = ctx.createOscillator();
    const initGain = ctx.createGain();
    initOsc.type = 'triangle';
    initOsc.frequency.setValueAtTime(440, now);
    initOsc.frequency.exponentialRampToValueAtTime(880, now + 0.5);
    initGain.gain.setValueAtTime(0, now);
    initGain.gain.linearRampToValueAtTime(0.1, now + 0.1);
    initGain.gain.setTargetAtTime(0, now + 0.2, 0.2);
    initOsc.connect(initGain);
    initGain.connect(ctx.destination);
    initOsc.start(now);
    initOsc.stop(now + 1.0);
    activeAudioNodesRef.current.push(initOsc);

    // 2. Energy Buildup (drone)
    const drone = ctx.createOscillator();
    const droneGain = ctx.createGain();
    drone.type = 'sine';
    drone.frequency.setValueAtTime(45, now);
    drone.frequency.linearRampToValueAtTime(65, finalStrikeTime);
    droneGain.gain.setValueAtTime(0, now);
    droneGain.gain.linearRampToValueAtTime(0.15, now + 1.5);
    droneGain.gain.linearRampToValueAtTime(0.3, finalStrikeTime - 0.5);
    droneGain.gain.setTargetAtTime(0, finalStrikeTime, 0.05); // Fade out right on final strike
    drone.connect(droneGain);
    droneGain.connect(ctx.destination);
    drone.start(now);
    drone.stop(finalStrikeTime + 0.2);
    activeAudioNodesRef.current.push(drone);

    // Schedule strikes
    schedule.forEach((timeOffset, idx) => {
      const isFinal = idx === schedule.length - 1;
      const strikeTime = now + timeOffset;

      const intensity = isFinal ? (tier === 'flagship' ? 1.5 : 1.2) : 0.4 + (idx / schedule.length) * 0.4;

      // 3. Incoming Energy (sweep before impact matching 0.3s travel time)
      const sweepOsc = ctx.createOscillator();
      const sweepGain = ctx.createGain();
      sweepOsc.type = 'sine';
      sweepOsc.frequency.setValueAtTime(800, strikeTime - 0.3);
      sweepOsc.frequency.exponentialRampToValueAtTime(200, strikeTime);
      sweepGain.gain.setValueAtTime(0, strikeTime - 0.3);
      sweepGain.gain.linearRampToValueAtTime(0.1 * intensity, strikeTime - 0.1);
      sweepGain.gain.setTargetAtTime(0, strikeTime, 0.05);
      sweepOsc.connect(sweepGain);
      sweepGain.connect(ctx.destination);
      sweepOsc.start(Math.max(0, strikeTime - 0.3));
      sweepOsc.stop(strikeTime + 0.1);
      activeAudioNodesRef.current.push(sweepOsc);

      // 4. Impact
      // Use negative offset to ensure perceptual sync
      const impactOffset = -0.03;
      playBuffer(ctx, audioBuffers.lightning, strikeTime + impactOffset, intensity * 0.7, isFinal ? 0.9 : 1.1);

      // 5. Card Shake
      // Exactly constrained to the shake duration
      const shakeDur = isFinal ? 0.4 : 0.2;
      playBuffer(ctx, audioBuffers.coin, strikeTime, intensity * 0.5, 1.2, shakeDur);

      // 6. Final Impact Details
      if (isFinal) {
        // Anticipation whoosh leading directly into strike
        playBuffer(ctx, audioBuffers.whoosh, strikeTime - 0.4, 0.8, 1.5, 0.4);

        // Sub bass drop on impact
        const sub = ctx.createOscillator();
        const subGain = ctx.createGain();
        sub.type = 'sine';
        sub.frequency.setValueAtTime(80, strikeTime);
        sub.frequency.exponentialRampToValueAtTime(20, strikeTime + 1.0);
        subGain.gain.setValueAtTime(0, strikeTime);
        subGain.gain.setValueAtTime(0.6 * (tier === 'flagship' ? 1.2 : 1), strikeTime + 0.05);
        subGain.gain.setTargetAtTime(0, strikeTime + 0.1, 0.3);
        sub.connect(subGain);
        subGain.connect(ctx.destination);
        sub.start(strikeTime);
        sub.stop(strikeTime + 1.5);
        activeAudioNodesRef.current.push(sub);
      }
    });

    // 8 & 9. Card Flip and Reveal
    // Shake dur = 0.4 on final, plus 0.25 breathing room
    const flipAt = finalStrikeTime + 0.65;

    // Flip metallic shimmer
    const flipOsc = ctx.createOscillator();
    const flipGain = ctx.createGain();
    flipOsc.type = 'sine';
    flipOsc.frequency.setValueAtTime(600, flipAt);
    flipOsc.frequency.linearRampToValueAtTime(1200, flipAt + 0.4);
    flipGain.gain.setValueAtTime(0, flipAt);
    flipGain.gain.linearRampToValueAtTime(0.15, flipAt + 0.2);
    flipGain.gain.setTargetAtTime(0, flipAt + 0.4, 0.1);
    flipOsc.connect(flipGain);
    flipGain.connect(ctx.destination);
    flipOsc.start(flipAt);
    flipOsc.stop(flipAt + 0.8);
    activeAudioNodesRef.current.push(flipOsc);

    // Reveal Chime
    const revealTime = flipAt + 0.35; // Face visible
    const chimeOsc = ctx.createOscillator();
    const chimeGain = ctx.createGain();
    chimeOsc.type = 'triangle';
    chimeOsc.frequency.setValueAtTime(880, revealTime);
    chimeOsc.frequency.setValueAtTime(1760, revealTime + 0.1);
    chimeGain.gain.setValueAtTime(0, revealTime);
    chimeGain.gain.setValueAtTime(0.2, revealTime + 0.05);
    chimeGain.gain.setTargetAtTime(0, revealTime + 0.1, 0.5);
    chimeOsc.connect(chimeGain);
    chimeGain.connect(ctx.destination);
    chimeOsc.start(revealTime);
    chimeOsc.stop(revealTime + 2.0);
    activeAudioNodesRef.current.push(chimeOsc);
  };

  const renderCanvas = (timestamp) => {
    if (!bgCanvasRef.current || shouldReduceMotion) return;

    if (!timelineStartRef.current) timelineStartRef.current = timestamp;
    const elapsed = (timestamp - timelineStartRef.current) / 1000;

    const ctx = bgCanvasRef.current.getContext('2d');
    const w = bgCanvasRef.current.width;
    const h = bgCanvasRef.current.height;
    const cx = w / 2;
    const cy = h / 2;
    const tier = activeTierRef.current;

    ctx.clearRect(0, 0, w, h);

    const schedule = STRIKE_SCHEDULES[tier];

    let totalEnergyAbsorbed = 0;

    // Draw strikes
    schedule.forEach((strikeTime, idx) => {
      const timeSinceStrike = elapsed - strikeTime;
      const isFinal = idx === schedule.length - 1;

      // Add to accumulated energy
      if (timeSinceStrike > 0) {
        totalEnergyAbsorbed += Math.min(timeSinceStrike * 2, 1);
      }

      // Strike animation (starts slightly before impact, travels, hits, fades)
      const travelTime = 0.3;
      const fadeTime = isFinal ? 1.0 : 0.4;
      const strikeStart = strikeTime - travelTime;

      if (elapsed >= strikeStart && elapsed < strikeTime + fadeTime) {
        const side = idx % 2 === 0 ? 'left' : 'right';
        const startX = side === 'left' ? 0 : w;

        let progress = 0;
        let opacity = 0;

        if (elapsed < strikeTime) {
          // Traveling inwards
          progress = (elapsed - strikeStart) / travelTime;
          opacity = progress;
        } else {
          // Hit and fade
          progress = 1;
          opacity = 1 - (timeSinceStrike / fadeTime);
        }

        const currentX = startX + (cx - startX) * progress;

        ctx.save();
        ctx.globalCompositeOperation = 'screen';

        // Main beam
        ctx.beginPath();
        ctx.moveTo(startX, cy + (Math.sin(idx * 13) * 50));

        const cp1x = startX + (currentX - startX) * 0.5;
        const cp1y = cy + (Math.sin(elapsed * 10 + idx) * 100);

        ctx.bezierCurveTo(cp1x, cp1y, currentX, cy, currentX, cy);

        ctx.lineWidth = isFinal ? 12 + opacity * 8 : 4 + opacity * 6;
        ctx.lineCap = 'round';

        const baseColor = tier === 'standard' ? '255, 255, 255' : (tier === 'premium' ? '100, 200, 255' : '255, 200, 50');

        ctx.strokeStyle = `rgba(${baseColor}, ${opacity * (isFinal ? 1 : 0.8)})`;
        ctx.shadowColor = `rgba(${baseColor}, 1)`;
        ctx.shadowBlur = isFinal ? 30 : 15;

        ctx.stroke();

        // Branches
        if (isFinal || opacity > 0.5) {
            ctx.beginPath();
            ctx.moveTo(cp1x, cp1y);
            const branchEndX = currentX - (currentX - startX) * 0.2;
            const branchEndY = cy + (Math.cos(elapsed * 15 + idx) * 120);
            ctx.lineTo(branchEndX, branchEndY);
            ctx.lineWidth = (isFinal ? 4 : 2) * opacity;
            ctx.stroke();
        }

        ctx.restore();

        // Impact flash (underneath the card)
        if (elapsed >= strikeTime && elapsed < strikeTime + 0.2) {
            const flashOpacity = 1 - (timeSinceStrike / 0.2);
            ctx.save();
            ctx.globalCompositeOperation = 'screen';
            const flashGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, w * (isFinal ? 0.8 : 0.4));
            flashGrad.addColorStop(0, `rgba(${baseColor}, ${flashOpacity * (isFinal ? 0.9 : 0.5)})`);
            flashGrad.addColorStop(1, `rgba(${baseColor}, 0)`);
            ctx.fillStyle = flashGrad;
            ctx.fillRect(0, 0, w, h);
            ctx.restore();
        }
      }
    });

    // Draw Aura (builds over time behind the card)
    if (totalEnergyAbsorbed > 0) {
      ctx.save();
      ctx.globalCompositeOperation = 'screen';

      const maxEnergy = schedule.length;
      const auraIntensity = Math.min(totalEnergyAbsorbed / maxEnergy, 1);

      // Pulsing effect
      const pulse = 1 + Math.sin(elapsed * 4) * 0.1;

      const auraRadius = (tier === 'flagship' ? 300 : (tier === 'premium' ? 250 : 200)) * pulse * auraIntensity;
      const baseColor = tier === 'standard' ? '200, 255, 255' : (tier === 'premium' ? '50, 150, 255' : '255, 180, 50');

      const auraGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, auraRadius);
      auraGrad.addColorStop(0, `rgba(${baseColor}, ${auraIntensity * 0.4})`);
      auraGrad.addColorStop(0.5, `rgba(${baseColor}, ${auraIntensity * 0.15})`);
      auraGrad.addColorStop(1, `rgba(${baseColor}, 0)`);

      ctx.fillStyle = auraGrad;
      ctx.fillRect(0, 0, w, h);
      ctx.restore();
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

    if (bgCanvasRef.current) {
      bgCanvasRef.current.width = window.innerWidth;
      bgCanvasRef.current.height = window.innerHeight;
    }

    timelineStartRef.current = 0;
    if (!shouldReduceMotion) {
      rafRef.current = requestAnimationFrame(renderCanvas);
    }

    const schedule = STRIKE_SCHEDULES[card.tier];
    playAudioSequence(card.tier, schedule);

    // --- FRAMER MOTION CHOREOGRAPHY ---
    const sequence = [];

    // Initial state
    sequence.push([cardRef.current, { y: 0, scale: 1, rotateZ: 0 }, { duration: 0.1 }]);
    sequence.push([cardRef.current, { y: -10 }, { at: "<", duration: 1.5, ease: 'easeOut' }]);

    // Synchronize physical reactions with strikes
    schedule.forEach((strikeTime, idx) => {
      const isFinal = idx === schedule.length - 1;

      // Reaction intensity scales with index and tier
      const power = isFinal ? 20 : 5 + (idx * 3);
      const rotPower = isFinal ? 5 : 2 + idx;
      const dir = idx % 2 === 0 ? 1 : -1;

      // The shake hits EXACTLY at the strike time
      const shakeDur = isFinal ? 0.4 : 0.2;

      sequence.push([
        cardRef.current,
        {
          x: [0, power * dir, -power * 0.8 * dir, power * 0.4 * dir, 0],
          rotateZ: [0, rotPower * dir, -rotPower * 0.5 * dir, 0],
          scale: isFinal ? [1, 1.15, 0.95, 1.05] : [1, 1.05, 1]
        },
        {
          at: strikeTime.toString(),
          duration: shakeDur,
          ease: "easeInOut"
        }
      ]);
    });

    const finalStrike = schedule[schedule.length - 1];
    // Shake dur = 0.4 on final, plus 0.25 breathing room
    const flipAt = finalStrike + 0.65;

    sequence.push([cardRef.current, { scale: 1, x: 0, y: 0, rotateZ: 0 }, { at: flipAt.toString(), duration: 0.8, ease: 'circOut' }]);

    animationControlsRef.current = animate(sequence);

    // Handle actual state flip
    const flipStartTime = flipAt * 1000;

    activeTimeoutsRef.current.push(window.setTimeout(() => {
      setIsRevealed(true);
    }, flipStartTime));

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
      
      {isGenerating && (
        <canvas
          ref={bgCanvasRef}
          className="fixed inset-0 w-full h-full pointer-events-none z-[-10]"
          style={{ mixBlendMode: 'screen' }}
        />
      )}

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
            disabled={isGenerating || audioLoading}
            className={`mt-2 px-6 py-2.5 rounded-full font-bold text-base shadow-lg transition-all ${
              audioLoading ? 'bg-gray-400 text-gray-700 opacity-70' : 'bg-gradient-to-r from-amber-400 to-amber-600 text-slate-950 hover:brightness-110 active:scale-95'
            }`}
          >
            {isGenerating ? 'Revealing...' : audioLoading ? 'Loading Magic...' : 'Reveal Today’s Luck'}
          </button>
        )}
      </div>

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
              <div
                className="absolute inset-0"
                style={{ backfaceVisibility: 'hidden' }}
              >
                <div className="absolute inset-0 bg-transparent rounded-2xl overflow-hidden shadow-2xl border-none">
                  <Image alt="Card Back Face" className="object-cover rounded-2xl" fill priority quality={100} src="/IMG_20260728_220305_112042.png"/>
                </div>
              </div>

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
