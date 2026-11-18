import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const originalConnection = Object.getOwnPropertyDescriptor(navigator, 'connection');
const originalDeviceMemory = Object.getOwnPropertyDescriptor(navigator, 'deviceMemory');
const originalHardwareConcurrency = Object.getOwnPropertyDescriptor(navigator, 'hardwareConcurrency');

let hub;
let adaptive;

async function loadModules() {
  vi.resetModules();
  adaptive = await import('../app/lib/adaptive-performance.js');
  hub = await import('../app/lib/resource-readiness.js');
  hub.resetResourceReadiness();
  return { hub, adaptive };
}

function stubDevice({ memory, cores }) {
  Object.defineProperty(navigator, 'deviceMemory', { value: memory, configurable: true });
  Object.defineProperty(navigator, 'hardwareConcurrency', { value: cores, configurable: true });
}

function stubConnection(value) {
  Object.defineProperty(navigator, 'connection', { value, configurable: true });
}

function useCapableProfile() {
  stubDevice({ memory: 8, cores: 8 });
  stubConnection({ downlink: 30, rtt: 30, addEventListener: vi.fn(), removeEventListener: vi.fn() });
  adaptive.refreshAdaptivePlan();
}

function useConstrainedProfile() {
  stubDevice({ memory: 1, cores: 2 });
  stubConnection({ downlink: 30, rtt: 30, addEventListener: vi.fn(), removeEventListener: vi.fn() });
  adaptive.refreshAdaptivePlan();
}

async function flushMicrotasks() {
  for (let index = 0; index < 6; index += 1) {
    await Promise.resolve();
  }
}

function registerTestExperience(overrides = {}) {
  return hub.registerExperienceResources({
    id: 'test-experience',
    version: 1,
    label: 'Test experience',
    routes: ['/test'],
    dependsOn: [],
    resources: [{ id: 'test-resource', kind: 'test', url: '/test-resource.avif' }],
    ...overrides,
  });
}

beforeEach(async () => {
  await loadModules();
});

afterEach(() => {
  if (typeof window !== 'undefined') window.history.replaceState({}, '', '/');
  hub.resetResourceReadiness();
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
});

describe('registration contract', () => {
  it('registers one experience and unregisters it idempotently', () => {
    const unregister = registerTestExperience();

    expect(hub.getRegisteredExperiences()).toHaveLength(1);
    expect(hub.getExperienceDefinition('test-experience')).toMatchObject({
      id: 'test-experience',
      version: 1,
      routes: ['/test'],
    });

    unregister();
    unregister();
    expect(hub.getRegisteredExperiences()).toHaveLength(0);
  });

  it('rejects definitions without an id, a version or resources', () => {
    expect(() => hub.registerExperienceResources({ version: 1, resources: [] })).toThrow(TypeError);
    expect(() => hub.registerExperienceResources({ id: 'missing-version', resources: [] })).toThrow(TypeError);
    expect(() => hub.registerExperienceResources({ id: 'missing-resources', version: 1 })).toThrow(TypeError);
    expect(() =>
      hub.registerExperienceResources({
        id: 'missing-target',
        version: 1,
        resources: [{ kind: 'image' }],
      }),
    ).toThrow(TypeError);
  });

  it('treats a repeated id and version as one registration instead of duplicating it', async () => {
    registerTestExperience();
    registerTestExperience();
    expect(hub.getRegisteredExperiences()).toHaveLength(1);

    const prepare = vi.fn().mockResolvedValue({});
    hub.registerResourceAdapter('test', prepare);
    await hub.prepareExperience('test-experience');
    expect(prepare).toHaveBeenCalledTimes(1);
  });

  it('drops prepared state and re-prepares when the version changes', async () => {
    let calls = 0;
    hub.registerResourceAdapter('test', async () => {
      calls += 1;
    });
    registerTestExperience();
    const first = await hub.prepareExperience('test-experience');
    expect(first.state).toBe('ready');
    expect(calls).toBe(1);

    registerTestExperience({ version: 2 });
    const second = await hub.prepareExperience('test-experience');
    expect(second.version).toBe(2);
    expect(calls).toBe(2);
  });
});

