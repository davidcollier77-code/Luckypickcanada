'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useCreativeExperience } from '../app/lib/use-creative-experience';
import { createLuckyMeterVesselScene } from '../app/lib/lucky-meter/vessel-scene';
import { LUCKY_COLOUR_LABEL } from '../app/lib/lucky-meter/config';

interface VesselColour {
  hex: string;
  name: string;
  light: boolean;
  texture?: { grain?: number; sheen?: number };
}

interface LuckyMeterVesselProps {
  colour: VesselColour;
  /** 0–1: how much colour is inside the vessel (rises on fill, falls on drain). */
  fill: number;
  /** 0–1: the falling stream; only present while colour is arriving. */
  pour?: number;
  /** 0–1: the vessel's unfold-and-open progress. */
  open: number;
  /** True before the vessel stage: the scene warms up off-screen. */
  hidden?: boolean;
  /** The approved vessel beat, exposed for the CSS fallback's own states. */
  phase?: 'idle' | 'opening' | 'filling' | 'holding' | 'draining' | 'empty';
  isCompact?: boolean;
  seasonName?: string;
  reducedMotion?: boolean;
}

/**
 * The Lucky Colour vessel.
 *
 * A real Three.js scene draws a thick-walled glass tumbler, the coloured liquid
 * rising inside it and the stream falling into it. The CSS vessel underneath is
 * the first paint and the permanent fallback on a browser without WebGL, so the
 * result is never a hole in the page. Both read the same stored HEX value.
 *
 * Layout, caption, test ids and the exposed `data-vessel-fill` /
 * `data-vessel-open` values are unchanged from the CSS-only version.
 */
