'use client';

/**
 * The Creative Workbench: a shared, development-only sandbox for the creative
 * layer.
 *
 * It mounts a descriptor from `app/lib/graphics/workbench.js` through the same
 * runtime a production feature uses, then exposes everything an AI coding agent
 * needs for visual QA before a pull request is approved:
 *
 *   - `window.__creativeWorkbench.getState()` — plan, adaptive performance
 *     diagnostics, surface kind, audio envelope, fps, canvas size, capture and
 *     error state as plain JSON;
 *   - `selectScene`, `setTier`, `setSeed`, `setReducedMotion` — deterministic
 *     harness state, independent of the machine's OS preferences;
 *   - `setTime(seconds)` — freeze the scene clock and repaint one composed frame,
 *     so two captures at the same time are comparable;
 *   - `playCue(name)` — play an existing same-origin Lucky Meter recording and
 *     watch the envelope drive lights, particles and exposure;
 *   - `playHtml5Cue(name)` — play the same recording through Howler's
 *     `html5: true` path, to verify media-element capture by the shared
 *     analyser;
 *   - `capture()` and `readCapture()` — PNG download plus its data URL.
 *
 * Playwright remains the browser tool for this repository; the page only gives
 * it a stable surface to inspect and photograph. Nothing here is mounted by a
 * visitor-facing route.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { getPerformanceDiagnostics } from '../../app/lib/adaptive-performance.js';
import { getHtml5AnalyserCount } from '../../app/lib/graphics/audio-reactivity.js';
import { createCreativeSurface } from '../../app/lib/graphics/runtime.js';
import { buildWorkbenchScene } from '../../app/lib/graphics/workbench-runtime.js';
import {
  WORKBENCH_SCENES,
  WORKBENCH_TIERS,
  getWorkbenchScene,
  isWorkbenchCue,
  normalizeWorkbenchState,
  resolveWorkbenchPlan,
  workbenchCaptureName,
  workbenchHtml5CueSource,
} from '../../app/lib/graphics/workbench.js';

function round(value) {
  return Math.round((Number(value) || 0) * 1000) / 1000;
}

export default function CreativeWorkbench() {
  const canvasRef = useRef(null);
  const surfaceRef = useRef(null);
  const builderRef = useRef(null);
  const errorsRef = useRef([]);
  const readyRef = useRef(false);
  const playingRef = useRef(true);
  const captureRef = useRef(null);
  const html5CueRef = useRef(null);
  const statsRef = useRef({ frames: 0, fps: 0, windowStart: 0 });

  const [state, setState] = useState({
    sceneId: WORKBENCH_SCENES[0].id,
    tier: 'balanced',
    seed: WORKBENCH_SCENES[0].seed,
    time: 0,
    playing: true,
    reducedMotion: false,
  });
  const stateRef = useRef(state);
  stateRef.current = state;

  const [status, setStatus] = useState({
    surface: 'building',
    kind: null,
    cue: null,
    capture: null,
    error: null,
  });
  const statusRef = useRef(status);
  statusRef.current = status;

  const [inspector, setInspector] = useState('{}');
  const [performanceDiagnostics, setPerformanceDiagnostics] = useState(null);

  const applyState = useCallback((next) => {
    stateRef.current = next;
    playingRef.current = next.playing && !next.reducedMotion;
    setState(next);
    return next;
  }, []);

  const pushError = useCallback((error) => {
    const message = error instanceof Error ? error.message : String(error);
    errorsRef.current = [...errorsRef.current.slice(-9), message];
    setStatus((previous) => ({ ...previous, error: message }));
  }, []);

  const scene = getWorkbenchScene(state.sceneId) ?? WORKBENCH_SCENES[0];
  // Resolve after mount, never during render: the capability probes answer
  // differently on the server (no WebGL, no audio) than in the browser, and a
  // plan rendered from the server's answer would hydrate a different tree.
  const [plan, setPlan] = useState(null);
  useEffect(() => {
    setPlan(resolveWorkbenchPlan(state.sceneId, state));
  }, [state.sceneId, state.tier, state.reducedMotion]);

  /* ------------------------------------------------------------------ *
   * Mount one surface + builder for the selected scene, tier and seed.
   * ------------------------------------------------------------------ */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    const tier = WORKBENCH_TIERS.find((entry) => entry.id === state.tier) ?? WORKBENCH_TIERS[1];
    const activeScene = getWorkbenchScene(state.sceneId) ?? WORKBENCH_SCENES[0];
    const seed = state.seed;
    const reducedMotion = state.reducedMotion;

    let disposed = false;
    let surface = null;
    let builder = null;

    readyRef.current = false;
    statsRef.current = { frames: 0, fps: 0, windowStart: 0 };
    setStatus({ surface: 'building', kind: null, cue: null, capture: null, error: null });

    (async () => {
      surface = await createCreativeSurface({
        canvas,
        requirements: activeScene.requirements,
        quality: { tier: tier.id, maxPixelRatio: tier.maxPixelRatio },
        reducedMotion,
        onFrame: (frame) => {
          // Only a running, motion-enabled loop advances the scene clock. An
          // explicit render or a paused frame repaints the frozen time, so a
          // capture always matches the timestamp in its filename.
          const advancing = playingRef.current && !reducedMotion;
          builder?.update?.({ delta: advancing ? frame.delta : 0, envelope: frame.envelope });
          const stats = statsRef.current;
          const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
          stats.frames += 1;
          if (!stats.windowStart) stats.windowStart = now;
          if (now - stats.windowStart >= 500) {
            stats.fps = Math.round((stats.frames * 1000) / (now - stats.windowStart));
            stats.frames = 0;
            stats.windowStart = now;
          }
        },
        onError: pushError,
      });

      if (disposed) {
        surface?.dispose?.();
        return;
      }

      surfaceRef.current = surface;
      if (!surface) {
        readyRef.current = true;
        setStatus({
          surface: 'unavailable',
          kind: null,
          cue: null,
          capture: null,
          error: 'surface-unavailable',
        });
        return;
      }

      builder = await buildWorkbenchScene({ scene: activeScene, surface, seed });
      if (disposed) {
        builder?.dispose?.();
        surface.dispose();
        return;
      }

      builderRef.current = builder;
      builder?.setTime?.(stateRef.current.time);

      if (reducedMotion || !playingRef.current) surface.stop();
      else surface.start();

      readyRef.current = true;
      setStatus((previous) => ({
        ...previous,
        surface: 'ready',
        kind: surface.kind ?? null,
        error: builder ? previous.error : 'scene-builder-unavailable',
      }));
    })().catch((error) => {
      if (!disposed) pushError(error);
    });

    return () => {
      disposed = true;
      readyRef.current = false;
      builderRef.current = null;
      captureRef.current = null;
      try {
        builder?.dispose?.();
      } catch {
        // A partially built scene needs no further teardown.
      }
      surface?.dispose?.();
      surfaceRef.current = null;
    };
    // Playing and time are applied separately so scrubbing does not rebuild.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.sceneId, state.tier, state.seed, state.reducedMotion, pushError]);

  /* ------------------------------------------------------------------ *
   * Playback and scene clock.
   * ------------------------------------------------------------------ */
  useEffect(() => {
    const surface = surfaceRef.current;
    if (!surface) return;
    if (state.playing && !state.reducedMotion) surface.start();
    else surface.stop();
  }, [state.playing, state.reducedMotion, status.surface]);

  const play = useCallback(() => {
    const next = normalizeWorkbenchState({ playing: true }, stateRef.current);
    applyState(next);
    surfaceRef.current?.start?.();
    return { playing: true };
  }, [applyState]);

  const pause = useCallback(() => {
    const next = normalizeWorkbenchState({ playing: false }, stateRef.current);
    applyState(next);
    surfaceRef.current?.stop?.();
    return { playing: false };
  }, [applyState]);

  const setTime = useCallback(
    (seconds) => {
      const next = normalizeWorkbenchState({ time: Number(seconds), playing: false }, stateRef.current);
      applyState(next);
      builderRef.current?.setTime?.(next.time);
      surfaceRef.current?.stop?.();
      surfaceRef.current?.render?.();
      return { time: next.time };
    },
    [applyState],
  );

  const selectScene = useCallback(
    (sceneId) => {
      const next = normalizeWorkbenchState(
        { sceneId, time: 0, playing: true },
        stateRef.current,
      );
      const target = getWorkbenchScene(next.sceneId);
      if (target) next.seed = target.seed;
      applyState(next);
      return { sceneId: next.sceneId, seed: next.seed };
    },
    [applyState],
  );

  const setTier = useCallback(
    (tier) => {
      const next = normalizeWorkbenchState({ tier }, stateRef.current);
      applyState(next);
      return { tier: next.tier };
    },
    [applyState],
  );

  const setSeed = useCallback(
    (seed) => {
      const next = normalizeWorkbenchState({ seed: Number(seed) }, stateRef.current);
      applyState(next);
      return { seed: next.seed };
    },
    [applyState],
  );

  const setReducedMotion = useCallback(
    (value) => {
      const next = normalizeWorkbenchState({ reducedMotion: Boolean(value) }, stateRef.current);
      applyState(next);
      return { reducedMotion: next.reducedMotion };
    },
    [applyState],
  );

  /* ------------------------------------------------------------------ *
   * Sound: play an existing recording and let the envelope react.
   * ------------------------------------------------------------------ */
  const playCue = useCallback(async (name) => {
    const activeScene = getWorkbenchScene(stateRef.current.sceneId) ?? WORKBENCH_SCENES[0];
    const cue = isWorkbenchCue(name) ? name : activeScene.cue;
    try {
      const audio = await import('../../app/lib/lucky-meter/audio.js');
      const sounds = await audio.prepareLuckyMeterAudio();
      const sound = sounds?.[cue] ?? audio.getLuckyMeterAudio()?.[cue];
      if (!sound || typeof sound.play !== 'function') {
        return { ok: false, cue, reason: 'cue-unavailable' };
      }
      sound.stop?.();
      sound.play();
      setStatus((previous) => ({ ...previous, cue }));

      // A paused scene would never advance the envelope, so resume and ask for
      // the analyser immediately: the mix now exists and the next frame reacts.
      const surface = surfaceRef.current;
      surface?.reactive?.refresh?.();
      applyState(normalizeWorkbenchState({ playing: true }, stateRef.current));
      // Reduced motion keeps the scene still; the cue still plays and is
      // measured, but the loop is never started behind the visitor's back.
      if (!stateRef.current.reducedMotion) surface?.start?.();
      return { ok: true, cue };
    } catch (error) {
      return { ok: false, cue, reason: error instanceof Error ? error.message : String(error) };
    }
  }, [applyState]);

  /**
   * Plays the same catalogue recording through Howler's `html5: true` path, so
   * the sandbox can prove that a media-element cue is captured by the shared
   * analyser. It is the existing Howler system, not a second player, and it is
   * reachable only from the development-only page and its inspection API.
   */
  const playHtml5Cue = useCallback(
    async (name) => {
      const activeScene = getWorkbenchScene(stateRef.current.sceneId) ?? WORKBENCH_SCENES[0];
      const cue = isWorkbenchCue(name) ? name : activeScene.cue;
      const src = workbenchHtml5CueSource(cue);
      if (!src) return { ok: false, cue, reason: 'html5-cue-unavailable' };

      try {
        const { Howl } = await import('howler');
        let entry = html5CueRef.current;
        if (!entry || entry.src !== src) {
          entry?.howl?.unload?.();
          entry = {
            src,
            howl: new Howl({ src: [src], html5: true, volume: 0.7, preload: true }),
          };
          html5CueRef.current = entry;
        }
        entry.howl.stop();
        entry.howl.play();
        setStatus((previous) => ({ ...previous, cue }));

        const surface = surfaceRef.current;
        surface?.reactive?.refresh?.();
        applyState(normalizeWorkbenchState({ playing: true }, stateRef.current));
        if (!stateRef.current.reducedMotion) surface?.start?.();
        return { ok: true, cue, html5: true };
      } catch (error) {
        return { ok: false, cue, reason: error instanceof Error ? error.message : String(error) };
      }
    },
    [applyState],
  );

  useEffect(
    () => () => {
      html5CueRef.current?.howl?.unload?.();
      html5CueRef.current = null;
    },
    [],
  );

  /* ------------------------------------------------------------------ *
   * Capture.
   * ------------------------------------------------------------------ */
  const capture = useCallback(async () => {
    const surface = surfaceRef.current;
    const canvas = canvasRef.current;
    if (!surface || !canvas) {
      return { ok: false, reason: 'surface-unavailable' };
    }

    const wasPlaying = stateRef.current.playing && !stateRef.current.reducedMotion;
    // Pause through the shared state path so the transport, the loop and the
    // reported state agree while the frame is read back.
    applyState(normalizeWorkbenchState({ playing: false }, stateRef.current));
    surface.stop?.();
    builderRef.current?.setTime?.(stateRef.current.time);
    surface.render?.();

    let dataUrl = '';
    try {
      dataUrl = canvas.toDataURL('image/png');
    } catch {
      dataUrl = '';
    }
    const readable =
      typeof dataUrl === 'string' && dataUrl.startsWith('data:image/png') && dataUrl.length > 512;
    const current = stateRef.current;
    const result = {
      ok: readable,
      filename: workbenchCaptureName(current.sceneId, current),
      width: canvas.width,
      height: canvas.height,
      bytes: readable ? Math.round(((dataUrl.length - 22) * 3) / 4) : 0,
      reason: readable ? null : 'canvas-not-readable',
    };

    captureRef.current = readable ? { dataUrl, filename: result.filename } : null;

    if (readable && typeof document !== 'undefined') {
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = result.filename;
      link.rel = 'noopener';
      document.body.appendChild(link);
      link.click();
      link.remove();
    }

    setStatus((previous) => ({ ...previous, capture: result }));
    if (wasPlaying) {
      applyState(normalizeWorkbenchState({ playing: true }, stateRef.current));
      surface.start?.();
    }
    return result;
  }, [applyState]);

  const readCapture = useCallback(() => captureRef.current?.dataUrl ?? null, []);

  /* ------------------------------------------------------------------ *
   * Inspection surface for agents and the on-page inspector.
   * ------------------------------------------------------------------ */
  const getState = useCallback(() => {
    const current = stateRef.current;
    const currentStatus = statusRef.current;
    const surface = surfaceRef.current;
    const envelope = surface?.reactive?.getEnvelope?.() ?? null;
    const activeScene = getWorkbenchScene(current.sceneId);
    let html5Playing = false;
    try {
      html5Playing = Boolean(html5CueRef.current?.howl?.playing?.());
    } catch {
      html5Playing = false;
    }

    return {
      version: 2,
      ready: readyRef.current,
      sceneId: current.sceneId,
      label: activeScene?.label ?? null,
      description: activeScene?.description ?? null,
      tier: current.tier,
      seed: current.seed,
      time: round(current.time),
      playing: current.playing,
      reducedMotion: current.reducedMotion,
      surface: currentStatus.surface,
      surfaceKind: currentStatus.kind,
      plan: resolveWorkbenchPlan(current.sceneId, current),
      diagnostics: getPerformanceDiagnostics(),
      envelope: envelope
        ? {
            available: envelope.available === true,
            reason: envelope.reason ?? null,
            level: round(envelope.level),
            bass: round(envelope.bass),
            mids: round(envelope.mids),
            highs: round(envelope.highs),
            transient: round(envelope.transient),
            peak: round(envelope.peak),
          }
        : null,
      audio: {
        cue: currentStatus.cue,
        analysing: envelope?.available === true,
        html5Sources: getHtml5AnalyserCount(),
        html5Playing,
      },
      fps: statsRef.current.fps,
      canvas: {
        width: canvasRef.current?.width ?? 0,
        height: canvasRef.current?.height ?? 0,
      },
      capture: currentStatus.capture,
      error: currentStatus.error,
      errors: errorsRef.current.slice(-8),
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const api = {
      version: 2,
      get ready() {
        return readyRef.current;
      },
      listScenes: () =>
        WORKBENCH_SCENES.map(({ id, label, description, duration, cue }) => ({
          id,
          label,
          description,
          duration,
          cue,
        })),
      getState,
      selectScene,
      setTier,
      setSeed,
      setReducedMotion,
      setTime,
      play,
      pause,
      playCue,
      playHtml5Cue,
      capture,
      readCapture,
    };
    window.__creativeWorkbench = api;
    return () => {
      if (window.__creativeWorkbench === api) delete window.__creativeWorkbench;
    };
  }, [
    capture,
    getState,
    pause,
    play,
    playCue,
    playHtml5Cue,
    readCapture,
    selectScene,
    setReducedMotion,
    setSeed,
    setTier,
    setTime,
  ]);

  useEffect(() => {
    const update = () => {
      const next = getState();
      setInspector(JSON.stringify(next, null, 2));
      setPerformanceDiagnostics(next.diagnostics);
    };
    update();
    const interval = setInterval(update, 600);
    return () => clearInterval(interval);
  }, [getState]);

  const handleCapture = useCallback(async () => {
    await capture();
  }, [capture]);

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 text-slate-100">
      <header className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-amber-300/80">
          Development sandbox
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-white">Creative Workbench</h1>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-300">
          Mounts the graphics and audio layer through its production entry points. Freeze a frame,
          play an existing Lucky Meter recording, inspect the resolved plan and the live audio
          envelope, then capture a PNG for visual QA. Nothing here is reachable on a visitor route.
        </p>
      </header>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        <section className="space-y-4" aria-label="Scene">
          <div className="relative aspect-[16/10] w-full overflow-hidden rounded-2xl border border-slate-800 bg-[#04070f]">
            {/* A canvas can only ever hold one context type, so a scene change
                gets a fresh element rather than a refused 2D context. */}
            <canvas
              key={`${state.sceneId}-${state.tier}-${state.seed}-${state.reducedMotion ? 'calm' : 'motion'}`}
              ref={canvasRef}
              className="h-full w-full"
              aria-hidden="true"
            />
            {status.surface !== 'ready' ? (
              <p className="absolute inset-x-0 bottom-0 bg-slate-950/80 px-4 py-2 text-xs text-slate-300">
                {status.surface === 'building'
                  ? 'Building the selected surface…'
                  : `Surface unavailable (${status.error ?? 'unknown reason'}). The scene stays on its static fallback.`}
              </p>
            ) : null}
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
            <div className="flex flex-wrap gap-2" role="group" aria-label="Scene selection">
              {WORKBENCH_SCENES.map((entry) => (
                <button
                  key={entry.id}
                  type="button"
                  aria-pressed={entry.id === state.sceneId}
                  onClick={() => selectScene(entry.id)}
                  className={`rounded-full border px-3 py-1.5 text-sm transition ${
                    entry.id === state.sceneId
                      ? 'border-amber-300 bg-amber-300/15 text-amber-100'
                      : 'border-slate-700 text-slate-300 hover:border-slate-500'
                  }`}
                >
                  {entry.label}
                </button>
              ))}
            </div>

            <p className="mt-3 text-sm text-slate-400">{scene.description}</p>

            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              <label className="block text-xs font-medium uppercase tracking-wide text-slate-400">
                Tier
                <select
                  value={state.tier}
                  onChange={(event) => setTier(event.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-2 py-1.5 text-sm text-slate-100"
                >
                  {WORKBENCH_TIERS.map((tier) => (
                    <option key={tier.id} value={tier.id}>
                      {tier.id} (≤{tier.maxPixelRatio}×)
                    </option>
                  ))}
                </select>
              </label>

              <label className="block text-xs font-medium uppercase tracking-wide text-slate-400">
                Seed
                <input
                  type="number"
                  min={0}
                  max={999999}
                  value={state.seed}
                  onChange={(event) => setSeed(event.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-2 py-1.5 text-sm text-slate-100"
                />
              </label>

              <label className="flex items-center gap-2 self-end text-xs font-medium uppercase tracking-wide text-slate-400">
                <input
                  type="checkbox"
                  checked={state.reducedMotion}
                  onChange={(event) => setReducedMotion(event.target.checked)}
                  className="h-4 w-4 rounded border-slate-600 bg-slate-950"
                />
                Reduced motion
              </label>
            </div>

            <div className="mt-4">
              <label
                htmlFor="workbench-time"
                className="text-xs font-medium uppercase tracking-wide text-slate-400"
              >
                Scene clock — {state.time.toFixed(2)} s
              </label>
              <input
                id="workbench-time"
                type="range"
                min={0}
                max={scene.duration}
                step={0.05}
                value={state.time}
                onChange={(event) => setTime(Number(event.target.value))}
                className="mt-2 w-full accent-amber-300"
              />
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => (state.playing ? pause() : play())}
                className="rounded-full border border-slate-700 px-3 py-1.5 text-sm text-slate-200 hover:border-slate-500"
              >
                {state.playing ? 'Pause' : 'Play'}
              </button>
              <button
                type="button"
                onClick={() => playCue(scene.cue)}
                className="rounded-full border border-slate-700 px-3 py-1.5 text-sm text-slate-200 hover:border-slate-500"
              >
                Play cue “{scene.cue}”
              </button>
              <button
                type="button"
                onClick={handleCapture}
                className="rounded-full border border-amber-300/70 bg-amber-300/10 px-3 py-1.5 text-sm text-amber-100 hover:bg-amber-300/20"
              >
                Capture PNG
              </button>
            </div>

            <p className="mt-3 text-xs text-slate-500">
              The capture button downloads a PNG. WebGL canvases may refuse a direct read-back; use
              a Playwright screenshot of the stage for those, after <code>setTime()</code>.
            </p>
          </div>
        </section>

        <aside className="space-y-4" aria-label="Inspector">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
            <h2 className="text-sm font-semibold text-white">Agent inspection</h2>
            <p className="mt-1 text-xs text-slate-400">
              Every control is also available on <code>window.__creativeWorkbench</code>.
            </p>
            <pre className="mt-2 overflow-x-auto rounded-lg bg-slate-950 p-3 text-[11px] leading-relaxed text-slate-300">
{`__creativeWorkbench.getState()
__creativeWorkbench.selectScene('reactive-aurora')
__creativeWorkbench.setTier('constrained')
__creativeWorkbench.setReducedMotion(true)
__creativeWorkbench.setTime(2.5)
__creativeWorkbench.playCue('colourPour')
await __creativeWorkbench.capture()`}
            </pre>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
            <h2 className="text-sm font-semibold text-white">State</h2>
            <pre className="mt-2 max-h-[420px] overflow-auto rounded-lg bg-slate-950 p-3 text-[11px] leading-relaxed text-slate-300">
              {inspector}
            </pre>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 text-xs text-slate-400">
            <h2 className="text-sm font-semibold text-white">Performance health</h2>
            <dl className="mt-2 space-y-1">
              <div className="flex justify-between gap-3">
                <dt>Monitor</dt>
                <dd className="text-slate-200">{performanceDiagnostics?.monitor?.status ?? '—'}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt>Measured FPS</dt>
                <dd className="text-slate-200">
                  {performanceDiagnostics?.monitor?.fps != null ? performanceDiagnostics.monitor.fps : '—'}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt>Plan target</dt>
                <dd className="text-slate-200">
                  {performanceDiagnostics?.monitor?.targetFps != null
                    ? `${performanceDiagnostics.monitor.targetFps} fps`
                    : '—'}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt>Plan tier</dt>
                <dd className="text-slate-200">{performanceDiagnostics?.plan?.tier ?? '—'}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt>Evidence</dt>
                <dd className="text-slate-200">{performanceDiagnostics?.monitor?.evidence ?? '—'}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt>Source</dt>
                <dd className="text-slate-200">{performanceDiagnostics?.monitor?.source ?? '—'}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt>Warnings</dt>
                <dd className="text-right text-slate-200">
                  {performanceDiagnostics?.monitor?.warnings?.join(', ') || 'none'}
                </dd>
              </div>
            </dl>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 text-xs text-slate-400">
            <h2 className="text-sm font-semibold text-white">Resolved plan</h2>
            <dl className="mt-2 space-y-1">
              <div className="flex justify-between gap-3">
                <dt>Renderer</dt>
                <dd className="text-slate-200">{plan?.renderer ?? '—'}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt>Fallbacks</dt>
                <dd className="text-slate-200">{plan?.fallbacks?.join(' → ') || '—'}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt>Motion</dt>
                <dd className="text-slate-200">{plan?.motion ?? '—'}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt>Sound reactive</dt>
                <dd className="text-slate-200">{plan?.audioReactive ? 'yes' : 'no'}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt>Audio analysis</dt>
                <dd className="text-slate-200">
                  {inspector.includes('"analysing": true') ? 'attached' : 'not attached'}
                </dd>
              </div>
            </dl>
          </div>
        </aside>
      </div>
    </main>
  );
}
