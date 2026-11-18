'use client';

import React, { useEffect, useRef, useState } from 'react';
import { createLuckyMeterMedallionEngine } from './lucky-meter-medallion-engine';
import { COLOURS, LUCKY_NUMBER_MAX, LUCKY_NUMBER_MIN } from '../app/lib/lucky-meter/config';
import {
  DEGREES_PER_COLOUR,
  NUMBER_STEPS,
  getColourIndex,
} from '../app/lib/lucky-meter/reveal';

const COLOUR_GAP_DEGREES = 3;

/** Point on a circle where 0° is 12 o'clock and angles run clockwise. */
function polar(radius, degrees) {
  const radians = (degrees * Math.PI) / 180;
  return {
    x: 50 + radius * Math.sin(radians),
    y: 50 - radius * Math.cos(radians),
  };
}

function arcPath(radius, startDegrees, endDegrees) {
  const start = polar(radius, startDegrees);
  const end = polar(radius, endDegrees);
  const largeArc = endDegrees - startDegrees > 180 ? 1 : 0;
  return `M ${start.x.toFixed(3)} ${start.y.toFixed(3)} A ${radius} ${radius} 0 ${largeArc} 1 ${end.x.toFixed(3)} ${end.y.toFixed(3)}`;
}

/**
 * The Lucky Meter's circular centrepiece.
 *
 * The meter is always mounted, in every state, so it never appears only after
 * Start. Its centre is supplied by DailyResonance: a neutral void before the
 * reveal, the scrambling preview during the spin, and the landed percentage
 * plus tier afterwards.
 *
 * The disc itself is drawn as lit three-dimensional geometry by a small WebGL
 * renderer. Until that renderer has produced a frame — and permanently on a
 * browser without WebGL — the static metallic fallback below it is shown
 * instead, so the meter is never a blank hole.
 *
 * Two other dials read the independent choices that were already made:
 *
 * - The outer bezel carries one tick per Lucky Number (1–50) and its own small
 *   pointer. The pointer spins and lands on the number's sector; it never
 *   represents the percentage.
 * - A thin segmented inner ring inside the gold bezel carries the twelve
 *   approved Lucky Colours. The ring spins as one piece and settles with the
 *   already-selected colour under its marker, so it displays the choice without
 *   ever making one, and it sits outside the copy well so the percentage stays
 *   fully legible.
 *
 * All decorative layers are hidden from assistive technology; the centre
 * content is regular DOM text, not canvas pixels.
 *
 * @param {{
 *   phase?: 'idle' | 'scrambling' | 'landed',
 *   compact?: boolean,
 *   dialAngle?: number | null,
 *   numberAngle?: number | null,
 *   number?: number | null,
 *   numberSettled?: boolean,
 *   colourRotation?: number | null,
 *   colourId?: string | null,
 *   colourSettled?: boolean,
 *   children?: React.ReactNode,
 *   className?: string,
 * }} props
 */
