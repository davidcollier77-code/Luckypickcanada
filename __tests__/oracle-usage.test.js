import { beforeEach, describe, expect, it } from 'vitest';
import { createOracleUsageManager, ORACLE_DAILY_LIMIT } from '../app/lib/oracle-usage.js';

function createFakeKv() {
  const values = new Map();
  return {
    values,
    async get(key) {
      const value = values.get(key);
      return value ? JSON.parse(value) : null;
    },
    async put(key, value) {
      values.set(key, value);
    },
  };
}

describe('Crystal Ball daily quota', () => {
  let now;
  let kv;
  let manager;

  beforeEach(() => {
    now = Date.parse('2026-10-17T12:00:00.000Z');
    kv = createFakeKv();
    manager = createOracleUsageManager({ kv, now: () => now });
  });

  it('admits three pending questions, blocks a fourth, and counts only committed answers', async () => {
    expect(ORACLE_DAILY_LIMIT).toBe(3);
    const first = await manager.reserve('203.0.113.10');
    const second = await manager.reserve('203.0.113.10');
    const third = await manager.reserve('203.0.113.10');
    const fourth = await manager.reserve('203.0.113.10');

    expect(first.ok).toBe(true);
    expect(second.ok).toBe(true);
    expect(third.ok).toBe(true);
    expect(fourth.ok).toBe(false);
    expect(fourth.quota.remaining).toBe(0);

    await manager.commit(first.reservation);
    await manager.release(second.reservation);
    await manager.release(third.reservation);

    const status = await manager.getStatus('203.0.113.10');
    expect(status.used).toBe(1);
    expect(status.remaining).toBe(2);
  });

  it('keeps separate daily allowances for separate client IPs', async () => {
    for (let i = 0; i < 3; i += 1) {
      expect((await manager.reserve('203.0.113.10')).ok).toBe(true);
    }
    expect((await manager.reserve('203.0.113.10')).ok).toBe(false);
    expect((await manager.reserve('203.0.113.11')).ok).toBe(true);
  });

  it('starts a fresh allowance at the UTC day boundary', async () => {
    const reservation = await manager.reserve('203.0.113.10');
    await manager.commit(reservation.reservation);
    expect((await manager.getStatus('203.0.113.10')).used).toBe(1);

    now = Date.parse('2026-10-18T00:00:00.000Z');
    const nextDay = await manager.getStatus('203.0.113.10');
    expect(nextDay.used).toBe(0);
    expect(nextDay.remaining).toBe(3);
  });
});