describe('deduplication and cache reuse', () => {
  it('serves one request for one URL shared by three experiences', async () => {
    useCapableProfile();
    const adapter = vi.fn().mockResolvedValue({});
    hub.registerResourceAdapter('shared', adapter);

    for (const id of ['one', 'two', 'three']) {
      hub.registerExperienceResources({
        id,
        version: 1,
        dependsOn: [],
        resources: [{ id: 'shared-image', kind: 'shared', url: '/shared.avif' }],
      });
    }

    const snapshots = await Promise.all([
      hub.prepareExperience('one'),
      hub.prepareExperience('two'),
      hub.prepareExperience('three'),
    ]);

    expect(adapter).toHaveBeenCalledTimes(1);
    expect(snapshots.map((snapshot) => snapshot.state)).toEqual(['ready', 'ready', 'ready']);
  });

  it('reuses prepared resources across a navigation and a revisit', async () => {
    useCapableProfile();
    const adapter = vi.fn().mockResolvedValue({});
    hub.registerResourceAdapter('test', adapter);
    registerTestExperience();

    await hub.prepareExperience('test-experience');
    await hub.prepareExperience('test-experience');
    hub.releaseExperienceResources('test-experience');

    // Releasing the hub's decoded references does not evict the browser cache,
    // so a revisit prepares again and the adapter is the only thing that runs.
    await hub.prepareExperience('test-experience');
    expect(adapter).toHaveBeenCalledTimes(2);
  });

  it('shares one in-flight request rather than starting a second', async () => {
    useCapableProfile();
    let release;
    const adapter = vi.fn(
      () =>
        new Promise((resolve) => {
          release = resolve;
        }),
    );
    hub.registerResourceAdapter('test', adapter);
    registerTestExperience();

    const first = hub.prepareExperience('test-experience');
    const second = hub.prepareExperience('test-experience');
    await flushMicrotasks();
    expect(adapter).toHaveBeenCalledTimes(1);

    release({});
    await Promise.all([first, second]);
    expect(adapter).toHaveBeenCalledTimes(1);
  });
});

describe('dependencies', () => {
  it('prepares a dependency before the experience that needs it', async () => {
    useCapableProfile();
    const order = [];
    hub.registerResourceAdapter('test', async (resource) => {
      order.push(resource.id);
    });

    hub.registerExperienceResources({
      id: 'dependency',
      version: 1,
      dependsOn: [],
      resources: [{ id: 'dependency-resource', kind: 'test', url: '/dependency' }],
    });
    hub.registerExperienceResources({
      id: 'dependent',
      version: 1,
      dependsOn: ['dependency'],
      resources: [{ id: 'dependent-resource', kind: 'test', url: '/dependent' }],
    });

    const snapshot = await hub.prepareExperience('dependent');
    expect(snapshot.state).toBe('ready');
    expect(order).toEqual(['dependency-resource', 'dependent-resource']);
  });

  it('fails safely for a missing dependency and for a dependency cycle', async () => {
    useCapableProfile();
    hub.registerResourceAdapter('test', async () => {});
    hub.registerExperienceResources({
      id: 'orphan',
      version: 1,
      dependsOn: ['missing'],
      resources: [{ id: 'orphan-resource', kind: 'test', url: '/orphan' }],
    });
    expect((await hub.prepareExperience('orphan')).state).toBe('failed');

    hub.registerExperienceResources({
      id: 'cycle-a',
      version: 1,
      dependsOn: ['cycle-b'],
      resources: [{ id: 'cycle-a-resource', kind: 'test', url: '/cycle-a' }],
    });
    hub.registerExperienceResources({
      id: 'cycle-b',
      version: 1,
      dependsOn: ['cycle-a'],
      resources: [{ id: 'cycle-b-resource', kind: 'test', url: '/cycle-b' }],
    });

    const cycle = await hub.prepareExperience('cycle-a');
    expect(cycle.state).toBe('failed');
  });
});