export default function LuckyMeterRing({
  phase = 'idle',
  compact = false,
  dialAngle = null,
  numberAngle = null,
  number = null,
  numberSettled = false,
  colourRotation = null,
  colourId = null,
  colourSettled = false,
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

  const hasDialAngle = typeof dialAngle === 'number' && Number.isFinite(dialAngle);
  const hasNumberAngle = typeof numberAngle === 'number' && Number.isFinite(numberAngle);
  const hasColourRotation =
    typeof colourRotation === 'number' && Number.isFinite(colourRotation);
  const shownNumber =
    Number.isInteger(number) && number >= LUCKY_NUMBER_MIN && number <= LUCKY_NUMBER_MAX
      ? number
      : null;
  const selectedColourIndex = colourId ? getColourIndex(colourId) : -1;

  // Badge position follows the pointer so the value it reads is at the pointer.
  const badge = hasNumberAngle ? polar(39.4, numberAngle) : null;

  return (
    <div
      data-testid="lucky-meter-ring"
      data-phase={phase}
      data-medallion={renderMode}
      data-dial-angle={hasDialAngle ? dialAngle.toFixed(2) : undefined}
      data-number-angle={hasNumberAngle ? numberAngle.toFixed(2) : undefined}
      data-number={shownNumber ?? undefined}
      data-number-settled={numberSettled ? 'true' : 'false'}
      data-colour-angle={hasColourRotation ? colourRotation.toFixed(2) : undefined}
      data-colour-id={colourId ?? undefined}
      data-colour-settled={colourSettled ? 'true' : 'false'}
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
              width: 'clamp(17rem, min(70vw, 34vh), 23rem)',
              height: 'clamp(17rem, min(70vw, 34vh), 23rem)',
            }
      }
    >
      {/* Warm bloom around the object. It sits behind the medallion so the gold
          reads as though it is casting light into the sky. */}
      <div aria-hidden="true" className="resonance-ring-halo absolute -inset-8 rounded-full" />

      {/* Contact shadow. The disc is a raised object above the scene, so it
          needs a grounded shadow beneath it rather than a halo alone. */}
      <div
        aria-hidden="true"
        data-testid="lucky-meter-contact-shadow"
        className="resonance-medallion-contact absolute -bottom-[5%] left-1/2 h-[10%] w-[72%] -translate-x-1/2 rounded-[50%]"
      />

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

      {/* Segmented Lucky Colour ring: a thin band of the twelve approved colours
          on the raised inner bezel. It is display only — the colour was chosen
          before any animation began. */}
      <svg
        aria-hidden="true"
        viewBox="0 0 100 100"
        data-testid="lucky-meter-colour-ring"
        className="pointer-events-none absolute inset-0 z-[14] h-full w-full"
      >
        <g
          style={{
            transform: hasColourRotation ? `rotate(${colourRotation}deg)` : 'rotate(0deg)',
            transformOrigin: '50px 50px',
            willChange: phase === 'scrambling' ? 'transform' : 'auto',
          }}
        >
          {COLOURS.map((colour, index) => {
            const centre = index * DEGREES_PER_COLOUR;
            const isSelected = colourSettled && index === selectedColourIndex;
            return (
              <path
                key={colour.id}
                data-testid={`lucky-meter-colour-segment-${colour.id}`}
                d={arcPath(
                  38.7,
                  centre - DEGREES_PER_COLOUR / 2 + COLOUR_GAP_DEGREES / 2,
                  centre + DEGREES_PER_COLOUR / 2 - COLOUR_GAP_DEGREES / 2,
                )}
                fill="none"
                stroke={colour.hex}
                strokeWidth={isSelected ? 2.6 : 1.9}
                strokeLinecap="round"
                opacity={isSelected ? 1 : 0.52}
                style={
                  isSelected
                    ? { filter: `drop-shadow(0 0 2.4px ${colour.hex})` }
                    : undefined
                }
              />
            );
          })}
        </g>
        {/* Fixed marker for the settled colour. */}
        <polygon
          points="50,34.4 48.4,36.8 51.6,36.8"
          fill="rgba(255, 228, 166, 0.85)"
          opacity={colourSettled ? 0.95 : 0.4}
        />
      </svg>

      {/* Lucky Number bezel: one tick per number, a labelled scale every fifth
          number, and a pointer that lands on the sector it already selected. */}
      <div
        aria-hidden="true"
        data-testid="lucky-meter-number-dial"
        className="pointer-events-none absolute -inset-[9%] z-[17]"
      >
        <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full">
          <g>
            {Array.from({ length: NUMBER_STEPS }, (_, index) => {
              const angle = (index * 360) / NUMBER_STEPS + 360 / NUMBER_STEPS / 2;
              const major = (LUCKY_NUMBER_MIN + index) % 5 === 0;
              return (
                <line
                  key={`tick-${index}`}
                  x1="50"
                  y1={major ? 4.4 : 4.9}
                  x2="50"
                  y2={major ? 7.2 : 6.4}
                  transform={`rotate(${angle} 50 50)`}
                  stroke="rgba(255, 219, 150, 0.3)"
                  strokeWidth={major ? 0.5 : 0.28}
                  strokeLinecap="round"
                />
              );
            })}
          </g>
          {hasNumberAngle && (
            <g style={{ transform: `rotate(${numberAngle}deg)`, transformOrigin: '50px 50px' }}>
              <polygon
                points="50,2.6 47.4,8.4 52.6,8.4"
                fill="url(#lucky-number-pointer)"
                stroke="rgba(58, 39, 12, 0.55)"
                strokeWidth="0.35"
              />
              <defs>
                <linearGradient id="lucky-number-pointer" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#fff6da" />
                  <stop offset="55%" stopColor="#f0c56a" />
                  <stop offset="100%" stopColor="#a4721c" />
                </linearGradient>
              </defs>
            </g>
          )}
          {badge && shownNumber !== null && (
            <g data-testid="lucky-meter-number-badge">
              <circle
                cx={badge.x}
                cy={badge.y}
                r="4.5"
                fill="rgba(6, 10, 14, 0.88)"
                stroke={numberSettled ? 'rgba(255, 226, 160, 0.95)' : 'rgba(255, 219, 150, 0.5)'}
                strokeWidth="0.55"
              />
              <text
                x={badge.x}
                y={badge.y + 1.5}
                textAnchor="middle"
                fontSize="4.3"
                fontWeight="700"
                fill="#ffe7b0"
                style={{ fontVariantNumeric: 'tabular-nums' }}
              >
                {shownNumber}
              </text>
            </g>
          )}
        </svg>
      </div>

      {/* Percentage pointer. It rides the milled rim and stops on the result's
          exact angle; it is decorative because the percentage is real DOM text. */}
      {hasDialAngle && (
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
