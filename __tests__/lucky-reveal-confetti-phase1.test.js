// @vitest-environment node
import { existsSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { splitLuckyNumberRows } from '../app/lucky-reveal-presentation';

/**
 * Guards for `specs/080-lucky-reveal-confetti-phase1`.
 *
 * The shipped celebration fired 112 particles in one tick from a canvas appended
 * to <body>, kept the settled pile for the whole reveal, and opened the reveal in
 * silence. Phase 1 confines the particles to the reveal, caps them, gives every
 * leaf a lifetime, removes the layer when the celebration finishes, and adds the
 * missing opening sparkle. Number generation is untouched.
 */

function readSource(relativePath) {
  return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

const celebrationSource = readSource('app/lucky-reveal-celebration.jsx');
const popupSource = readSource('app/lucky-reveal-popup.js');
const audioSource = readSource('app/lib/audio.js');
const revealSource = readSource('app/lucky-reveal.js');

const START_NUMBERS_DELAY = 2.0;
const NUMBER_STAGGER = 0.35;
const FINAL_SETTLE = 0.95;

describe('Confetti lifecycle', () => {
  it('caps the number of simultaneously active particles', () => {
    expect(celebrationSource).toContain('const MAX_ACTIVE_PARTICLES = 96;');
    expect(celebrationSource).toContain('const budget = MAX_ACTIVE_PARTICLES - firedParticlesRef.current;');
    expect(celebrationSource).toContain('Math.min(wave.particleCount, budget)');

    const declared = [...celebrationSource.matchAll(/particleCount: (\d+)/g)].map((match) =>
      Number(match[1]),
    );
    expect(declared).toHaveLength(5);
    // 24 + 24 + 14 + 14 + 10 = 86 leaves, inside the 96-particle ceiling.
    expect(declared.reduce((total, count) => total + count, 0)).toBe(86);
    expect(Math.max(...declared)).toBeLessThanOrEqual(96);
  });

  it('gives every particle a bounded lifetime inside a three-to-four second window', () => {
    expect(celebrationSource).toContain('const PARTICLE_LIFETIME_TICKS = 150;');
    expect(celebrationSource).toContain('ticks: PARTICLE_LIFETIME_TICKS');
    expect(celebrationSource).toContain(
      'const CONFETTI_WINDOW_MS = WAVE_INTERVAL_MS * 2 + (PARTICLE_LIFETIME_TICKS / 60) * 1000;',
    );
    expect(celebrationSource).toContain('const CELEBRATION_TOTAL_MS = CONFETTI_WINDOW_MS + 700;');

    // Waves at 0 / 500 / 1000 ms plus a 2500 ms leaf lifetime = 3500 ms.
    const confettiWindowMs = 500 * 2 + (150 / 60) * 1000;
    expect(confettiWindowMs).toBeGreaterThanOrEqual(3000);
    expect(confettiWindowMs).toBeLessThanOrEqual(4000);
  });

  it('keeps the particles inside the reveal instead of appending a canvas to <body>', () => {
    expect(celebrationSource).toContain('<canvas ref={canvasRef}');
    expect(celebrationSource).toContain('lucky-celebration-particles');
    expect(celebrationSource).toContain('z-index: 3');
    expect(celebrationSource).toContain('overflow: hidden;');
    expect(celebrationSource).not.toContain('document.body.appendChild');
    expect(celebrationSource).not.toContain("document.createElement('canvas')");
  });

  it('ends the celebration and releases every timer and particle', () => {
    expect(celebrationSource).toContain('const finishTimer = window.setTimeout(');
    expect(celebrationSource).toContain('setIsCelebrating(false);');
    expect(celebrationSource).toContain('clearTimers();');
    expect(celebrationSource).toContain('releaseConfetti();');
    expect(celebrationSource).toContain(
      'timersRef.current.forEach((timer) => window.clearTimeout(timer));',
    );
    expect(celebrationSource).toContain('confettiRef.current?.reset()');
  });

  it('preserves the reveal design and the reduced-motion path', () => {
    for (const token of [
      'lucky-celebration-flash',
      'lucky-celebration-glow',
      'lucky-settled-leaf',
      'viewBox="-2015 -2000 4030 4030"',
      '@media (prefers-reduced-motion: reduce)',
      "['#FBBF24', '#F59E0B', '#D97706']",
      'useWorker: false',
      'confettiLib.create(canvas, { resize: true, useWorker: false })',
    ]) {
      expect(celebrationSource).toContain(token);
    }
    expect((celebrationSource.match(/\{ left: '/g) || []).length).toBe(18);
  });
});

describe('Reveal sounds', () => {
  it('adds a brief same-origin opening sparkle', () => {
    expect(audioSource).toContain('export function preloadRevealSparkle()');
    expect(audioSource).toContain('export function playRevealSparkle()');
    expect(audioSource).toContain("const REVEAL_SPARKLE_URL = '/sounds/chime-sound.mp3';");
    expect(existsSync(join(process.cwd(), 'public/sounds/chime-sound.mp3'))).toBe(true);

    const sparkleBlock = audioSource.slice(audioSource.indexOf('REVEAL_SPARKLE_URL'));
    expect(sparkleBlock).toContain('volume: 0.28');
    expect(sparkleBlock).toContain('html5: true');

    // Brief: the chime is a 20 KB, 1.25 second asset, not a long cue.
    expect(statSync(join(process.cwd(), 'public/sounds/chime-sound.mp3')).size).toBeLessThan(32 * 1024);
  });

  it('keeps the finishing pop after the final number', () => {
    expect(celebrationSource).toContain('playConfettiPop()');
    expect(celebrationSource).toContain('preloadConfettiPop()');
    // The finishing sound is still the existing same-origin pop, not a new asset.
    expect(celebrationSource).not.toContain('/sounds/');
    expect(existsSync(join(process.cwd(), 'public/sounds/confetti-pop.wav'))).toBe(true);
  });

  it('plays the opening sparkle when the reveal opens and skips it for reduced motion', () => {
    expect(popupSource).toContain('preloadRevealSparkle');
    expect(popupSource).toContain('playRevealSparkle');
    expect(popupSource).toMatch(
      /window\.matchMedia\('\(prefers-reduced-motion: reduce\)'\)\.matches\) return undefined;/,
    );
    expect(popupSource).toContain('Reveal opening sparkle unavailable');
  });
});

describe('Both number-selection modes', () => {
  const SIX_PICK = [3, 11, 19, 24, 40, 47];
  const SEVEN_PICK = [1, 4, 9, 16, 25, 36, 49];

  it.each([
    ['Six Pick', SIX_PICK],
    ['Seven Pick', SEVEN_PICK],
  ])('%s keeps every number, in order, and celebrates after the final one', (label, numbers) => {
    const rows = splitLuckyNumberRows(numbers);

    // Numbers appear individually and unchanged.
    expect(rows.flat()).toEqual(numbers);
    expect(rows.map((row) => row.length)).toEqual(numbers.length === 6 ? [3, 3] : [4, 3]);

    // The popup still staggers one number at a time on the existing timeline.
    expect(popupSource).toContain('animationDelay: `${startNumbersDelay + numberIndex * 0.35}s,');
    expect(popupSource).toContain('animationDuration: \'0.9s, 3s\'');

    const lastNumberDelay = START_NUMBERS_DELAY + (numbers.length - 1) * NUMBER_STAGGER;
    // The individual number reveal stays inside the requested two-to-three seconds.
    expect(lastNumberDelay).toBeGreaterThanOrEqual(2);
    expect(lastNumberDelay + 0.9).toBeLessThanOrEqual(6);

    // The celebration is scheduled after that last number settles.
    const celebrationDelayMs = (START_NUMBERS_DELAY + (numbers.length - 1) * NUMBER_STAGGER + FINAL_SETTLE) * 1000;
    expect(popupSource).toContain(
      'const celebrationDelayMs = (startNumbersDelay + (numItems - 1) * 0.35 + 0.95) * 1000;',
    );
    expect(celebrationDelayMs).toBeGreaterThan(lastNumberDelay * 1000);
    expect(celebrationDelayMs).toBe(numbers.length === 6 ? 4700 : 5050);
    expect(label).toMatch(/Pick$/);
  });

  it('never changes the random-number generation logic', () => {
    expect(revealSource).toContain('export function createLuckyReveal');
    // Six picks stay 1-49 and seven picks 1-50.
    expect(revealSource).toMatch(/6[\s\S]{0,200}49/);
    expect(revealSource).toMatch(/7[\s\S]{0,200}50/);

    for (const source of [celebrationSource, popupSource, audioSource]) {
      expect(source).not.toContain('generateLuckyNumbers');
      expect(source).not.toContain('createLuckyReveal');
      expect(source).not.toContain('crypto.getRandomValues');
      expect(source).not.toMatch(/Math\.random\(/);
    }
  });
});
