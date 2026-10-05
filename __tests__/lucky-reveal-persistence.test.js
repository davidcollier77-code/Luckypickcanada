// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  retrieve: vi.fn(),
  update: vi.fn(),
  redis: { set: vi.fn(), eval: vi.fn() },
  fromEnv: vi.fn(),
  createLuckyReveal: vi.fn(),
}));

vi.mock('stripe', () => {
  const MockStripe = function MockStripe() {
    this.checkout = {
      sessions: {
        retrieve: mocks.retrieve,
        update: mocks.update,
      },
    };
  };
  MockStripe.createFetchHttpClient = () => ({});
  return { default: MockStripe };
});

vi.mock('@upstash/redis', () => ({ Redis: { fromEnv: mocks.fromEnv } }));
vi.mock('../app/lucky-reveal', () => ({ createLuckyReveal: mocks.createLuckyReveal }));
vi.mock('../app/spam-protection', () => ({
  getClientIp: () => '192.0.2.1',
  checkApiRateLimit: async () => ({ ok: true }),
}));

const SESSION_ID = 'cs_test_paid_session';
const GENERATED = {
  game: { name: '6 Pick', numbers: [3, 11, 19, 24, 40, 47] },
  luckyColor: 'Aurora Green',
  luckyDay: 'Tuesday',
};

function paidSession(metadata = {}) {
  return {
    id: SESSION_ID,
    payment_status: 'paid',
    metadata: { checkoutType: 'lucky_pick', luckyPickGame: '6', ...metadata },
  };
}

function verify() {
  // The extension is explicit because an empty route.js sits next to route.ts.
  return import('../app/api/verify-session/route.ts');
}

function request() {
  return new Request(`https://example.test/api/verify-session?session_id=${SESSION_ID}`);
}

async function callVerify() {
  const { GET } = await verify();
  const response = await GET(request());
  return { response, body: await response.json() };
}

/** In-memory Stripe metadata store so updates are visible to later retrieves. */
let storedMetadata;

function expectRedisConfigured() {
  vi.stubEnv('UPSTASH_REDIS_REST_URL', 'https://redis.example.test');
  vi.stubEnv('UPSTASH_REDIS_REST_TOKEN', 'test-token');
  mocks.fromEnv.mockReturnValue(mocks.redis);
}

