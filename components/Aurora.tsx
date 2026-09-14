"use client";
import React, { useEffect, useRef, useImperativeHandle, forwardRef } from "react";

export interface AuroraHandle {
  setPhase: (phase: 'idle' | 'awaken' | 'gather' | 'impact' | 'settled', tier?: string) => void;
}

const Aurora = forwardRef<AuroraHandle, {}>((props, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Animation state parameters
  const params = useRef({
    speedMultiplier: 1.0,
    centerPull: 0.0, // 0 = normal flow, 1 = tightly gathered in center
    brightness: 0.5,
    glow: 0.0,
    yOffset: 0.0, targetSpeed: 0.5, targetPull: 0.0, targetBrightness: 0.3, targetGlow: 0.0
  });

  useImperativeHandle(ref, () => ({
    setPhase: (phase, tier) => {
      // We use simple transitions here.
      // In a real GSAP setup, we could tween these params,
      // but for simplicity we'll animate them in the draw loop towards target values.
      switch(phase) {
        case 'idle':
          params.current = { ...params.current, targetSpeed: 0.5, targetPull: 0.0, targetBrightness: 0.3, targetGlow: 0.0 };
          break;
        case 'awaken':
          params.current = { ...params.current, targetSpeed: 1.5, targetPull: 0.3, targetBrightness: 0.6, targetGlow: 0.2 };
          break;
        case 'gather':
          params.current = { ...params.current, targetSpeed: 3.0, targetPull: 0.8, targetBrightness: 1.0, targetGlow: 0.5 };
          break;
        case 'impact':
          params.current = { ...params.current, targetSpeed: 4.0, targetPull: 0.9, targetBrightness: 1.5, targetGlow: 1.0 };
          break;
        case 'settled':
          // Slightly different based on tier, but mostly relaxed
          let targetB = 0.6;
          if (tier === 'Cosmic Lightning') targetB = 0.8;
          if (tier === 'Fireworks') targetB = 1.0;
          params.current = { ...params.current, targetSpeed: 0.8, targetPull: 0.2, targetBrightness: targetB, targetGlow: 0.4 };
          break;
      }
    }
  }));

  useEffect(() => {
    // Initialize targets to current
    params.current.targetSpeed = 0.5;
    params.current.targetPull = 0.0;
    params.current.targetBrightness = 0.3;
    params.current.targetGlow = 0.0;
  }, []);

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


    const isReducedMotion = typeof window !== 'undefined' ? window.matchMedia('(prefers-reduced-motion: reduce)').matches : false;

    const drawWisp = (ctx, x, y, angle, w, h, colorRGB, opacity) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle);
      ctx.scale(w / 100, h / 100);
      const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, 100);
      grad.addColorStop(0, `rgba(${colorRGB}, ${opacity})`);
      grad.addColorStop(0.4, `rgba(${colorRGB}, ${opacity * 0.4})`);
      grad.addColorStop(1, `rgba(${colorRGB}, 0)`);
      ctx.fillStyle = grad;
      ctx.fillRect(-100, -100, 200, 200);
      ctx.restore();
    };

    const draw = () => {
      const p = params.current;
      if (p.targetSpeed !== undefined) p.speedMultiplier += (p.targetSpeed - p.speedMultiplier) * 0.05;
      if (p.targetPull !== undefined) p.centerPull += (p.targetPull - p.centerPull) * 0.02;
      if (p.targetBrightness !== undefined) p.brightness += (p.targetBrightness - p.brightness) * 0.05;
      if (p.targetGlow !== undefined) p.glow += (p.targetGlow - p.glow) * 0.05;

      time += (isReducedMotion ? 0.0005 : 0.002) * p.speedMultiplier;

      const width = window.innerWidth;
      const height = window.innerHeight;
      const cx = width / 2;
      const cy = height / 2;

      ctx.clearRect(0, 0, width, height);
      ctx.globalCompositeOperation = 'screen';

      const baseOpacity = p.brightness * 0.35;

      // Wisp 1: Deep Teal/Cyan
      drawWisp(ctx,
        cx + Math.sin(time * 0.8) * width * 0.3,
        cy + Math.cos(time * 0.5) * height * 0.1,
        Math.PI * -0.15 + Math.sin(time * 0.4) * 0.1,
        width * 0.8 * (1 - p.centerPull * 0.4),
        height * 1.5,
        '20, 180, 200',
        baseOpacity * 0.8
      );

      // Wisp 2: Cool Violet
      drawWisp(ctx,
        cx + Math.cos(time * 0.6) * width * 0.25,
        cy + Math.sin(time * 0.7) * height * 0.2,
        Math.PI * 0.1 + Math.cos(time * 0.5) * 0.1,
        width * 0.7 * (1 - p.centerPull * 0.5),
        height * 1.6,
        '70, 50, 180',
        baseOpacity * 0.6
      );

      // Wisp 3: Subtle Navy/Blue
      drawWisp(ctx,
        cx + Math.sin(time * 0.9) * width * 0.4,
        cy + Math.cos(time * 0.8) * height * 0.15,
        Math.PI * -0.05 + Math.sin(time * 0.6) * 0.1,
        width * 0.9 * (1 - p.centerPull * 0.3),
        height * 1.4,
        '30, 100, 220',
        baseOpacity * 0.7
      );

      // Wisp 4: Anchor glow for gather/impact
      if (p.centerPull > 0) {
        drawWisp(ctx,
          cx,
          cy,
          0,
          width * 0.6 * p.centerPull,
          height * 0.8 * p.centerPull,
          '100, 220, 255',
          p.glow * 0.5
        );
      }

      ctx.globalCompositeOperation = 'source-over';
      animationFrameId = requestAnimationFrame(draw);
    };

    const handleResize = () => {
      initCanvas();
      // Cancel the pending animation frame to prevent duplicate animation loops,
      // then restart the draw loop so the Aurora keeps rendering after resize.
      cancelAnimationFrame(animationFrameId);
      draw();
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
});

export default Aurora;
