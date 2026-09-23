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

  // Post-flip material behaves like white-hot molten plasma physically clinging
  // to the card face: top-to-bottom streams, secondary rivulets, edge runoff,
  // brief electrical charge/snap-arcs, sparks, embers, and a deliberate smolder-out.
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
      const p = (t - arc.delay) / Math.max(0.001, arc.duration);
      if (p <= 0 || p > 1.02) return;
      const points = [];
      const segs = 11;
      for (let i = 0; i <= segs; i += 1) {
        const u = i / segs;
        const envelope = Math.sin(Math.PI * u);
        const noise = Math.sin(i * 2.91 + material.seed + t * 90 + arc.phase) * arc.jag * envelope;
        const x = cx + halfW * (arc.startU + (arc.endU - arc.startU) * u);
        const y = cy + halfH * (arc.startV + (arc.endV - arc.startV) * u);
        points.push({ x: x + arc.nx * noise, y: y + arc.ny * noise });
      }
      const fadeEdge = 1 - smoothstep(0.86, 1, p);
      const a = strength * fadeEdge * (0.78 + 0.22 * Math.sin(t * 120 + arc.phase));
      const width = arc.width * (0.88 + 0.12 * Math.sin(t * 44 + arc.phase));
      strokeSmooth(points, width * 3.3, rgba(electricRgb, a * 0.17), 'screen', width * 1.8);
      strokeSmooth(points, width * 1.55, rgba(electricRgb, a * 0.82), 'screen', width * 0.9);
      strokeSmooth(points, Math.max(1.05, width * 0.33), rgba(electricHot, a), 'screen', 2);
      const head = points[Math.min(points.length - 1, Math.floor(clamp01(p) * (points.length - 1)))];
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      const flash = ctx.createRadialGradient(head.x, head.y, 0, head.x, head.y, width * 6);
      flash.addColorStop(0, rgba(electricHot, a * 0.9));
      flash.addColorStop(0.2, rgba(electricRgb, a * 0.38));
      flash.addColorStop(1, rgba(electricRgb, 0));
      ctx.beginPath(); ctx.arc(head.x, head.y, width * 6, 0, Math.PI * 2);
      ctx.fillStyle = flash; ctx.fill(); ctx.restore();
    };

    const drawRimFlow = (flow) => {
      const p = smoothstep(flow.delay, flow.delay + flow.duration, t);
      if (p <= 0) return;
      const spread = flow.spread * smoothstep(0, 0.28, p);
      const wobble = Math.sin(t * 18 + flow.phase) * flow.wobble;
      const points = [];
      for (let i = 0; i <= 12; i += 1) {
        const q = i / 12;
        let u; let v;
        if (flow.edge === 'top') { u = flow.start + (flow.end - flow.start) * q; v = -1 + spread * Math.sin(Math.PI * q) + wobble / cardH; }
        else if (flow.edge === 'bottom') { u = flow.start + (flow.end - flow.start) * q; v = 1 - spread * Math.sin(Math.PI * q) + wobble / cardH; }
        else if (flow.edge === 'left') { u = -1 + spread * Math.sin(Math.PI * q) + wobble / cardW; v = flow.start + (flow.end - flow.start) * q; }
        else { u = 1 - spread * Math.sin(Math.PI * q) + wobble / cardW; v = flow.start + (flow.end - flow.start) * q; }
        points.push(toPoint(u, v));
      }
      const width = flow.width * (0.84 + 0.16 * Math.sin(t * 24 + flow.phase));
      const alpha = moltenAlpha * flow.opacity;
      strokeSmooth(points, width * 3.6, rgba(tierRgb, alpha * 0.28), 'screen', 7);
      strokeSmooth(points, width * 2.25, rgba(tierDeep, alpha * 0.76), 'source-over', 2);
      strokeSmooth(points, width * 1.72, rgba(tierRgb, alpha), 'screen', 5);
      strokeSmooth(points, Math.max(1.1, width * 0.38), rgba(tierHot, alpha * 0.92), 'screen', 2);
    };

    const drawHotPool = (pool) => {
      const p = smoothstep(pool.delay, pool.delay + pool.duration, t);
      if (p <= 0) return;
      const cool = 1 - smoothstep(0.55, 0.95, p);
      const x = cx + halfW * (pool.u + Math.sin(t * 12 + pool.phase) * 0.01);
      const y = cy + halfH * (pool.v + Math.cos(t * 10 + pool.phase) * 0.01);
      const rx = pool.rx * (0.82 + p * 0.2);
      const ry = pool.ry * (0.86 + p * 0.18);
      const a = moltenAlpha * pool.opacity * (0.58 + cool * 0.42);
      ctx.save(); ctx.translate(x, y); ctx.rotate(pool.angle);
      ctx.globalCompositeOperation = 'screen';
      const glow = ctx.createRadialGradient(0, 0, 0, 0, 0, Math.max(rx, ry) * 2.8);
      glow.addColorStop(0, rgba(tierHot, a * 0.9)); glow.addColorStop(0.24, rgba(tierRgb, a * 0.9)); glow.addColorStop(0.72, rgba(tierRgb, a * 0.28)); glow.addColorStop(1, rgba(tierRgb, 0));
      ctx.beginPath(); ctx.ellipse(0, 0, rx * 2.8, ry * 2.4, 0, 0, Math.PI * 2); ctx.fillStyle = glow; ctx.fill();
      ctx.globalCompositeOperation = 'source-over'; ctx.beginPath(); ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2); ctx.fillStyle = rgba(tierDeep, a * 0.78); ctx.fill();
      ctx.globalCompositeOperation = 'screen'; ctx.beginPath(); ctx.ellipse(-rx * 0.12, -ry * 0.12, rx * 0.86, ry * 0.72, 0, 0, Math.PI * 2); ctx.fillStyle = rgba(tierRgb, a * 0.9); ctx.fill();
      ctx.beginPath(); ctx.ellipse(-rx * 0.18, -ry * 0.24, rx * 0.46, ry * 0.32, 0, 0, Math.PI * 2); ctx.fillStyle = rgba(tierHot, a * 0.62); ctx.fill();
      ctx.restore();
    };

    const drawDroplet = (drop, splatter = false) => {
      const p = smoothstep(drop.delay, drop.delay + drop.duration, t);
      if (p <= 0) return;
      const vanish = 1 - smoothstep(0.8, 1, p);
      const z = 0.72 + drop.depth * 0.55;
      const x = drop.x + drop.vx * p * z;
      const y = drop.y + drop.vy * p * z + drop.gravity * p * p * z;
      const size = drop.size * (0.72 + z * 0.56);
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
        const alpha = shellAlpha * pool.opacity; const x = cx + halfW * pool.u; const y = cy + halfH * pool.v; const r = pool.radius * (0.7 + 0.3 * Math.sin(t * 8 + pool.phase));
        ctx.save(); ctx.globalCompositeOperation = 'screen';
        const g = ctx.createRadialGradient(x, y, 0, x, y, r * 4); g.addColorStop(0, rgba(electricHot, alpha * 0.45)); g.addColorStop(0.2, rgba(electricRgb, alpha * 0.34)); g.addColorStop(1, rgba(electricRgb, 0));
        ctx.beginPath(); ctx.arc(x, y, r * 4, 0, Math.PI * 2); ctx.fillStyle = g; ctx.fill(); ctx.restore();
      });
      material.splatter.filter((drop) => drop.behind).forEach((drop) => drawDroplet(drop, true));
      return;
    }

    material.rimFlows.forEach(drawRimFlow);
    material.pools.forEach(drawHotPool);
    material.energyArcs.filter((arc) => !arc.behind).forEach((arc) => drawEnergyArc(arc, 0.94 * energyFade));
    material.surfaceFilaments.forEach((filament) => {
      const p = smoothstep(filament.delay, filament.delay + filament.duration, t); if (p <= 0) return;
      const points = [];
      for (let i = 0; i <= 8; i += 1) {
        const q = i / 8;
        const x = cx + halfW * (filament.startU + (filament.endU - filament.startU) * q);
        const y = cy + halfH * (filament.startV + (filament.endV - filament.startV) * q);
        const jitter = Math.sin(q * 12 + filament.phase + t * 70) * filament.jag * Math.sin(Math.PI * q);
        points.push({ x: x + filament.nx * jitter, y: y + filament.ny * jitter });
      }
      const a = energyFade * filament.opacity;
      strokeSmooth(points, filament.width * 2.8, rgba(electricRgb, a * 0.22), 'screen', 5);
      strokeSmooth(points, filament.width, rgba(electricRgb, a * 0.82), 'screen', 2);
      strokeSmooth(points, Math.max(0.75, filament.width * 0.24), rgba(electricHot, a), 'screen', 1);
    });
    material.splatter.filter((drop) => !drop.behind).forEach((drop) => drawDroplet(drop, true));
    material.drips.forEach((drop) => drawDroplet(drop, false));

    if (t > 0.68) {
      const cool = smoothstep(0.68, 0.96, t) * 0.46;
      ctx.save(); ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = rgba(tierDeep, cool * 0.18);
      ctx.fillRect(cx - halfW, cy - halfH, cardW, cardH);
      ctx.restore();
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


    const { cx, cy, w: cardW, h: cardH } = cardMetricsRef.current;
    particlesRef.current = {
      seed: Math.random() * Math.PI * 2,
      rimFlows: [
        { edge: 'top', start: -0.84, end: 0.64, spread: 0.035, wobble: 2.8, width: 7.2, opacity: 0.94, delay: 0.015, duration: 0.28, phase: 0.7 },
        { edge: 'top', start: -0.56, end: 0.42, spread: 0.026, wobble: 2.2, width: 4.1, opacity: 0.72, delay: 0.08, duration: 0.33, phase: 2.1 },
        { edge: 'right', start: -0.76, end: 0.82, spread: 0.03, wobble: 3.4, width: 6.3, opacity: 0.9, delay: 0.05, duration: 0.3, phase: 1.6 },
        { edge: 'right', start: -0.14, end: 0.9, spread: 0.018, wobble: 2.3, width: 3.8, opacity: 0.68, delay: 0.12, duration: 0.3, phase: 3.2 },
        { edge: 'bottom', start: -0.86, end: 0.88, spread: 0.045, wobble: 3.8, width: 8.8, opacity: 0.98, delay: 0.1, duration: 0.32, phase: 2.8 },
        { edge: 'bottom', start: -0.62, end: 0.44, spread: 0.026, wobble: 3.2, width: 4.8, opacity: 0.78, delay: 0.18, duration: 0.32, phase: 4.1 },
        { edge: 'left', start: -0.8, end: 0.76, spread: 0.032, wobble: 3.1, width: 6.5, opacity: 0.9, delay: 0.07, duration: 0.3, phase: 5.0 },
        { edge: 'left', start: -0.24, end: 0.58, spread: 0.018, wobble: 2.1, width: 3.8, opacity: 0.66, delay: 0.16, duration: 0.3, phase: 0.2 }
      ],
      pools: [
        { u: -0.56, v: -0.74, rx: 18, ry: 11, angle: -0.3, opacity: 0.78, delay: 0.06, duration: 0.24, phase: 0.1 },
        { u: 0.54, v: -0.48, rx: 16, ry: 10, angle: 0.28, opacity: 0.74, delay: 0.12, duration: 0.24, phase: 2.2 },
        { u: -0.7, v: 0.34, rx: 14, ry: 9, angle: -0.55, opacity: 0.72, delay: 0.18, duration: 0.28, phase: 3.4 },
        { u: 0.68, v: 0.48, rx: 20, ry: 12, angle: 0.42, opacity: 0.8, delay: 0.16, duration: 0.26, phase: 4.6 },
        { u: -0.18, v: 0.78, rx: 23, ry: 13, angle: -0.08, opacity: 0.88, delay: 0.2, duration: 0.24, phase: 1.5 }
      ],
      backPools: Array.from({ length: 7 }, (_, index) => ({
        u: -0.86 + Math.random() * 1.72, v: -0.92 + Math.random() * 1.84, radius: 12 + Math.random() * 18,
        opacity: 0.55 + Math.random() * 0.28, delay: 0.02 + Math.random() * 0.16, duration: 0.3 + Math.random() * 0.25, phase: index * 1.7 + Math.random() * 0.8
      })),
      energyArcs: Array.from({ length: 12 }, (_, index) => {
        const starts = [[-1.16,-0.78],[-1.12,0.42],[-0.76,-1.1],[0.26,-1.12],[1.12,-0.52],[1.16,0.38],[0.74,1.11],[-0.22,1.12],[-1.12,-0.1],[1.08,0.06],[-0.38,-1.08],[0.38,1.08]];
        const ends = [[0.12,0.88],[0.7,-0.22],[-0.12,0.34],[-0.68,0.18],[-0.18,0.78],[-0.72,-0.42],[0.1,-0.7],[-0.74,-0.18],[0.42,-0.82],[-0.44,0.7],[0.88,0.26],[-0.86,0.18]];
        const [startU,startV] = starts[index]; const [endU,endV] = ends[index];
        const dx = endU - startU; const dy = endV - startV; const len = Math.max(0.001, Math.hypot(dx,dy));
        return { startU,startV,endU,endV,nx:-dy/len,ny:dx/len,jag:6+Math.random()*7,width:5.2+Math.random()*2.8,delay:0.015+Math.random()*0.38,duration:0.24+Math.random()*0.36,phase:Math.random()*Math.PI*2,behind:index%2===0||index===7 };
      }),
      surfaceFilaments: Array.from({ length: 8 }, (_, index) => {
        const starts = [-0.78,-0.56,-0.28,0.04,0.28,0.48,0.68,-0.06];
        const startU = starts[index] + (Math.random()-0.5)*0.08; const endU = startU + (Math.random()-0.5)*0.26;
        const startV = -0.84 + Math.random()*1.18; const endV = startV + 0.36 + Math.random()*0.74;
        const dx=endU-startU; const dy=endV-startV; const len=Math.max(0.001,Math.hypot(dx,dy));
        return { startU,startV,endU,endV,nx:-dy/len,ny:dx/len,jag:3+Math.random()*3,width:1.4+Math.random()*1.1,opacity:0.62+Math.random()*0.28,delay:0.1+Math.random()*0.36,duration:0.28+Math.random()*0.3,phase:Math.random()*Math.PI*2 };
      }),
      drips: Array.from({ length: 14 }, (_, index) => {
        const edge = index < 7 ? 'bottom' : index % 2 === 0 ? 'left' : 'right'; let x; let y;
        if (edge === 'bottom') { x = cx + (-0.84 + Math.random()*1.68)*halfW; y = cy + halfH - 2; }
        else if (edge === 'left') { x = cx - halfW + 2; y = cy + (-0.2 + Math.random()*0.96)*halfH; }
        else { x = cx + halfW - 2; y = cy + (-0.2 + Math.random()*0.96)*halfH; }
        return { x,y,vx:edge==='left' ? -18-Math.random()*26 : edge==='right' ? 18+Math.random()*26 : (Math.random()-0.5)*34,vy:edge==='bottom' ? 38+Math.random()*58 : 12+Math.random()*42,gravity:38+Math.random()*46,size:2.3+Math.random()*3.7,depth:Math.random(),brightness:0.55+Math.random()*0.42,delay:0.2+Math.random()*0.48,duration:0.28+Math.random()*0.34 };
      }),
      splatter: Array.from({ length: 36 }, (_, index) => {
        const angle=Math.random()*Math.PI*2; const radius=cardW*(0.34+Math.random()*0.38); const startX=cx+Math.cos(angle)*radius; const startY=cy+Math.sin(angle)*radius*(cardH/cardW)*0.7; const outward=22+Math.random()*76;
        return { x:startX,y:startY,vx:Math.cos(angle)*outward+(Math.random()-0.5)*22,vy:Math.sin(angle)*outward*0.86-6+Math.random()*16,gravity:20+Math.random()*42,size:1+Math.random()*2.9,depth:Math.random(),brightness:0.38+Math.random()*0.58,delay:0.08+Math.random()*0.82,duration:0.26+Math.random()*0.55,behind:index%3===0 };
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
    const F_FLIP_TIME = FINAL_FLIP_TIME; // exact lock and start of flip

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
