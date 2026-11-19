/**
 * Automatic technology selection for a creative visual experience.
 *
 * A feature describes *what* it needs (a flat 2D layer, particles, a 3D scene,
 * post-processing, a timeline, synchronised audio) and this module decides
 * *which* existing technology should render it. Nothing here forces a rendering
 * engine: an experience that already owns a WebGL renderer keeps it, a 2D
 * overlay stays on Canvas 2D, and only a genuine 3D or post-processing request
 * opts into the lazy Three.js toolchain.
 *
 * Rules, inherited from `docs/graphics-rendering-architecture.md`:
 *   - Capability comes from the shared probes, never from device or vendor
 *     detection.
 *   - Reduced motion selects no motion technology; it is not a downgrade of the
 *     renderer.
 *   - Every choice names a fallback, so a caller always has somewhere to go.
 */

import {
  RENDER_QUALITY,
  prefersReducedMotion,
  supportsCanvas2D,
  supportsWebGL,
} from '../graphics-capabilities.js';

/** Render technologies the toolkit can build or adopt. */
export const GRAPHICS_TECHNOLOGY = Object.freeze({
  /** CSS/DOM only: gradients, shadows, keyframes, the page atmosphere. */
  DOM: 'dom',
  /** A managed Canvas 2D surface. */
  CANVAS2D: 'canvas2d',
  /** An existing hand-written WebGL renderer that keeps ownership of its frames. */
  WEBGL: 'webgl',
  /** The lazy Three.js stage (scene graph, PBR, shadows, post-processing). */
  THREE: 'three',
});

/** Motion technologies for choreography and transitions. */
export const MOTION_TECHNOLOGY = Object.freeze({
  NONE: 'none',
  CSS: 'css',
  GSAP: 'gsap',
});

/** Audio technologies for synchronised sound. */
export const AUDIO_TECHNOLOGY = Object.freeze({
  NONE: 'none',
  /** The site's existing Howler/Web Audio prepare-and-play path. */
  HOWLER: 'howler',
});

function tierOf(quality) {
  return quality?.tier === RENDER_QUALITY.HIGH || quality?.tier === RENDER_QUALITY.CONSTRAINED
    ? quality.tier
    : RENDER_QUALITY.BALANCED;
}

/**
 * Describes what an experience asked for. A renderer that is explicitly
 * `webgl` is an existing engine: it is never silently replaced by Three.js,
 * because that would change the artwork it draws.
 *
 * @param {{
 *   dimension?: '2d'|'3d',
 *   renderer?: 'dom'|'canvas2d'|'webgl'|'three'|'auto',
 *   postProcessing?: boolean,
 *   particles?: boolean,
 *   timeline?: boolean,
 *   audio?: boolean,
 * }} [requirements]
 */
export function normalizeRequirements(requirements = {}) {
  const renderer = requirements.renderer;
  return Object.freeze({
    dimension: requirements.dimension === '3d' ? '3d' : '2d',
    renderer:
      renderer === GRAPHICS_TECHNOLOGY.DOM ||
      renderer === GRAPHICS_TECHNOLOGY.CANVAS2D ||
      renderer === GRAPHICS_TECHNOLOGY.WEBGL ||
      renderer === GRAPHICS_TECHNOLOGY.THREE
        ? renderer
        : 'auto',
    postProcessing: requirements.postProcessing === true,
    particles: requirements.particles === true,
    timeline: requirements.timeline === true,
    audio: requirements.audio === true,
  });
}

/**
 * Resolves the render/motion/audio technologies for an experience.
 *
 * `renderer` is what should draw now; `fallbacks` is the ordered ladder the
 * caller may use when `renderer` fails. `postProcessing` is only ever true for
 * a Three.js stage, because the composer needs a Three renderer and scene.
 *
 * @param {object} [requirements]
 * @param {{ tier?: string, maxPixelRatio?: number }} [quality]
 * @returns {{
 *   renderer: string,
 *   fallbacks: string[],
 *   postProcessing: boolean,
 *   particles: boolean,
 *   motion: string,
 *   audio: string,
 *   tier: string,
 *   reducedMotion: boolean,
 *   reasons: string[],
 * }}
 */
export function selectGraphicsTechnologies(requirements = {}, quality) {
  const wanted = normalizeRequirements(requirements);
  const tier = tierOf(quality);
  const reducedMotion = prefersReducedMotion();
  const reasons = [];

  const wantsThree =
    wanted.renderer === GRAPHICS_TECHNOLOGY.THREE ||
    ((wanted.renderer === 'auto' || wanted.renderer === GRAPHICS_TECHNOLOGY.DOM) &&
      (wanted.dimension === '3d' || wanted.postProcessing));

  let renderer;
  let fallbacks;

  if (wanted.renderer === GRAPHICS_TECHNOLOGY.WEBGL) {
    // An existing engine keeps its renderer and its frames. The toolkit does
    // not take over, so the artwork stays exactly as it is.
    renderer = supportsWebGL() ? GRAPHICS_TECHNOLOGY.WEBGL : GRAPHICS_TECHNOLOGY.CANVAS2D;
    fallbacks = renderer === GRAPHICS_TECHNOLOGY.WEBGL ? [GRAPHICS_TECHNOLOGY.DOM] : [GRAPHICS_TECHNOLOGY.DOM];
    reasons.push('existing-webgl-renderer');
  } else if (wantsThree) {
    if (supportsWebGL()) {
      renderer = GRAPHICS_TECHNOLOGY.THREE;
      fallbacks = [GRAPHICS_TECHNOLOGY.CANVAS2D, GRAPHICS_TECHNOLOGY.DOM];
      reasons.push('three-requested-webgl-available');
    } else {
      renderer = supportsCanvas2D() ? GRAPHICS_TECHNOLOGY.CANVAS2D : GRAPHICS_TECHNOLOGY.DOM;
      fallbacks = [GRAPHICS_TECHNOLOGY.DOM];
      reasons.push('three-unavailable-webgl-missing');
    }
  } else if (
    wanted.renderer === GRAPHICS_TECHNOLOGY.CANVAS2D ||
    ((wanted.renderer === 'auto' || wanted.renderer === GRAPHICS_TECHNOLOGY.DOM) &&
      wanted.particles)
  ) {
    renderer = supportsCanvas2D() ? GRAPHICS_TECHNOLOGY.CANVAS2D : GRAPHICS_TECHNOLOGY.DOM;
    fallbacks = [GRAPHICS_TECHNOLOGY.DOM];
    reasons.push(renderer === GRAPHICS_TECHNOLOGY.CANVAS2D ? 'canvas2d-requested' : 'canvas2d-unavailable');
  } else {
    renderer = GRAPHICS_TECHNOLOGY.DOM;
    fallbacks = [];
    reasons.push('css-dom-atmosphere');
  }

  const postProcessing = wanted.postProcessing && renderer === GRAPHICS_TECHNOLOGY.THREE;
  if (wanted.postProcessing && !postProcessing) reasons.push('post-processing-not-available-for-renderer');

  let motion;
  if (reducedMotion) motion = MOTION_TECHNOLOGY.NONE;
  else if (wanted.timeline) motion = MOTION_TECHNOLOGY.GSAP;
  else motion = MOTION_TECHNOLOGY.CSS;

  const audio = wanted.audio ? AUDIO_TECHNOLOGY.HOWLER : AUDIO_TECHNOLOGY.NONE;

  return Object.freeze({
    renderer,
    fallbacks: Object.freeze(fallbacks),
    postProcessing,
    particles: wanted.particles,
    motion,
    audio,
    tier,
    reducedMotion,
    reasons: Object.freeze(reasons),
  });
}
