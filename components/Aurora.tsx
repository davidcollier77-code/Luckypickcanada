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
      ctx.globalCompositeOperation = 'screen';

      // Performance Optimization (Bolt ⚡): Use bezierCurveTo + createLinearGradient
      // instead of overlapping full-screen radial gradients for high-performance organic ribbons

      // Layer 1 (Greenish)
      ctx.beginPath();
      ctx.moveTo(-width * 0.2, height * 0.4 + Math.sin(time) * 100);
      ctx.bezierCurveTo(
        width * 0.3, height * 0.1 + Math.cos(time * 0.8) * 120,
        width * 0.7, height * 0.6 + Math.sin(time * 1.2) * 80,
        width * 1.2, height * 0.2 + Math.cos(time * 1.5) * 100
      );

      const grad1 = ctx.createLinearGradient(0, height * 0.1, 0, height * 0.8);
      grad1.addColorStop(0, "rgba(24, 208, 132, 0)");
      grad1.addColorStop(0.5, "rgba(24, 208, 132, 0.25)");
      grad1.addColorStop(1, "rgba(24, 208, 132, 0)");

      ctx.lineWidth = height * 0.4;
      ctx.strokeStyle = grad1;
      ctx.stroke();

      // Layer 2 (Purplish)
      ctx.beginPath();
      ctx.moveTo(-width * 0.2, height * 0.6 + Math.cos(time * 1.1) * 80);
      ctx.bezierCurveTo(
        width * 0.4, height * 0.8 + Math.sin(time * 0.9) * 100,
        width * 0.6, height * 0.3 + Math.cos(time * 1.3) * 120,
        width * 1.2, height * 0.5 + Math.sin(time * 1.4) * 90
      );

      const grad2 = ctx.createLinearGradient(0, height * 0.2, 0, height * 0.9);
      grad2.addColorStop(0, "rgba(151, 78, 240, 0)");
      grad2.addColorStop(0.5, "rgba(151, 78, 240, 0.2)");
      grad2.addColorStop(1, "rgba(151, 78, 240, 0)");

      ctx.lineWidth = height * 0.5;
      ctx.strokeStyle = grad2;
      ctx.stroke();

      // Layer 3 (Bluish)
      ctx.beginPath();
      ctx.moveTo(-width * 0.2, height * 0.5 + Math.sin(time * 0.5) * 150);
      ctx.bezierCurveTo(
        width * 0.5, height * 0.2 + Math.cos(time * 1.1) * 130,
        width * 0.8, height * 0.7 + Math.sin(time * 0.7) * 110,
        width * 1.2, height * 0.4 + Math.cos(time * 1.2) * 140
      );

      const grad3 = ctx.createLinearGradient(0, height * 0.15, 0, height * 0.85);
      grad3.addColorStop(0, "rgba(105, 184, 255, 0)");
      grad3.addColorStop(0.5, "rgba(105, 184, 255, 0.15)");
      grad3.addColorStop(1, "rgba(105, 184, 255, 0)");

      ctx.lineWidth = height * 0.45;
      ctx.strokeStyle = grad3;
      ctx.stroke();

      ctx.globalCompositeOperation = 'source-over';
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
