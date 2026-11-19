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
 */

import { getRenderQuality } from '../graphics-capabilities.js';
import { createCanvas2DSurface } from './canvas-surface.js';
import { createCinematicEffects } from './effects.js';
import { createThreeStage } from './stage.js';
import { GRAPHICS_TECHNOLOGY, selectGraphicsTechnologies } from './technologies.js';

/**
 * @param {{
 *   canvas?: HTMLCanvasElement,
 *   requirements?: object,
 *   quality?: { tier?: string, maxPixelRatio?: number },
 *   onFrame?: (frame: { kind: string, delta: number, elapsed: number, stage?: any, effects?: any, context?: CanvasRenderingContext2D, size: { width: number, height: number, pixelRatio?: number } }) => void,
 *   onContextLost?: () => void,
 *   onContextRestored?: () => void,
 *   onError?: (error: unknown) => void,
 * }} [options]
 * @returns {Promise<null | {
 *   kind: string,
 *   plan: object,
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
  onFrame,
  onContextLost,
  onContextRestored,
  onError,
} = {}) {
  if (!canvas) return null;

  const resolvedQuality = quality ?? getRenderQuality();
  const plan = selectGraphicsTechnologies(requirements, resolvedQuality);

  if (plan.renderer === GRAPHICS_TECHNOLOGY.THREE) {
    let effects = null;
    const stage = await createThreeStage({
      canvas,
      quality: resolvedQuality,
      onFrame: (frame) => {
        if (typeof onFrame === 'function') {
          onFrame({
            kind: GRAPHICS_TECHNOLOGY.THREE,
            delta: frame.delta,
            elapsed: frame.elapsed,
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
    if (!stage) return null;

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
        // The composer owns render targets that reference the renderer.
        effects?.dispose();
        effects = null;
        stage.dispose();
      },
    };
  }

  if (plan.renderer === GRAPHICS_TECHNOLOGY.CANVAS2D) {
    const surface = createCanvas2DSurface({
      canvas,
      quality: resolvedQuality,
      onFrame: (frame) => {
        if (typeof onFrame !== 'function') return;
        onFrame({
          kind: GRAPHICS_TECHNOLOGY.CANVAS2D,
          delta: frame.delta,
          elapsed: frame.elapsed,
          context: frame.context,
          size: frame.size,
        });
      },
      onContextLost,
      onContextRestored,
      onError,
    });
    if (!surface) return null;

    return {
      kind: GRAPHICS_TECHNOLOGY.CANVAS2D,
      plan,
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
      dispose: () => surface.dispose(),
    };
  }

  // DOM/CSS, or an existing WebGL engine that owns its own frames. The caller
  // keeps rendering; this object only reports the plan and provides a no-op
  // lifecycle so generic cleanup code works the same way.
  return {
    kind: plan.renderer,
    plan,
    size: { width: 0, height: 0 },
    running: false,
    start() {},
    stop() {},
    render() {},
    resize() {},
    dispose() {},
  };
}