beforeEach(() => {
  vi.resetModules();
  vi.resetAllMocks();
  vi.stubEnv('STRIPE_SECRET_KEY', 'sk_test_key');

  storedMetadata = { checkoutType: 'lucky_pick', luckyPickGame: '6' };
  mocks.createLuckyReveal.mockReturnValue(GENERATED);
  mocks.retrieve.mockImplementation(async () => ({ ...paidSession(), metadata: { ...storedMetadata } }));
  mocks.update.mockImplementation(async (_id, { metadata }) => {
    storedMetadata = { ...metadata };
    return { ...paidSession(), metadata: { ...storedMetadata } };
  });
  mocks.redis.set.mockResolvedValue('OK');
  mocks.redis.eval.mockResolvedValue(1);
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('Paid Lucky Pick reveal persistence', () => {
  it('persists a generated reveal on first verification', async () => {
    expectRedisConfigured();

    const { response, body } = await callVerify();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.reveal).toEqual({
      game: '6',
      numbers: GENERATED.game.numbers,
      luckyColor: GENERATED.luckyColor,
      luckyDay: GENERATED.luckyDay,
    });
    expect(storedMetadata.luckyPickNumbers).toBe('3,11,19,24,40,47');
    expect(mocks.update).toHaveBeenCalledTimes(1);
  });

  it('returns the identical persisted reveal on a second verification', async () => {
    expectRedisConfigured();
    storedMetadata = {
      ...storedMetadata,
      luckyPickNumbers: '1,5,9,13,22,33',
      luckyPickLuckyColor: 'Star Gold',
      luckyPickLuckyDay: 'Friday',
    };

    const { response, body } = await callVerify();

    expect(response.status).toBe(200);
    expect(body.reveal.numbers).toEqual([1, 5, 9, 13, 22, 33]);
    expect(body.reveal.luckyColor).toBe('Star Gold');
    expect(mocks.update).not.toHaveBeenCalled();
    expect(mocks.createLuckyReveal).not.toHaveBeenCalled();
    expect(mocks.redis.set).not.toHaveBeenCalled();
  });

  it('does not generate a second reveal while another request holds the lock', async () => {
    expectRedisConfigured();
    mocks.redis.set.mockResolvedValue(null); // lock already held by a concurrent request

    const { response, body } = await callVerify();

    expect(response.status).toBe(409);
    expect(body.error).toContain('another request');
    expect(mocks.update).not.toHaveBeenCalled();
    expect(mocks.createLuckyReveal).not.toHaveBeenCalled();
  });

  it('reuses a concurrently persisted reveal instead of failing with 409', async () => {
    expectRedisConfigured();
    mocks.redis.set.mockResolvedValue(null);
    // The concurrent request finished writing before our re-read of Stripe.
    mocks.retrieve
      .mockResolvedValueOnce({ ...paidSession(), metadata: { ...storedMetadata } })
      .mockResolvedValue({
        ...paidSession(),
        metadata: {
          ...storedMetadata,
          luckyPickNumbers: '2,4,8,16,32,40',
          luckyPickLuckyColor: 'Lucky Red',
          luckyPickLuckyDay: 'Monday',
        },
      });

    const { response, body } = await callVerify();

    expect(response.status).toBe(200);
    expect(body.reveal.numbers).toEqual([2, 4, 8, 16, 32, 40]);
    expect(mocks.update).not.toHaveBeenCalled();
  });

  it('still generates and persists the reveal when the lock backend is unavailable', async () => {
    // No Upstash env vars configured: getRedisClient() returns null.
    vi.stubEnv('UPSTASH_REDIS_REST_URL', '');
    vi.stubEnv('UPSTASH_REDIS_REST_TOKEN', '');
    vi.spyOn(console, 'error').mockImplementation(() => {});

    const { response, body } = await callVerify();

    expect(response.status).toBe(200);
    expect(body.reveal.numbers).toEqual(GENERATED.game.numbers);
    expect(mocks.update).toHaveBeenCalledTimes(1);
  });

  it('rejects tampered reveal metadata instead of serving it', async () => {
    expectRedisConfigured();
    storedMetadata = {
      ...storedMetadata,
      luckyPickNumbers: '1,5,9,13,22,99', // 99 is out of range for a 6 pick
      luckyPickLuckyColor: 'Star Gold',
      luckyPickLuckyDay: 'Friday',
    };

    const { response, body } = await callVerify();

    expect(response.status).toBe(200);
    expect(body.reveal.numbers).toEqual(GENERATED.game.numbers);
    expect(mocks.update).toHaveBeenCalledTimes(1);
  });

  it('rejects duplicate numbers in persisted metadata', async () => {
    expectRedisConfigured();
    storedMetadata = {
      ...storedMetadata,
      luckyPickNumbers: '1,5,9,13,22,5',
      luckyPickLuckyColor: 'Star Gold',
      luckyPickLuckyDay: 'Friday',
    };

    const { body } = await callVerify();

    expect(body.reveal.numbers).toEqual(GENERATED.game.numbers);
  });

  it('keeps the lock when the Stripe update cannot be verified', async () => {
    expectRedisConfigured();
    vi.spyOn(console, 'error').mockImplementation(() => {});
    // The update and both verification re-reads all return unusable metadata.
    mocks.update.mockResolvedValue({ ...paidSession(), metadata: { ...storedMetadata } });

    const { response } = await callVerify();

    expect(response.status).toBe(400);
    expect(mocks.redis.eval).not.toHaveBeenCalled();
  });
});