describe('priority, yielding and resume', () => {
  it('holds background preparation during an active experience and resumes it after', async () => {
    useCapableProfile();
    const adapter = vi.fn().mockResolvedValue({});
    hub.registerResourceAdapter('test', adapter);
    registerTestExperience();

    const end = hub.beginActiveExperience('test-reveal');
    expect(hub.isExperienceActive()).toBe(true);

    const preparation = hub.prepareExperience('test-experience', { priority: 'background' });
    await flushMicrotasks();
    expect(adapter).not.toHaveBeenCalled();

    end();
    end();
    expect(hub.isExperienceActive()).toBe(false);

    const snapshot = await preparation;
    expect(snapshot.state).toBe('ready');
    expect(adapter).toHaveBeenCalledTimes(1);
  });

  it('never stalls critical or intent preparation for an active experience', async () => {
    useCapableProfile();
    const adapter = vi.fn().mockResolvedValue({});
    hub.registerResourceAdapter('test', adapter);
    registerTestExperience();

    const end = hub.beginActiveExperience('test-reveal');
    const snapshot = await hub.prepareExperience('test-experience', { priority: 'critical' });
    end();

    expect(snapshot.state).toBe('ready');
    expect(adapter).toHaveBeenCalledTimes(1);
  });

  it('bounds concurrent preparation to the adaptive plan without exceeding three', async () => {
    useCapableProfile();
    const releases = [];
    let active = 0;
    let peak = 0;
    hub.registerResourceAdapter('test', () => {
      active += 1;
      peak = Math.max(peak, active);
      return new Promise((resolve) => {
        releases.push(() => {
          active -= 1;
          resolve({});
        });
      });
    });

    hub.registerExperienceResources({
      id: 'wide',
      version: 1,
      dependsOn: [],
      resources: [1, 2, 3, 4, 5].map((index) => ({
        id: `wide-${index}`,
        kind: 'test',
        url: `/wide-${index}`,
      })),
    });

    const preparation = hub.prepareExperience('wide');
    await flushMicrotasks();
    expect(peak).toBe(3);

    while (releases.length > 0) {
      releases.shift()();
      await flushMicrotasks();
    }

    expect((await preparation).state).toBe('ready');
    expect(peak).toBe(3);
  });

  it('prepares nothing on a Save-Data connection', async () => {
    stubDevice({ memory: 8, cores: 8 });
    stubConnection({
      saveData: true,
      downlink: 30,
      rtt: 30,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });
    adaptive.refreshAdaptivePlan();

    const adapter = vi.fn().mockResolvedValue({});
    hub.registerResourceAdapter('test', adapter);
    registerTestExperience();

    const cancel = hub.prepareExperiencesWhenIdle(['test-experience']);
    cancel();
    await flushMicrotasks();
    expect(adapter).not.toHaveBeenCalled();
  });

  it('prepares one likely experience on a constrained device and three on a capable one', async () => {
    vi.useFakeTimers();
    const adapter = vi.fn().mockResolvedValue({});
    hub.registerResourceAdapter('test', adapter);
    for (const id of ['a', 'b', 'c', 'd']) {
      hub.registerExperienceResources({
        id,
        version: 1,
        dependsOn: [],
        resources: [{ id: `${id}-resource`, kind: 'test', url: `/${id}` }],
      });
    }

    useConstrainedProfile();
    hub.prepareExperiencesWhenIdle(['a', 'b', 'c', 'd']);
    vi.advanceTimersByTime(400);
    await flushMicrotasks();
    expect(adapter).toHaveBeenCalledTimes(1);

    adapter.mockClear();
    useCapableProfile();
    hub.prepareExperiencesWhenIdle(['b', 'c', 'd']);
    vi.advanceTimersByTime(400);
    await flushMicrotasks();
    expect(adapter).toHaveBeenCalledTimes(3);
  });
});

