"use client";
import React, { useEffect, useRef } from "react";

export default function Starfield() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    let animationFrameId: number;
    let stars: Array<{ x: number; y: number; r: number; alpha: number; twinkleSpeed: number }> = [];

    const initStars = () => {
      const dpr = window.devicePixelRatio || 1;
      const width = window.innerWidth;
      const height = window.innerHeight;

      // Reset transform before applying DPR scaling to prevent cumulative transform bug
      ctx.setTransform(1, 0, 0, 1, 0, 0);

      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      ctx.scale(dpr, dpr);

      // Scale down density based on screen width for mobile optimization
      const numStars = width < 768 ? 100 : 300;

      stars = Array.from({ length: numStars }).map(() => ({
        x: Math.floor(Math.random() * width),
        y: Math.floor(Math.random() * height),
        r: Math.random() * 1.5 + 0.5,
        alpha: Math.random(),
        twinkleSpeed: Math.random() * 0.02 + 0.005,
      }));
    };

    const draw = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;

      ctx.fillStyle = "#020617"; // bg-slate-950 equivalent for base
      ctx.fillRect(0, 0, width, height);

      ctx.fillStyle = "#ffffff";

      stars.forEach((star) => {
        // Twinkle logic
        star.alpha += star.twinkleSpeed;
        if (star.alpha > 1 || star.alpha < 0.1) {
          star.twinkleSpeed = -star.twinkleSpeed;
        }

        ctx.globalAlpha = star.alpha;
        ctx.fillRect(star.x, star.y, star.r, star.r);
      });

      ctx.globalAlpha = 1.0;
      animationFrameId = requestAnimationFrame(draw);
    };

    const handleResize = () => {
      initStars();
      // Cancel pending animation frame to prevent duplicate animation loops
      cancelAnimationFrame(animationFrameId);
    };

    initStars();
    draw();

    window.addEventListener("resize", handleResize);
    window.addEventListener("orientationchange", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("orientationchange", handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 z-0 pointer-events-none" aria-hidden="true" />;
}
