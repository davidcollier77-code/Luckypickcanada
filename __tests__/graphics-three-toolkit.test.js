import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it, vi } from 'vitest';

import {
  createCinematicEffects,
  resolveEffectBudget,
} from '../app/lib/graphics/effects.js';
import { loadGLTF } from '../app/lib/graphics/assets.js';
import { disposeSceneResources } from '../app/lib/graphics/resources.js';
import { createThreeStage, resolveStageBudget } from '../app/lib/graphics/stage.js';

function readToolkitSource(name) {
  return readFileSync(join(process.cwd(), 'app', 'lib', 'graphics', name), 'utf8');
}

describe('resolveStageBudget', () => {
  it('caps the high tier at 2x DPR with shadows and MSAA', () => {
    const budget = resolveStageBudget({ tier: 'high', maxPixelRatio: 2 });
    expect(budget.tier).toBe('high');
    expect(budget.maxPixelRatio).toBe(2);
    expect(budget.antialias).toBe(true);
    expect(budget.shadows).toBe(true);
    expect(budget.shadowMapSize).toBe(2048);
  });

  it('drops shadows on the balanced tier', () => {
    const budget = resolveStageBudget({ tier: 'balanced' });
    expect(budget.shadows).toBe(false);
    expect(budget.antialias).toBe(true);
    expect(budget.maxPixelRatio).toBe(1.6);
  });

  it('keeps the constrained tier cheap but renderable', () => {
    const budget = resolveStageBudget({ tier: 'constrained' });
    expect(budget.antialias).toBe(false);
    expect(budget.shadows).toBe(false);
    expect(budget.maxPixelRatio).toBe(1.25);
    expect(budget.maxLights).toBe(1);
  });

  it('defaults an unknown tier to balanced rather than the most expensive path', () => {
    expect(resolveStageBudget(undefined).tier).toBe('balanced');
    expect(resolveStageBudget({ tier: 'ultra' }).tier).toBe('balanced');
    expect(resolveStageBudget({ tier: 'high', maxPixelRatio: 0 }).maxPixelRatio).toBe(2);
  });
});

describe('resolveEffectBudget', () => {
  it('enables bloom and antialiasing on capable tiers', () => {
    const budget = resolveEffectBudget({ tier: 'high' });
    expect(budget.bloom).toBe(true);
    expect(budget.antialias).toBe(true);
    expect(budget.resolutionScale).toBe(1);
  });

  it('disables bloom and antialiasing on the constrained tier', () => {
    const budget = resolveEffectBudget({ tier: 'constrained' });
    expect(budget.bloom).toBe(false);
    expect(budget.antialias).toBe(false);
    expect(budget.resolutionScale).toBeLessThan(1);
  });

  it('lets a caller lower an effect but never raise it above the tier', () => {
    expect(resolveEffectBudget({ tier: 'high' }, { bloom: false }).bloom).toBe(false);
    expect(resolveEffectBudget({ tier: 'constrained' }, { bloom: true }).bloom).toBe(false);
  });
});

describe('safe fallbacks', () => {
  it('returns null from the stage when there is no usable canvas', async () => {
    await expect(createThreeStage()).resolves.toBeNull();
    await expect(createThreeStage({ canvas: {} })).resolves.toBeNull();
  });

  it('returns null from the effects composer when the stage is incomplete', async () => {
    await expect(createCinematicEffects()).resolves.toBeNull();
    await expect(createCinematicEffects({ renderer: {} })).resolves.toBeNull();
  });

  it('returns null from the model loader for an unusable URL', async () => {
    await expect(loadGLTF('')).resolves.toBeNull();
    await expect(loadGLTF(null)).resolves.toBeNull();
  });
});

