import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

let hub;

async function loadHub() {
  vi.resetModules();
  hub = await import('../app/lib/resource-readiness.js');
  hub.resetResourceReadiness();
  return hub;
}

async function flushMicrotasks() {
  for (let index = 0; index < 8; index += 1) {
    await Promise.resolve();
  }
}

function renderedImage(loadedSrc) {
  const image = document.createElement('img');
  image.src = loadedSrc;
  Object.defineProperty(image, 'complete', { value: true, configurable: true });
  Object.defineProperty(image, 'naturalWidth', { value: 1024, configurable: true });
  Object.defineProperty(image, 'currentSrc', { value: loadedSrc, configurable: true });
  document.body.appendChild(image);
  return image;
}

function registerImageExperience(id, url) {
  return hub.registerExperienceResources({
    id,
    version: 1,
    dependsOn: [],
    resources: [{ id: `${id}-image`, kind: 'image', url }],
  });
}

beforeEach(async () => {
  await loadHub();
});

afterEach(() => {
  document.body.innerHTML = '';
  hub.resetResourceReadiness();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('imageIdentity', () => {
  it('ignores the width derivative but not the artwork, format or directory', () => {
    expect(hub.imageIdentity('/images/lucky-meter-night-sky-640w.avif')).toBe(
      '/images/lucky-meter-night-sky.avif',
    );
    expect(hub.imageIdentity('/images/lucky-meter-night-sky-1024w.avif')).toBe(
      '/images/lucky-meter-night-sky.avif',
    );
    expect(hub.imageIdentity('/assets/crystal-ball-pedestal-420w.avif?v=2')).toBe(
      '/assets/crystal-ball-pedestal.avif',
    );
    expect(hub.imageIdentity('/assets/crystal-ball-pedestal-716w.avif')).toBe(
      hub.imageIdentity('/assets/crystal-ball-pedestal-420w.avif'),
    );
    // Different format, directory or artwork must never be treated as the same image.
    expect(hub.imageIdentity('/images/lucky-meter-night-sky-640w.webp')).not.toBe(
      hub.imageIdentity('/images/lucky-meter-night-sky-640w.avif'),
    );
    expect(hub.imageIdentity('/assets/crystal-ball-pedestal-420w.avif')).not.toBe(
      hub.imageIdentity('/images/crystal-ball-pedestal-420w.avif'),
    );
    // Rendered images and resource-timing entries report absolute URLs.
    expect(hub.imageIdentity('https://luckypickcanada.ca/images/lucky-meter-night-sky-1024w.avif')).toBe(
      '/images/lucky-meter-night-sky.avif',
    );
    expect(hub.imageIdentity('/images/sky-640w.avif')).toBe('/images/sky.avif');
    expect(hub.imageIdentity('/images/logo-2024.avif')).toBe('/images/logo-2024.avif');
    expect(hub.imageIdentity('')).toBeNull();
  });
});

describe('responsive image reuse', () => {
  it('does not request another width when the page has already loaded one', async () => {
    const images = [];
    class FakeImage {
      constructor() {
        images.push(this);
      }

      decode() {
        return Promise.resolve();
      }
    }
    vi.stubGlobal('Image', FakeImage);

    renderedImage('https://luckypickcanada.ca/images/lucky-meter-night-sky-1024w.avif');
    registerImageExperience('lucky-meter', '/images/lucky-meter-night-sky-640w.avif');

    const snapshot = await hub.prepareExperience('lucky-meter');
    await flushMicrotasks();

    expect(images).toHaveLength(0);
    expect(snapshot.state).toBe('ready');
    expect(snapshot.resources[0].state).toBe('ready');
  });

  it('still requests an image the page has not loaded', async () => {
    const images = [];
    class FakeImage {
      constructor() {
        this.complete = false;
        this.naturalWidth = 0;
        images.push(this);
      }

      decode() {
        return Promise.resolve();
      }
    }
    vi.stubGlobal('Image', FakeImage);

    renderedImage('/images/some-other-artwork-1024w.avif');
    registerImageExperience('crystal-ball', '/assets/crystal-ball-pedestal-420w.avif');

    const preparation = hub.prepareExperience('crystal-ball');
    await flushMicrotasks();

    expect(images).toHaveLength(1);
    expect(images[0].src).toBe('/assets/crystal-ball-pedestal-420w.avif');

    images[0].onload();
    await flushMicrotasks();
    expect((await preparation).state).toBe('ready');
  });

  it('reuses a width the browser loaded according to resource timing', async () => {
    class FakeImage {
      constructor() {
        throw new Error('the hub must not request a derivative that is already loaded');
      }
    }
    vi.stubGlobal('Image', FakeImage);
    vi.spyOn(performance, 'getEntriesByType').mockImplementation((type) =>
      type === 'resource'
        ? [
            {
              name: 'https://luckypickcanada.ca/assets/crystal-ball-pedestal-716w.avif',
              initiatorType: 'img',
              transferSize: 84_000,
              encodedBodySize: 83_000,
              decodedBodySize: 0,
            },
          ]
        : [],
    );

    registerImageExperience('crystal-ball', '/assets/crystal-ball-pedestal-420w.avif');

    const snapshot = await hub.prepareExperience('crystal-ball');
    expect(snapshot.state).toBe('ready');
    expect(snapshot.resources[0].state).toBe('ready');
  });

  it('ignores resource entries that delivered no bytes', async () => {
    const images = [];
    class FakeImage {
      constructor() {
        images.push(this);
      }

      decode() {
        return Promise.resolve();
      }
    }
    vi.stubGlobal('Image', FakeImage);
    vi.spyOn(performance, 'getEntriesByType').mockImplementation((type) =>
      type === 'resource'
        ? [{ name: '/assets/crystal-ball-pedestal-716w.avif', transferSize: 0, encodedBodySize: 0 }]
        : [],
    );

    registerImageExperience('crystal-ball', '/assets/crystal-ball-pedestal-420w.avif');
    const preparation = hub.prepareExperience('crystal-ball');
    await flushMicrotasks();

    expect(images).toHaveLength(1);
    images[0].onload();
    await flushMicrotasks();
    await preparation;
  });

  it('remembers what the hub itself loaded for a later experience', async () => {
    const images = [];
    class FakeImage {
      constructor() {
        images.push(this);
      }

      decode() {
        return Promise.resolve();
      }
    }
    vi.stubGlobal('Image', FakeImage);

    registerImageExperience('first', '/images/lucky-meter-night-sky-640w.avif');
    const first = hub.prepareExperience('first');
    await flushMicrotasks();
    images[0].onload();
    await flushMicrotasks();
    await first;

    registerImageExperience('second', '/images/lucky-meter-night-sky-1024w.avif');
    const second = await hub.prepareExperience('second');

    expect(images).toHaveLength(1);
    expect(second.state).toBe('ready');
    expect(second.resources[0].state).toBe('ready');
  });

  it('forgets hub-loaded identities when the hub is reset', async () => {
    const images = [];
    class FakeImage {
      constructor() {
        images.push(this);
      }

      decode() {
        return Promise.resolve();
      }
    }
    vi.stubGlobal('Image', FakeImage);

    registerImageExperience('first', '/images/lucky-meter-night-sky-640w.avif');
    const first = hub.prepareExperience('first');
    await flushMicrotasks();
    images[0].onload();
    await flushMicrotasks();
    await first;

    hub.resetResourceReadiness();
    registerImageExperience('second', '/images/lucky-meter-night-sky-1024w.avif');
    const preparation = hub.prepareExperience('second');
    await flushMicrotasks();

    expect(images).toHaveLength(2);
    images[1].onload();
    await flushMicrotasks();
    await preparation;
  });
});
