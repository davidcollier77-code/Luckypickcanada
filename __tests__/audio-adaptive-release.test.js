import { afterEach, describe, expect, it, vi } from 'vitest';

const audioMocks = vi.hoisted(() => ({ constructed: 0, instances: [] }));

vi.mock('howler', () => {
  class Howl {
    constructor(config) {
      this.config = config;
      this._state = 'loaded';
      this.unloaded = false;
      this.played = false;
      this.playCount = 0;
      this.stopCalls = [];
      this.fadeCalls = [];
      audioMocks.instances.push(this);
      audioMocks.constructed += 1;
    }

    state() {
      return this._state;
    }

    on() {}

    once(event, callback) {
      if (event === 'load') callback();
    }

    play() {
      this.played = true;
      this.playCount += 1;
      return this.playCount;
    }

    stop(...args) {
      this.stopCalls.push(args);
      this.played = false;
    }

    playing() {
      return this.played;
    }

    unload() {
      this.unloaded = true;
      this._state = 'unloaded';
    }

    volume() {}

    fade(...args) {
      this.fadeCalls.push(args);
    }
  }

  return { Howl };
});

const originalConnection = Object.getOwnPropertyDescriptor(navigator, 'connection');
const originalDeviceMemory = Object.getOwnPropertyDescriptor(navigator, 'deviceMemory');
const originalHardwareConcurrency = Object.getOwnPropertyDescriptor(navigator, 'hardwareConcurrency');

function setConnection(value) {
  Object.defineProperty(navigator, 'connection', { value, configurable: true });
}

function setDevice({ memory = 8, cores = 8 } = {}) {
  Object.defineProperty(navigator, 'deviceMemory', { value: memory, configurable: true });
  Object.defineProperty(navigator, 'hardwareConcurrency', { value: cores, configurable: true });
}

async function loadAudio() {
  vi.resetModules();
  audioMocks.constructed = 0;
  audioMocks.instances.length = 0;
  const adaptive = await import('../app/lib/adaptive-performance.js');
  const audio = await import('../app/lib/audio.js');
  return { adaptive, audio };
}

afterEach(() => {
  vi.restoreAllMocks();

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

describe('adaptive audio loading', () => {
  it('skips a speculative preload on a Save-Data connection', async () => {
    setConnection({ saveData: true, downlink: 20, rtt: 30 });
    setDevice();
    const { adaptive, audio } = await loadAudio();

    expect(adaptive.allowSpeculativeAudio()).toBe(false);
    await audio.preloadRevealSparkle();

    expect(audioMocks.constructed).toBe(0);
  });

  it('still loads the sound when the visitor activates it, and plays it on that activation', async () => {
    setConnection({ saveData: true, downlink: 20, rtt: 30 });
    setDevice();
    const { audio } = await loadAudio();

    // The first activation performs the deferred load; the existing playback
    // contract then starts the already-loaded sound.
    await audio.playRevealSparkle();
    expect(audioMocks.constructed).toBe(1);

    await audio.playRevealSparkle();
    expect(audioMocks.instances[0].played).toBe(true);
  });

  it('preloads while the connection is capable', async () => {
    setConnection({ downlink: 30, rtt: 30 });
    setDevice();
    const { adaptive, audio } = await loadAudio();

    expect(adaptive.allowSpeculativeAudio()).toBe(true);
    await audio.preloadRevealSparkle();

    expect(audioMocks.constructed).toBe(1);
  });

  it('releases idle decoded audio and clears the load promise for a later reload', async () => {
    setConnection({ downlink: 30, rtt: 30 });
    setDevice();
    const { audio } = await loadAudio();

    await audio.preloadRevealSparkle();
    expect(audioMocks.instances[0].unloaded).toBe(false);

    expect(audio.releaseIdleAudio()).toBe(1);
    expect(audioMocks.instances[0].unloaded).toBe(true);
    expect(audio.releaseIdleAudio()).toBe(0);

    // The next interaction reloads rather than playing a released sound.
    await audio.preloadRevealSparkle();
    expect(audioMocks.constructed).toBe(2);
  });

  it('never interrupts a sound that is currently playing', async () => {
    setConnection({ downlink: 30, rtt: 30 });
    setDevice();
    const { audio } = await loadAudio();

    await audio.playRevealSparkle();
    await audio.playRevealSparkle();
    expect(audioMocks.instances[0].played).toBe(true);

    expect(audio.releaseIdleAudio()).toBe(0);
    expect(audioMocks.instances[0].unloaded).toBe(false);
  });

  it('keeps a playing Crystal Ball energy loop stoppable after an idle release', async () => {
    setConnection({ downlink: 30, rtt: 30 });
    setDevice();
    const { audio } = await loadAudio();

    await audio.preloadCrystalBallAudio();
    audio.playCrystalBallEnergy();
    const energy = audioMocks.instances.find((instance) => instance.played);
    expect(energy).toBeDefined();

    audio.releaseIdleAudio();
    expect(energy.unloaded).toBe(false);

    audio.stopCrystalBallEnergy();
    // The preserved loop must still be faded by its own playback id.
    expect(energy.fadeCalls.at(-1)).toEqual([expect.any(Number), 0, 160, energy.playCount]);
  });
});
