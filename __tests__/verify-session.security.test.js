import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const mocks = vi.hoisted(() => ({
  retrieve: vi.fn(),
  update: vi.fn(),
  getClientIp: vi.fn(() => '127.0.0.1'),
  checkApiRateLimit: vi.fn(async () => ({ ok: true })),
}));

vi.mock('stripe', () => {
  const Stripe = vi.fn(function StripeMock() {
    return {
      checkout: {
        sessions: {
          retrieve: mocks.retrieve,
          update: mocks.update,
        },
      },
    };
  });
  Stripe.createFetchHttpClient = vi.fn();
  return { default: Stripe };
});

vi.mock('../app/spam-protection', () => ({
  getClientIp: mocks.getClientIp,
  checkApiRateLimit: mocks.checkApiRateLimit,
}));

import { GET as verifySession } from '../app/api/verify-session/route';

const originalEnv = process.env;

describe('verify-session security regressions', () => {
  beforeEach(() => {
    process.env = { ...originalEnv, STRIPE_SECRET_KEY: 'sk_test_security' };
    mocks.retrieve.mockReset();
    mocks.update.mockReset();
    mocks.getClientIp.mockClear();
    mocks.checkApiRateLimit.mockClear();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('returns only an allowlisted metadata subset for gift sessions', async () => {
    mocks.retrieve.mockResolvedValue({
      payment_status: 'paid',
      metadata: {
        checkoutType: 'gift_package',
        luckyPickGame: '6',
        recipientEmail: 'recipient@example.com',
        recipientName: 'Recipient',
        senderName: 'Sender',
        giftMessage: 'Private message',
        giftDeliveredAt: '2026-10-05T00:00:00.000Z',
        giftNumbers: '1,2,3,4,5,6',
        giftLuckyColor: 'Star Gold',
        giftLuckyDay: 'Friday',
      },
    });

    const response = await verifySession(
      new Request('http://localhost/api/verify-session?session_id=cs_test_gift'),
    );
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.metadata).toEqual({
      checkoutType: 'gift_package',
      giftDeliveredAt: '2026-10-05T00:00:00.000Z',
      giftNumbers: '1,2,3,4,5,6',
      giftLuckyColor: 'Star Gold',
      giftLuckyDay: 'Friday',
    });
    expect(data.metadata.recipientEmail).toBeUndefined();
    expect(data.metadata.recipientName).toBeUndefined();
    expect(data.metadata.senderName).toBeUndefined();
    expect(data.metadata.giftMessage).toBeUndefined();
    expect(data.reveal).toBeUndefined();
  });

  it('returns the same reveal for concurrent requests even before Stripe persistence completes', async () => {
    const session = {
      payment_status: 'paid',
      metadata: {
        checkoutType: 'lucky_pick',
        luckyPickGame: '6',
      },
    };

    mocks.retrieve.mockImplementation(async () => ({
      payment_status: session.payment_status,
      metadata: { ...session.metadata },
    }));
    mocks.update.mockImplementation(async (_sessionId, params) => {
      session.metadata = { ...params.metadata };
      return { metadata: { ...session.metadata } };
    });

    const request = new Request(
      'http://localhost/api/verify-session?session_id=cs_test_lucky',
    );

    const firstResponse = await verifySession(request);
    const firstData = await firstResponse.json();
    const secondResponse = await verifySession(request);
    const secondData = await secondResponse.json();

    expect(firstResponse.status).toBe(200);
    expect(secondResponse.status).toBe(200);
    expect(firstData.reveal).toEqual(secondData.reveal);
    expect(firstData.game).toBe('6');
    expect(firstData.reveal.numbers).toHaveLength(6);
    expect(new Set(firstData.reveal.numbers).size).toBe(6);
    expect(mocks.update).toHaveBeenCalledTimes(2);
  });
});
