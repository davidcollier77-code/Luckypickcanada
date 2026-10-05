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
    expectDatabaseConfigured();
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
    expect(storedDbReveals[SESSION_ID]).toBeDefined();
    expect(storedDbReveals[SESSION_ID][0].numbers).toBe('3,11,19,24,40,47');
  });

  it('returns the identical persisted reveal on a second verification', async () => {
    expectRedisConfigured();
    expectDatabaseConfigured();
    storedDbReveals[SESSION_ID] = [{
      game: '6',
      numbers: '1,5,9,13,22,33',
      lucky_color: 'Star Gold',
      lucky_day: 'Friday',
    }];

    const { response, body } = await callVerify();

    expect(response.status).toBe(200);
    expect(body.reveal.numbers).toEqual([1, 5, 9, 13, 22, 33]);
    expect(body.reveal.luckyColor).toBe('Star Gold');
    expect(mocks.update).toHaveBeenCalled();
    expect(mocks.createLuckyReveal).not.toHaveBeenCalled();
  });

  it('preserves existing reveals from Stripe metadata during migration', async () => {
    expectDatabaseConfigured();
    storedMetadata = {
      ...storedMetadata,
      luckyPickNumbers: '7,14,21,28,35,42',
      luckyPickLuckyColor: 'Fortune Blue',
      luckyPickLuckyDay: 'Wednesday',

    const { response, body } = await callVerify();

    expect(response.status).toBe(200);
    expect(body.reveal.numbers).toEqual([1, 5, 9, 13, 22, 33]);
    expect(body.reveal.numbers).toEqual([7, 14, 21, 28, 35, 42]);
    expect(body.reveal.luckyColor).toBe('Fortune Blue');
    expect(body.reveal.luckyDay).toBe('Wednesday');
    // Verify the Stripe metadata was used to seed the database
    expect(storedDbReveals[SESSION_ID][0].numbers).toBe('7,14,21,28,35,42');
    expect(mocks.redis.set).not.toHaveBeenCalled();

  it('does not generate a second reveal while another request holds the lock', async () => {
  it('handles concurrent inserts with ON CONFLICT DO NOTHING', async () => {
    expectDatabaseConfigured();
    let insertCount = 0;
    mocks.sql.mockImplementation(async (strings, ...values) => {
      const query = strings.join('?');
      if (query.includes('SELECT') && query.includes('FROM lucky_reveals')) {
        const sessionId = values[0];
        return storedDbReveals[sessionId] || [];
      }
      if (query.includes('INSERT INTO lucky_reveals')) {
        const [sessionId, game, numbers, luckyColor, luckyDay] = values;
        // Simulate concurrent insert: first one wins
        if (insertCount === 0) {
          storedDbReveals[sessionId] = [{ game, numbers, lucky_color: luckyColor, lucky_day: luckyDay }];
          insertCount++;
        }
        // ON CONFLICT DO NOTHING - second insert does nothing
        return [];
      }
      return [];
    });
    const { response, body } = await callVerify();

    expect(response.status).toBe(409);
    expect(response.status).toBe(200);
    expect(body.reveal.numbers).toEqual(GENERATED.game.numbers);

  it('reuses a concurrently persisted reveal instead of failing with 409', async () => {
  it('returns 500 error when database is unavailable', async () => {
    mocks.getSql.mockReturnValue(mocks.sql);
    mocks.initializeDatabase.mockResolvedValue();
    mocks.sql.mockRejectedValue(new Error('Database connection failed'));
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const { response, body } = await callVerify();

    expect(response.status).toBe(200);
    expect(response.status).toBe(500);
    expect(body.error).toBe('Database persistence failed');

  it('still generates and persists the reveal when the lock backend is unavailable', async () => {
  it('still generates and persists the reveal when the database is unconfigured', async () => {
    mocks.getSql.mockReturnValue(null);
    storedMetadata = {
      ...storedMetadata,
      luckyPickNumbers: '1,5,9,13,22,33',
      luckyPickLuckyColor: 'Star Gold',
      luckyPickLuckyDay: 'Friday',
    };

    const { response, body } = await callVerify();

    expect(response.status).toBe(200);
    expect(body.reveal.numbers).toEqual(GENERATED.game.numbers);
    expect(body.reveal.numbers).toEqual([1, 5, 9, 13, 22, 33]);

  it('rejects tampered reveal metadata instead of serving it', async () => {
  it('rejects invalid reveal data from database', async () => {
    expectDatabaseConfigured();
    storedDbReveals[SESSION_ID] = [{
      game: '6',
      numbers: '1,5,9,13,22,99', // 99 is out of range for a 6 pick
      lucky_color: 'Star Gold',
      lucky_day: 'Friday',
    }];
    vi.spyOn(console, 'error').mockImplementation(() => {});

    const { response, body } = await callVerify();

    expect(response.status).toBe(500);
    expect(body.error).toBe('Invalid stored reveal data');
  });

  it('rejects duplicate numbers in database reveal data', async () => {
    expectDatabaseConfigured();
    storedDbReveals[SESSION_ID] = [{
      game: '6',
      numbers: '1,5,9,13,22,5', // duplicate 5
      lucky_color: 'Star Gold',
      lucky_day: 'Friday',
    }];
    vi.spyOn(console, 'error').mockImplementation(() => {});

    const { response, body } = await callVerify();

    expect(response.status).toBe(500);
    expect(body.error).toBe('Invalid stored reveal data');
  });

  it('rejects missing required fields in database reveal data', async () => {
    expectDatabaseConfigured();
    storedDbReveals[SESSION_ID] = [{
      game: '6',
      numbers: '1,5,9,13,22,33',
      lucky_color: '', // missing color
      lucky_day: 'Friday',
    }];
    vi.spyOn(console, 'error').mockImplementation(() => {});

    const { response, body } = await callVerify();

    expect(response.status).toBe(500);
    expect(body.error).toBe('Invalid stored reveal data');
  });
});