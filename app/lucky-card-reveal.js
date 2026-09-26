'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import CollectionBinder from './collection-binder';
import { Howl } from 'howler';
import { motion, useAnimate, useReducedMotion } from 'framer-motion';
import { LUCKY_CARDS, selectWeightedLuckyCard, selectRandomQuote } from './lucky-card-data';
import LuckyCardShare from './lucky-card-share';
import { playButtonClick } from './lib/audio';
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
// Hit-to-contact timing offset used for audio and visual synchronization.
// This value represents the time from hit start to the actual contact/wrap moment.
const HIT_CONTACT_OFFSET = 0.4;

// Final-hit timing is split so the post-flip material gets a full 4.2s to
// travel, drip, spark, smolder, and cleanly extinguish after the 1.8s flip.
const FINAL_FLIP_TIME = 0.6;
const FINAL_FLIP_DURATION = 1.2;
const FINAL_FLIP_END = FINAL_FLIP_TIME + FINAL_FLIP_DURATION;
const POST_FLIP_DISSIPATION = 4.2;
const FINAL_HIT_DISSIPATE = FINAL_FLIP_END + POST_FLIP_DISSIPATION;

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
  const isGeneratingRef = useRef(false);
  const audioTransactionIdRef = useRef(0);
  const activeTimeoutsRef = useRef([]);
  const isMountedRef = useRef(true);
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

  const audioRefs = useRef({
    beamApproach: null,
    beamEnergy: null,
    beamImpact: null,
    finalLockOn: null,
    finalDischarge: null,
    revealSnap: null,
    electricalArc: null
  });
  const audioTimersRef = useRef([]);

  const audioCtxRef = useRef(null);
  const audioBuffersRef = useRef({});
  const rawAudioDataRef = useRef({});
  const webAudioNodesRef = useRef([]);
  const webAudioOriginRef = useRef(0);
  const standardAudioPreloadRef = useRef(null);

  useEffect(() => {
    const audioSources = {
      beamApproach: '/sounds/mixkit-cinematic-whoosh.mp3',
      beamEnergy: '/sounds/beam_energy.mp3',
      beamImpact: '/sounds/beam_impact.mp3',
      finalLockOn: '/sounds/final_lock_on.mp3',
      finalDischarge: '/sounds/final_discharge.mp3',
      revealSnap: '/sounds/reveal_snap.mp3',
      electricalArc: '/sounds/electrical_arc.mp3'
    };

    standardAudioPreloadRef.current = Promise.all(
      Object.entries(audioSources).map(async ([key, url]) => {
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status} while loading ${url}`);
        }
        const arrayBuffer = await response.arrayBuffer();
        rawAudioDataRef.current[key] = arrayBuffer;
      })
    )
      .then(() => true)
      .catch(err => {
        console.error('Standard reveal audio preload failed:', err);
        return false;
      });

    return () => {
      standardAudioPreloadRef.current = null;
    };
  }, []);


  // Pre-load only the authored reveal cues that fit the measured timing windows.
  // Howler play() returns a unique sound id for each one-shot, so repeated hits can
  // overlap safely without introducing a persistent reveal-owned audio bed.
  useEffect(() => {
    audioRefs.current.beamApproach = new Howl({
      src: ['/sounds/mixkit-cinematic-whoosh.mp3'], // 4.885s source; short approach layer
      volume: 0.42,
      preload: true
    });
    audioRefs.current.beamEnergy = new Howl({
      src: ['/sounds/beam_energy.mp3'], // 0.261s source; short energy texture for Standard only
      volume: 0.2,
      preload: true
    });
    audioRefs.current.beamImpact = new Howl({
      src: ['/sounds/beam_impact.mp3'], // 1.620s source; physical strike cue
      volume: 0.8,
      preload: true
    });
    audioRefs.current.finalLockOn = new Howl({
      src: ['/sounds/final_lock_on.mp3'], // 1.176s source; final lock buildup
      volume: 0.86,
      preload: true
    });
    audioRefs.current.finalDischarge = new Howl({
      src: ['/sounds/final_discharge.mp3'], // 7.706s source; hard-limited to flip/throw
      volume: 0.9,
      preload: true
    });
    audioRefs.current.revealSnap = new Howl({
      src: ['/sounds/reveal_snap.mp3'], // 4.049s source; hard-limited to the reveal snap
      volume: 0.52,
      preload: true
    });
    audioRefs.current.electricalArc = new Howl({
      src: ['/sounds/electrical_arc.mp3'], // 2.247s source; post-flip residual energy
      volume: 0.28,
      preload: true
    });

    return () => {
      Object.values(audioRefs.current).forEach(sound => {
        if (sound) {
          sound.stop();
          sound.unload();
        }
      });
      audioTimersRef.current.forEach(clearTimeout);
      audioTimersRef.current = [];
    };
  }, []);


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

    audioTimersRef.current.forEach(clearTimeout);
    audioTimersRef.current = [];
    Object.values(audioRefs.current).forEach(sound => {
      if (sound) sound.stop();
    });

    webAudioNodesRef.current.forEach(({ source, gainNode }) => {
      try {
        // Cancel scheduled fades
        const ctx = audioCtxRef.current;
        const now = ctx ? ctx.currentTime : 0;
        gainNode.gain.cancelScheduledValues(now);
        gainNode.gain.setValueAtTime(0, now);
        source.stop();
      } catch (e) {}
    });
    webAudioNodesRef.current = [];

  }, []);

  useEffect(() => {
    return () => {
      isGeneratingRef.current = false;
      audioTransactionIdRef.current = -1;
      isMountedRef.current = false;
      stopAll();
    };
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

  // Post-flip material is a short physical event:
  // 1) a thick electric charge wraps the card edge,
  // 2) hot molten material snaps/pop-splashes from that charge,
  // 3) one or two attached bottom-edge drips finish the event.
  // Post-flip VFX is tier-driven, not card-driven.
  // Blue electricity is universal; the hot-metal material changes only by tier.
  // Two canvas passes create depth: rear energy shell + foreground molten/spark layer.
  const drawMoltenBurnout = (ctx, metrics, hitColor, tier, t, material, layer = 'front') => {
    if (!ctx || !material || t >= 1) return;

    const { cx, cy, w: cardW, h: cardH } = metrics;
    const halfW = cardW / 2;
    const halfH = cardH / 2;
    const tierRgb = tier === 'premium' ? '218, 224, 232' : tier === 'flagship' ? '238, 166, 50' : '201, 112, 52';
    const tierHot = tier === 'premium' ? '255, 255, 255' : tier === 'flagship' ? '255, 244, 194' : '255, 226, 184';
    const tierDeep = tier === 'premium' ? '62, 70, 82' : tier === 'flagship' ? '104, 54, 8' : '96, 40, 14';
    const electricRgb = '46, 166, 255';
    const electricHot = '226, 249, 255';
    const rgba = (rgb, alpha) => 'rgba(' + rgb + ', ' + Math.max(0, alpha) + ')';

    const fade = 1 - smoothstep(0.88, 1, t);
    const heat = 1 - smoothstep(0.62, 0.96, t);
    const pulse = 0.94 + Math.sin(t * 30 + material.seed) * 0.06;
    const energyFade = (1 - smoothstep(0.66, 0.92, t)) * fade;
    const shellAlpha = 0.82 * energyFade;
    const moltenAlpha = (0.96 - (1 - heat) * 0.36) * fade * pulse;
    const toPoint = (u, v, depth = 0) => ({ x: cx + (halfW + depth) * u, y: cy + (halfH + depth) * v });

    const strokeSmooth = (points, width, style, composite = 'source-over', shadow = 0) => {
      if (points.length < 2 || width <= 0) return;
      ctx.save();
      ctx.globalCompositeOperation = composite;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.lineWidth = width;
      ctx.strokeStyle = style;
      if (shadow > 0) { ctx.shadowBlur = shadow; ctx.shadowColor = style; }
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      for (let i = 1; i < points.length; i += 1) {
        const prev = points[i - 1];
        const point = points[i];
        const mx = (prev.x + point.x) / 2;
        const my = (prev.y + point.y) / 2;
        ctx.quadraticCurveTo(prev.x, prev.y, mx, my);
      }
      const last = points[points.length - 1];
      const prev = points[points.length - 2];
      ctx.quadraticCurveTo(prev.x, prev.y, last.x, last.y);
      ctx.stroke();
      ctx.restore();
    };


    const drawEnergyArc = (arc, strength) => {
      const rawProgress = (t - arc.delay) / Math.max(0.001, arc.duration);
      if (rawProgress <= 0 || rawProgress > 1.08) return;
      const progress = clamp01(rawProgress);
      const reveal = smoothstep(0, 0.84, progress);

      const segs = Math.max(4, Math.ceil(18 * reveal)); // More segments for smoother organic curves

      const generatePoints = (offsetX, offsetY, noiseMult, phaseOffset, zScaleMult) => {
        const points = [];
        for (let i = 0; i <= segs; i += 1) {
          const q = reveal * (i / segs);
          const baseU = arc.startU + (arc.endU - arc.startU) * q;
          const baseV = arc.startV + (arc.endV - arc.startV) * q;
          const envelope = Math.sin(Math.PI * q); // Tapers at ends
          const curve = Math.sin(Math.PI * q) * arc.curve;

          // Organic, turbulent noise rather than simple sine
          const tNoise1 = Math.sin(i * 1.8 + material.seed + t * 80 + arc.phase + phaseOffset);
          const tNoise2 = Math.cos(i * 3.4 - t * 120 + arc.phase * 1.5);
          const noise = (tNoise1 * 0.7 + tNoise2 * 0.3) * arc.jag * envelope * noiseMult;

          // 3D Blow out effect: Arcs push outward and slightly rotate
          const zBlow = smoothstep(0.3, 1.0, progress) * (arc.behind ? -0.3 : 0.45) * envelope * zScaleMult;
          const projScale = Math.max(0.4, 1.0 + zBlow);

          // Add parallax drift based on z depth to really sell 3D
          const parallaxX = (arc.behind ? -1 : 1) * zBlow * 15 * (1 - envelope);
          const parallaxY = zBlow * 10;

          points.push({
            x: cx + (halfW * baseU + arc.curveN * curve + arc.nx * noise) * projScale + offsetX + parallaxX,
            y: cy + (halfH * baseV + arc.curveT * curve + arc.ny * noise) * projScale + offsetY + parallaxY,
            z: zBlow
          });
        }
        return points;
      };

      const points = generatePoints(0, 0, 1.0, 0, 1.0);

      const fadeIn = smoothstep(0.02, 0.16, progress);
      const fadeOut = 1 - smoothstep(0.64, 1, progress); // Faster fadeout for snap
      const flicker = 0.85 + 0.15 * Math.sin(t * 180 + arc.phase * 3);
      const a = strength * fadeIn * fadeOut * flicker;
      const width = arc.width * (0.8 + 0.2 * Math.sin(t * 60 + arc.phase));

      if (a <= 0.01) return;

      // Draw secondary tendrils branching off main arc for "plasma" look
      if (width > 3 && reveal > 0.4) {
        const tendrilPoints1 = generatePoints(arc.nx * 6, arc.ny * 6, 1.5, 2.0, 0.8);
        const tendrilPoints2 = generatePoints(-arc.nx * 4, -arc.ny * 4, 1.8, 4.0, 1.1);
        strokeSmooth(tendrilPoints1, width * 0.4, rgba(electricRgb, a * 0.5), 'screen', 2);
        strokeSmooth(tendrilPoints2, width * 0.25, rgba(electricHot, a * 0.6), 'screen', 1);
      }

      // Draw the main volumetric plasma arc
      // Broad ambient glow
      strokeSmooth(points, width * 4.2, rgba(electricRgb, a * 0.12), 'screen', width * 2.5);
      // Outer shell
      strokeSmooth(points, width * 2.2, rgba(electricRgb, a * 0.6), 'screen', width * 1.2);
      // Mid hot core
      strokeSmooth(points, width * 0.9, rgba(electricHot, a * 0.9), 'screen', width * 0.5);
      // Intense white center line (very thin)
      strokeSmooth(points, Math.max(0.8, width * 0.25), rgba('255,255,255', a), 'source-over', 0);

      const headIndex = Math.min(points.length - 1, Math.floor(reveal * (points.length - 1)));
      if (headIndex >= 0 && points[headIndex]) {
        const head = points[headIndex];
        ctx.save();
        ctx.globalCompositeOperation = 'screen';

        // Ensure gradient rect bounds are strictly defined to avoid full screen fill (Optimization rule)
        const rad = width * 6.5;
        const flash = ctx.createRadialGradient(head.x, head.y, 0, head.x, head.y, rad);
        flash.addColorStop(0, rgba('255, 255, 255', a * 0.95));
        flash.addColorStop(0.15, rgba(electricHot, a * 0.7));
        flash.addColorStop(0.4, rgba(electricRgb, a * 0.25));
        flash.addColorStop(1, rgba(electricRgb, 0));

        ctx.fillStyle = flash;
        ctx.fillRect(head.x - rad, head.y - rad, rad * 2, rad * 2);
        ctx.restore();
      }
    };



    const drawMoltenBurst = (burst) => {
      const p = smoothstep(burst.delay, burst.delay + burst.duration, t);
      if (p <= 0 || p >= 1) return;

      const x = cx + halfW * burst.u;
      const y = cy + halfH * burst.v;

      // 3D pop effect for bursts (coming outward)
      const popScale = 1.0 + Math.sin(p * Math.PI) * 0.4;

      const rad = burst.radius * Math.sin(p * Math.PI) * popScale;
      const a = moltenAlpha * burst.opacity * (1 - p) * (0.8 + 0.2 * Math.sin(t * 50 + burst.phase));
      if (a <= 0.01) return;

      ctx.save();
      ctx.globalCompositeOperation = 'screen';

      // Keep rect localized
      const gRad = rad * 2.8;
      const grad = ctx.createRadialGradient(x, y, 0, x, y, gRad);
      grad.addColorStop(0, rgba(tierHot, a * 0.95));
      grad.addColorStop(0.2, rgba(tierRgb, a * 0.7));
      grad.addColorStop(1, rgba(tierRgb, 0));

      ctx.fillStyle = grad;
      ctx.fillRect(x - gRad, y - gRad, gRad * 2, gRad * 2);
      ctx.restore();
    };
    const drawDroplet = (drop, splatter = false) => {
      const p = smoothstep(drop.delay, drop.delay + drop.duration, t);
      if (p <= 0) return;
      const vanish = 1 - smoothstep(0.8, 1, p);

      // 3D Projection: Splatter moves along Z axis, affecting scale and XY offset
      // Z increases as p increases, creating a 3D blowing away effect
      const zMotion = p * drop.outwardZ;
      const z = Math.max(0.1, 0.72 + drop.depth * 0.55 + zMotion);
      const projScale = splatter ? (1.5 / z) : 1;

      const x = cx + (drop.x - cx) * projScale + drop.vx * p * (1/z);
      const y = cy + (drop.y - cy) * projScale + drop.vy * p * (1/z) + drop.gravity * p * p * (1/z);

      const size = Math.max(0.1, drop.size * (0.72 + z * 0.56) * projScale);
      const alpha = moltenAlpha * drop.brightness * vanish;
      ctx.save(); ctx.globalCompositeOperation = 'screen';
      ctx.beginPath();
      ctx.ellipse(x, y, size * (splatter ? 1.7 : 1.05), size * (splatter ? 0.62 : 1.8), Math.atan2(drop.vy, drop.vx), 0, Math.PI * 2);
      ctx.fillStyle = rgba(tierHot, alpha * 0.92); ctx.shadowBlur = splatter ? 7 : 5; ctx.shadowColor = rgba(tierRgb, alpha); ctx.fill();
      ctx.beginPath(); ctx.arc(x, y, Math.max(0.8, size * 0.55), 0, Math.PI * 2); ctx.fillStyle = rgba(tierRgb, alpha * 0.9); ctx.fill();
      ctx.restore();
    };

    if (layer === 'behind') {
      material.energyArcs.filter((arc) => arc.behind).forEach((arc) => drawEnergyArc(arc, shellAlpha));
      material.backPools.forEach((pool) => {
        const p = smoothstep(pool.delay, pool.delay + pool.duration, t); if (p <= 0) return;

        // 3D Projection: Push background pools slightly deeper over time
        const zPush = p * 0.15;
        const projScale = 1.0 - zPush;

        const alpha = shellAlpha * pool.opacity;
        const x = cx + (halfW * pool.u) * projScale;
        const y = cy + (halfH * pool.v) * projScale;
        const r = pool.radius * (0.7 + 0.3 * Math.sin(t * 8 + pool.phase)) * projScale;

        ctx.save(); ctx.globalCompositeOperation = 'screen';
        const g = ctx.createRadialGradient(x, y, 0, x, y, r * 4); g.addColorStop(0, rgba(electricHot, alpha * 0.45)); g.addColorStop(0.2, rgba(electricRgb, alpha * 0.34)); g.addColorStop(1, rgba(electricRgb, 0));
        ctx.beginPath(); ctx.arc(x, y, r * 4, 0, Math.PI * 2); ctx.fillStyle = g; ctx.fill(); ctx.restore();
      });
      material.splatter.filter((drop) => drop.behind).forEach((drop) => drawDroplet(drop, true));
      return;
    }

    material.energyArcs.filter((arc) => !arc.behind).forEach((arc) => drawEnergyArc(arc, 0.96 * energyFade));

    material.surfaceFilaments.forEach((filament) => {
      const p = smoothstep(filament.delay, filament.delay + filament.duration, t); if (p <= 0) return;
      const points = [];
      const segs = 14;
      for (let i = 0; i <= segs; i += 1) {
        const q = i / segs;
        const x = cx + halfW * (filament.startU + (filament.endU - filament.startU) * q);
        const y = cy + halfH * (filament.startV + (filament.endV - filament.startV) * q);

        // Multi-layered noise for crackling surface electricity
        const n1 = Math.sin(q * 16 + filament.phase + t * 90);
        const n2 = Math.cos(q * 28 - t * 140 + filament.phase * 2.1);
        const jitter = (n1 * 0.6 + n2 * 0.4) * filament.jag * Math.sin(Math.PI * q);

        // Push outward from card surface based on jitter intensity
        const zPush = Math.abs(jitter) * 0.15 + 1.0;

        points.push({
          x: cx + ((x - cx) + filament.nx * jitter) * zPush,
          y: cy + ((y - cy) + filament.ny * jitter) * zPush
        });
      }
      const a = energyFade * filament.opacity * (0.8 + 0.2 * Math.sin(t * 200 + filament.phase));
      if (a <= 0.01) return;

      strokeSmooth(points, filament.width * 3.5, rgba(electricRgb, a * 0.15), 'screen', 6);
      strokeSmooth(points, filament.width * 1.5, rgba(electricRgb, a * 0.7), 'screen', 3);
      strokeSmooth(points, Math.max(0.6, filament.width * 0.3), rgba('255,255,255', a * 0.9), 'screen', 1);
    });
    
    material.bursts.forEach(drawMoltenBurst);
    material.splatter.filter((drop) => !drop.behind).forEach((drop) => drawDroplet(drop, true));


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
              // Match card settle: y: -5, duration: 0.8s, easeInOut
              const settleT = Math.min(1, (hitLocalTime - (F_FLIP_TIME + 0.4)) / 0.8);
              // easeInOut (smoothstep)
              const easeInOut = settleT * settleT * (3 - 2 * settleT);
              // Settle from y: -60 to y: -5
              trackingY = (cy - 60) + (55 * easeInOut);
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
             // Create a natural easing for the dissipation so it collapses gracefully
             const linearT = clamp01(afterglowTime / dissipateDuration);
             const t = linearT * linearT * (3 - 2 * linearT); // smoothstep ease-in-out
             if (bgCtx) {
               drawMoltenBurnout(bgCtx, cardMetricsRef.current, hitColor, tier, t, particlesRef.current, 'behind');
             }
             if (fgCtx) {
               drawMoltenBurnout(fgCtx, cardMetricsRef.current, hitColor, tier, t, particlesRef.current, 'front');
             }
           }

        }
      }
    }

    bgCtx.restore();
    if (fgCtx) fgCtx.restore();

    // Trigger executeRevealState exactly at the end of the lock/flip moment
    if (elapsed >= finalHitStartTime + FINAL_FLIP_END && !isRevealedRef.current) {
        executeRevealState();
    }

    if (elapsed < maxLifetime) {
      rafRef.current = requestAnimationFrame(renderCanvas);
    } else {
      fallbackTimerRef.current = setTimeout(() => {
        isGeneratingRef.current = false;
        setIsGenerating(false);
      }, 100);
    }
  };

  const triggerCardDraw = async () => {
    if (isGeneratingRef.current || isGenerating) return;
    isGeneratingRef.current = true;
    const currentTransactionId = ++audioTransactionIdRef.current;

    stopAll();
    playButtonClick();

    const card = selectWeightedLuckyCard(previousCardId);
    activeTierRef.current = card.tier;
    activeCardRef.current = card;
    card.quote = selectRandomQuote(previousQuote);
    isRevealedRef.current = false;

    setSelectedCard(card);
    setIsRevealed(false);
    setIsGenerating(true);
    setImageError(false);

    let standardWebAudioReady = false;

    if (card.tier === 'standard') {
      const AudioContextCtor = window.AudioContext || window.webkitAudioContext;

      if (AudioContextCtor) {
        try {
          if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') {
            audioCtxRef.current = new AudioContextCtor();
          }

          const ctx = audioCtxRef.current;

          // Resume immediately from the user gesture before any asynchronous preload/decode wait.
          if (ctx.state === 'suspended' || ctx.state === 'interrupted') {
            await ctx.resume();
          }

          // Check if component is still mounted and operation is still current
          if (!isMountedRef.current || audioTransactionIdRef.current !== currentTransactionId) {
            standardWebAudioReady = false;
            return;
          }

          const preloadPromise = standardAudioPreloadRef.current;
          const preloadSucceeded = preloadPromise ? await preloadPromise : false;

          if (preloadSucceeded) {
            const requiredKeys = [
              'beamApproach',
              'beamEnergy',
              'beamImpact',
              'finalLockOn',
              'finalDischarge',
              'revealSnap',
              'electricalArc'
            ];

            await Promise.all(
              requiredKeys.map(async key => {
                if (!audioBuffersRef.current[key]) {
                  const arrayBuffer = rawAudioDataRef.current[key];
                  if (!arrayBuffer) {
                    throw new Error(`Missing preloaded audio data for ${key}`);
                  }

                  const clonedBuffer = arrayBuffer.slice(0);
                  audioBuffersRef.current[key] = await ctx.decodeAudioData(clonedBuffer);
                }
              })
            );

            standardWebAudioReady =
            // Check if component is still mounted and operation is still current after decode
            if (!isMountedRef.current || audioTransactionIdRef.current !== currentTransactionId) {
              standardWebAudioReady = false;
              return;
            }

              requiredKeys.every(key => Boolean(audioBuffersRef.current[key])) &&
              ctx.state === 'running';
          }

          if (standardWebAudioReady) {
            // Ensure this initialization wasn't superseded by another click
            if (audioTransactionIdRef.current === currentTransactionId) {
            // Also check if component is still mounted
            if (isMountedRef.current && audioTransactionIdRef.current === currentTransactionId) {
            } else {
              standardWebAudioReady = false;
            }
          }
        } catch (err) {
          standardWebAudioReady = false;
          console.error('Web Audio initialization failed; using Howler fallback:', err);
        }
      } else {
        console.warn('Web Audio API is unavailable; using Howler fallback for Standard reveal audio.');
      }
    }

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


    const { cx, cy, w: cardW, h: cardH } = cardMetricsRef.current;
    particlesRef.current = {
      seed: Math.random() * Math.PI * 2,
      rimFlows: [
        { edge: 'top', start: -0.82, end: 0.62, spread: 0.022, wobble: 1.8, width: 5.8, opacity: 0.78, delay: 0.16, duration: 0.11, phase: 0.7 },
        { edge: 'right', start: -0.72, end: 0.86, spread: 0.018, wobble: 2.1, width: 5.4, opacity: 0.74, delay: 0.18, duration: 0.12, phase: 2.1 },
        { edge: 'bottom', start: -0.86, end: 0.84, spread: 0.026, wobble: 2.3, width: 6.6, opacity: 0.86, delay: 0.2, duration: 0.13, phase: 3.5 },
        { edge: 'left', start: 0.7, end: -0.7, spread: 0.018, wobble: 1.9, width: 5.2, opacity: 0.7, delay: 0.17, duration: 0.12, phase: 4.8 }
      ],
      pools: [
        { u: -0.58, v: 0.78, rx: 18, ry: 9, angle: -0.22, opacity: 0.72, delay: 0.18, duration: 0.22, phase: 0.7 },
        { u: 0.58, v: 0.78, rx: 19, ry: 10, angle: 0.24, opacity: 0.76, delay: 0.2, duration: 0.24, phase: 2.4 },
        { u: 0.0, v: 0.94, rx: 24, ry: 8, angle: 0, opacity: 0.78, delay: 0.22, duration: 0.22, phase: 4.1 }
      ],
      bursts: [
        { u: -0.72, v: -0.88, radius: 13, opacity: 0.9, delay: 0.18, duration: 0.17, angle: -0.45, phase: 0.2 },
        { u: 0.68, v: -0.72, radius: 14, opacity: 0.88, delay: 0.2, duration: 0.18, angle: 0.36, phase: 1.7 },
        { u: -0.82, v: 0.44, radius: 12, opacity: 0.82, delay: 0.22, duration: 0.18, angle: -0.62, phase: 3.0 },
        { u: 0.8, v: 0.5, radius: 13, opacity: 0.86, delay: 0.24, duration: 0.18, angle: 0.48, phase: 4.4 }
      ],
      backPools: Array.from({ length: 7 }, (_, index) => ({
        u: -0.86 + Math.random() * 1.72, v: -0.92 + Math.random() * 1.84, radius: 12 + Math.random() * 18,
        opacity: 0.55 + Math.random() * 0.28, delay: 0.02 + Math.random() * 0.16, duration: 0.3 + Math.random() * 0.25, phase: index * 1.7 + Math.random() * 0.8
      })),
      energyArcs: [
        { startU: -1.03, startV: -0.98, endU: 0.96, endV: -0.98, nx: 0, ny: 1, curveN: 0, curveT: 0, curve: 0, jag: 4.5, width: 5.8, delay: 0.015, duration: 0.13, phase: 0.2, behind: true },
        { startU: 0.98, startV: -1.02, endU: 0.98, endV: 0.96, nx: 1, ny: 0, curveN: 1, curveT: 0, curve: 0, jag: 4.8, width: 5.5, delay: 0.04, duration: 0.14, phase: 1.4, behind: false },
        { startU: 1.02, startV: 0.98, endU: -0.96, endV: 0.98, nx: 0, ny: 1, curveN: 0, curveT: 0, curve: 0, jag: 4.2, width: 6.2, delay: 0.075, duration: 0.15, phase: 2.8, behind: true },
        { startU: -0.98, startV: 1.02, endU: -0.98, endV: -0.9, nx: 1, ny: 0, curveN: 1, curveT: 0, curve: 0, jag: 4.5, width: 5.6, delay: 0.1, duration: 0.14, phase: 4.1, behind: false },
        { startU: -0.98, startV: -0.66, endU: -0.38, endV: -0.2, nx: 0.62, ny: -0.78, curveN: 0, curveT: 0, curve: 0, jag: 6.2, width: 4.2, delay: 0.17, duration: 0.08, phase: 0.9, behind: false },
        { startU: 0.96, startV: -0.44, endU: 0.42, endV: 0.18, nx: -0.75, ny: -0.66, curveN: 0, curveT: 0, curve: 0, jag: 6.1, width: 4.1, delay: 0.2, duration: 0.08, phase: 2.4, behind: false },
        { startU: -0.86, startV: 0.48, endU: -0.26, endV: 0.72, nx: -0.37, ny: 0.93, curveN: 0, curveT: 0, curve: 0, jag: 5.8, width: 3.8, delay: 0.23, duration: 0.07, phase: 3.9, behind: true },
        { startU: 0.82, startV: 0.52, endU: 0.22, endV: 0.72, nx: -0.32, ny: -0.95, curveN: 0, curveT: 0, curve: 0, jag: 5.8, width: 3.8, delay: 0.25, duration: 0.07, phase: 5.1, behind: false }
      ],
      surfaceFilaments: Array.from({ length: 5 }, (_, index) => {
        const starts = [-0.72,-0.36,0.02,0.34,0.66];
        const startU = starts[index] + (Math.random()-0.5)*0.06;
        const endU = startU + (Math.random()-0.5)*0.18;
        const startV = -0.64 + Math.random()*0.92;
        const endV = startV + 0.26 + Math.random()*0.48;
        const dx=endU-startU; const dy=endV-startV; const len=Math.max(0.001,Math.hypot(dx,dy));
        return { startU,startV,endU,endV,nx:-dy/len,ny:dx/len,jag:2.2+Math.random()*2.2,width:1.3+Math.random()*0.8,opacity:0.52+Math.random()*0.24,delay:0.19+Math.random()*0.14,duration:0.08+Math.random()*0.1,phase:Math.random()*Math.PI*2 };
      }),
      drips: [
        { u: -0.62, v: 0.98, length: 34, sway: -7, width: 5.4, opacity: 0.92, delay: 0.34, duration: 0.34, phase: 0.7 },
        { u: 0.62, v: 0.98, length: 42, sway: 8, width: 5.8, opacity: 0.94, delay: 0.37, duration: 0.38, phase: 2.8 }
      ],
      splatter: Array.from({ length: 22 }, (_, index) => {
        const anchors = [[-0.72,-0.88],[0.68,-0.72],[-0.82,0.44],[0.8,0.5]];
        const [au,av] = anchors[index % anchors.length];
        const angle = Math.random() * Math.PI * 2;
        const radius = cardW * (0.015 + Math.random() * 0.05);
        const startX = cx + au * (cardW / 2) + Math.cos(angle) * radius;
        const startY = cy + av * (cardH / 2) + Math.sin(angle) * radius * 0.75;
        const outward = 20 + Math.random() * 58;
        const foreground = index % 6 === 0;
        return {
          x:startX,
          y:startY,
          vx:Math.cos(angle)*outward+(Math.random()-0.5)*18,
          vy:Math.sin(angle)*outward*0.8-10+Math.random()*18,
          gravity:18+Math.random()*38,
          size:(foreground ? 2.4 : 1.1)+Math.random()*(foreground ? 2.1 : 2.4),
          depth:foreground ? 1.55 : 0.55+Math.random()*0.7,
          outwardZ: (foreground ? -1.2 : 0.8) * Math.random(), // Z-axis velocity
          brightness:0.42+Math.random()*0.5,
          delay:0.16+Math.random()*0.22,
          duration:0.14+Math.random()*0.26,
          behind:index%4===0
        };
      })
    };

    // --- NEW FRAMER MOTION CHOREOGRAPHY ---
    const sequence = [];
    const totalHits = TIER_HITS[card.tier] || 3;
    const finalHitStartTime = (totalHits - 1) * HIT_DURATION;

    // Initial prep
    sequence.push([cardRef.current, { y: 0, scale: 1.0, rotateZ: 0, opacity: 1, filter: "brightness(0.7)" }, { duration: 0 }]);
    sequence.push([cardFlipRef.current, { rotateY: 0 }, { duration: 0 }]);

    let currentTime = 0;

    // --- AUDIO CHOREOGRAPHY ---
    // Standard-tier audio is intentionally treated as a single physical/cinematic
    // sound event rather than a stack of isolated MP3 triggers.
    // Premium/Flagship retain the verified current choreography unchanged.
    audioTimersRef.current.forEach(clearTimeout);
    audioTimersRef.current = [];
    Object.values(audioRefs.current).forEach(sound => {
      if (sound) sound.stop();
    });

    webAudioNodesRef.current.forEach(({ source, gainNode }) => {
      try {
        // Cancel scheduled fades
        const ctx = audioCtxRef.current;
        const now = ctx ? ctx.currentTime : 0;
        gainNode.gain.cancelScheduledValues(now);
        gainNode.gain.setValueAtTime(0, now);
        source.stop();
      } catch (e) {}
    });
    webAudioNodesRef.current = [];


    const scheduleAudio = (callback, delayMs) => {
      const timerId = setTimeout(callback, Math.max(0, delayMs));
      audioTimersRef.current.push(timerId);
      return timerId;
    };

    const totalHitsForAudio = TIER_HITS[card.tier] || 3;
    const finalHitStartTimeForAudio = (totalHitsForAudio - 1) * HIT_DURATION;
    const finalFlipStartForAudio = finalHitStartTimeForAudio + FINAL_FLIP_TIME;
    const finalFlipEndForAudio = finalFlipStartForAudio + FINAL_FLIP_DURATION;

    if (card.tier === 'standard' && standardWebAudioReady) {
      const scheduleWebAudio = (bufferKey, delaySec, volume, fadeDurationSec = 0, seekOffsetSec = 0, durationSec = null) => {
        const ctx = audioCtxRef.current;
        const buffer = audioBuffersRef.current[bufferKey];
        if (!ctx || !buffer) return;

        const source = ctx.createBufferSource();
        source.buffer = buffer;

        const gainNode = ctx.createGain();
        gainNode.gain.value = 0; // Initialize at 0 to avoid any initial pop before the ramp starts

        source.connect(gainNode);
        gainNode.connect(ctx.destination);

        const startTime = webAudioOriginRef.current + delaySec;

        // Micro-fade in (attack ramp) to eliminate abrupt start transients
        const attackSec = 0.015;
        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(volume, startTime + attackSec);

        if (fadeDurationSec > 0 && durationSec !== null) {
          const fadeStartTime = startTime + durationSec - fadeDurationSec;
          // Hold the sustained volume until the fade starts
          gainNode.gain.setValueAtTime(volume, Math.max(startTime + attackSec, fadeStartTime));
          gainNode.gain.linearRampToValueAtTime(0.001, startTime + durationSec);
        }

        if (durationSec !== null) {
          source.start(startTime, seekOffsetSec, durationSec);
        } else {
          source.start(startTime, seekOffsetSec);
        }

        const nodeRecord = { source, gainNode };
        source.onended = () => {
          const nodes = webAudioNodesRef.current;
          const index = nodes.indexOf(nodeRecord);
          if (index !== -1) {
            nodes.splice(index, 1);
          }
          try {
            source.disconnect();
          } catch (e) {}
          try {
            gainNode.disconnect();
          } catch (e) {}
        };
        webAudioNodesRef.current.push(nodeRecord);
      };

      for (let i = 0; i < totalHitsForAudio; i += 1) {
        const hitStart = i * HIT_DURATION;
        const contact = hitStart + HIT_CONTACT_OFFSET;
        const isFinalHit = i === totalHitsForAudio - 1;
        const approachVolume = isFinalHit ? 0.5 : 0.42 + i * 0.035;
        const energyVolume = isFinalHit ? 0.28 : 0.18 + i * 0.025;
        const impactVolume = isFinalHit ? 0.9 : 0.72 + i * 0.05;

        // beamApproach: delay=hitStart, seek=0.64, volume, fade=0.72, duration=1.1
        scheduleWebAudio('beamApproach', hitStart, approachVolume, 0.72, 0.64, 1.1);

        // beamEnergy: delay=hitStart+0.08, volume, fade=0.17, duration=0.3
        scheduleWebAudio('beamEnergy', hitStart + 0.08, energyVolume, 0.17, 0, 0.3);

        // beamImpact: delay=contact-0.13, volume, fade=(isFinal?1.05:0.9), duration=(isFinal?1.25:1.1)
        scheduleWebAudio('beamImpact', contact - 0.13, impactVolume, isFinalHit ? 1.05 : 0.9, 0, isFinalHit ? 1.25 : 1.1);

        if (isFinalHit) {
          // finalLockOn: delay=hitStart+0.18, volume=0.8, fade=0.76, duration=0.9
          scheduleWebAudio('finalLockOn', hitStart + 0.18, 0.8, 0.76, 0, 0.9);

          // finalDischarge: delay=finalFlipStartForAudio, volume=0.84, fade=1.85, duration=2.0
          scheduleWebAudio('finalDischarge', finalFlipStartForAudio, 0.84, 1.85, 0, 2.0);

          // revealSnap: delay=Math.max(0, finalFlipEndForAudio-0.04), volume=0.5, fade=0.26, duration=0.45
          scheduleWebAudio('revealSnap', Math.max(0, finalFlipEndForAudio - 0.04), 0.5, 0.26, 0, 0.45);

          // electricalArc: delay=postFlipStart, volume=0.22, fade=1.8, duration=2.0
          const postFlipStart = finalFlipEndForAudio + 0.05;
          scheduleWebAudio('electricalArc', postFlipStart, 0.22, 1.8, 0, 2.0);

          // The cleanup that was originally here via setTimeout is no longer strictly necessary because
          // nodes will naturally stop playing based on their duration parameter.
          // However, we still have the visual and premium tier fallback timer doing full reset.
        }
      }
    } else {
      // Premium / Flagship: preserve the verified current choreography unchanged.
      for (let i = 0; i < totalHitsForAudio; i += 1) {
        const hitStart = i * HIT_DURATION;
        const contact = hitStart + HIT_CONTACT_OFFSET;
        const isFinalHit = i === totalHitsForAudio - 1;

        scheduleAudio(() => {
          const sound = audioRefs.current.beamApproach;
          if (!sound) return;
          const id = sound.play();
          sound.seek(0.64, id);
          const volume = isFinalHit ? 0.58 : Math.min(0.5 + i * 0.035, 0.58);
          sound.volume(volume, id);
          scheduleAudio(() => sound.fade(volume, 0, 800, id), 400);
          scheduleAudio(() => sound.stop(id), 1200);
        }, hitStart * 1000);

        scheduleAudio(() => {
          const sound = audioRefs.current.beamImpact;
          if (!sound) return;
          const id = sound.play();
          const volume = isFinalHit ? 0.9 : Math.min(0.68 + i * 0.06, 0.82);
          sound.volume(volume, id);
          sound.fade(volume, 0, 1500, id);
          scheduleAudio(() => sound.stop(id), 1600);
        }, (contact - 0.13) * 1000);

        if (isFinalHit) {
          scheduleAudio(() => {
            const sound = audioRefs.current.finalLockOn;
            if (!sound) return;
            const id = sound.play();
            sound.volume(0.86, id);
            sound.fade(0.86, 0, 1100, id);
            scheduleAudio(() => sound.stop(id), 1150);
          }, (hitStart + 0.18) * 1000);

          scheduleAudio(() => {
            const sound = audioRefs.current.finalDischarge;
            if (!sound) return;
            const id = sound.play();
            sound.volume(0.9, id);
            sound.fade(0.9, 0, 3000, id);
            scheduleAudio(() => sound.stop(id), 3000);
          }, finalFlipStartForAudio * 1000);

          scheduleAudio(() => {
            const sound = audioRefs.current.revealSnap;
            if (!sound) return;
            const id = sound.play();
            sound.volume(0.52, id);
            sound.fade(0.52, 0, 2000, id);
            scheduleAudio(() => sound.stop(id), 2500);
          }, Math.max(0, (finalFlipEndForAudio - 0.06) * 1000));

          const postFlipStart = finalFlipEndForAudio + 0.06;
          scheduleAudio(() => {
            const sound = audioRefs.current.electricalArc;
            if (!sound) return;
            const id = sound.play();
            sound.volume(0.28, id);
            sound.fade(0.28, 0, 2100, id);
            scheduleAudio(() => sound.stop(id), 2200);
          }, postFlipStart * 1000);

          scheduleAudio(() => {
            Object.values(audioRefs.current).forEach(sound => {
              if (sound) sound.stop();
            });
            audioTimersRef.current = [];
          }, (postFlipStart + 4.0) * 1000);
        }
      }
    }

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
    const F_FLIP_TIME = FINAL_FLIP_TIME; // exact lock and start of flip

    // Final Impact - tension grab (Energy Transfer)
    sequence.push([
      cardRef.current,
      { filter: "brightness(2.5)", scale: 0.91, y: 18, rotateZ: -1 },
      { at: finalHitStartTime + HIT_CONTACT_OFFSET, duration: 0.2, ease: "easeOut" }
    ]);

    // The Reveal Flip / Throw
    const flipAbsTime = finalHitStartTime + F_FLIP_TIME;

    // Throw upwards and scale out with a bright hero exposure, initiating a 3D tumble
    sequence.push([cardRef.current, { y: -60, scale: 1.08, rotateZ: 2, rotateX: 10, filter: "brightness(1.5)" }, { at: flipAbsTime, duration: 0.4, ease: "easeOut" }]);

    // Settle back down, maintaining a subtle physical float
    sequence.push([cardRef.current, { y: -5, scale: 1.0, rotateZ: -1, rotateX: -5, filter: "brightness(1.1)" }, { at: flipAbsTime + 0.4, duration: 0.8, ease: "easeInOut" }]);

    // Continuous slow drift during the post-flip dissipation
    sequence.push([cardRef.current, { y: 0, rotateZ: 0, rotateX: 0, filter: "brightness(1)" }, { at: flipAbsTime + 1.2, duration: 3.0, ease: "easeOut" }]);

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
