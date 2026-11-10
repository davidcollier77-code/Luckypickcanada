import { describe, expect, it } from 'vitest';
import { readFileSync, statSync } from 'node:fs';
import { resolve } from 'node:path';

const assets = [
  'crystal-ball-energy.wav',
  'crystal-ball-reveal.wav',
  'crystal-ball-leaf.wav',
];

const compressed = [
  'crystal-ball-energy.mp3',
  'crystal-ball-reveal.mp3',
  'crystal-ball-leaf.mp3',
];

describe('Crystal Ball audio assets', () => {
  it.each(assets)('%s is a real, non-empty WAV file', (name) => {
    const path = new URL('../public/sounds/' + name, import.meta.url);
    const bytes = readFileSync(path);
    expect(bytes.subarray(0, 4).toString('ascii')).toBe('RIFF');
    expect(bytes.subarray(8, 12).toString('ascii')).toBe('WAVE');
    expect(bytes.length).toBeGreaterThan(1024);
    expect(statSync(path).size).toBeLessThan(2 * 1024 * 1024);
    expect(bytes.subarray(44).some((byte) => byte !== 0)).toBe(true);
  });

  it.each(compressed)('%s is a real, non-empty MP3 file', (name) => {
    const path = new URL('../public/sounds/' + name, import.meta.url);
    const bytes = readFileSync(path);
    // Accept either an ID3v2 tag header ('ID3') or a valid MPEG frame-sync byte
    // sequence (0xFF 0xE0–0xFF 0xFF). A re-encode that strips the ID3 tag
    // produces a bare MPEG stream that is still a valid MP3.
    const hasId3Header = bytes[0] === 0x49 && bytes[1] === 0x44 && bytes[2] === 0x33;
    const hasMpegSync = bytes[0] === 0xFF && (bytes[1] & 0xE0) === 0xE0;
    expect(hasId3Header || hasMpegSync).toBe(true);
    expect(bytes.length).toBeGreaterThan(4096);
    expect(bytes.some((byte) => byte !== 0)).toBe(true);
  });

  it('ships compressed audio that is materially smaller than the WAV originals', () => {
    for (const wav of assets) {
      const mp3 = wav.replace(/\.wav$/, '.mp3');
      const wavBytes = statSync(new URL('../public/sounds/' + wav, import.meta.url)).size;
      const mp3Bytes = statSync(new URL('../public/sounds/' + mp3, import.meta.url)).size;
      expect(mp3Bytes).toBeLessThan(wavBytes * 0.25);
    }
  });

  it('prefers the compressed source and keeps the WAV as fallback', () => {
    const source = readFileSync(resolve(process.cwd(), 'app/lib/audio.js'), 'utf8');
    for (const wav of assets) {
      const mp3 = wav.replace(/\.wav$/, '.mp3');
      expect(source).toContain(`['/sounds/${mp3}', '/sounds/${wav}']`);
    }
  });

  it('records each creator, source listing, and the Pixabay Content License', () => {
    const sourceFileName = ['crystal-ball-audio-sources', 'md'].join('.');
    const source = readFileSync(
      new URL('../public/sounds/' + sourceFileName, import.meta.url),
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