describe('readiness, failure and retry', () => {
  it('reports fetched and initialized before ready for a decoded image', async () => {
    useCapableProfile();
    let resolveDecode;
    const images = [];

    class FakeImage {
      constructor() {
        this.complete = false;
        this.naturalWidth = 0;
        images.push(this);
      }

      decode() {
        return new Promise((resolve) => {
          resolveDecode = resolve;
        });
      }
    }
    vi.stubGlobal('Image', FakeImage);

    hub.registerExperienceResources({
      id: 'image-experience',
      version: 1,
      dependsOn: [],
      resources: [{ id: 'hero', kind: 'image', url: '/hero.avif' }],
    });

    const preparation = hub.prepareExperience('image-experience');
    await flushMicrotasks();
    expect(hub.getExperienceReadiness('image-experience').resources[0].state).toBe('preparing');

    images[0].onload();
    await flushMicrotasks();
    const fetched = hub.getExperienceReadiness('image-experience');
    expect(fetched.resources[0].state).toBe('fetched');
    expect(fetched.state).toBe('preparing');

    resolveDecode();
    const ready = await preparation;
    expect(ready.state).toBe('ready');
    expect(ready.resources[0].state).toBe('ready');
  });

  it('retries a staggered second failure without waiting for another plan change', async () => {
    vi.useFakeTimers();
    useCapableProfile();
    const attempts = { a: 0, b: 0 };
    let failB;
    hub.registerResourceAdapter('test', async (resource) => {
      if (resource.url === '/a') {
        attempts.a += 1;
        if (attempts.a === 1) throw new Error('a down');
        return {};
      }
      attempts.b += 1;
      if (attempts.b === 1) {
        const failure = await new Promise((resolve) => {
          failB = resolve;
        });
        throw failure;
      }
      return {};
    });
    for (const id of ['a', 'b']) {
      hub.registerExperienceResources({
        id,
        version: 1,
        dependsOn: [],
        resources: [{ id: `${id}-resource`, kind: 'test', url: `/${id}` }],
      });
    }

    const first = hub.prepareExperience('a');
    const second = hub.prepareExperience('b');
    await flushMicrotasks();

    // Stage B's failure 100 ms after A's, inside A's 275 ms retry window.
    await vi.advanceTimersByTimeAsync(100);
    failB(new Error('b down'));
    await flushMicrotasks();
    await vi.advanceTimersByTimeAsync(1000);

    const [aSnapshot, bSnapshot] = await Promise.all([first, second]);
    expect(aSnapshot.state).toBe('ready');
    expect(bSnapshot.state).toBe('ready');
    expect(attempts).toEqual({ a: 2, b: 2 });
  });

  it('backs off a failed experience instead of re-requesting it on every intent event', async () => {
    vi.useFakeTimers();
    useCapableProfile();
    const adapter = vi.fn(async () => {
      throw new Error('down');
    });
    hub.registerResourceAdapter('test', adapter);
    hub.registerExperienceResources({
      id: 'dead',
      version: 1,
      dependsOn: [],
      resources: [{ id: 'dead-resource', kind: 'test', url: '/dead' }],
    });

    const first = hub.prepareExperience('dead');
    await flushMicrotasks();
    await vi.advanceTimersByTimeAsync(400);
    const failed = await first;
    expect(failed.state).toBe('failed');
    expect(adapter).toHaveBeenCalledTimes(2);

    const repeated = await Promise.all([
      hub.prepareExperience('dead', { priority: 'intent' }),
      hub.prepareExperience('dead', { priority: 'intent' }),
      hub.prepareExperience('dead', { priority: 'critical' }),
    ]);
    expect(adapter).toHaveBeenCalledTimes(2);
    expect(repeated.every((snapshot) => snapshot.state === 'failed')).toBe(true);

    await vi.advanceTimersByTimeAsync(6000);
    const retried = hub.prepareExperience('dead');
    await flushMicrotasks();
    await vi.advanceTimersByTimeAsync(400);
    expect((await retried).state).toBe('failed');
    expect(adapter).toHaveBeenCalledTimes(4);
  });

  it('retries a failed resource once and reports a real failure when it still fails', async () => {
    vi.useFakeTimers();
    useCapableProfile();
    let attempts = 0;
    hub.registerResourceAdapter('flaky', async () => {
      attempts += 1;
      throw new Error('network down');
    });
    hub.registerExperienceResources({
      id: 'flaky',
      version: 1,
      dependsOn: [],
      resources: [{ id: 'flaky-resource', kind: 'flaky', url: '/flaky' }],
    });

    const preparation = hub.prepareExperience('flaky');
    await flushMicrotasks();
    expect(attempts).toBe(1);

    vi.advanceTimersByTime(400);
    const failed = await preparation;
    expect(attempts).toBe(2);
    expect(failed.state).toBe('failed');
    expect(failed.resources[0].state).toBe('failed');
    expect(failed.resources[0].error).toContain('network down');
  });

  it('recovers through an explicit retry without repeating ready resources', async () => {
    useCapableProfile();
    let fail = true;
    const adapter = vi.fn(async (resource) => {
      if (fail && resource.url === '/flaky') throw new Error('temporary');
      return {};
    });
    hub.registerResourceAdapter('test', adapter);
    vi.useFakeTimers();

    hub.registerExperienceResources({
      id: 'retryable',
      version: 1,
      dependsOn: [],
      resources: [
        { id: 'always-ready', kind: 'test', url: '/ready' },
        { id: 'flaky', kind: 'test', url: '/flaky' },
      ],
    });

    const first = hub.prepareExperience('retryable');
    await flushMicrotasks();
    vi.advanceTimersByTime(400);
    const failed = await first;
    expect(failed.state).toBe('failed');

    fail = false;
    adapter.mockClear();
    const retried = await hub.retryExperience('retryable');
    expect(retried.state).toBe('ready');
    // Only the failed resource is requested again.
    expect(adapter).toHaveBeenCalledTimes(1);
  });
});

