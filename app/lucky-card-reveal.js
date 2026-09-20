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
  standard: [3.5, 4.8, 6.3],
  premium: [3.2, 4.3, 5.4, 6.5, 8.2],
  flagship: [3.0, 3.8, 4.6, 5.4, 6.2, 7.0, 9.0]
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
    const holdDuration = 1.2;
    const flipAt = finalStrike + holdDuration;
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

    // Draw Ambient Edge Glow (Cosmic Energy entering from outside)
    if (elapsed > 0) {
      const ambientProg = Math.min(1, elapsed / 1.5);
      ctx.save();
      ctx.globalCompositeOperation = 'screen';

      const baseColor = tierColors[tier][0];

      // Top Left Glow
      const tlGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, w * 0.8);
      tlGrad.addColorStop(0, `rgba(${baseColor}, ${ambientProg * 0.4})`);
      tlGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = tlGrad;
      ctx.fillRect(0, 0, w, h * 0.5);

      // Top Right Glow
      const trGrad = ctx.createRadialGradient(w, 0, 0, w, 0, w * 0.8);
      trGrad.addColorStop(0, `rgba(${baseColor}, ${ambientProg * 0.4})`);
      trGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = trGrad;
      ctx.fillRect(0, 0, w, h * 0.5);

      // Subtle atmospheric dust/noise in the upper area
      const timeScale = elapsed * 0.2;
      for (let i = 0; i < 20; i++) {
         const rawPx = (w * 0.1 * i + Math.sin(timeScale + i) * 50);
         const rawPy = (h * 0.2 * Math.cos(timeScale * 0.5 + i) + h * 0.1);
         const pX = ((rawPx % w) + w) % w;
         const pY = ((rawPy % (h * 0.4)) + (h * 0.4)) % (h * 0.4);
         ctx.beginPath();
         ctx.arc(pX, pY, 1 + Math.sin(elapsed * 2 + i), 0, Math.PI * 2);
         ctx.fillStyle = `rgba(255, 255, 255, ${ambientProg * 0.2})`;
         ctx.fill();
      }

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

      // Strike / Volumetric Energy Filaments
      const travelTime = 0.4; // Slightly slower for more cinematic feel
      const fadeTime = isFinal ? 0.8 : 0.4;
      const strikeStart = strikeTime - travelTime;

      if (elapsed >= strikeStart && elapsed < strikeTime + fadeTime) {

        // Determine origin points (corners / sides) based on strike index
        const origins = [
            { x: 0, y: 0 },         // Top Left
            { x: w, y: 0 },         // Top Right
            { x: -50, y: h * 0.3 }, // Mid Left offscreen
            { x: w + 50, y: h * 0.3 },// Mid Right offscreen
            { x: w * 0.2, y: -50 }, // Top Center-Left
            { x: w * 0.8, y: -50 }  // Top Center-Right
        ];

        // Final strike comes from all directions (we use a composite approach)
        const origin = isFinal ? { x: w/2, y: -100 } : origins[idx % origins.length];

        // Add random variance to start position
        const startX = isFinal ? w/2 + Math.sin(elapsed*5)*200 : origin.x;
        const startY = isFinal ? -100 : origin.y;

        let progress = 0;
        let opacity = 0;

        if (elapsed < strikeTime) {
          const t = (elapsed - strikeStart) / travelTime;
          // Smooth, sweeping acceleration
          progress = t * t * (3 - 2 * t);
          // Opacity builds quickly, peaks at impact
          opacity = t * 1.5;
        } else {
          progress = 1;
          // Ethereal fade out
          opacity = Math.pow(1 - (timeSinceStrike / fadeTime), 1.5);
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

        ctx.save();
        ctx.globalCompositeOperation = 'screen';

        // Draw multiple filaments converging
        const numFilaments = isFinal ? 8 : 3;

        for (let f = 0; f < numFilaments; f++) {

            // If final, spread origins out for a converging blast
            const fStartX = isFinal ? (w/2) + Math.cos(f * Math.PI/4) * (w) : startX;
            const fStartY = isFinal ? -100 + Math.sin(f * Math.PI/4) * (h/2) : startY;

            const currentX = fStartX + (impactX - fStartX) * progress;
            const currentY = fStartY + (impactY - fStartY) * progress;

            // Atmospheric Bloom / Scattering around the filament
            ctx.lineWidth = isFinal ? 120 - (f*10) : 40 + (idx * 5) - (f*8);
            ctx.strokeStyle = `rgba(${beamColor}, ${(isFinal ? 0.15 : 0.1) * opacity})`;
            ctx.lineCap = 'round';

            ctx.beginPath();
            ctx.moveTo(fStartX, fStartY);

            // Curved, organic path
            const controlPointX = fStartX + (impactX - fStartX) * 0.5 + Math.sin(elapsed * 2 + f) * 100;
            const controlPointY = fStartY + (impactY - fStartY) * 0.3 + Math.cos(elapsed * 3 + f) * 100;

            // Trace the path up to current progress
            // Quadratic Bezier interpolation calculation for the intermediate point
            const t = progress;
            const targetCX = Math.pow(1-t, 2)*fStartX + 2*(1-t)*t*controlPointX + Math.pow(t, 2)*currentX;
            const targetCY = Math.pow(1-t, 2)*fStartY + 2*(1-t)*t*controlPointY + Math.pow(t, 2)*currentY;

            // Adjust the control point dynamically for the partial curve to prevent jumping ahead
            const currentControlX = fStartX + (controlPointX - fStartX) * t;
            const currentControlY = fStartY + (controlPointY - fStartY) * t;

            // Draw path smoothly up to current progress
            ctx.quadraticCurveTo(currentControlX, currentControlY, currentX, currentY);
            ctx.stroke();

            // Inner Plasma Core
            ctx.lineWidth = isFinal ? 15 - f : 4 + (idx * 0.5) - f;
            ctx.strokeStyle = `rgba(255, 255, 255, ${0.7 * opacity})`;
            ctx.stroke();

            // Branching Electrical Filaments (Proton-energy effect)
            if (Math.random() > (isFinal ? 0.3 : 0.6)) {
                ctx.beginPath();
                // Start somewhere along the curve
                const branchT = progress * (0.3 + Math.random() * 0.6);
                const branchStartX = Math.pow(1-branchT, 2)*fStartX + 2*(1-branchT)*branchT*controlPointX + Math.pow(branchT, 2)*currentX;
                const branchStartY = Math.pow(1-branchT, 2)*fStartY + 2*(1-branchT)*branchT*controlPointY + Math.pow(branchT, 2)*currentY;

                ctx.moveTo(branchStartX, branchStartY);
                // Jagged branching
                const angleOffset = (Math.random() - 0.5) * Math.PI;
                const branchLen = (20 + Math.random() * 40) * (isFinal ? 1.5 : 1.0);
                const branchEndX = branchStartX + Math.cos(angleOffset) * branchLen;
                const branchEndY = branchStartY + Math.sin(angleOffset) * branchLen;

                ctx.lineTo(branchStartX + (branchEndX - branchStartX)*0.5 + (Math.random()-0.5)*20, branchStartY + (branchEndY - branchStartY)*0.5 + (Math.random()-0.5)*20);
                ctx.lineTo(branchEndX, branchEndY);

                ctx.lineWidth = isFinal ? 2 + Math.random() * 2 : 1 + Math.random();
                ctx.strokeStyle = `rgba(255, 255, 255, ${0.5 * opacity})`;
                ctx.stroke();

                // Bloom for branch
                ctx.lineWidth = isFinal ? 8 : 4;
                ctx.strokeStyle = `rgba(${beamColor}, ${0.3 * opacity})`;
                ctx.stroke();
            }

            // Energy convergence at the tip
            ctx.beginPath();
            ctx.arc(currentX, currentY, ctx.lineWidth * (isFinal ? 3 : 1.5), 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255, 255, 255, ${opacity * 0.9})`;
            ctx.shadowColor = `rgba(${beamColor}, 1)`;
            ctx.shadowBlur = 20;
            ctx.fill();
            ctx.shadowBlur = 0;
        }

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
    }, (finalStrikeTime + 1.2 + 0.8 + 0.2) * 1000); // Wait for the new 1.2s hold duration + 0.8s flip + grace period


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
    const holdDuration = 1.2;
    const flipAt = finalStrike + holdDuration;

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
