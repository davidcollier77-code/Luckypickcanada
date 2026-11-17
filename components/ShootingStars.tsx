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

export default function ShootingStars() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let reducedMotion = prefersReducedMotion();

    const ctx = getCanvas2DContext(canvas, { alpha: true });
    if (!ctx) return;

    const frameLoop = createAdaptiveFrameLoop();
    let contextLost = false;

    type ShootingStar = {
      x: number;
      y: number;
      length: number;
      speed: number;
      opacity: number;
      angle: number;
      active: boolean;
    };

    const maxStars = 3;
    const stars: ShootingStar[] = Array.from({ length: maxStars }).map(() => ({
      x: 0,
      y: 0,
      length: 0,
      speed: 0,
      opacity: 0,
      angle: 0,
      active: false,
    }));

    const initCanvas = () => {
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
    };

    const spawnStar = (star: ShootingStar) => {
      if (reducedMotion) return;
      const width = window.innerWidth;
      const height = window.innerHeight;

      // Spawn slightly off-screen top/right
      star.x = Math.random() * width + width * 0.2;
      star.y = Math.random() * height * 0.5 - height * 0.2;
      star.length = Math.random() * 80 + 40;
      star.speed = Math.random() * 10 + 15;
      star.opacity = 1;
      // Angle down and left
      star.angle = Math.PI / 4 + (Math.random() * 0.2 - 0.1);
      star.active = true;
    };

    const draw = () => {
      if (contextLost) return;

      const width = window.innerWidth;
      const height = window.innerHeight;

      ctx.clearRect(0, 0, width, height);
      ctx.globalCompositeOperation = 'lighter';

      stars.forEach((star) => {
        if (!star.active) {
          // Random chance to spawn a new star if inactive
          if (!reducedMotion && Math.random() < 0.005) {
            spawnStar(star);
          }
          return;
        }

        // Draw the star
        ctx.save();
        ctx.translate(star.x, star.y);
        ctx.rotate(star.angle);

        // Head of the star
        ctx.fillStyle = `rgba(255, 255, 255, ${star.opacity})`;
        ctx.fillRect(0, 0, 2, 2);

        // Tail gradient
        const tailGrad = ctx.createLinearGradient(0, 0, -star.length, 0);
        tailGrad.addColorStop(0, `rgba(255, 255, 255, ${star.opacity * 0.8})`);
        tailGrad.addColorStop(1, `rgba(255, 255, 255, 0)`);

        ctx.fillStyle = tailGrad;
        ctx.fillRect(-star.length, 0, star.length, 1);

        ctx.restore();

        // Update position
        star.x -= Math.cos(star.angle) * star.speed;
        star.y += Math.sin(star.angle) * star.speed;

        // Fade out slightly over time
        star.opacity -= 0.01;

        // Deactivate if off-screen or invisible
        if (star.x < -100 || star.y > height + 100 || star.opacity <= 0) {
          star.active = false;
        }
      });

      ctx.globalCompositeOperation = 'source-over'; // Restore default
      if (!reducedMotion && !contextLost && isPageVisible()) {
        frameLoop.request(draw);
      }
    };

    const stopAnimation = () => {
      frameLoop.cancel();
    };

    const handleResize = () => {
      initCanvas();
      stopAnimation();
      draw();
    };

    initCanvas();
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
        initCanvas();
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
      frameLoop.dispose();
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 z-0 pointer-events-none" aria-hidden="true" />;
}
