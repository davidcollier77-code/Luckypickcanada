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

      time += (isReducedMotion ? 0.0005 : 0.001) * p.speedMultiplier;

      const width = window.innerWidth;
      const height = window.innerHeight;
      const cx = width / 2;
      const cy = height / 2;

      ctx.clearRect(0, 0, width, height);
      ctx.globalCompositeOperation = 'screen';

      // Greatly reduce the base opacity so it's a subtle atmospheric effect over the photograph
      const baseOpacity = p.brightness * 0.12;

      // Wisp 1: Green/Teal (Subtle, wide band near bottom/mid)
      drawWisp(ctx,
        cx + Math.sin(time * 0.5) * width * 0.2,
        cy + height * 0.2 + Math.cos(time * 0.3) * height * 0.1,
        Math.PI * -0.05 + Math.sin(time * 0.2) * 0.05,
        width * 1.2 * (1 - p.centerPull * 0.2),
        height * 0.6,
        '40, 200, 150', // Teal/Green
        baseOpacity * 0.8
      );

      // Wisp 2: Cyan (Soft layered band)
      drawWisp(ctx,
        cx + Math.cos(time * 0.4) * width * 0.15,
        cy + height * 0.1 + Math.sin(time * 0.5) * height * 0.15,
        Math.PI * 0.05 + Math.cos(time * 0.3) * 0.05,
        width * 1.0 * (1 - p.centerPull * 0.3),
        height * 0.5,
        '20, 220, 255', // Cyan
        baseOpacity * 0.7
      );

      // Wisp 3: Subtle Violet (High atmosphere)
      drawWisp(ctx,
        cx + Math.sin(time * 0.6) * width * 0.25,
        cy - height * 0.1 + Math.cos(time * 0.4) * height * 0.1,
        Math.PI * -0.02 + Math.sin(time * 0.5) * 0.05,
        width * 0.9 * (1 - p.centerPull * 0.2),
        height * 0.7,
        '120, 80, 220', // Violet
        baseOpacity * 0.5
      );

      // Wisp 4: Anchor glow (Center pull / impact effect)
      if (p.centerPull > 0) {
        drawWisp(ctx,
          cx,
          cy + height * 0.1, // slightly lower center
          0,
          width * 0.5 * p.centerPull,
          height * 0.6 * p.centerPull,
          '100, 255, 200',
          (p.glow * 0.3) // constrained glow
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
