// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { redis, fromEnv } = vi.hoisted(() => ({
  redis: { eval: vi.fn(), get: vi.fn(), set: vi.fn() },
  fromEnv: vi.fn(),
}));
vi.mock('@upstash/redis', () => ({ Redis: { fromEnv } }));

const IP = '192.0.2.1';
const WINDOW = 15 * 60 * 1000;
const BLOCK = 60 * 60 * 1000;
const failure = new Error('Redis unavailable');
let protection;
let errorLog;

function submit({ honeypot = '', token = 'test-token', fields = [] } = {}) {
  return protection.validatePublicFormSubmission({
    request: new Request('https://example.test', { headers: { 'cf-connecting-ip': IP } }),
    formData: new Map([['website', honeypot], ['cf-turnstile-response', token]]),
    formName: 'suggestions',
    duplicateFields: fields,
  });
}

function expectRedisError(operation, key) {
  expect(errorLog).toHaveBeenCalledWith('Redis spam protection operation failed', {
    operation, key, error: failure,
  });
}

beforeEach(async () => {
  vi.resetModules();
  vi.resetAllMocks();
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-01-01T00:00:00Z'));
  vi.stubEnv('UPSTASH_REDIS_REST_URL', 'https://redis.example.test');
  vi.stubEnv('UPSTASH_REDIS_REST_TOKEN', 'test-token');
  vi.stubEnv('TURNSTILE_SITE_KEY', 'test-site-key');
  vi.stubEnv('TURNSTILE_SECRET_KEY', 'test-secret');
  fromEnv.mockReturnValue(redis);
  redis.eval.mockResolvedValue(1);
  redis.get.mockResolvedValue(null);
  redis.set.mockResolvedValue('OK');
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ success: true, hostname: 'luckypickcanada.ca', action: 'suggestions' }) }));
  errorLog = vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  protection = await import('../app/spam-protection');
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe('API rate limiting', () => {
  it('preserves the Redis limit boundary and passes the requested window to one script', async () => {
    redis.eval.mockResolvedValueOnce(2).mockResolvedValueOnce(3);
    expect(await protection.checkApiRateLimit(IP, 'oracle', 2, 1234)).toEqual({ ok: true });
    expect(await protection.checkApiRateLimit(IP, 'oracle', 2, 1234)).toEqual({ ok: false });
    expect(redis.eval).toHaveBeenCalledWith(expect.any(String), [`api_rate_limit:oracle:${IP}`], [1234]);
    expect(protection.apiRateLimits.size).toBe(0);
    expect(errorLog).not.toHaveBeenCalled();
  });

  it('falls back on script failure, enforcing limits, action isolation, and reset', async () => {
    redis.eval.mockRejectedValue(failure);
    for (let i = 0; i < 2; i++) {
      expect(await protection.checkApiRateLimit(IP, 'oracle', 2, 1000)).toEqual({ ok: true });
    }
    expect(await protection.checkApiRateLimit(IP, 'oracle', 2, 1000)).toEqual({ ok: false });
    expect(await protection.checkApiRateLimit(IP, 'checkout', 2, 1000)).toEqual({ ok: true });
    expectRedisError('eval', `api_rate_limit:oracle:${IP}`);
    vi.advanceTimersByTime(1001);
    expect(await protection.checkApiRateLimit(IP, 'oracle', 2, 1000)).toEqual({ ok: true });
  });

  it('uses memory if Redis configuration is missing', async () => {
    vi.stubEnv('UPSTASH_REDIS_REST_URL', '');
    expect(await protection.checkApiRateLimit(IP, 'global', 1)).toEqual({ ok: true });
    expect(await protection.checkApiRateLimit(IP, 'global', 1)).toEqual({ ok: false });
    expect(fromEnv).not.toHaveBeenCalled();
  });

  it('logs initialization failure and uses memory', async () => {
    fromEnv.mockImplementation(() => { throw failure; });
    expect(await protection.checkApiRateLimit(IP, 'global', 1)).toEqual({ ok: true });
    expect(await protection.checkApiRateLimit(IP, 'global', 1)).toEqual({ ok: false });
    expect(errorLog).toHaveBeenCalledWith('Redis client initialization failed', { operation: 'fromEnv', error: failure });
  });
});

