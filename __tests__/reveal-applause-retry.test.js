// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';

// A controllable Howl so the test can fail the first decode and succeed on the
// retry, which is the exact sequence the review reported as silenced forever.
const howler = vi.hoisted(() => {
  const instances = [];

  class Howl {
    constructor() {
      this.status = 'loading';
      this.handlers = new Map();
      this.playCount = 0;
      this.stopCount = 0;
      instances.push(this);
    }

    state() {
      return this.status;
    }

    on(event, handler) {
      const handlers = this.handlers.get(event) ?? [];
      handlers.push(handler);
      this.handlers.set(event, handlers);
      return this;
    }

    once(event, handler) {
      const wrapped = (...args) => {
        const handlers = this.handlers.get(event) ?? [];
        this.handlers.set(event, handlers.filter((item) => item !== wrapped));
        handler(...args);
      };
      return this.on(event, wrapped);
    }

    emit(event, ...args) {
      for (const handler of [...(this.handlers.get(event) ?? [])]) {
        handler(...args);
      }
    }

    play() {
      this.playCount += 1;
      return this.playCount;
    }

    stop() {
      this.stopCount += 1;
      return this;
    }
  }

  return { Howl, instances };
});

vi.mock('howler', () => ({ Howl: howler.Howl }));

describe('applause load-failure retry', () => {
  beforeEach(() => {
    vi.resetModules();
    howler.instances.length = 0;
    // The failure path logs a warning by design; keep the test output readable.
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  it('plays on a retry in the same session after the first decode fails', async () => {
    const audio = await import('../app/lib/audio');
    const session = audio.beginRevealAudioSession();

    const firstAttempt = audio.playRevealApplause(session);
    await vi.waitFor(() => expect(howler.instances).toHaveLength(1));
    howler.instances[0].emit('loaderror', 1, 'network down');
    await expect(firstAttempt).resolves.toBe(false);

    // The guard must have been released; otherwise this resolves false without
    // creating a second Howl and the reveal stays silent.
    const retry = audio.playRevealApplause(session);
    await vi.waitFor(() => expect(howler.instances).toHaveLength(2));
    const recovered = howler.instances[1];
    recovered.status = 'loaded';
    recovered.emit('load');

    await expect(retry).resolves.toBe(true);
    expect(recovered.playCount).toBe(1);
    expect(recovered.stopCount).toBe(1);

    // One cue per session still holds after the recovery.
    await expect(audio.playRevealApplause(session)).resolves.toBe(false);
    expect(recovered.playCount).toBe(1);
  });

  it('does not start the applause after the reveal session has ended', async () => {
    const audio = await import('../app/lib/audio');
    const session = audio.beginRevealAudioSession();

    const attempt = audio.playRevealApplause(session);
    await vi.waitFor(() => expect(howler.instances).toHaveLength(1));

    audio.endRevealAudioSession();
    const sound = howler.instances[0];
    sound.status = 'loaded';
    sound.emit('load');

    await expect(attempt).resolves.toBe(false);
    expect(sound.playCount).toBe(0);
    expect(sound.stopCount).toBeGreaterThan(0);
  });
});
