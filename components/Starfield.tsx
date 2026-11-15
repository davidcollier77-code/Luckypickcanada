"use client";
import React, { useEffect, useRef } from "react";
import {
  getCanvas2DContext,
  getCanvasPixelRatio,
  getGraphicsProfile,
  isPageVisible,
  onReducedMotionChange,
  onVisibilityChange,
  prefersReducedMotion,
  watchContextLoss,
} from "../app/lib/graphics-capabilities";

export default function Starfield() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = getCanvas2DContext(canvas, { alpha: false });
    if (!ctx) return;

    let animationFrameId = 0;
    let contextLost = false;
    let reducedMotion = prefersReducedMotion();
    const particleScale = getGraphicsProfile().particleScale;
    let stars: Array<{ x: number; y: number; r: number; alpha: number; twinkleSpeed: number }> = [];

    const initStars = () => {
      const dpr = getCanvasPixelRatio();
      const width = window.innerWidth;
      const height = window.innerHeight;

      // Reset transform before applying DPR scaling to prevent cumulative transform bug
      ctx.setTransform(1, 0, 0, 1, 0, 0);

      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      ctx.scale(dpr, dpr);

      // Scale down density based on screen width for mobile optimization.
      // A constrained device draws fewer stars; a capable device is unchanged.
      const baseCount = width < 768 ? 100 : 300;
      const numStars = Math.round(baseCount * particleScale);

      stars = Array.from({ length: numStars }).map(() => ({
        x: Math.floor(Math.random() * width),
        y: Math.floor(Math.random() * height),
        r: Math.random() * 1.5 + 0.5,
        alpha: Math.random(),
        twinkleSpeed: Math.random() * 0.02 + 0.005,
      }));
    };

    const draw = () => {
      if (contextLost) return;

      const width = window.innerWidth;
      const height = window.innerHeight;

      ctx.fillStyle = "#020617"; // bg-slate-950 equivalent for base
      ctx.fillRect(0, 0, width, height);

      ctx.fillStyle = "#ffffff";

      stars.forEach((star) => {
        // Reduced motion paints one static frame instead of a twinkle loop.
        if (!reducedMotion) {
          star.alpha += star.twinkleSpeed;
          if (star.alpha > 1 || star.alpha < 0.1) {
            star.twinkleSpeed = -star.twinkleSpeed;
          }
        }

        ctx.globalAlpha = star.alpha;
        ctx.fillRect(star.x, star.y, star.r, star.r);
      });

      ctx.globalAlpha = 1.0;
      if (!reducedMotion && !contextLost && isPageVisible()) {
        animationFrameId = requestAnimationFrame(draw);
      }
    };

    const stopAnimation = () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      animationFrameId = 0;
    };

    const handleResize = () => {
      initStars();
      stopAnimation();
      draw();
    };

    initStars();
    draw();

    window.addEventListener("resize", handleResize);
    window.addEventListener("orientationchange", handleResize);

    const stopMotionListener = onReducedMotionChange((matches) => {
      reducedMotion = matches;
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
        initStars();
        stopAnimation();
        draw();
      },
    });

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("orientationchange", handleResize);
      stopMotionListener();
      stopVisibilityListener();
      stopContextWatcher();
      stopAnimation();
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 z-0 pointer-events-none" aria-hidden="true" />;
}
