import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it, vi } from 'vitest';

function readSource(relativePath) {
  return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

async function loadModule() {
  vi.resetModules();
  return import('../app/lib/adaptive-performance.js');
}

function frameTarget(width = 1280, height = 800, pixelRatio = 1) {
  return { width, height, pixelRatio };
}

function plan(overrides = {}) {
  return {
    tier: 'high',
    frameRate: 60,
    animationBudget: 'full',
    reducedMotion: false,
    visible: true,
    ...overrides,
  };
}

function createHarness(
  adaptive,
  { visible = true, target = frameTarget(), initialPlan = plan() } = {},
) {
  let clock = 0;
  let isVisible = visible;
  let currentTarget = target;
  let currentPlan = initialPlan;
  const monitor = adaptive.createPerformanceMonitor({
    now: () => clock,
    isVisible: () => isVisible,
    readTarget: () => currentTarget,
    readPlan: () => currentPlan,
  });

  return {
    monitor,
    get clock() {
      return clock;
    },
    setClock(value) {
      clock = value;
    },
    setVisible(value) {
      isVisible = value;
    },
    setTarget(value) {
      currentTarget = value;
    },
    setPlan(value) {
      currentPlan = value;
    },
    run(from, to, step, source) {
      for (let timestamp = from; timestamp <= to + 0.001; timestamp += step) {
        clock = timestamp;
        monitor.record(timestamp, source);
      }
    },
  };
}

describe('observational frame monitor', () => {
  it('starts in warm-up with no evidence instead of judging startup frames', async () => {
    const adaptive = await loadModule();
    const harness = createHarness(adaptive);

    harness.run(0, 1_200, 16.667);

    const snapshot = harness.monitor.snapshot();
    expect(snapshot.status).toBe('warming');
    expect(snapshot.evidence).toBe('unavailable');
    expect(snapshot.lastResetReason).toBe('startup');
    expect(snapshot.fps).toBeNull();
    expect(snapshot.source).toBe('adaptive-frame-loop');
    expect(snapshot.version).toBe(2);
    expect(snapshot.warnings).toEqual(['no-samples']);
  });

  it('reports insufficient samples until a full window is measured', async () => {
    const adaptive = await loadModule();
    const harness = createHarness(adaptive, { initialPlan: plan({ frameRate: 30 }) });

    // Warm-up ends at 2 s; the 1.5 s measurement window has not completed.
    harness.run(0, 2_500, 33.333);

    const snapshot = harness.monitor.snapshot();
    expect(snapshot.status).toBe('warming');
    expect(snapshot.evidence).toBe('insufficient');
    expect(snapshot.sampleCount).toBeGreaterThan(0);
    // Samples exist, so the warning must describe incomplete metrics rather
    // than claim there is no data.
    expect(snapshot.warnings).toEqual(['insufficient-samples']);
  });

  it('reaches healthy after a full 60 fps window', async () => {
    const adaptive = await loadModule();
    const harness = createHarness(adaptive);

    harness.run(0, 4_200, 16.667);

    const snapshot = harness.monitor.snapshot();
    expect(snapshot.status).toBe('healthy');
    expect(snapshot.evidence).toBe('measured');
    expect(snapshot.targetFps).toBe(60);
    expect(snapshot.fps).toBeGreaterThan(55);
    expect(snapshot.p95FrameMs).toBeLessThan(20);
    expect(snapshot.sampleCount).toBeGreaterThan(60);
    expect(snapshot.warnings).toEqual([]);
  });

  it('treats 30 fps delivery as healthy when the active plan targets 30 fps', async () => {
    const adaptive = await loadModule();
    const harness = createHarness(adaptive, { initialPlan: plan({ tier: 'constrained', frameRate: 30 }) });

    harness.run(0, 5_000, 33.333);

    const snapshot = harness.monitor.snapshot();
    expect(snapshot.status).toBe('healthy');
    expect(snapshot.evidence).toBe('measured');
    expect(snapshot.targetFps).toBe(30);
    expect(snapshot.fps).toBeGreaterThan(29);
    expect(snapshot.thresholds).toMatchObject({
      targetFps: 30,
      healthyFps: 25,
      strainedFps: 14,
      healthyP95Ms: 56,
      criticalP95Ms: 140,
      longFrameMs: 100,
    });
  });

  it('classifies 20 fps against a 30 fps plan as strained', async () => {
    const adaptive = await loadModule();
    const harness = createHarness(adaptive, { initialPlan: plan({ frameRate: 30 }) });

    harness.run(0, 5_000, 50);

    const snapshot = harness.monitor.snapshot();
    expect(snapshot.status).toBe('strained');
    expect(snapshot.fps).toBe(20);
    expect(snapshot.warnings).toContain('frame-rate-below-target');
  });

  it('classifies 12 fps against a 30 fps plan as genuine degradation', async () => {
    const adaptive = await loadModule();
    const harness = createHarness(adaptive, { initialPlan: plan({ frameRate: 30 }) });

    harness.run(0, 5_000, 83.333);

    const snapshot = harness.monitor.snapshot();
    expect(snapshot.status).toBe('critical');
    expect(snapshot.fps).toBeCloseTo(12, 1);
    expect(snapshot.warnings).toContain('frame-rate-below-target');
  });

  it('keeps the 60 fps policy for a 60 fps plan', async () => {
    const adaptive = await loadModule();

    const strained = createHarness(adaptive);
    strained.run(0, 5_000, 33.333);
    expect(strained.monitor.snapshot().status).toBe('strained');

    const critical = createHarness(adaptive);
    critical.run(0, 5_000, 50);
    expect(critical.monitor.snapshot()).toMatchObject({
      status: 'critical',
      fps: 20,
      longFrameRatio: 1,
    });
  });

  it('requires hysteresis before changing an established status', async () => {
    const adaptive = await loadModule();
    const harness = createHarness(adaptive, { initialPlan: plan({ frameRate: 30 }) });

    harness.run(0, 4_500, 33.333);
    expect(harness.monitor.snapshot().status).toBe('healthy');

    harness.run(4_533.333, 4_800, 50);
    expect(harness.monitor.snapshot().status).toBe('healthy');

    harness.run(4_850, 7_000, 50);
    expect(harness.monitor.snapshot().status).toBe('strained');
  });

  it('resets to warm-up after a long gap', async () => {
    const adaptive = await loadModule();
    const harness = createHarness(adaptive);

    harness.run(0, 4_200, 16.667);
    expect(harness.monitor.snapshot().status).toBe('healthy');

    harness.setClock(6_000);
    harness.monitor.record(6_000);

    expect(harness.monitor.snapshot()).toMatchObject({
      status: 'warming',
      lastResetReason: 'gap',
    });
  });

  it('does not count a brief hidden suspension as delivered frame time', async () => {
    const adaptive = await loadModule();
    const harness = createHarness(adaptive);

    harness.run(0, 4_200, 16.667);
    expect(harness.monitor.snapshot().status).toBe('healthy');

    // The tab is hidden for 600 ms. rAF is suspended, so no callback reports
    // the hidden state; the first timestamp after the resume is 600 ms late.
    harness.setClock(4_800);
    harness.monitor.record(4_800);

    const resumed = harness.monitor.snapshot();
    expect(resumed).toMatchObject({
      status: 'warming',
      lastResetReason: 'gap',
      sampleCount: 0,
    });

    harness.run(4_816.667, 8_400, 16.667);
    expect(harness.monitor.snapshot().status).toBe('healthy');
  });

  it('reports a hidden page as paused rather than degraded', async () => {
    const adaptive = await loadModule();
    const harness = createHarness(adaptive);

    harness.run(0, 4_200, 16.667);
    harness.setVisible(false);
    harness.setClock(4_216);
    harness.monitor.record(4_216);

    expect(harness.monitor.snapshot()).toMatchObject({
      status: 'paused',
      evidence: 'paused',
      paused: true,
      fps: null,
      source: null,
    });
    expect(harness.monitor.snapshot().warnings).toEqual(['paused-hidden']);

    harness.setVisible(true);
    harness.setClock(4_232);
    harness.monitor.record(4_232);

    expect(harness.monitor.snapshot()).toMatchObject({
      status: 'warming',
      lastResetReason: 'resumed',
    });
  });

  it('reports reduced motion as an intentional pause', async () => {
    const adaptive = await loadModule();
    const harness = createHarness(adaptive, { initialPlan: plan({ reducedMotion: true, frameRate: 0 }) });

    harness.run(0, 1_000, 16.667);

    const snapshot = harness.monitor.snapshot();
    expect(snapshot).toMatchObject({
      status: 'paused',
      evidence: 'paused',
      paused: true,
      targetFps: 0,
      thresholds: null,
    });
    expect(snapshot.warnings).toEqual(['paused-reduced-motion']);
  });

  it('does not keep claiming a measurement after the source goes idle', async () => {
    const adaptive = await loadModule();
    const harness = createHarness(adaptive);

    harness.run(0, 4_200, 16.667);
    expect(harness.monitor.snapshot().status).toBe('healthy');

    // Nothing paints for 5 s. The last measured status is history, not a
    // current health verdict.
    harness.setClock(9_200);
    const snapshot = harness.monitor.snapshot();

    expect(snapshot).toMatchObject({
      status: 'idle',
      evidence: 'stale',
      fps: null,
      sampleCount: 0,
    });
    expect(snapshot.warnings).toEqual(['no-recent-samples']);
    expect(snapshot.sources[0]).toMatchObject({ stale: true });
  });

  it('resets when the rendering target changes', async () => {
    const adaptive = await loadModule();
    const harness = createHarness(adaptive);

    harness.run(0, 4_200, 16.667);
    harness.setTarget(frameTarget(390, 844, 3));
    harness.setClock(4_216);
    harness.monitor.record(4_216);

    expect(harness.monitor.snapshot()).toMatchObject({
      status: 'warming',
      lastResetReason: 'target-change',
      target: { width: 390, height: 844, pixelRatio: 3 },
    });
  });

  it('resets when the active plan changes its target cadence', async () => {
    const adaptive = await loadModule();
    const harness = createHarness(adaptive);

    harness.run(0, 4_200, 16.667);
    expect(harness.monitor.snapshot().status).toBe('healthy');

    harness.setPlan(plan({ tier: 'constrained', frameRate: 30 }));
    harness.setClock(4_216);
    harness.monitor.record(4_216);

    expect(harness.monitor.snapshot()).toMatchObject({
      status: 'warming',
      lastResetReason: 'plan-change',
    });

    harness.run(4_250, 8_500, 33.333);
    expect(harness.monitor.snapshot()).toMatchObject({
      status: 'healthy',
      targetFps: 30,
    });
  });

  it('collapses duplicate same-frame samples within one source', async () => {
    const adaptive = await loadModule();
    const harness = createHarness(adaptive);

    harness.run(0, 2_200, 16.667);
    const before = harness.monitor.snapshot().sampleCount;
    harness.monitor.record(harness.clock);
    harness.monitor.record(harness.clock);

    expect(harness.monitor.snapshot().sampleCount).toBe(before);
  });

  it('keeps slower sources visible instead of letting a fast source mask them', async () => {
    const adaptive = await loadModule();
    const harness = createHarness(adaptive);

    // Shared loop: a healthy 60 fps.
    harness.run(0, 4_200, 16.667, 'adaptive-frame-loop');
    // Cosmic engine: 35 fps on the same 60 fps plan (each source has its own
    // timestamp series, so the second pass is still a valid series).
    harness.run(0, 4_200, 28.571, 'cosmic-engine');

    const snapshot = harness.monitor.snapshot();
    expect(snapshot.status).toBe('strained');
    expect(snapshot.source).toBe('cosmic-engine');
    expect(snapshot.fps).toBeLessThan(40);
    expect(snapshot.sources).toHaveLength(2);

    const shared = snapshot.sources.find((source) => source.id === 'adaptive-frame-loop');
    const cosmic = snapshot.sources.find((source) => source.id === 'cosmic-engine');
    expect(shared.status).toBe('healthy');
    expect(cosmic.status).toBe('strained');
    expect(snapshot.sources[0].id).toBe('adaptive-frame-loop');
  });

  it('exposes a stable diagnostic snapshot without starting work', async () => {
    const adaptive = await loadModule();
    const snapshot = adaptive.getPerformanceSnapshot();

    expect(snapshot).toMatchObject({
      version: 2,
      status: 'warming',
      evidence: 'unavailable',
      windowMs: 1_500,
      lastResetReason: 'startup',
      sources: [],
    });
    expect(Object.keys(snapshot).sort()).toEqual(
      [
        'averageFrameMs',
        'evidence',
        'fps',
        'lastResetReason',
        'longFrameRatio',
        'p95FrameMs',
        'paused',
        'plan',
        'sampleCount',
        'source',
        'sources',
        'status',
        'statusSince',
        'target',
        'targetFps',
        'thresholds',
        'updatedAt',
        'version',
        'warmupRemainingMs',
        'warnings',
        'windowMs',
      ].sort(),
    );
  });

  it('exposes the plan and monitor through one diagnostics payload', async () => {
    const adaptive = await loadModule();
    const diagnostics = adaptive.getPerformanceDiagnostics();

    expect(diagnostics.plan).toMatchObject({
      frameRate: expect.any(Number),
      tier: expect.stringMatching(/^(constrained|balanced|high)$/),
      reasons: expect.any(Array),
    });
    expect(diagnostics.monitor.version).toBe(2);
    expect(diagnostics.device).toMatchObject({
      capabilityTier: expect.stringMatching(/^(constrained|balanced|high)$/),
      confidence: expect.stringMatching(/^(high|partial|none)$/),
    });
  });
});

describe('monitor preservation guards', () => {
  it('samples existing loops and adds no scheduler or listener', async () => {
    const adaptiveSource = readSource('app/lib/adaptive-performance.js');
    const engineSource = readSource('components/cosmic-event-engine.js');
    const startIndex = adaptiveSource.indexOf('Observational frame-delivery monitor');
    const endIndex = adaptiveSource.indexOf('Animation frame governor');

    // Fail loudly if a marker is renamed or reordered, so the scheduler guard
    // below can never pass vacuously on an empty slice.
    expect(startIndex).toBeGreaterThan(-1);
    expect(endIndex).toBeGreaterThan(startIndex);

    const monitorSource = adaptiveSource.slice(startIndex, endIndex);
    expect(monitorSource.trim().length).toBeGreaterThan(0);

    expect(adaptiveSource).toContain('recordFrameSample(stamp)');
    expect(engineSource).toContain('recordFrameSample(timestamp, FRAME_SOURCES.COSMIC)');
    expect(monitorSource).not.toMatch(/requestAnimationFrame|setInterval|setTimeout|addEventListener/);
  });

  it('renders a zero plan target instead of an unknown placeholder', async () => {
    const workbenchSource = readSource('components/graphics/CreativeWorkbench.jsx');

    // A paused plan targets 0 fps, so a truthy check would hide it behind '—'.
    expect(workbenchSource).toContain('performanceDiagnostics?.monitor?.targetFps != null');
  });

  it('keeps the Workbench diagnostics state from shadowing the frame clock', async () => {
    const workbenchSource = readSource('components/graphics/CreativeWorkbench.jsx');

    // The frame callback reads the global performance clock, so a local binding
    // of the same name shadows it and throws on every frame.
    expect(workbenchSource).not.toMatch(/\b(?:const|let|var)\s+\[\s*performance\b/);
    expect(workbenchSource).not.toMatch(/\bsetPerformance\b/);
    expect(workbenchSource).toContain('performanceDiagnostics');
    expect(workbenchSource).toContain("typeof performance !== 'undefined'");
  });

  it('leaves the cosmic engine local quality step untouched', async () => {
    const engineSource = readSource('components/cosmic-event-engine.js');

    expect(engineSource).toContain('if (fps < 42 && qualitySteps < 2)');
    expect(engineSource).toContain(
      'if (fps < 18 && qualitySteps >= 2 && nearSurface && !nearDead)',
    );
  });
});
