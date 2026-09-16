"use client";
import React, { useEffect, useRef } from "react";

const TwinklingStars: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    let animationFrameId: number = 0;
    let width = window.innerWidth;
    let height = window.innerHeight;

    const mediaQuery = typeof window !== 'undefined' ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
    let isReducedMotion = mediaQuery?.matches ?? false;

    const handleMotionPreferenceChange = (e: MediaQueryListEvent) => {
      isReducedMotion = e.matches;
      if (isReducedMotion && animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = 0;
        draw(); // Draw once when motion is disabled
      } else if (!isReducedMotion && animationFrameId === 0) {
        draw(); // Resume animation loop
      }
    };

    mediaQuery?.addEventListener?.('change', handleMotionPreferenceChange);

    // We only want stars in the upper part of the sky (e.g. top 60%),
    // to avoid overlapping mountains and foreground elements in the photograph.
    const STAR_DENSITY = 0.0001; // sparse
    const maxStars = Math.floor(width * height * STAR_DENSITY);
    const stars: { x: number; y: number; size: number; baseAlpha: number; currentAlpha: number; twinkleSpeed: number; twinklePhase: number; isTwinkling: boolean }[] = [];

    const initCanvas = () => {
      const dpr = window.devicePixelRatio || 1;
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
      const numStars = Math.floor(width * height * STAR_DENSITY);

      for (let i = 0; i < numStars; i++) {
        stars.push({
          x: Math.random() * width,
          y: Math.random() * (height * 0.55), // Keep stars in top 55%
          size: Math.random() * 1.0 + 0.5, // Tiny sizes: 0.2 to 1.0
          baseAlpha: Math.random() * 0.5 + 0.4, // Base opacity: 0.2 to 0.7
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

      if (!isReducedMotion) {
        animationFrameId = requestAnimationFrame(draw);
      } else {
        // Draw once if reduced motion
        // (If reduced motion, animationFrame won't loop)
      }
    };

    draw();

    const handleResize = () => {
      initCanvas();
      if (isReducedMotion) {
          draw();
      }
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      mediaQuery?.removeEventListener?.('change', handleMotionPreferenceChange);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none mix-blend-screen"
      style={{ zIndex: -15 }} // Positioned between background image (-20) and overlay (-10)
      aria-hidden="true"
    />
  );
};

export default TwinklingStars;
