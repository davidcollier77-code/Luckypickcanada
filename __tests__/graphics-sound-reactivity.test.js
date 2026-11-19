// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  createAudioReactive,
  supportsAudioAnalysis,
} from '../app/lib/graphics/audio-reactivity.js';
import { selectGraphicsTechnologies } from '../app/lib/graphics/technologies.js';

/**
 * Sound-reactive cinematics: the envelope measured from the audio mix the site
 * already plays, and the bindings that make lights, particles and numeric
 * properties follow it. Nothing here creates an audio context; the analyser is
 * injected, which is exactly the shape `attachHowlerAnalyser` resolves to.
 */

function fakeAnalyser(values) {
  const data = Uint8Array.from(values);
  const state = { reads: 0 };
  return {
    get frequencyBinCount() {
      return data.length;
    },
    get reads() {
      return state.reads;
    },
    set(next) {
      data.set(next);
    },
    getByteFrequencyData(target) {
      state.reads += 1;
      target.set(data);
    },
  };
}

function loudAnalyser() {
  return fakeAnalyser(Array.from({ length: 32 }, () => 255));
}

afterEach(() => {
  vi.restoreAllMocks();
  // A test that hid the document must not leak that state into the next one.
  Object.defineProperty(document, 'visibilityState', {
    value: 'visible',
    configurable: true,
  });
});

describe('audio envelope', () => {
  it('measures bass, mids and highs from the existing mix', () => {
    const analyser = fakeAnalyser([
      ...Array(11).fill(220),
      ...Array(13).fill(120),
      ...Array(8).fill(60),
    ]);
    const reactive = createAudioReactive({ analyser, reducedMotion: false });

    const envelope = reactive.update(1 / 60);

    expect(envelope.available).toBe(true);
    expect(envelope.bass).toBeGreaterThan(0);
    expect(envelope.bass).toBeGreaterThan(envelope.mids);
    expect(envelope.mids).toBeGreaterThan(envelope.highs);
    for (const band of ['level', 'bass', 'mids', 'highs', 'peak', 'transient']) {
      expect(envelope[band]).toBeGreaterThanOrEqual(0);
      expect(envelope[band]).toBeLessThanOrEqual(1);
    }
    expect(analyser.reads).toBe(1);
  });

  it('rises quickly and falls slowly so a sound reads naturally', () => {
    const analyser = fakeAnalyser(Array.from({ length: 16 }, () => 0));
    const reactive = createAudioReactive({ analyser, reducedMotion: false });

    reactive.update(1 / 60);
    const rest = reactive.getEnvelope().level;

    analyser.set(Array.from({ length: 16 }, () => 255));
    reactive.update(1 / 60);
    const attack = reactive.getEnvelope().level;

    analyser.set(Array.from({ length: 16 }, () => 0));
    reactive.update(1 / 60);
    const release = reactive.getEnvelope().level;

    expect(rest).toBe(0);
    expect(attack).toBeGreaterThan(0.4);
    // A single silent frame must not drop the value as far as it rose.
    expect(release).toBeGreaterThan(attack * 0.5);
  });

  it('reports a transient when the mix jumps, once per beat', () => {
    const analyser = fakeAnalyser(Array.from({ length: 16 }, () => 0));
    const beats = [];
    const reactive = createAudioReactive({ analyser, reducedMotion: false });
    reactive.onBeat((strength) => beats.push(strength));

    reactive.update(1 / 60);
    analyser.set(Array.from({ length: 16 }, () => 250));
    reactive.update(1 / 60);

    expect(reactive.getEnvelope().beat).toBe(true);
    expect(reactive.getEnvelope().transient).toBeGreaterThan(0);
    expect(beats).toHaveLength(1);

    // The same level on the next frame is not a new beat.
    reactive.update(1 / 60);
    expect(reactive.getEnvelope().beat).toBe(false);
    expect(beats).toHaveLength(1);
  });

  it('stays neutral under reduced motion and never reads the analyser', () => {
    const analyser = loudAnalyser();
    const reactive = createAudioReactive({ analyser, reducedMotion: true });

    const envelope = reactive.update(1 / 60);

    expect(envelope.available).toBe(false);
    expect(envelope.reason).toBe('reduced-motion');
    expect(envelope.level).toBe(0);
    expect(analyser.reads).toBe(0);
  });

  it('freezes rather than analysing a hidden page', () => {
    const analyser = loudAnalyser();
    const reactive = createAudioReactive({ analyser, reducedMotion: false });
    Object.defineProperty(document, 'visibilityState', {
      value: 'hidden',
      configurable: true,
    });

    reactive.update(1 / 60);

    expect(analyser.reads).toBe(0);
    expect(reactive.getEnvelope().level).toBe(0);
  });

  it('waits for a missing audio graph without throwing', async () => {
    const reactive = createAudioReactive({
      attach: () => Promise.resolve(null),
      reducedMotion: false,
    });

    expect(() => reactive.update(1 / 60)).not.toThrow();
    await Promise.resolve();
    expect(reactive.getEnvelope().available).toBe(false);
    expect(() => reactive.dispose()).not.toThrow();
  });
});