describe('disposeSceneResources', () => {
  it('disposes geometry, shared materials and their textures', () => {
    const texture = { isTexture: true, dispose: vi.fn() };
    const material = { map: texture, dispose: vi.fn() };
    const secondMaterial = { normalMap: [texture], dispose: vi.fn() };
    const geometry = { dispose: vi.fn() };
    const mesh = { geometry, material: [material, secondMaterial] };
    const empty = {};

    disposeSceneResources({
      traverse: (callback) => [mesh, empty].forEach(callback),
    });

    expect(geometry.dispose).toHaveBeenCalledTimes(1);
    expect(material.dispose).toHaveBeenCalledTimes(1);
    expect(secondMaterial.dispose).toHaveBeenCalledTimes(1);
    expect(texture.dispose).toHaveBeenCalledTimes(2);
  });

  it('tolerates a missing graph, a partial object and a throwing material', () => {
    expect(() => disposeSceneResources()).not.toThrow();
    expect(() => disposeSceneResources({})).not.toThrow();

    const throwingMaterial = {
      get map() {
        throw new Error('detached');
      },
      dispose: vi.fn(),
    };
    expect(() =>
      disposeSceneResources({
        traverse: (callback) => callback({ geometry: { dispose: vi.fn() }, material: throwingMaterial }),
      }),
    ).not.toThrow();
    expect(throwingMaterial.dispose).toHaveBeenCalledTimes(1);
  });
});

describe('architecture guards', () => {
  const stageSource = readToolkitSource('stage.js');
  const effectsSource = readToolkitSource('effects.js');
  const assetsSource = readToolkitSource('assets.js');

  it('never imports Three.js statically, so pages that do not use 3D ship none of it', () => {
    for (const source of [stageSource, effectsSource, assetsSource]) {
      expect(source).not.toMatch(/from\s+['"]three['"]/);
      expect(source).not.toMatch(/from\s+['"]three\/addons/);
    }
    expect(stageSource).toContain("await import('three')");
    expect(effectsSource).toContain("import('three/addons/postprocessing/EffectComposer.js')");
    expect(assetsSource).toContain("import('three/addons/loaders/GLTFLoader.js')");
  });

  it('keeps the browser in charge of the graphics backend', () => {
    for (const source of [stageSource, effectsSource]) {
      // Match an actual option assignment, not the contract comment that names
      // the forbidden options.
      expect(source).not.toMatch(/\bpowerPreference\s*:/);
      expect(source).not.toMatch(/\bfailIfMajorPerformanceCaveat\s*:/);
      expect(source).not.toContain('WEBGL_debug_renderer_info');
      expect(source).not.toContain('navigator.userAgent');
    }
  });

  it('does not require or select WebGPU', () => {
    for (const source of [stageSource, effectsSource, assetsSource]) {
      expect(source).not.toContain('navigator.gpu');
      expect(source).not.toContain('WebGPURenderer');
      expect(source).not.toContain('requestAdapter');
    }
  });

  it('takes quality and frame cadence from the shared layers', () => {
    // The guard asserts the real import, not a phrase in the module header.
    expect(stageSource).toContain("from '../graphics-capabilities.js'");
    expect(stageSource).toContain('getRenderQuality');
    expect(stageSource).toContain('createAdaptiveFrameLoop');
    expect(stageSource).toContain('watchContextLoss');
    expect(stageSource).toContain('onReducedMotionChange');
  });

  it('runs SMAA in linear space before the output pass converts to sRGB', () => {
    const smaa = effectsSource.indexOf('SMAAPass());');
    const output = effectsSource.indexOf('OutputPass());');
    expect(smaa).toBeGreaterThan(-1);
    expect(output).toBeGreaterThan(-1);
    expect(smaa).toBeLessThan(output);
  });

  it('exposes the bloom pass and the clock reset that a restored context needs', () => {
    expect(effectsSource).toContain('bloomPass,');
    expect(effectsSource).toContain('setBloom');
    expect(stageSource).toContain('clock.start()');
    expect(stageSource).not.toContain('clock.getDelta();\n    },\n    dispose() {},');
  });
});
