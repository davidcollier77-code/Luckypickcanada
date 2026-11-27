'use client';

import React, { useEffect, useRef, useState } from 'react';
import { createLuckyMeterScene } from '../app/lib/lucky-meter/meter-scene';
import {
  CHAMBER_COUNT,
  METER_LAYOUT,
  STAGE_ASPECT,
  chamberGradient,
  selectedChamberIndex,
  stageFraming,
} from '../app/lib/lucky-meter/meter-layout';
import { LUCKY_COLOUR_LABEL, LUCKY_NUMBER_MAX, LUCKY_NUMBER_MIN } from '../app/lib/lucky-meter/config';

/** The stage's camera maps the wheel centre to this point in its box. */
const WHEEL_CENTRE_TOP = 'var(--meter-wheel-top, 34.2%)';
// Only a stuck-state guard: the measured first composite can exceed 3 s on a
// loaded software host, and the canvas is already above the fallback by then.
const FALLBACK_RETIRE_MS = 6000;

/**
 * The one framing the DOM inlays and the canvas share. It is derived from the
 * same function the scene uses, so a label can never drift off its plaque.
 */
const FRAMING = stageFraming(390, 390 / STAGE_ASPECT);
const HALF_WIDTH = (FRAMING.verticalExtent * STAGE_ASPECT) / 2;
const HALF_HEIGHT = FRAMING.verticalExtent / 2;

/** Projects a world point onto the stage as CSS percentages. */
function project(x, y) {
  return {
    left: `${(50 + (x / HALF_WIDTH) * 50).toFixed(2)}%`,
    top: `${(50 - ((y - FRAMING.lookY) / HALF_HEIGHT) * 50).toFixed(2)}%`,
  };
}

