'use client';

import React, { useEffect, useRef, useState } from 'react';
import { createLuckyMeterMedallionEngine } from './lucky-meter-medallion-engine';

/**
 * The Lucky Meter's circular centrepiece.
 *
 * The meter is always mounted, in every state, so it never appears only after
 * Start. Its centre is supplied by DailyResonance: a neutral void before the
 * reveal, the scrambling preview during the 4.5 seconds, and the landed
 * percentage plus tier afterwards.
 *
 * The disc itself is drawn as lit three-dimensional geometry by a small WebGL
 * renderer. Until that renderer has produced a frame — and permanently on a
 * browser without WebGL — the static metallic fallback below it is shown
 * instead, so the meter is never a blank hole. The leaf ornaments that used to
 * crown the ring are now part of the scene as dimensional gold ornaments; the
 * static pair is kept only inside the fallback so that path looks unchanged.
 *
 * All decorative layers are hidden from assistive technology; the centre
 * content is regular DOM text, not canvas pixels.
 *
 * The `dialAngle` is the pointer's absolute rotation in degrees. DailyResonance
 * animates it from the generated spin to the exact angle for the result, so the
 * pointer's resting position is the displayed percentage.
 *
 * @param {{
 *   phase?: 'idle' | 'scrambling' | 'landed',
 *   compact?: boolean,
 *   dialAngle?: number | null,
 *   children?: React.ReactNode,
 *   className?: string,
 * }} props
 */
export default function LuckyMeterRing({
  phase = 'idle',
  compact = false,
  dialAngle = null,
  children,
  className = '',
}) {
  const canvasRef = useRef(null);
  const engineRef = useRef(null);
  const [renderMode, setRenderMode] = useState('pending');

  useEffect(() => {
    let engine = null;
    try {
      engine = createLuckyMeterMedallionEngine({
        canvas: canvasRef.current,
        interactive: !compact,
        onReady: () => setRenderMode('gpu'),
        onUnavailable: () => setRenderMode('fallback'),
      });
    } catch {
      engine = null;
    }
    engineRef.current = engine;
    if (!engine) setRenderMode('fallback');
    return () => {
      engineRef.current = null;
      engine?.destroy?.();
    };
  }, [compact]);

  useEffect(() => {
    engineRef.current?.setPhase?.(phase);
  }, [phase]);

  const showFallback = renderMode !== 'gpu';

  return (
    <div
      data-testid="lucky-meter-ring"
      data-phase={phase}
      data-medallion={renderMode}
      data-dial-angle={
        typeof dialAngle === 'number' && Number.isFinite(dialAngle)
          ? dialAngle.toFixed(2)
          : undefined
      }
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
      {/* Warm bloom around the object. It sits behind the medallion so the gold
          reads as though it is casting light into the sky. */}
      <div aria-hidden="true" className="resonance-ring-halo absolute -inset-8 rounded-full" />

      {showFallback && (
        <div aria-hidden="true" className="resonance-medallion-fallback absolute inset-0">
          <div className="resonance-ring-halo resonance-ring-halo--inner absolute -inset-2 rounded-full" />
          <div className="absolute inset-0 rounded-full border border-amber-200/25 bg-[radial-gradient(circle_at_50%_18%,rgba(52,37,12,0.9),rgba(6,10,14,0.94)_68%)] shadow-[0_0_60px_rgba(234,190,82,0.18),inset_0_0_40px_rgba(0,0,0,0.75)]" />
          <div className="absolute inset-[2.4%] rounded-full border border-amber-200/20" />
          <div className="resonance-ring-etched absolute inset-[6.5%] rounded-full" />
          <div className="resonance-ring-rim absolute inset-[1.2%] rounded-full" />
          <div className="resonance-ring-arc" />
          <div className="absolute inset-[10%] rounded-full border border-amber-100/10 bg-[radial-gradient(circle_at_50%_12%,rgba(28,22,10,0.6),rgba(2,7,12,0.82)_72%)] shadow-[inset_0_1px_0_rgba(255,240,190,0.14),inset_0_-18px_40px_rgba(0,0,0,0.55)]" />

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
        </div>
      )}

      <canvas
        ref={canvasRef}
        aria-hidden="true"
        data-testid="lucky-meter-medallion"
        className={`pointer-events-none absolute inset-0 z-10 h-full w-full transition-opacity duration-300 ${
          renderMode === 'gpu' ? 'opacity-100' : 'opacity-0'
        }`}
      />

      {/* Pointer. It rides the milled rim and stops on the result's exact angle;
          it is decorative because the percentage is real DOM text. */}
      {typeof dialAngle === 'number' && Number.isFinite(dialAngle) && (
        <div
          aria-hidden="true"
          data-testid="lucky-meter-dial"
          className="pointer-events-none absolute inset-0 z-[16] rounded-full"
          // The pointer's geometry and metal are inline on purpose: the index is
          // the proof of where the dial stopped, so it must not depend on a
          // stylesheet surviving the production CSS build.
          style={{
            transform: `rotate(${dialAngle}deg)`,
            transformOrigin: '50% 50%',
            // Only the spin needs a compositor hint; a static dial keeps the
            // default, matching the reduced-motion override the old CSS had.
            willChange: phase === 'scrambling' ? 'transform' : 'auto',
          }}
        >
          <span
            data-testid="lucky-meter-dial-arm"
            style={{
              position: 'absolute',
              left: '50%',
              top: '2.6%',
              width: '2px',
              height: '16%',
              transform: 'translateX(-50%)',
              borderRadius: '9999px',
              backgroundImage:
                'linear-gradient(180deg, #fffbe4 0%, #ffdc92 34%, #e5b257 72%, rgba(229, 178, 87, 0) 100%)',
              boxShadow: '0 0 10px rgba(255, 206, 120, 0.75), 0 0 2px rgba(255, 248, 220, 0.9)',
            }}
          />
          <span
            data-testid="lucky-meter-dial-head"
            style={{
              position: 'absolute',
              left: '50%',
              top: '1.1%',
              width: '9px',
              height: '9px',
              transform: 'translateX(-50%)',
              borderRadius: '9999px',
              backgroundImage:
                'radial-gradient(circle at 34% 28%, #fffdf0 0%, #ffe4a0 38%, #e0a83f 74%, #a4721c 100%)',
              boxShadow:
                phase === 'scrambling'
                  ? '0 0 22px rgba(255, 224, 154, 0.95), 0 1px 2px rgba(0, 0, 0, 0.65)'
                  : '0 0 16px rgba(255, 214, 130, 0.85), 0 1px 2px rgba(0, 0, 0, 0.65)',
            }}
          />
        </div>
      )}

      {/* Readability scrim: a very soft inner shadow keeps gold type legible on
          the enamel well without hiding the lit bevel behind the text. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-[13%] z-[15] rounded-full shadow-[inset_0_1px_2px_rgba(0,0,0,0.55),inset_0_-10px_26px_rgba(0,0,0,0.35)]"
      />

      <div
        className={`absolute inset-[13%] z-20 flex min-w-0 flex-col items-center justify-center overflow-hidden rounded-full text-center ${
          compact ? 'px-3' : 'px-5 md:px-7'
        }`}
      >
        {children}
      </div>
    </div>
  );
}