describe('release and server safety', () => {
  it('releases prepared entries through the existing adaptive release registry', async () => {
    useCapableProfile();
    const adapter = vi.fn().mockResolvedValue({});
    hub.registerResourceAdapter('test', adapter);
    registerTestExperience();

    await hub.prepareExperience('test-experience');
    expect(adaptive.releaseRegisteredResources('memory-pressure')).toBeGreaterThan(0);
    expect(hub.getExperienceReadiness('test-experience')).toBeNull();

    await hub.prepareExperience('test-experience');
    expect(adapter).toHaveBeenCalledTimes(2);
  });

  it('re-prepares after a background run when a committed caller arrives in flight', async () => {
    useCapableProfile();
    const calls = [];
    let releaseLight;
    hub.registerResourceAdapter('image', async (resource) => {
      calls.push(resource.url);
      if (resource.url === '/light.avif') {
        await new Promise((resolve) => {
          releaseLight = resolve;
        });
      }
    });
    hub.registerExperienceResources({
      id: 'upgrade',
      version: 1,
      dependsOn: [],
      resources: [
        { id: 'light', kind: 'image', url: '/light.avif', background: true },
        { id: 'heavy', kind: 'image', url: '/heavy.avif', background: false },
      ],
    });

    const background = hub.prepareExperience('upgrade', { priority: 'background' });
    await flushMicrotasks();
    expect(calls).toEqual(['/light.avif']);

    const critical = hub.prepareExperience('upgrade', { priority: 'critical', trigger: 'hover' });
    await flushMicrotasks();

    releaseLight();
    await background;
    const snapshot = await critical;

    expect(calls).toEqual(['/light.avif', '/heavy.avif']);
    expect(snapshot.state).toBe('ready');
    expect(snapshot.partial).toBe(false);
    expect(snapshot.resources.every((resource) => resource.state === 'ready')).toBe(true);
  });

  it('does not prepare background-disabled audio during idle and does prepare it on intent', async () => {
    useCapableProfile();
    const imageAdapter = vi.fn().mockResolvedValue({});
    const audioAdapter = vi.fn().mockResolvedValue({});
    hub.registerResourceAdapter('image', imageAdapter);
    hub.registerResourceAdapter('audio', audioAdapter);

    hub.registerExperienceResources({
      id: 'audio-experience',
      version: 1,
      dependsOn: [],
      resources: [
        { id: 'art', kind: 'image', url: '/art.avif', background: true },
        { id: 'sound', kind: 'audio', prepare: async () => {}, background: false },
      ],
    });

    const background = await hub.prepareExperience('audio-experience', { priority: 'background' });
    expect(background.state).toBe('ready');
    expect(background.partial).toBe(true);
    expect(audioAdapter).not.toHaveBeenCalled();

    await hub.prepareExperience('audio-experience', { priority: 'intent' });
    expect(audioAdapter).toHaveBeenCalledTimes(1);
    expect(imageAdapter).toHaveBeenCalledTimes(1);
  });

  it('skips a route prefetch for the page already on screen', async () => {
    useCapableProfile();
    const prefetch = vi.fn();
    hub.configureRoutePrefetch(prefetch);
    window.history.pushState({}, '', '/current-route');

    hub.registerExperienceResources({
      id: 'current-route-experience',
      version: 1,
      dependsOn: [],
      resources: [{ id: 'current-route-code', kind: 'code', route: '/current-route' }],
    });

    const snapshot = await hub.prepareExperience('current-route-experience');
    expect(prefetch).not.toHaveBeenCalled();
    expect(snapshot.resources[0].state).toBe('skipped');
    expect(snapshot.resources[0].reason).toBe('current-route');
  });

  it('re-evaluates a policy skip after the visitor leaves the route', async () => {
    useCapableProfile();
    const prefetch = vi.fn();
    hub.configureRoutePrefetch(prefetch);
    window.history.pushState({}, '', '/current-route');

    hub.registerExperienceResources({
      id: 'route-refresh',
      version: 1,
      dependsOn: [],
      resources: [{ id: 'route-refresh-code', kind: 'code', route: '/current-route' }],
    });

    const first = await hub.prepareExperience('route-refresh');
    expect(first.resources[0].state).toBe('skipped');
    expect(first.resources[0].reason).toBe('current-route');
    expect(prefetch).not.toHaveBeenCalled();

    window.history.pushState({}, '', '/');
    const second = await hub.prepareExperience('route-refresh', { priority: 'intent' });

    expect(prefetch).toHaveBeenCalledTimes(1);
    expect(prefetch).toHaveBeenCalledWith('/current-route');
    expect(second.resources[0].state).toBe('ready');
  });

  it('is server-safe: importing and preparing without a window does no work', async () => {
    vi.stubGlobal('window', undefined);
    vi.stubGlobal('document', undefined);
    vi.resetModules();
    const serverHub = await import('../app/lib/resource-readiness.js');

    expect(() => serverHub.registerExperienceResources({
      id: 'server',
      version: 1,
      dependsOn: [],
      resources: [{ id: 'server-resource', kind: 'test', url: '/server' }],
    })).not.toThrow();

    const snapshot = await serverHub.prepareExperience('server');
    expect(snapshot.state).toBe('idle');
    expect(serverHub.whenIdle(() => {})).toBeTypeOf('function');
    expect(serverHub.whenPageSettled(() => {})).toBeTypeOf('function');
    expect(serverHub.beginActiveExperience('server')).toBeTypeOf('function');
  });
});

