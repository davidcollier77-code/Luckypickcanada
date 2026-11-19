import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * Guards `specs/190-link-prefetch-policy`. Next.js prefetches links by default,
 * which bypassed the adaptive plan's prefetch decision on constrained
 * connections. Every navigation link now uses IntentPrefetchLink, and the hub's
 * speculatively prepared route code obeys the same policy.
 */

const NAVIGATION_FILES = [
  'app/layout.js',
  'app/homepage/HomePage.js',
  'app/homepage/HomeStaticSections.js',
  'app/about/page.js',
  'app/privacy/page.js',
  'app/terms/page.js',
  'app/lucky-card-reveal.js',
  'components/AboutSection.tsx',
  'components/LuckyGenerator.tsx',
  'components/DailyResonance.tsx',
  'app/components/CrystalBall/CrystalBall.tsx',
];

let hub;
let adaptive;
const originalConnection = Object.getOwnPropertyDescriptor(navigator, 'connection');

async function loadModules() {
  vi.resetModules();
  adaptive = await import('../app/lib/adaptive-performance.js');
  hub = await import('../app/lib/resource-readiness.js');
  hub.resetResourceReadiness();
}

function stubConnection(value) {
  Object.defineProperty(navigator, 'connection', { value, configurable: true });
  adaptive.refreshAdaptivePlan();
}

function useFastConnection() {
  stubConnection({ downlink: 30, rtt: 30, saveData: false, addEventListener: vi.fn(), removeEventListener: vi.fn() });
}

function useModerateConnection() {
  stubConnection({ downlink: 2, rtt: 300, saveData: false, addEventListener: vi.fn(), removeEventListener: vi.fn() });
}

function useSaveData() {
  stubConnection({ downlink: 30, rtt: 30, saveData: true, addEventListener: vi.fn(), removeEventListener: vi.fn() });
}

function registerRoute(route) {
  return hub.registerExperienceResources({
    id: `route-${route}`,
    version: 1,
    dependsOn: [],
    resources: [{ id: `code-${route}`, kind: 'code', route }],
  });
}

async function flushMicrotasks() {
  for (let index = 0; index < 8; index += 1) {
    await Promise.resolve();
  }
}

beforeEach(async () => {
  window.history.replaceState({}, '', '/');
  await loadModules();
  useFastConnection();
});

afterEach(() => {
  hub.resetResourceReadiness();
  vi.restoreAllMocks();
  if (originalConnection) {
    Object.defineProperty(navigator, 'connection', originalConnection);
  } else {
    delete navigator.connection;
  }
  adaptive.refreshAdaptivePlan();
});

describe('navigation links', () => {
  it.each(NAVIGATION_FILES)('%s prefetches through the adaptive policy', (file) => {
    const source = readFileSync(join(process.cwd(), file), 'utf8');
    expect(source, file).toContain('IntentPrefetchLink');
    expect(source, file).not.toContain("from 'next/link'");
    expect(source, file).not.toMatch(/<Link\b/);
    expect(source, file).not.toMatch(/<\/Link>/);
  });

  it('keeps next/link inside the intent wrapper only', () => {
    const source = readFileSync(join(process.cwd(), 'components/IntentPrefetchLink.jsx'), 'utf8');
    expect(source).toContain("import Link from 'next/link';");
    expect(source).toContain('prefetch={prefetchEnabled ? undefined : false}');
  });
});

describe('speculative route preparation', () => {
  it('prefetches route code on a fast connection', async () => {
    const prefetch = vi.fn();
    hub.configureRoutePrefetch(prefetch);
    registerRoute('/target-fast');

    const snapshot = await hub.prepareExperience('route-/target-fast', { priority: 'background' });
    await flushMicrotasks();

    expect(prefetch).toHaveBeenCalledWith('/target-fast');
    expect(snapshot.state).toBe('ready');
  });

  it('does not prefetch route code under Save-Data', async () => {
    useSaveData();
    const prefetch = vi.fn();
    hub.configureRoutePrefetch(prefetch);
    registerRoute('/target-savedata');

    // Background work is paused entirely under Save-Data, so even an allowed
    // intent job must refuse the speculative route prefetch at the adapter.
    const snapshot = await hub.prepareExperience('route-/target-savedata', { priority: 'intent' });
    await flushMicrotasks();

    expect(prefetch).not.toHaveBeenCalled();
    expect(snapshot.resources[0].state).toBe('skipped');
    expect(snapshot.resources[0].reason).toBe('prefetch-disabled');
  });

  it('waits for a press, tap or focus on a moderate connection', async () => {
    useModerateConnection();
    const prefetch = vi.fn();
    hub.configureRoutePrefetch(prefetch);
    registerRoute('/target-moderate');

    const background = await hub.prepareExperience('route-/target-moderate', { priority: 'background' });
    await flushMicrotasks();
    expect(prefetch).not.toHaveBeenCalled();
    expect(background.resources[0].reason).toBe('prefetch-strong-intent');

    const intent = await hub.prepareExperience('route-/target-moderate', { priority: 'intent' });
    await flushMicrotasks();
    expect(prefetch).toHaveBeenCalledWith('/target-moderate');
    expect(intent.state).toBe('ready');
  });

  it('still skips the route already on screen on a fast connection', async () => {
    const prefetch = vi.fn();
    hub.configureRoutePrefetch(prefetch);
    registerRoute('/');

    const snapshot = await hub.prepareExperience('route-/', { priority: 'critical' });
    await flushMicrotasks();

    expect(prefetch).not.toHaveBeenCalled();
    expect(snapshot.resources[0].reason).toBe('current-route');
  });
});
