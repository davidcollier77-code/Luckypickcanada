// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';

// A controllable Howl, so the mute path can be driven through the real audio
// module instead of being inferred from its source.
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

describe('Reveal sound mute control', () => {
  beforeEach(() => {
    vi.resetModules();
    howler.instances.length = 0;
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  it('reports its state and defaults to unmuted', async () => {
    const audio = await import('../app/lib/audio');

    expect(audio.isRevealAudioMuted()).toBe(false);
    expect(audio.setRevealAudioMuted(true)).toBe(true);
    expect(audio.isRevealAudioMuted()).toBe(true);
    expect(audio.setRevealAudioMuted(false)).toBe(false);
    expect(audio.isRevealAudioMuted()).toBe(false);
  });

  it('plays nothing while muted and plays again after unmuting', async () => {
    const audio = await import('../app/lib/audio');
    audio.setRevealAudioMuted(true);

    const mutedSession = audio.beginRevealAudioSession();
    await expect(audio.playRevealApplause(mutedSession)).resolves.toBe(false);
    // Muted means no decode is requested at all.
    expect(howler.instances).toHaveLength(0);

    await expect(audio.playRevealSparkle()).resolves.toBeUndefined();

    audio.setRevealAudioMuted(false);
    const session = audio.beginRevealAudioSession();
    const cue = audio.playRevealApplause(session);
    await vi.waitFor(() => expect(howler.instances).toHaveLength(1));

    const applause = howler.instances[0];
    applause.status = 'loaded';
    applause.emit('load');

    await expect(cue).resolves.toBe(true);
    expect(applause.playCount).toBe(1);
  });

  it('stops a playing cue immediately when muted', async () => {
    const audio = await import('../app/lib/audio');
    const session = audio.beginRevealAudioSession();
    const cue = audio.playRevealApplause(session);
    await vi.waitFor(() => expect(howler.instances).toHaveLength(1));

    const applause = howler.instances[0];
    applause.status = 'loaded';
    applause.emit('load');
    await expect(cue).resolves.toBe(true);
    expect(applause.playCount).toBe(1);

    audio.setRevealAudioMuted(true);
    expect(applause.stopCount).toBeGreaterThan(0);
  });

  it('does not start an applause decode that completes after the mute', async () => {
    const audio = await import('../app/lib/audio');
    const session = audio.beginRevealAudioSession();

    const cue = audio.playRevealApplause(session);
    await vi.waitFor(() => expect(howler.instances).toHaveLength(1));

    audio.setRevealAudioMuted(true);
    const applause = howler.instances[0];
    applause.status = 'loaded';
    applause.emit('load');

    await expect(cue).resolves.toBe(false);
    expect(applause.playCount).toBe(0);
  });

  it('keeps the mute preference for the next reveal session', async () => {
    const audio = await import('../app/lib/audio');
    audio.setRevealAudioMuted(true);
    audio.beginRevealAudioSession();
    audio.endRevealAudioSession();

    const reopened = audio.beginRevealAudioSession();
    await expect(audio.playRevealApplause(reopened)).resolves.toBe(false);
    expect(howler.instances).toHaveLength(0);
    expect(audio.isRevealAudioMuted()).toBe(true);
  });
});