describe('page settle gate', () => {
  function stubObservers() {
    const observers = [];
    class FakePerformanceObserver {
      constructor(callback) {
        this.callback = callback;
        this.disconnected = false;
        observers.push(this);
      }

      observe(options) {
        this.type = options.type;
      }

      disconnect() {
        this.disconnected = true;
      }
    }
    vi.stubGlobal('PerformanceObserver', FakePerformanceObserver);
    return observers;
  }

  it('waits for load and a quiet LCP window before preparing', () => {
    vi.useFakeTimers();
    const observers = stubObservers();
    let clock = 1000;
    vi.spyOn(performance, 'now').mockImplementation(() => clock);
    vi.spyOn(document, 'readyState', 'get').mockReturnValue('loading');

    const run = vi.fn();
    hub.whenPageSettled(run, { quietMs: 600, maxWaitMs: 20_000 });
    expect(observers.map((observer) => observer.type)).toEqual([
      'largest-contentful-paint',
      'resource',
    ]);

    clock = 2000;
    vi.advanceTimersByTime(1000);
    expect(run).not.toHaveBeenCalled();

    // The largest paint lands at 2200 ms; load is complete, but 500 ms of quiet
    // is not enough. Without the LCP timestamp this would already have run.
    clock = 2200;
    observers[0].callback({ getEntries: () => [{ startTime: 2200 }] });
    vi.spyOn(document, 'readyState', 'get').mockReturnValue('complete');
    clock = 2700;
    vi.advanceTimersByTime(500);
    expect(run).not.toHaveBeenCalled();

    clock = 2800;
    vi.advanceTimersByTime(100);
    expect(run).toHaveBeenCalledTimes(1);
    expect(observers.every((observer) => observer.disconnected)).toBe(true);
  });

  it('cancels every timer and observer before the page settles', () => {
    vi.useFakeTimers();
    const observers = stubObservers();
    let clock = 1000;
    vi.spyOn(performance, 'now').mockImplementation(() => clock);
    vi.spyOn(document, 'readyState', 'get').mockReturnValue('loading');

    const run = vi.fn();
    const cancel = hub.whenPageSettled(run);
    cancel();

    clock = 30_000;
    vi.advanceTimersByTime(30_000);
    expect(run).not.toHaveBeenCalled();
    expect(observers.every((observer) => observer.disconnected)).toBe(true);
  });
});
