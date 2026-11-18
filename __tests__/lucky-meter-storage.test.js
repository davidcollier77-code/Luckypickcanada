import { describe, expect, it } from 'vitest';
import {
  HISTORY_LIMITS,
  METER_STORAGE_KEY,
  METER_STORAGE_VERSION,
} from '../app/lib/lucky-meter/config';
import {
  appendResultToHistory,
  emptyMeterHistory,
  emptyMeterState,
  isResultForDate,
  loadMeterState,
  saveMeterState,
} from '../app/lib/lucky-meter/storage';
import { createDailyResult } from '../app/lib/lucky-meter/selection';
import { LITTLE_SPARKS } from '../app/lib/lucky-meter/little-sparks';

function createMemoryStorage() {
  const map = new Map();
  return {
    map,
    getItem: (key) => (map.has(key) ? map.get(key) : null),
    setItem: (key, value) => map.set(key, String(value)),
    removeItem: (key) => map.delete(key),
  };
}

function makeResult(dateKey = '2026-11-18') {
  return createDailyResult({ dateKey, random: () => 0.5 });
}

describe('Lucky Meter Local Storage', () => {
  it('round-trips the complete result and history', () => {
    const storage = createMemoryStorage();
    const result = makeResult();
    const history = appendResultToHistory(emptyMeterHistory(), result);

    expect(saveMeterState({ result, history }, storage)).toBe(true);
    const loaded = loadMeterState(storage);

    expect(loaded.result).toEqual(expect.objectContaining({ ...result, createdAt: expect.any(Number) }));
    expect(loaded.history.percentages).toEqual([result.percentage]);
    expect(loaded.history.numbers).toEqual([result.luckyNumber]);
    expect(loaded.history.colours).toEqual([result.colour.id]);
    expect(loaded.history.sparks).toEqual([result.spark.id]);
  });

  it('writes only the versioned Local Storage key', () => {
    const storage = createMemoryStorage();
    const result = makeResult();
    saveMeterState({ result, history: emptyMeterHistory() }, storage);

    expect([...storage.map.keys()]).toEqual([METER_STORAGE_KEY]);
    const payload = JSON.parse(storage.map.get(METER_STORAGE_KEY));
    expect(payload.version).toBe(METER_STORAGE_VERSION);
    expect(payload.dateKey).toBe(result.dateKey);
    expect(payload.result.percentage).toBe(result.percentage);
    expect(payload.result.luckyNumber).toBe(result.luckyNumber);
  });

  it('keeps exactly one previous value for every independent choice', () => {
    const storage = createMemoryStorage();
    const results = [11, 22, 33, 44].map((percentage, index) => ({
      ...makeResult(`2026-11-${10 + index}`),
      percentage,
      luckyNumber: [4, 5, 6, 7][index],
      colour: { id: ['cream', 'charcoal', 'burgundy', 'navy-blue'][index] },
      spark: { id: LITTLE_SPARKS[index].id },
    }));

    let history = emptyMeterHistory();
    for (const result of results) {
      history = appendResultToHistory(history, result);
    }
    saveMeterState({ result: results[3], history }, storage);

    expect(history.percentages).toEqual([44]);
    expect(history.numbers).toEqual([7]);
    expect(history.colours).toEqual(['navy-blue']);
    expect(history.sparks).toEqual([LITTLE_SPARKS[3].id]);
    for (const key of ['percentages', 'numbers', 'colours', 'sparks']) {
      expect(history[key]).toHaveLength(HISTORY_LIMITS[key]);
    }
    expect(loadMeterState(storage).history).toEqual(history);
  });

  it('does not carry an event history that could block an event', () => {
    const history = appendResultToHistory(emptyMeterHistory(), makeResult());
    expect(history.events).toBeUndefined();
  });

  it('treats corrupt JSON, wrong versions and invalid results as no result', () => {
    const storage = createMemoryStorage();

    storage.setItem(METER_STORAGE_KEY, '{not-json');
    expect(loadMeterState(storage)).toEqual(emptyMeterState());

    storage.setItem(METER_STORAGE_KEY, JSON.stringify({ version: 999, result: makeResult() }));
    expect(loadMeterState(storage).result).toBeNull();

    const result = makeResult();
    storage.setItem(
      METER_STORAGE_KEY,
      JSON.stringify({
        version: METER_STORAGE_VERSION,
        dateKey: result.dateKey,
        result: { ...result, percentage: 0 },
        history: { percentages: [0, 42], numbers: [0, 19], colours: ['nope', 'cream'], sparks: ['nope', 'spark-01'] },
      }),
    );
    const loaded = loadMeterState(storage);
    expect(loaded.result).toBeNull();
    // History is still usable so the next draw can avoid recent picks; only
    // real values survive, so a corrupt newest entry never becomes an exclusion.
    expect(loaded.history.percentages).toEqual([42]);
    expect(loaded.history.numbers).toEqual([19]);
    expect(loaded.history.colours).toEqual(['cream']);
    expect(loaded.history.sparks).toEqual(['spark-01']);
  });

  it('returns a stale result for history but never reports it as today', () => {
    const storage = createMemoryStorage();
    const yesterday = makeResult('2026-11-17');
    saveMeterState({ result: yesterday, history: emptyMeterHistory() }, storage);

    const loaded = loadMeterState(storage);
    expect(loaded.result).not.toBeNull();
    expect(isResultForDate(loaded.result, '2026-11-18')).toBe(false);
    expect(isResultForDate(loaded.result, '2026-11-17')).toBe(true);
    expect(isResultForDate(null, '2026-11-18')).toBe(false);
  });

  it('never throws when storage is unavailable, disabled or full', () => {
    expect(loadMeterState(null)).toEqual(emptyMeterState());
    expect(saveMeterState({ result: makeResult(), history: emptyMeterHistory() }, null)).toBe(false);

    const throwingStorage = {
      getItem: () => { throw new Error('SecurityError'); },
      setItem: () => { throw new Error('QuotaExceededError'); },
    };
    expect(loadMeterState(throwingStorage)).toEqual(emptyMeterState());
    expect(saveMeterState({ result: makeResult(), history: emptyMeterHistory() }, throwingStorage)).toBe(false);
  });

  it('migrates a missing Lucky Number exactly once and persists it', () => {
    const storage = createMemoryStorage();
    const result = makeResult();
    // Drop the number and its history as a pre-Lucky-Number payload would.
    const legacy = { ...result };
    delete legacy.luckyNumber;
    storage.setItem(
      METER_STORAGE_KEY,
      JSON.stringify({
        version: METER_STORAGE_VERSION,
        dateKey: result.dateKey,
        result: legacy,
        history: { percentages: [result.percentage], sparks: [result.spark.id] },
        eventCompleted: true,
        stageDurationMs: 10_000,
      }),
    );

    const first = loadMeterState(storage, { random: () => 0.5 });
    const migratedNumber = first.result.luckyNumber;
    expect(migratedNumber).toBe(26);
    // The migration is written back, including the number in history.
    const persisted = JSON.parse(storage.map.get(METER_STORAGE_KEY));
    expect(persisted.result.luckyNumber).toBe(migratedNumber);
    expect(persisted.history.numbers).toEqual([migratedNumber]);
    // Nothing else was rerolled.
    expect(persisted.result.percentage).toBe(result.percentage);
    expect(persisted.result.colour.id).toBe(result.colour.id);
    expect(persisted.result.spark.id).toBe(result.spark.id);

    // A reload with a different random source keeps the same number.
    const second = loadMeterState(storage, { random: () => 0.9 });
    expect(second.result.luckyNumber).toBe(migratedNumber);
  });

  it('persists event and Spark completion at the existing version', () => {
    const storage = createMemoryStorage();
    const result = makeResult();
    const history = appendResultToHistory(emptyMeterHistory(), result);

    saveMeterState(
      { result, history, eventCompleted: true, sparkCompleted: true, stageDurationMs: 10_000 },
      storage,
    );
    const payload = JSON.parse(storage.map.get(METER_STORAGE_KEY));
    expect(payload.version).toBe(METER_STORAGE_VERSION);
    expect(payload.eventCompleted).toBe(true);
    expect(payload.sparkCompleted).toBe(true);
    expect(payload.stageDurationMs).toBe(10_000);

    const loaded = loadMeterState(storage);
    expect(loaded.eventCompleted).toBe(true);
    expect(loaded.sparkCompleted).toBe(true);
    expect(loaded.stageDurationMs).toBe(10_000);
  });

  it('treats missing lifecycle fields as unfinished for backward compatibility', () => {
    const storage = createMemoryStorage();
    const result = makeResult();
    storage.setItem(
      METER_STORAGE_KEY,
      JSON.stringify({
        version: METER_STORAGE_VERSION,
        dateKey: result.dateKey,
        result,
        history: emptyMeterHistory(),
      }),
    );

    const loaded = loadMeterState(storage);
    expect(loaded.result).not.toBeNull();
    expect(loaded.eventCompleted).toBe(false);
    expect(loaded.sparkCompleted).toBe(false);
    expect(loaded.stageDurationMs).toBe(0);
  });

  it('keeps a legacy completed result’s Spark visible instead of replaying it', () => {
    const storage = createMemoryStorage();
    const result = makeResult();
    storage.setItem(
      METER_STORAGE_KEY,
      JSON.stringify({
        version: METER_STORAGE_VERSION,
        dateKey: result.dateKey,
        result,
        history: emptyMeterHistory(),
        eventCompleted: true,
        stageDurationMs: 10_000,
      }),
    );

    expect(loadMeterState(storage).sparkCompleted).toBe(true);
  });

  it('rejects impossible stage durations and completion without a valid result', () => {
    const storage = createMemoryStorage();
    const result = makeResult();

    saveMeterState(
      { result, history: emptyMeterHistory(), eventCompleted: true, sparkCompleted: true, stageDurationMs: 999_999 },
      storage,
    );
    expect(loadMeterState(storage).stageDurationMs).toBe(0);

    saveMeterState(
      { result: null, history: emptyMeterHistory(), eventCompleted: true, sparkCompleted: true, stageDurationMs: 10_000 },
      storage,
    );
    const loaded = loadMeterState(storage);
    expect(loaded.result).toBeNull();
    expect(loaded.eventCompleted).toBe(false);
    expect(loaded.sparkCompleted).toBe(false);
    expect(loaded.stageDurationMs).toBe(0);
  });

  it('ignores malformed history entries without dropping valid ones', () => {
    const storage = createMemoryStorage();
    const result = makeResult();
    storage.setItem(
      METER_STORAGE_KEY,
      JSON.stringify({
        version: METER_STORAGE_VERSION,
        dateKey: result.dateKey,
        result,
        history: {
          percentages: ['12', null, 42.5, 77, 88, 99, 100],
          numbers: ['23', null, 7.5, 51, 0, 44, 9],
          colours: ['cream', 42, null, 'nope', 'navy-blue'],
          sparks: ['spark-02', {}, 'spark-03', 'nope'],
        },
      }),
    );

    const loaded = loadMeterState(storage);
    expect(loaded.history.percentages).toEqual([12]);
    expect(loaded.history.numbers).toEqual([23]);
    expect(loaded.history.colours).toEqual(['cream']);
    expect(loaded.history.sparks).toEqual(['spark-02']);
  });
});
