"use client";
import React, { useEffect, useRef } from "react";

export default function Aurora() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Use alpha: true since this needs to composite over the Starfield
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    let animationFrameId: number;
    let time = 0;

    const initCanvas = () => {
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
    };

    const draw = () => {
      time += 0.005;
      const width = window.innerWidth;
      const height = window.innerHeight;

      ctx.clearRect(0, 0, width, height);

      // Aurora 1 (Greenish)
      const cx1 = width * 0.3 + Math.sin(time) * 100;
      const cy1 = height * 0.2 + Math.cos(time * 0.8) * 50;
      const r1 = Math.max(width, height) * 0.6;

      const grad1 = ctx.createRadialGradient(cx1, cy1, 0, cx1, cy1, r1);
      grad1.addColorStop(0, "rgba(24, 208, 132, 0.15)");
      grad1.addColorStop(1, "rgba(0, 0, 0, 0)"); // Preserve transparent edge

      ctx.globalAlpha = 0.8;
      ctx.fillStyle = grad1;
      ctx.fillRect(0, 0, width, height);

      // Aurora 2 (Purplish)
      const cx2 = width * 0.7 + Math.cos(time * 1.2) * 120;
      const cy2 = height * 0.8 + Math.sin(time * 0.9) * 60;
      const r2 = Math.max(width, height) * 0.7;

      const grad2 = ctx.createRadialGradient(cx2, cy2, 0, cx2, cy2, r2);
      grad2.addColorStop(0, "rgba(151, 78, 240, 0.12)");
      grad2.addColorStop(1, "rgba(0, 0, 0, 0)");

      ctx.globalAlpha = 0.7;
      ctx.fillStyle = grad2;
      ctx.fillRect(0, 0, width, height);

      // Aurora 3 (Bluish)
      const cx3 = width * 0.5 + Math.sin(time * 0.5) * 150;
      const cy3 = height * 0.5 + Math.cos(time * 1.1) * 80;
      const r3 = Math.max(width, height) * 0.5;

      const grad3 = ctx.createRadialGradient(cx3, cy3, 0, cx3, cy3, r3);
      grad3.addColorStop(0, "rgba(105, 184, 255, 0.08)");
      grad3.addColorStop(1, "rgba(0, 0, 0, 0)");

      ctx.globalAlpha = 0.6;
      ctx.fillStyle = grad3;
      ctx.fillRect(0, 0, width, height);

      ctx.globalAlpha = 1.0;

      animationFrameId = requestAnimationFrame(draw);
    };

    const handleResize = () => {
      initCanvas();
      // Cancel pending animation frame to prevent duplicate animation loops
      cancelAnimationFrame(animationFrameId);
    };

    initCanvas();
    draw();

    window.addEventListener("resize", handleResize);
    window.addEventListener("orientationchange", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("orientationchange", handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 z-0 pointer-events-none mix-blend-screen" aria-hidden="true" />;
}
