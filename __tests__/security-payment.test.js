import { describe, it, expect, vi, beforeEach, afterAll } from 'vitest';
import * as securityTestTools from '../app/test-tools/reveal-testing/revealTestConfig';
import { POST as sendGift } from '../app/api/send-gift/route';

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

describe('Security Hardening: Payment & Authorization', () => {
  beforeEach(() => {
    process.env = { ...originalEnv, STRIPE_SECRET_KEY: 'sk_test_security' };
    mocks.retrieve.mockReset();
    mocks.update.mockReset();
    mocks.getClientIp.mockClear();
    mocks.checkApiRateLimit.mockClear();
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('verifies test bypass is off in production', () => {
    expect(securityTestTools.REVEAL_TEST_MODE).toBe(false);
  });

  describe('server-authoritative /api/verify-session', () => {
    it('rejects an unpaid checkout session', async () => {
      mocks.retrieve.mockResolvedValue({
        payment_status: 'unpaid',
        metadata: { checkoutType: 'lucky_pick', luckyPickGame: '6' },
      });

      const response = await verifySession(
        new Request('http://localhost/api/verify-session?session_id=cs_unpaid'),
      );

      expect(response.status).toBe(402);
      expect(await response.json()).toEqual({ error: 'Payment not completed' });
    });

    it('rejects unsupported checkout types', async () => {
      mocks.retrieve.mockResolvedValue({
        payment_status: 'paid',
        metadata: { checkoutType: 'tip' },
      });

      const response = await verifySession(
        new Request('http://localhost/api/verify-session?session_id=cs_tip'),
      );

      expect(response.status).toBe(400);
      expect(await response.json()).toEqual({ error: 'Invalid checkout type' });
    });

    it('rejects an invalid or forged session ID when Stripe cannot retrieve it', async () => {
      mocks.retrieve.mockRejectedValue(new Error('No such checkout.session'));

      const response = await verifySession(
        new Request('http://localhost/api/verify-session?session_id=cs_forged'),
      );

      expect(response.status).toBe(400);
      expect(await response.json()).toEqual({ error: 'Invalid session' });
    });
  });

  describe('Legacy /api/send-gift endpoint', () => {
    it('is blocked outside of development environment', async () => {
      process.env.NODE_ENV = 'production';

      const request = new Request('http://localhost/api/send-gift', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          recipientEmail: 'test@example.com',
          revealId: '123'
        })
      });

      const response = await sendGift(request);

      expect(response.status).toBe(403);
      const data = await response.json();
      expect(data.error).toContain('restricted');
    });
  });
});
