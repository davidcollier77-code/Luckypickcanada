import { describe, expect, it } from 'vitest';
import { stopCrystalBallEnergy } from '../app/lib/audio.js';

describe('audio helper exports', () => {
  it('exports stopCrystalBallEnergy', () => {
    expect(typeof stopCrystalBallEnergy).toBe('function');
  });
});
