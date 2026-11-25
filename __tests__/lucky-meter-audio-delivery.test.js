import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * Activation-gated Lucky Meter audio delivery.
 *
 * Route-time preparation must fetch only the opening cues; the celebration set
 * stays deferred until the visitor presses Start, then the same shared Howl set
 * loads every remaining file. No cue, volume, source, mix or API is changed.
 */

const howls = vi.hoisted(() => []);

vi.mock('howler', () => ({
  Howl: vi.fn().mockImplementation(function MockHowl(options) {
    this.options = options;
    this.load = vi.fn();
    this.unload = vi.fn();
    this.play = vi.fn(() => 1);
    howls.push(this);
  }),
}));

const CORE_KEYS = ['buildup', 'segmentOpen', 'colourPour', 'dockChime'];
const EVENT_KEYS = [
  'impactMeteor',
  'impactLightning',
  'fireworkBurst',
  'fireworkBurstAlt',
  'willowCrackle',
  'fireworkLaunch',
  'finaleBoom',
  'thunderRumble',
];

async function loadAudioModule() {
  vi.resetModules();
  howls.length = 0;
  return import('../app/lib/lucky-meter/audio');
}

describe('Lucky Meter audio delivery', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetModules();
  });

  it('keeps the twelve existing cues and their exact sources', async () => {
    const audio = await loadAudioModule();
    expect(audio.LUCKY_METER_SOUND_KEYS).toEqual([...CORE_KEYS, ...EVENT_KEYS]);
    expect(audio.LUCKY_METER_CORE_SOUND_KEYS).toEqual(CORE_KEYS);
    expect(Object.isFrozen(audio.LUCKY_METER_CORE_SOUND_KEYS)).toBe(true);
    expect(audio.LUCKY_METER_AUDIO_FILES).toEqual([
      '/freesound_community-starship-rail-gun-charge-35904.mp3',
      '/sounds/crystal-ball-leaf.mp3',
      '/sounds/crystal-ball-leaf.wav',
      '/sounds/mixkit-magic-sparkles.mp3',
      '/sounds/chime-sound.mp3',
      '/dragon-studio-whoosh-cinematic-376875.mp3',
      '/sounds/mixkit-cinematic-impact.mp3',
      '/freesound_community-fireworks-1-94483.mp3',
      '/sounds/mixkit-magical-impact.mp3',
      '/sounds/mixkit-firework-crackle.mp3',
      '/sounds/mixkit-firework-whistle.mp3',
      '/sounds/lucky-meter-finale-boom.wav',
      '/sounds/lucky-meter-thunder-rumble.wav',
    ]);
  });

  it('creates the opening four eager and the celebration eight deferred', async () => {
    const audio = await loadAudioModule();
    const set = await audio.prepareLuckyMeterAudio();
    expect(set).not.toBeNull();
    expect(howls).toHaveLength(12);

    const byKey = Object.fromEntries(
      audio.LUCKY_METER_SOUND_KEYS.map((key, index) => [key, howls[index]])
    );
    for (const key of CORE_KEYS) {
      expect(byKey[key].options.preload, key).toBe(true);
      expect(byKey[key].load, key).not.toHaveBeenCalled();
    }
    for (const key of EVENT_KEYS) {
      expect(byKey[key].options.preload, key).toBe(false);
      expect(byKey[key].load, key).not.toHaveBeenCalled();
    }

    // The authored mix is untouched.
    expect(byKey.buildup.options.volume).toBe(0.8);
    expect(byKey.thunderRumble.options.volume).toBe(0.24);
    expect(byKey.finaleBoom.options.src).toEqual(['/sounds/lucky-meter-finale-boom.wav']);
  });

  it('loads every deferred cue only when activation asks for them', async () => {
    const audio = await loadAudioModule();
    await audio.prepareLuckyMeterAudio();

    const byKey = Object.fromEntries(
      audio.LUCKY_METER_SOUND_KEYS.map((key, index) => [key, howls[index]])
    );
    expect(howls.every((howl) => howl.load.mock.calls.length === 0)).toBe(true);

    // The Start press uses the same shared set and the same API.
    const set = await audio.prepareLuckyMeterAudio({ loadEventCues: true });
    expect(set).not.toBeNull();
    expect(howls).toHaveLength(12);
    for (const key of CORE_KEYS) {
      expect(byKey[key].load, key).not.toHaveBeenCalled();
    }
    for (const key of EVENT_KEYS) {
      expect(byKey[key].load, `${key} should be requested at activation`).toHaveBeenCalledTimes(1);
    }
  });

  it('does not reload the deferred cues on a second activation', async () => {
    const audio = await loadAudioModule();
    await audio.prepareLuckyMeterAudio();
    await audio.prepareLuckyMeterAudio({ loadEventCues: true });

    const byKey = Object.fromEntries(
      audio.LUCKY_METER_SOUND_KEYS.map((key, index) => [key, howls[index]])
    );
    await audio.prepareLuckyMeterAudio({ loadEventCues: true });

    expect(howls).toHaveLength(12);
    for (const key of EVENT_KEYS) {
      expect(byKey[key].load, `${key} should load once`).toHaveBeenCalledTimes(1);
    }
  });

  it('loads the deferred cues again after the shared set is released', async () => {
    const audio = await loadAudioModule();
    await audio.prepareLuckyMeterAudio();
    await audio.prepareLuckyMeterAudio({ loadEventCues: true });
    audio.releaseLuckyMeterAudio();

    const before = howls.length;
    await audio.prepareLuckyMeterAudio({ loadEventCues: true });
    const recreated = howls.slice(before);

    expect(recreated).toHaveLength(12);
    const deferred = recreated.filter((howl) => howl.options.preload === false);
    expect(deferred).toHaveLength(EVENT_KEYS.length);
    expect(deferred.every((howl) => howl.load.mock.calls.length === 1)).toBe(true);
  });

  it('loads the deferred cues even when activation races route-time preparation', async () => {
    const audio = await loadAudioModule();
    // Two calls before the dynamic import settles exercise the shared promise.
    const first = audio.prepareLuckyMeterAudio();
    const activation = audio.prepareLuckyMeterAudio({ loadEventCues: true });
    const [routeSet, activationSet] = await Promise.all([first, activation]);
    expect(routeSet).toBe(activationSet);
    const deferred = howls.filter((howl) => howl.options.preload === false);
    expect(deferred).toHaveLength(EVENT_KEYS.length);
    expect(deferred.every((howl) => howl.load.mock.calls.length === 1)).toBe(true);
  });
});