describe('public form protection', () => {
  it('preserves successful Redis counters, duplicate TTL, and Turnstile verification', async () => {
    expect(await submit({ fields: ['hello'] })).toEqual({ ok: true });
    expect(redis.eval).toHaveBeenCalledWith(expect.any(String), [`rate_limit:suggestions:${IP}`], [WINDOW]);
    expect(redis.set).toHaveBeenCalledWith(`duplicate:suggestions:${IP}:hello`, '1', { px: 600000, nx: true });
    expect(fetch).toHaveBeenCalledOnce();
    expect(errorLog).not.toHaveBeenCalled();
  });

  it('rejects a Redis-blocked IP before checking the form', async () => {
    redis.get.mockResolvedValue('1');
    expect(await submit()).toMatchObject({ ok: false, error: expect.stringContaining('about an hour') });
    expect(redis.eval).not.toHaveBeenCalled();
    expect(fetch).not.toHaveBeenCalled();
  });

  it('preserves the fifth/sixth submission boundary and force-blocks the IP', async () => {
    redis.eval.mockResolvedValueOnce(5).mockResolvedValueOnce(6).mockResolvedValueOnce(1);
    expect(await submit()).toEqual({ ok: true });
    expect(await submit()).toMatchObject({ ok: false, error: expect.stringContaining('Too many submissions.') });
    expect(redis.set).toHaveBeenCalledWith(`blocked_ip:${IP}`, '1', { px: BLOCK });
  });

  it('uses local rate and spam limits through an outage and expires the block', async () => {
    redis.get.mockRejectedValue(failure);
    redis.eval.mockRejectedValue(failure);
    redis.set.mockRejectedValue(failure);
    for (let i = 0; i < 5; i++) expect(await submit()).toEqual({ ok: true });
    expect(await submit()).toMatchObject({ ok: false, error: expect.stringContaining('Too many submissions.') });
    expect(await submit()).toMatchObject({ ok: false, error: expect.stringContaining('were detected') });
    expectRedisError('get', `blocked_ip:${IP}`);
    expectRedisError('eval', `rate_limit:suggestions:${IP}`);
    expectRedisError('eval', `spam_attempts:${IP}`);
    vi.advanceTimersByTime(BLOCK + 1);
    expect(await submit()).toEqual({ ok: true });
  });

  it('blocks after three local spam attempts when the counter fails', async () => {
    redis.eval.mockRejectedValue(failure);
    for (let i = 0; i < 3; i++) {
      expect(await submit({ honeypot: 'bot' })).toEqual({ ok: false, error: 'Unable to accept this submission.' });
    }
    expect(await submit()).toMatchObject({ ok: false, error: expect.stringContaining('were detected') });
    expect(fetch).not.toHaveBeenCalled();
  });

  it('retains a local block when the Redis threshold is reached but block writing fails', async () => {
    redis.eval.mockResolvedValue(3);
    redis.set.mockRejectedValue(failure);
    expect(await submit({ honeypot: 'bot' })).toEqual({ ok: false, error: 'Unable to accept this submission.' });
    expectRedisError('set', `blocked_ip:${IP}`);
    expect(await submit()).toMatchObject({ ok: false, error: expect.stringContaining('were detected') });
  });

  it('preserves duplicate rejection even if recording the spam attempt fails', async () => {
    redis.set.mockResolvedValue(null);
    redis.eval.mockImplementation(async (_script, [key]) => {
      if (key.startsWith('spam_attempts:')) throw failure;
      return 1;
    });
    expect(await submit({ fields: ['hello'] })).toMatchObject({ ok: false, error: expect.stringContaining('duplicate submission') });
    expectRedisError('eval', `spam_attempts:${IP}`);
  });

  it('uses local duplicate detection and expiry when the Redis claim fails', async () => {
    redis.set.mockImplementation(async (key) => {
      if (key.startsWith('duplicate:')) throw failure;
      return 'OK';
    });
    expect(await submit({ fields: ['hello'] })).toEqual({ ok: true });
    expectRedisError('set', `duplicate:suggestions:${IP}:[fingerprint]`);
    // A healthy Redis miss must not bypass the marker retained in memory.
    redis.get.mockResolvedValue(null);
    redis.set.mockResolvedValue('OK');
    expect(await submit({ fields: ['hello'] })).toMatchObject({ ok: false, error: expect.stringContaining('duplicate submission') });
    expect(redis.set).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(600001);
    expect(await submit({ fields: ['hello'] })).toEqual({ ok: true });
  });

  it('accepts only one concurrent duplicate claim and records the rejected attempt', async () => {
    const keys = new Set();
    redis.set.mockImplementation(async (key, _value, { nx }) => {
      if (nx && keys.has(key)) return null;
      keys.add(key);
      return 'OK';
    });

    const results = await Promise.all([
      submit({ fields: ['hello'] }),
      submit({ fields: ['hello'] }),
    ]);

    expect(results.filter(result => result.ok)).toHaveLength(1);
    expect(results.filter(result => !result.ok)).toEqual([
      { ok: false, error: 'This looks like a duplicate submission. Please wait a few minutes before trying again.' },
    ]);
    expect(redis.get.mock.calls.every(([key]) => key === `blocked_ip:${IP}`)).toBe(true);
    expect(redis.eval).toHaveBeenCalledWith(expect.any(String), [`spam_attempts:${IP}`], [WINDOW]);
    expect(console.warn).toHaveBeenCalledWith('Public form spam protection triggered', expect.objectContaining({ reason: 'duplicate_submission' }));
  });

  it('rejects concurrent duplicates when Redis claims fail', async () => {
    redis.set.mockRejectedValue(failure);
    const results = await Promise.all([
      submit({ fields: ['hello'] }),
      submit({ fields: ['hello'] }),
    ]);
    expect(results.filter(result => result.ok)).toHaveLength(1);
    expect(results.filter(result => !result.ok)).toHaveLength(1);
    expectRedisError('set', `duplicate:suggestions:${IP}:[fingerprint]`);
  });

  it('preserves a Turnstile rejection when spam recording fails', async () => {
    redis.eval.mockRejectedValue(failure);
    expect(await submit({ token: '' })).toEqual({ ok: false, error: 'Complete the spam check and try again.' });
    expectRedisError('eval', `spam_attempts:${IP}`);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('waits for forced block persistence after a local rate limit is reached', async () => {
    redis.eval.mockImplementation(async (_script, [key]) => {
      if (key.startsWith('rate_limit:')) throw failure;
      return 1;
    });
    for (let i = 0; i < 5; i++) await submit();
    let resolveBlock;
    redis.set.mockImplementation(() => new Promise(resolve => { resolveBlock = resolve; }));
    let settled = false;
    const result = submit().then(value => { settled = true; return value; });
    for (let i = 0; i < 20 && !resolveBlock; i++) await Promise.resolve();
    expect(resolveBlock).toBeTypeOf('function');
    expect(settled).toBe(false);
    resolveBlock('OK');
    expect(await result).toMatchObject({ ok: false });
  });
});
