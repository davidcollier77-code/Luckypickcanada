'use client';

import React, { useEffect, useRef } from 'react';
import { createLuckyMeterRingEngine } from './lucky-meter-ring-engine';

/**
 * The Lucky Meter's circular centrepiece.
 *
 * The ring is always mounted, in every state, so the meter never appears only
 * after Start. Its centre is supplied by DailyResonance: a neutral void before
 * the reveal, the scrambling preview during the 4.5 seconds, and the landed
 * percentage plus tier afterwards.
 *
 * All decorative layers are hidden from assistive technology; the centre
 * content is regular DOM text, not canvas pixels.
 *
 * @param {{
 *   phase?: 'idle' | 'scrambling' | 'landed',
 *   compact?: boolean,
 *   children?: React.ReactNode,
 *   className?: string,
 * }} props
 */
export default function LuckyMeterRing({
  phase = 'idle',
  compact = false,
  children,
  className = '',
}) {
  const canvasRef = useRef(null);
  const engineRef = useRef(null);

  useEffect(() => {
    let engine = null;
    try {
      engine = createLuckyMeterRingEngine({ canvas: canvasRef.current });
    } catch {
      engine = null;
    }
    engineRef.current = engine;
    return () => {
      engineRef.current = null;
      engine?.destroy?.();
    };
  }, []);

  useEffect(() => {
    engineRef.current?.setPhase?.(phase);
  }, [phase]);

  return (
    <div
      data-testid="lucky-meter-ring"
      data-phase={phase}
      className={`resonance-ring relative isolate aspect-square shrink-0 ${
        compact ? 'w-[min(52vw,150px)]' : ''
      } ${className}`}
      style={
        compact
          ? undefined
          : {
              // The lower bound keeps the percentage, tier and its message fully
              // inside the inner disc on short landscape viewports instead of
              // clipping them; the upper bound stops the meter dominating the sky.
              width: 'clamp(18rem, min(76vw, 36vh), 23rem)',
              height: 'clamp(18rem, min(76vw, 36vh), 23rem)',
            }
      }
    >
      <div aria-hidden="true" className="resonance-ring-halo absolute -inset-8 rounded-full" />
      <div aria-hidden="true" className="resonance-ring-halo resonance-ring-halo--inner absolute -inset-2 rounded-full" />

      <div aria-hidden="true" className="absolute inset-0 rounded-full border border-amber-200/25 bg-[radial-gradient(circle_at_50%_18%,rgba(52,37,12,0.9),rgba(6,10,14,0.94)_68%)] shadow-[0_0_60px_rgba(234,190,82,0.18),inset_0_0_40px_rgba(0,0,0,0.75)]" />
      <div aria-hidden="true" className="absolute inset-[2.4%] rounded-full border border-amber-200/20" />
      <div aria-hidden="true" className="resonance-ring-etched absolute inset-[6.5%] rounded-full" />
      <div aria-hidden="true" className="resonance-ring-rim absolute inset-[1.2%] rounded-full" />
      <div aria-hidden="true" className="resonance-ring-arc" />
      <div aria-hidden="true" className="resonance-ring-arc resonance-ring-arc--alt" />
      <div aria-hidden="true" className="resonance-ring-arc resonance-ring-arc--spark" />

      <div aria-hidden="true" className="absolute inset-[10%] rounded-full border border-amber-100/10 bg-[radial-gradient(circle_at_50%_12%,rgba(28,22,10,0.6),rgba(2,7,12,0.82)_72%)] shadow-[inset_0_1px_0_rgba(255,240,190,0.14),inset_0_-18px_40px_rgba(0,0,0,0.55)]" />

      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-10 h-full w-full mix-blend-screen"
      />

      {/* Existing golden maple-leaf artwork, used as the ring's crown. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/assets/golden-maple-leaf.svg"
        alt=""
        aria-hidden="true"
        className={`pointer-events-none absolute left-1/2 z-20 -translate-x-1/2 -translate-y-1/2 drop-shadow-[0_0_14px_rgba(255,201,92,0.65)] ${
          compact ? '-top-[2%] w-6' : '-top-[1%] w-11 md:w-12'
        }`}
        loading="eager"
        decoding="async"
      />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/assets/golden-maple-leaf.svg"
        alt=""
        aria-hidden="true"
        className={`pointer-events-none absolute left-1/2 z-20 -translate-x-1/2 translate-y-1/2 rotate-180 drop-shadow-[0_0_14px_rgba(255,201,92,0.55)] ${
          compact ? '-bottom-[2%] w-5' : '-bottom-[1%] w-9 md:w-10'
        }`}
        loading="eager"
        decoding="async"
      />

      <div
        className={`absolute inset-[13%] z-20 flex flex-col items-center justify-center overflow-hidden rounded-full text-center ${
          compact ? 'px-3' : 'px-5 md:px-8'
        }`}
      >
        {children}
      </div>
    </div>
  );
}
