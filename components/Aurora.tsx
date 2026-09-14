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

    const draw = () => {
      // Lerp parameters towards targets for smooth transitions
      const p = params.current;
      if (p.targetSpeed !== undefined) p.speedMultiplier += (p.targetSpeed - p.speedMultiplier) * 0.05;
      if (p.targetPull !== undefined) p.centerPull += (p.targetPull - p.centerPull) * 0.02; // Slower gather
      if (p.targetBrightness !== undefined) p.brightness += (p.targetBrightness - p.brightness) * 0.05;
      if (p.targetGlow !== undefined) p.glow += (p.targetGlow - p.glow) * 0.05;

      time += 0.003 * p.speedMultiplier;

      const width = window.innerWidth;
      const height = window.innerHeight;
      const cx = width / 2;
      const cy = height / 2;

      ctx.clearRect(0, 0, width, height);
      ctx.globalCompositeOperation = 'screen';

      // Apply glow as a soft canvas shadow blur that intensifies with phase (e.g. impact)
      ctx.shadowBlur = p.glow * 60;
      ctx.shadowColor = `rgba(180, 220, 255, ${Math.min(1, p.glow)})`;

      // Layer 1 (Greenish/Teal)
      ctx.beginPath();
      const l1_startY = height * 0.4 + Math.sin(time) * 100;
      const l1_cp1x = width * 0.3;
      const l1_cp1y = height * 0.1 + Math.cos(time * 0.8) * 120;
      const l1_cp2x = width * 0.7;
      const l1_cp2y = height * 0.6 + Math.sin(time * 1.2) * 80;
      const l1_endY = height * 0.2 + Math.cos(time * 1.5) * 100;

      ctx.moveTo(-width * 0.2, l1_startY + (cy - l1_startY) * p.centerPull);
      ctx.bezierCurveTo(
        l1_cp1x + (cx - l1_cp1x) * p.centerPull, l1_cp1y + (cy - l1_cp1y) * p.centerPull,
        l1_cp2x + (cx - l1_cp2x) * p.centerPull, l1_cp2y + (cy - l1_cp2y) * p.centerPull,
        width * 1.2, l1_endY + (cy - l1_endY) * p.centerPull
      );

      const grad1 = ctx.createLinearGradient(0, height * 0.1, 0, height * 0.8);
      grad1.addColorStop(0, `rgba(24, 208, 132, 0)`);
      grad1.addColorStop(0.5, `rgba(24, 208, 132, ${0.25 * p.brightness})`);
      grad1.addColorStop(1, `rgba(24, 208, 132, 0)`);

      ctx.lineWidth = height * 0.4 * (1 - p.centerPull * 0.5); // Thinner when gathered
      ctx.strokeStyle = grad1;
      ctx.stroke();

      // Layer 2 (Purplish/Blue)
      ctx.beginPath();
      const l2_startY = height * 0.6 + Math.cos(time * 1.1) * 80;
      const l2_cp1x = width * 0.4;
      const l2_cp1y = height * 0.8 + Math.sin(time * 0.9) * 100;
      const l2_cp2x = width * 0.6;
      const l2_cp2y = height * 0.3 + Math.cos(time * 1.3) * 120;
      const l2_endY = height * 0.5 + Math.sin(time * 1.4) * 90;

      ctx.moveTo(-width * 0.2, l2_startY + (cy - l2_startY) * p.centerPull);
      ctx.bezierCurveTo(
        l2_cp1x + (cx - l2_cp1x) * p.centerPull, l2_cp1y + (cy - l2_cp1y) * p.centerPull,
        l2_cp2x + (cx - l2_cp2x) * p.centerPull, l2_cp2y + (cy - l2_cp2y) * p.centerPull,
        width * 1.2, l2_endY + (cy - l2_endY) * p.centerPull
      );

      const grad2 = ctx.createLinearGradient(0, height * 0.2, 0, height * 0.9);
      grad2.addColorStop(0, `rgba(151, 78, 240, 0)`);
      grad2.addColorStop(0.5, `rgba(151, 78, 240, ${0.2 * p.brightness})`);
      grad2.addColorStop(1, `rgba(151, 78, 240, 0)`);

      ctx.lineWidth = height * 0.5 * (1 - p.centerPull * 0.5);
      ctx.strokeStyle = grad2;
      ctx.stroke();

      // Layer 3 (Cyan/Bluish)
      ctx.beginPath();
      const l3_startY = height * 0.5 + Math.sin(time * 0.5) * 150;
      const l3_cp1x = width * 0.5;
      const l3_cp1y = height * 0.2 + Math.cos(time * 1.1) * 130;
      const l3_cp2x = width * 0.8;
      const l3_cp2y = height * 0.7 + Math.sin(time * 0.7) * 110;
      const l3_endY = height * 0.4 + Math.cos(time * 1.2) * 140;

      ctx.moveTo(-width * 0.2, l3_startY + (cy - l3_startY) * p.centerPull);
      ctx.bezierCurveTo(
        l3_cp1x + (cx - l3_cp1x) * p.centerPull, l3_cp1y + (cy - l3_cp1y) * p.centerPull,
        l3_cp2x + (cx - l3_cp2x) * p.centerPull, l3_cp2y + (cy - l3_cp2y) * p.centerPull,
        width * 1.2, l3_endY + (cy - l3_endY) * p.centerPull
      );

      const grad3 = ctx.createLinearGradient(0, height * 0.15, 0, height * 0.85);
      grad3.addColorStop(0, `rgba(105, 184, 255, 0)`);
      grad3.addColorStop(0.5, `rgba(105, 184, 255, ${0.15 * p.brightness})`);
      grad3.addColorStop(1, `rgba(105, 184, 255, 0)`);

      ctx.lineWidth = height * 0.45 * (1 - p.centerPull * 0.5);
      ctx.strokeStyle = grad3;
      ctx.stroke();

      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1.0;
      ctx.shadowBlur = 0;

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
