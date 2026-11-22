'use client';

import React, { useEffect, useRef, useState } from 'react';
import { createLuckyMeterMedallionEngine } from './lucky-meter-medallion-engine';
import { LUCKY_NUMBER_MAX, LUCKY_NUMBER_MIN } from '../app/lib/lucky-meter/config';
import { getColourIndex } from '../app/lib/lucky-meter/reveal';

/**
 * Geometry of the twelve-segment wheel, in the shared 100×100 view box.
 *
 * The band is deliberately narrower than the coin: with the previous 43.4/31.2
 * radii the wheel covered almost the entire struck face, so the milled rim, the
 * raised bezel and the enamel well the medallion renderer draws were invisible.
 * Pulling it in to 38.6/28.8 leaves a broad lit gold face around the pigments
 * and a larger recessed well, which is what makes the object read as a coin.
 */
const WHEEL_OUTER_RADIUS = 38.6;
const WHEEL_INNER_RADIUS = 28.8;
const SEGMENT_GAP_DEGREES = 2.4;

/** The maple-leaf pointer, drawn as a filled gold silhouette with a stem. */
const POINTER_PATH =
  'M50 3 C52.5 10 55 14 59 16.5 C57.3 19.2 57.8 22.1 60.6 24.6 ' +
  'C62.6 20.8 66.1 18.4 70.6 18.2 C69.3 22.8 70.4 27.2 73.4 30.7 ' +
  'C69.4 32.5 66.6 35.6 64.7 39.5 C69.9 41.2 73.9 44.7 76.6 49.3 ' +
  'C71.4 51.8 67.4 55.9 64.9 60.9 C62.5 57.1 58.9 54.5 54.9 53.8 ' +
  'C54.6 61.3 56.6 68.6 60.6 75 L52.4 73.5 L50 88 L47.6 73.5 L39.4 75 ' +
  'C43.4 68.6 45.4 61.3 45.1 53.8 C41.1 54.5 37.5 57.1 35.1 60.9 ' +
  'C32.6 55.9 28.6 51.8 23.4 49.3 C26.1 44.7 30.1 41.2 35.3 39.5 ' +
  'C33.4 35.6 30.6 32.5 26.6 30.7 C29.6 27.2 30.7 22.8 29.4 18.2 ' +
  'C33.9 18.4 37.4 20.8 39.4 24.6 C42.2 22.1 42.7 19.2 41 16.5 ' +
  'C45 14 47.5 10 50 3 Z';

/** Annulus used to clip the pigment grain to the wheel band. */
const WHEEL_CLIP_PATH =
  'M 50 50 m -38.4 0 a 38.4 38.4 0 1 0 76.8 0 a 38.4 38.4 0 1 0 -76.8 0 ' +
  'M 50 50 m -28.6 0 a 28.6 28.6 0 1 0 57.2 0 a 28.6 28.6 0 1 0 -57.2 0';

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

/** Point on a circle where 0° is 12 o'clock and angles run clockwise. */
function polar(radius, degrees) {
  const radians = (degrees * Math.PI) / 180;
  return {
    x: 50 + radius * Math.sin(radians),
    y: 50 - radius * Math.cos(radians),
  };
}

/** One annular sector as an SVG path. */
function annularSector(innerRadius, outerRadius, startDegrees, endDegrees) {
  const outerStart = polar(outerRadius, startDegrees);
  const outerEnd = polar(outerRadius, endDegrees);
  const innerEnd = polar(innerRadius, endDegrees);
  const innerStart = polar(innerRadius, startDegrees);
  const largeArc = endDegrees - startDegrees > 180 ? 1 : 0;
  return [
    `M ${outerStart.x.toFixed(3)} ${outerStart.y.toFixed(3)}`,
    `A ${outerRadius} ${outerRadius} 0 ${largeArc} 1 ${outerEnd.x.toFixed(3)} ${outerEnd.y.toFixed(3)}`,
    `L ${innerEnd.x.toFixed(3)} ${innerEnd.y.toFixed(3)}`,
    `A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${innerStart.x.toFixed(3)} ${innerStart.y.toFixed(3)}`,
    'Z',
  ].join(' ');
}

