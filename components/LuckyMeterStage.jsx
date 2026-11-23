'use client';

import React, { useEffect, useRef, useState } from 'react';
import { createLuckyMeterScene } from '../app/lib/lucky-meter/meter-scene';
import {
  CHAMBER_COUNT,
  chamberGradient,
  selectedChamberIndex,
} from '../app/lib/lucky-meter/meter-layout';
import { LUCKY_COLOUR_LABEL, LUCKY_NUMBER_MAX, LUCKY_NUMBER_MIN } from '../app/lib/lucky-meter/config';

/** The stage's camera maps the wheel centre to this point in its square box. */
const WHEEL_CENTRE_TOP = '33.5%';
const POINTER_LEFT = '28.3%';
const POINTER_TOP = '55.2%';
const VESSEL_LEFT = '29.4%';
const VESSEL_TOP = '81.7%';

/**
 * The CSS maple silhouette used only when WebGL is unavailable. It is a
 * clip-path, not SVG: the fallback is a complete object drawn from CSS layers.
 */
const CSS_LEAF_CLIP =
  'polygon(50% 0%, 57% 24%, 72% 17%, 68% 33%, 100% 29%, 84% 47%, 98% 57%, 74% 59%, 80% 82%, 58% 70%, 50% 100%, 42% 70%, 20% 82%, 26% 59%, 2% 57%, 16% 47%, 0% 29%, 32% 33%, 28% 17%, 43% 24%)';

function clamp01(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return 0;
  return Math.max(0, Math.min(1, number));
}

function formatNumber(value) {
  return Number(value).toFixed(3);
}

/**
 * The Lucky Meter's single physical stage.
 *
 * One Three.js canvas draws the medallion, the twelve chambers, the central
 * decorative leaf, the fixed 7:30 pointer with its curved arm and spout, the
 * receiving vessel, the pour and the golden transfer beam. The DOM overlays
 * stay readable text: the centre readout, the colour caption and the live
 * attributes the storyboard tests observe.
 *
 * Until the renderer has produced a frame — and permanently without WebGL or
 * after a context loss — a complete CSS composition takes over. It is built
 * from gradients, clip-paths and layers, with no SVG artwork.
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
 * @param {number} [props.chamberDrain]
 * @param {number} [props.vesselFill]
 * @param {number} [props.pour]
 * @param {number} [props.beam]
 * @param {number} [props.leafExit]
 * @param {'idle'|'filling'|'holding'|'transferring'|'settled'} [props.vesselPhase]
 * @param {object|null} [props.colour]
 * @param {boolean} [props.showDetails] Render the colour caption once the reading has details.
 * @param {string} [props.seasonName]
 * @param {boolean} [props.reducedMotion]
 * @param {React.ReactNode} [props.children]
 * @param {string} [props.className]
 */
