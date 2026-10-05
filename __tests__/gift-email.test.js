// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { redis, fromEnv } = vi.hoisted(() => ({
  redis: { eval: vi.fn(), get: vi.fn(), set: vi.fn() },
  fromEnv: vi.fn(),
}));
vi.mock('@upstash/redis', () => ({ Redis: { fromEnv } }));

const SESSION_ID = 'cs_test_gift_123';
const LOCK_TTL_MS = 120000;

let giftEmail;
let fetchMock;
let errorLog;

function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });

  return { promise, resolve, reject };
}

function createStripe(metadataOverrides = {}) {
  const session = {
    id: SESSION_ID,
    payment_status: 'paid',
    amount_total: 299,
    currency: 'cad',
    metadata: {
      checkoutType: 'gift_package',
      recipientEmail: 'friend@example.test',
      recipientName: 'Friend',
      senderName: 'Sender',
      giftMessage: 'Good luck!',
      ...metadataOverrides,
    },
  };

  const retrieve = vi.fn(async () => session);
  const update = vi.fn(async (_id, params) => {
    session.metadata = params.metadata;
    return session;
  });

  return {
    session,
    retrieve,
    update,
    client: { checkout: { sessions: { retrieve, update } } },
  };
}

function useRedis() {
  vi.stubEnv('UPSTASH_REDIS_REST_URL', 'https://redis.example.test');
  vi.stubEnv('UPSTASH_REDIS_REST_TOKEN', 'test-token');
  fromEnv.mockReturnValue(redis);
  redis.get.mockResolvedValue(null);
  redis.set.mockResolvedValue('OK');
  redis.eval.mockResolvedValue(1);
}

// Faithful Redis stand-in: honours SET NX, GET, and the release script's compare-and-set.
function useFakeRedis() {
  useRedis();
  const store = new Map();

  redis.get.mockImplementation(async (key) => (store.has(key) ? store.get(key) : null));
  redis.set.mockImplementation(async (key, value, options) => {
    if (options?.nx && store.has(key)) {
      return null;
    }

    store.set(key, value);
    return 'OK';
  });
  redis.eval.mockImplementation(async (_script, keys, args) => {
    if (store.get(keys[0]) === args[0]) {
      store.delete(keys[0]);
      return 1;
    }

    return 0;
  });

  return store;
}

function disableRedis() {
  vi.stubEnv('UPSTASH_REDIS_REST_URL', '');
  vi.stubEnv('UPSTASH_REDIS_REST_TOKEN', '');
}

function sentEmailCount() {
  return fetchMock.mock.calls.length;
}

