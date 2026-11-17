"use client";
import React, { useEffect, useRef } from "react";
import {
  getCanvas2DContext,
  getCanvasPixelRatio,
  isPageVisible,
  onReducedMotionChange,
  onVisibilityChange,
  prefersReducedMotion,
  watchContextLoss,
} from "../app/lib/graphics-capabilities";
import { createAdaptiveFrameLoop } from "../app/lib/adaptive-performance";

const TwinklingStars: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = getCanvas2DContext(canvas, { alpha: true });
    if (!ctx) return;

    const frameLoop = createAdaptiveFrameLoop();
    let contextLost = false;
    let width = window.innerWidth;
    let height = window.innerHeight;
    let isReducedMotion = prefersReducedMotion();

    const stopAnimation = () => {
      frameLoop.cancel();
    };

    // We only want stars in the upper part of the sky (e.g. top 60%),
    // to avoid overlapping mountains and foreground elements in the photograph.
    const STAR_DENSITY = 0.0003; // slightly more visible but subtle
    const stars: { x: number; y: number; size: number; baseAlpha: number; currentAlpha: number; twinkleSpeed: number; twinklePhase: number; isTwinkling: boolean }[] = [];

    const initCanvas = () => {
      const dpr = getCanvasPixelRatio();
      width = window.innerWidth;
      height = window.innerHeight;

      ctx.setTransform(1, 0, 0, 1, 0, 0);
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.scale(dpr, dpr);

      // Re-initialize stars on significant resize
      stars.length = 0;

      // Calculate horizon dynamically based on object-position: center 40% and object-fit: cover
      // Image dimensions
      const imgW = 1400;
      const imgH = 2559;
      const scale = Math.max(width / imgW, height / imgH);
      const scaledH = imgH * scale;
      const offset_Y = (height * 0.40) - (scaledH * 0.40);

      // The mountain line is approximately 53.6% down the image (y=1373/2559)
      const horizon_Y = offset_Y + (scaledH * 0.536);

      // Limit physical generation to strictly above the calculated horizon
      const safeMaxY = Math.min(height * 0.2, horizon_Y);
      const numStars = Math.floor(width * safeMaxY * STAR_DENSITY);

      for (let i = 0; i < numStars; i++) {
        stars.push({
          x: Math.random() * width,
          y: Math.random() * safeMaxY, // Limit physical generation to the sky region
          size: Math.random() * 1.5 + 0.8, // Star sizes: 0.8 to 2.3 to survive anti-aliasing
          baseAlpha: Math.random() * 0.5 + 0.4, // Base opacity: 0.4 to 0.9
          currentAlpha: 0,
          twinkleSpeed: Math.random() * 0.01 + 0.005, // Slow twinkle
          twinklePhase: Math.random() * Math.PI * 2,
          isTwinkling: Math.random() > 0.7 // Only ~30% of stars twinkle
        });
      }

      // Init current alpha
      stars.forEach(s => s.currentAlpha = s.baseAlpha);
    };

    initCanvas();

    const draw = () => {
      if (contextLost) return;

      ctx.clearRect(0, 0, width, height);

      stars.forEach(star => {
        if (!isReducedMotion && star.isTwinkling) {
          // Gentle sinusoidal twinkle
          star.twinklePhase += star.twinkleSpeed;
          const twinkleAlpha = star.baseAlpha + Math.sin(star.twinklePhase) * 0.2;
          // Keep alpha constrained
          star.currentAlpha = Math.max(0.1, Math.min(1.0, twinkleAlpha));
        }

        ctx.fillStyle = `rgba(255, 255, 255, ${star.currentAlpha})`;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();
      });

      if (!isReducedMotion && !contextLost && isPageVisible()) {
        frameLoop.request(draw);
      }
    };

    draw();

    const handleResize = () => {
      initCanvas();
      stopAnimation();
      draw();
    };

    const stopMotionListener = onReducedMotionChange((matches) => {
      isReducedMotion = matches;
      stopAnimation();
      draw();
    });

    const stopVisibilityListener = onVisibilityChange((visible) => {
      if (!visible) {
        stopAnimation();
        return;
      }
      stopAnimation();
      draw();
    });

    const stopContextWatcher = watchContextLoss(canvas, {
      onLost: () => {
        contextLost = true;
        stopAnimation();
      },
      onRestored: () => {
        contextLost = false;
        initCanvas();
        stopAnimation();
        draw();
      },
    });

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      stopMotionListener();
      stopVisibilityListener();
      stopContextWatcher();
      frameLoop.dispose();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ zIndex: -15, WebkitMaskImage: 'linear-gradient(to bottom, black 40%, transparent 60%)', maskImage: 'linear-gradient(to bottom, black 40%, transparent 60%)' }} // Tighter mask to keep stars strictly out of the mountains
      aria-hidden="true"
    />
  );
};

export default TwinklingStars;