export default function LuckyMeterStage({
  phase = 'idle',
  compact = false,
  wheelAngle = null,
  colours = [],
  colourId = null,
  colourSettled = false,
  number = null,
  numberSettled = false,
  numberReveal = 0,
  chamberDrain = 0,
  vesselFill = 0,
  pour = 0,
  beam = 0,
  leafExit = 0,
  vesselPhase = 'idle',
  colour = null,
  showDetails = false,
  seasonName = '',
  reducedMotion = false,
  children,
  className = '',
}) {
  const hostRef = useRef(null);
  const sceneRef = useRef(null);
  const [renderMode, setRenderMode] = useState('pending');

  const palette = Array.isArray(colours) ? colours : [];
  const selectedIndex = selectedChamberIndex(palette, colourId);
  const drain = clamp01(chamberDrain);
  const fillRatio = clamp01(vesselFill);
  const pourRatio = clamp01(pour);
  const beamRatio = clamp01(beam);
  const leaf = clamp01(leafExit);
  const reveal = clamp01(numberReveal);
  const hasWheelAngle = typeof wheelAngle === 'number' && Number.isFinite(wheelAngle);
  const rotation = hasWheelAngle ? wheelAngle : 0;
  const selected = selectedIndex >= 0 ? palette[selectedIndex] : null;
  const chamberCount = palette.length > 0 ? palette.length : CHAMBER_COUNT;
  const chamberStep = 360 / chamberCount;
  const shownNumber =
    Number.isInteger(number) && number >= LUCKY_NUMBER_MIN && number <= LUCKY_NUMBER_MAX
      ? number
      : null;
  const showFallback = renderMode !== 'three';
  const grain = Math.max(0, Math.min(1, colour?.texture?.grain ?? 0.1));
  const sheen = Math.max(0, Math.min(1, colour?.texture?.sheen ?? 0.3));

  const latestStateRef = useRef({});
  latestStateRef.current = {
    phase,
    wheelAngle: rotation,
    palette,
    colourId,
    colourIndex: selectedIndex,
    colour: colour?.hex ?? null,
    chamberDrain: drain,
    vesselFill: fillRatio,
    pour: pourRatio,
    beam: beamRatio,
    leafExit: leaf,
    numberReveal: reveal,
    reducedMotion,
  };

  useEffect(() => {
    let cancelled = false;
    let scene = null;
    let canvas = null;
    let createTimer = 0;
    const host = hostRef.current;
    if (!host) return undefined;

    // A fresh canvas per mount: Three.js teardown releases the context, and a
    // canvas whose context was released cannot reliably serve another one under
    // React Strict Mode's double mount.
    const create = () => {
      createTimer = 0;
      if (cancelled || !host) return;
      canvas = document.createElement('canvas');
      canvas.className = 'lucky-meter-stage__canvas';
      canvas.setAttribute('data-testid', 'lucky-meter-canvas');
      canvas.setAttribute('aria-hidden', 'true');
      host.appendChild(canvas);

      createLuckyMeterScene({
        canvas,
        onReady: () => {
          if (!cancelled) setRenderMode('three');
        },
        onUnavailable: () => {
          if (!cancelled) setRenderMode('fallback');
        },
        onContextLost: () => {
          if (!cancelled) setRenderMode('fallback');
        },
        onContextRestored: () => {
          if (!cancelled && scene) setRenderMode('three');
        },
      })
        .then((created) => {
          if (cancelled) {
            created?.dispose();
            return;
          }
          scene = created;
          sceneRef.current = created;
          if (!created) {
            setRenderMode('fallback');
            return;
          }
          created.setState({ ...latestStateRef.current, instant: true });
        })
        .catch(() => {
          if (!cancelled) setRenderMode('fallback');
        });
    };

    // One tick lets Strict Mode's first mount clean up before a context exists.
    createTimer = window.setTimeout(create, 0);

    return () => {
      cancelled = true;
      window.clearTimeout(createTimer);
      scene?.dispose();
      sceneRef.current = null;
      canvas?.remove();
      canvas = null;
    };
  }, []);

  useEffect(() => {
    sceneRef.current?.setState({
      phase,
      wheelAngle: rotation,
      palette,
      colour: colour?.hex ?? null,
      colourIndex: selectedIndex,
      chamberDrain: drain,
      vesselFill: fillRatio,
      pour: pourRatio,
      beam: beamRatio,
      leafExit: leaf,
      numberReveal: reveal,
      reducedMotion,
    });
  }, [
    beamRatio,
    colour?.hex,
    drain,
    fillRatio,
    leaf,
    palette,
    phase,
    pourRatio,
    reducedMotion,
    reveal,
    rotation,
    selectedIndex,
  ]);

  // The fallback wheel is a conic gradient whose bands start at index × step.
  // The landing rotation puts a band's start under the pointer, so subtract
  // half a band to centre the selected chamber on the fixed 7:30 pointer.
  const fallbackWheelAngle = rotation - chamberStep / 2;
  const drainOverlay = selected
    ? `conic-gradient(from ${selectedIndex * chamberStep}deg, rgba(2, 5, 9, 0.94) 0deg ${chamberStep}deg, rgba(2, 5, 9, 0) ${chamberStep}deg 360deg)`
    : 'none';

  return (
    <div
      data-testid="lucky-meter-ring"
      data-phase={phase}
      data-medallion={renderMode}
      data-meter-renderer={renderMode}
      data-wheel-angle={hasWheelAngle ? rotation.toFixed(2) : undefined}
      data-colour-id={selected?.id ?? undefined}
      data-colour-settled={colourSettled ? 'true' : 'false'}
      data-number={shownNumber ?? undefined}
      data-number-settled={numberSettled ? 'true' : 'false'}
      data-number-reveal={reveal.toFixed(2)}
      data-pour={drain.toFixed(3)}
      data-vessel-fill={formatNumber(fillRatio)}
      data-vessel-phase={vesselPhase}
      data-pointer="7.5"
      data-chamber-count={palette.length || CHAMBER_COUNT}
      data-chamber-ids={palette.map((entry) => entry.id).join(' ')}
      data-leaf-exit={leaf.toFixed(2)}
      data-beam={beamRatio.toFixed(2)}
      className={`lucky-meter-stage resonance-ring relative isolate mx-auto w-full shrink-0 ${
        compact ? 'max-w-[280px]' : 'max-w-[24rem] sm:max-w-[27rem]'
      } ${className}`}
    >
      <div className="lucky-meter-stage__scene lucky-vessel-scene">
        <div
          ref={hostRef}
          data-testid="lucky-vessel-canvas-host"
          className={`lucky-vessel-canvas-host lucky-meter-stage__canvas-host ${
            renderMode === 'three' ? 'is-ready' : ''
          }`}
        />

        {showFallback && (
          <div
            aria-hidden="true"
            data-testid="lucky-meter-fallback"
            data-selected-chamber={selected?.id ?? ''}
            className="lucky-meter-fallback absolute inset-0"
          >
            <div
              className="lucky-meter-fallback__halo"
              style={{ left: '50%', top: WHEEL_CENTRE_TOP }}
            />
            <div
              className="lucky-meter-fallback__wheel"
              style={{
                left: '50%',
                top: WHEEL_CENTRE_TOP,
                background: chamberGradient(palette),
                transform: `translate(-50%, -50%) rotate(${fallbackWheelAngle}deg)`,
              }}
            >
              <span className="lucky-meter-fallback__well" />
              <span
                className="lucky-meter-fallback__drain"
                style={{ background: drainOverlay, opacity: drain }}
              />
              <span className="lucky-meter-fallback__rim" />
            </div>

            <span
              className="lucky-meter-fallback__arm"
              aria-hidden="true"
              style={{ left: POINTER_LEFT, top: POINTER_TOP }}
            />
            <span
              className="lucky-meter-fallback__pointer-wrap"
              style={{ left: POINTER_LEFT, top: POINTER_TOP }}
            >
              <span className="lucky-meter-fallback__pointer" />
            </span>

            {leaf < 0.995 && (
              <span
                className="lucky-meter-fallback__leaf"
                style={{
                  left: '50%',
                  top: WHEEL_CENTRE_TOP,
                  opacity: 1 - leaf,
                  transform: `translate(-50%, -50%) rotate(${leaf * 38}deg) scale(${
                    1 - leaf * 0.55
                  })`,
                }}
              />
            )}

            <span
              className="lucky-meter-fallback__stream"
              style={{
                left: POINTER_LEFT,
                top: POINTER_TOP,
                opacity: pourRatio > 0.02 ? 0.85 : 0,
                background: `linear-gradient(180deg, ${colour?.hex ?? '#f5c451'}, ${
                  colour?.hex ?? '#f5c451'
                }33)`,
              }}
            />

            <span className="lucky-meter-fallback__vessel" style={{ left: VESSEL_LEFT, top: VESSEL_TOP }}>
              <span className="lucky-meter-fallback__vessel-glass" />
              <span
                className="lucky-meter-fallback__liquid"
                style={{
                  height: `${fillRatio * 100}%`,
                  background: `linear-gradient(180deg, ${colour?.hex ?? '#f5c451'} 0%, ${
                    colour?.hex ?? '#f5c451'
                  }c9 100%)`,
                  boxShadow: `0 0 14px ${colour?.hex ?? '#f5c451'}88`,
                }}
              />
              <span className="lucky-meter-fallback__vessel-rim" />
            </span>

            <span
              className="lucky-meter-fallback__beam"
              style={{
                opacity: beamRatio > 0.02 ? Math.sin(beamRatio * Math.PI) * 0.9 : 0,
              }}
            />
          </div>
        )}

        <div
          data-testid="lucky-meter-center"
          className={`lucky-meter-stage__readout ${compact ? 'px-1' : 'px-2'}`}
          style={{ left: '50%', top: WHEEL_CENTRE_TOP }}
        >
          {children}
        </div>

        {/* The fixed pointer's test hook: the visible pointer is geometry in the
            scene (or the CSS leaf above), never an SVG. */}
        <span
          aria-hidden="true"
          data-testid="lucky-meter-pointer"
          data-position="7.5"
          className="lucky-meter-stage__pointer-hook"
        />

        <span
          aria-hidden="true"
          data-testid="lucky-vessel-highlight"
          className={`lucky-vessel__highlight lucky-meter-stage__vessel-highlight ${
            vesselPhase === 'settled' ? 'is-active' : ''
          }`}
        />
      </div>

      {showDetails && (
        <section
          data-testid="lucky-colour-panel"
          data-vessel-open="1.00"
          data-vessel-fill={formatNumber(fillRatio)}
          data-vessel-renderer={renderMode}
          data-vessel-motion={reducedMotion ? 'calm' : 'full'}
          data-vessel-phase={vesselPhase}
          className={`lucky-vessel-stage relative mx-auto w-full ${
            compact ? 'mt-1 max-w-[280px]' : 'mt-1 max-w-[24rem] sm:max-w-[27rem]'
          }`}
        >
          <div className="lucky-vessel__caption">
            {colour ? (
              <span
                aria-hidden="true"
                className={`relative h-8 w-8 shrink-0 overflow-hidden rounded-full border shadow-inner sm:h-9 sm:w-9 ${
                  colour.light ? 'border-slate-500/70' : 'border-white/25'
                }`}
                style={{
                  backgroundColor: colour.hex,
                  backgroundImage: `radial-gradient(circle at 32% 26%, rgba(255,255,255,${
                    0.16 + sheen * 0.4
                  }) 0%, rgba(255,255,255,0) 58%), repeating-linear-gradient(118deg, rgba(255,255,255,${
                    grain * 0.22
                  }) 0 1px, rgba(0,0,0,${grain * 0.28}) 1px 2.4px)`,
                }}
              />
            ) : (
              <span
                aria-hidden="true"
                className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full border border-amber-200/25 bg-[radial-gradient(circle_at_32%_26%,rgba(255,228,168,0.18),rgba(4,9,14,0.9))] shadow-inner sm:h-9 sm:w-9"
              />
            )}
            <div className="min-w-0 text-left">
              <h2 className="lucky-panel-label text-[12px] uppercase">{LUCKY_COLOUR_LABEL}</h2>
              <p
                className="truncate text-sm font-semibold leading-tight text-white sm:text-base"
                style={{ opacity: colour ? 0.35 + fillRatio * 0.65 : 0.7 }}
              >
                {colour ? colour.name : 'Awaiting the reading'}
              </p>
              <p
                className="text-[12px] uppercase tracking-wider text-slate-300/85 tabular-nums"
                style={{ opacity: colour ? 0.35 + fillRatio * 0.65 : 0.55 }}
              >
                {colour ? colour.hex : '—'}
              </p>
            </div>
            <span className="ml-auto hidden text-[12px] uppercase tracking-[0.16em] text-amber-200/60 sm:block">
              {seasonName}
            </span>
          </div>
        </section>
      )}
    </div>
  );
}
