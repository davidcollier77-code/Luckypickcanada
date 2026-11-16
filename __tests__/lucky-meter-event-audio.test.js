import { describe, expect, it } from 'vitest';
import {
  EVENT_CUE_LAYERS,
  EVENT_CUE_NAMES,
  SUSTAINED_EVENT_SOUNDS,
  THUNDER_DELAY_MS,
  getCueLayers,
  getCueLoudness,
  getThunderCue,
  getThunderDelayMs,
  isEventCue,
} from '../app/lib/lucky-meter/event-audio';

const neutral = () => 0.5;

describe('event audio cue map', () => {
  it('maps every engine cue to at least one real sound layer', () => {
    expect(EVENT_CUE_NAMES.length).toBeGreaterThan(0);
    for (const cue of EVENT_CUE_NAMES) {
      const layers = getCueLayers(cue, neutral);
      expect(layers.length).toBeGreaterThan(0);
      for (const layer of layers) {
        expect(typeof layer.sound).toBe('string');
        expect(layer.sound.length).toBeGreaterThan(0);
        expect(layer.rate).toBeGreaterThan(0);
        expect(layer.volume).toBeGreaterThan(0);
        // No layer may be authored above unity: stacked cues must not clip.
        expect(layer.volume).toBeLessThanOrEqual(1);
      }
    }
  });

  it('rejects unknown cues instead of inventing a sound', () => {
    expect(isEventCue('meteor-enter')).toBe(true);
    expect(isEventCue('meteor')).toBe(false);
    expect(isEventCue('thunder-close')).toBe(false);
    expect(isEventCue(undefined)).toBe(false);
    expect(getCueLayers('not-a-cue', neutral)).toEqual([]);
    expect(getCueLayers(undefined, neutral)).toEqual([]);
  });

  it('keeps the established lightning and firework cues on their own recordings', () => {
    expect(getCueLayers('lightning', neutral)).toEqual([
      { sound: 'impactLightning', rate: 1, volume: 0.55 },
    ]);
    expect(getCueLayers('firework-burst', neutral)).toEqual([
      { sound: 'fireworkBurst', rate: 1.08, volume: 0.55 },
    ]);
    expect(getCueLayers('firework-burst-silver', neutral)).toEqual([
      { sound: 'fireworkBurstAlt', rate: 1.14, volume: 0.44 },
    ]);
  });

  it('gives a regular burst one crisp pop and the finale a deeper layered boom', () => {
    const pop = getCueLayers('firework-burst', neutral);
    const finale = getCueLayers('finale-boom', neutral);

    expect(pop).toHaveLength(1);
    expect(finale.length).toBeGreaterThan(pop.length);
    // The finale carries a genuinely lower-register layer than the pop.
    expect(Math.min(...finale.map((layer) => layer.rate))).toBeLessThan(pop[0].rate);
    // ...and is audibly louder in total, without any layer exceeding unity.
    expect(getCueLoudness('finale-boom')).toBeGreaterThan(getCueLoudness('firework-burst'));
    expect(getCueLoudness('finale-boom')).toBeGreaterThan(getCueLoudness('firework-finale'));
    expect(Math.max(...finale.map((layer) => layer.volume))).toBeLessThanOrEqual(1);
  });

  it('keeps the finale whistle lower and louder than an opening launch', () => {
    const opening = getCueLayers('firework-launch', neutral)[0];
    const finale = getCueLayers('firework-finale', neutral)[0];
    expect(finale.rate).toBeLessThan(opening.rate);
    expect(finale.volume).toBeGreaterThan(opening.volume);
  });

  it('separates meteor entry from meteor burnout', () => {
    expect(getCueLayers('meteor-enter', neutral)[0].sound).toBe('impactMeteor');
    expect(getCueLayers('meteor-impact', neutral)[0].sound).toBe('impactLightning');
    expect(getCueLayers('meteor-finale', neutral)[0].volume).toBeGreaterThan(
      getCueLayers('meteor-enter', neutral)[0].volume,
    );
  });

  it('applies only the opt-in jitter and is neutral at random() = 0.5', () => {
    expect(getCueLayers('firework-burst', () => 0)[0].rate).toBeCloseTo(1.08 * 0.96, 6);
    expect(getCueLayers('firework-burst', () => 1)[0].rate).toBeCloseTo(1.08 * 1.04, 6);
    // Cues without jitter ignore the random source entirely.
    expect(getCueLayers('finale-boom', () => 0)).toEqual(
      getCueLayers('finale-boom', () => 1),
    );
  });

  it('lists the sounds that must be faded when the stage ends', () => {
    for (const sound of ['thunderRumble', 'willowCrackle', 'finaleBoom']) {
      expect(SUSTAINED_EVENT_SOUNDS).toContain(sound);
    }
  });
});

describe('thunder timing', () => {
  it('delays distant thunder further than close thunder', () => {
    const far = getThunderDelayMs(0.42);
    const near = getThunderDelayMs(1.55);
    const finale = getThunderDelayMs(1.9, true);

    expect(far).toBeGreaterThan(near);
    expect(near).toBeGreaterThan(0);
    expect(far).toBeLessThanOrEqual(THUNDER_DELAY_MS.far);
    expect(near).toBeGreaterThanOrEqual(THUNDER_DELAY_MS.near);
    expect(finale).toBeLessThan(far);
    // Never instant: the flash must be seen before the sound arrives.
    expect(Math.min(far, near, finale)).toBeGreaterThan(0);
  });

  it('is deterministic and safe for missing or invalid depth', () => {
    expect(getThunderDelayMs(1.2)).toBe(getThunderDelayMs(1.2));
    expect(Number.isFinite(getThunderDelayMs(undefined))).toBe(true);
    expect(Number.isFinite(getThunderDelayMs(-10))).toBe(true);
    expect(getThunderDelayMs(-10)).toBe(THUNDER_DELAY_MS.far);
  });

  it('routes near, far and finale strikes to their own rumble cues', () => {
    expect(getThunderCue(0.45)).toBe('thunder-far');
    expect(getThunderCue(1.4)).toBe('thunder-near');
    expect(getThunderCue(0.45, true)).toBe('thunder-finale');
    expect(getThunderCue(1.9, true)).toBe('thunder-finale');
  });

  it('never stacks thunder on top of a lightning cue', () => {
    expect(EVENT_CUE_LAYERS.lightning.map((layer) => layer.sound)).toEqual([
      'impactLightning',
    ]);
  });
});
