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
  standard: [1.5, 2.8, 4.3],
  premium: [1.2, 2.3, 3.4, 4.5, 6.2],
  flagship: [1.0, 1.8, 2.6, 3.4, 4.2, 5.0, 7.0]
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
  const cardRef = useRef(null);
  const cardFrontRef = useRef(null);
  const cardFlipRef = useRef(null);

  // Canvas refs for visual effects
  const bgCanvasRef = useRef(null);
  const fgCanvasRef = useRef(null);
  const rafRef = useRef(null);
  const rafStartTimeRef = useRef(0);
  const activeTierRef = useRef('standard');
  const isRevealedRef = useRef(false);
  const activeCardRef = useRef(null);
  const lastMaskValRef = useRef('');
  const cardMetricsRef = useRef({ cx: 140, cy: 202.5, w: 280, h: 405 });
  const strikeTargetsRef = useRef({});
  const fallbackTimerRef = useRef(null);

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
    if (fallbackTimerRef.current) clearTimeout(fallbackTimerRef.current);
    activeTimeoutsRef.current.forEach(clearTimeout);
    activeTimeoutsRef.current = [];
  }, []);

  useEffect(() => {
    return stopAll;
  }, [stopAll]);

  const executeRevealState = useCallback(() => {
    if (isRevealedRef.current) return;
    isRevealedRef.current = true;
    setIsRevealed(true);

    if (fallbackTimerRef.current) {
        clearTimeout(fallbackTimerRef.current);
        fallbackTimerRef.current = null;
    }

    // Persist the card immediately to localStorage
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

    // We wait 3000ms after the reveal state triggers before we unmount the canvas
    // This safely covers the 3.0s `maxLifetime` post-flip padding from `renderCanvas`
    // while ensuring the UI interaction loop completes cleanly.
    window.setTimeout(() => {
      setIsGenerating(false);
    }, 3000);

    if (cardFrontRef.current) {
        cardFrontRef.current.style.maskImage = 'none';
        cardFrontRef.current.style.WebkitMaskImage = 'none';
        lastMaskValRef.current = 'none';
    }
  }, []);

  const renderCanvas = (timestamp) => {
    if (!bgCanvasRef.current || shouldReduceMotion) return;

    if (!rafStartTimeRef.current) rafStartTimeRef.current = timestamp;

    // Master Clock: requestAnimationFrame timestamp
    let elapsed = (timestamp - rafStartTimeRef.current) / 1000;

    // Framer Motion sequence is now driven automatically to prevent static card issues

    const ctx = bgCanvasRef.current.getContext('2d');

    const w = bgCanvasRef.current.width;
    const h = bgCanvasRef.current.height;

    // Use cached card metrics to avoid DOM reads in hot path
    const { cx, cy, w: cardW, h: cardH } = cardMetricsRef.current;
    const tier = activeTierRef.current;

    ctx.clearRect(0, 0, w, h);

    const fgCtx = fgCanvasRef.current ? fgCanvasRef.current.getContext('2d') : null;
    if (fgCtx) {
      fgCtx.clearRect(0, 0, w, h);
    }



    const schedule = STRIKE_SCHEDULES[tier];
    const finalStrike = schedule[schedule.length - 1];
    const flipAt = finalStrike + 0.8;
    const maxLifetime = flipAt + 3.0;

    let maskLayers = [];
    let maxFlashOpacity = 0;
    let flashRgb = '255, 255, 255';
    let isFinalFlash = false;

    const tierColors = {
      standard: ['14, 165, 233', '217, 70, 239', '180, 83, 9'], // Blue -> Magenta -> Bronze
      premium: ['14, 165, 233', '217, 70, 239', '14, 165, 233', '217, 70, 239', '156, 163, 175'], // Alternating -> Platinum
      flagship: ['14, 165, 233', '217, 70, 239', '14, 165, 233', '217, 70, 239', '14, 165, 233', '217, 70, 239', '234, 179, 8'] // Alternating -> Gold
    };

    // Draw Aurora / Energy Source at top
    if (elapsed > 0) {
      const auroraProg = Math.min(1, elapsed / 1.5);
      ctx.save();
      ctx.globalCompositeOperation = 'screen';

      const sourceY = h * 0.1;
      const sourceW = w * 0.8;

      // Mystical Cosmic Anomaly
      const baseColor = tierColors[tier][0];
      const timeScale = elapsed * 0.5;

      // Layer 1: Atmospheric Glow
      const atmosphericGrad = ctx.createRadialGradient(w/2, sourceY, 0, w/2, sourceY, sourceW * 0.9);
      atmosphericGrad.addColorStop(0, `rgba(${baseColor}, ${auroraProg * 0.5})`);
      atmosphericGrad.addColorStop(0.4, `rgba(${baseColor}, ${auroraProg * 0.15})`);
      atmosphericGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = atmosphericGrad;
      ctx.fillRect(0, 0, w, sourceY + sourceW);

      ctx.save();
      ctx.translate(w/2, sourceY);

      // Layer 2: Rotating Vortex
      ctx.rotate(timeScale * Math.PI * 0.5);
      const vortexGrad = ctx.createRadialGradient(0, 0, 10, 0, 0, 120);
      vortexGrad.addColorStop(0, `rgba(255, 255, 255, ${auroraProg * 0.9})`);
      vortexGrad.addColorStop(0.3, `rgba(${baseColor}, ${auroraProg * 0.6})`);
      vortexGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.fillStyle = vortexGrad;
      ctx.beginPath();
      ctx.ellipse(0, 0, 140 + Math.sin(timeScale * 4) * 20, 80 + Math.cos(timeScale * 3) * 15, 0, 0, Math.PI * 2);
      ctx.fill();

      // Layer 3: Counter-rotating plasma filaments
      ctx.rotate(-timeScale * Math.PI * 1.2);
      ctx.beginPath();
      for (let i = 0; i < 5; i++) {
         ctx.ellipse(0, 0, 100, 20, (i * Math.PI) / 2.5, 0, Math.PI * 2);
      }
      ctx.fillStyle = `rgba(255, 255, 255, ${auroraProg * 0.3})`;
      ctx.fill();

      // Layer 4: Dimensional Luminous Core
      ctx.beginPath();
      ctx.arc(0, 0, 25 + Math.sin(timeScale * 8) * 5, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 255, 255, ${auroraProg})`;
      ctx.shadowColor = `rgba(${baseColor}, 1)`;
      ctx.shadowBlur = 40;
      ctx.fill();

      ctx.restore();
    }

    schedule.forEach((strikeTime, idx) => {
      const timeSinceStrike = elapsed - strikeTime;
      const isFinal = idx === schedule.length - 1;
      const colorArr = tierColors[tier] || tierColors.standard;
      const beamColor = colorArr[idx % colorArr.length];

      // Build up anticipation energy before final strike
      if (isFinal && elapsed > schedule[schedule.length - 2] && elapsed < strikeTime) {
         const anticipationProgress = (elapsed - schedule[schedule.length - 2]) / (strikeTime - schedule[schedule.length - 2]);
         ctx.save();
         ctx.globalCompositeOperation = 'screen';
         ctx.beginPath();
         const drawRadius = (cardW * 2) * (1 - anticipationProgress * 0.5);
         ctx.arc(cx, cy, drawRadius, 0, Math.PI * 2);
         const antiGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, drawRadius);
         antiGrad.addColorStop(0, `rgba(${beamColor}, ${anticipationProgress * 0.4})`);
         antiGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
         ctx.fillStyle = antiGrad;
         ctx.fill();
         ctx.restore();
      }

      // Flash calculation
      if (timeSinceStrike > 0 && timeSinceStrike < 0.5) {
        const flashIntensity = 1 - (timeSinceStrike / 0.5);
        // Final strike flash is massive and luminous
        const thisFlashMax = isFinal ? 1.0 : 0.4 + (idx * 0.1);
        if (flashIntensity * thisFlashMax > maxFlashOpacity) {
           maxFlashOpacity = flashIntensity * thisFlashMax;
           flashRgb = beamColor;
           isFinalFlash = isFinal;
        }
      }

      // Materialization Mask (Reveal card front progressively)
      if (timeSinceStrike >= 0) {
        const angleMap = [Math.PI * -0.25, Math.PI * -0.75, Math.PI * 0.25, Math.PI * 0.75, Math.PI * -0.5, Math.PI * 0.5, 0];
        const targetAngle = isFinal ? 0 : angleMap[idx % angleMap.length];
        const targetRadius = isFinal ? 0 : Math.min(cardW, cardH) * 0.25;

        const relX = 50 + (Math.cos(targetAngle) * targetRadius / cardW) * 100;
        const relY = 50 + (Math.sin(targetAngle) * targetRadius / cardH) * 100;

        const matProgress = Math.min(1, timeSinceStrike / (isFinal ? 1.0 : 1.5));
        const easedProg = 1 - Math.pow(1 - matProgress, 3);
        const maskSize = isFinal ? 150 * easedProg : 40 + (30 * easedProg);

        maskLayers.push(`radial-gradient(circle ${maskSize}% at ${relX}% ${relY}%, rgba(0,0,0,1) ${isFinal ? 50 : 20}%, rgba(0,0,0,0) 100%)`);
      }

      // Strike / Plasma / Lightning
      const travelTime = 0.3;
      const fadeTime = isFinal ? 0.6 : 0.3;
      const strikeStart = strikeTime - travelTime;

      if (elapsed >= strikeStart && elapsed < strikeTime + fadeTime) {
        // Originates from the top center energy source
        const startX = w / 2;
        const startY = h * 0.1;

        let progress = 0;
        let opacity = 0;

        if (elapsed < strikeTime) {
          const t = (elapsed - strikeStart) / travelTime;
          progress = t * t * (3 - 2 * t);
          opacity = t * 1.5;
        } else {
          progress = 1;
          opacity = 1 - (timeSinceStrike / fadeTime);
        }

        opacity = Math.max(0, Math.min(1, opacity));
        const angleMap = [Math.PI * -0.25, Math.PI * -0.75, Math.PI * 0.25, Math.PI * 0.75, Math.PI * -0.5, Math.PI * 0.5, 0];
        const targetAngle = isFinal ? 0 : angleMap[idx % angleMap.length];
        const targetRadius = isFinal ? 0 : Math.min(cardW, cardH) * 0.25;

        // Ensure we hit the card
        let strikeTarget = { x: cx, y: cy };
        if (cardRef.current) {
            const rect = cardRef.current.getBoundingClientRect();
            if (rect && rect.width > 0 && rect.height > 0) {
                strikeTarget = {
                    x: rect.left + rect.width / 2,
                    y: rect.top + rect.height / 2
                };
            }
        }

        const impactX = strikeTarget.x + Math.cos(targetAngle) * targetRadius;
        const impactY = strikeTarget.y + Math.sin(targetAngle) * targetRadius;

        const currentX = startX + (impactX - startX) * progress;
        const currentY = startY + (impactY - startY) * progress;

        ctx.save();
        ctx.globalCompositeOperation = 'screen';

        // Outer glow
        ctx.lineWidth = isFinal ? 80 : 20 + (idx * 4); // Larger impact convergence
        ctx.strokeStyle = `rgba(${beamColor}, ${(isFinal ? 0.6 : 0.3) * opacity})`;
        ctx.lineCap = 'round';

        // Jagged Lightning / Plasma Path
        const segments = isFinal ? 12 : 8;

        ctx.beginPath();
        ctx.moveTo(startX, startY);

        // Keep consistent random offsets per strike using the index as a seed
        for (let i = 1; i <= segments; i++) {
            const segProg = i / segments;
            const targetSegX = startX + (currentX - startX) * segProg;
            const targetSegY = startY + (currentY - startY) * segProg;

            // Add jaggedness, tapering off at the ends
            const variance = (isFinal ? 60 : 30) * Math.sin(segProg * Math.PI) * (1 - progress * 0.5);
            const offsetX = Math.sin(elapsed * 10 + i * idx) * variance;

            if (i === segments) {
               ctx.lineTo(currentX, currentY);
            } else {
               ctx.lineTo(targetSegX + offsetX, targetSegY);
            }
        }
        ctx.stroke();

        // Inner Bloom
        if (isFinal) {
           ctx.lineWidth = 40;
           ctx.strokeStyle = `rgba(${beamColor}, ${0.8 * opacity})`;
           ctx.stroke();
        }

        // Inner Core
        ctx.lineWidth = isFinal ? 25 : 6 + (idx * 1.5);
        ctx.strokeStyle = `rgba(255, 255, 255, ${0.9 * opacity})`;
        ctx.stroke();

        // Energy Ball at the leading edge
        ctx.beginPath();
        ctx.arc(currentX, currentY, ctx.lineWidth * 2, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
        ctx.fill();

        ctx.restore();
      }

      // Foreground Contact Flash and Particles
      if (timeSinceStrike > 0 && timeSinceStrike < 0.3 && fgCtx) {
          const flashOp = 1 - (timeSinceStrike / 0.3);
          let strikeTarget = { x: cx, y: cy };
          if (cardRef.current) {
              const rect = cardRef.current.getBoundingClientRect();
              if (rect && rect.width > 0 && rect.height > 0) {
                  strikeTarget = {
                      x: rect.left + rect.width / 2,
                      y: rect.top + rect.height / 2
                  };
              }
          }

          fgCtx.save();
          fgCtx.globalCompositeOperation = 'screen';

          // Flash Burst
          fgCtx.beginPath();
          const radius = isFinal ? cardW * 2.5 : cardW * 0.8; // Increased final impact radius
          fgCtx.arc(strikeTarget.x, strikeTarget.y, radius, 0, Math.PI * 2);
          const flashGrad = fgCtx.createRadialGradient(strikeTarget.x, strikeTarget.y, 0, strikeTarget.x, strikeTarget.y, radius);
          flashGrad.addColorStop(0, `rgba(255, 255, 255, ${flashOp})`);
          flashGrad.addColorStop(0.3, `rgba(${beamColor}, ${flashOp * 0.7})`);
          flashGrad.addColorStop(1, 'rgba(0,0,0,0)');
          fgCtx.fillStyle = flashGrad;
          fgCtx.fill();

          // Impact Particles/Sparks
          const numParticles = isFinal ? 60 : 12; // Double the particles on final strike
          for(let p=0; p<numParticles; p++) {
              const angle = (Math.PI * 2 / numParticles) * p + (elapsed * 5);
              const dist = (timeSinceStrike * (isFinal ? 300 : 150)) * (0.5 + Math.abs(Math.sin(p * idx)) * 0.5);
              const pX = strikeTarget.x + Math.cos(angle) * dist;
              const pY = strikeTarget.y + Math.sin(angle) * dist;

              fgCtx.beginPath();
              fgCtx.arc(pX, pY, isFinal ? 3 : 2, 0, Math.PI * 2);
              fgCtx.fillStyle = `rgba(${beamColor}, ${flashOp})`;
              fgCtx.fill();
          }

          fgCtx.restore();
      }
    });

    if (maxFlashOpacity > 0 && fgCtx) {
      fgCtx.save();
      fgCtx.globalCompositeOperation = 'screen';
      fgCtx.fillStyle = `rgba(${flashRgb}, ${maxFlashOpacity * 0.4})`;
      fgCtx.fillRect(0, 0, w, h);
      fgCtx.restore();
    }

    // Apply the progressive mask to the card front
    if (cardFrontRef.current && !isRevealedRef.current) {
        const maskVal = maskLayers.length > 0 ? maskLayers.join(', ') : 'linear-gradient(rgba(0,0,0,0), rgba(0,0,0,0))';
        if (lastMaskValRef.current !== maskVal) {
            cardFrontRef.current.style.maskImage = maskVal;
            cardFrontRef.current.style.WebkitMaskImage = maskVal;
            lastMaskValRef.current = maskVal;
        }
    }

    if (elapsed >= flipAt + 0.8) {
        executeRevealState();
    }

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

    const schedule = STRIKE_SCHEDULES[card.tier];

    // Size both canvases after their conditional mount and before scheduling the render loop.
    // This ensures the canvas backing dimensions are established before the first render frame,
    // preventing the default 300×150 backing size from clipping beam/particle effects.
    requestAnimationFrame(() => {
      if (bgCanvasRef.current) {
        bgCanvasRef.current.width = window.innerWidth;
        bgCanvasRef.current.height = window.innerHeight;
      }
      if (fgCanvasRef.current) {
        fgCanvasRef.current.width = window.innerWidth;
        fgCanvasRef.current.height = window.innerHeight;
      }

      // Now schedule the render loop with properly sized canvases
      if (!shouldReduceMotion) {
        rafRef.current = requestAnimationFrame(renderCanvas);
      }
    });
    rafStartTimeRef.current = 0;

    // Cache card geometry for render loop
    if (cardRef.current) {
        const rect = cardRef.current.getBoundingClientRect();
        if (rect && rect.width > 0 && rect.height > 0) {
            cardMetricsRef.current = {
                cx: rect.left + rect.width / 2,
                cy: rect.top + rect.height / 2,
                w: rect.width,
                h: rect.height
            };
        }
    }
    lastMaskValRef.current = '';
    strikeTargetsRef.current = {};

    // Fallback timer to ensure reveal state is reached
    const finalStrikeTime = schedule[schedule.length - 1];
    fallbackTimerRef.current = setTimeout(() => {
        executeRevealState();
    }, (finalStrikeTime + 0.1 + 0.8 + 0.2) * 1000); // 200ms grace period after the 0.8s flip completes


    // --- FRAMER MOTION CHOREOGRAPHY ---
    const sequence = [];

    // Initial state: SUMMON and FORM (0 to 1.0s)
    sequence.push([cardRef.current, { y: 20, rotateZ: 0, opacity: 0, filter: "brightness(0)" }, { duration: 0.1 }]);
    sequence.push([cardFlipRef.current, { rotateY: 0 }, { duration: 0 }]);
    sequence.push([cardRef.current, { opacity: 1, filter: "brightness(0.3)", y: 0 }, { at: 0.1, duration: 0.9, ease: 'easeOut' }]);

    // Synchronize physical reactions with strikes
    schedule.forEach((strikeTime, idx) => {
      const isFinal = idx === schedule.length - 1;

      // Reaction intensity scales with index and tier
      let basePower = 5 + (idx * 4);
      let baseRot = 2 + idx;

      if (card.tier === 'premium') { basePower *= 1.3; baseRot *= 1.3; }
      if (card.tier === 'flagship') { basePower *= 1.6; baseRot *= 1.6; }

      const power = isFinal ? Math.min(45, basePower * 2.5) : Math.min(30, basePower * 1.5);
      const rotPower = isFinal ? Math.min(15, baseRot * 2.0) : Math.min(10, baseRot * 1.5);

      // Determine direction of strike based on angle Map
      const angleMap = [Math.PI * -0.25, Math.PI * -0.75, Math.PI * 0.25, Math.PI * 0.75, Math.PI * -0.5, Math.PI * 0.5, 0];
      const targetAngle = isFinal ? 0 : angleMap[idx % angleMap.length];

      const dirX = isFinal ? 0 : Math.cos(targetAngle);
      const dirY = isFinal ? 1 : Math.sin(targetAngle); // Hit pushes it down/back slightly
      const rotDir = isFinal ? 0 : (dirX > 0 ? 1 : -1);

      const shakeDur = isFinal ? 0.6 : 0.4;
      const scaleUp = isFinal ? 1.4 : 1.1 + (idx * 0.05); // Escalating scale
      const finalScale = isFinal ? 1.2 : 1.0;

      const recoilX = power * dirX;
      const recoilY = (power * 0.5) * dirY;
      const recoilRot = rotPower * rotDir;

      // Evolving brightness/glow
      const brightStart = isFinal ? "brightness(3)" : `brightness(${1.2 + idx * 0.2})`;
      const brightEnd = isFinal ? "brightness(1)" : `brightness(${0.4 + idx * 0.1})`;

      sequence.push([
        cardRef.current,
        {
          x: [0, recoilX, -recoilX * 0.5, recoilX * 0.2, 0],
          y: [0, recoilY, -recoilY * 0.3, 0],
          rotateZ: [0, recoilRot, -recoilRot * 0.4, 0],

          filter: [brightStart, brightEnd]
        },
        {
          at: strikeTime.toString(),
          duration: shakeDur,
          ease: "easeInOut"
        }
      ]);

      // Before final strike, there is a deliberate anticipation pause built into the STRIKE_SCHEDULES timing gap.
    });

    const finalStrike = schedule[schedule.length - 1];
    const flipAt = finalStrike + 0.8;

    sequence.push([cardRef.current, { x: 0, y: 0, rotateZ: 0, opacity: 1, filter: "brightness(1)" }, { at: flipAt.toString(), duration: 0.8, ease: "circOut" }]);
    sequence.push([cardFlipRef.current, { rotateY: 180 }, { at: flipAt.toString(), duration: 0.8, ease: "circOut" }]);

    // Guard animation for reduced-motion users
    if (!shouldReduceMotion) {
      animationControlsRef.current = animate(sequence, { autoplay: true });
    } else {
      // Apply revealed static card state without animation
      if (cardRef.current) {
        cardRef.current.style.opacity = '1';
        cardRef.current.style.filter = 'brightness(1)';
      }
      if (cardFlipRef.current) {
        cardFlipRef.current.style.transform = 'rotateY(180deg)';
      }

      // Reduced motion fallback path
      executeRevealState();
    }
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
            disabled={isGenerating}
            className="mt-2 px-6 py-2.5 rounded-full font-bold text-base shadow-lg transition-all bg-gradient-to-r from-amber-400 to-amber-600 text-slate-950 hover:brightness-110 active:scale-95"
          >
            {isGenerating ? 'Revealing...' : "Reveal Today's Luck"}
          </button>
        )}
      </div>

      <div
        ref={scope}
        className="w-full flex justify-center pt-16 pb-4 flex-shrink-0 relative"
        style={{ perspective: '1200px' }}
      >
        <motion.div
          ref={cardRef}
          className="card-container relative z-20 w-[280px] h-[405px] cursor-pointer mx-auto flex-shrink-0 [WebkitTapHighlightColor:transparent] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-amber-400 rounded-2xl"
        >
          <div className="relative w-full h-full">
            <div
              ref={cardFlipRef}
              className="w-full h-full relative"
              style={{
                transformStyle: 'preserve-3d',
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
                ref={cardFrontRef}
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