describe('reactive bindings', () => {
  it('drives the light rig, particles and a numeric property, then unbinds', () => {
    const analyser = loudAnalyser();
    const reactive = createAudioReactive({ analyser, reducedMotion: false });
    const rig = { pulse: vi.fn() };
    const field = { setIntensity: vi.fn() };
    const material = { emissiveIntensity: 0 };

    const unbindRig = reactive.bindLightRig(rig);
    const unbindField = reactive.bindParticleField(field);
    const unbindValue = reactive.bindValue(material, 'emissiveIntensity', {
      band: 'level',
      min: 0.2,
      max: 1.4,
      smoothing: 1,
    });

    reactive.update(1 / 60);

    expect(rig.pulse).toHaveBeenCalled();
    expect(field.setIntensity).toHaveBeenCalled();
    expect(field.setIntensity.mock.calls.at(-1)[0]).toBeGreaterThan(0.45);
    expect(material.emissiveIntensity).toBeGreaterThan(0.2);
    expect(material.emissiveIntensity).toBeLessThanOrEqual(1.4);

    const pulseCalls = rig.pulse.mock.calls.length;
    unbindRig();
    unbindField();
    unbindValue();
    reactive.update(1 / 60);

    expect(rig.pulse.mock.calls.length).toBe(pulseCalls);
    expect(field.setIntensity).toHaveBeenCalledTimes(1);
  });

  it('ignores bindings whose target cannot respond', () => {
    const reactive = createAudioReactive({ analyser: loudAnalyser(), reducedMotion: false });
    expect(() => reactive.bindLightRig(null)()).not.toThrow();
    expect(() => reactive.bindParticleField({})()).not.toThrow();
    expect(() => reactive.bindValue(null, 'x')()).not.toThrow();
    expect(() => reactive.onBeat(null)()).not.toThrow();
  });

  it('reports whether an analyser is attached and can attach on demand', () => {
    const reactive = createAudioReactive({ analyser: loudAnalyser(), reducedMotion: false });
    expect(reactive.refresh()).toBe(true);

    const calm = createAudioReactive({ analyser: loudAnalyser(), reducedMotion: true });
    expect(calm.refresh()).toBe(false);
  });

  it('stops applying bindings after disposal and is safe to dispose twice', () => {
    const rig = { pulse: vi.fn() };
    const reactive = createAudioReactive({ analyser: loudAnalyser(), reducedMotion: false });
    reactive.bindLightRig(rig);

    reactive.dispose();
    reactive.dispose();
    reactive.update(1 / 60);

    expect(rig.pulse).not.toHaveBeenCalled();
  });
});

describe('technology selection for sound reactivity', () => {
  it('enables reactivity only when the browser can analyse audio', () => {
    const original = window.AudioContext;
    try {
      delete window.AudioContext;
      delete window.webkitAudioContext;
      expect(supportsAudioAnalysis()).toBe(false);
      expect(selectGraphicsTechnologies({ reactiveAudio: true }).audioReactive).toBe(false);

      window.AudioContext = class {
        createAnalyser() {
          return {};
        }
      };

      expect(supportsAudioAnalysis()).toBe(true);
      const plan = selectGraphicsTechnologies({ particles: true, reactiveAudio: true });
      expect(plan.audioReactive).toBe(true);
      expect(plan.reasons).toContain('sound-reactivity-enabled');

      const calm = selectGraphicsTechnologies(
        { particles: true, reactiveAudio: true },
        undefined,
        { reducedMotion: true },
      );
      expect(calm.audioReactive).toBe(false);
      expect(calm.reasons).toContain('sound-reactivity-reduced-motion');
    } finally {
      if (original === undefined) delete window.AudioContext;
      else window.AudioContext = original;
    }
  });

  it('leaves experiences that did not ask for it completely neutral', () => {
    const plan = selectGraphicsTechnologies({ particles: true });
    expect(plan.audioReactive).toBe(false);
    expect(plan.reasons).not.toContain('sound-reactivity-enabled');
  });
});
