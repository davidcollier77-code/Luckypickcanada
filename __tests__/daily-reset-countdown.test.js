import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  formatDailyResetRemaining,
  getDailyResetState,
  getLocalDateKey,
  getNextLocalMidnight,
} from '../app/lib/daily-reset.js';

const read = (path) => readFileSync(join(process.cwd(), path), 'utf8');

describe('shared daily-reset clock', () => {
  it('uses the visitor local date and the next local midnight', () => {
    const date = new Date(2026, 10, 9, 23, 30, 0, 0);

    expect(getLocalDateKey(date)).toBe('2026-11-09');
    expect(getNextLocalMidnight(date).getTime()).toBe(
      new Date(2026, 10, 10, 0, 0, 0, 0).getTime(),
    );
    expect(getDailyResetState(date)).toMatchObject({
      dateKey: '2026-11-09',
      remainingMs: 30 * 60 * 1000,
    });
  });

  it('formats a stable HH:MM:SS value, including long DST days', () => {
    expect(formatDailyResetRemaining(0)).toBe('00:00:00');
    expect(formatDailyResetRemaining(30 * 60 * 1000)).toBe('00:30:00');
    expect(formatDailyResetRemaining(25 * 60 * 60 * 1000)).toBe('25:00:00');
  });

  it('handles 23-hour and 25-hour local days at daylight-saving boundaries', () => {
    const originalTimeZone = process.env.TZ;
    try {
      process.env.TZ = 'America/Toronto';

      // DST begins on 2026-03-08 and ends on 2026-11-01 in Toronto.
      const springForward = new Date(2026, 2, 8, 0, 0, 0, 0);
      expect(getDailyResetState(springForward).remainingMs).toBe(23 * 60 * 60 * 1000);

      const fallBack = new Date(2026, 10, 1, 0, 0, 0, 0);
      expect(getDailyResetState(fallBack).remainingMs).toBe(25 * 60 * 60 * 1000);

      const ordinaryDay = new Date(2026, 6, 15, 0, 0, 0, 0);
      expect(getDailyResetState(ordinaryDay).remainingMs).toBe(24 * 60 * 60 * 1000);
    } finally {
      if (originalTimeZone === undefined) {
        delete process.env.TZ;
      } else {
        process.env.TZ = originalTimeZone;
      }
    }
  });

  it('is the single countdown engine used by Card Reveal, Crystal Ball and Lucky Meter', () => {
    const cardReveal = read('components/midnight-countdown.js');
    const crystalBall = read('app/components/CrystalBall/CrystalBall.tsx');
    const luckyMeter = read('components/DailyResonance.tsx');

    for (const source of [cardReveal, crystalBall, luckyMeter]) {
      expect(source).toContain('useDailyResetCountdown');
    }

    // No display owns a second midnight calculation or its own interval.
    expect(cardReveal).not.toContain('setHours(24');
    expect(crystalBall).not.toContain('setHours(24');
    expect(luckyMeter).not.toContain('setHours(24');
    expect(crystalBall).not.toContain('setInterval');
    expect(luckyMeter).not.toContain('setInterval');
  });
});
