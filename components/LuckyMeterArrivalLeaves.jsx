'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  ARRIVAL_TIMING,
  createArrivalLeaves,
  getArrivalDurationMs,
  sampleArrivalLeaf,
  sampleArrivalWind,
} from '../app/lib/lucky-meter/arrival-leaves';
import {
  getCanvasPixelRatio,
  getRenderQuality,
  onVisibilityChange,
  prefersReducedMotion,
} from '../app/lib/graphics-capabilities';

/**
 * The maple-leaf arrival.
 *
 * A handful of small, earth-toned leaves rest at the edges of the sky when the
 * Lucky Meter appears. One second later the shared wind lifts them, turns them
 * and carries them out of the frame; the canvas then removes itself, so the
 * introduction costs nothing once it is over and nothing runs while a visitor
 * reads the headline or presses Start.
 *
 * It is one canvas and at most five leaves at a capped backing-store ratio, with
 * no filter passes. Under reduced motion the leaves are drawn once at rest and
 * never animate. The layer is decorative, hidden from assistive technology and
 * pointer-transparent.
 */
const LEAF_PATH = 'M50 3 C52.5 10 55 14 59 16.5 C57.3 19.2 57.8 22.1 60.6 24.6 '
  + 'C62.6 20.8 66.1 18.4 70.6 18.2 C69.3 22.8 70.4 27.2 73.4 30.7 '
  + 'C69.4 32.5 66.6 35.6 64.7 39.5 C69.9 41.2 73.9 44.7 76.6 49.3 '
  + 'C71.4 51.8 67.4 55.9 64.9 60.9 C62.5 57.1 58.9 54.5 54.9 53.8 '
  + 'C54.6 61.3 56.6 68.6 60.6 75 L52.4 73.5 L50 88 L47.6 73.5 L39.4 75 '
  + 'C43.4 68.6 45.4 61.3 45.1 53.8 C41.1 54.5 37.5 57.1 35.1 60.9 '
  + 'C32.6 55.9 28.6 51.8 23.4 49.3 C26.1 44.7 30.1 41.2 35.3 39.5 '
  + 'C33.4 35.6 30.6 32.5 26.6 30.7 C29.6 27.2 30.7 22.8 29.4 18.2 '
  + 'C33.9 18.4 37.4 20.8 39.4 24.6 C42.2 22.1 42.7 19.2 41 16.5 '
  + 'C45 14 47.5 10 50 3 Z';

let cachedPath = undefined;

function getLeafPath() {
  if (cachedPath !== undefined) return cachedPath;
  if (typeof Path2D === 'undefined') return null;
  cachedPath = new Path2D(LEAF_PATH);
  return cachedPath;
}

function rgb(albedo, factor = 1, towardWhite = 0) {
  const channels = Array.isArray(albedo) && albedo.length === 3 ? albedo : [0.8, 0.55, 0.2];
  return channels
    .map((channel) => {
      const value = Math.max(0, Math.min(1, channel));
      const lightened = value + (1 - value) * towardWhite;
      return Math.round(Math.max(0, Math.min(1, lightened * factor)) * 255);
    })
    .join(', ');
}

