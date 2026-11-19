/**
 * Cinematic post-processing for a Three.js stage.
 *
 * A physically based scene only looks cinematic once the frame is graded: HDR
 * bloom for the light sources, tone mapping and sRGB output, and antialiasing.
 * This module composes those passes from Three.js's own published addons, so no
 * extra post-processing dependency is installed.
 *
 * Every effect is tiered by the same render-quality profile as the stage:
 * a constrained device keeps the scene but skips bloom and antialiasing rather
 * than dropping frames. Failure returns `null`, and the caller keeps rendering
 * with the plain stage.
 */

const EFFECT_BUDGETS = Object.freeze({
  high: Object.freeze({
    tier: 'high',
    bloom: true,
    bloomStrength: 0.6,
    bloomRadius: 0.5,
    bloomThreshold: 0.85,
    antialias: true,
    resolutionScale: 1,
  }),
  balanced: Object.freeze({
    tier: 'balanced',
    bloom: true,
    bloomStrength: 0.45,
    bloomRadius: 0.4,
    bloomThreshold: 0.88,
    antialias: true,
    resolutionScale: 0.85,
  }),
  constrained: Object.freeze({
    tier: 'constrained',
    bloom: false,
    bloomStrength: 0,
    bloomRadius: 0.3,
    bloomThreshold: 0.9,
    antialias: false,
    resolutionScale: 0.6,
  }),
});

/**
 * Resolves the post-processing budget for a quality profile. A caller can turn
 * an individual effect off, but cannot raise it above the tier's budget.
 *
 * @param {{ tier?: string }} [quality]
 * @param {{ bloom?: boolean, antialias?: boolean }} [overrides]
 * @returns {{ tier: 'high'|'balanced'|'constrained', bloom: boolean, bloomStrength: number, bloomRadius: number, bloomThreshold: number, antialias: boolean, resolutionScale: number }}
 */
export function resolveEffectBudget(quality, overrides = {}) {
  const tier = quality?.tier;
  const profile =
    tier === 'high' || tier === 'constrained' ? EFFECT_BUDGETS[tier] : EFFECT_BUDGETS.balanced;

  return Object.freeze({
    ...profile,
    bloom: typeof overrides.bloom === 'boolean' ? overrides.bloom && profile.bloom : profile.bloom,
    antialias:
      typeof overrides.antialias === 'boolean'
        ? overrides.antialias && profile.antialias
        : profile.antialias,
  });
}

/**
 * Builds an EffectComposer for an existing stage.
 *
 * Order: the scene renders in linear HDR, bloom adds the light bleed, the
 * output pass applies the renderer's tone mapping and sRGB conversion, and SMAA
 * cleans the final LDR edges.
 *
 * @param {{
 *   renderer?: any,
 *   scene?: any,
 *   camera?: any,
 *   quality?: { tier?: string },
 *   size?: { width: number, height: number, pixelRatio: number },
 *   bloom?: boolean,
 *   antialias?: boolean,
 * }} [options]
 * @returns {Promise<null | {
 *   composer: any,
 *   budget: object,
 *   readonly size: { width: number, height: number, pixelRatio: number },
 *   render: () => void,
 *   setSize: (size: { width?: number, height?: number, pixelRatio?: number }) => void,
 *   dispose: () => void,
 * }>}
 */
export async function createCinematicEffects({
  renderer,
  scene,
  camera,
  quality,
  size,
  bloom,
  antialias,
} = {}) {
  if (!renderer || !scene || !camera) return null;

  const budget = resolveEffectBudget(quality, { bloom, antialias });
  const initial = {
    width: Math.max(1, Math.round(Number.isFinite(size?.width) ? size.width : 1)),
    height: Math.max(1, Math.round(Number.isFinite(size?.height) ? size.height : 1)),
    pixelRatio:
      Number.isFinite(size?.pixelRatio) && size.pixelRatio > 0 ? size.pixelRatio : 1,
  };

  let composer;
  let bloomPass = null;
  let disposed = false;

  try {
    const [composerModule, renderPassModule, bloomModule, smaaModule, outputModule] =
      await Promise.all([
        import('three/addons/postprocessing/EffectComposer.js'),
        import('three/addons/postprocessing/RenderPass.js'),
        budget.bloom
          ? import('three/addons/postprocessing/UnrealBloomPass.js')
          : Promise.resolve(null),
        budget.antialias
          ? import('three/addons/postprocessing/SMAAPass.js')
          : Promise.resolve(null),
        import('three/addons/postprocessing/OutputPass.js'),
      ]);

    composer = new composerModule.EffectComposer(renderer);
    composer.addPass(new renderPassModule.RenderPass(scene, camera));

    if (budget.bloom && bloomModule) {
      // UnrealBloomPass accepts any { x, y } resolution; the composer resizes it
      // through setSize below.
      bloomPass = new bloomModule.UnrealBloomPass(
        { x: initial.width, y: initial.height },
        budget.bloomStrength,
        budget.bloomRadius,
        budget.bloomThreshold,
      );
      composer.addPass(bloomPass);
    }

    composer.addPass(new outputModule.OutputPass());

    if (budget.antialias && smaaModule) {
      composer.addPass(new smaaModule.SMAAPass());
    }

    applySize(initial);
  } catch {
    // A missing addon or an unsupported render target leaves the plain stage
    // intact instead of breaking the scene.
    try {
      composer?.dispose?.();
    } catch {
      // Nothing to release.
    }
    return null;
  }

  function applySize(next) {
    if (!composer) return;
    // A static resolution scale is how a lower tier spends less on the
    // full-screen passes without dropping the scene itself.
    composer.setPixelRatio(next.pixelRatio * budget.resolutionScale);
    composer.setSize(next.width, next.height);
  }

  function setSize(next = {}) {
    if (disposed || !composer) return;
    if (Number.isFinite(next.width)) initial.width = Math.max(1, Math.round(next.width));
    if (Number.isFinite(next.height)) initial.height = Math.max(1, Math.round(next.height));
    if (Number.isFinite(next.pixelRatio) && next.pixelRatio > 0) {
      initial.pixelRatio = next.pixelRatio;
    }
    applySize(initial);
  }

  function dispose() {
    if (disposed) return;
    disposed = true;
    if (!composer) return;
    for (const pass of composer.passes) {
      try {
        pass.dispose?.();
      } catch {
        // A pass that cannot release its targets must not block teardown.
      }
    }
    try {
      composer.dispose();
    } catch {
      // The renderer may already have released the targets.
    }
  }

  return {
    composer,
    budget,
    get size() {
      return { ...initial };
    },
    render() {
      if (disposed) return;
      composer.render();
    },
    setSize,
    dispose,
  };
}