function parseHex(hex) {
  const value = String(hex || '').replace('#', '');
  if (!/^[0-9a-f]{6}$/i.test(value)) return [128, 128, 128];
  return [
    Number.parseInt(value.slice(0, 2), 16),
    Number.parseInt(value.slice(2, 4), 16),
    Number.parseInt(value.slice(4, 6), 16),
  ];
}

function channelToHex(channel) {
  return clamp(Math.round(channel), 0, 255).toString(16).padStart(2, '0');
}

/**
 * Mixes a colour toward white (positive) or black (negative). Used only for the
 * painted gradient around the exact stored HEX value, never to change it.
 */
function shade(hex, amount) {
  const [red, green, blue] = parseHex(hex);
  const target = amount >= 0 ? 255 : 0;
  const mix = Math.abs(amount);
  return `#${channelToHex(red + (target - red) * mix)}${channelToHex(
    green + (target - green) * mix,
  )}${channelToHex(blue + (target - blue) * mix)}`;
}

/**
 * The Lucky Meter's circular centrepiece.
 *
 * A lit WebGL medallion provides the struck gold body, the milled rim, the
 * recessed enamel well and the moving key light. Inside it sits the seasonal
 * colour wheel: twelve bevel-edged segments with a fine pigment grain, rotating
 * beneath a fixed gold maple-leaf pointer at 6 o'clock.
 *
 * The selected segment opens and drains downward while the Lucky Number is
 * exposed in the well behind it. The pour is a continuous column from the
 * segment into the colour result area below, not a detached overlay. Every
 * colour is painted from the stored HEX value, so the wheel, the pour and the
 * card cannot disagree.
 *
 * Until the WebGL renderer has produced a frame — and permanently on a browser
 * without WebGL — the static metallic fallback below the canvas is shown, so the
 * meter is never a blank hole. The wheel itself is vector geometry at any device
 * pixel ratio, so it stays crisp on every screen.
 *
 * @param {object} props
 * @param {'idle'|'spin'|'landed'|'pouring'|'revealed'} [props.phase]
 * @param {boolean} [props.compact]
 * @param {number|null} [props.wheelAngle]
 * @param {ReadonlyArray<object>} [props.colours]
 * @param {string|null} [props.colourId]
 * @param {boolean} [props.colourSettled]
 * @param {number|null} [props.number]
 * @param {boolean} [props.numberSettled]
 * @param {number} [props.numberReveal]
 * @param {number} [props.pourProgress]
 * @param {React.ReactNode} [props.children]
 * @param {string} [props.className]
 */