export default function LuckyMeterVessel({
  colour,
  fill,
  pour,
  open,
  hidden = false,
  phase = 'idle',
  isCompact = false,
  seasonName = '',
  reducedMotion = false,
}: LuckyMeterVesselProps) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const sceneRef = useRef<Awaited<ReturnType<typeof createLuckyMeterVesselScene>>>(null);
  // The scene resolves asynchronously, so the values it starts from are the
  // newest props, not the ones captured when the effect first ran.
  const pourRatio = Math.max(0, Math.min(1, typeof pour === 'number' ? pour : fill));
  const latestStateRef = useRef({ colour: colour.hex, fill, pour: pourRatio, open });
  const [renderMode, setRenderMode] = useState<'pending' | 'three' | 'fallback'>('pending');

  // Register with the shared readiness hub. The Three chunk is loaded lazily by
  // the runtime; this only makes the resource declaration discoverable.
  useCreativeExperience('lucky-meter-vessel');

  useEffect(() => {
    let cancelled = false;
    let scene: Awaited<ReturnType<typeof createLuckyMeterVesselScene>> = null;
    const host = hostRef.current;
    let canvas: HTMLCanvasElement | null = null;
    let createTimer = 0;

    // The canvas is created here rather than in JSX on purpose. Three.js's
    // teardown releases the WebGL context, and a canvas whose context was
    // released cannot reliably serve a new one. React Strict Mode mounts the
    // effect twice in development, so a JSX canvas would be poisoned by the
    // first teardown and the second scene would render nothing. A fresh canvas
    // per mount keeps every scene on a live context.
    const create = () => {
      if (cancelled || !host) return;
      createTimer = 0;
      canvas = document.createElement('canvas');
      canvas.className = 'lucky-vessel-canvas';
      canvas.setAttribute('data-testid', 'lucky-vessel-canvas');
      canvas.setAttribute('aria-hidden', 'true');
      host.appendChild(canvas);
      try {
        performance.mark('vessel-effect');
      } catch {
        // Diagnostics only.
      }

      let sceneReady = false;
      let stateApplied = false;
      // Only present the canvas once the scene is ready *and* it has been given
      // the real reading, so the default pour colour is never on screen.
      const present = () => {
        if (cancelled || !sceneReady || !stateApplied) return;
        try {
          performance.mark('lucky-vessel-ready');
        } catch {
          // Marks are diagnostics only.
        }
        setRenderMode('three');
      };

      createLuckyMeterVesselScene({
        canvas,
        onReady: () => {
          if (cancelled) return;
          sceneReady = true;
          present();
        },
        onUnavailable: () => {
          if (!cancelled) setRenderMode('fallback');
        },
        // A lost context is a real condition on a phone or after a GPU reset:
        // the functional CSS vessel takes over while the stage rebuilds, and
        // the scene is presented again only after it has restored.
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
          // A refreshed reading mounts already complete: present the finished
          // vessel rather than replaying a pour the visitor already watched.
          const latest = latestStateRef.current;
          created.setState({
            colour: latest.colour,
            fill: latest.fill,
            pour: latest.pour,
            open: latest.open,
            instant: latest.fill >= 0.999,
          });
          stateApplied = true;
          present();
        })
        .catch(() => {
          if (!cancelled) setRenderMode('fallback');
        });
    };

    // Deferring one tick lets Strict Mode's first mount clean up before any
    // canvas or WebGL context exists.
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
    latestStateRef.current = { colour: colour.hex, fill, pour: pourRatio, open };
    // `pour` is explicit: during the drain the vessel level falls while the
    // stream is already gone, so the scene must not infer a pour from the fill.
    sceneRef.current?.setState({ colour: colour.hex, fill, pour: pourRatio, open });
  }, [colour.hex, fill, pourRatio, open]);

  const grain = Math.max(0, Math.min(1, colour.texture?.grain ?? 0.1));
  const sheen = Math.max(0, Math.min(1, colour.texture?.sheen ?? 0.3));
  const fillRatio = Math.max(0, Math.min(1, fill));
  const showThree = renderMode === 'three';

  return (
    <section
      hidden={hidden}
      data-testid="lucky-colour-panel"
      data-vessel-open={open.toFixed(2)}
      data-vessel-fill={fillRatio.toFixed(3)}
      data-vessel-renderer={renderMode}
      data-vessel-motion={reducedMotion ? 'calm' : 'full'}
      data-vessel-phase={phase}
      className={`lucky-vessel-stage relative mx-auto w-full ${
        isCompact ? 'mt-2 max-w-[300px]' : 'mt-3 max-w-[26rem]'
      }`}
    >
      <div className="lucky-vessel-scene" aria-hidden="true">
        <div
          ref={hostRef}
          data-testid="lucky-vessel-canvas-host"
          className={`lucky-vessel-canvas-host ${showThree ? 'is-ready' : ''}`}
        />
        {/* The empty-vessel highlight. It sits above either renderer, so the
            approved 1.6 s highlight is identical with and without WebGL. */}
        <span
          aria-hidden="true"
          data-testid="lucky-vessel-highlight"
          className={`lucky-vessel__highlight ${phase === 'empty' ? 'is-active' : ''}`}
        />
        {/* The static CSS vessel: first paint, and the fallback when WebGL is
            unavailable. It is hidden once the Three.js scene has drawn. */}
        <div className={`lucky-vessel ${showThree ? 'lucky-vessel--hidden' : ''}`}>
          <span className="lucky-vessel__shadow" />
          <span className="lucky-vessel__back" />
          <span className="lucky-vessel__body">
            <span
              className="lucky-vessel__liquid"
              style={{
                height: `${fillRatio * 100}%`,
                background: `linear-gradient(180deg, ${colour.hex} 0%, ${colour.hex}e6 58%, ${colour.hex}9c 100%)`,
                boxShadow: `0 0 18px ${colour.hex}99, inset 0 0 12px ${colour.hex}`,
              }}
            >
              <span
                className="lucky-vessel__surface"
                style={{
                  background: `radial-gradient(ellipse at 42% 40%, #ffffffcc 0%, ${colour.hex} 46%, ${colour.hex}55 100%)`,
                }}
              />
            </span>
            <span className="lucky-vessel__glow" />
          </span>
          <span className="lucky-vessel__wall lucky-vessel__wall--left" />
          <span className="lucky-vessel__wall lucky-vessel__wall--right" />
          <span className="lucky-vessel__glass" />
          <span className="lucky-vessel__rim" />
          <span
            className="lucky-vessel__lid"
            style={{
              opacity: 1 - Math.min(1, open * 1.25),
              transform: `rotateX(${(-104 * open).toFixed(2)}deg)`,
            }}
          />
          <span className="lucky-vessel__specular" />
        </div>
      </div>

      <div className="lucky-vessel__caption">
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
        <div className="min-w-0 text-left">
          <h2 className="lucky-panel-label text-[12px] uppercase">{LUCKY_COLOUR_LABEL}</h2>
          <p
            className="truncate text-sm font-semibold leading-tight text-white sm:text-base"
            style={{ opacity: 0.35 + fillRatio * 0.65 }}
          >
            {colour.name}
          </p>
          <p
            className="text-[12px] uppercase tracking-wider text-slate-300/85 tabular-nums"
            style={{ opacity: 0.35 + fillRatio * 0.65 }}
          >
            {colour.hex}
          </p>
        </div>
        <span className="ml-auto hidden text-[12px] uppercase tracking-[0.16em] text-amber-200/60 sm:block">
          {seasonName}
        </span>
      </div>
    </section>
  );
}
