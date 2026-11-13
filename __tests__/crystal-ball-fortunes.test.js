import { describe, expect, it } from 'vitest';
import { getCalendarContext } from '../app/lib/crystal-ball-calendar';
import {
  FALLBACK_ENTRIES,
  FALLBACK_POOLS,
  addTimeGreeting,
  getFallbackFortune,
  getFallbackFortuneEntry,
} from '../app/lib/crystal-ball-fortunes';
import { getTimeOfDayFromLocalTime } from '../app/lib/local-time';

describe('Crystal Ball fallback fortunes', () => {
  it('uses only the respectful pool on Remembrance Day', () => {
    const context = getCalendarContext('2026-11-11');
    const reading = getFallbackFortune(context, () => 0);
    expect(reading).toBe(FALLBACK_POOLS.occasion['remembrance-day'][0]);
    expect(reading).not.toContain('eh?');
    expect(reading).not.toContain('!');
  });

  it('uses only the thoughtful pool on the National Day for Truth and Reconciliation', () => {
    const context = getCalendarContext('2026-09-30');
    const reading = getFallbackFortune(context, () => 0.999999);
    const pool = FALLBACK_POOLS.occasion['truth-reconciliation'];
    expect(pool).toContain(reading);
    expect(reading).not.toContain('eh?');
  });

  it('selects the matching Christmas stage pool', () => {
    expect(getFallbackFortune(getCalendarContext('2026-12-03'), () => 0)).toBe(
      FALLBACK_POOLS.occasion['christmas-early'][0],
    );
    expect(getFallbackFortune(getCalendarContext('2026-12-14'), () => 0)).toBe(
      FALLBACK_POOLS.occasion['christmas-growing'][0],
    );
    expect(getFallbackFortune(getCalendarContext('2026-12-22'), () => 0)).toBe(
      FALLBACK_POOLS.occasion['christmas-eve'][0],
    );
    expect(getFallbackFortune(getCalendarContext('2026-12-25'), () => 0)).toBe(
      FALLBACK_POOLS.occasion['christmas-day'][0],
    );
  });

  it('selects Canada Day build-up and Canada Day pools', () => {
    expect(getFallbackFortune(getCalendarContext('2026-06-24'), () => 0)).toBe(
      FALLBACK_POOLS.occasion['canada-day-build-up'][0],
    );
    expect(getFallbackFortune(getCalendarContext('2026-07-01'), () => 0)).toBe(
      FALLBACK_POOLS.occasion['canada-day'][0],
    );
  });

  it('falls back to the local season on ordinary days', () => {
    expect(getFallbackFortune(getCalendarContext('2027-01-15'), () => 0)).toBe(
      FALLBACK_POOLS.seasonal.winter[0],
    );
    expect(getFallbackFortune(getCalendarContext('2026-07-15'), () => 0)).toBe(
      FALLBACK_POOLS.seasonal.summer[0],
    );
    expect(getFallbackFortune(getCalendarContext('2027-04-15'), () => 0)).toBe(
      FALLBACK_POOLS.seasonal.spring[0],
    );
    expect(getFallbackFortune(getCalendarContext('2026-10-20'), () => 0)).toBe(
      FALLBACK_POOLS.seasonal.autumn[0],
    );
  });

  it('handles a missing context without throwing', () => {
    expect(getFallbackFortune(null, () => 0).length).toBeGreaterThan(20);
    expect(getFallbackFortuneEntry(null, () => 0)).toMatchObject({
      id: expect.any(String),
      text: expect.any(String),
    });
  });

  it('keeps exactly 197 daily readings with stable unique identifiers', () => {
    const allEntries = [
      ...FALLBACK_ENTRIES.general,
      ...Object.values(FALLBACK_ENTRIES.seasonal).flat(),
      ...Object.values(FALLBACK_ENTRIES.occasion).flat(),
    ];

    expect(allEntries).toHaveLength(197);
    expect(new Set(allEntries.map((entry) => entry.id)).size).toBe(197);

    for (const entry of allEntries) {
      expect(entry.id).toMatch(/^[a-z0-9-]{1,80}$/);
      expect(entry.text.trim().length).toBeGreaterThan(20);
    }

    const first = getFallbackFortuneEntry(getCalendarContext('2027-01-15'), () => 0);
    expect(first.id).toBe('seasonal-winter-01');
    expect(first.text).toBe(FALLBACK_POOLS.seasonal.winter[0]);
  });

  it('removes the former follow-up fallback pools', () => {
    expect(Object.keys(FALLBACK_POOLS).sort()).toEqual([
      'general',
      'occasion',
      'seasonal',
    ]);
  });

  it('excludes the supplied fallback ID from the next selection', () => {
    const context = getCalendarContext('2027-01-15');
    const first = getFallbackFortuneEntry(context, () => 0);
    const next = getFallbackFortuneEntry(context, () => 0, {
      excludeId: first.id,
    });

    expect(next.id).toBe('seasonal-winter-02');
    expect(next.text).not.toBe(first.text);
  });

  it('keeps seasonal and occasion relevance when excluding a reading', () => {
    const winter = getCalendarContext('2027-01-15');
    const excludedWinter = getFallbackFortuneEntry(winter, () => 0);
    const nextWinter = getFallbackFortuneEntry(winter, () => 0, {
      excludeId: excludedWinter.id,
    });
    expect(nextWinter.id).toBe('seasonal-winter-02');
    expect(FALLBACK_POOLS.seasonal.winter).toContain(nextWinter.text);

    const canadaDay = getCalendarContext('2026-07-01');
    const excludedCanadaDay = getFallbackFortuneEntry(canadaDay, () => 0);
    const nextCanadaDay = getFallbackFortuneEntry(canadaDay, () => 0, {
      excludeId: excludedCanadaDay.id,
    });
    expect(FALLBACK_POOLS.occasion['canada-day']).toContain(nextCanadaDay.text);

    const remembrance = getCalendarContext('2026-11-11');
    const excludedRemembrance = getFallbackFortuneEntry(remembrance, () => 0);
    const nextRemembrance = getFallbackFortuneEntry(remembrance, () => 0.999999, {
      excludeId: excludedRemembrance.id,
    });
    expect(FALLBACK_POOLS.occasion['remembrance-day']).toContain(
      nextRemembrance.text,
    );
    expect(nextRemembrance.text).not.toContain('eh?');
    expect(nextRemembrance.text).not.toContain('!');
  });

  it('ignores an exclusion that is not in the active weighted pool', () => {
    const context = getCalendarContext('2027-01-15');
    expect(
      getFallbackFortuneEntry(context, () => 0, {
        excludeId: 'occasion-canada-day-01',
      }).text,
    ).toBe(FALLBACK_POOLS.seasonal.winter[0]);
  });

  it('prefixes some everyday readings with the shared local greeting', () => {
    const context = getCalendarContext('2026-11-12');
    context.timeOfDay = getTimeOfDayFromLocalTime('19:45');

    expect(addTimeGreeting('A warm little surprise is waiting.', context, () => 0)).toBe(
      'Good evening. A warm little surprise is waiting.',
    );
    expect(addTimeGreeting('A warm little surprise is waiting.', context, () => 0.9)).toBe(
      'A warm little surprise is waiting.',
    );

    const respectful = getCalendarContext('2026-11-11');
    respectful.timeOfDay = getTimeOfDayFromLocalTime('08:00');
    expect(addTimeGreeting('Take a moment to remember.', respectful, () => 0)).toBe(
      'Take a moment to remember.',
    );
  });

  it('keeps every daily fallback free of guaranteed wins and lottery claims', () => {
    const all = [
      ...FALLBACK_POOLS.general,
      ...Object.values(FALLBACK_POOLS.seasonal).flat(),
      ...Object.values(FALLBACK_POOLS.occasion).flat(),
    ];

    for (const reading of all) {
      expect(reading).not.toMatch(/guaranteed|winning numbers|jackpot/i);
      expect(reading.trim().length).toBeGreaterThan(20);
    }
  });

  it('has enough everyday and seasonal variety to avoid immediate repetition', () => {
    expect(FALLBACK_POOLS.general.length).toBeGreaterThanOrEqual(40);
    for (const season of ['winter', 'spring', 'summer', 'autumn']) {
      expect(FALLBACK_POOLS.seasonal[season].length).toBeGreaterThanOrEqual(10);
    }
    for (const [key, pool] of Object.entries(FALLBACK_POOLS.occasion)) {
      expect(pool.length, key).toBeGreaterThanOrEqual(4);
    }
  });
});
