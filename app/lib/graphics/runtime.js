/**
 * The automatic entry point for building a creative visual.
 *
 * A feature supplies a canvas and a description of what it needs. The runtime
 * selects the technology (`technologies.js`) and builds the matching surface:
 *
 *   - Three.js: a budgeted stage plus the cinematic composer when requested.
 *   - Canvas 2D: a managed surface with adaptive frames and DPR handling.
 *   - An existing WebGL engine: nothing is created. The engine keeps drawing,
 *     and the runtime only reports the selected plan.
 *
 * Every branch returns the same lifecycle (`start`, `stop`, `render`, `dispose`),
 * so a consumer never branches on the renderer. A failed selection returns
 * `null`: keep the static artwork.
 *
 * When the requirements ask for sound reactivity, the surface also owns the
 * audio envelope for the existing mix: each frame carries `envelope` and the
 * returned `reactive` object exposes the bindings (`bindLightRig`,
 * `bindParticleField`, `bindValue`, `onBeat`). A feature that does not ask for
 * it pays nothing: no analyser, no reads, no work.
 */

import { getRenderQuality } from '../graphics-capabilities.js';
import { createAudioReactive } from './audio-reactivity.js';
import { createCanvas2DSurface } from './canvas-surface.js';
import { createCinematicEffects } from './effects.js';
import { createThreeStage } from './stage.js';
import { GRAPHICS_TECHNOLOGY, selectGraphicsTechnologies } from './technologies.js';

/**
 * @param {{
 *   canvas?: HTMLCanvasElement,
 *   requirements?: object,
 *   quality?: { tier?: string, maxPixelRatio?: number },
 *   reducedMotion?: boolean,
 *   onFrame?: (frame: { kind: string, delta: number, elapsed: number, envelope?: object|null, stage?: any, effects?: any, context?: CanvasRenderingContext2D, size: { width: number, height: number, pixelRatio?: number } }) => void,
 *   onContextLost?: () => void,
 *   onContextRestored?: () => void,
 *   onError?: (error: unknown) => void,
 * }} [options]
 * @returns {Promise<null | {
 *   kind: string,
 *   plan: object,
 *   reactive: object|null,
 *   stage?: any,
 *   effects?: any,
 *   context?: CanvasRenderingContext2D,
 *   readonly size: object,
 *   readonly running: boolean,
 *   start: () => void,
 *   stop: () => void,
 *   render: () => void,
 *   resize: () => void,
 *   dispose: () => void,
 * }>}
 */
export async function createCreativeSurface({
  canvas,
  requirements = {},
  quality,
  reducedMotion,
  onFrame,
  onContextLost,
  onContextRestored,
  onError,
} = {}) {
  if (!canvas) return null;

  const resolvedQuality = quality ?? getRenderQuality();
  // `reducedMotion` is an optional override for a deterministic harness; a
  // normal experience passes nothing and the visitor's preference applies.
  const plan = selectGraphicsTechnologies(requirements, resolvedQuality, { reducedMotion });

  function createReactivity() {
    if (!plan.audioReactive) return null;
    return createAudioReactive({
      // The plan already resolved reduced motion, so the surface and the
      // envelope always agree about whether motion is allowed.
      reducedMotion: plan.reducedMotion,
      onError,
    });
  }

  if (plan.renderer === GRAPHICS_TECHNOLOGY.THREE) {
    let effects = null;
    const reactive = createReactivity();
    const stage = await createThreeStage({
      canvas,
      quality: resolvedQuality,
      onFrame: (frame) => {
        // Update the envelope (and its bindings) before the caller's frame so a
        // light pulse or particle intensity reflects the sound of this frame.
        const envelope = reactive?.update(frame.delta) ?? null;
        if (typeof onFrame === 'function') {
          onFrame({
            kind: GRAPHICS_TECHNOLOGY.THREE,
            delta: frame.delta,
            elapsed: frame.elapsed,
            envelope,
            stage,
            effects,
            size: stage?.size,
          });
        }
        // Render after the callback so the frame includes the caller's updates.
        if (effects) effects.render();
        else frame.renderer.render(frame.scene, frame.camera);
      },
      onResize: (frame) => effects?.setSize(frame),
      onContextLost,
      onContextRestored,
      onError,
    });
    if (!stage) {
      reactive?.dispose();
      return null;
    }

    if (plan.postProcessing) {
      effects = await createCinematicEffects({
        renderer: stage.renderer,
        scene: stage.scene,
        camera: stage.camera,
        quality: resolvedQuality,
        size: stage.size,
      });
    }

    return {
      kind: GRAPHICS_TECHNOLOGY.THREE,
      plan,
      reactive,
      stage,
      effects,
      get size() {
        return stage.size;
      },
      get running() {
        return stage.running;
      },
      start: () => stage.start(),
      stop: () => stage.stop(),
      render: () => stage.render(),
      resize: () => stage.resize(),
      dispose() {
        reactive?.dispose();
        // The composer owns render targets that reference the renderer.
        effects?.dispose();
        effects = null;
        stage.dispose();
      },
    };
  }

  if (plan.renderer === GRAPHICS_TECHNOLOGY.CANVAS2D) {
    const reactive = createReactivity();
    const surface = createCanvas2DSurface({
      canvas,
      quality: resolvedQuality,
      onFrame: (frame) => {
        const envelope = reactive?.update(frame.delta / 1000) ?? null;
        if (typeof onFrame !== 'function') return;
        onFrame({
          kind: GRAPHICS_TECHNOLOGY.CANVAS2D,
          delta: frame.delta,
          elapsed: frame.elapsed,
          envelope,
          context: frame.context,
          size: frame.size,
        });
      },
      onContextLost,
      onContextRestored,
      onError,
    });
    if (!surface) {
      reactive?.dispose();
      return null;
    }

    return {
      kind: GRAPHICS_TECHNOLOGY.CANVAS2D,
      plan,
      reactive,
      context: surface.context,
      get size() {
        return surface.size;
      },
      get running() {
        return surface.running;
      },
      start: () => surface.start(),
      stop: () => surface.stop(),
      render: () => surface.render(),
      resize: () => surface.resize(),
      dispose() {
        reactive?.dispose();
        surface.dispose();
      },
    };
  }

  // DOM/CSS, or an existing WebGL engine that owns its own frames. The caller
  // keeps rendering; this object only reports the plan and provides a no-op
  // lifecycle so generic cleanup code works the same way. Reactivity is not
  // created here: nothing in this branch would ever advance the envelope.
  return {
    kind: plan.renderer,
    plan,
    reactive: null,
    size: { width: 0, height: 0 },
    running: false,
    start() {},
    stop() {},
    render() {},
    resize() {},
    dispose() {},
  };
}
