import { describe, expect, it } from 'vitest';
import { stopCrystalBallEnergy } from '../app/lib/audio.js';

describe('audio helper exports', () => {
  it('exports stopCrystalBallEnergy', () => {
    expect(typeof stopCrystalBallEnergy).toBe('function');
  });

  it('is a safe no-op before the energy sound has loaded', () => {
    expect(stopCrystalBallEnergy()).toBeUndefined();
  });
});
