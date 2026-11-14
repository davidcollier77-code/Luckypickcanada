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

function createMemoryStorage() {
  const map = new Map();
  return {
    map,
    getItem: (key) => (map.has(key) ? map.get(key) : null),
    setItem: (key, value) => map.set(key, String(value)),
    removeItem: (key) => map.delete(key),
  };
}

function makeResult(dateKey = '2026-11-14') {
  return createDailyResult({ dateKey });
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
    expect(loaded.history.events).toEqual([result.event.id]);
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
  });

  it('keeps the last three percentages only', () => {
    const storage = createMemoryStorage();
    const results = [11, 22, 33, 44].map((percentage, index) => ({
      ...makeResult(`2026-11-${10 + index}`),
      percentage,
    }));

    let history = emptyMeterHistory();
    for (const result of results) {
      history = appendResultToHistory(history, result);
    }
    saveMeterState({ result: results[3], history }, storage);

    expect(history.percentages).toEqual([44, 33, 22]);
    expect(history.percentages).toHaveLength(HISTORY_LIMITS.percentages);
    expect(loadMeterState(storage).history.percentages).toEqual([44, 33, 22]);
  });

  it('caps event and Spark history separately', () => {
    let history = emptyMeterHistory();
    const events = [
      'meteor', 'lightning', 'fireworks', 'meteor', 'lightning',
      'fireworks', 'meteor', 'lightning', 'fireworks', 'meteor', 'lightning', 'fireworks',
    ];
    const sparks = Array.from({ length: 12 }, (_, index) => `spark-${String(index + 1).padStart(2, '0')}`);

    for (let index = 0; index < sparks.length; index += 1) {
      history = appendResultToHistory(history, {
        percentage: 40 + index,
        event: { id: events[index] },
        spark: { id: sparks[index] },
      });
    }

    expect(history.events).toHaveLength(HISTORY_LIMITS.events);
    expect(history.events[0]).toBe(events[events.length - 1]);
    expect(history.sparks).toHaveLength(HISTORY_LIMITS.sparks);
    expect(history.sparks[0]).toBe(sparks[sparks.length - 1]);
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
        history: { percentages: [0, 42], events: ['meteor'], sparks: ['spark-01'] },
      }),
    );
    const loaded = loadMeterState(storage);
    expect(loaded.result).toBeNull();
    // History is still usable so the next draw can avoid recent picks;
    // 0 is not a possible meter result and is discarded.
    expect(loaded.history.percentages).toEqual([42]);
    expect(loaded.history.events).toEqual(['meteor']);
  });

  it('returns a stale result for history but never reports it as today', () => {
    const storage = createMemoryStorage();
    const yesterday = makeResult('2026-11-13');
    saveMeterState({ result: yesterday, history: emptyMeterHistory() }, storage);

    const loaded = loadMeterState(storage);
    expect(loaded.result).not.toBeNull();
    expect(isResultForDate(loaded.result, '2026-11-14')).toBe(false);
    expect(isResultForDate(loaded.result, '2026-11-13')).toBe(true);
    expect(isResultForDate(null, '2026-11-14')).toBe(false);
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
          events: ['meteor', 42, null, 'lightning'],
          sparks: ['spark-02', {}, 'spark-03'],
        },
      }),
    );

    const loaded = loadMeterState(storage);
    expect(loaded.history.percentages).toEqual([12, 77, 88]);
    expect(loaded.history.events).toEqual(['meteor', 'lightning']);
    expect(loaded.history.sparks).toEqual(['spark-02', 'spark-03']);
  });
});
