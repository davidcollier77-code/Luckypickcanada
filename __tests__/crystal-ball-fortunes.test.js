import { describe, expect, it } from 'vitest';
import { getCalendarContext } from '../app/lib/crystal-ball-calendar';
import {
  FALLBACK_POOLS,
  addTimeGreeting,
  getFallbackFortune,
  getFallbackFollowUp,
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
    expect(getFallbackFollowUp(null, () => 0).length).toBeGreaterThan(20);
  });

  it('keeps follow-up fallbacks respectful on solemn days', () => {
    const remembrance = getFallbackFollowUp(getCalendarContext('2026-11-11'), () => 0);
    expect(remembrance).toBe(FALLBACK_POOLS.respectfulFollowUp[0]);
    expect(remembrance).not.toContain('eh?');
    expect(remembrance).not.toContain('!');

    const truth = getFallbackFollowUp(getCalendarContext('2026-09-30'), () => 0.999999);
    expect(FALLBACK_POOLS.thoughtfulFollowUp).toContain(truth);
    expect(truth).not.toContain('eh?');

    expect(getFallbackFollowUp(getCalendarContext('2026-11-12'), () => 0)).toBe(
      FALLBACK_POOLS.followUp[0],
    );
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

  it('keeps every fallback free of guaranteed wins and lottery claims', () => {
    const all = [
      ...FALLBACK_POOLS.general,
      ...Object.values(FALLBACK_POOLS.seasonal).flat(),
      ...Object.values(FALLBACK_POOLS.occasion).flat(),
      ...FALLBACK_POOLS.followUp,
      ...FALLBACK_POOLS.respectfulFollowUp,
      ...FALLBACK_POOLS.thoughtfulFollowUp,
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
