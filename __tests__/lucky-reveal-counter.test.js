import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Guards for `specs/084-lucky-reveal-counter`.
 *
 * The tally module is exercised against a controllable database double, so the
 * duplicate-counting rule and the graceful zero state are proven by execution
 * rather than by reading the source. Source guards then pin the paid-only
 * recording points, the public read endpoint, the homepage placement and the
 * removal of the reveal popup's map invitation.
 */

const tallyStore = vi.hoisted(() => ({
  configured: true,
  sql: null,
  initializeDatabase: null,
}));

vi.mock('../app/lib/db-init', () => ({
  getSql: () => (tallyStore.configured ? tallyStore.sql : null),
  initializeDatabase: () => tallyStore.initializeDatabase(),
}));

import { getLuckyRevealCount, recordLuckyRevealCreated } from '../app/lucky-reveal-tally';

function createSql({ insertRows = [], countRows = [{ total: 0 }], fail = false } = {}) {
  const calls = [];
  const sql = (strings, ...values) => {
    const query = strings.join('?');
    calls.push({ query, values });

    if (fail) {
      return Promise.reject(new Error('database offline'));
    }
    if (query.includes('INSERT INTO lucky_reveal_tally')) {
      return Promise.resolve(insertRows);
    }
    if (query.includes('COUNT(*)')) {
      return Promise.resolve(countRows);
    }
    return Promise.resolve([]);
  };

  sql.calls = calls;
  return sql;
}

