import { createHash } from 'node:crypto';

export const ORACLE_DAILY_LIMIT = 3;
const QUOTA_TTL_SECONDS = 48 * 60 * 60;
const QUOTA_TTL_MS = QUOTA_TTL_SECONDS * 1000;
const memoryFallback = new Map();
const localMutationQueues = new Map();

const RESERVE_LUA = "local used = tonumber(redis.call('HGET', KEYS[1], 'used') or '0')\nlocal pending = tonumber(redis.call('HGET', KEYS[1], 'pending') or '0')\nlocal limit = tonumber(ARGV[1])\nif used + pending >= limit then return {0, used, pending} end\npending = redis.call('HINCRBY', KEYS[1], 'pending', 1)\nredis.call('PEXPIRE', KEYS[1], ARGV[2])\nreturn {1, used, pending}";
const COMMIT_LUA = "local used = tonumber(redis.call('HGET', KEYS[1], 'used') or '0')\nlocal pending = tonumber(redis.call('HGET', KEYS[1], 'pending') or '0')\nif pending <= 0 then return {-1, used, pending} end\nused = redis.call('HINCRBY', KEYS[1], 'used', 1)\npending = redis.call('HINCRBY', KEYS[1], 'pending', -1)\nredis.call('PEXPIRE', KEYS[1], ARGV[1])\nreturn {used, pending}";
const RELEASE_LUA = "local used = tonumber(redis.call('HGET', KEYS[1], 'used') or '0')\nlocal pending = tonumber(redis.call('HGET', KEYS[1], 'pending') or '0')\nif pending > 0 then pending = redis.call('HINCRBY', KEYS[1], 'pending', -1) end\nif used == 0 and pending == 0 then redis.call('DEL', KEYS[1]) else redis.call('PEXPIRE', KEYS[1], ARGV[1]) end\nreturn {used, pending}";

function normalizeState(value) {
  return {
    used: Math.max(0, Number(value?.used) || 0),
    pending: Math.max(0, Number(value?.pending) || 0),
  };
}

function withLocalMutationLock(key, operation) {
  const previous = localMutationQueues.get(key) || Promise.resolve();
  let release;
  const current = new Promise((resolve) => { release = resolve; });
  const tail = previous.then(() => current);
  localMutationQueues.set(key, tail);
  return previous.then(operation).finally(() => {
    release();
    if (localMutationQueues.get(key) === tail) localMutationQueues.delete(key);
  });
}

function makeQuotaSummary(state, nowMs) {
  const reset = new Date(nowMs);
  reset.setUTCHours(24, 0, 0, 0);
  return {
    limit: ORACLE_DAILY_LIMIT,
    used: Math.min(ORACLE_DAILY_LIMIT, state.used),
    remaining: Math.max(0, ORACLE_DAILY_LIMIT - state.used - state.pending),
    resetAt: reset.toISOString(),
  };
}

/**
 * Prefer atomic Upstash Redis reservations. Cloudflare KV is used as a durable
 * fallback when Redis is not configured; KV has no compare-and-swap primitive,
 * so its mutations are serialized within this Worker isolate. Memory is only
 * a local-development/test fallback when neither store exists.
 */
export function createOracleUsageManager({
  redis = null,
  kv = null,
  memoryStore = memoryFallback,
  now = () => Date.now(),
} = {}) {
  const storeType = redis ? 'redis' : kv ? 'kv' : 'memory';

  function quotaKey(ip, timestamp = now()) {
    const day = new Date(timestamp).toISOString().slice(0, 10);
    const clientHash = createHash('sha256')
      .update(String(ip || 'unknown'))
      .digest('hex')
      .slice(0, 32);
    return { key: 'oracle:daily:v1:' + day + ':' + clientHash, day };
  }

  async function readState(key) {
    if (redis) return normalizeState(await redis.hgetall(key));
    if (kv) return normalizeState(await kv.get(key, { type: 'json' }));
    return normalizeState(memoryStore.get(key));
  }

  async function writeState(key, state) {
    if (redis) {
      await redis.hset(key, state);
      await redis.pexpire(key, QUOTA_TTL_MS);
      return;
    }
    if (kv) {
      await kv.put(key, JSON.stringify(state), { expirationTtl: QUOTA_TTL_SECONDS });
      return;
    }
    memoryStore.set(key, state);
  }

  async function mutateFallback(key, mutation) {
    return withLocalMutationLock(key, async () => {
      const state = await readState(key);
      const next = mutation(state);
      if (!next.write) return next.result;
      await writeState(key, next.state);
      return next.result;
    });
  }

  async function getStatus(ip) {
    const { key } = quotaKey(ip);
    return makeQuotaSummary(await readState(key), now());
  }

  async function reserve(ip) {
    const nowMs = now();
    const { key, day } = quotaKey(ip, nowMs);
    let state;
    let admitted;

    if (redis) {
      const result = await redis.eval(RESERVE_LUA, [key], [String(ORACLE_DAILY_LIMIT), String(QUOTA_TTL_MS)]);
      admitted = Number(result?.[0]) === 1;
      state = normalizeState({ used: result?.[1], pending: result?.[2] });
    } else {
      const outcome = await mutateFallback(key, (current) => {
        if (current.used + current.pending >= ORACLE_DAILY_LIMIT) {
          return { write: false, result: { admitted: false, state: current } };
        }
        const next = { used: current.used, pending: current.pending + 1 };
        return { write: true, state: next, result: { admitted: true, state: next } };
      });
      admitted = outcome.admitted;
      state = outcome.state;
    }

    return {
      ok: admitted,
      quota: makeQuotaSummary(state, nowMs),
      reservation: admitted ? { key, day, storeType } : null,
    };
  }

  async function commit(reservation) {
    if (!reservation || reservation.storeType !== storeType) throw new Error('Invalid Oracle quota reservation.');
    let state;
    if (redis) {
      // COMMIT_LUA returns {used, pending} where used is the post-increment value and
      // pending is post-decrement. The early-abort branch returns {-1, used, pending}.
      const result = await redis.eval(COMMIT_LUA, [reservation.key], [String(QUOTA_TTL_MS)]);
      if (Number(result?.[0]) < 0) throw new Error('Oracle quota reservation was already finalized.');
      state = normalizeState({ used: result?.[0], pending: result?.[1] });
    } else {
      state = await mutateFallback(reservation.key, (current) => {
        if (current.pending <= 0) throw new Error('Oracle quota reservation was already finalized.');
        const next = { used: current.used + 1, pending: current.pending - 1 };
        return { write: true, state: next, result: next };
      });
    }
    return makeQuotaSummary(state, now());
  }

  async function release(reservation) {
    if (!reservation || reservation.storeType !== storeType) throw new Error('Invalid Oracle quota reservation.');
    let state;
    if (redis) {
      const result = await redis.eval(RELEASE_LUA, [reservation.key], [String(QUOTA_TTL_MS)]);
      state = normalizeState({ used: result?.[0], pending: result?.[1] });
    } else {
      state = await mutateFallback(reservation.key, (current) => {
        const next = { used: current.used, pending: Math.max(0, current.pending - 1) };
        return { write: true, state: next, result: next };
      });
    }
    return makeQuotaSummary(state, now());
  }

  return { getStatus, reserve, commit, release, storeType };
}