beforeEach(async () => {
  vi.resetModules();
  vi.resetAllMocks();
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-01-01T00:00:00Z'));
  vi.stubEnv('RESEND_API_KEY', 're_test_key');
  vi.stubEnv('GIFT_FROM_EMAIL', 'gifts@example.test');
  disableRedis();
  fetchMock = vi.fn().mockResolvedValue({ ok: true, text: async () => '{"id":"email_1"}' });
  vi.stubGlobal('fetch', fetchMock);
  errorLog = vi.spyOn(console, 'error').mockImplementation(() => {});
  giftEmail = await import('../app/gift-email');
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe('gift delivery mutual exclusion without Redis', () => {
  it('sends a single email when two concurrent requests race with Redis absent', async () => {
    const gate = deferred();
    fetchMock.mockImplementation(async () => {
      await gate.promise;
      return { ok: true, text: async () => '{"id":"email_1"}' };
    });
    const stripe = createStripe();

    const first = giftEmail.deliverGiftEmailForSession(stripe.client, SESSION_ID);
    const second = giftEmail.deliverGiftEmailForSession(stripe.client, SESSION_ID);

    gate.resolve();
    const results = await Promise.all([first, second]);

    expect(sentEmailCount()).toBe(1);
    expect(results.filter((result) => result.delivered === true)).toHaveLength(1);
    expect(results.filter((result) => result.lockHeld === true)).toHaveLength(1);
    expect(fromEnv).not.toHaveBeenCalled();
    // The durable marker is written exactly once, by the request that sent the email.
    expect(stripe.update).toHaveBeenCalledTimes(1);
    expect(stripe.update.mock.calls[0][1].metadata.giftDeliveredAt).not.toBe(giftEmail.GIFT_PROCESSING_MARKER);
  });

  it('keeps mutual exclusion when Redis is configured but throws', async () => {
    useRedis();
    redis.get.mockRejectedValue(new Error('Redis unreachable'));
    redis.set.mockRejectedValue(new Error('Redis unreachable'));

    const gate = deferred();
    fetchMock.mockImplementation(async () => {
      await gate.promise;
      return { ok: true, text: async () => '{"id":"email_1"}' };
    });
    const stripe = createStripe();

    const first = giftEmail.deliverGiftEmailForSession(stripe.client, SESSION_ID);
    const second = giftEmail.deliverGiftEmailForSession(stripe.client, SESSION_ID);

    gate.resolve();
    const results = await Promise.all([first, second]);

    expect(sentEmailCount()).toBe(1);
    expect(results.filter((result) => result.lockHeld === true)).toHaveLength(1);
    expect(errorLog).toHaveBeenCalledWith('Failed to acquire gift lock', expect.any(Error));
  });

  it('releases the claim when sendGiftEmail throws and retries successfully', async () => {
    const stripe = createStripe();
    fetchMock.mockRejectedValueOnce(new Error('network failure in fetch'));

    await expect(giftEmail.deliverGiftEmailForSession(stripe.client, SESSION_ID)).rejects.toThrow('network failure in fetch');
    // No durable marker and no processing claim is written for the failed attempt.
    expect(stripe.update).not.toHaveBeenCalled();
    expect(stripe.session.metadata.giftDeliveredAt).toBeUndefined();

    const retry = await giftEmail.deliverGiftEmailForSession(stripe.client, SESSION_ID);

    expect(retry.ok).toBe(true);
    expect(sentEmailCount()).toBe(2);
    expect(stripe.session.metadata.giftDeliveredAt).toBe('2026-01-01T00:00:00.000Z');
  });

  it('releases the Redis claim when sendGiftEmail throws', async () => {
    useRedis();
    const stripe = createStripe();
    fetchMock.mockRejectedValueOnce(new Error('network failure in fetch'));

    await expect(giftEmail.deliverGiftEmailForSession(stripe.client, SESSION_ID)).rejects.toThrow('network failure in fetch');

    const lockSetCall = redis.set.mock.calls.find(([key]) => key === `gift_lock:${SESSION_ID}`);
    expect(lockSetCall).toBeDefined();
    expect(redis.eval).toHaveBeenCalledWith(expect.stringContaining("redis.call('del'"), [`gift_lock:${SESSION_ID}`], [lockSetCall[1]]);

    const retry = await giftEmail.deliverGiftEmailForSession(stripe.client, SESSION_ID);
    expect(retry.ok).toBe(true);
  });
});

describe('gift delivery claim expiry and recovery', () => {
  it('recovers from a stale processing claim instead of reporting alreadyDelivered', async () => {
    const stripe = createStripe({ giftDeliveredAt: giftEmail.GIFT_PROCESSING_MARKER });

    expect(giftEmail.isGiftDelivered(stripe.session.metadata)).toBe(false);

    const result = await giftEmail.deliverGiftEmailForSession(stripe.client, SESSION_ID);

    expect(result.ok).toBe(true);
    expect(result.alreadyDelivered).toBeUndefined();
    expect(sentEmailCount()).toBe(1);
    expect(stripe.session.metadata.giftDeliveredAt).toBe('2026-01-01T00:00:00.000Z');
    expect(stripe.session.metadata.giftDeliveredAt).not.toBe(giftEmail.GIFT_PROCESSING_MARKER);
  });

  it('re-attempts after the shared claim TTL expires and never lets an expired holder release a newer lock', async () => {
    const gateA = deferred();
    const gateB = deferred();
    const reachedA = deferred();
    const reachedB = deferred();
    let call = 0;

    fetchMock.mockImplementation(async () => {
      call += 1;

      if (call === 1) {
        // The stalled holder fails, so it releases its claim without writing a durable marker.
        reachedA.resolve();
        await gateA.promise;
        return { ok: false, text: async () => 'provider rejected the request' };
      }

      reachedB.resolve();
      await gateB.promise;
      return { ok: true, text: async () => '{"id":"email_1"}' };
    });

    const stripe = createStripe();

    const first = giftEmail.deliverGiftEmailForSession(stripe.client, SESSION_ID);
    await reachedA.promise;

    // The holder stalls past the claim TTL, so a later request must be able to recover.
    vi.advanceTimersByTime(LOCK_TTL_MS + 1);

    const second = giftEmail.deliverGiftEmailForSession(stripe.client, SESSION_ID);
    await reachedB.promise;
    expect(sentEmailCount()).toBe(2);

    // The stalled request finishes late; its compare-and-set release must not free the new lock.
    gateA.resolve();
    expect((await first).ok).toBe(false);
    expect(stripe.update).not.toHaveBeenCalled();

    const third = await giftEmail.deliverGiftEmailForSession(stripe.client, SESSION_ID);
    expect(third.lockHeld).toBe(true);

    gateB.resolve();
    expect((await second).ok).toBe(true);
    expect(stripe.session.metadata.giftDeliveredAt).toBe('2026-01-01T00:02:00.001Z');
  });
});

describe('gift delivery idempotency with Redis', () => {
  it('acquires the Redis lock with nx and a unique token, then releases it with a Lua compare-and-set', async () => {
    const store = useFakeRedis();
    const stripe = createStripe();

    const result = await giftEmail.deliverGiftEmailForSession(stripe.client, SESSION_ID);

    expect(result.ok).toBe(true);
    expect(redis.set).toHaveBeenCalledWith(`gift_lock:${SESSION_ID}`, expect.any(String), { px: LOCK_TTL_MS, nx: true });

    const lockToken = redis.set.mock.calls[0][1];
    expect(redis.eval).toHaveBeenCalledWith(expect.stringContaining("redis.call('get', KEYS[1]) == ARGV[1]"), [`gift_lock:${SESSION_ID}`], [lockToken]);
  });

  it('records the durable sent marker before the Stripe metadata write', async () => {
    const store = useFakeRedis();
    const stripe = createStripe();
    const order = [];

    redis.set.mockImplementation(async (key, value, options) => {
      if (options?.nx && store.has(key)) {
        return null;
      }

      order.push(`redis:${key}`);
      store.set(key, value);
      return 'OK';
    });
    stripe.update.mockImplementation(async (_id, params) => {
      order.push('stripe:update');
      stripe.session.metadata = params.metadata;
      return stripe.session;
    });

    await giftEmail.deliverGiftEmailForSession(stripe.client, SESSION_ID);

    expect(order).toEqual([`redis:gift_lock:${SESSION_ID}`, `redis:gift_sent:${SESSION_ID}`, 'stripe:update']);
    expect(redis.set).toHaveBeenCalledWith(`gift_sent:${SESSION_ID}`, '1', { px: 7 * 24 * 60 * 60 * 1000 });
    expect(errorLog).not.toHaveBeenCalled();
  });

  it('rejects a second concurrent acquisition and never releases a lock it does not own', async () => {
    useFakeRedis();
    const gate = deferred();
    fetchMock.mockImplementation(async () => {
      await gate.promise;
      return { ok: true, text: async () => '{"id":"email_1"}' };
    });
    const stripe = createStripe();

    const first = giftEmail.deliverGiftEmailForSession(stripe.client, SESSION_ID);
    const second = giftEmail.deliverGiftEmailForSession(stripe.client, SESSION_ID);

    gate.resolve();
    const results = await Promise.all([first, second]);

    expect(sentEmailCount()).toBe(1);
    expect(results.filter((result) => result.lockHeld === true)).toHaveLength(1);

    const lockTokens = redis.set.mock.calls.filter(([key]) => key === `gift_lock:${SESSION_ID}`).map(([, token]) => token);
    expect(lockTokens).toHaveLength(2);
    expect(lockTokens[0]).not.toBe(lockTokens[1]);
    // Only the holder that actually owns the lock releases it.
    expect(redis.eval).toHaveBeenCalledTimes(1);
    expect(redis.eval).toHaveBeenCalledWith(expect.any(String), [`gift_lock:${SESSION_ID}`], [lockTokens[0]]);
  });

  it('re-reads the sent marker under the lock when it appears between the pre-lock read and SET NX', async () => {
    const store = useFakeRedis();
    const stripe = createStripe();
    // The pre-lock fast path misses. A concurrent webhook then sends the email,
    // writes the marker, and releases the lock before this request's `SET NX`
    // lands, so only the read taken while the lock is held can see it.
    redis.get.mockImplementation(async (key) => {
      if (key === `gift_sent:${SESSION_ID}`) {
        return redis.get.mock.calls.filter(([k]) => k === key).length > 1 ? '1' : null;
      }

      return store.has(key) ? store.get(key) : null;
    });

    const result = await giftEmail.deliverGiftEmailForSession(stripe.client, SESSION_ID);

    expect(result).toEqual({ ok: true, alreadyDelivered: true, metadata: stripe.session.metadata });
    expect(sentEmailCount()).toBe(0);
    expect(stripe.update).not.toHaveBeenCalled();
    // Both marker reads happened, and the lock this request claimed was released
    // with its own token rather than left behind.
    expect(redis.get.mock.calls.filter(([key]) => key === `gift_sent:${SESSION_ID}`)).toHaveLength(2);
    const lockToken = redis.set.mock.calls[0][1];
    expect(redis.eval).toHaveBeenCalledWith(
      expect.stringContaining("redis.call('get', KEYS[1]) == ARGV[1]"),
      [`gift_lock:${SESSION_ID}`],
      [lockToken],
    );
    expect(store.has(`gift_lock:${SESSION_ID}`)).toBe(false);
    expect(errorLog).not.toHaveBeenCalled();
  });
});

describe('gift delivery success behaviour', () => {
  it('persists the reveal to Stripe metadata and returns alreadyDelivered on repeat calls', async () => {
    const stripe = createStripe();

    const result = await giftEmail.deliverGiftEmailForSession(stripe.client, SESSION_ID);

    expect(result.ok).toBe(true);
    expect(result.reveal.numbers).toHaveLength(6);
    expect(stripe.session.metadata.giftNumbers).toBe(result.reveal.numbers.join(','));
    expect(stripe.session.metadata.giftLuckyColor).toBe(result.reveal.luckyColor);
    expect(stripe.session.metadata.giftLuckyDay).toBe(result.reveal.luckyDay);

    const repeat = await giftEmail.deliverGiftEmailForSession(stripe.client, SESSION_ID);

    expect(repeat.alreadyDelivered).toBe(true);
    expect(sentEmailCount()).toBe(1);
    expect(stripe.update).toHaveBeenCalledTimes(1);
  });

  it('marks the gift sent in memory when the Stripe metadata write fails, so no duplicate email is sent', async () => {
    const stripe = createStripe();
    stripe.update.mockRejectedValue(new Error('Stripe metadata write failed'));

    const first = await giftEmail.deliverGiftEmailForSession(stripe.client, SESSION_ID);
    expect(first.ok).toBe(true);

    const retry = await giftEmail.deliverGiftEmailForSession(stripe.client, SESSION_ID);

    expect(retry.alreadyDelivered).toBe(true);
    expect(sentEmailCount()).toBe(1);
    expect(errorLog).toHaveBeenCalledWith('Failed to update Stripe metadata after successful email delivery', expect.any(Error));
  });

  it('never writes a processing claim to Stripe metadata', async () => {
    const stripe = createStripe();

    await giftEmail.deliverGiftEmailForSession(stripe.client, SESSION_ID);

    const writtenMarkers = stripe.update.mock.calls.map(([, params]) => params.metadata.giftDeliveredAt);
    expect(writtenMarkers).toEqual(['2026-01-01T00:00:00.000Z']);
  });
});