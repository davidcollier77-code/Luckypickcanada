'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import CollectionBinder from './collection-binder';
import { motion, useAnimate, useReducedMotion } from 'framer-motion';
import { LUCKY_CARDS, selectWeightedLuckyCard, selectRandomQuote } from './lucky-card-data';
import LuckyCardShare from './lucky-card-share';
import MidnightCountdown from '../components/midnight-countdown';

const STORAGE_KEY = 'lucky-pick-canada-todays-lucky-moment';

function localDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const TIER_HITS = {
  standard: 3,
  premium: 4,
  flagship: 5
};

// Hit durations in seconds
const HIT_DURATION = 1.6;
const FINAL_HIT_DISSIPATE = 4.3; // Final flip + afterglow (1.8s flip sequence + 2.5s dissipation)

export default function LuckyCardReveal() {
  const [selectedCard, setSelectedCard] = useState(null);
  const [previousCardId, setPreviousCardId] = useState(null);
  const [previousQuote, setPreviousQuote] = useState(null);
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

  const bgCanvasRef = useRef(null);
  const fgCanvasRef = useRef(null);
  const rafRef = useRef(null);
  const rafStartTimeRef = useRef(0);
  const activeTierRef = useRef('standard');
  const isRevealedRef = useRef(false);
  const activeCardRef = useRef(null);
  const cardMetricsRef = useRef({ cx: 140, cy: 202.5, w: 280, h: 405 });
  const fallbackTimerRef = useRef(null);

  const particlesRef = useRef([]);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.revealDate === localDateKey()) {
          const card = LUCKY_CARDS.find(c => c.id === parsed.cardId);
          if (card) {
            setSelectedCard({ ...card, quote: parsed.quote || card.quote });
            setIsRevealed(true);
          }
        } else {
          setPreviousCardId(parsed.cardId);
          setPreviousQuote(parsed.quote);
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

    if (activeCardRef.current && typeof window !== 'undefined') {
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify({
          cardId: activeCardRef.current.id,
          quote: activeCardRef.current.quote,
          revealDate: localDateKey()
        }));

        // Also update the unlockedCards collection
        const storedCollection = window.localStorage.getItem('unlockedCards');
        let collection = [];
        if (storedCollection) {
          const parsedCollection = JSON.parse(storedCollection);
          collection = Array.isArray(parsedCollection) ? parsedCollection : [];
        }
        if (!collection.includes(activeCardRef.current.id)) {
          collection.push(activeCardRef.current.id);
          window.localStorage.setItem('unlockedCards', JSON.stringify(collection));
          window.dispatchEvent(new Event('unlockedCardsUpdated'));
        }
      } catch (e) {}
    }

    if (cardFrontRef.current) {
        cardFrontRef.current.style.maskImage = 'none';
        cardFrontRef.current.style.webkitMaskImage = 'none';
    }
  }, []);

  // Helpers for lightning drawing
  const drawContinuousBeam = (bgCtx, fgCtx, originX, originY, targetX, targetY, radius, wrapProgress, width, color, isSecondary, timestamp) => {
    const dx = targetX - originX;
    const dy = targetY - originY;
    const dist = Math.sqrt(dx * dx + dy * dy);

    // 3D Ellipse properties
    const radiusX = radius;
    const radiusY = radius * 0.35; // Squashed for 3D perspective
    const rotation = isSecondary ? -0.15 : 0.15; // Slight tilt

    const angleToTarget = Math.atan2(dy, dx);
    const tangentOffsetAngle = isSecondary ? -0.8 : 0.8;
    const hitAngle = angleToTarget + tangentOffsetAngle;

    // Contact point on the ellipse
    const contactX = targetX + Math.cos(rotation)*radiusX*Math.cos(hitAngle) - Math.sin(rotation)*radiusY*Math.sin(hitAngle);
    const contactY = targetY + Math.sin(rotation)*radiusX*Math.cos(hitAngle) + Math.cos(rotation)*radiusY*Math.sin(hitAngle);

    const time = (timestamp - rafStartTimeRef.current) / (isSecondary ? 150 : 250);
    const offsetMag = dist * (isSecondary ? 0.3 : 0.15);
    const offset = Math.sin(time + originX) * offsetMag;

    // Add turbulence to control points
    const turbX = (Math.random() - 0.5) * 20;
    const turbY = (Math.random() - 0.5) * 20;

    const cp1X = originX + dx * 0.4 - Math.sin(angleToTarget) * offset + turbX;
    const cp1Y = originY + dy * 0.4 + Math.cos(angleToTarget) * offset + turbY;

    const cpDistance = radius * 1.5;
    const tangentDirection = isSecondary ? -1 : 1;
    const cp2X = contactX + Math.sin(hitAngle) * cpDistance * tangentDirection + (Math.random() - 0.5) * 15;
    const cp2Y = contactY - Math.cos(hitAngle) * cpDistance * tangentDirection + (Math.random() - 0.5) * 15;

    const drawCurve = (ctx, drawFn) => {
      // Outer glow (more color, more bloom)
      ctx.beginPath();
      ctx.moveTo(originX, originY);
      drawFn(ctx);
      ctx.lineWidth = width * 3.5;
      ctx.strokeStyle = color.replace(/,[\s\d.]+\)$/, ', 0.4)');
      ctx.lineCap = 'round';
      ctx.stroke();

      // Main colored plasma (thicker, organic)
      ctx.beginPath();
      ctx.moveTo(originX, originY);
      drawFn(ctx);
      ctx.lineWidth = width * 2.0;
      ctx.strokeStyle = color.replace(/,[\s\d.]+\)$/, ', 0.85)');
      ctx.lineCap = 'round';
      ctx.stroke();

      // White hot core (smaller, tighter)
      ctx.beginPath();
      ctx.moveTo(originX, originY);
      drawFn(ctx);
      ctx.lineWidth = width * 0.3;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.lineCap = 'round';
      ctx.stroke();
    };

    if (wrapProgress <= 0) {
      if (fgCtx) {
        drawCurve(fgCtx, (ctx) => {
          const t = Math.max(0, Math.min(1, 1 + wrapProgress * 2));
          const ptX = Math.pow(1-t, 3)*originX + 3*Math.pow(1-t, 2)*t*cp1X + 3*(1-t)*Math.pow(t, 2)*cp2X + Math.pow(t, 3)*contactX;
          const ptY = Math.pow(1-t, 3)*originY + 3*Math.pow(1-t, 2)*t*cp1Y + 3*(1-t)*Math.pow(t, 2)*cp2Y + Math.pow(t, 3)*contactY;
          const subCp1X = originX + (cp1X - originX) * t;
          const subCp1Y = originY + (cp1Y - originY) * t;
          const subCp2X = subCp1X + (cp2X - cp1X) * t;
          const subCp2Y = subCp1Y + (cp2Y - cp1Y) * t;

          // Introduce micro-jitter on approach
          const jitterX = (Math.random() - 0.5) * 5 * t;
          const jitterY = (Math.random() - 0.5) * 5 * t;

          ctx.bezierCurveTo(subCp1X, subCp1Y, subCp2X, subCp2Y, ptX + jitterX, ptY + jitterY);
        });
      }
    } else {
      if (fgCtx) {
        drawCurve(fgCtx, (ctx) => {
          ctx.bezierCurveTo(cp1X, cp1Y, cp2X, cp2Y, contactX, contactY);
        });

        // Impact flare at contact point
        if (wrapProgress < 0.2) { // Just hit
            const flareSize = width * (3 + Math.random() * 2);
            fgCtx.beginPath();
            fgCtx.arc(contactX, contactY, flareSize, 0, Math.PI * 2);
            fgCtx.fillStyle = 'rgba(255, 255, 255, 0.6)';
            fgCtx.fill();

            fgCtx.beginPath();
            fgCtx.arc(contactX, contactY, flareSize * 2, 0, Math.PI * 2);
            // Flare with adjusted alpha
            const alphaMatch = color.match(/rgba?\([^)]+,\s*([\d.]+)\)/);
            const newAlpha = 0.5;
            fgCtx.fillStyle = alphaMatch
              ? color.replace(/,\s*[\d.]+\)$/, `, ${newAlpha})`) : color.replace(')', `, ${newAlpha})`);
            fgCtx.fill();
        }
      }

      const wrapEndAngle = hitAngle + (isSecondary ? -1 : 1) * (Math.PI * 2 * wrapProgress);

      const startA = isSecondary ? wrapEndAngle : hitAngle;
      const endA = isSecondary ? hitAngle : wrapEndAngle;

      const segments = 32;
      const step = (endA - startA) / segments;

      for(let i=0; i<segments; i++) {
        const a1 = startA + i*step;
        const a2 = startA + (i+1)*step;
        const midA = (a1 + a2) / 2;

        let normA = midA % (Math.PI * 2);
        if (normA < 0) normA += Math.PI * 2;
        const isFront = normA > 0 && normA < Math.PI;

        const ctx = isFront ? fgCtx : bgCtx;
        if (ctx) {
          // Add irregularity to the wrapping ring
          const radiusJitterX = (Math.random() - 0.5) * width * 0.5;
          const radiusJitterY = (Math.random() - 0.5) * width * 0.5;

          // Outer wrap glow
          ctx.beginPath();
          ctx.ellipse(targetX, targetY, radiusX + radiusJitterX, radiusY + radiusJitterY, rotation, a1, a2, false);
          ctx.lineWidth = width * 2;
          ctx.strokeStyle = color.replace(')', ', 0.3)').replace('rgba', 'rgba');
          ctx.lineCap = 'round';
          ctx.stroke();

          // Main wrap
          ctx.beginPath();
          ctx.ellipse(targetX, targetY, radiusX + radiusJitterX, radiusY + radiusJitterY, rotation, a1, a2, false);
          ctx.lineWidth = width;
          ctx.strokeStyle = color;
          ctx.lineCap = 'round';
          ctx.stroke();

          // Wrap core
          ctx.beginPath();
          ctx.ellipse(targetX, targetY, radiusX + radiusJitterX, radiusY + radiusJitterY, rotation, a1, a2, false);
          ctx.lineWidth = width * 0.3;
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
          ctx.lineCap = 'round';
          ctx.stroke();
        }
      }

      if (wrapProgress > 0.1) {
         let normEnd = wrapEndAngle % (Math.PI * 2);
         if (normEnd < 0) normEnd += Math.PI * 2;
         const isFront = normEnd > 0 && normEnd < Math.PI;
         const ctx = isFront ? fgCtx : bgCtx;
         if (ctx) {
           const edgeSize = 0.3 + Math.random() * 0.2; // Flickering edge
           ctx.beginPath();
           ctx.ellipse(targetX, targetY, radiusX, radiusY, rotation, wrapEndAngle - (isSecondary ? -edgeSize : edgeSize), wrapEndAngle, isSecondary);
           ctx.lineWidth = width * 2; // Thicker bright head
           const edgeAlpha = Number(color.split(',').pop().replace(')', '').trim() || 1);
           ctx.strokeStyle = `rgba(255, 255, 255, ${edgeAlpha * (0.8 + Math.random() * 0.2)})`;
           ctx.stroke();
         }
      }
    }
  };

  const renderCanvas = (timestamp) => {
    if (!bgCanvasRef.current || shouldReduceMotion) return;
    if (!rafStartTimeRef.current) rafStartTimeRef.current = timestamp;

    let elapsed = (timestamp - rafStartTimeRef.current) / 1000;

    const bgCtx = bgCanvasRef.current.getContext('2d');
    const fgCtx = fgCanvasRef.current ? fgCanvasRef.current.getContext('2d') : null;
    const w = bgCanvasRef.current.width;
    const h = bgCanvasRef.current.height;

    const { cx, cy, w: cardW, h: cardH } = cardMetricsRef.current;
    const tier = activeTierRef.current;
    const totalHits = TIER_HITS[tier] || 3;
    const finalHitStartTime = (totalHits - 1) * HIT_DURATION;
    const maxLifetime = finalHitStartTime + FINAL_HIT_DISSIPATE;

    bgCtx.clearRect(0, 0, w, h);
    if (fgCtx) fgCtx.clearRect(0, 0, w, h);

    bgCtx.save();
    bgCtx.globalCompositeOperation = 'screen';
    if (fgCtx) {
      fgCtx.save();
      fgCtx.globalCompositeOperation = 'screen';
    }

    const colors = {
      blue: '14, 165, 233',
      pink: '217, 70, 239',
      standard: '217, 119, 6', // Bronze/Copper
      premium: '59, 130, 246',
      flagship: '234, 179, 8'
    };

    let activeHitIndex = Math.floor(elapsed / HIT_DURATION);
    let hitLocalTime = elapsed % HIT_DURATION;

    // Force final hit state if we are past its start time
    if (elapsed >= finalHitStartTime) {
      activeHitIndex = totalHits - 1;
      hitLocalTime = elapsed - finalHitStartTime;
    }

    if (activeHitIndex < totalHits) {
      const isFinalHit = activeHitIndex === totalHits - 1;
      const hitColor = isFinalHit ? colors[tier] : (activeHitIndex % 2 === 0 ? colors.blue : colors.pink);

      let intensityMult = 1;
      if (isFinalHit) {
        if (tier === 'premium') intensityMult = 1.5;
        if (tier === 'flagship') intensityMult = 2.5;
      }

      // Beam origin: alternate corners for visual interest
      const originX = (activeHitIndex % 2 === 0) ? 0 : w;
      const originY = (activeHitIndex % 3 === 0) ? 0 : (activeHitIndex % 3 === 1 ? h : h/2);

      // Phase calculation
      const P_ENTER = 0.2;
      const P_WRAP = 0.4;
      const P_HOLD = 1.0;
      const P_SHAKE = 1.2;
      const P_RETRACT = 1.4; // up to 1.6 is idle handoff

      if (!isFinalHit) {
        if (hitLocalTime < P_RETRACT) {
          let alpha = 1;
          let currentTargetX = cx;
          let currentTargetY = cy;
          let showWrap = false;
          let wrapProgress = 0;

          if (hitLocalTime < P_ENTER) {
            // Entering
            const t = hitLocalTime / P_ENTER;
            currentTargetX = originX + (cx - originX) * t;
            currentTargetY = originY + (cy - originY) * t;
          } else if (hitLocalTime < P_WRAP) {
            // Wrapping around
            showWrap = true;
            wrapProgress = (hitLocalTime - P_ENTER) / (P_WRAP - P_ENTER);
          } else if (hitLocalTime < P_HOLD) {
            // Holding
            showWrap = true;
            wrapProgress = 1;
          } else if (hitLocalTime < P_SHAKE) {
            // Shaking / Breaking Grip
            showWrap = true;
            wrapProgress = 1;
            // Lock beam target to card center during shake
            currentTargetX = cx;
            currentTargetY = cy;
            alpha = 1 - ((hitLocalTime - P_HOLD) / (P_SHAKE - P_HOLD)) * 0.5; // Starts fading/losing energy
          } else {
            // Retracting
            const t = (hitLocalTime - P_SHAKE) / (P_RETRACT - P_SHAKE);
            currentTargetX = cx + (originX - cx) * t;
            currentTargetY = cy + (originY - cy) * t;
            alpha = 1 - t;
          }

          if (alpha > 0) {
            const beamWidth = 8 + Math.random() * 4;
            // Negative progress during approach
            const approachProgress = (hitLocalTime < P_ENTER) ? (hitLocalTime / P_ENTER) - 1 : wrapProgress;
            const radius = cardW * 0.7;

            // Main beam
            drawContinuousBeam(bgCtx, fgCtx, originX, originY, currentTargetX, currentTargetY, radius, approachProgress, beamWidth, `rgba(${hitColor}, ${alpha * 0.8})`, false, timestamp);
            drawContinuousBeam(bgCtx, fgCtx, originX, originY, currentTargetX, currentTargetY, radius, approachProgress, beamWidth/2, `rgba(255, 255, 255, ${alpha})`, false, timestamp);

            // Secondary opposing beam
            drawContinuousBeam(bgCtx, fgCtx, originX, originY, currentTargetX, currentTargetY, radius + 15, approachProgress * 0.8, 4, `rgba(${hitColor}, ${alpha * 0.5})`, true, timestamp);
          }
        }
      } else {
        // FINAL HIT
        // Strong impact -> Wrap -> Lock -> Flip -> Afterglow
        const F_ENTER = 0.2;
        const F_WRAP = 0.4;
        const F_FLIP_TIME = 0.6;
        const F_AFTERGLOW_START = F_FLIP_TIME + 1.2; // Match framer motion flip duration

        let alpha = 1;

        if (hitLocalTime < F_AFTERGLOW_START) {
           // Still locking / flipping
           let currentTargetX = cx;
           let currentTargetY = cy;
           let showWrap = false;
           let wrapProgress = 1;

           if (hitLocalTime < F_ENTER) {
             const t = hitLocalTime / F_ENTER;
             currentTargetX = originX + (cx - originX) * t;
             currentTargetY = originY + (cy - originY) * t;
           } else if (hitLocalTime < F_WRAP) {
             showWrap = true;
             wrapProgress = (hitLocalTime - F_ENTER) / (F_WRAP - F_ENTER);
           } else {
             showWrap = true;
             wrapProgress = 1;
             // Lock becomes tighter right before flip
             if (hitLocalTime > F_FLIP_TIME - 0.2 && hitLocalTime < F_FLIP_TIME) {
                alpha = 1 + (Math.random() * 0.5); // flash tighter
             }
           }

           const beamWidth = (12 * intensityMult) + Math.random() * 6;
           const baseRadius = cardW * 0.7;
           const lockTightness = (hitLocalTime > F_FLIP_TIME) ? Math.max(0.4, 1 - (hitLocalTime - F_FLIP_TIME)*2) : 1; // Pull tight fast
           const radius = baseRadius * lockTightness;
           const approachProgress = (hitLocalTime < F_ENTER) ? (hitLocalTime / F_ENTER) - 1 : wrapProgress;

           // Calculate dynamic Y tracking during the launch (throw)
           // Framer Motion launches it y: -60 at F_FLIP_TIME over 0.4s
           let trackingY = currentTargetY;
           if (hitLocalTime >= F_FLIP_TIME && hitLocalTime < F_FLIP_TIME + 0.4) {
               const launchT = (hitLocalTime - F_FLIP_TIME) / 0.4;
               // Ease out roughly matches framer's easeOut
               const easeOut = 1 - Math.pow(1 - launchT, 3);
               trackingY = cy - (60 * easeOut);
           } else if (hitLocalTime >= F_FLIP_TIME + 0.4) {
               // Settle back down
               const settleT = Math.min(1, (hitLocalTime - (F_FLIP_TIME + 0.4)) / 0.8);
               // backOut approximate
               const c1 = 1.70158;
               const c3 = c1 + 1;
               const easeBack = 1 + c3 * Math.pow(settleT - 1, 3) + c1 * Math.pow(settleT - 1, 2);
               trackingY = (cy - 60) + (60 * easeBack);
           }

           // Draw the main tight gripping beam
           drawContinuousBeam(bgCtx, fgCtx, originX, originY, currentTargetX, trackingY, radius, approachProgress * (lockTightness < 1 ? 1.5 : 1), beamWidth, `rgba(${hitColor}, ${alpha * 0.9})`, false, timestamp);
           drawContinuousBeam(bgCtx, fgCtx, originX, originY, currentTargetX, trackingY, radius, approachProgress * (lockTightness < 1 ? 1.5 : 1), beamWidth/2, `rgba(255, 255, 255, ${alpha})`, false, timestamp);

           // Secondary counter-wrap
           drawContinuousBeam(bgCtx, fgCtx, originX, originY, currentTargetX, trackingY, radius + 20, approachProgress * 0.8, 6 * intensityMult, `rgba(${hitColor}, ${alpha * 0.6})`, true, timestamp);
           drawContinuousBeam(bgCtx, fgCtx, originX, originY, currentTargetX, trackingY, radius + 20, approachProgress * 0.8, 2 * intensityMult, `rgba(255, 255, 255, ${alpha * 0.8})`, true, timestamp);
        } else {
           // AFTERGLOW / FIZZ - Mystical Plasma Dissipation
           const afterglowTime = hitLocalTime - F_AFTERGLOW_START;
           const dissipateDuration = FINAL_HIT_DISSIPATE - F_AFTERGLOW_START;
           if (afterglowTime < dissipateDuration) {
             const t = afterglowTime / dissipateDuration;

             // The plasma burnout must be shared across all tiers (no tierMult scaling that makes them look different)
             const fizzAlpha = Math.max(0, 1 - Math.pow(t, 1.2)); // Slower ease out for alpha

             // Create depth by randomly selecting between fgCtx and bgCtx for different strands
             const availableCtxs = [fgCtx, bgCtx].filter(Boolean);
             availableCtxs.forEach(ctx => {
                ctx.lineCap = 'round';
                ctx.lineJoin = 'round';
             });

             // Draw localized plasma burnout adhering to card geometry
             // Expand the burnout area so the energy can spatially exceed the physical card boundaries
             // This removes the "rectangular box" constraint. The energy spreads out organically.
             const spread = 1 + t * 0.4; // Starts close to card size, expands outward
             const w2 = (cardW / 2) * spread;
             const h2 = (cardH / 2) * spread;

             // Base points around the card (corners and midpoints)
             const points = [
               { x: cx - w2, y: cy - h2 }, // TL
               { x: cx, y: cy - h2 },      // TM
               { x: cx + w2, y: cy - h2 }, // TR
               { x: cx + w2, y: cy },      // RM
               { x: cx + w2, y: cy + h2 }, // BR
               { x: cx, y: cy + h2 },      // BM
               { x: cx - w2, y: cy + h2 }, // BL
               { x: cx - w2, y: cy }       // LM
             ];

             // Draw jagged, electrical plasma conforming to the card edges
             const numPlasmaStrands = 5;
             for (let s = 0; s < numPlasmaStrands; s++) {
                // Randomly assign each plasma strand to foreground or background to create 3D depth
                const fizzCtx = availableCtxs[Math.floor(Math.random() * availableCtxs.length)] || fgCtx || bgCtx;
                if (Math.random() > (1 - t * 0.8)) continue; // Progressive fragmentation

                fizzCtx.beginPath();
                let started = false;

                for (let i = 0; i < points.length; i++) {
                    // Randomly skip some points to create broken arcs and fragments
                    if (Math.random() > 0.4 + t * 0.5) {
                       const p = points[i];
                       const nextP = points[(i + 1) % points.length];

                       // Jitter based on time and randomness to make it organic and chaotic
                       const jitterX = (Math.random() - 0.5) * 30 * (1 - t);
                       // Add a gravity drip/stretch effect on Y axis
                       const gravityStretch = (1 - t) * 40 * Math.random();
                       const jitterY = (Math.random() - 0.5) * 20 * (1 - t) + gravityStretch;

                       const cp1x = p.x + (nextP.x - p.x) * 0.3 + jitterX;
                       const cp1y = p.y + (nextP.y - p.y) * 0.3 + jitterY;
                       const cp2x = p.x + (nextP.x - p.x) * 0.7 - jitterX;
                       const cp2y = p.y + (nextP.y - p.y) * 0.7 - jitterY;

                       if (!started) {
                           fizzCtx.moveTo(p.x + (Math.random()-0.5)*10, p.y + (Math.random()-0.5)*10);
                           started = true;
                       }
                       fizzCtx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, nextP.x + (Math.random()-0.5)*10, nextP.y + (Math.random()-0.5)*10);
                    } else {
                       started = false;
                    }
                }

                const flickerThickness = 1.5 * (1 - t) * (1 + Math.random() * 2);
                const flickerAlpha = fizzAlpha * (0.4 + Math.random() * 0.6);

                // Blue/white plasma (hitColor)
                // Thick organic plasma body
                fizzCtx.lineWidth = flickerThickness * 2 + Math.random() * 4;
                fizzCtx.strokeStyle = `rgba(${hitColor}, ${flickerAlpha * 0.4})`;
                fizzCtx.stroke();

                fizzCtx.lineWidth = flickerThickness + Math.random() * 3;
                fizzCtx.strokeStyle = `rgba(${hitColor}, ${flickerAlpha})`;
                fizzCtx.stroke();

                // Core (tight, less dominant)
                if (Math.random() > 0.6) {
                    fizzCtx.lineWidth = flickerThickness * 0.3;
                    fizzCtx.strokeStyle = `rgba(255, 255, 255, ${flickerAlpha * 0.8})`;
                    fizzCtx.stroke();
                }
             }

             // Draw surface contact glow / hot spots
             for (let i = 0; i < 4; i++) {
                 const fizzCtx = availableCtxs[Math.floor(Math.random() * availableCtxs.length)] || fgCtx || bgCtx;
                 if (Math.random() > 1 - t) continue;
                 const glowX = cx + (Math.random() - 0.5) * (cardW * spread * 1.2);
                 const glowY = cy + (Math.random() - 0.5) * (cardH * spread * 1.2);

                 const glowR = 10 + Math.random() * 30 * (1 - t);
                 const grad = fizzCtx.createRadialGradient(glowX, glowY, 0, glowX, glowY, glowR);
                 grad.addColorStop(0, `rgba(255, 255, 255, ${fizzAlpha * 0.6})`);
                 grad.addColorStop(0.2, `rgba(${hitColor}, ${fizzAlpha * 0.4})`);
                 grad.addColorStop(1, 'rgba(0,0,0,0)');

                 fizzCtx.fillStyle = grad;
                 // Use exact bounding box for fillRect to optimize GPU
                 fizzCtx.fillRect(glowX - glowR, glowY - glowR, glowR * 2, glowR * 2);
             }

             // Sparks: Hot orange/gold heat sparks that break away and drizzle down
             const numSparks = Math.floor(25 * (1 - t));
             for (let i = 0; i < numSparks; i++) {
                 // Randomly push sparks to foreground or background
                 const fizzCtx = availableCtxs[Math.floor(Math.random() * availableCtxs.length)] || fgCtx || bgCtx;
                 // Sparks originate from card edges or surface
                 const sparkX = cx + (Math.random() - 0.5) * cardW * 1.1;
                 const sparkY = cy + (Math.random() - 0.5) * cardH * 1.1;

                 // Velocity: generally downwards (drizzling), with some lateral drift
                 const isExplosiveSpark = Math.random() > 0.5;

                 // Explosive sparks shoot outwards and up, heat sparks drift around
                 let vx = (Math.random() - 0.5) * (isExplosiveSpark ? 6 : 3);
                 let vy = (Math.random() - 0.5) * (isExplosiveSpark ? 6 : 2) - 1; // Generally upward/outward

                 // Age of this specific spark based on t to simulate falling over time
                 const sparkAge = t * (1 + Math.random());

                 // Add subtle curve/drift to particle path
                 const drift = Math.sin(sparkAge * 5 + i) * 20;

                 const currentX = sparkX + vx * sparkAge * 40 + drift;
                 // Gravity eventually pulls them down a bit if they live long enough
                 const gravityEffect = Math.pow(sparkAge, 2) * 20;
                 const currentY = sparkY + vy * sparkAge * 40 + gravityEffect;

                 const sparkSize = (1 + Math.random() * 2) * (1 - t);
                 const sparkAlpha = fizzAlpha * (0.5 + Math.random() * 0.5);

                 // Mix tier-colored sparks with superheated sparks
                 let sparkColor = `rgba(${hitColor}, ${sparkAlpha})`;
                 if (Math.random() > 0.5) {
                    const r = 255;
                    const g = 150 + Math.floor(Math.random() * 50);
                    const b = 0;
                    sparkColor = `rgba(${r}, ${g}, ${b}, ${sparkAlpha})`;
                 }

                 fizzCtx.beginPath();
                 fizzCtx.arc(currentX, currentY, sparkSize, 0, Math.PI * 2);
                 fizzCtx.fillStyle = sparkColor;
                 fizzCtx.fill();
             }
           }


        }
      }
    }

    bgCtx.restore();
    if (fgCtx) fgCtx.restore();

    // Trigger executeRevealState exactly at the end of the lock/flip moment
    if (elapsed >= finalHitStartTime + 0.6 + 1.2 && !isRevealedRef.current) {
        executeRevealState();
    }

    if (elapsed < maxLifetime) {
      rafRef.current = requestAnimationFrame(renderCanvas);
    } else {
      fallbackTimerRef.current = setTimeout(() => {
        setIsGenerating(false);
      }, 100);
    }
  };

  const triggerCardDraw = () => {
    stopAll();

    const card = selectWeightedLuckyCard(previousCardId);
    activeTierRef.current = card.tier;
    activeCardRef.current = card;
    card.quote = selectRandomQuote(previousQuote);
    isRevealedRef.current = false;

    setSelectedCard(card);
    setIsRevealed(false);
    setIsGenerating(true);
    setImageError(false);

    requestAnimationFrame(() => {
      if (bgCanvasRef.current) {
        bgCanvasRef.current.width = window.innerWidth;
        bgCanvasRef.current.height = window.innerHeight;
      }
      if (fgCanvasRef.current) {
        fgCanvasRef.current.width = window.innerWidth;
        fgCanvasRef.current.height = window.innerHeight;
      }

      if (!shouldReduceMotion) {
        rafRef.current = requestAnimationFrame(renderCanvas);
      }
    });
    rafStartTimeRef.current = 0;

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

    // --- NEW FRAMER MOTION CHOREOGRAPHY ---
    const sequence = [];
    const totalHits = TIER_HITS[card.tier] || 3;
    const finalHitStartTime = (totalHits - 1) * HIT_DURATION;

    // Initial prep
    sequence.push([cardRef.current, { y: 0, scale: 1.0, rotateZ: 0, opacity: 1, filter: "brightness(0.7)" }, { duration: 0 }]);
    sequence.push([cardFlipRef.current, { rotateY: 0 }, { duration: 0 }]);

    let currentTime = 0;

    // Non-final hits choreography
    for (let i = 0; i < totalHits - 1; i++) {
        // Timeline for this hit
        const hitStart = i * HIT_DURATION;
        const P_ENTER = 0.2;
        const P_WRAP = 0.4;
        const P_HOLD = 1.0;
        const P_SHAKE = 1.2;

        // Card reaction on EVERY IMPACT (wrap/hit moment) - perfectly synchronized with contact
        // Contact occurs at P_WRAP
        sequence.push([
            cardRef.current,
            { filter: "brightness(1.5)", scale: 0.98, x: [-8, 8, -4, 4, 0], rotateZ: [-1.5, 1.5, -0.5, 0.5, 0] },
            { at: hitStart + P_WRAP, duration: 0.2, ease: "easeInOut" }
        ]);

        // Card fights the grip starting exactly at contact (P_WRAP) until release (P_SHAKE)
        // Wrap phase starts at P_WRAP and holds until P_SHAKE
        const fightDuration = P_SHAKE - P_WRAP;
        sequence.push([
            cardRef.current,
            { x: [-8, 8, -6, 6, -8, 8, -4, 4, -2, 2, 0], rotateZ: [-1.5, 1.5, -1, 1, -1.5, 1.5, -0.5, 0.5, 0], filter: "brightness(1.2)" },
            { at: hitStart + P_WRAP, duration: fightDuration, ease: "linear" }
        ]);

        // Relax after release
        sequence.push([cardRef.current, { scale: 1.0, filter: "brightness(0.7)" }, { at: hitStart + P_SHAKE, duration: 0.2 }]);
    }

    // FINAL HIT
    const F_ENTER = 0.2;
    const F_WRAP = 0.4;
    const F_FLIP_TIME = 0.6; // exact lock and start of flip

    // Final Impact - tension grab
    sequence.push([
      cardRef.current,
      { filter: "brightness(2.5)", scale: 0.93, y: 15, rotateZ: -1 },
      { at: finalHitStartTime + F_WRAP, duration: 0.2, ease: "easeOut" }
    ]);

    // The Reveal Flip / Throw
    const flipAbsTime = finalHitStartTime + F_FLIP_TIME;

    // Throw upwards and scale out
    sequence.push([cardRef.current, { y: -60, scale: 1.05, filter: "brightness(1)" }, { at: flipAbsTime, duration: 0.4, ease: "easeOut" }]);

    // Settle back down
    sequence.push([cardRef.current, { y: 0, scale: 1.0, rotateZ: 0 }, { at: flipAbsTime + 0.4, duration: 0.8, ease: "backOut" }]);

    // Flip with overshoot
    sequence.push([cardFlipRef.current, { rotateY: 180 }, { at: flipAbsTime, duration: 1.2, ease: "circOut" }]);

    if (!shouldReduceMotion) {
      animationControlsRef.current = animate(sequence, { autoplay: true });
    } else {
      if (cardRef.current) {
        cardRef.current.style.opacity = '1';
        cardRef.current.style.filter = 'brightness(1)';
      }
      if (cardFlipRef.current) {
        cardFlipRef.current.style.transform = 'rotateY(180deg)';
      }
      executeRevealState();
    }
  };

  return (
    <div className="w-full max-w-sm mx-auto flex flex-col items-center px-4 py-2 md:py-4 space-y-3 md:space-y-6 select-none relative z-10">

      {/* Cinematic Deep Space Background */}
      <div className="fixed inset-0 z-[-20] w-full h-full pointer-events-none">
        <Image
          src="/NGC4216_crawford.jpg"
          alt="Cosmic Space Background"
          fill
          priority
          quality={85}
          className="object-cover object-center"
          sizes="100vw"
          onError={(e) => e.target.style.display = 'none'}
        />
      </div>

      {/* Existing Background Canvas */}

      
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
        className="w-full flex justify-center pt-6 pb-2 md:pt-16 md:pb-4 flex-shrink-0 relative"
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

      <div className="w-full flex items-center justify-center gap-2.5 pt-1 relative z-40 shrink-0">
        <CollectionBinder />
        <Link
          href="/"
          className="flex-1 min-w-0 inline-flex items-center justify-center min-h-9 px-3 py-2 rounded-xl bg-white/5 backdrop-blur-sm border border-white/15 text-white/80 text-xs font-semibold tracking-wide whitespace-nowrap shadow-sm hover:bg-white/10 hover:border-white/25 hover:text-white active:scale-[0.98] transition-all duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-300"
        >
          Return to Home
        </Link>
      </div>

      {isReady && isRevealed && selectedCard && (
        <div className="w-full flex flex-col items-center space-y-4 pt-1 animate-fade-in">
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