function read(relativePath) {
  return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

beforeEach(() => {
  tallyStore.configured = true;
  tallyStore.sql = createSql({ insertRows: [{ id: 1 }] });
  tallyStore.initializeDatabase = vi.fn(async () => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('Paid reveal tally recording', () => {
  it('counts a paid Personal Reveal once', async () => {
    const result = await recordLuckyRevealCreated({
      sessionId: 'cs_test_personal',
      revealType: 'lucky_pick',
    });

    expect(result).toEqual({ counted: true });
    const insert = tallyStore.sql.calls.find((call) => call.query.includes('INSERT'));
    expect(insert.values).toEqual(['cs_test_personal', 'lucky_pick']);
  });

  it('counts a paid Gift Reveal once', async () => {
    const result = await recordLuckyRevealCreated({
      sessionId: 'cs_test_gift',
      revealType: 'gift_package',
    });

    expect(result).toEqual({ counted: true });
    const insert = tallyStore.sql.calls.find((call) => call.query.includes('INSERT'));
    expect(insert.values).toEqual(['cs_test_gift', 'gift_package']);
    // The duplicate guard is the unique session id in a single atomic insert.
    expect(insert.query).toContain('ON CONFLICT (session_id) DO NOTHING');
    expect(insert.query).toContain('RETURNING id');
  });

  it('never counts the same purchase twice', async () => {
    // A repeat notification or page reload inserts nothing and reports no count.
    tallyStore.sql = createSql({ insertRows: [] });

    const result = await recordLuckyRevealCreated({
      sessionId: 'cs_test_duplicate',
      revealType: 'lucky_pick',
    });

    expect(result).toEqual({ counted: false });
    expect(tallyStore.sql.calls.filter((call) => call.query.includes('INSERT'))).toHaveLength(1);
  });

  it('rejects tips, missing sessions and unknown products without touching the store', async () => {
    const invalidRequests = [
      { sessionId: 'cs_test_tip', revealType: 'tip' },
      { sessionId: 'cs_test_preview', revealType: 'lucky_reveal' },
      { sessionId: '', revealType: 'lucky_pick' },
      { sessionId: 'cs_test_missing_type' },
      {},
    ];

    for (const request of invalidRequests) {
      const result = await recordLuckyRevealCreated(request);
      expect(result.counted).toBe(false);
    }

    expect(tallyStore.sql.calls).toHaveLength(0);
    expect(tallyStore.initializeDatabase).not.toHaveBeenCalled();
  });

  it('reports zero when the counter store is not configured', async () => {
    tallyStore.configured = false;

    const result = await recordLuckyRevealCreated({
      sessionId: 'cs_test_nodb',
      revealType: 'gift_package',
    });

    expect(result).toEqual({ counted: false, reason: 'unconfigured' });
    await expect(getLuckyRevealCount()).resolves.toBe(0);
  });

  it('reports zero and never throws when the store fails', async () => {
    tallyStore.sql = createSql({ fail: true });

    const result = await recordLuckyRevealCreated({
      sessionId: 'cs_test_failure',
      revealType: 'lucky_pick',
    });

    expect(result).toEqual({ counted: false, reason: 'error' });
    await expect(getLuckyRevealCount()).resolves.toBe(0);
  });
});

describe('Public reveal total', () => {
  it('reads the stored count, including a string count from the driver', async () => {
    tallyStore.sql = createSql({ countRows: [{ total: '4321' }] });

    await expect(getLuckyRevealCount()).resolves.toBe(4321);
    const query = tallyStore.sql.calls.find((call) => call.query.includes('COUNT(*)'));
    expect(query.query).toContain('FROM lucky_reveal_tally');
  });

  it('is zero for an empty table and for malformed or negative counts', async () => {
    tallyStore.sql = createSql({ countRows: [] });
    await expect(getLuckyRevealCount()).resolves.toBe(0);

    for (const total of [-3, 'not-a-number', null]) {
      tallyStore.sql = createSql({ countRows: [{ total }] });
      await expect(getLuckyRevealCount()).resolves.toBe(0);
    }
  });
});

describe('Counter storage schema', () => {
  const dbInitSource = read('app/lib/db-init.js');

  it('adds an empty, paid-only tally table with a unique session id', () => {
    expect(dbInitSource).toContain('CREATE TABLE IF NOT EXISTS lucky_reveal_tally');
    expect(dbInitSource).toMatch(/session_id TEXT NOT NULL UNIQUE/);
    expect(dbInitSource).toContain("CHECK (reveal_type IN ('lucky_pick', 'gift_package'))");
    // The count must start at zero, so no historical reveals are backfilled.
    expect(dbInitSource).not.toContain('INSERT INTO lucky_reveal_tally');
  });
});

describe('Paid completion recording points', () => {
  const verifySource = read('app/api/verify-session/route.ts');
  const giftDeliverySource = read('app/api/gift-delivery/route.js');
  const webhookSource = read('app/api/stripe-webhook/route.js');
  const checkoutSource = read('app/api/checkout/route.js');
  const endpointSource = read('app/api/lucky-reveals-count/route.js');

  it('records a verified paid session in the verification route', () => {
    expect(verifySource).toContain("import { recordLuckyRevealCreated } from '../../lucky-reveal-tally';");
    expect(verifySource).toContain(
      'recordLuckyRevealCreated({ sessionId, revealType: checkoutType })',
    );
    expect(verifySource.indexOf("session.payment_status !== 'paid'")).toBeLessThan(
      verifySource.indexOf('recordLuckyRevealCreated({'),
    );
  });

  it('records a verified paid gift before delivery in the gift-delivery route', () => {
    expect(giftDeliverySource).toContain(
      "recordLuckyRevealCreated({ sessionId: session.id, revealType: metadata.checkoutType })",
    );
    expect(giftDeliverySource.indexOf("session.payment_status !== 'paid'")).toBeLessThan(
      giftDeliverySource.indexOf('recordLuckyRevealCreated({'),
    );
    expect(giftDeliverySource.indexOf('recordLuckyRevealCreated({')).toBeLessThan(
      giftDeliverySource.indexOf('deliverGiftEmailForSession(stripe, session.id)'),
    );
  });

  it('records only paid reveal products from the stripe webhook', () => {
    expect(webhookSource).toContain("checkoutType !== 'gift_package' && checkoutType !== 'lucky_pick'");
    expect(webhookSource).toContain("session.payment_status === 'paid'");
    expect(webhookSource).toContain(
      'recordLuckyRevealCreated({ sessionId: session.id, revealType: checkoutType })',
    );
    expect(webhookSource.indexOf("session.payment_status === 'paid'")).toBeLessThan(
      webhookSource.indexOf('recordLuckyRevealCreated({'),
    );
    // The existing gift email delivery branch is still the only webhook action.
    expect(webhookSource).toContain('deliverGiftEmailForSession(stripe, session.id)');
  });

  it('does not record anything while creating a checkout session', () => {
    expect(checkoutSource).not.toContain('lucky-reveal-tally');
    expect(checkoutSource).not.toContain('recordLuckyRevealCreated');
  });

  it('serves the total without caching and without writes', () => {
    expect(endpointSource).toContain('getLuckyRevealCount');
    expect(endpointSource).toContain('{ total }');
    expect(endpointSource).toContain("'Cache-Control': 'no-store, max-age=0'");
    expect(endpointSource).not.toMatch(/export async function (POST|PUT|PATCH|DELETE)/);
  });
});

describe('Homepage counter and reveal popup', () => {
  const homepageSource = read('app/homepage/HomePage.js');
  const counterSource = read('app/homepage/LuckyRevealsCounter.js');
  const popupSource = read('app/lucky-reveal-popup.js');
  const homepageCss = read('themes/default/homepage.css');

  it('shows the exact label, starts at zero and reads the live total', () => {
    expect(counterSource).toContain('LUCKY REVEALS CREATED TO DATE');
    expect(counterSource).toContain('useState(0)');
    expect(counterSource).toContain("fetch('/api/lucky-reveals-count'");
    expect(counterSource).toContain("cache: 'no-store'");
    expect(counterSource).toContain('toLocaleString');
  });

  it('replaces the empty map slot between the reveal card and the Tip Jar', () => {
    expect(homepageSource).toContain("import LuckyRevealsCounter from './LuckyRevealsCounter';");
    expect(homepageSource).toContain('<LuckyRevealsCounter />');
    expect(homepageSource).not.toContain('homepage-map-slot');
    expect(homepageSource).not.toContain('id="lucky-map"');
    expect(homepageSource.indexOf('<LuckyRevealsCounter />')).toBeGreaterThan(
      homepageSource.indexOf('id="personalized"'),
    );
    expect(homepageSource.indexOf('<LuckyRevealsCounter />')).toBeLessThan(
      homepageSource.indexOf('id="tip-jar-section"'),
    );
  });

  it('styles the counter in neon gold and respects reduced motion', () => {
    expect(homepageCss).toContain('.homepage-reveals-counter {');
    expect(homepageCss).toContain('.homepage-reveals-counter-number');
    expect(homepageCss).toContain('lucky-reveal-counter-sheen');
    expect(homepageCss).toMatch(
      /@media \(prefers-reduced-motion: reduce\) \{\s*\.homepage-reveals-counter::before \{ animation: none !important; \}/,
    );
    expect(homepageCss).not.toContain('.homepage-map-slot');
  });

  it('removes the Little Luck Map invitation from the reveal popup', () => {
    expect(popupSource).not.toContain('Add me to the Little Luck Map');
    expect(popupSource).not.toContain('lucky-map-button-enhanced');
    expect(popupSource).not.toContain('playButtonClick');

    // The reveal and every remaining control are untouched.
    for (const token of [
      'Your lucky reveal is here',
      'Payment complete',
      'ShareLuckyPickButton',
      'Close lucky reveal',
      'lucky-reveal-number',
      'prefers-reduced-motion',
    ]) {
      expect(popupSource).toContain(token);
    }
  });
});
