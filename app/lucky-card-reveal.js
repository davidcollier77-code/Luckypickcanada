'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import Image from 'next/image';
import { motion, useAnimate, useReducedMotion } from 'framer-motion';
import { Howl } from 'howler';
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
  const [audioLoading, setAudioLoading] = useState(true);

  const [scope, animate] = useAnimate();
  const activeTimeoutsRef = useRef([]);
  const animationControlsRef = useRef(null);
  const cardRef = useRef(null);

  // Canvas refs for visual effects
  const bgCanvasRef = useRef(null);
  const fgCanvasRef = useRef(null);
  const rafRef = useRef(null);
  const rafStartTimeRef = useRef(0);
  const activeTierRef = useRef('standard');
  const isRevealedRef = useRef(false);
  const activeCardRef = useRef(null);

    // Load Audio Assets with Howler
  const soundsRef = useRef({});

  useEffect(() => {
    let mounted = true;

    // Using existing project mixkit sounds
    const files = {
      lightning: '/sounds/mixkit-magic-sparkles.mp3', // impact pulse
      buildup: '/sounds/mixkit-cinematic-whoosh.mp3',
      whoosh: '/sounds/mixkit-cinematic-impact.mp3',
      firework: '/sounds/mixkit-magical-impact.mp3',
      aurora: '/sounds/mixkit-firework-crackle.mp3', // aurora beam sound
      shimmer: '/sounds/mixkit-magic-sparkles.mp3' // replace oscillator with a shimmering sound
    };

    let loadedCount = 0;
    const totalFiles = Object.keys(files).length;

    const onLoad = () => {
      loadedCount++;
      if (loadedCount >= totalFiles && mounted) {
        setAudioLoading(false);
      }
    };

    const onLoadError = () => {
      console.error("Failed to preload audio");
      if (mounted) setAudioLoading(false); // Fail gracefully
    };

    for (const [key, url] of Object.entries(files)) {
      soundsRef.current[key] = new Howl({
        src: [url],
        preload: true,
        onload: onLoad,
        onloaderror: onLoadError
      });
    }

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
    if (soundsRef.current) {
      Object.values(soundsRef.current).forEach(sound => {
        if (sound && sound.stop) {
           sound.stop();
        }
      });
    }
  }, []);

  useEffect(() => {
    return stopAll;
  }, [stopAll]);

  // Audio Playback Helpers

  // We remove playBuffer and use a simplified schedule system for Howler
  // We'll use a visual-driven or timeout-driven scheduling.
  // Actually, keeping the audio scheduled ahead of time is possible via setTimeout,
  // but it's more accurate to link it to the RAF loop or calculate precise timeouts.

  const playAudioSequence = (tier, schedule) => {
    // 1. Initial Atmospheric Buildup
    if (soundsRef.current.buildup) {
      const id = soundsRef.current.buildup.play();
      soundsRef.current.buildup.loop(true, id);
      soundsRef.current.buildup.volume(0.4, id);
      soundsRef.current.buildup.rate(0.6, id);

      const finalStrikeTime = schedule[schedule.length - 1];
      activeTimeoutsRef.current.push(setTimeout(() => {
        soundsRef.current.buildup.fade(0.4, 0, 1000, id);
        setTimeout(() => soundsRef.current.buildup.stop(id), 1000);
      }, (finalStrikeTime + 1.0) * 1000));
    }

    // Schedule strikes
    schedule.forEach((timeOffset, idx) => {
      const isFinal = idx === schedule.length - 1;
      const strikeTime = timeOffset;
      const intensity = isFinal ? (tier === 'flagship' ? 1.4 : 1.2) : 0.5 + (idx / schedule.length) * 0.4;

      // Energy sweep before impact
      if (idx > 0) {
        activeTimeoutsRef.current.push(setTimeout(() => {
          if (soundsRef.current.whoosh) {
            const id = soundsRef.current.whoosh.play();
            soundsRef.current.whoosh.volume(intensity * (tier === 'flagship' ? 0.7 : 0.5), id); // Stronger pre-impact energy
            soundsRef.current.whoosh.rate(1.5 + (idx * 0.1), id);
          }
        }, Math.max(0, (strikeTime - 0.5) * 1000)));
      }

      // Aurora beam sound starting slightly before impact
      activeTimeoutsRef.current.push(setTimeout(() => {
        if (soundsRef.current.aurora) {
          const id = soundsRef.current.aurora.play();
          soundsRef.current.aurora.volume(intensity * (tier === 'standard' ? 0.6 : 0.8), id); // Increased aurora beam volume
          soundsRef.current.aurora.rate(1.2 + (idx * 0.1), id);
        }
      }, Math.max(0, (strikeTime - 0.3) * 1000))); // travelTime is 0.3

      // Impact (Lightning + Firework layering)
      const impactOffset = -0.02;
      activeTimeoutsRef.current.push(setTimeout(() => {
        if (soundsRef.current.lightning) {
          const id = soundsRef.current.lightning.play();
          soundsRef.current.lightning.volume(intensity * 0.6, id);
          soundsRef.current.lightning.rate(isFinal ? 0.8 : 1.0 + (idx * 0.1), id);
        }
        if (soundsRef.current.firework) {
          const id = soundsRef.current.firework.play();
          soundsRef.current.firework.volume(intensity * 0.4, id);
          soundsRef.current.firework.rate(1.2 + (idx * 0.1), id);
        }
      }, Math.max(0, (strikeTime + impactOffset) * 1000)));

      // Ethereal Resonance Tail (on premium/flagship)
      if (tier !== 'standard') {
          activeTimeoutsRef.current.push(setTimeout(() => {
            if (soundsRef.current.shimmer) {
              const id = soundsRef.current.shimmer.play();
              soundsRef.current.shimmer.volume(intensity * (tier === 'flagship' ? 0.3 : 0.15), id);
              soundsRef.current.shimmer.rate(1.5 - (idx * 0.1), id);
            }
          }, Math.max(0, (strikeTime + 0.1) * 1000)));
      }

      // Final Impact Details
      if (isFinal) {
        activeTimeoutsRef.current.push(setTimeout(() => {
          if (soundsRef.current.whoosh) {
            const id = soundsRef.current.whoosh.play();
            soundsRef.current.whoosh.volume(0.9, id);
            soundsRef.current.whoosh.rate(0.8, id);
          }
        }, Math.max(0, (strikeTime - 0.7) * 1000)));

        activeTimeoutsRef.current.push(setTimeout(() => {
          if (soundsRef.current.whoosh) {
            const id = soundsRef.current.whoosh.play();
            soundsRef.current.whoosh.volume(0.9, id);
            soundsRef.current.whoosh.rate(1.2, id);
          }
        }, Math.max(0, (strikeTime - 0.3) * 1000)));
      }
    });

    const finalStrikeTime = schedule[schedule.length - 1];
    const flipAt = finalStrikeTime + 0.65;
    const revealTime = flipAt + 0.35; // Face visible

    // Play a reversed whoosh for the flip
    activeTimeoutsRef.current.push(setTimeout(() => {
      if (soundsRef.current.whoosh) {
        const id = soundsRef.current.whoosh.play();
        soundsRef.current.whoosh.volume(0.5, id);
        soundsRef.current.whoosh.rate(1.8, id);
      }
    }, flipAt * 1000));

    // Cinematic Reveal Chime/Shimmer
    activeTimeoutsRef.current.push(setTimeout(() => {
      if (soundsRef.current.shimmer) {
        const id = soundsRef.current.shimmer.play();
        soundsRef.current.shimmer.volume(0.4, id);
        soundsRef.current.shimmer.rate(0.8, id);
      }
    }, revealTime * 1000));
  };


  const renderCanvas = (timestamp) => {
    if (!bgCanvasRef.current || shouldReduceMotion) return;

    if (!rafStartTimeRef.current) rafStartTimeRef.current = timestamp;

    // Master Clock: requestAnimationFrame timestamp
    let elapsed = (timestamp - rafStartTimeRef.current) / 1000;

    // Drive Framer Motion sequence manually so it is locked to the Master Clock
    if (animationControlsRef.current && 'time' in animationControlsRef.current) {
        const sequenceDuration = STRIKE_SCHEDULES[activeTierRef.current][STRIKE_SCHEDULES[activeTierRef.current].length - 1] + 1.5;
        animationControlsRef.current.time = Math.max(0, Math.min(elapsed, sequenceDuration));
    }

    const ctx = bgCanvasRef.current.getContext('2d');

    const w = bgCanvasRef.current.width;
    const h = bgCanvasRef.current.height;

    // Find precise card DOM center
    let cardCX = w / 2;
    let cardCY = h / 2;
    let cardW = 280;
    let cardH = 405;
    if (cardRef.current) {
        const rect = cardRef.current.getBoundingClientRect();
        if (rect) {
            cardCX = rect.left + rect.width / 2;
            cardCY = rect.top + rect.height / 2;
            cardW = rect.width;
            cardH = rect.height;
        }
    }
    const cx = cardCX;
    const cy = cardCY;
    const tier = activeTierRef.current;


    ctx.clearRect(0, 0, w, h);

    const fgCtx = fgCanvasRef.current ? fgCanvasRef.current.getContext('2d') : null;
    if (fgCtx) {
      fgCtx.clearRect(0, 0, w, h);
    }

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
      const fadeTime = isFinal ? 0.6 : 0.3;
      const strikeStart = strikeTime - travelTime;

      if (elapsed >= strikeStart && elapsed < strikeTime + fadeTime) {
        // Alternate between left, right, top for origins
        const originPos = idx % 3;
        const startX = w * (0.2 + (idx % 4) * 0.2); // Aurora source across the sky
        // Explicitly define starting Y based on origin (0=Left, 1=Right, 2=Top)
        const startY = -h * 0.1; // Coming from the aurora above

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
        // Target deterministic points around the card
        const angleMap = [Math.PI * -0.25, Math.PI * -0.75, Math.PI * 0.25, Math.PI * 0.75, Math.PI * -0.5, Math.PI * 0.5, 0];
        const targetAngle = isFinal ? 0 : angleMap[idx % angleMap.length];
        const targetRadius = isFinal ? 0 : Math.min(cardW, cardH) * 0.45;

        const impactX = cx + Math.cos(targetAngle) * targetRadius;
        const impactY = cy + Math.sin(targetAngle) * targetRadius;

        const currentX = startX + (impactX - startX) * progress;
        const currentY = startY + (impactY - startY) * progress;

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

            // 2. Shockwave Ring (Background)
            const ringProgress = timeSinceStrike / (isFinal ? 0.6 : 0.4);
            if (ringProgress < 1) {
                const ringRadius = (isFinal ? Math.max(cardW, cardH) * 1.5 : Math.max(cardW, cardH) * 0.8) * Math.pow(ringProgress, 0.5);
                const ringOpacity = (1 - ringProgress) * 0.5;
                ctx.beginPath();
                ctx.arc(impactX, impactY, ringRadius, 0, Math.PI * 2);
                ctx.lineWidth = isFinal ? 8 : 4;
                ctx.strokeStyle = `rgba(${glowColor}, ${ringOpacity})`;
                ctx.stroke();
            }
            ctx.restore();

            // FOREGROUND EFFECTS (Drawn on fgCtx to appear over the card)
            if (fgCtx) {
                fgCtx.save();
                fgCtx.globalCompositeOperation = 'screen';

                // Localized Impact Flare on Card
                if (timeSinceStrike < 0.4) {
                    const flareProg = timeSinceStrike / 0.4;
                    const flareRadius = (isFinal ? cardW * 0.8 : cardW * 0.3) * (1 + flareProg);
                    const flareGrad = fgCtx.createRadialGradient(impactX, impactY, 0, impactX, impactY, flareRadius);
                    flareGrad.addColorStop(0, `rgba(${rgb}, ${(1-flareProg) * 0.8})`);
                    flareGrad.addColorStop(0.3, `rgba(${glowColor}, ${(1-flareProg) * 0.4})`);
                    flareGrad.addColorStop(1, `rgba(${glowColor}, 0)`);

                    fgCtx.fillStyle = flareGrad;
                    fgCtx.beginPath();
                    fgCtx.arc(impactX, impactY, flareRadius, 0, Math.PI * 2);
                    fgCtx.fill();
                }

                // Foreground Energy Particles
                if (timeSinceStrike < 0.5) {
                    const baseParticles = tier === 'flagship' ? 40 : (tier === 'premium' ? 24 : 16);
                    const pCount = isFinal ? baseParticles * 2 : baseParticles;
                    const pProgress = timeSinceStrike / 0.5;
                    for (let p=0; p<pCount; p++) {
                        const angle = (Math.PI * 2 / pCount) * p + (idx * 0.5);
                        const dist = (isFinal ? 300 : 150) * Math.pow(pProgress, 0.3);
                        const px = impactX + Math.cos(angle) * dist;
                        const py = impactY + Math.sin(angle) * dist;
                        const pAlpha = 1 - pProgress;

                        fgCtx.beginPath();
                        fgCtx.arc(px, py, isFinal ? 4 : 2, 0, Math.PI * 2);
                        fgCtx.fillStyle = `rgba(${rgb}, ${pAlpha})`;
                        fgCtx.shadowBlur = 5;
                        fgCtx.shadowColor = `rgba(${glowColor}, 1)`;
                        fgCtx.fill();

                        // Particle trails
                        fgCtx.beginPath();
                        fgCtx.moveTo(impactX + Math.cos(angle) * dist * 0.3, impactY + Math.sin(angle) * dist * 0.3);
                        fgCtx.lineTo(px, py);
                        fgCtx.strokeStyle = `rgba(${glowColor}, ${pAlpha * 0.7})`;
                        fgCtx.lineWidth = isFinal ? 2 : 1;
                        fgCtx.stroke();
                    }
                }

                // Edge Tracing / Energy accumulation running along card perimeter
                if (timeSinceStrike < 0.6) {
                    const edgeProg = timeSinceStrike / 0.6;
                    const edgeAlpha = (1 - edgeProg);
                    fgCtx.lineWidth = isFinal ? 4 : 2;
                    fgCtx.strokeStyle = `rgba(${glowColor}, ${edgeAlpha})`;
                    fgCtx.shadowBlur = 10;
                    fgCtx.shadowColor = `rgba(${glowColor}, 1)`;

                    const cw2 = cardW/2;
                    const ch2 = cardH/2;

                    fgCtx.strokeRect(cx - cw2, cy - ch2, cardW, cardH);
                }

                fgCtx.restore();
            }
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
      ctx.fillRect(cx - auraRadius, cy - auraRadius, auraRadius * 2, auraRadius * 2);
      ctx.restore();

      // Post-flip Residual Ethereal Particles (Draws on foreground)
      if (elapsed > flipAt && fgCtx) {
          const postFlipElapsed = elapsed - flipAt;
          // Slowly fades out over the remaining 2.35s
          const residualAlpha = Math.max(0, 1 - (postFlipElapsed / 2.35));
          if (residualAlpha > 0) {
              fgCtx.save();
              fgCtx.globalCompositeOperation = 'screen';
              const pCount = tier === 'flagship' ? 24 : (tier === 'premium' ? 16 : 8);
              for (let i = 0; i < pCount; i++) {
                  const angle = (Math.PI * 2 / pCount) * i + (elapsed * 0.2);
                  // Gentle floating radius
                  const r = Math.max(cardW, cardH) * 0.5 + Math.sin(elapsed * 2 + i) * 20;
                  const px = cx + Math.cos(angle) * r;
                  const py = cy + Math.sin(angle) * r - (postFlipElapsed * 30); // Float upwards

                  fgCtx.beginPath();
                  fgCtx.arc(px, py, 2, 0, Math.PI * 2);
                  fgCtx.fillStyle = `rgba(${baseColor}, ${residualAlpha * 0.6})`;
                  fgCtx.shadowBlur = 8;
                  fgCtx.shadowColor = `rgba(${baseColor}, 1)`;
                  fgCtx.fill();
              }
              fgCtx.restore();
          }
      }
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

    const maxLifetime = flipAt + 3.0;
    if (elapsed < maxLifetime) {
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
    if (fgCanvasRef.current) {
      fgCanvasRef.current.width = window.innerWidth;
      fgCanvasRef.current.height = window.innerHeight;
    }

    const schedule = STRIKE_SCHEDULES[card.tier];
    playAudioSequence(card.tier, schedule);
    rafStartTimeRef.current = 0;


    if (!shouldReduceMotion) {
      rafRef.current = requestAnimationFrame(renderCanvas);
    }

    // --- FRAMER MOTION CHOREOGRAPHY ---
    const sequence = [];

    // Defensive initialization to prevent Flash of Fully-Formed Card
    // Ensure the browser synchronously hides the element before the next paint
    if (cardRef.current) {
      cardRef.current.style.opacity = '0';
      cardRef.current.style.filter = 'brightness(0)';
    }

    // Initial state (duration: 0.001 to prevent tweening from visible state)
    sequence.push([cardRef.current, { y: 0, scale: 1, rotateZ: 0, opacity: [0, 0], filter: ["brightness(0)", "brightness(0)"] }, { duration: 0.001 }]);
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

      // Determine direction of strike based on angle Map used in renderCanvas
      const angleMap = [Math.PI * -0.25, Math.PI * -0.75, Math.PI * 0.25, Math.PI * 0.75, Math.PI * -0.5, Math.PI * 0.5, 0];
      const targetAngle = isFinal ? 0 : angleMap[idx % angleMap.length];

      const dirX = isFinal ? 0 : Math.cos(targetAngle);
      const dirY = isFinal ? 1 : Math.sin(targetAngle); // Hit pushes it down/back slightly
      const rotDir = isFinal ? 0 : (dirX > 0 ? 1 : -1);

      // The shake hits EXACTLY at the strike time
      const shakeDur = isFinal ? 0.6 : 0.4; // More dramatic cinematic shake
      const scaleUp = isFinal ? 1.4 : 1.15; // Physically punch the card forward
      const finalScale = isFinal ? 1.1 : 1.0;

      const recoilX = power * dirX;
      const recoilY = (power * 0.5) * dirY;
      const recoilRot = rotPower * rotDir;

      sequence.push([
        cardRef.current,
        {
          x: [0, recoilX, -recoilX * 0.5, recoilX * 0.2, 0],
          y: [0, recoilY, -recoilY * 0.3, 0],
          rotateZ: [0, recoilRot, -recoilRot * 0.4, 0],
          scale: [1, scaleUp, finalScale],
          opacity: isFinal ? 1 : (idx + 1) / schedule.length,
          filter: isFinal ? ["brightness(2)", "brightness(1)"] : ["brightness(1.5)", "brightness(" + ((idx + 1) / schedule.length) + ")"]
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

    sequence.push([cardRef.current, { scale: 1, x: 0, y: 0, rotateZ: 0, opacity: 1, filter: "brightness(1)" }, { at: flipAt.toString(), duration: 0.8, ease: 'circOut' }]);

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
      {isGenerating && (
        <canvas
          ref={fgCanvasRef}
          className="fixed inset-0 w-full h-full pointer-events-none z-[30]"
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
