// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  retrieve: vi.fn(),
  update: vi.fn(),
  sql: vi.fn(),
  getSql: vi.fn(),
  initializeDatabase: vi.fn(),
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

vi.mock('../app/lib/db-init', () => ({
  getSql: mocks.getSql,
  initializeDatabase: mocks.initializeDatabase,
}));
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
const ALTERNATE = {
  game: { name: '6 Pick', numbers: [2, 8, 17, 25, 34, 49] },
  luckyColor: 'Star Gold',
  luckyDay: 'Friday',
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

/** In-memory stores that simulate the external systems used by the route. */
let storedMetadata;
let storedDbReveals;

function configureDatabase() {
  mocks.getSql.mockReturnValue(mocks.sql);
  mocks.initializeDatabase.mockResolvedValue(undefined);
  mocks.sql.mockImplementation(async (strings, ...values) => {
    const query = strings.join('');

    if (query.includes('SELECT game, numbers, lucky_color, lucky_day') && query.includes('FROM lucky_reveals')) {
      const sessionId = values[0];
      return storedDbReveals[sessionId] ? [...storedDbReveals[sessionId]] : [];
    }

    if (query.includes('INSERT INTO lucky_reveals')) {
      const [sessionId, game, numbers, luckyColor, luckyDay] = values;

      // Simulate PostgreSQL ON CONFLICT (session_id) DO NOTHING: the first
      // insert wins and a concurrent insert cannot overwrite it.
      if (!storedDbReveals[sessionId]) {
        storedDbReveals[sessionId] = [{
          game,
          numbers,
          lucky_color: luckyColor,
          lucky_day: luckyDay,
        }];
      }
      return [];
    }

    throw new Error(`Unexpected SQL query: ${query}`);
  });
}

beforeEach(() => {
  vi.resetModules();
  vi.resetAllMocks();
  vi.stubEnv('STRIPE_SECRET_KEY', 'sk_test_key');

  storedMetadata = { checkoutType: 'lucky_pick', luckyPickGame: '6' };
  storedDbReveals = {};

  mocks.createLuckyReveal.mockReturnValue(GENERATED);
  mocks.retrieve.mockImplementation(async () => ({ ...paidSession(), metadata: { ...storedMetadata } }));
  mocks.update.mockImplementation(async (_id, { metadata }) => {
    storedMetadata = { ...metadata };
    return { ...paidSession(), metadata: { ...storedMetadata } };
  });
  configureDatabase();
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});

describe('Paid Lucky Pick reveal persistence', () => {
  it('persists a generated reveal on first verification', async () => {
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
    expect(storedDbReveals[SESSION_ID]).toEqual([{
      game: '6',
      numbers: '3,11,19,24,40,47',
      lucky_color: GENERATED.luckyColor,
      lucky_day: GENERATED.luckyDay,
    }]);
  });

  it('returns the existing authoritative DB reveal without generating or overwriting it', async () => {
    storedDbReveals[SESSION_ID] = [{
      game: '6',
      numbers: '1,5,9,13,22,33',
      lucky_color: 'Star Gold',
      lucky_day: 'Friday',
    }];

    const { response, body } = await callVerify();

    expect(response.status).toBe(200);
    expect(body.reveal).toEqual({
      game: '6',
      numbers: [1, 5, 9, 13, 22, 33],
      luckyColor: 'Star Gold',
      luckyDay: 'Friday',
    });
    expect(mocks.createLuckyReveal).not.toHaveBeenCalled();
    expect(mocks.update).not.toHaveBeenCalled();
  });

  it('preserves a valid Stripe metadata reveal when migrating it into the database', async () => {
    storedMetadata = {
      checkoutType: 'lucky_pick',
      luckyPickGame: '6',
      luckyPickNumbers: '7,14,21,28,35,42',
      luckyPickLuckyColor: 'Fortune Blue',
      luckyPickLuckyDay: 'Wednesday',
    };

    const { response, body } = await callVerify();

    expect(response.status).toBe(200);
    expect(body.reveal).toEqual({
      game: '6',
      numbers: [7, 14, 21, 28, 35, 42],
      luckyColor: 'Fortune Blue',
      luckyDay: 'Wednesday',
    });
    expect(storedDbReveals[SESSION_ID]).toEqual([{
      game: '6',
      numbers: '7,14,21,28,35,42',
      lucky_color: 'Fortune Blue',
      lucky_day: 'Wednesday',
    }]);
    expect(mocks.createLuckyReveal).not.toHaveBeenCalled();
  });

  it('returns the same authoritative reveal for concurrent verification requests', async () => {
    mocks.createLuckyReveal
      .mockReturnValueOnce(GENERATED)
      .mockReturnValueOnce(ALTERNATE);

    const results = await Promise.all([callVerify(), callVerify()]);

    expect(results[0].response.status).toBe(200);
    expect(results[1].response.status).toBe(200);
    expect(results[0].body.reveal).toEqual(results[1].body.reveal);
    expect(results[0].body.reveal.numbers).toEqual(GENERATED.game.numbers);
    expect(storedDbReveals[SESSION_ID]).toHaveLength(1);
    expect(mocks.createLuckyReveal).toHaveBeenCalledTimes(2);
  });

  it('returns 500 when database persistence fails', async () => {
    mocks.sql.mockRejectedValue(new Error('Database connection failed'));
    vi.spyOn(console, 'error').mockImplementation(() => {});

    const { response, body } = await callVerify();

    expect(response.status).toBe(500);
    expect(body.error).toBe('Database persistence failed');
  });

  it('uses valid Stripe metadata when the database is fundamentally unconfigured', async () => {
    mocks.getSql.mockReturnValue(null);
    storedMetadata = {
      checkoutType: 'lucky_pick',
      luckyPickGame: '6',
      luckyPickNumbers: '1,5,9,13,22,33',
      luckyPickLuckyColor: 'Star Gold',
      luckyPickLuckyDay: 'Friday',
    };

    const { response, body } = await callVerify();

    expect(response.status).toBe(200);
    expect(body.reveal).toEqual({
      game: '6',
      numbers: [1, 5, 9, 13, 22, 33],
      luckyColor: 'Star Gold',
      luckyDay: 'Friday',
    });
    expect(mocks.createLuckyReveal).not.toHaveBeenCalled();
  });

  it('returns 500 when the database is unconfigured and no valid Stripe reveal exists', async () => {
    mocks.getSql.mockReturnValue(null);
    vi.spyOn(console, 'error').mockImplementation(() => {});

    const { response, body } = await callVerify();

    expect(response.status).toBe(500);
    expect(body.error).toBe('Database persistence unavailable');
    expect(mocks.createLuckyReveal).not.toHaveBeenCalled();
  });

  it('rejects an invalid game value returned from the database', async () => {
    storedDbReveals[SESSION_ID] = [{
      game: '5',
      numbers: '1,5,9,13,22,33',
      lucky_color: 'Star Gold',
      lucky_day: 'Friday',
    }];
    vi.spyOn(console, 'error').mockImplementation(() => {});

    const { response, body } = await callVerify();

    expect(response.status).toBe(500);
    expect(body.error).toBe('Invalid stored reveal data');
  });

  it('rejects an invalid game value returned after an insert attempt', async () => {
    let insert = true;
    mocks.sql.mockImplementation(async (strings, ...values) => {
      const query = strings.join('');

      if (query.includes('SELECT game, numbers, lucky_color, lucky_day') && query.includes('FROM lucky_reveals')) {
        return insert ? [] : storedDbReveals[SESSION_ID];
      }

      if (query.includes('INSERT INTO lucky_reveals')) {
        storedDbReveals[SESSION_ID] = [{
          game: '5',
          numbers: values[2],
          lucky_color: values[3],
          lucky_day: values[4],
        }];
        insert = false;
        return [];
      }

      throw new Error(`Unexpected SQL query: ${query}`);
    });
    vi.spyOn(console, 'error').mockImplementation(() => {});

    const { response, body } = await callVerify();

    expect(response.status).toBe(500);
    expect(body.error).toBe('Invalid stored reveal data');
  });

  it('rejects out-of-range database numbers', async () => {
    storedDbReveals[SESSION_ID] = [{
      game: '6',
      numbers: '1,5,9,13,22,99',
      lucky_color: 'Star Gold',
      lucky_day: 'Friday',
    }];
    vi.spyOn(console, 'error').mockImplementation(() => {});

    const { response, body } = await callVerify();

    expect(response.status).toBe(500);
    expect(body.error).toBe('Invalid stored reveal data');
  });

  it('rejects duplicate database numbers', async () => {
    storedDbReveals[SESSION_ID] = [{
      game: '6',
      numbers: '1,5,9,13,22,5',
      lucky_color: 'Star Gold',
      lucky_day: 'Friday',
    }];
    vi.spyOn(console, 'error').mockImplementation(() => {});

    const { response, body } = await callVerify();

    expect(response.status).toBe(500);
    expect(body.error).toBe('Invalid stored reveal data');
  });

  it('rejects missing required database fields', async () => {
    storedDbReveals[SESSION_ID] = [{
      game: '6',
      numbers: '1,5,9,13,22,33',
      lucky_color: '',
      lucky_day: 'Friday',
    }];
    vi.spyOn(console, 'error').mockImplementation(() => {});

    const { response, body } = await callVerify();

    expect(response.status).toBe(500);
    expect(body.error).toBe('Invalid stored reveal data');
  });
});