function drawLeaf(ctx, leaf, state, width, height) {
  const size = leaf.size;
  const x = state.x * width;
  const y = state.y * height;
  if (state.alpha <= 0.002) return;

  // Ground shadow: a soft ellipse instead of a blur filter, which is cheaper
  // on a phone and enough to sit the leaf against the sky.
  const shadowX = x + size * 0.16;
  const shadowY = y + size * 0.45;
  const shadow = ctx.createRadialGradient(
    shadowX,
    shadowY,
    0,
    shadowX,
    shadowY,
    size * 0.46,
  );
  shadow.addColorStop(0, `rgba(0, 0, 0, ${0.3 * state.alpha})`);
  shadow.addColorStop(0.62, `rgba(0, 0, 0, ${0.15 * state.alpha})`);
  shadow.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.save();
  ctx.fillStyle = shadow;
  ctx.beginPath();
  ctx.ellipse(shadowX, shadowY, size * 0.46, size * 0.13, -0.18, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  const path = getLeafPath();
  if (!path) return;

  ctx.save();
  ctx.globalAlpha = state.alpha;
  ctx.translate(x, y);
  ctx.rotate(state.rotation);
  ctx.scale((state.scaleX * size) / 100, (state.scaleY * size) / 100);
  ctx.translate(-50, -50);

  const fill = ctx.createLinearGradient(18, 8, 82, 96);
  fill.addColorStop(0, `rgb(${rgb(leaf.colour.albedo, 1.12, 0.26)})`);
  fill.addColorStop(0.52, `rgb(${rgb(leaf.colour.albedo, 0.92, 0.05)})`);
  fill.addColorStop(1, `rgb(${rgb(leaf.colour.albedo, 0.58, 0)})`);
  ctx.fillStyle = fill;
  ctx.fill(path);

  // A narrow moonlit sheen across the upper-left half of the blade.
  ctx.save();
  ctx.clip(path);
  const sheen = ctx.createLinearGradient(8, 4, 62, 70);
  sheen.addColorStop(0, 'rgba(255, 246, 218, 0.18)');
  sheen.addColorStop(0.55, 'rgba(255, 236, 190, 0.04)');
  sheen.addColorStop(1, 'rgba(255, 236, 190, 0)');
  ctx.fillStyle = sheen;
  ctx.fillRect(0, 0, 100, 100);
  ctx.restore();

  // Dry veins, radiating from the stem.
  ctx.strokeStyle = `rgba(${rgb(leaf.colour.albedo, 0.38, 0)})`;
  ctx.lineWidth = 0.85;
  ctx.lineCap = 'round';
  const veins = [
    [50, 85, 50, 5],
    [50, 84, 70, 19],
    [50, 84, 30, 19],
    [50, 80, 75, 48],
    [50, 80, 25, 48],
    [50, 78, 63, 38],
    [50, 78, 37, 38],
    [50, 70, 42, 66],
    [50, 70, 58, 66],
  ];
  for (const [x1, y1, x2, y2] of veins) {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.quadraticCurveTo((x1 + x2) / 2 + 1.2, (y1 + y2) / 2, x2, y2);
    ctx.stroke();
  }

  // Edge and stem. The edge is darker than the blade, which is what stops the
  // small shapes reading as flat stickers.
  ctx.strokeStyle = `rgba(${rgb(leaf.colour.albedo, 0.42, 0)})`;
  ctx.lineWidth = 1.4;
  ctx.stroke(path);

  ctx.beginPath();
  ctx.moveTo(50, 86);
  ctx.quadraticCurveTo(49.2, 93, 50, 100);
  ctx.lineWidth = 2.1;
  ctx.stroke();

  ctx.restore();
}

function drawScene(ctx, leaves, elapsedMs, width, height) {
  ctx.clearRect(0, 0, width, height);
  if (!Array.isArray(leaves)) return;
  const wind = sampleArrivalWind(elapsedMs);
  for (const leaf of leaves) {
    const state = sampleArrivalLeaf(leaf, elapsedMs, wind);
    if (state.visible) drawLeaf(ctx, leaf, state, width, height);
  }
}

export default function LuckyMeterArrivalLeaves() {
  const canvasRef = useRef(null);
  const [phase, setPhase] = useState('resting');

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || typeof window === 'undefined') return undefined;

    const context = canvas.getContext('2d');
    if (!context) return undefined;

    const reducedMotion = prefersReducedMotion();
    let quality = null;
    try {
      quality = getRenderQuality();
    } catch {
      quality = null;
    }
    const ratio = getCanvasPixelRatio(quality?.maxPixelRatio);

    let leaves = createArrivalLeaves(Math.random, 5, {
      width: window.innerWidth,
      height: window.innerHeight,
    });
    const duration = getArrivalDurationMs(leaves);
    let startedAt = performance.now();
    let elapsed = 0;
    let frameId = null;
    let stopped = false;
    let size = { width: 1, height: 1 };

    const resize = () => {
      const width = Math.max(1, canvas.clientWidth || window.innerWidth);
      const height = Math.max(1, canvas.clientHeight || window.innerHeight);
      size = { width, height };
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      drawScene(context, leaves, elapsed, width, height);
    };


    const frame = (now) => {
      if (stopped) return;
      elapsed = now - startedAt;
      drawScene(context, leaves, elapsed, size.width, size.height);
      if (elapsed >= duration) {
        frameId = null;
        stopped = true;
        window.clearTimeout(resizeTimer);
        window.removeEventListener('resize', onResize);
        stopVisibility();
        setPhase('gone');
        return;
      }
      frameId = window.requestAnimationFrame(frame);
    };

    // A resize re-composes the same leaves at the new fractions instead of
    // stretching the old drawing.
    let resizeTimer = 0;
    const onResize = () => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(resize, 120);
    };

    resize();
    window.addEventListener('resize', onResize);

    if (reducedMotion) {
      setPhase('resting');
      const goneTimer = window.setTimeout(() => {
        if (stopped) return;
        stopped = true;
        window.clearTimeout(resizeTimer);
        window.removeEventListener('resize', onResize);
        setPhase('gone');
      }, 1500);
      return () => {
        stopped = true;
        window.clearTimeout(goneTimer);
        window.clearTimeout(resizeTimer);
        window.removeEventListener('resize', onResize);
      };
    }

    setPhase('resting');
    const liftTimer = window.setTimeout(() => {
      if (!stopped) setPhase('lifting');
    }, ARRIVAL_TIMING.restMs);

    const stopVisibility = onVisibilityChange((visible) => {
      if (stopped) return;
      if (visible) {
        // Resume from where the introduction stopped rather than jumping to
        // the end because the tab was hidden.
        startedAt = performance.now() - elapsed;
        if (frameId === null) frameId = window.requestAnimationFrame(frame);
      } else if (frameId !== null) {
        window.cancelAnimationFrame(frameId);
        frameId = null;
      }
    });

    frameId = window.requestAnimationFrame(frame);

    return () => {
      stopped = true;
      if (frameId !== null) window.cancelAnimationFrame(frameId);
      frameId = null;
      window.clearTimeout(liftTimer);
      window.clearTimeout(resizeTimer);
      window.removeEventListener('resize', onResize);
      stopVisibility();
    };
  }, []);

  if (phase === 'gone') return null;

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      data-testid="lucky-meter-arrival-leaves"
      data-phase={phase}
      className="pointer-events-none absolute inset-0 z-[7] h-full w-full"
    />
  );
}
