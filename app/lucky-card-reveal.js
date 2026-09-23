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
const FINAL_HIT_DISSIPATE = 5.2; // Final flip + molten runoff (1.8s flip sequence + 3.4s dissipation)

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


  const clamp01 = (value) => Math.min(1, Math.max(0, value));
  const smoothstep = (edge0, edge1, value) => {
    const t = clamp01((value - edge0) / (edge1 - edge0));
    return t * t * (3 - 2 * t);
  };

  // Post-flip material should read as viscous molten plasma physically draining from
  // the card: attached to edges, stretched by gravity, then broken into embers.
  const drawMoltenBurnout = (ctx, metrics, hitColor, tier, t, material) => {
    if (!ctx || !material) return;

    const { cx, cy, w: cardW, h: cardH } = metrics;
    const halfW = cardW / 2;
    const halfH = cardH / 2;
    const runoffFade = 1 - smoothstep(0.58, 1, t);
    const earlyCling = 1 - smoothstep(0.0, 0.7, t);
    const edgeX = cardW * 0.47;
    const bottomY = cy + halfH - 2;

    const hotColor = tier === 'premium'
      ? '245, 248, 255'
      : tier === 'flagship'
        ? '255, 238, 170'
        : '255, 226, 185';

    const drawLiquidPath = (points, width, alpha) => {
      if (points.length < 2 || alpha <= 0) return;

      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      for (let i = 1; i < points.length; i += 1) {
        const prev = points[i - 1];
        const point = points[i];
        const midX = (prev.x + point.x) / 2;
        const midY = (prev.y + point.y) / 2;
        ctx.quadraticCurveTo(prev.x, prev.y, midX, midY);
      }
      const last = points[points.length - 1];
      const prev = points[points.length - 2];
      ctx.quadraticCurveTo(prev.x, prev.y, last.x, last.y);

      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      ctx.lineWidth = width * 3.2;
      ctx.strokeStyle = `rgba(${hitColor}, ${alpha * 0.28})`;
      ctx.stroke();

      ctx.lineWidth = width * 1.65;
      ctx.strokeStyle = `rgba(${hitColor}, ${alpha * 0.92})`;
      ctx.stroke();

      ctx.lineWidth = Math.max(1, width * 0.42);
      ctx.strokeStyle = `rgba(${hotColor}, ${alpha * 0.88})`;
      ctx.stroke();
    };

    // Molten material pools along the lower rim before gravity pulls it over the edge.
    material.pools.forEach((pool) => {
      const poolAlpha = runoffFade * (0.42 + earlyCling * 0.5);
      if (poolAlpha <= 0) return;

      const x = cx + pool.u * halfW;
      const y = bottomY - pool.lift * (0.35 + earlyCling * 0.65);
      const width = pool.width * (0.8 + earlyCling * 0.55);
      const height = pool.height * (0.75 + earlyCling * 0.65);

      ctx.beginPath();
      ctx.moveTo(x - width, y);
      ctx.quadraticCurveTo(x - width * 0.72, y - height, x, y - height * 0.35);
      ctx.quadraticCurveTo(x + width * 0.72, y - height * 0.9, x + width, y);
      ctx.quadraticCurveTo(x + width * 0.45, y + height * 0.48, x, y + height * 0.24);
      ctx.quadraticCurveTo(x - width * 0.55, y + height * 0.52, x - width, y);
      ctx.closePath();

      ctx.fillStyle = `rgba(${hitColor}, ${poolAlpha * 0.58})`;
      ctx.fill();

      ctx.strokeStyle = `rgba(${hotColor}, ${poolAlpha * 0.62})`;
      ctx.lineWidth = Math.max(1.2, pool.width * 0.17);
      ctx.stroke();
    });

    // Localized edge runoff. There is deliberately no closed perimeter path.
    material.drips.forEach((drip) => {
      const phase = clamp01((t - drip.delay) / drip.duration);
      if (phase <= 0) return;

      const travel = phase * phase * (3 - 2 * phase);
      let startX;
      let startY;
      let directionX = 0;

      if (drip.edge === 'left') {
        startX = cx - edgeX + drip.offset;
        startY = cy + drip.start * halfH;
        directionX = -1;
      } else if (drip.edge === 'right') {
        startX = cx + edgeX + drip.offset;
        startY = cy + drip.start * halfH;
        directionX = 1;
      } else {
        startX = cx + drip.start * halfW;
        startY = bottomY + drip.offset;
      }

      const length = drip.length * travel;
      const sway = Math.sin(phase * Math.PI * 1.15 + drip.phase) * drip.sway * travel;
      const endX = startX + (drip.edge === 'bottom' ? sway : directionX * (Math.abs(drip.sway) * 0.45 + Math.abs(sway)));
      const endY = startY + length;

      const points = [
        { x: startX, y: startY },
        {
          x: startX + (drip.edge === 'bottom' ? sway * 0.25 : directionX * 1.5),
          y: startY + length * 0.28
        },
        {
          x: startX + (drip.edge === 'bottom' ? sway * 0.65 : directionX * drip.sway * 0.45),
          y: startY + length * 0.68
        },
        { x: endX, y: endY }
      ];

      const localFade = runoffFade * (0.7 + 0.3 * (1 - phase * 0.15));
      drawLiquidPath(points, drip.width * (1 - phase * 0.22), localFade);

      // Rounded molten bulb at the falling end.
      const bulbRadius = drip.width * (1.15 + 1.4 * Math.sin(Math.min(1, phase) * Math.PI));
      if (bulbRadius > 0.5) {
        ctx.beginPath();
        ctx.arc(endX, endY, bulbRadius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${hitColor}, ${localFade * 0.7})`;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(endX, endY - bulbRadius * 0.15, Math.max(0.8, bulbRadius * 0.42), 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${hotColor}, ${localFade * 0.82})`;
        ctx.fill();
      }

      // A few drips detach late, falling below the card before cooling away.
      if (phase > 0.72 && drip.detach) {
        const detachT = clamp01((phase - 0.72) / 0.28);
        const detachedY = endY + drip.detachDistance * detachT * detachT;
        const detachedX = endX + drip.detachSway * Math.sin(detachT * Math.PI);
        const detachedAlpha = localFade * (1 - detachT) * 0.9;
        const detachedRadius = Math.max(0.8, drip.width * (0.9 - detachT * 0.45));

        ctx.beginPath();
        ctx.arc(detachedX, detachedY, detachedRadius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${hotColor}, ${detachedAlpha})`;
        ctx.fill();
      }
    });

    // Sparks and embers originate from the runoff instead of orbiting the card.
    material.sparks.forEach((spark) => {
      const sparkT = clamp01((t - spark.delay) / spark.duration);
      if (sparkT <= 0 || sparkT >= 1) return;

      const gravity = spark.gravity * sparkT * sparkT;
      const drift = Math.sin(sparkT * Math.PI * 1.6 + spark.phase) * spark.drift;
      const x = spark.x + spark.vx * sparkT + drift;
      const y = spark.y + spark.vy * sparkT + gravity;
      const alpha = runoffFade * (1 - sparkT) * (0.55 + spark.brightness * 0.45);

      if (alpha <= 0) return;

      const tailX = x - spark.vx * 0.055;
      const tailY = y - (spark.vy + spark.gravity * sparkT * 0.35) * 0.055;

      ctx.beginPath();
      ctx.moveTo(tailX, tailY);
      ctx.lineTo(x, y);
      ctx.lineWidth = spark.size;
      ctx.lineCap = 'round';
      ctx.strokeStyle = `rgba(${hotColor}, ${alpha})`;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(x, y, spark.size * 0.68, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${hitColor}, ${alpha * 0.8})`;
      ctx.fill();
    });

    // Late cooling embers are sparse, small, and drift away from the card rather than expanding in a ring.
    material.embers.forEach((ember) => {
      const emberT = clamp01((t - ember.delay) / ember.duration);
      if (emberT <= 0 || emberT >= 1) return;

      const drift = Math.sin(emberT * Math.PI * 2 + ember.phase) * ember.sway;
      const x = ember.x + ember.vx * emberT + drift;
      const y = ember.y + ember.vy * emberT + ember.gravity * emberT * emberT;
      const alpha = runoffFade * (1 - emberT) * 0.7;

      ctx.beginPath();
      ctx.arc(x, y, ember.size * (1 - emberT * 0.45), 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${hotColor}, ${alpha})`;
      ctx.fill();
    });
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
      standard: '212, 136, 70', // Warm Bronze/Gold
      premium: '180, 185, 195', // Pewter/Silver
      flagship: '218, 165, 32', // Rich Gold/Antique-Gold
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
        const F_AFTERGLOW_START = F_FLIP_TIME + 1.2; // Ignition point after the flip finishes

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

           // AFTERGLOW / MOLTEN RUNOFF
           // The post-flip effect stays attached to the lower card edges and
           // drains downward under gravity before cooling into sparks/embers.
           const afterglowTime = hitLocalTime - F_AFTERGLOW_START;
           const dissipateDuration = FINAL_HIT_DISSIPATE - F_AFTERGLOW_START;
           if (afterglowTime < dissipateDuration) {
             const t = clamp01(afterglowTime / dissipateDuration);

             const availableCtxs = [fgCtx, bgCtx].filter(Boolean);
             availableCtxs.forEach((ctx) => {
               drawMoltenBurnout(
                 ctx,
                 cardMetricsRef.current,
                 hitColor,
                 tier,
                 t,
                 particlesRef.current
               );
             });
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
    particlesRef.current = {
      pools: Array.from({ length: 5 }, () => ({
        u: -0.76 + Math.random() * 1.52,
        lift: 1 + Math.random() * 3,
        width: 10 + Math.random() * 13,
        height: 4 + Math.random() * 8,
      })),
      drips: Array.from({ length: 11 }, (_, index) => {
        const edge = index < 3 ? 'left' : index < 6 ? 'right' : 'bottom';
        return {
          edge,
          start: edge === 'bottom' ? -0.84 + Math.random() * 1.68 : -0.32 + Math.random() * 0.62,
          offset: (Math.random() - 0.5) * 4,
          length: edge === 'bottom'
            ? 18 + Math.random() * 82
            : 24 + Math.random() * 96,
          width: 2.2 + Math.random() * 4.6,
          sway: edge === 'bottom'
            ? 4 + Math.random() * 14
            : 4 + Math.random() * 11,
          phase: Math.random() * Math.PI * 2,
          delay: Math.random() * 0.12,
          duration: 0.8 + Math.random() * 1.55,
          detach: Math.random() > 0.28,
          detachDistance: 12 + Math.random() * 38,
          detachSway: (Math.random() - 0.5) * 22,
        };
      }),
      sparks: Array.from({ length: 24 }, () => {
        const fromBottom = Math.random() > 0.35;
        const side = Math.random() > 0.5 ? -1 : 1;
        return {
          x: cx + (fromBottom ? (-0.44 + Math.random() * 0.88) * cardW * 0.5 : side * cardW * 0.47),
          y: fromBottom
            ? cy + cardH * 0.5 - Math.random() * 12
            : cy + (0.05 + Math.random() * 0.5) * cardH - cardH * 0.5,
          vx: (Math.random() - 0.5) * 28,
          vy: 8 + Math.random() * 42,
          gravity: 22 + Math.random() * 34,
          drift: 4 + Math.random() * 13,
          phase: Math.random() * Math.PI * 2,
          delay: 0.05 + Math.random() * 0.95,
          duration: 0.75 + Math.random() * 1.35,
          size: 1 + Math.random() * 1.65,
          brightness: Math.random(),
        };
      }),
      embers: Array.from({ length: 12 }, () => ({
        x: cx + (-0.46 + Math.random() * 0.92) * cardW * 0.5,
        y: cy + cardH * 0.42 + Math.random() * 18,
        vx: (Math.random() - 0.5) * 42,
        vy: 4 + Math.random() * 22,
        gravity: 8 + Math.random() * 16,
        sway: 6 + Math.random() * 15,
        phase: Math.random() * Math.PI * 2,
        delay: 0.55 + Math.random() * 1.05,
        duration: 0.9 + Math.random() * 1.5,
        size: 1.1 + Math.random() * 1.3,
      })),
    };

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
                className={`absolute inset-0 rounded-2xl transition-shadow duration-700`}
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
