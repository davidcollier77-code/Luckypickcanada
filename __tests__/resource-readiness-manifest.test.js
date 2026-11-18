import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const originalConnection = Object.getOwnPropertyDescriptor(navigator, 'connection');
const originalDeviceMemory = Object.getOwnPropertyDescriptor(navigator, 'deviceMemory');
const originalHardwareConcurrency = Object.getOwnPropertyDescriptor(navigator, 'hardwareConcurrency');

let hub;
let adaptive;
let manifest;

async function loadManifest() {
  vi.resetModules();
  adaptive = await import('../app/lib/adaptive-performance.js');
  hub = await import('../app/lib/resource-readiness.js');
  hub.resetResourceReadiness();
  manifest = await import('../app/lib/resource-readiness-manifest.js');
}

function useCapableProfile() {
  Object.defineProperty(navigator, 'deviceMemory', { value: 8, configurable: true });
  Object.defineProperty(navigator, 'hardwareConcurrency', { value: 8, configurable: true });
  Object.defineProperty(navigator, 'connection', {
    value: { downlink: 30, rtt: 30, addEventListener: vi.fn(), removeEventListener: vi.fn() },
    configurable: true,
  });
  adaptive.refreshAdaptivePlan();
}

beforeEach(async () => {
  await loadManifest();
});

afterEach(() => {
  hub.resetResourceReadiness();
  vi.restoreAllMocks();

  if (originalConnection) Object.defineProperty(navigator, 'connection', originalConnection);
  else delete navigator.connection;
  if (originalDeviceMemory) Object.defineProperty(navigator, 'deviceMemory', originalDeviceMemory);
  else delete navigator.deviceMemory;
  if (originalHardwareConcurrency) {
    Object.defineProperty(navigator, 'hardwareConcurrency', originalHardwareConcurrency);
  } else {
    delete navigator.hardwareConcurrency;
  }
});

describe('experience coverage', () => {
  it('registers every requested experience with a version and at least one resource', () => {
    const ids = hub.getRegisteredExperiences().map((definition) => definition.id);

    expect(ids).toEqual(
      expect.arrayContaining([
        'reveal',
        'lucky-meter',
        'lucky-number-generator',
        'crystal-ball',
        'lucky-map',
        'lucky-stories',
      ]),
    );
    for (const definition of hub.getRegisteredExperiences()) {
      expect(definition.version).toBeGreaterThan(0);
      expect(definition.resources.length).toBeGreaterThan(0);
    }
  });

  it('registers the personal and gift reveals once on the shared reveal route', () => {
    expect(manifest.experiencesForPath('/reveal')).toEqual(['reveal']);
    expect(manifest.experiencesForPath('/reveal/abc123')).toEqual(['reveal']);
    expect(hub.getRegisteredExperiences().filter((definition) => definition.id === 'reveal')).toHaveLength(1);
  });

  it('maps each route to its experiences without matching unrelated paths', () => {
    expect(manifest.experiencesForPath('/lucky-meter')).toEqual(['lucky-meter', 'lucky-number-generator']);
    expect(manifest.experiencesForPath('/crystal-ball')).toEqual(['crystal-ball']);
    expect(manifest.experiencesForPath('/map')).toEqual(['lucky-map', 'lucky-stories']);
    expect(manifest.experiencesForPath('/about')).toEqual([]);
    expect(manifest.experiencesForPath('/reveal-something')).toEqual([]);
    expect(manifest.experiencesForPath('')).toEqual([]);
  });

  it('references only assets that exist in public', () => {
    for (const definition of hub.getRegisteredExperiences()) {
      for (const resource of definition.resources) {
        if (resource.kind !== 'image') continue;
        expect(existsSync(join(process.cwd(), 'public', resource.url)), resource.url).toBe(true);
      }
    }
  });

  it('never warms an API or data endpoint', () => {
    for (const definition of hub.getRegisteredExperiences()) {
      for (const resource of definition.resources) {
        const target = resource.url ?? resource.route ?? '';
        expect(target.startsWith('/api')).toBe(false);
      }
    }
  });
});

describe('shared resources and budgets', () => {
  it('deduplicates the map route bundle shared by the map and stories experiences', async () => {
    useCapableProfile();
    const prefetch = vi.fn();
    hub.configureRoutePrefetch(prefetch);
    hub.registerResourceAdapter('image', async () => ({}));

    await Promise.all([
      hub.prepareExperience('lucky-map', { priority: 'critical' }),
      hub.prepareExperience('lucky-stories', { priority: 'critical' }),
    ]);

    expect(prefetch.mock.calls.filter(([route]) => route === '/map')).toHaveLength(1);
  });

  it('leaves the heavy map sky and Crystal Ball audio for route or intent', async () => {
    useCapableProfile();
    const images = [];
    const audios = [];
    hub.configureRoutePrefetch(() => {});
    hub.registerResourceAdapter('image', async (resource) => {
      images.push(resource.url);
    });
    hub.registerResourceAdapter('audio', async (resource) => {
      audios.push(resource.id);
    });

    await hub.prepareExperience('lucky-map', { priority: 'background' });
    await hub.prepareExperience('crystal-ball', { priority: 'background' });
    expect(images).not.toContain('/assets/lucky-map-sky.avif');
    expect(audios).toHaveLength(0);

    await hub.prepareExperience('lucky-map', { priority: 'critical' });
    await hub.prepareExperience('crystal-ball', { priority: 'critical' });
    expect(images).toContain('/assets/lucky-map-sky.avif');
    expect(audios).toEqual(['crystal-ball-audio']);
  });

  it('uses only small derivatives for the homepage idle order', () => {
    for (const id of manifest.HOMEPAGE_LIKELY_NEXT) {
      const definition = hub.getExperienceDefinition(id);
      expect(definition).not.toBeNull();
      for (const resource of definition.resources) {
        if (resource.kind !== 'image' || resource.background !== true) continue;
        expect(resource.bytes).toBeLessThanOrEqual(200_000);
      }
    }
  });
});