const POINTER_POSITION = project(METER_LAYOUT.spout.socket[0], METER_LAYOUT.spout.socket[1]);
const VESSEL_POSITION = project(METER_LAYOUT.vessel.x, METER_LAYOUT.vessel.y);
const COLOUR_BAR_POSITION = project(METER_LAYOUT.colourBar.x, METER_LAYOUT.colourBar.y - 0.03);
const PLAQUE_POSITION = project(METER_LAYOUT.plaque.x, METER_LAYOUT.plaque.y - 0.09);
const BAR_WIDTH = `${((METER_LAYOUT.colourBar.width / (HALF_WIDTH * 2)) * 100).toFixed(2)}%`;
const PLAQUE_WIDTH = `${((METER_LAYOUT.plaque.insetWidth / (HALF_WIDTH * 2)) * 100).toFixed(2)}%`;

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
 * One Three.js canvas draws the banner, the twelve glass cups, the fixed 7:30
 * spout, the crystal bowl, the colour bar, the Lucky Number plaque and the
 * number's independent flight. The DOM overlays stay readable text: the centre
 * readout, the colour name inside the gold bar, the revealed number inside the
 * plaque, and the live attributes the storyboard tests observe.
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
 * @param {boolean} [props.showDetails] Render the colour bar once the reading has details.
 * @param {string} [props.seasonName]
 * @param {object|null} [props.choreography]
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
  choreography = null,
  reducedMotion = false,
  children,
  className = '',
}) {
  const hostRef = useRef(null);
  const stageRef = useRef(null);
  const sceneRef = useRef(null);
  const [renderMode, setRenderMode] = useState('pending');
  const [fallbackRetired, setFallbackRetired] = useState(false);
  const [wheelTop, setWheelTop] = useState(34.2);

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
  const showFallback = renderMode !== 'three' || !fallbackRetired;

  const latestStateRef = useRef({});
  latestStateRef.current = {
    phase,
    wheelAngle: rotation,
    palette,
    colourId,
    colourIndex: selectedIndex,
    colour: colour?.hex ?? null,
    number: shownNumber,
    chamberDrain: drain,
    vesselFill: fillRatio,
    pour: pourRatio,
    beam: beamRatio,
    leafExit: leaf,
    numberReveal: reveal,
    choreography,
    reducedMotion,
  };

  // The DOM readout and the CSS fallback must sit on the same projected wheel
  // centre as the canvas at every stage size. The framing function is the same
  // one the scene uses, so the overlay can never drift from the geometry.
  useEffect(() => {
    const element = stageRef.current;
    if (!element || typeof ResizeObserver === 'undefined') return undefined;
    const measure = () => {
      const width = element.clientWidth || 390;
      const height = element.clientHeight || width / STAGE_ASPECT;
      const framing = stageFraming(width, height);
      setWheelTop(Number((framing.wheelTop * 100).toFixed(2)));
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

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

  /**
   * The canvas starts at opacity 0 and fades in. Removing the complete CSS meter
   * in the same render as `is-ready` left the stage empty until the first
   * canvas composite (~2 s on the measured software host). Keep the fallback
   * beneath the incoming canvas until the canvas is actually visible, with a
   * bound so a missing transition cannot leave it mounted. Context loss resets
   * the hold so the CSS meter returns as it does today.
   */
  useEffect(() => {
    if (renderMode !== 'three') {
      setFallbackRetired(false);
      return undefined;
    }
    const host = hostRef.current;
    if (!host) {
      setFallbackRetired(true);
      return undefined;
    }

    let cancelled = false;
    let frame = 0;
    let bound = 0;
    let retired = false;

    const retire = () => {
      if (cancelled || retired) return;
      retired = true;
      if (frame) {
        window.cancelAnimationFrame(frame);
        frame = 0;
      }
      if (bound) {
        window.clearTimeout(bound);
        bound = 0;
      }
      setFallbackRetired(true);
    };

    const sample = () => {
      frame = 0;
      if (cancelled || retired) return;
      const raw = window.getComputedStyle(host).opacity;
      const opacity = raw === '' ? Number.NaN : Number(raw);
      if (!Number.isFinite(opacity) || opacity > 0) {
        retire();
        return;
      }
      frame = window.requestAnimationFrame(sample);
    };

    const onTransitionEnd = (event) => {
      if (event.target === host && (!event.propertyName || event.propertyName === 'opacity')) {
        retire();
      }
    };
    host.addEventListener('transitionend', onTransitionEnd);

    const retireUnlessStillTransparent = () => {
      bound = 0;
      if (cancelled || retired) return;
      const current = window.getComputedStyle(host).opacity;
      const value = current === '' ? Number.NaN : Number(current);
      if (!Number.isFinite(value) || value > 0) {
        retire();
        return;
      }
      // The canvas is still invisible, so the complete CSS meter is the
      // correct art. Stop polling; the transition-end listener can still
      // retire it if the browser eventually runs the transition.
      if (frame) {
        window.cancelAnimationFrame(frame);
        frame = 0;
      }
    };

    const raw = window.getComputedStyle(host).opacity;
    const opacity = raw === '' ? Number.NaN : Number(raw);
    if (!Number.isFinite(opacity) || opacity > 0) {
      // No opacity signal (for example jsdom) or already visible: there is
      // nothing to retain. A browser starts this at 0 and waits.
      retire();
    } else {
      frame = window.requestAnimationFrame(sample);
      // The measured first-composite stall runs to ~2.2 s after ready and can
      // be longer under load; this stops polling, it never removes a fallback
      // while the canvas is still transparent.
      bound = window.setTimeout(retireUnlessStillTransparent, FALLBACK_RETIRE_MS);
    }

    return () => {
      cancelled = true;
      if (frame) window.cancelAnimationFrame(frame);
      if (bound) window.clearTimeout(bound);
      host.removeEventListener('transitionend', onTransitionEnd);
    };
  }, [renderMode]);

  useEffect(() => {
    sceneRef.current?.setState({
      phase,
      wheelAngle: rotation,
      palette,
      colour: colour?.hex ?? null,
      colourIndex: selectedIndex,
      number: shownNumber,
      chamberDrain: drain,
      vesselFill: fillRatio,
      pour: pourRatio,
      beam: beamRatio,
      leafExit: leaf,
      numberReveal: reveal,
      choreography,
      reducedMotion,
    });
  }, [
    beamRatio,
    choreography,
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
    shownNumber,
  ]);

  // The fallback wheel is a conic gradient whose bands start at index × step.
  // The landing rotation puts a band's start under the pointer, so subtract
  // half a band to centre the selected chamber on the fixed 7:30 spout.
  const fallbackWheelAngle = rotation - chamberStep / 2;
  const drainOverlay = selected
    ? `conic-gradient(from ${selectedIndex * chamberStep}deg, rgba(2, 5, 9, 0.94) 0deg ${chamberStep}deg, rgba(2, 5, 9, 0) ${chamberStep}deg 360deg)`
    : 'none';

  return (
    <div
      ref={stageRef}
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
      style={{ '--meter-wheel-top': `${wheelTop}%` }}
      className={`lucky-meter-stage resonance-ring relative isolate mx-auto w-full shrink-0 ${
        compact ? 'is-compact' : ''
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
              style={{ left: POINTER_POSITION.left, top: POINTER_POSITION.top }}
            />
            <span
              className="lucky-meter-fallback__pointer-wrap"
              style={{ left: POINTER_POSITION.left, top: POINTER_POSITION.top }}
            >
              <span
                className="lucky-meter-fallback__pointer"
                style={{ clipPath: CSS_LEAF_CLIP, WebkitClipPath: CSS_LEAF_CLIP }}
              />
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
                left: POINTER_POSITION.left,
                top: POINTER_POSITION.top,
                opacity: pourRatio > 0.02 ? 0.85 : 0,
                background: `linear-gradient(180deg, ${colour?.hex ?? '#f5c451'}, ${
                  colour?.hex ?? '#f5c451'
                }33)`,
              }}
            />

            {/* The number's flight in the no-WebGL composition: the same
                independent path, drawn as a soft additive streak. */}
            <span
              className="lucky-meter-fallback__beam"
              aria-hidden="true"
              style={{ opacity: beamRatio > 0.02 ? Math.sin(beamRatio * Math.PI) * 0.9 : 0 }}
            />

            <span
              className="lucky-meter-fallback__vessel"
              style={{ left: VESSEL_POSITION.left, top: VESSEL_POSITION.top }}
            >
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
          </div>
        )}

        <div
          data-testid="lucky-meter-center"
          className={`lucky-meter-stage__readout ${compact ? 'px-1' : 'px-2'}`}
          style={{ left: '50%', top: WHEEL_CENTRE_TOP }}
        >
          {children}
        </div>

        {/* The fixed spout's test hook: the visible spout is geometry in the
            scene, never an SVG. */}
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

        {/* The colour's destination: the gold bar beneath the bowl. It carries
            the same vessel attributes the storyboard and the tests observe. */}
        {showDetails && (
          <section
            data-testid="lucky-colour-panel"
            data-vessel-open="1.00"
            data-vessel-fill={formatNumber(fillRatio)}
            data-vessel-renderer={renderMode}
            data-vessel-motion={reducedMotion ? 'calm' : 'full'}
            data-vessel-phase={vesselPhase}
            className={`lucky-colour-bar ${compact ? 'is-compact' : ''}`}
            style={{
              left: COLOUR_BAR_POSITION.left,
              top: COLOUR_BAR_POSITION.top,
              width: BAR_WIDTH,
              // Above the WebGL canvas (10): the reading's colour is printed on
              // the plaque, not behind it.
              zIndex: 12,
              // The plaque prints its own caption; the reading stacks under it.
              flexDirection: 'row',
              alignItems: 'center',
              gap: '0.28rem',
              paddingTop: '0.78rem',
              paddingBottom: 0,
              justifyContent: 'center',
            }}
          >
            <h2 className="sr-only">{LUCKY_COLOUR_LABEL}</h2>
            <span className="lucky-colour-bar__text">
              <span
                className="lucky-colour-bar__name"
                style={{
                  opacity: colour ? 0.45 + fillRatio * 0.55 : 0.6,
                  fontSize: '0.58rem',
                  lineHeight: 1,
                  letterSpacing: '0.06em',
                  whiteSpace: 'nowrap',
                }}
              >
                {colour ? colour.name : 'Awaiting the reading'}
              </span>
              <span
                className="lucky-colour-bar__meta"
                style={{ fontSize: '0.5rem', lineHeight: 1.05, whiteSpace: 'nowrap' }}
              >
                <span>{colour ? colour.hex : '—'}</span>
                {seasonName ? (
                  <>
                    <span aria-hidden="true" className="lucky-colour-bar__dot">
                      ·
                    </span>
                    <span className="lucky-colour-bar__season">{seasonName}</span>
                  </>
                ) : null}
              </span>
            </span>
          </section>
        )}

        {/* The number's destination: the plaque's recess. It mounts only once
            the transfer has settled, so the empty plaque stays canvas art. */}
        {numberSettled && shownNumber !== null && (
          <section
            data-testid="lucky-number-panel"
            className={`lucky-number-plaque ${compact ? 'is-compact' : ''}`}
            style={{
              left: PLAQUE_POSITION.left,
              top: PLAQUE_POSITION.top,
              width: PLAQUE_WIDTH,
              // Above the WebGL canvas (10), inside the plaque's recess.
              zIndex: 13,
            }}
          >
            <p
              className="lucky-number-value lucky-number-plaque__value"
              data-testid="lucky-number-value"
              data-value={shownNumber}
            >
              {shownNumber}
            </p>
          </section>
        )}
      </div>
    </div>
  );
}
