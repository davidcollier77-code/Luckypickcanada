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
  const constants = {
    MAX_TEXTURE_SIZE: 1,
    MAX_RENDERBUFFER_SIZE: 2,
    MAX_VIEWPORT_DIMS: 3,
    MAX_VERTEX_ATTRIBS: 4,
    MAX_TEXTURE_IMAGE_UNITS: 5,
    MAX_COMBINED_TEXTURE_IMAGE_UNITS: 6,
  };
  const values = {
    1: 8192,
    2: 8192,
    3: new Int32Array([16384, 16384]),
    4: 16,
    5: 16,
    6: 32,
  };
  return {
    ...constants,
    getExtension: vi.fn(() => ({ loseContext })),
    getParameter: vi.fn((parameter) => values[parameter] ?? null),
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

    // One 2D probe, then WebGL2 (absent) and WebGL1 (present); repeated
    // questions and the shared feature report reuse the cached results.
    expect(getContext).toHaveBeenCalledTimes(3);
    expect(getContext.mock.calls.map(([name]) => name)).toEqual(['2d', 'webgl2', 'webgl']);
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

describe('device assessment and display demand', () => {
  it('reads the hardware hints once and reuses the cached assessment', async () => {
    let memoryReads = 0;
    let coreReads = 0;
    Object.defineProperty(navigator, 'deviceMemory', {
      configurable: true,
      get() {
        memoryReads += 1;
        return 8;
      },
    });
    Object.defineProperty(navigator, 'hardwareConcurrency', {
      configurable: true,
      get() {
        coreReads += 1;
        return 8;
      },
    });

    const graphics = await loadModule();
    const first = graphics.getDeviceAssessment();
    const second = graphics.getDeviceAssessment();

    expect(second).toBe(first);
    expect(first).toMatchObject({
      capabilityTier: 'high',
      confidence: 'high',
      unknownSignals: [],
      memoryGb: 8,
      cores: 8,
    });
    expect(memoryReads).toBe(1);
    expect(coreReads).toBe(1);
  });

  it('refreshes the shared assessment only at the explicit adaptive boundary', async () => {
    Object.defineProperty(navigator, 'deviceMemory', { value: 8, configurable: true });
    Object.defineProperty(navigator, 'hardwareConcurrency', { value: 8, configurable: true });

    const graphics = await loadModule();
    expect(graphics.getDeviceAssessment().capabilityTier).toBe('high');

    Object.defineProperty(navigator, 'deviceMemory', { value: 1, configurable: true });
    // A normal read stays cached; the plan boundary is what refreshes it.
    expect(graphics.getDeviceAssessment().capabilityTier).toBe('high');
    expect(graphics.refreshDeviceAssessment().capabilityTier).toBe('constrained');
    expect(graphics.getDeviceAssessment().capabilityTier).toBe('constrained');
  });

  it('never treats missing signals as a weak device', async () => {
    const graphics = await loadModule();
    const assessment = graphics.getDeviceAssessment({ navigatorObject: {} });

    expect(assessment).toMatchObject({
      capabilityTier: 'balanced',
      confidence: 'none',
      unknownSignals: ['memory', 'cores'],
      memoryGb: null,
      cores: null,
    });
    expect(assessment.reasons).toContain('missing-signals');
  });

  it('classifies known low, moderate and plentiful hints independently', async () => {
    const graphics = await loadModule();

    expect(
      graphics.assessDeviceCapabilities({ memoryGb: 1, cores: 8 }),
    ).toMatchObject({ capabilityTier: 'constrained', confidence: 'high' });
    expect(
      graphics.assessDeviceCapabilities({ memoryGb: 4, cores: 8 }),
    ).toMatchObject({ capabilityTier: 'balanced', confidence: 'high' });
    expect(
      graphics.assessDeviceCapabilities({ memoryGb: 8 }),
    ).toMatchObject({ capabilityTier: 'high', confidence: 'partial' });
    expect(
      graphics.assessDeviceCapabilities({ cores: 8 }),
    ).toMatchObject({ capabilityTier: 'high', confidence: 'partial' });
  });

  it('separates display demand from capability', async () => {
    const graphics = await loadModule();
    const cases = [
      [{ viewportWidth: 1024, viewportHeight: 768, pixelRatio: 1 }, 'light'],
      [{ viewportWidth: 1920, viewportHeight: 1080, pixelRatio: 1 }, 'moderate'],
      [{ viewportWidth: 2560, viewportHeight: 1440, pixelRatio: 1 }, 'heavy'],
      [{ viewportWidth: 3840, viewportHeight: 2160, pixelRatio: 1 }, 'extreme'],
      [{ viewportWidth: 360, viewportHeight: 780, pixelRatio: 3 }, 'moderate'],
    ];

    for (const [sources, demand] of cases) {
      expect(graphics.getDisplayDemand(sources).demand).toBe(demand);
    }
  });
});

describe('graphics feature report', () => {
  it('reports WebGL2 and scalar limits from one released probe', async () => {
    const context = fake2DContext();
    const gl = fakeWebGLContext();
    const getContext = vi.fn((name) => {
      if (name === '2d') return context;
      if (name === 'webgl2') return gl;
      return null;
    });
    installCanvasGetContext(getContext);

    const graphics = await loadModule();
    const features = graphics.getGraphicsFeatures();

    expect(features).toMatchObject({
      canvas2d: true,
      webgl: true,
      webgl2: true,
      path2d: expect.any(Boolean),
    });
    expect(features.limits).toMatchObject({
      maxTextureSize: 8192,
      maxRenderbufferSize: 8192,
      maxViewportDims: [16384, 16384],
      maxVertexAttribs: 16,
      maxTextureUnits: 16,
      maxCombinedTextureUnits: 32,
    });
    expect(features).toBe(graphics.getGraphicsFeatures());
    expect(gl.__loseContext).toHaveBeenCalledTimes(1);
  });

  it('falls back to WebGL1 when WebGL2 is unavailable', async () => {
    const gl = fakeWebGLContext();
    const calls = [];
    installCanvasGetContext((name) => {
      calls.push(name);
      if (name === '2d') return fake2DContext();
      if (name === 'webgl') return gl;
      return null;
    });

    const graphics = await loadModule();
    const features = graphics.getGraphicsFeatures();

    expect(features).toMatchObject({ webgl: true, webgl2: false });
    expect(calls).toEqual(['2d', 'webgl2', 'webgl']);
    expect(gl.__loseContext).toHaveBeenCalledTimes(1);
  });
});

describe('render budget diagnostics', () => {
  function budgetFor({ width, height, ratio, memory = 8, cores = 8, coarsePointer = false, saveData = false }) {
    const graphicsPromise = loadModule();
    return graphicsPromise.then((graphics) => {
      const display = graphics.getDisplayDemand({
        viewportWidth: width,
        viewportHeight: height,
        pixelRatio: ratio,
      });
      const quality = graphics.resolveRenderQuality({
        profileTier: saveData ? 'constrained' : 'standard',
        saveData,
        deviceMemory: memory,
        hardwareConcurrency: cores,
        viewportWidth: width,
        viewportHeight: height,
        pixelRatio: ratio,
        coarsePointer,
      });
      return graphics.describeRenderBudget({
        quality,
        assessment: graphics.assessDeviceCapabilities({ memoryGb: memory, cores }),
        display,
        saveData,
        coarsePointer,
      });
    });
  }

  it('keeps the 4K surface gate while reporting high capability', async () => {
    const budget = await budgetFor({ width: 3840, height: 2160, ratio: 1 });

    expect(budget.assessment.capabilityTier).toBe('high');
    expect(budget.display.demand).toBe('extreme');
    expect(budget.render.tier).toBe('balanced');
    expect(budget.limitedBy).toEqual(['surface']);
    expect(budget.gates.backingStore).toMatchObject({
      limit: 3_000_000,
      value: 8_294_400,
      active: true,
    });
  });

  it('names the legacy pointer-density gate without calling the device weak', async () => {
    const budget = await budgetFor({
      width: 360,
      height: 780,
      ratio: 3,
      coarsePointer: true,
    });

    expect(budget.assessment.capabilityTier).toBe('high');
    expect(budget.render.tier).toBe('balanced');
    expect(budget.limitedBy).toEqual(['legacy-pointer-density']);
    expect(budget.gates.coarsePointerDensity.active).toBe(true);
  });

  it('names both surface gates on a 3 MP high-DPI phone', async () => {
    const budget = await budgetFor({
      width: 393,
      height: 852,
      ratio: 3,
      coarsePointer: true,
    });

    expect(budget.render.tier).toBe('balanced');
    expect(budget.limitedBy).toEqual(['surface', 'legacy-pointer-density']);
  });

  it('leaves a capable 1080p surface unrestricted', async () => {
    const budget = await budgetFor({ width: 1920, height: 1080, ratio: 1 });

    expect(budget.render.tier).toBe('high');
    expect(budget.limitedBy).toEqual([]);
  });

  it('separates Save-Data policy from hardware capability', async () => {
    const budget = await budgetFor({
      width: 1920,
      height: 1080,
      ratio: 1,
      saveData: true,
    });

    expect(budget.assessment.capabilityTier).toBe('high');
    expect(budget.render.tier).toBe('constrained');
    expect(budget.limitedBy).toEqual(['policy']);
  });

  it('reports a genuinely moderate device as capability-limited', async () => {
    const budget = await budgetFor({
      width: 412,
      height: 915,
      ratio: 2.625,
      memory: 4,
      cores: 8,
    });

    expect(budget.assessment.capabilityTier).toBe('balanced');
    expect(budget.render.tier).toBe('balanced');
    expect(budget.limitedBy).toEqual(['capability']);
  });

  it('names every active limiter on a moderate high-resolution device', async () => {
    const budget = await budgetFor({
      width: 3840,
      height: 2160,
      ratio: 1,
      memory: 4,
      cores: 8,
    });

    expect(budget.render.tier).toBe('balanced');
    expect(budget.limitedBy).toEqual(['surface', 'capability']);
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
  const meterSource = readSource('app/lib/lucky-meter/meter-scene.js');
  const meterStageSource = readSource('components/LuckyMeterStage.jsx');
  const ornamentSource = readSource('components/lucky-meter-ornament-engine.js');
  const particleSource = readSource('app/lib/gpu-particles.js');
  const stageSource = readSource('components/CosmicEventStage.jsx');
  const homePageSource = readSource('app/homepage/HomePage.js');
  const revealSource = readSource('app/lucky-card-reveal.js');
  const cardShareSource = readSource('app/lucky-card-share.js');
  const confettiSource = readSource('app/lib/mapleLeafConfetti.mjs');

  it('never identifies a browser or forces a renderer', () => {
    for (const source of [sharedSource, engineSource, meterSource, meterStageSource, ornamentSource]) {
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
    expect(meterSource).not.toMatch(/swiftshader/i);
    // Scalar limits only: never request a vendor, renderer or unmasked string.
    expect(sharedSource).not.toMatch(/UNMASKED_|WEBGL_debug_renderer_info/);
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

  it('builds the meter through the shared creative toolkit, never its own renderer', () => {
    // The whole meter is one scene on the shared surface: the runtime owns the
    // renderer and frame loop, and the scene owns only its objects and state.
    expect(meterSource).toContain("from '../graphics/runtime.js'");
    expect(meterSource).toContain('createCreativeSurface');
    expect(meterSource).toContain('createMaterialLibrary');
    expect(meterSource).toContain('createLightRig');
    expect(meterSource).toContain('createParticleField');
    expect(meterSource).toContain('buildMapleLeafGeometry');
    expect(meterSource).not.toMatch(/from ['"]three['"]/);
    expect(meterSource).not.toContain('attribute vec3 a_position');
    expect(meterSource).not.toContain('precision highp float');

    // The background leaves still use the shared lit-mesh pipeline.
    expect(ornamentSource).toContain("from '../app/lib/gpu-lighting'");
    expect(ornamentSource).toContain('createMeshProgram');
    expect(ornamentSource).not.toContain('attribute vec3 a_position');
    expect(ornamentSource).not.toContain('precision highp float');
    expect(ornamentSource).toContain('buildMapleLeafGeometry');
  });

  it('shares one light bus so effects illuminate the gold they sit beside', () => {
    expect(engineSource).toContain('publishSceneLights');
    expect(meterSource).toContain('createLightRig');
    expect(ornamentSource).toContain('getSceneLights');
  });

  it('adopts safe acquisition and the context-loss lifecycle', () => {
    expect(homePageSource).toContain('getCanvas2DContext');
    expect(homePageSource).toContain('watchContextLoss');
    expect(revealSource).toContain('getCanvas2DContext');
    expect(revealSource).toContain('watchContextLoss');
    expect(engineSource).toContain('getWebGLContext');
    expect(engineSource).toContain('watchContextLoss');
    // The meter delegates acquisition and loss handling to the shared surface.
    expect(meterSource).toContain('onContextLost');
    expect(meterSource).toContain('onContextRestored');
    expect(meterStageSource).toContain('onUnavailable');
    expect(ornamentSource).toContain('watchContextLoss');
    expect(stageSource).toContain('onContextLost');
    expect(cardShareSource).toContain('Unable to create the share image.');
    expect(confettiSource).toContain('supportsPath2D');
  });
});
