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
  const rafStartTimeRef = useRef(0);
  const audioStartTimeRef = useRef(0);
  const activeTierRef = useRef('standard');
  const isRevealedRef = useRef(false);
  const activeCardRef = useRef(null);

  // Load Audio Assets
  useEffect(() => {
    let mounted = true;
    const loadAudio = async () => {
      try {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        const ctx = new AudioContextClass();
        const files = {
          lightning: '/yodguard-lightning-magic-3-378649.mp3',
          buildup: '/freesound_community-starship-rail-gun-charge-35904.mp3',
          whoosh: '/dragon-studio-whoosh-cinematic-376875.mp3',
          firework: '/freesound_community-fireworks-1-94483.mp3'
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
    const actualStartTime = Math.max(0, time);
    const cleanupTime = duration !== null ? duration : (buffer.duration / playbackRate);
    const timeoutMs = Math.max(0, (actualStartTime - ctx.currentTime) + cleanupTime + 0.1) * 1000;

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
    audioStartTimeRef.current = now;
    activeAudioNodesRef.current = [];

    if (!audioBuffers) return;

    const finalStrikeTime = now + schedule[schedule.length - 1];

    // 1. Initial Atmospheric Buildup
    playBuffer(ctx, audioBuffers.buildup, now, 0.4, 0.6, finalStrikeTime + 1.0);

    // Deep sub rumble building up
    const drone = ctx.createOscillator();
    const droneGain = ctx.createGain();
    drone.type = 'sine';
    drone.frequency.setValueAtTime(35, now);
    drone.frequency.exponentialRampToValueAtTime(55, finalStrikeTime);

    // Add some harmonics with a sawtooth
    const droneHarmonic = ctx.createOscillator();
    droneHarmonic.type = 'sawtooth';
    droneHarmonic.frequency.setValueAtTime(35, now);
    droneHarmonic.frequency.exponentialRampToValueAtTime(55, finalStrikeTime);

    // Lowpass filter for the sawtooth so it's not harsh
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(150, now);
    filter.frequency.linearRampToValueAtTime(400, finalStrikeTime);

    droneHarmonic.connect(filter);
    filter.connect(droneGain);
    drone.connect(droneGain);

    droneGain.gain.setValueAtTime(0, now);
    droneGain.gain.linearRampToValueAtTime(0.2, now + 1.5);
    droneGain.gain.exponentialRampToValueAtTime(0.4, finalStrikeTime - 0.2);
    droneGain.gain.setTargetAtTime(0, finalStrikeTime, 0.05); // Snap fade on final strike

    droneGain.connect(ctx.destination);
    drone.start(now);
    droneHarmonic.start(now);
    drone.stop(finalStrikeTime + 0.5);
    droneHarmonic.stop(finalStrikeTime + 0.5);
    activeAudioNodesRef.current.push(drone, droneHarmonic);

    // Schedule strikes
    schedule.forEach((timeOffset, idx) => {
      const isFinal = idx === schedule.length - 1;
      const strikeTime = now + timeOffset;

      const intensity = isFinal ? (tier === 'flagship' ? 1.4 : 1.2) : 0.5 + (idx / schedule.length) * 0.4;

      // Energy sweep before impact
      if (idx > 0) {
          playBuffer(ctx, audioBuffers.whoosh, strikeTime - 0.5, intensity * 0.3, 1.5 + (idx * 0.2), 0.6);
      }

      // 4. Impact (Lightning + Firework layering)
      const impactOffset = -0.02;
      playBuffer(ctx, audioBuffers.lightning, strikeTime + impactOffset, intensity * 0.6, isFinal ? 0.8 : 1.0 + (idx * 0.1));

      // Add a subtle thump/firework sound to the strike for weight
      playBuffer(ctx, audioBuffers.firework, strikeTime, intensity * 0.4, 1.2 + (idx * 0.1), 1.0);


      // Short, subtle magical impact burst
      const burst = ctx.createOscillator();
      const burstGain = ctx.createGain();
      burst.type = 'triangle';
      burst.frequency.setValueAtTime(isFinal ? 800 : 400 + (idx * 150), strikeTime);
      burst.frequency.exponentialRampToValueAtTime(isFinal ? 200 : 100, strikeTime + 0.2);

      burstGain.gain.setValueAtTime(0, strikeTime);
      burstGain.gain.setValueAtTime(intensity * 0.8, strikeTime + 0.01); // sharp attack
      burstGain.gain.exponentialRampToValueAtTime(0.01, strikeTime + 0.2); // quick decay

      burst.connect(burstGain);
      burstGain.connect(ctx.destination);
      burst.start(strikeTime);
      burst.stop(strikeTime + 0.3);
      activeAudioNodesRef.current.push(burst);


      // Sub bass drop on every impact, but huge on the final one
      const sub = ctx.createOscillator();
      const subGain = ctx.createGain();
      sub.type = 'sine';
      sub.frequency.setValueAtTime(isFinal ? 60 : 80, strikeTime);
      sub.frequency.exponentialRampToValueAtTime(20, strikeTime + (isFinal ? 1.5 : 0.5));
      subGain.gain.setValueAtTime(0, strikeTime);
      subGain.gain.setValueAtTime(isFinal ? 0.8 : 0.4 * intensity, strikeTime + 0.02);
      subGain.gain.exponentialRampToValueAtTime(0.01, strikeTime + (isFinal ? 1.0 : 0.4));
      sub.connect(subGain);
      subGain.connect(ctx.destination);
      sub.start(strikeTime);
      sub.stop(strikeTime + (isFinal ? 1.5 : 0.5));
      activeAudioNodesRef.current.push(sub);

      // 6. Final Impact Details
      if (isFinal) {
        // Anticipation heavy whoosh
        playBuffer(ctx, audioBuffers.whoosh, strikeTime - 0.7, 0.9, 0.8, 0.8);
        playBuffer(ctx, audioBuffers.whoosh, strikeTime - 0.3, 0.9, 1.2, 0.5);
      }
    });

    // 8. Card Flip and Reveal Magic Shimmer
    const flipAt = finalStrikeTime + 0.65;
    const revealTime = flipAt + 0.35; // Face visible

    // Play a reversed whoosh for the flip? Or just a soft whoosh
    playBuffer(ctx, audioBuffers.whoosh, flipAt, 0.5, 1.8, 0.8);

    // Cinematic Reveal Chime/Shimmer built with oscillators
    const shimmerOsc1 = ctx.createOscillator();
    const shimmerOsc2 = ctx.createOscillator();
    const shimmerGain = ctx.createGain();

    shimmerOsc1.type = 'sine';
    shimmerOsc2.type = 'triangle';

    // Mystical chord (e.g. Major 9th feel)
    shimmerOsc1.frequency.setValueAtTime(880, revealTime); // A5
    shimmerOsc2.frequency.setValueAtTime(1318.51, revealTime); // E6

    // Add subtle detune for a chorus effect
    shimmerOsc1.detune.setValueAtTime(5, revealTime);
    shimmerOsc2.detune.setValueAtTime(-5, revealTime);

    shimmerGain.gain.setValueAtTime(0, revealTime);
    shimmerGain.gain.linearRampToValueAtTime(0.15, revealTime + 0.1);
    shimmerGain.gain.exponentialRampToValueAtTime(0.01, revealTime + 3.0);

    shimmerOsc1.connect(shimmerGain);
    shimmerOsc2.connect(shimmerGain);

    // Highpass filter for shimmer to keep it ethereal
    const shimmerFilter = ctx.createBiquadFilter();
    shimmerFilter.type = 'highpass';
    shimmerFilter.frequency.value = 600;

    shimmerGain.connect(shimmerFilter);
    shimmerFilter.connect(ctx.destination);

    shimmerOsc1.start(revealTime);
    shimmerOsc2.start(revealTime);
    shimmerOsc1.stop(revealTime + 4.0);
    shimmerOsc2.stop(revealTime + 4.0);
    activeAudioNodesRef.current.push(shimmerOsc1, shimmerOsc2);

    return ctx;
  };

  const renderCanvas = (timestamp) => {
    if (!bgCanvasRef.current || shouldReduceMotion) return;

    if (!rafStartTimeRef.current) rafStartTimeRef.current = timestamp;

    const audioCtx = audioCtxRef.current;
    let elapsed = 0;

    // Master Clock: AudioContext (if running), else requestAnimationFrame timestamp
    if (audioCtx && audioCtx.state === 'running') {
      elapsed = audioCtx.currentTime - audioStartTimeRef.current;
    } else {
      elapsed = (timestamp - rafStartTimeRef.current) / 1000;
    }

    // Drive Framer Motion sequence manually so it is locked to the Master Clock
    if (animationControlsRef.current && 'time' in animationControlsRef.current) {
        animationControlsRef.current.time = Math.max(0, Math.min(elapsed, 12.0));
    }

    const ctx = bgCanvasRef.current.getContext('2d');
    const w = bgCanvasRef.current.width;
    const h = bgCanvasRef.current.height;
    const cx = w / 2;
    const cy = h / 2;
    const tier = activeTierRef.current;

    ctx.clearRect(0, 0, w, h);

    const schedule = STRIKE_SCHEDULES[tier];
    let totalEnergyAbsorbed = 0;

    // Accumulate global effects to render them once per frame
    let maxFlashOpacity = 0;
    let flashRgb = '255, 255, 255';
    let flashGlowColor = '255, 255, 255';
    let isFinalFlash = false;

    // Draw strikes
    schedule.forEach((strikeTime, idx) => {
      const timeSinceStrike = elapsed - strikeTime;
      const isFinal = idx === schedule.length - 1;

      // Add to accumulated energy
      if (timeSinceStrike > 0) {
        totalEnergyAbsorbed += Math.min(timeSinceStrike * 2, 1);

        // Massive flash at the exact moment of impact (fade out over 0.5s)
        if (timeSinceStrike < 0.5) {
          const flashIntensity = 1 - (timeSinceStrike / 0.5);
          const thisFlashMax = isFinal ? 0.9 : 0.4 + (idx * 0.1);
          if (flashIntensity * thisFlashMax > maxFlashOpacity) {
             maxFlashOpacity = flashIntensity * thisFlashMax;
             flashRgb = tier === 'standard' ? '200, 255, 252' : (tier === 'premium' ? '77, 238, 234' : '249, 241, 208');
             flashGlowColor = tier === 'standard' ? '77, 238, 234' : (tier === 'premium' ? '176, 38, 255' : '176, 38, 255');
             isFinalFlash = isFinal;
          }
        }
      }

      // Strike animation (starts slightly before impact, travels, hits, fades)
      const travelTime = 0.3;
      const fadeTime = isFinal ? 1.2 : 0.6;
      const strikeStart = strikeTime - travelTime;

      if (elapsed >= strikeStart && elapsed < strikeTime + fadeTime) {
        // Alternate between left, right, top for origins
        const originPos = idx % 3;
        const startX = originPos === 0 ? -w*0.1 : (originPos === 1 ? w*1.1 : w*0.5);
        // Explicitly define starting Y based on origin (0=Left, 1=Right, 2=Top)
        const startY = originPos === 2 ? -h*0.1 : cy + (Math.sin(idx * 13) * h * 0.1);

        let progress = 0;
        let opacity = 0;

        if (elapsed < strikeTime) {
          // Traveling inwards with easing
          const t = (elapsed - strikeStart) / travelTime;
          progress = t * t * (3 - 2 * t); // Smoothstep
          opacity = t * 1.5; // Quick fade in
        } else {
          // Hit and fade
          progress = 1;
          opacity = 1 - (timeSinceStrike / fadeTime);
        }

        opacity = Math.max(0, Math.min(1, opacity));
        const currentX = startX + (cx - startX) * progress;
        const currentY = startY + (cy - startY) * progress;

        // Base color based on tier
        const rgb = tier === 'standard' ? '200, 255, 252' : (tier === 'premium' ? '77, 238, 234' : '249, 241, 208'); // Primary/Tertiary
        const glowColor = tier === 'standard' ? '77, 238, 234' : (tier === 'premium' ? '176, 38, 255' : '176, 38, 255'); // Ethereal Blue / Magical Purple

        ctx.save();
        ctx.globalCompositeOperation = 'screen';

        // --- Core Beam ---
        const drawBeam = (thickness, alpha, blur, color) => {
            ctx.beginPath();

            ctx.moveTo(startX, startY);

            // Control point for arc/wobble
            const cp1x = startX + (currentX - startX) * 0.6;
            // Wobble grows as it travels
            const wobble = Math.sin(elapsed * 15 + idx * 5) * h * 0.15 * progress;
            const cp1y = currentY + wobble;

            ctx.bezierCurveTo(cp1x, cp1y, currentX, currentY, currentX, currentY);

            ctx.lineWidth = thickness;
            ctx.lineCap = 'round';
            ctx.strokeStyle = `rgba(${color}, ${alpha})`;
            ctx.shadowColor = `rgba(${color}, 1)`;
            ctx.shadowBlur = blur;
            ctx.stroke();

            return { sy: startY, cp1x, cp1y };
        };

        // Layer 1: Wide faint glow
        drawBeam(isFinal ? 40 : 20, opacity * 0.2, 30, glowColor);
        // Layer 2: Medium glow
        const pts = drawBeam(isFinal ? 15 : 8, opacity * 0.5, 15, glowColor);
        // Layer 3: Hot core
        drawBeam(isFinal ? 5 : 2, opacity, 5, rgb);

        // --- Organic Branches / Lightning forks ---
        if (progress > 0.3 && opacity > 0.1) {
            const numBranches = isFinal ? 3 : 1;
            for(let b=0; b<numBranches; b++) {
                ctx.beginPath();
                ctx.moveTo(pts.cp1x, pts.cp1y);
                const dir = originPos === 0 ? 1 : -1;
                // Fork out and back
                const bx1 = pts.cp1x + (w * 0.1 * dir) + Math.cos(elapsed * 20 + b)*20;
                const by1 = pts.cp1y + (Math.sin(elapsed * 20 + b) * 80) * (b%2===0?1:-1);
                const bx2 = currentX - (currentX - startX) * 0.1;
                const by2 = cy + Math.cos(elapsed * 25)*30;

                ctx.bezierCurveTo(bx1, by1, bx2, by2, currentX, currentY);
                ctx.lineWidth = isFinal ? 2 : 1;
                ctx.strokeStyle = `rgba(${glowColor}, ${opacity * 0.4})`;
                ctx.stroke();
            }
        }

        ctx.restore();

        // --- Impact Particles & Geometry (Local overdraw is fine, full-screen is not) ---
        if (elapsed >= strikeTime && timeSinceStrike < fadeTime) {
            ctx.save();
            ctx.globalCompositeOperation = 'screen';

            // Accumulate flash for the full-screen pass
            const currentFlashOpacity = Math.max(0, 1 - (timeSinceStrike / (isFinal ? 0.3 : 0.15)));
            if (currentFlashOpacity > maxFlashOpacity) {
                maxFlashOpacity = currentFlashOpacity;
                flashRgb = rgb;
                flashGlowColor = glowColor;
                isFinalFlash = isFinal;
            }

            // 2. Shockwave Ring
            const ringProgress = timeSinceStrike / (isFinal ? 0.6 : 0.4);
            if (ringProgress < 1) {
                const ringRadius = (isFinal ? w * 0.5 : w * 0.3) * Math.pow(ringProgress, 0.5);
                const ringOpacity = (1 - ringProgress) * 0.5;
                ctx.beginPath();
                ctx.arc(cx, cy, ringRadius, 0, Math.PI * 2);
                ctx.lineWidth = isFinal ? 4 : 2;
                ctx.strokeStyle = `rgba(${glowColor}, ${ringOpacity})`;
                ctx.stroke();
            }

            // 3. Energy Particles exploding outwards
            if (timeSinceStrike < 0.5) {
                const pCount = isFinal ? 12 : 5;
                const pProgress = timeSinceStrike / 0.5;
                for (let p=0; p<pCount; p++) {
                    const angle = (Math.PI * 2 / pCount) * p + (idx * 0.5);
                    const dist = (isFinal ? 150 : 80) * Math.pow(pProgress, 0.4);
                    const px = cx + Math.cos(angle) * dist;
                    const py = cy + Math.sin(angle) * dist;
                    const pAlpha = 1 - pProgress;

                    ctx.beginPath();
                    ctx.arc(px, py, isFinal ? 3 : 1.5, 0, Math.PI * 2);
                    ctx.fillStyle = `rgba(${rgb}, ${pAlpha})`;
                    ctx.shadowBlur = 5;
                    ctx.shadowColor = `rgba(${glowColor}, 1)`;
                    ctx.fill();

                    // Particle trails
                    ctx.beginPath();
                    ctx.moveTo(cx + Math.cos(angle) * dist * 0.5, cy + Math.sin(angle) * dist * 0.5);
                    ctx.lineTo(px, py);
                    ctx.strokeStyle = `rgba(${glowColor}, ${pAlpha * 0.5})`;
                    ctx.lineWidth = 1;
                    ctx.stroke();
                }
            }

            ctx.restore();
        }
      }
    });

    // --- Combine Full-Screen Effects (Aura & Flashes) into ONE pass ---
    if (totalEnergyAbsorbed > 0 || maxFlashOpacity > 0) {
      ctx.save();
      ctx.globalCompositeOperation = 'screen';

      const maxEnergy = schedule.length;
      const auraIntensity = Math.min(totalEnergyAbsorbed / maxEnergy, 1);

      // Organic pulsing effect
      const pulse1 = Math.sin(elapsed * 2) * 0.05;
      const pulse2 = Math.cos(elapsed * 3.1) * 0.05;
      const pulse = 1 + pulse1 + pulse2;

      // Bounded base aura size to prevent severe canvas overdraw
      const baseAuraRadius = tier === 'flagship' ? Math.min(350, w * 0.8) : (tier === 'premium' ? 280 : 220);
      const auraRadius = baseAuraRadius * pulse * auraIntensity;
      const baseColor = tier === 'standard' ? '77, 238, 234' : (tier === 'premium' ? '176, 38, 255' : '249, 241, 208');

      // More dimensional aura
      const auraGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, auraRadius);
      // We combine the flash into the aura gradient if there is an active flash
      if (maxFlashOpacity > 0) {
          auraGrad.addColorStop(0, `rgba(${flashRgb}, ${maxFlashOpacity * 0.9 + auraIntensity * 0.3})`);
          auraGrad.addColorStop(0.3, `rgba(${flashGlowColor}, ${maxFlashOpacity * 0.5 + auraIntensity * 0.15})`);
          auraGrad.addColorStop(0.7, `rgba(${baseColor}, ${auraIntensity * 0.05})`);
          auraGrad.addColorStop(1, `rgba(${baseColor}, 0)`);
      } else {
          auraGrad.addColorStop(0, `rgba(${baseColor}, ${auraIntensity * 0.3})`);
          auraGrad.addColorStop(0.3, `rgba(${baseColor}, ${auraIntensity * 0.15})`);
          auraGrad.addColorStop(0.7, `rgba(${baseColor}, ${auraIntensity * 0.05})`);
          auraGrad.addColorStop(1, `rgba(${baseColor}, 0)`);
      }

      ctx.fillStyle = auraGrad;
      ctx.fillRect(0, 0, w, h);
      ctx.restore();
    }

    const finalStrike = schedule[schedule.length - 1];
    const flipAt = finalStrike + 0.65;

    // Trigger state change based on Master Clock instead of independent setTimeout
    if (elapsed >= flipAt && !isRevealedRef.current) {
        isRevealedRef.current = true;
        setIsRevealed(true);
        window.setTimeout(() => {
          setIsGenerating(false);
          try {
            const currentCard = activeCardRef.current;
            if (currentCard) {
                window.localStorage.setItem(STORAGE_KEY, JSON.stringify({
                  cardId: currentCard.id,
                  revealDate: localDateKey(),
                }));
                const unlockedStr = window.localStorage.getItem('unlockedCards');
                let unlocked = unlockedStr ? JSON.parse(unlockedStr) : [];
                if (!unlocked.includes(currentCard.id)) {
                  unlocked.push(currentCard.id);
                  window.localStorage.setItem('unlockedCards', JSON.stringify(unlocked));
                  window.dispatchEvent(new Event('unlockedCardsUpdated'));
                }
            }
          } catch (e) {}
        }, 700);
    }

    if (elapsed < 12.0) {
      rafRef.current = requestAnimationFrame(renderCanvas);
    } else {
      // Safety release
      setIsGenerating(false);
    }
  };

  const triggerCardDraw = () => {
    stopAll();

    const card = selectWeightedLuckyCard(previousCardId);
    activeTierRef.current = card.tier;
    activeCardRef.current = card;
    isRevealedRef.current = false;

    setSelectedCard(card);
    setIsRevealed(false);
    setIsGenerating(true);
    setImageError(false);

    if (bgCanvasRef.current) {
      bgCanvasRef.current.width = window.innerWidth;
      bgCanvasRef.current.height = window.innerHeight;
    }

    const schedule = STRIKE_SCHEDULES[card.tier];
    const ctx = playAudioSequence(card.tier, schedule);

    if (ctx) {
        // audioStartTimeRef is set in playAudioSequence
        rafStartTimeRef.current = 0;
    } else {
        rafStartTimeRef.current = 0;
    }

    if (!shouldReduceMotion) {
      rafRef.current = requestAnimationFrame(renderCanvas);
    }

    // --- FRAMER MOTION CHOREOGRAPHY ---
    const sequence = [];

    // Initial state
    sequence.push([cardRef.current, { y: 0, scale: 1, rotateZ: 0 }, { duration: 0.1 }]);
    sequence.push([cardRef.current, { y: -10 }, { at: "<", duration: 1.5, ease: 'easeOut' }]);

    // Synchronize physical reactions with strikes
    schedule.forEach((strikeTime, idx) => {
      const isFinal = idx === schedule.length - 1;

      // Reaction intensity scales with index and tier, with hard caps for mobile
      let basePower = 5 + (idx * 3);
      let baseRot = 2 + idx;

      if (card.tier === 'premium') { basePower *= 1.5; baseRot *= 1.5; }
      if (card.tier === 'flagship') { basePower *= 2.0; baseRot *= 2.0; }

      // Apply caps
      const power = isFinal ? Math.min(25, basePower * 1.5) : Math.min(20, basePower);
      const rotPower = isFinal ? Math.min(8, baseRot * 1.5) : Math.min(5, baseRot);
      const dir = idx % 2 === 0 ? 1 : -1;

      // The shake hits EXACTLY at the strike time
      const shakeDur = isFinal ? 0.5 : 0.25; // SLIGHTLY LONGER SHAKE
      const scaleUp = isFinal ? 1.3 : 1.1; // MORE VISIBLE IMPACT
      const finalScale = isFinal ? 1.1 : 1.0;

      sequence.push([
        cardRef.current,
        {
          x: [0, power * dir, -power * 0.8 * dir, power * 0.4 * dir, 0],
          rotateZ: [0, rotPower * dir, -rotPower * 0.5 * dir, 0],
          scale: [1, scaleUp, finalScale]
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

    animationControlsRef.current = animate(sequence, { autoplay: false });
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
