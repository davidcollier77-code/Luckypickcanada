import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { PointBatch } from '../app/lib/gpu-particles.js';

const originalGetContext = HTMLCanvasElement.prototype.getContext;
const originalMatchMedia = window.matchMedia;
const originalDevicePixelRatio = Object.getOwnPropertyDescriptor(window, 'devicePixelRatio');
const originalDeviceMemory = Object.getOwnPropertyDescriptor(navigator, 'deviceMemory');
const originalHardwareConcurrency = Object.getOwnPropertyDescriptor(
  navigator,
  'hardwareConcurrency',
);

function readSource(relativePath) {
  return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

async function loadModule() {
  vi.resetModules();
  return import('../app/lib/graphics-capabilities.js');
}

function installCanvasGetContext(implementation) {
  HTMLCanvasElement.prototype.getContext = vi.fn(implementation);
}

function fake2DContext() {
  return {
    fillRect: vi.fn(),
    createLinearGradient: vi.fn(),
  };
}

function fakeWebGLContext() {
  const loseContext = vi.fn();
  return {
    getExtension: vi.fn(() => ({ loseContext })),
    __loseContext: loseContext,
  };
}

afterEach(() => {
  HTMLCanvasElement.prototype.getContext = originalGetContext;
  window.matchMedia = originalMatchMedia;
  vi.unstubAllGlobals();
  vi.restoreAllMocks();

  if (originalDevicePixelRatio) {
    Object.defineProperty(window, 'devicePixelRatio', originalDevicePixelRatio);
  }
  if (originalDeviceMemory) {
    Object.defineProperty(navigator, 'deviceMemory', originalDeviceMemory);
  } else {
    delete navigator.deviceMemory;
  }
  if (originalHardwareConcurrency) {
    Object.defineProperty(navigator, 'hardwareConcurrency', originalHardwareConcurrency);
  } else {
    delete navigator.hardwareConcurrency;
  }
});

describe('graphics capability profile', () => {
  it('does not touch a canvas when the module is imported or the profile is read', async () => {
    const getContext = vi.fn(() => fake2DContext());
    installCanvasGetContext(getContext);

    const graphics = await loadModule();
    expect(getContext).not.toHaveBeenCalled();

    const profile = graphics.getGraphicsProfile();
    expect(profile.tier).toBe('standard');
    expect(getContext).not.toHaveBeenCalled();
  });

  it('uses conservative tiers and safe defaults for missing hints', async () => {
    const graphics = await loadModule();

    expect(graphics.resolveGraphicsTier({})).toBe('standard');
    expect(graphics.resolveGraphicsTier({ saveData: true })).toBe('constrained');
    expect(graphics.resolveGraphicsTier({ deviceMemory: 2 })).toBe('constrained');
    expect(graphics.resolveGraphicsTier({ hardwareConcurrency: 2 })).toBe('constrained');
    expect(
      graphics.resolveGraphicsTier({ deviceMemory: 8, hardwareConcurrency: 8 }),
    ).toBe('standard');
  });

  it('applies the constrained caps without changing a capable device', async () => {
    Object.defineProperty(navigator, 'deviceMemory', { value: 1, configurable: true });
    Object.defineProperty(navigator, 'hardwareConcurrency', { value: 8, configurable: true });

    const constrained = await loadModule();
    expect(constrained.getGraphicsProfile()).toMatchObject({
      tier: 'constrained',
      maxPixelRatio: 1.5,
      particleScale: 0.7,
    });

    Object.defineProperty(navigator, 'deviceMemory', { value: 8, configurable: true });
    const standard = await loadModule();
    expect(standard.getGraphicsProfile()).toMatchObject({
      tier: 'standard',
      maxPixelRatio: 2,
      particleScale: 1,
    });
  });

  it('clamps the canvas backing ratio to the profile cap', async () => {
    Object.defineProperty(window, 'devicePixelRatio', { value: 3, configurable: true });
    const graphics = await loadModule();

    expect(graphics.getCanvasPixelRatio()).toBe(2);
    expect(graphics.getCanvasPixelRatio(1.5)).toBe(1.5);
    expect(graphics.getCanvasPixelRatio(4)).toBe(3);

    Object.defineProperty(window, 'devicePixelRatio', { value: 0.5, configurable: true });
    expect(graphics.getCanvasPixelRatio()).toBe(1);
  });
});

describe('safe context acquisition', () => {
  it('returns a 2D context or null instead of throwing', async () => {
    const graphics = await loadModule();
    const canvas = document.createElement('canvas');
    const context = fake2DContext();

    installCanvasGetContext(() => context);
    expect(graphics.getCanvas2DContext(canvas)).toBe(context);

    installCanvasGetContext(() => {
      throw new Error('context denied');
    });
    expect(graphics.getCanvas2DContext(canvas)).toBeNull();
    expect(graphics.getCanvas2DContext(null)).toBeNull();
  });

  it('tries the standard and legacy WebGL names and strips renderer-forcing options', async () => {
    const graphics = await loadModule();
    const canvas = document.createElement('canvas');
    const calls = [];
    const gl = fakeWebGLContext();

    installCanvasGetContext((name, attributes) => {
      calls.push({ name, attributes });
      return name === 'experimental-webgl' ? gl : null;
    });

    const context = graphics.getWebGLContext(canvas, {
      alpha: true,
      powerPreference: 'high-performance',
      failIfMajorPerformanceCaveat: true,
    });

    expect(context).toBe(gl);
    expect(calls.map((call) => call.name)).toEqual(['webgl', 'experimental-webgl']);
    for (const call of calls) {
      expect(call.attributes).not.toHaveProperty('powerPreference');
      expect(call.attributes).not.toHaveProperty('failIfMajorPerformanceCaveat');
      expect(call.attributes.alpha).toBe(true);
    }
  });

  it('caches each capability probe for the page lifetime', async () => {
    const context = fake2DContext();
    const gl = fakeWebGLContext();
    const getContext = vi.fn((name) => {
      if (name === '2d') return context;
      if (name === 'webgl') return gl;
      return null;
    });
    installCanvasGetContext(getContext);

    const graphics = await loadModule();
    expect(getContext).not.toHaveBeenCalled();

    expect(graphics.supportsCanvas2D()).toBe(true);
    expect(graphics.supportsCanvas2D()).toBe(true);
    expect(graphics.supportsWebGL()).toBe(true);
    expect(graphics.supportsWebGL()).toBe(true);

    // One 2D probe, one WebGL probe; repeated questions are cached.
    expect(getContext).toHaveBeenCalledTimes(2);
    expect(gl.__loseContext).toHaveBeenCalledTimes(1);
  });

  it('detects Path2D without requiring a rendering context', async () => {
    vi.stubGlobal('Path2D', undefined);
    const withoutPath2D = await loadModule();
    expect(withoutPath2D.supportsPath2D()).toBe(false);

    vi.stubGlobal('Path2D', function Path2D() {});
    const withPath2D = await loadModule();
    expect(withPath2D.supportsPath2D()).toBe(true);
  });
});

describe('motion and visibility', () => {
  it('subscribes with the modern media-query listener and cleans up', async () => {
    const addEventListener = vi.fn();
    const removeEventListener = vi.fn();
    window.matchMedia = vi.fn(() => ({
      matches: false,
      addEventListener,
      removeEventListener,
    }));

    const graphics = await loadModule();
    const listener = vi.fn();
    const cleanup = graphics.onReducedMotionChange(listener);

    expect(addEventListener).toHaveBeenCalledWith('change', expect.any(Function));
    cleanup();
    expect(removeEventListener).toHaveBeenCalledWith('change', expect.any(Function));
  });

  it('falls back to the legacy media-query listener and reports the initial state', async () => {
    const addListener = vi.fn();
    const removeListener = vi.fn();
    window.matchMedia = vi.fn(() => ({
      matches: true,
      addListener,
      removeListener,
    }));

    const graphics = await loadModule();
    expect(graphics.prefersReducedMotion()).toBe(true);

    const listener = vi.fn();
    const cleanup = graphics.onReducedMotionChange(listener);
    expect(addListener).toHaveBeenCalledWith(expect.any(Function));

    cleanup();
    expect(removeListener).toHaveBeenCalledWith(expect.any(Function));
  });

  it('removes the visibility listener on cleanup', async () => {
    const graphics = await loadModule();
    const removeEventListener = vi.spyOn(document, 'removeEventListener');
    const listener = vi.fn();

    const cleanup = graphics.onVisibilityChange(listener);
    document.dispatchEvent(new Event('visibilitychange'));
    expect(listener).toHaveBeenCalledWith(true);

    cleanup();
    expect(removeEventListener).toHaveBeenCalledWith('visibilitychange', expect.any(Function));
  });
});

describe('context loss', () => {
  it('cancels WebGL loss, observes 2D loss and removes every listener', async () => {
    const graphics = await loadModule();
    const canvas = document.createElement('canvas');
    const onLost = vi.fn();
    const onRestored = vi.fn();
    const cleanup = graphics.watchContextLoss(canvas, { onLost, onRestored });

    const webglLost = new Event('webglcontextlost', { cancelable: true });
    canvas.dispatchEvent(webglLost);
    expect(webglLost.defaultPrevented).toBe(true);
    expect(onLost).toHaveBeenCalledTimes(1);

    // A 2D loss is observed only: cancelling it would prevent restoration.
    const canvasLost = new Event('contextlost', { cancelable: true });
    canvas.dispatchEvent(canvasLost);
    expect(canvasLost.defaultPrevented).toBe(false);
    expect(onLost).toHaveBeenCalledTimes(1);

    canvas.dispatchEvent(new Event('webglcontextrestored'));
    expect(onRestored).toHaveBeenCalledTimes(1);

    const removeEventListener = vi.spyOn(canvas, 'removeEventListener');
    cleanup();
    expect(removeEventListener).toHaveBeenCalledTimes(4);
  });
});

describe('cinematic render quality', () => {
  it('keeps a capable desktop on the full near/far pipeline', async () => {
    const graphics = await loadModule();
    expect(
      graphics.resolveRenderQuality({
        hardwareConcurrency: 8,
        deviceMemory: 8,
        viewportWidth: 1440,
        viewportHeight: 900,
        pixelRatio: 1,
      }),
    ).toMatchObject({
      tier: 'high',
      maxPixelRatio: 2,
      particleScale: 1.2,
      foreground: true,
      haze: true,
      sparkBudget: 900,
    });
  });

  it('steps down from measured backing-store cost rather than device class', async () => {
    const graphics = await loadModule();

    // A high-DPI phone with many cores is not assumed weak, but its large
    // backing store resolves to the balanced profile.
    expect(
      graphics.resolveRenderQuality({
        hardwareConcurrency: 8,
        deviceMemory: 8,
        viewportWidth: 390,
        viewportHeight: 844,
        pixelRatio: 3,
        coarsePointer: true,
      }).tier,
    ).toBe('balanced');

    // A 4K desktop surface costs more than a smaller one at the same CPU hints.
    expect(
      graphics.resolveRenderQuality({
        hardwareConcurrency: 8,
        deviceMemory: 8,
        viewportWidth: 3840,
        viewportHeight: 2160,
        pixelRatio: 1,
      }).tier,
    ).toBe('balanced');
  });

  it('drops the optional near surface on constrained devices and save-data', async () => {
    const graphics = await loadModule();
    for (const options of [
      { saveData: true },
      { deviceMemory: 2 },
      { hardwareConcurrency: 2 },
      { profileTier: 'constrained' },
    ]) {
      expect(graphics.resolveRenderQuality(options)).toMatchObject({
        tier: 'constrained',
        maxPixelRatio: 1.25,
        particleScale: 0.55,
        foreground: false,
        haze: false,
        sparkBudget: 280,
      });
    }
  });
});

describe('renderer source guards', () => {
  const sharedSource = readSource('app/lib/graphics-capabilities.js');
  const engineSource = readSource('components/cosmic-event-engine.js');
  const medallionSource = readSource('components/lucky-meter-medallion-engine.js');
  const ornamentSource = readSource('components/lucky-meter-ornament-engine.js');
  const particleSource = readSource('app/lib/gpu-particles.js');
  const stageSource = readSource('components/CosmicEventStage.jsx');
  const homePageSource = readSource('app/homepage/HomePage.js');
  const revealSource = readSource('app/lucky-card-reveal.js');
  const cardShareSource = readSource('app/lucky-card-share.js');
  const confettiSource = readSource('app/lib/mapleLeafConfetti.mjs');

  it('never identifies a browser or forces a renderer', () => {
    for (const source of [sharedSource, engineSource, medallionSource, ornamentSource]) {
      expect(source).not.toMatch(/navigator\.userAgent/);
      expect(source).not.toMatch(/--use-gl|--use-angle/);
      expect(source).not.toMatch(/failIfMajorPerformanceCaveat\s*:/);
      expect(source).not.toMatch(/powerPreference\s*:/);
      // A comment may explain why a software fallback is allowed; executable
      // code must not select or reject SwiftShader by name.
      expect(source).not.toMatch(/getContext\([^)]*swiftshader/i);
      expect(source).not.toMatch(/if\s*\([^)]*swiftshader/i);
    }
    expect(engineSource).not.toMatch(/swiftshader/i);
    expect(medallionSource).not.toMatch(/swiftshader/i);
  });

  it('can cap per-frame point work without reallocating the batch', () => {
    const batch = new PointBatch(8, 32);
    batch.maxPoints = 3;
    for (let index = 0; index < 6; index += 1) {
      batch.push(index, index, 2, [1, 1, 1], 0.8, 1, 64);
    }
    expect(batch.count).toBe(3);
    expect(batch.dropped).toBe(3);
    expect(batch.capacity).toBe(8);
    expect(batch.positions).toBeInstanceOf(Float32Array);
  });

  it('shares one audited point pipeline with the cosmic stage', () => {
    expect(particleSource).toContain('POINT_VERTEX_SHADER');
    expect(particleSource).toContain('POINT_FRAGMENT_SHADER');
    expect(particleSource).toContain('export class PointBatch');
    expect(engineSource).toContain("from '../app/lib/gpu-particles'");
    expect(engineSource).not.toContain('attribute vec2 a_position');
  });

  it('renders the medallion and the leaves through the shared lit-mesh pipeline', () => {
    // Both are surfaces with normals, not point sprites: they must reuse the
    // one mesh program and keep their GLSL in the shared module.
    for (const meshConsumer of [medallionSource, ornamentSource]) {
      expect(meshConsumer).toContain("from '../app/lib/gpu-lighting'");
      expect(meshConsumer).toContain('createMeshProgram');
      expect(meshConsumer).not.toContain('attribute vec3 a_position');
      expect(meshConsumer).not.toContain('precision highp float');
    }
    expect(medallionSource).toContain('buildMedallionGeometry');
    expect(ornamentSource).toContain('buildMapleLeafGeometry');
  });

  it('shares one light bus so effects illuminate the gold they sit beside', () => {
    expect(engineSource).toContain('publishSceneLights');
    expect(medallionSource).toContain('getSceneLights');
    expect(ornamentSource).toContain('getSceneLights');
  });

  it('adopts safe acquisition and the context-loss lifecycle', () => {
    expect(homePageSource).toContain('getCanvas2DContext');
    expect(homePageSource).toContain('watchContextLoss');
    expect(revealSource).toContain('getCanvas2DContext');
    expect(revealSource).toContain('watchContextLoss');
    expect(engineSource).toContain('getWebGLContext');
    expect(engineSource).toContain('watchContextLoss');
    expect(medallionSource).toContain('getWebGLContext');
    expect(medallionSource).toContain('watchContextLoss');
    expect(ornamentSource).toContain('watchContextLoss');
    expect(stageSource).toContain('onContextLost');
    expect(cardShareSource).toContain('Unable to create the share image.');
    expect(confettiSource).toContain('supportsPath2D');
  });
});
