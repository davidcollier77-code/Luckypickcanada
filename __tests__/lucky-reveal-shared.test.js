// @vitest-environment node
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  LUCKY_COLORS,
  LUCKY_DAYS,
  buildLuckyReveal,
  createLuckyReveal,
  generateLuckyNumbers,
  hasValidLuckyNumbers,
  normalizeLuckyPickGame,
} from '../app/lucky-reveal';
import { createGiftReveal } from '../app/gift-email';

function readSource(relativePath) {
  return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('Shared Lucky Reveal generation', () => {
  it('creates a complete 6 Pick reveal', () => {
    const reveal = createLuckyReveal('6');

    expect(reveal.game.name).toBe('6 Pick');
    expect(reveal.game.numbers).toHaveLength(6);
    expect(hasValidLuckyNumbers(reveal.game.numbers, '6')).toBe(true);
    expect(LUCKY_COLORS).toContain(reveal.luckyColor);
    expect(LUCKY_DAYS).toContain(reveal.luckyDay);
  });

  it('creates a complete 7 Pick reveal', () => {
    const reveal = createLuckyReveal('7');

    expect(reveal.game.name).toBe('7 Pick');
    expect(reveal.game.numbers).toHaveLength(7);
    expect(reveal.game.numbers.every((number) => number >= 1 && number <= 50)).toBe(true);
    expect(hasValidLuckyNumbers(reveal.game.numbers, '7')).toBe(true);
  });

  it('generates unique, sorted, in-range numbers', () => {
    const numbers = generateLuckyNumbers(6, 49);

    expect(numbers).toHaveLength(6);
    expect([...numbers].sort((a, b) => a - b)).toEqual(numbers);
    expect(new Set(numbers).size).toBe(6);
    expect(numbers.every((number) => number >= 1 && number <= 49)).toBe(true);
  });

  it('normalizes both stored and displayed game values', () => {
    expect(normalizeLuckyPickGame('7')).toBe('7');
    expect(normalizeLuckyPickGame('7 Pick')).toBe('7');
    expect(normalizeLuckyPickGame('6')).toBe('6');
    expect(normalizeLuckyPickGame('6 Pick')).toBe('6');
    expect(normalizeLuckyPickGame(undefined)).toBe('6');
  });
});

describe('Shared reveal presentation mapping', () => {
  it('maps a verified reveal into the popup shape', () => {
    expect(
      buildLuckyReveal({
        game: '6',
        numbers: [3, 11, 19, 24, 40, 47],
        luckyColor: 'Star Gold',
        luckyDay: 'Friday',
      }),
    ).toEqual({
      game: { name: '6 Pick', numbers: [3, 11, 19, 24, 40, 47] },
      luckyColor: 'Star Gold',
      luckyDay: 'Friday',
    });
  });

  it('accepts the stored 7 Pick label and numeric strings', () => {
    expect(
      buildLuckyReveal({
        game: '7 Pick',
        numbers: ['1', '4', '9', '16', '25', '36', '49'],
        luckyColor: 'Lucky Red',
        luckyDay: 'Monday',
      }),
    ).toMatchObject({
      game: { name: '7 Pick', numbers: [1, 4, 9, 16, 25, 36, 49] },
    });
  });

  it('refuses to present numbers that cannot be trusted', () => {
    expect(buildLuckyReveal({ game: '6', numbers: [1, 2, 3] })).toBeNull();
    expect(buildLuckyReveal({ game: '6', numbers: [1, 1, 2, 3, 4, 5] })).toBeNull();
    expect(buildLuckyReveal({ game: '6', numbers: [1, 2, 3, 4, 5, 99] })).toBeNull();
    expect(buildLuckyReveal({})).toBeNull();
  });

  it('preserves a stored colour and day instead of inventing one', () => {
    const reveal = buildLuckyReveal({
      game: '6',
      numbers: [1, 2, 3, 4, 5, 6],
      luckyColor: 'Fortune Blue',
      luckyDay: 'Wednesday',
    });

    expect(reveal.luckyColor).toBe('Fortune Blue');
    expect(reveal.luckyDay).toBe('Wednesday');
  });
});

describe('Gift Edition reuses the shared reveal', () => {
  it('produces the same rules and shape as the website reveal', () => {
    const gift = createGiftReveal({ luckyPickGame: '7' });

    expect(gift.gameName).toBe('7 Pick');
    expect(hasValidLuckyNumbers(gift.numbers, '7')).toBe(true);
    expect(LUCKY_COLORS).toContain(gift.luckyColor);
    expect(LUCKY_DAYS).toContain(gift.luckyDay);
    expect(
      buildLuckyReveal({
        game: gift.gameName,
        numbers: gift.numbers,
        luckyColor: gift.luckyColor,
        luckyDay: gift.luckyDay,
      }),
    ).toEqual({
      game: { name: '7 Pick', numbers: gift.numbers },
      luckyColor: gift.luckyColor,
      luckyDay: gift.luckyDay,
    });
  });

  it('keeps only one generator and one colour/day vocabulary', () => {
    const emailSource = readSource('app/gift-email.js');

    expect(emailSource).toContain('from "./lucky-reveal"');
    expect(emailSource).not.toContain('crypto.getRandomValues');
    expect(emailSource).not.toMatch(/const luckyColors = \[/);
    expect(emailSource).not.toMatch(/const luckyDays = \[/);
    expect(emailSource).not.toMatch(/function pickOne\(/);
  });

  it('presents both purchase options through the shared mapper', () => {
    const homepageSource = readSource('app/homepage/HomePage.js');
    const revealPageSource = readSource('app/reveal/[revealId]/page.tsx');

    expect(homepageSource).toContain('buildLuckyReveal');
    expect(revealPageSource).toContain('buildLuckyReveal');
    expect(homepageSource).not.toMatch(/luckyColors\s*=\s*\[/);
    expect(revealPageSource).not.toMatch(/luckyColors\s*=\s*\[/);
  });
});
