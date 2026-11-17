import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';

const originalMatchMedia = window.matchMedia;
const originalConnection = Object.getOwnPropertyDescriptor(navigator, 'connection');
const originalDeviceMemory = Object.getOwnPropertyDescriptor(navigator, 'deviceMemory');
const originalHardwareConcurrency = Object.getOwnPropertyDescriptor(navigator, 'hardwareConcurrency');
const originalVisibility = Object.getOwnPropertyDescriptor(Document.prototype, 'visibilityState');

function readSource(relativePath) {
  return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

async function loadModule() {
  vi.resetModules();
  return import('../app/lib/adaptive-performance.js');
}

function stubConnection(value) {
  Object.defineProperty(navigator, 'connection', { value, configurable: true });
}

function stubDevice({ memory, cores }) {
  // Explicitly mask the values: jsdom may provide them on the prototype, so
  // `delete` would fall back to an inherited hint rather than hiding it.
  Object.defineProperty(navigator, 'deviceMemory', { value: memory, configurable: true });
  Object.defineProperty(navigator, 'hardwareConcurrency', { value: cores, configurable: true });
}

function stubMotionPreference(reduce) {
  window.matchMedia = vi.fn((query) => ({
    matches: query.includes('prefers-reduced-motion') ? reduce : false,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
  }));
}

function stubVisibility(state) {
  Object.defineProperty(document, 'visibilityState', { value: state, configurable: true });
}

afterEach(() => {
  window.matchMedia = originalMatchMedia;
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  vi.useRealTimers();

  if (originalConnection) {
    Object.defineProperty(navigator, 'connection', originalConnection);
  } else {
    delete navigator.connection;
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
  if (originalVisibility) {
    Object.defineProperty(document, 'visibilityState', originalVisibility);
  }
});

describe('network evaluation', () => {
  it('reports an unsupported Network Information API without inventing a constraint', async () => {
    stubConnection(undefined);
    const adaptive = await loadModule();

    const network = adaptive.readNetworkState();
    expect(network).toMatchObject({
      supported: false,
      saveData: false,
      effectiveType: null,
      downlinkMbps: null,
      rttMs: null,
    });
    expect(adaptive.classifyNetwork(network)).toBe('unknown');

    const plan = adaptive.resolveAdaptivePlan({ network });
    expect(plan.prefetch).toBe('intent');
    expect(plan.audioPreload).toBe('eager');
    expect(plan.imageQuality).toBe('full');
  });

  it('reads the prefixed connection object and rejects unknown labels', async () => {
    stubConnection({ effectiveType: '5g', downlink: 12, rtt: 40 });
    const adaptive = await loadModule();

    expect(adaptive.readNetworkState()).toMatchObject({
      supported: true,
      effectiveType: null,
      downlinkMbps: 12,
      rttMs: 40,
    });
  });

  it('never interprets a network label as 5G or 5G Advanced', async () => {
    const adaptive = await loadModule();
    for (const label of ['5g', '5g-advanced', '5g+', '4g']) {
      // A label alone is not evidence of speed: 4g resolves unknown, and no
      // 5G label is even accepted as a known effective type.
      expect(adaptive.classifyNetwork({ effectiveType: label })).not.toBe('fast');
    }
    expect(adaptive.readNetworkState({ connection: { effectiveType: '5g' } }).effectiveType).toBeNull();
  });

  it('prefers measured throughput and latency over the label', async () => {
    const adaptive = await loadModule();

    // A "4g" label cannot rescue a measured 0.4 Mbps pipe.
    expect(
      adaptive.classifyNetwork({ effectiveType: '4g', downlinkMbps: 0.4, rttMs: 700 }),
    ).toBe('slow');

    // A "slow-2g" label cannot suppress a measured 10 Mbps pipe.
    expect(
      adaptive.classifyNetwork({ effectiveType: 'slow-2g', downlinkMbps: 10, rttMs: 40 }),
    ).toBe('fast');
  });

  it('classifies fast, moderate and slow measurements', async () => {
    const adaptive = await loadModule();
    expect(adaptive.classifyNetwork({ downlinkMbps: 10, rttMs: 50 })).toBe('fast');
    expect(adaptive.classifyNetwork({ downlinkMbps: 2, rttMs: 250 })).toBe('moderate');
    expect(adaptive.classifyNetwork({ downlinkMbps: 0.5, rttMs: 250 })).toBe('slow');
    expect(adaptive.classifyNetwork({ downlinkMbps: 6, rttMs: 600 })).toBe('slow');
    expect(adaptive.classifyNetwork({ effectiveType: '2g' })).toBe('slow');
    expect(adaptive.classifyNetwork({ effectiveType: '3g' })).toBe('moderate');
  });

  it('treats Save-Data as a slow connection regardless of the label', async () => {
    const adaptive = await loadModule();
    expect(adaptive.classifyNetwork({ saveData: true, downlinkMbps: 20, rttMs: 30 })).toBe('slow');
  });
});

describe('device evaluation', () => {
  it('keeps missing hints as capable rather than guessing weakness', async () => {
    stubDevice({ memory: undefined, cores: undefined });
    stubConnection(undefined);
    const adaptive = await loadModule();

    const device = adaptive.readDeviceState();
    expect(device.memoryGb).toBeNull();
    expect(device.cores).toBeNull();

    const plan = adaptive.resolveAdaptivePlan({ network: adaptive.readNetworkState(), device });
    expect(plan.tier).toBe('high');
    expect(plan.frameRate).toBe(60);
    expect(plan.animationBudget).toBe('full');
    expect(plan.releaseIdleResources).toBe(false);
  });

  it('ignores non-numeric and zero hints', async () => {
    stubDevice({ memory: 0, cores: Number.NaN });
    const adaptive = await loadModule();
    const device = adaptive.readDeviceState();
    expect(device.memoryGb).toBeNull();
    expect(device.cores).toBeNull();
  });

  it('reports browser features through the existing lazy probes', async () => {
    const adaptive = await loadModule();
    const capabilities = adaptive.getAdaptiveCapabilities();

    expect(capabilities.features).toEqual({
      canvas2d: expect.any(Boolean),
      webgl: expect.any(Boolean),
      path2d: expect.any(Boolean),
    });
    expect(capabilities.renderQuality).toHaveProperty('tier');
    expect(capabilities.plan).toHaveProperty('frameRate');
  });
});

describe('adaptive plan across representative profiles', () => {
  const profiles = [
    {
      name: 'low-capability mobile (1 GB, 2 cores, Save-Data, measured slow)',
      network: { saveData: true, downlinkMbps: 0.4, rttMs: 700, effectiveType: '3g' },
      device: { memoryGb: 1, cores: 2, pixelRatio: 2, viewportWidth: 320, viewportHeight: 568 },
      expected: {
        tier: 'constrained',
        frameRate: 30,
        animationBudget: 'reduced',
        prefetch: 'none',
        audioPreload: 'intent',
        imageQuality: 'economy',
        maxParallelRequests: 2,
      },
    },
    {
      name: 'medium-capability mobile (4 GB, 4 cores, moderate network)',
      network: { downlinkMbps: 2, rttMs: 250, effectiveType: '4g' },
      device: { memoryGb: 4, cores: 4, pixelRatio: 3, viewportWidth: 390, viewportHeight: 844 },
      expected: {
        tier: 'balanced',
        frameRate: 60,
        animationBudget: 'full',
        prefetch: 'strong-intent',
        audioPreload: 'eager',
        imageQuality: 'balanced',
        maxParallelRequests: 4,
      },
    },
    {
      name: 'high-capability mobile (8 GB, 8 cores, fast network)',
      network: { downlinkMbps: 20, rttMs: 40, effectiveType: '4g' },
      device: { memoryGb: 8, cores: 8, pixelRatio: 3, viewportWidth: 430, viewportHeight: 932 },
      expected: {
        tier: 'high',
        frameRate: 60,
        animationBudget: 'full',
        prefetch: 'intent',
        audioPreload: 'eager',
        imageQuality: 'full',
        maxParallelRequests: 6,
      },
    },
    {
      name: 'low-capability desktop (2 GB, 2 cores)',
      network: { downlinkMbps: 5, rttMs: 80 },
      device: { memoryGb: 2, cores: 2, pixelRatio: 1, viewportWidth: 1366, viewportHeight: 768 },
      expected: {
        tier: 'constrained',
        frameRate: 30,
        animationBudget: 'reduced',
        prefetch: 'intent',
        audioPreload: 'intent',
        imageQuality: 'balanced',
        maxParallelRequests: 4,
      },
    },
    {
      name: 'medium-capability desktop (8 GB, 4 cores, fast)',
      network: { downlinkMbps: 20, rttMs: 40 },
      device: { memoryGb: 8, cores: 4, pixelRatio: 1, viewportWidth: 1440, viewportHeight: 900 },
      expected: {
        tier: 'balanced',
        frameRate: 60,
        animationBudget: 'full',
        prefetch: 'intent',
        audioPreload: 'eager',
        imageQuality: 'full',
        maxParallelRequests: 6,
      },
    },
    {
      name: 'high-capability desktop (8 GB, 16 cores, fast)',
      network: { downlinkMbps: 50, rttMs: 20 },
      device: { memoryGb: 8, cores: 16, pixelRatio: 2, viewportWidth: 1920, viewportHeight: 1080 },
      expected: {
        tier: 'high',
        frameRate: 60,
        animationBudget: 'full',
        prefetch: 'intent',
        audioPreload: 'eager',
        imageQuality: 'full',
        maxParallelRequests: 6,
      },
    },
  ];

  it.each(profiles)('keeps $name within its justified budgets', async (profile) => {
    const adaptive = await loadModule();
    const plan = adaptive.resolveAdaptivePlan({
      network: profile.network,
      device: profile.device,
    });
    expect(plan).toMatchObject(profile.expected);
  });

  it('marks every reduction with a reason and leaves capable plans reason-clean', async () => {
    const adaptive = await loadModule();

    const constrained = adaptive.resolveAdaptivePlan({
      network: { saveData: true, downlinkMbps: 0.4, rttMs: 700 },
      device: { memoryGb: 1, cores: 2, reducedMotion: false },
    });
    expect(constrained.reasons).toEqual(
      expect.arrayContaining(['save-data', 'low-memory', 'low-cores']),
    );

    const capable = adaptive.resolveAdaptivePlan({
      network: { downlinkMbps: 30, rttMs: 30 },
      device: { memoryGb: 8, cores: 12, reducedMotion: false },
    });
    expect(capable.reasons).toEqual(['capable-device']);
  });
});

describe('reduced motion and visibility', () => {
  it('pauses animation for reduced motion without touching functional budgets', async () => {
    const adaptive = await loadModule();
    const base = adaptive.resolveAdaptivePlan({
      network: { downlinkMbps: 20, rttMs: 30 },
      device: { memoryGb: 8, cores: 8, reducedMotion: false },
    });
    const reduced = adaptive.resolveAdaptivePlan({
      network: { downlinkMbps: 20, rttMs: 30 },
      device: { memoryGb: 8, cores: 8, reducedMotion: true },
    });

    expect(reduced.frameRate).toBe(0);
    expect(reduced.animationBudget).toBe('minimal');
    expect(reduced.prefetch).toBe(base.prefetch);
    expect(reduced.audioPreload).toBe(base.audioPreload);
    expect(reduced.imageQuality).toBe(base.imageQuality);
    expect(reduced.maxParallelRequests).toBe(base.maxParallelRequests);
    expect(reduced.reasons).toContain('reduced-motion');
  });

  it('stops the frame budget on a hidden page and restores it when visible', async () => {
    const adaptive = await loadModule();
    const device = { memoryGb: 8, cores: 8, reducedMotion: false };
    const network = { downlinkMbps: 20, rttMs: 30 };

    const hidden = adaptive.resolveAdaptivePlan({ network, device, visible: false });
    expect(hidden.visible).toBe(false);
    expect(hidden.frameRate).toBe(0);
    expect(hidden.reasons).toContain('hidden-page');

    const visible = adaptive.resolveAdaptivePlan({ network, device, visible: true });
    expect(visible.frameRate).toBe(60);
  });

  it('releases idle resources when a constrained page is hidden', async () => {
    const adaptive = await loadModule();
    const plan = adaptive.resolveAdaptivePlan({
      network: { downlinkMbps: 0.4, rttMs: 700 },
      device: { memoryGb: 2, cores: 2 },
      visible: false,
    });
    expect(plan.releaseIdleResources).toBe(true);
  });
});

describe('heap pressure', () => {
  it('never fails when the non-standard heap API is absent', async () => {
    const adaptive = await loadModule();
    expect(adaptive.readHeapPressure({})).toEqual({
      supported: false,
      ratio: null,
      pressure: false,
    });
  });

  it('steps down only above the pressure threshold', async () => {
    const adaptive = await loadModule();
    const below = adaptive.readHeapPressure({
      memory: { usedJSHeapSize: 40, jsHeapSizeLimit: 100 },
    });
    const above = adaptive.readHeapPressure({
      memory: { usedJSHeapSize: 90, jsHeapSizeLimit: 100 },
    });

    expect(below).toMatchObject({ supported: true, pressure: false });
    expect(above).toMatchObject({ supported: true, pressure: true });

    const plan = adaptive.resolveAdaptivePlan({
      network: { downlinkMbps: 20, rttMs: 30 },
      device: { memoryGb: 8, cores: 16 },
      heap: above,
    });
    expect(plan.tier).toBe('constrained');
    expect(plan.releaseIdleResources).toBe(true);
    expect(plan.reasons).toContain('memory-pressure');
  });
});

describe('shared subscription and cleanup', () => {
  it('shares one listener set across subscribers and removes everything on the last unsubscribe', async () => {
    stubDevice({ memory: 8, cores: 8 });
    stubConnection({ downlink: 20, rtt: 30, addEventListener: vi.fn(), removeEventListener: vi.fn() });
    const windowAdd = vi.spyOn(window, 'addEventListener');
    const documentAdd = vi.spyOn(document, 'addEventListener');
    const windowRemove = vi.spyOn(window, 'removeEventListener');
    const documentRemove = vi.spyOn(document, 'removeEventListener');

    const adaptive = await loadModule();
    const first = vi.fn();
    const second = vi.fn();
    const unsubscribeFirst = adaptive.subscribeToAdaptivePlan(first);
    const unsubscribeSecond = adaptive.subscribeToAdaptivePlan(second);

    // One shared subscription, not one per consumer.
    expect(windowAdd.mock.calls.filter(([type]) => type === 'resize')).toHaveLength(1);
    expect(documentAdd.mock.calls.filter(([type]) => type === 'visibilitychange')).toHaveLength(1);
    expect(first).toHaveBeenCalledTimes(1);
    expect(second).toHaveBeenCalledTimes(1);

    unsubscribeFirst();
    unsubscribeFirst(); // Idempotent.
    unsubscribeSecond();

    expect(windowRemove.mock.calls.filter(([type]) => type === 'resize')).toHaveLength(1);
    expect(documentRemove.mock.calls.filter(([type]) => type === 'visibilitychange')).toHaveLength(1);
  });

  it('reassesses after a connection change and recovers when it improves', async () => {
    vi.useFakeTimers();
    stubDevice({ memory: 8, cores: 8 });
    stubConnection({ downlink: 0.4, rtt: 700, addEventListener: vi.fn(), removeEventListener: vi.fn() });

    const adaptive = await loadModule();
    const listener = vi.fn();
    const unsubscribe = adaptive.subscribeToAdaptivePlan(listener);

    expect(listener.mock.calls.at(-1)[0]).toMatchObject({
      prefetch: 'none',
      imageQuality: 'economy',
    });

    // The browser reports a better connection; the change event is debounced.
    stubConnection({ downlink: 30, rtt: 30, addEventListener: vi.fn(), removeEventListener: vi.fn() });
    window.dispatchEvent(new Event('resize'));
    vi.advanceTimersByTime(150);

    expect(listener.mock.calls.at(-1)[0]).toMatchObject({
      prefetch: 'intent',
      imageQuality: 'full',
      networkClass: 'fast',
    });

    unsubscribe();
    expect(vi.getTimerCount()).toBe(0);
  });

  it('isolates a throwing subscriber', async () => {
    vi.useFakeTimers();
    stubDevice({ memory: 8, cores: 8 });
    stubConnection({ downlink: 20, rtt: 30, addEventListener: vi.fn(), removeEventListener: vi.fn() });
    const adaptive = await loadModule();
    const healthy = vi.fn();

    expect(() =>
      adaptive.subscribeToAdaptivePlan(() => {
        throw new Error('consumer failure');
      }),
    ).not.toThrow();

    const unsubscribe = adaptive.subscribeToAdaptivePlan(healthy);

    stubConnection({ downlink: 0.5, rtt: 600, addEventListener: vi.fn(), removeEventListener: vi.fn() });
    window.dispatchEvent(new Event('resize'));
    expect(() => vi.advanceTimersByTime(150)).not.toThrow();
    expect(healthy).toHaveBeenCalled();

    unsubscribe();
  });

  it('reads the connection-change event on the legacy listener API', async () => {
    const addListener = vi.fn();
    const removeListener = vi.fn();
    stubDevice({ memory: 8, cores: 8 });
    stubConnection({ downlink: 20, rtt: 30, addListener, removeListener });

    const adaptive = await loadModule();
    const unsubscribe = adaptive.subscribeToAdaptivePlan(() => {});
    expect(addListener).toHaveBeenCalledTimes(1);
    unsubscribe();
    expect(removeListener).toHaveBeenCalledTimes(1);
  });

  it('is server-safe and performs no work at import time', async () => {
    const getContext = vi.spyOn(HTMLCanvasElement.prototype, 'getContext');
    const adaptive = await loadModule();

    expect(getContext).not.toHaveBeenCalled();
    expect(adaptive.getAdaptivePlan()).toHaveProperty('tier');
    expect(getContext).not.toHaveBeenCalled();
  });
});

describe('animation frame governor', () => {
  function createFakeScheduler() {
    let nextId = 1;
    const pending = new Map();
    return {
      requestFrame: (callback) => {
        const id = nextId++;
        pending.set(id, callback);
        return id;
      },
      cancelFrame: (id) => pending.delete(id),
      runNext(time) {
        const entry = pending.entries().next();
        if (entry.done) return false;
        const [id, callback] = entry.value;
        pending.delete(id);
        callback(time);
        return true;
      },
      get size() {
        return pending.size;
      },
    };
  }

  it('paints every frame on a capable device', async () => {
    stubDevice({ memory: 8, cores: 8 });
    const adaptive = await loadModule();
    adaptive.refreshAdaptivePlan();

    const scheduler = createFakeScheduler();
    const draw = vi.fn();
    const loop = adaptive.createAdaptiveFrameLoop(scheduler);
    loop.request(draw);

    scheduler.runNext(0);
    scheduler.runNext(16);
    scheduler.runNext(32);

    expect(draw).toHaveBeenCalledTimes(3);
    loop.dispose();
  });

  it('halves the cadence on a constrained device and restores it when conditions improve', async () => {
    stubDevice({ memory: 1, cores: 2 });
    const adaptive = await loadModule();
    adaptive.refreshAdaptivePlan();

    const scheduler = createFakeScheduler();
    const draw = vi.fn();
    const loop = adaptive.createAdaptiveFrameLoop(scheduler);
    loop.request(draw);

    scheduler.runNext(0); // Paints.
    scheduler.runNext(10); // Skipped, still inside 33 ms.
    scheduler.runNext(17); // Skipped.
    scheduler.runNext(34); // Paints.
    expect(draw).toHaveBeenCalledTimes(2);

    stubDevice({ memory: 8, cores: 8 });
    adaptive.refreshAdaptivePlan();
    scheduler.runNext(50);
    scheduler.runNext(66);
    expect(draw).toHaveBeenCalledTimes(4);

    loop.dispose();
  });

  it('stops scheduling when the page is hidden and when motion is reduced', async () => {
    stubDevice({ memory: 8, cores: 8 });
    const adaptive = await loadModule();
    stubVisibility('hidden');
    adaptive.refreshAdaptivePlan();

    const hiddenScheduler = createFakeScheduler();
    const hiddenDraw = vi.fn();
    const hiddenLoop = adaptive.createAdaptiveFrameLoop(hiddenScheduler);
    hiddenLoop.request(hiddenDraw);
    hiddenScheduler.runNext(0);

    expect(hiddenDraw).not.toHaveBeenCalled();
    expect(hiddenScheduler.size).toBe(0);

    stubVisibility('visible');
    stubMotionPreference(true);
    adaptive.refreshAdaptivePlan();

    const reducedScheduler = createFakeScheduler();
    const reducedDraw = vi.fn();
    const reducedLoop = adaptive.createAdaptiveFrameLoop(reducedScheduler);
    reducedLoop.request(reducedDraw);
    reducedScheduler.runNext(0);

    expect(reducedDraw).not.toHaveBeenCalled();
    hiddenLoop.dispose();
    reducedLoop.dispose();
  });

  it('cancels and disposes without painting or leaking a frame', async () => {
    stubDevice({ memory: 8, cores: 8 });
    const adaptive = await loadModule();
    adaptive.refreshAdaptivePlan();

    const scheduler = createFakeScheduler();
    const draw = vi.fn();
    const loop = adaptive.createAdaptiveFrameLoop(scheduler);
    loop.request(draw);
    loop.cancel();
    expect(loop.scheduled).toBe(false);

    scheduler.runNext(0);
    expect(draw).not.toHaveBeenCalled();
    expect(scheduler.size).toBe(0);
  });

  it('uses the real requestAnimationFrame when no scheduler is injected', async () => {
    const raf = vi.spyOn(window, 'requestAnimationFrame').mockReturnValue(7);
    const adaptive = await loadModule();
    const loop = adaptive.createAdaptiveFrameLoop();
    loop.request(() => {});
    expect(raf).toHaveBeenCalled();
    loop.dispose();
  });
});

describe('resource release registry', () => {
  it('runs every registered release once per pressure episode', async () => {
    const adaptive = await loadModule();
    const first = vi.fn();
    const second = vi.fn();
    const unregisterFirst = adaptive.registerReleasableResource(first);
    adaptive.registerReleasableResource(second);

    expect(adaptive.releaseRegisteredResources('test')).toBe(2);
    expect(first).toHaveBeenCalledWith('test');
    expect(second).toHaveBeenCalledWith('test');

    unregisterFirst();
    unregisterFirst();
    expect(adaptive.releaseRegisteredResources('test')).toBe(1);
  });

  it('continues when one release callback throws', async () => {
    const adaptive = await loadModule();
    const healthy = vi.fn();
    adaptive.registerReleasableResource(() => {
      throw new Error('release failure');
    });
    adaptive.registerReleasableResource(healthy);

    expect(() => adaptive.releaseRegisteredResources('test')).not.toThrow();
    expect(healthy).toHaveBeenCalledTimes(1);
  });
});

describe('prefetch and audio policy', () => {
  it('requires strong intent on a moderate connection and allows hover on a fast one', async () => {
    const adaptive = await loadModule();

    const moderate = adaptive.resolveAdaptivePlan({
      network: { downlinkMbps: 2, rttMs: 250 },
      device: { memoryGb: 8, cores: 8 },
    });
    expect(adaptive.shouldPrefetchOnIntent(moderate, 'hover')).toBe(false);
    expect(adaptive.shouldPrefetchOnIntent(moderate, 'strong')).toBe(true);

    const fast = adaptive.resolveAdaptivePlan({
      network: { downlinkMbps: 30, rttMs: 30 },
      device: { memoryGb: 8, cores: 8 },
    });
    expect(adaptive.shouldPrefetchOnIntent(fast, 'hover')).toBe(true);
    expect(adaptive.shouldPrefetchOnIntent(fast, 'strong')).toBe(true);

    const slow = adaptive.resolveAdaptivePlan({
      network: { saveData: true, downlinkMbps: 30, rttMs: 30 },
      device: { memoryGb: 8, cores: 8 },
    });
    expect(adaptive.shouldPrefetchOnIntent(slow, 'strong')).toBe(false);
  });

  it('defers speculative audio only under a measured constraint', async () => {
    const adaptive = await loadModule();
    expect(
      adaptive.allowSpeculativeAudio(
        adaptive.resolveAdaptivePlan({
          network: { downlinkMbps: 30, rttMs: 30 },
          device: { memoryGb: 8, cores: 8 },
        }),
      ),
    ).toBe(true);
    expect(
      adaptive.allowSpeculativeAudio(
        adaptive.resolveAdaptivePlan({
          network: { saveData: true, downlinkMbps: 30, rttMs: 30 },
          device: { memoryGb: 8, cores: 8 },
        }),
      ),
    ).toBe(false);
  });
});

describe('preservation guards', () => {
  it('routes every ambient renderer through the governor while keeping its artwork', () => {
    const starfield = readSource('components/Starfield.tsx');
    const twinkling = readSource('components/TwinklingStars.tsx');
    const shooting = readSource('components/ShootingStars.tsx');
    const aurora = readSource('components/Aurora.tsx');
    const homepage = readSource('app/homepage/HomePage.js');

    for (const source of [starfield, twinkling, shooting, aurora, homepage]) {
      expect(source).toContain('createAdaptiveFrameLoop');
      expect(source).not.toMatch(/animationFrameId\s*=\s*requestAnimationFrame/);
    }

    // Density, reduced-motion branches and the approved artwork stay intact.
    expect(starfield).toContain('const baseCount = width < 768 ? 100 : 300;');
    expect(starfield).toContain('if (!reducedMotion)');
    expect(shooting).toContain('const maxStars = 3;');
    expect(aurora).toContain('isReducedMotion ? 0.0005 : 0.001');
    expect(homepage).toContain('Math.floor((width * height * particleScale) / 2000)');
  });

  it('does not disable features, remove animation branches or weaken accessibility', () => {
    const adaptiveSource = readSource('app/lib/adaptive-performance.js');
    const starfield = readSource('components/Starfield.tsx');
    const audio = readSource('app/lib/audio.js');

    // The governor never deletes an effect: only cadence and loading change.
    expect(adaptiveSource).not.toMatch(/prefers-reduced-motion[^\n]*remove/);
    expect(starfield).toContain('ctx.fillRect(star.x, star.y, star.r, star.r);');
    expect(audio).toContain("src: ['/sounds/button-click.wav']");
    expect(audio).toContain('releaseIdleAudio');
    // Speculative preload is policy-gated, while playback uses the ungated loader.
    expect(audio).toContain('allowSpeculativeAudio');
    expect(audio).toMatch(/function preloadRevealSparkle\(\)[\s\S]{0,160}return loadRevealSparkle\(\);/);
  });

  it('never reads cookies or browser storage for memory decisions', () => {
    const adaptiveSource = readSource('app/lib/adaptive-performance.js');
    expect(adaptiveSource).not.toContain('document.cookie');
    expect(adaptiveSource).not.toContain('localStorage');
    expect(adaptiveSource).not.toContain('sessionStorage');
    expect(adaptiveSource).not.toContain('navigator.userAgent');
  });
});
