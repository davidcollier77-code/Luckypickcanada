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

function createHarness(adaptive, { visible = true, target = frameTarget() } = {}) {
  let clock = 0;
  let isVisible = visible;
  let currentTarget = target;
  const monitor = adaptive.createPerformanceMonitor({
    now: () => clock,
    isVisible: () => isVisible,
    readTarget: () => currentTarget,
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
    run(from, to, step) {
      for (let timestamp = from; timestamp <= to + 0.001; timestamp += step) {
        clock = timestamp;
        monitor.record(timestamp);
      }
    },
  };
}

describe('observational frame monitor', () => {
  it('starts in warm-up instead of judging startup frames', async () => {
    const adaptive = await loadModule();
    const harness = createHarness(adaptive);

    harness.run(0, 1_200, 16.667);

    expect(harness.monitor.snapshot()).toMatchObject({
      status: 'warming',
      lastResetReason: 'startup',
    });
    expect(harness.monitor.snapshot().fps).toBeNull();
  });

  it('reaches healthy after a full 60 fps window', async () => {
    const adaptive = await loadModule();
    const harness = createHarness(adaptive);

    harness.run(0, 4_200, 16.667);

    const snapshot = harness.monitor.snapshot();
    expect(snapshot.status).toBe('healthy');
    expect(snapshot.fps).toBeGreaterThan(55);
    expect(snapshot.p95FrameMs).toBeLessThan(20);
    expect(snapshot.sampleCount).toBeGreaterThan(60);
  });

  it('classifies sustained 30 fps delivery as strained', async () => {
    const adaptive = await loadModule();
    const harness = createHarness(adaptive);

    harness.run(0, 5_000, 33.333);

    const snapshot = harness.monitor.snapshot();
    expect(snapshot.status).toBe('strained');
    expect(snapshot.fps).toBeGreaterThan(28);
    expect(snapshot.fps).toBeLessThan(35);
  });

  it('classifies sustained below-critical delivery as critical', async () => {
    const adaptive = await loadModule();
    const harness = createHarness(adaptive);

    harness.run(0, 5_000, 50);

    expect(harness.monitor.snapshot()).toMatchObject({
      status: 'critical',
      fps: 20,
      longFrameRatio: 1,
    });
  });

  it('requires hysteresis before changing an established status', async () => {
    const adaptive = await loadModule();
    const harness = createHarness(adaptive);

    harness.run(0, 4_200, 16.667);
    expect(harness.monitor.snapshot().status).toBe('healthy');

    harness.run(4_200, 4_800, 33.333);
    expect(harness.monitor.snapshot().status).toBe('healthy');

    harness.run(4_833.333, 6_800, 33.333);
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

  it('resets while hidden and again when the page becomes visible', async () => {
    const adaptive = await loadModule();
    const harness = createHarness(adaptive);

    harness.run(0, 4_200, 16.667);
    harness.setVisible(false);
    harness.setClock(4_216);
    harness.monitor.record(4_216);

    expect(harness.monitor.snapshot()).toMatchObject({
      status: 'warming',
      lastResetReason: 'hidden',
    });

    harness.setVisible(true);
    harness.setClock(4_232);
    harness.monitor.record(4_232);

    expect(harness.monitor.snapshot()).toMatchObject({
      status: 'warming',
      lastResetReason: 'visible',
    });
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

  it('collapses duplicate same-frame samples from multiple loops', async () => {
    const adaptive = await loadModule();
    const harness = createHarness(adaptive);

    harness.run(0, 2_200, 16.667);
    const before = harness.monitor.snapshot().sampleCount;
    harness.monitor.record(harness.clock);
    harness.monitor.record(harness.clock);

    expect(harness.monitor.snapshot().sampleCount).toBe(before);
  });

  it('exposes a stable diagnostic snapshot without starting work', async () => {
    const adaptive = await loadModule();
    const snapshot = adaptive.getPerformanceSnapshot();

    expect(snapshot).toMatchObject({
      status: 'warming',
      windowMs: 1_500,
      lastResetReason: 'startup',
    });
    expect(Object.keys(snapshot).sort()).toEqual(
      [
        'averageFrameMs',
        'fps',
        'lastResetReason',
        'longFrameRatio',
        'p95FrameMs',
        'sampleCount',
        'status',
        'statusSince',
        'target',
        'updatedAt',
        'warmupRemainingMs',
        'windowMs',
      ].sort(),
    );
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
    expect(engineSource).toContain('recordFrameSample(timestamp)');
    expect(monitorSource).not.toMatch(/requestAnimationFrame|setInterval|setTimeout|addEventListener/);
  });

  it('leaves the cosmic engine local quality step untouched', async () => {
    const engineSource = readSource('components/cosmic-event-engine.js');

    expect(engineSource).toContain('if (fps < 42 && qualitySteps < 2)');
    expect(engineSource).toContain(
      'if (fps < 18 && qualitySteps >= 2 && nearSurface && !nearDead)',
    );
  });
});
