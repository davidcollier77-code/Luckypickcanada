import { describe, expect, it } from 'vitest';
import { readFileSync, statSync } from 'node:fs';

const assets = [
  'crystal-ball-energy.wav',
  'crystal-ball-reveal.wav',
  'crystal-ball-leaf.wav',
];

describe('newly sourced Crystal Ball WAV assets', () => {
  it.each(assets)('%s is a real, non-empty WAV file', (name) => {
    const path = new URL('../public/sounds/' + name, import.meta.url);
    const bytes = readFileSync(path);
    expect(bytes.subarray(0, 4).toString('ascii')).toBe('RIFF');
    expect(bytes.subarray(8, 12).toString('ascii')).toBe('WAVE');
    expect(bytes.length).toBeGreaterThan(1024);
    expect(statSync(path).size).toBeLessThan(2 * 1024 * 1024);
    expect(bytes.subarray(44).some((byte) => byte !== 0)).toBe(true);
  });

  it('records each creator, source listing, and the Pixabay Content License', () => {
    const source = readFileSync(
      new URL('../public/sounds/crystal-ball-audio-sources.md', import.meta.url),
      'utf8',
    );
    expect(source).toContain('Coghezzi');
    expect(source).toContain('RescopicSound');
    expect(source).toContain('ShidenBeatsMusic');
    expect(source).toContain('https://pixabay.com/service/license-summary/');
    expect(source).toContain('crystal-ball-energy.wav');
    expect(source).toContain('crystal-ball-reveal.wav');
    expect(source).toContain('crystal-ball-leaf.wav');
  });
});
