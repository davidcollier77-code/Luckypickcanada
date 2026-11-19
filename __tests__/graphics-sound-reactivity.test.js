// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  attachHtml5Analyser,
  collectHtml5MediaElements,
  createAudioReactive,
  getHtml5AnalyserCount,
  isSameOriginMediaElement,
  supportsAudioAnalysis,
  supportsHtml5AudioAnalysis,
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
    // The frame that fires the beat publishes the peak, not a decayed value.
    expect(reactive.getEnvelope().transient).toBeGreaterThan(0.99);
    expect(beats[0]).toBeGreaterThan(0.99);
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

  it('re-arms attachment so a cue played after the retry budget is still measured', async () => {
    vi.useFakeTimers();
    try {
      let graph = null;
      const attach = vi.fn(() => Promise.resolve(graph));
      const reactive = createAudioReactive({ attach, reducedMotion: false });

      // A surface can mount long before the visitor's first gesture creates the
      // audio graph; spend the whole retry budget first.
      for (let guard = 0; guard < 200 && attach.mock.calls.length < 40; guard += 1) {
        reactive.update(1 / 60);
        for (let tick = 0; tick < 6; tick += 1) await Promise.resolve();
        vi.setSystemTime(Date.now() + 800);
      }
      for (let tick = 0; tick < 6; tick += 1) await Promise.resolve();
      expect(attach.mock.calls.length).toBeGreaterThanOrEqual(40);
      expect(reactive.getEnvelope().available).toBe(false);
      expect(reactive.getEnvelope().reason).toBe('audio-unavailable');

      graph = loudAnalyser();
      expect(reactive.refresh()).toBe(false);
      for (let tick = 0; tick < 6; tick += 1) await Promise.resolve();
      expect(reactive.refresh()).toBe(true);

      const envelope = reactive.update(1 / 60);
      expect(envelope.available).toBe(true);
      expect(envelope.level).toBeGreaterThan(0);
    } finally {
      vi.useRealTimers();
    }
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

describe('HTML5 cue capture', () => {
  function fakeMediaContext({ state = 'running', canCapture = true } = {}) {
    const destination = { name: 'destination' };
    const sources = [];
    const context = {
      state,
      destination,
      createMediaElementSource: canCapture
        ? vi.fn((element) => {
            const source = {
              element,
              connect: vi.fn(),
              disconnect: vi.fn(),
            };
            sources.push(source);
            return source;
          })
        : undefined,
    };
    return { context, destination, sources };
  }

  function mediaElement(src = '/sounds/chime-sound.mp3') {
    return { src, currentSrc: src, paused: false };
  }

  it('captures a playing same-origin cue into the shared analyser and keeps it audible', () => {
    const { context, destination, sources } = fakeMediaContext();
    const analyser = loudAnalyser();
    const before = getHtml5AnalyserCount();

    expect(attachHtml5Analyser({ context, analyser, element: mediaElement() })).toBe(true);

    expect(sources).toHaveLength(1);
    // The audible unity path is connected before analysis, so a failed analyser
    // edge can never silence a cue that is already playing.
    expect(sources[0].connect.mock.calls[0][0]).toBe(destination);
    expect(sources[0].connect.mock.calls[1][0]).toBe(analyser);
    expect(getHtml5AnalyserCount()).toBe(before + 1);
  });

  it('refuses capture without support, on a suspended context, or cross-origin', () => {
    const paused = fakeMediaContext({ state: 'suspended' });
    expect(
      attachHtml5Analyser({ context: paused.context, analyser: loudAnalyser(), element: mediaElement() }),
    ).toBe(false);
    expect(paused.context.createMediaElementSource).not.toHaveBeenCalled();

    const unsupported = fakeMediaContext({ canCapture: false });
    expect(
      attachHtml5Analyser({ context: unsupported.context, analyser: loudAnalyser(), element: mediaElement() }),
    ).toBe(false);

    const running = fakeMediaContext();
    const crossOrigin = mediaElement('https://cdn.example.com/cue.mp3');
    expect(isSameOriginMediaElement(crossOrigin)).toBe(false);
    expect(
      attachHtml5Analyser({ context: running.context, analyser: loudAnalyser(), element: crossOrigin }),
    ).toBe(false);
    expect(running.context.createMediaElementSource).not.toHaveBeenCalled();
  });

  it('does not capture the same media element twice', () => {
    const { context, sources } = fakeMediaContext();
    const analyser = loudAnalyser();
    const element = mediaElement();
    const before = getHtml5AnalyserCount();

    expect(attachHtml5Analyser({ context, analyser, element })).toBe(true);
    expect(attachHtml5Analyser({ context, analyser, element })).toBe(true);

    expect(sources).toHaveLength(1);
    expect(getHtml5AnalyserCount()).toBe(before + 1);
  });

  it('finds only playing html5 sounds and tolerates an unknown Howler shape', () => {
    const playing = { _playing: true, _node: { paused: false } };
    const stopped = { _playing: false, _node: { paused: true } };
    const howler = {
      _howls: [
        {
          _html5: true,
          _sounds: [playing, stopped],
        },
        {
          _html5: false,
          // A Web Audio sound is already in masterGain; it must not be captured.
          _sounds: [{ _playing: true, _node: { paused: false } }],
        },
      ],
    };

    expect(collectHtml5MediaElements(howler)).toEqual([playing._node]);
    expect(collectHtml5MediaElements({})).toEqual([]);
    expect(collectHtml5MediaElements(null)).toEqual([]);
  });

  it('reports media-capture support without creating a node', () => {
    expect(supportsHtml5AudioAnalysis(fakeMediaContext().context)).toBe(true);
    expect(supportsHtml5AudioAnalysis(fakeMediaContext({ canCapture: false }).context)).toBe(false);
    expect(supportsHtml5AudioAnalysis(null)).toBe(false);
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
