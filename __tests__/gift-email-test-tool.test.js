import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const mocks = vi.hoisted(() => ({
  enabled: true,
  rateLimit: { ok: true },
}));

vi.mock('../app/test-tools/gift-email/giftEmailTestConfig', () => ({
  isGiftEmailTestEnabled: () => mocks.enabled,
}));

vi.mock('../app/spam-protection', () => ({
  getClientIp: () => '203.0.113.10',
  checkApiRateLimit: async () => mocks.rateLimit,
}));

import { POST } from '../app/api/test-tools/gift-email/route';

const originalEnv = { ...process.env };
const originalFetch = global.fetch;

const VALID_BODY = {
  recipientEmail: ' Recipient@Example.com ',
  recipientName: 'Alex',
  senderName: 'Sam',
  giftMessage: 'Happy birthday, Alex!',
  luckyPickGame: '6',
};

function makeRequest(body, { origin = 'https://luckypickcanada.ca' } = {}) {
  return new Request('https://luckypickcanada.ca/api/test-tools/gift-email', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      ...(origin ? { origin } : {}),
    },
    body: JSON.stringify(body),
  });
}

function resendAccepted() {
  global.fetch = vi.fn().mockResolvedValue({
    ok: true,
    text: vi.fn().mockResolvedValue('{"id":"re_test_123"}'),
  });
}

function expectValidNumbers(numbers, count, max) {
  expect(numbers).toHaveLength(count);
  expect(new Set(numbers).size).toBe(count);

  for (const number of numbers) {
    expect(Number.isInteger(number)).toBe(true);
    expect(number).toBeGreaterThanOrEqual(1);
    expect(number).toBeLessThanOrEqual(max);
  }
}

describe('Gift email test route', () => {
  beforeEach(() => {
    mocks.enabled = true;
    mocks.rateLimit = { ok: true };
    process.env = {
      ...originalEnv,
      RESEND_API_KEY: 'test-resend-key',
      GIFT_FROM_EMAIL: 'gifts@example.com',
    };
    resendAccepted();
  });

  afterEach(() => {
    process.env = originalEnv;
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it('sends the real 6 Pick gift email without any test secret', async () => {
    const response = await POST(makeRequest(VALID_BODY));

    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('no-store');

    const data = await response.json();

    expect(data).toMatchObject({
      ok: true,
      deliveryStatus: 'sent',
      recipientEmail: 'recipient@example.com',
    });
    expect(data.reveal.gameName).toBe('6 Pick');
    expectValidNumbers(data.reveal.numbers, 6, 49);
    expect(data.reveal.luckyColor).toEqual(expect.any(String));
    expect(data.reveal.luckyDay).toEqual(expect.any(String));

    expect(global.fetch).toHaveBeenCalledTimes(1);
    const [url, request] = global.fetch.mock.calls[0];

    expect(url).toBe('https://api.resend.com/emails');
    expect(request.headers.Authorization).toBe('Bearer test-resend-key');
    expect(request.headers['Idempotency-Key']).toBeUndefined();

    const payload = JSON.parse(request.body);

    expect(payload.to).toBe('recipient@example.com');
    expect(payload.from).toBe('gifts@example.com');
    expect(payload.subject).toContain('Sam');
    expect(payload.html).toContain('Alex');
    expect(payload.html).toContain('Happy birthday, Alex!');
    expect(payload.html).toContain(data.reveal.gameName);
    for (const number of data.reveal.numbers) {
      expect(payload.html).toContain(`>${number}</span>`);
    }
  });

  it('uses the 7 Pick game rules when 7 Pick is selected', async () => {
    const response = await POST(makeRequest({ ...VALID_BODY, luckyPickGame: '7' }));

    expect(response.status).toBe(200);

    const data = await response.json();

    expect(data.reveal.gameName).toBe('7 Pick');
    expectValidNumbers(data.reveal.numbers, 7, 50);

    const payload = JSON.parse(global.fetch.mock.calls[0][1].body);

    expect(payload.html).toContain('7 Pick');
  });

  it('rejects an invalid recipient email before contacting Resend', async () => {
    const response = await POST(makeRequest({ ...VALID_BODY, recipientEmail: 'not-an-email' }));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: 'Enter a valid recipient email address.',
    });
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('reports a clear configuration error when the server Resend settings are missing', async () => {
    delete process.env.RESEND_API_KEY;

    const response = await POST(makeRequest(VALID_BODY));
    const data = await response.json();

    expect(response.status).toBe(503);
    expect(data.error).toContain('RESEND_API_KEY');
    expect(data.error).toContain('GIFT_FROM_EMAIL');
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('never reports success or exposes provider details when Resend rejects the email', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      text: vi.fn().mockResolvedValue('Provider rejection detail'),
    });

    const response = await POST(makeRequest(VALID_BODY));
    const data = await response.json();

    expect(response.status).toBe(502);
    expect(data.ok).toBeUndefined();
    expect(data.reveal).toBeUndefined();
    expect(data.error).not.toContain('Provider rejection detail');
  });

  it('accepts a same-site request even when the internal request URL resolves to another host', async () => {
    const request = new Request('http://internal-service:3000/api/test-tools/gift-email', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-forwarded-host': 'luckypickcanada.ca',
        origin: 'https://luckypickcanada.ca',
      },
      body: JSON.stringify(VALID_BODY),
    });

    const response = await POST(request);

    expect(response.status).toBe(200);
  });

  it('rejects a request made from another site', async () => {
    const response = await POST(
      makeRequest(VALID_BODY, { origin: 'https://evil.example' }),
    );

    expect(response.status).toBe(403);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('throttles repeated sends from the same address', async () => {
    mocks.rateLimit = { ok: false };

    const response = await POST(makeRequest(VALID_BODY));

    expect(response.status).toBe(429);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('is unavailable when the test switch is off', async () => {
    mocks.enabled = false;

    const response = await POST(makeRequest(VALID_BODY));

    expect(response.status).toBe(404);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('keeps the test secret, credentials and payment flow out of the tool', () => {
    const root = process.cwd();
    const routeSource = fs.readFileSync(
      path.join(root, 'app/api/test-tools/gift-email/route.js'),
      'utf8',
    );
    const clientSource = fs.readFileSync(
      path.join(root, 'app/test-tools/gift-email/GiftEmailTestForm.jsx'),
      'utf8',
    );
    const pageSource = fs.readFileSync(
      path.join(root, 'app/test-tools/gift-email/page.js'),
      'utf8',
    );

    expect(routeSource).not.toContain('GIFT_TEST_SECRET');
    expect(routeSource).not.toContain('/api/checkout');
    expect(routeSource).not.toContain("from 'stripe'");
    expect(routeSource).not.toContain('new Stripe');
    expect(routeSource).toContain('process.env.RESEND_API_KEY');
    expect(routeSource).toContain('process.env.GIFT_FROM_EMAIL');

    expect(clientSource).not.toContain('process.env');
    expect(clientSource).not.toContain('RESEND_API_KEY');
    expect(clientSource).not.toContain('GIFT_TEST_SECRET');

    expect(pageSource).not.toContain('RESEND_API_KEY');
    expect(pageSource).not.toContain('GIFT_TEST_SECRET');
  });
});