export default function LuckyMeterRing({
  phase = 'idle',
  compact = false,
  wheelAngle = null,
  colours = [],
  colourId = null,
  colourSettled = false,
  number = null,
  numberSettled = false,
  numberReveal = 0,
  pourProgress = 0,
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
  const hasWheelAngle = typeof wheelAngle === 'number' && Number.isFinite(wheelAngle);
  const rotation = hasWheelAngle ? wheelAngle : 0;
  const palette = Array.isArray(colours) ? colours : [];
  const selectedIndex = colourId ? getColourIndex(colourId, palette) : -1;
  const selected = selectedIndex >= 0 ? palette[selectedIndex] : null;
  const shownNumber =
    Number.isInteger(number) && number >= LUCKY_NUMBER_MIN && number <= LUCKY_NUMBER_MAX
      ? number
      : null;
  const drain = clamp(Number(pourProgress) || 0, 0, 1);
  const reveal = clamp(Number(numberReveal) || 0, 0, 1);
  const isPouring = phase === 'pouring' && drain > 0;
  const isSpinning = phase === 'spin';

  // The fixed pointer's sector. The wheel stops with the selected segment here.
  const pointerStart = 180 - 15 + SEGMENT_GAP_DEGREES / 2;
  const pointerEnd = 180 + 15 - SEGMENT_GAP_DEGREES / 2;
  const drainClip = annularSector(WHEEL_INNER_RADIUS, WHEEL_OUTER_RADIUS, pointerStart, pointerEnd);
  const wetEdgeY = 50 + WHEEL_INNER_RADIUS + drain * (WHEEL_OUTER_RADIUS - WHEEL_INNER_RADIUS);

  return (
    <div
      data-testid="lucky-meter-ring"
      data-phase={phase}
      data-medallion={renderMode}
      data-wheel-angle={hasWheelAngle ? rotation.toFixed(2) : undefined}
      data-colour-id={selected?.id ?? undefined}
      data-colour-settled={colourSettled ? 'true' : 'false'}
      data-number={shownNumber ?? undefined}
      data-number-settled={numberSettled ? 'true' : 'false'}
      data-number-reveal={reveal.toFixed(2)}
      data-pour={drain.toFixed(3)}
      data-pointer="6"
      className={`resonance-ring relative isolate aspect-square shrink-0 ${
        compact ? 'w-[min(56vw,168px)]' : ''
      } ${className}`}
      style={
        compact
          ? undefined
          : {
              width: 'clamp(17rem, min(74vw, 36vh), 23.5rem)',
              height: 'clamp(17rem, min(74vw, 36vh), 23.5rem)',
            }
      }
    >
      {/* Warm bloom around the object. It sits behind the medallion so the gold
          reads as though it is casting light into the sky. */}
      <div aria-hidden="true" className="resonance-ring-halo absolute -inset-8 rounded-full" />

      {/* Contact shadow: the disc is a raised object above the scene. */}
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

      {palette.length > 0 && (
        <svg
          aria-hidden="true"
          viewBox="0 0 100 100"
          data-testid="lucky-meter-wheel"
          className="pointer-events-none absolute inset-0 z-[12] h-full w-full overflow-visible"
        >
          <defs>
            {palette.map((colour) => (
              <radialGradient
                key={`wheel-gradient-${colour.id}`}
                id={`lucky-wheel-${colour.id}`}
                gradientUnits="userSpaceOnUse"
                cx="50"
                cy="50"
                r={WHEEL_OUTER_RADIUS}
              >
                <stop offset="0.68" stopColor={shade(colour.hex, 0.2)} />
                <stop offset="0.86" stopColor={colour.hex} />
                <stop offset="1" stopColor={shade(colour.hex, -0.26)} />
              </radialGradient>
            ))}
            <linearGradient id="lucky-wheel-sheen" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgba(255, 248, 224, 0.3)" />
              <stop offset="34%" stopColor="rgba(255, 248, 224, 0.06)" />
              <stop offset="66%" stopColor="rgba(0, 0, 0, 0)" />
              <stop offset="100%" stopColor="rgba(0, 0, 0, 0.26)" />
            </linearGradient>
            <linearGradient id="lucky-wheel-rim" x1="0" y1="0" x2="0.4" y2="1">
              <stop offset="0%" stopColor="#fff4c8" />
              <stop offset="28%" stopColor="#e7bd63" />
              <stop offset="58%" stopColor="#8c5f18" />
              <stop offset="78%" stopColor="#f4d892" />
              <stop offset="100%" stopColor="#6a470f" />
            </linearGradient>
            <radialGradient id="lucky-wheel-recess" cx="50%" cy="42%" r="62%">
              <stop offset="0%" stopColor="rgba(8, 11, 16, 0.55)" />
              <stop offset="100%" stopColor="rgba(2, 5, 9, 0.96)" />
            </radialGradient>
            <filter id="lucky-wheel-grain" x="-10%" y="-10%" width="120%" height="120%">
              <feTurbulence type="fractalNoise" baseFrequency="0.82" numOctaves="2" seed="7" result="noise" />
              <feColorMatrix in="noise" type="saturate" values="0" />
              <feComponentTransfer>
                <feFuncA type="linear" slope="0.34" />
              </feComponentTransfer>
            </filter>
            <clipPath id="lucky-wheel-clip" clipRule="evenodd">
              <path d={WHEEL_CLIP_PATH} clipRule="evenodd" />
            </clipPath>
            <clipPath id="lucky-wheel-drain-clip">
              <path d={drainClip} />
            </clipPath>
          </defs>

          {/* Pigment body. The whole group rotates beneath the fixed pointer. */}
          <g
            style={{
              transform: `rotate(${rotation}deg)`,
              transformOrigin: '50px 50px',
              willChange: isSpinning ? 'transform' : 'auto',
            }}
          >
            {palette.map((colour, index) => {
              const centre = index * 30;
              const start = centre - 15 + SEGMENT_GAP_DEGREES / 2;
              const end = centre + 15 - SEGMENT_GAP_DEGREES / 2;
              const isSelected = colour.id === selected?.id;
              return (
                <g key={colour.id} data-testid={`lucky-meter-colour-segment-${colour.id}`}>
                  <path
                    d={annularSector(WHEEL_INNER_RADIUS, WHEEL_OUTER_RADIUS, start, end)}
                    fill={`url(#lucky-wheel-${colour.id})`}
                    stroke={isSelected ? shade(colour.hex, 0.38) : 'rgba(255, 232, 176, 0.16)'}
                    strokeWidth={isSelected ? 0.7 : 0.32}
                  />
                  <path
                    d={annularSector(WHEEL_INNER_RADIUS, WHEEL_OUTER_RADIUS, start, end)}
                    fill="url(#lucky-wheel-sheen)"
                    opacity={colour.texture?.sheen ?? 0.25}
                  />
                </g>
              );
            })}

            {/* Gold separators and the painted bevel at both edges. */}
            {palette.map((colour, index) => {
              const angle = index * 30 + 15;
              const inner = polar(WHEEL_INNER_RADIUS - 0.1, angle);
              const outer = polar(WHEEL_OUTER_RADIUS + 0.1, angle);
              return (
                <line
                  key={`separator-${colour.id}`}
                  x1={inner.x}
                  y1={inner.y}
                  x2={outer.x}
                  y2={outer.y}
                  stroke="rgba(255, 226, 158, 0.42)"
                  strokeWidth="0.42"
                  strokeLinecap="round"
                />
              );
            })}
          </g>

          {/* Fine pigment grain over the band, so the paint has tooth. */}
          <g clipPath="url(#lucky-wheel-clip)" pointerEvents="none">
            <rect
              x="0"
              y="0"
              width="100"
              height="100"
              filter="url(#lucky-wheel-grain)"
              opacity="0.2"
              style={{ mixBlendMode: 'overlay' }}
            />
          </g>

          {/* The opened segment draining downward. The gold wet edge follows the
              falling colour, which is what makes the segment read as emptying
              rather than simply fading. */}
          {selected && (isPouring || drain >= 1) && (
            <g clipPath="url(#lucky-wheel-drain-clip)">
              <rect
                x="0"
                y={50 + WHEEL_INNER_RADIUS}
                width="100"
                height={Math.max(0.001, drain * (WHEEL_OUTER_RADIUS - WHEEL_INNER_RADIUS))}
                fill="url(#lucky-wheel-recess)"
              />
              {drain < 1 && (
                <line
                  x1="12"
                  y1={wetEdgeY}
                  x2="88"
                  y2={wetEdgeY}
                  stroke={shade(selected.hex, 0.4)}
                  strokeWidth="0.75"
                  strokeLinecap="round"
                  opacity="0.9"
                />
              )}
            </g>
          )}

          {/* Raised rims. The inner rim is the lip of the enamel well. */}
          <circle
            cx="50"
            cy="50"
            r={WHEEL_OUTER_RADIUS + 0.55}
            fill="none"
            stroke="url(#lucky-wheel-rim)"
            strokeWidth="1.5"
          />
          {/* Bevel shading: a dark seat inside the outer rim and a thin lit
              edge on the well lip, so the pigment band sits in a struck channel
              instead of floating on the face. */}
          <circle
            cx="50"
            cy="50"
            r={WHEEL_OUTER_RADIUS - 0.55}
            fill="none"
            stroke="rgba(0, 0, 0, 0.38)"
            strokeWidth="0.9"
          />
          <circle
            cx="50"
            cy="50"
            r={WHEEL_INNER_RADIUS + 0.5}
            fill="none"
            stroke="rgba(0, 0, 0, 0.32)"
            strokeWidth="0.7"
          />
          <circle
            cx="50"
            cy="50"
            r={WHEEL_INNER_RADIUS - 0.5}
            fill="none"
            stroke="url(#lucky-wheel-rim)"
            strokeWidth="1.1"
          />
          <circle
            cx="50"
            cy="50"
            r={WHEEL_INNER_RADIUS - 1.3}
            fill="none"
            stroke="rgba(0, 0, 0, 0.55)"
            strokeWidth="0.7"
          />
        </svg>
      )}

      {/* The Lucky Number behind the emptying segment. The segment empties
          from the top down, so the number is exposed on the same clock from its
          top edge downward rather than faded in over the meter. */}
      {shownNumber !== null && reveal > 0 && (
        <div
          aria-hidden="true"
          data-testid="lucky-meter-number-reveal"
          data-value={shownNumber}
          className="pointer-events-none absolute left-1/2 z-[16] flex -translate-x-1/2 flex-col items-center"
          style={{
            bottom: '22.5%',
            clipPath: `inset(0 0 ${(1 - reveal) * 100}% 0)`,
            opacity: 0.35 + reveal * 0.65,
          }}
        >
          <span
            className={`font-bold leading-none tabular-nums ${
              compact ? 'text-base' : 'text-[clamp(1rem,3.1vh,1.55rem)]'
            }`}
            style={{
              backgroundImage: 'linear-gradient(180deg, #fff8dc 0%, #f3d489 45%, #b57f22 100%)',
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              filter: 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.75))',
            }}
          >
            {shownNumber}
          </span>
        </div>
      )}

      {/* The pour itself is drawn by the Three.js vessel scene below, where it
          has a curved body, a leading droplet and a splash. The ring keeps only
          the segment draining, so there is no flat streak pretending to be
          liquid. This invisible marker preserves the pour test hook. */}
      {selected && isPouring && drain > 0 && (
        <span aria-hidden="true" data-testid="lucky-meter-pour" className="sr-only" />
      )}

      {/* Fixed pointer: a gold maple leaf seated in a milled socket at 6 o'clock.
          It never rotates with the wheel. */}
      <div
        aria-hidden="true"
        data-testid="lucky-meter-pointer"
        data-position="6"
        className="pointer-events-none absolute bottom-[-4%] left-1/2 z-[21] flex -translate-x-1/2 flex-col items-center transition-transform duration-500 ease-out"
        style={{
          width: compact ? '17%' : '18%',
          transform: isPouring
            ? 'translateX(-50%) translateY(4px) rotate(-3deg)'
            : 'translateX(-50%) translateY(0)',
          opacity: isPouring ? 0.92 : 1,
        }}
      >
        <svg viewBox="0 0 100 100" className="h-auto w-full drop-shadow-[0_4px_10px_rgba(0,0,0,0.75)]">
          {/* The gradient lives with the always-mounted pointer, not inside the
              wheel SVG that only exists once a reading is present. */}
          <defs>
            <linearGradient id="lucky-pointer-gold" x1="0" y1="0" x2="0.55" y2="1">
              <stop offset="0%" stopColor="#fff8d8" />
              <stop offset="30%" stopColor="#f3d583" />
              <stop offset="62%" stopColor="#c9962f" />
              <stop offset="100%" stopColor="#7d5310" />
            </linearGradient>
          </defs>
          <path
            d={POINTER_PATH}
            fill="url(#lucky-pointer-gold)"
            stroke="rgba(60, 36, 6, 0.7)"
            strokeWidth="2.2"
            strokeLinejoin="round"
          />
          <path
            d="M50 10 L56 34 L43 30 Z"
            fill="rgba(255, 252, 225, 0.5)"
            opacity="0.7"
          />
        </svg>
        <span
          className="absolute -bottom-[2px] h-[16%] w-[52%] rounded-full"
          style={{
            background:
              'radial-gradient(ellipse at 50% 50%, rgba(255, 226, 152, 0.55), rgba(255, 196, 92, 0.12) 58%, transparent 78%)',
            filter: 'blur(2px)',
          }}
        />
      </div>

      {/* Readability scrim: a very soft inner shadow keeps gold type legible on
          the enamel well without hiding the lit bevel behind the text. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-[16%] z-[15] rounded-full shadow-[inset_0_1px_3px_rgba(0,0,0,0.55),inset_0_-12px_30px_rgba(0,0,0,0.4)]"
      />

      <div
        className={`absolute inset-[19%] z-20 flex min-w-0 flex-col items-center justify-center overflow-hidden rounded-full text-center ${
          compact ? 'px-1.5' : 'px-3 md:px-5'
        }`}
      >
        {children}
      </div>
    </div>
  );
}
