import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Redis } from '@upstash/redis';
import { deliverGiftEmailForSession } from '../app/gift-email';

const NOW = Date.parse('2026-10-29T17:00:00.000Z');
const originalEnv = process.env;
const originalFetch = global.fetch;

function makeSession(metadata = {}) {
  return {
    id: 'cs_test_123',
    payment_status: 'paid',
    amount_total: 299,
    currency: 'cad',
    metadata: {
      checkoutType: 'gift_package',
      recipientEmail: 'test@test.com',
      recipientName: 'Test Recipient',
      senderName: 'Sender',
      ...metadata,
    },
  };
}

function mockResendSuccess() {
  global.fetch.mockResolvedValue({
    ok: true,
    text: vi.fn().mockResolvedValue('{"id":"re_test_123"}'),
  });
}

function expectOwnedLockReleased(redisMock) {
  expect(redisMock.eval).toHaveBeenCalledWith(
    expect.stringContaining('redis.call("GET", KEYS[1])'),
    ['gift-delivery-lock:cs_test_123'],
    ['cs_test_123-' + NOW + '-mocked-uuid'],
  );
}

describe('Gift delivery error handling', () => {
  let currentSession;
  let mockStripe;
  let redisMock;

  beforeEach(() => {
    vi.resetAllMocks();
    process.env = {
      ...originalEnv,
      UPSTASH_REDIS_REST_URL: 'mock-url',
      UPSTASH_REDIS_REST_TOKEN: 'mock-token',
      RESEND_API_KEY: 'test-resend-key',
      GIFT_FROM_EMAIL: 'test@example.com',
    };
    global.fetch = vi.fn();
    currentSession = makeSession();

    mockStripe = {
      checkout: {
        sessions: {
          retrieve: vi.fn().mockImplementation(async () => structuredClone(currentSession)),
          update: vi.fn().mockImplementation(async (_sessionId, params) => {
            for (const [key, value] of Object.entries(params.metadata)) {
              if (value === null || value === '') {
                delete currentSession.metadata[key];
              } else {
                currentSession.metadata[key] = String(value);
              }
            }
            return structuredClone(currentSession);
          }),
        },
      },
    };

    redisMock = {
      set: vi.fn().mockResolvedValue('OK'),
      eval: vi.fn().mockResolvedValue(1),
    };

    vi.spyOn(Redis, 'fromEnv').mockReturnValue(redisMock);
    vi.spyOn(Date, 'now').mockReturnValue(NOW);
    vi.spyOn(crypto, 'randomUUID').mockReturnValue('mocked-uuid');
  });

  afterEach(() => {
    process.env = originalEnv;
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it('marks a gift sent only after Resend accepts the email', async () => {
    global.fetch.mockImplementation(async () => {
      expect(currentSession.metadata.giftDeliveryStatus).toBe('pending');
      expect(currentSession.metadata.giftDeliveredAt).toBeUndefined();
      return {
        ok: true,
        text: vi.fn().mockResolvedValue('{"id":"re_test_123"}'),
      };
    });

    const result = await deliverGiftEmailForSession(mockStripe, 'cs_test_123');

    expect(result).toMatchObject({ ok: true, delivered: true });
    expect(mockStripe.checkout.sessions.update).toHaveBeenCalledTimes(2);
    expect(currentSession.metadata.giftDeliveryStatus).toBe('sent');
    expect(currentSession.metadata.giftDeliveredAt).toBe(new Date(NOW).toISOString());
    expect(currentSession.metadata.giftDeliveryPendingAt).toBeUndefined();
    expectOwnedLockReleased(redisMock);
  });

  it('keeps a thrown network attempt pending without falsely marking it delivered', async () => {
    global.fetch.mockRejectedValue(new Error('Network error'));

    const result = await deliverGiftEmailForSession(mockStripe, 'cs_test_123');

    expect(result.ok).toBe(false);
    expect(result.retryable).toBe(true);
    expect(currentSession.metadata.giftDeliveryStatus).toBe('pending');
    expect(currentSession.metadata.giftDeliveredAt).toBeUndefined();
    expect(mockStripe.checkout.sessions.update).toHaveBeenCalledTimes(1);
    expectOwnedLockReleased(redisMock);
  });

  it('retries a pending attempt with its saved reveal and stable idempotency key', async () => {
    currentSession = makeSession({
      giftDeliveryStatus: 'pending',
      giftDeliveryPendingAt: new Date(NOW - 5 * 60 * 1000).toISOString(),
      giftNumbers: '1,2,3,4,5,6',
      giftLuckyColor: 'Star Gold',
      giftLuckyDay: 'Monday',
    });
    mockResendSuccess();

    const result = await deliverGiftEmailForSession(mockStripe, 'cs_test_123');
    const [, request] = global.fetch.mock.calls[0];
    const body = JSON.parse(request.body);

    expect(result).toMatchObject({ ok: true, delivered: true });
    expect(request.headers['Idempotency-Key']).toBe('gift-cs_test_123');
    expect(body.html).toContain('Star Gold');
    expect(body.html).toContain('Monday');
    expect(body.html).toContain('>1</span>');
    expect(currentSession.metadata.giftDeliveryStatus).toBe('sent');
    expect(currentSession.metadata.giftNumbers).toBe('1,2,3,4,5,6');
    expectOwnedLockReleased(redisMock);
  });

  it('does not retry a pending attempt outside the safe idempotency window', async () => {
    currentSession = makeSession({
      giftDeliveryStatus: 'pending',
      giftDeliveryPendingAt: new Date(NOW - 24 * 60 * 60 * 1000).toISOString(),
      giftNumbers: '1,2,3,4,5,6',
      giftLuckyColor: 'Star Gold',
      giftLuckyDay: 'Monday',
    });

    const result = await deliverGiftEmailForSession(mockStripe, 'cs_test_123');

    expect(result).toMatchObject({ ok: false, reviewRequired: true });
    expect(result.reason).toContain('Check Resend');
    expect(global.fetch).not.toHaveBeenCalled();
    expect(currentSession.metadata.giftDeliveryStatus).toBe('review_required');
    expect(currentSession.metadata.giftDeliveredAt).toBeUndefined();
    expectOwnedLockReleased(redisMock);
  });

  it('keeps a non-success Resend response pending for a same-key retry', async () => {
    global.fetch.mockResolvedValue({
      ok: false,
      text: vi.fn().mockResolvedValue('Temporary provider rejection'),
    });

    const result = await deliverGiftEmailForSession(mockStripe, 'cs_test_123');

    expect(result).toMatchObject({ ok: false, retryable: true });
    expect(currentSession.metadata.giftDeliveryStatus).toBe('pending');
    expect(currentSession.metadata.giftDeliveredAt).toBeUndefined();
    expect(mockStripe.checkout.sessions.update).toHaveBeenCalledTimes(1);
    expectOwnedLockReleased(redisMock);
  });

  it('retries with the same payload if Stripe cannot record a successful Resend response', async () => {
    const update = mockStripe.checkout.sessions.update;
    const originalUpdate = update.getMockImplementation();
    update.mockImplementationOnce(originalUpdate);
    update.mockRejectedValueOnce(new Error('Stripe update timeout'));

    const requests = [];
    global.fetch.mockImplementation(async (_url, request) => {
      requests.push(request);
      return {
        ok: true,
        text: vi.fn().mockResolvedValue('{"id":"re_test_123"}'),
      };
    });

    const firstResult = await deliverGiftEmailForSession(mockStripe, 'cs_test_123');

    expect(firstResult.ok).toBe(false);
    expect(currentSession.metadata.giftDeliveryStatus).toBe('pending');
    expect(currentSession.metadata.giftDeliveredAt).toBeUndefined();

    const secondResult = await deliverGiftEmailForSession(mockStripe, 'cs_test_123');

    expect(secondResult).toMatchObject({ ok: true, delivered: true });
    expect(requests).toHaveLength(2);
    expect(requests[1].headers['Idempotency-Key']).toBe(
      requests[0].headers['Idempotency-Key'],
    );
    expect(requests[1].body).toBe(requests[0].body);
    expect(currentSession.metadata.giftDeliveryStatus).toBe('sent');
    expect(currentSession.metadata.giftDeliveredAt).toBe(new Date(NOW).toISOString());
  });

  it('releases the lock when the pending Stripe update throws before sending', async () => {
    mockStripe.checkout.sessions.update.mockRejectedValueOnce(new Error('Stripe API error'));

    const result = await deliverGiftEmailForSession(mockStripe, 'cs_test_123');

    expect(result.ok).toBe(false);
    expect(global.fetch).not.toHaveBeenCalled();
    expect(currentSession.metadata.giftDeliveredAt).toBeUndefined();
    expectOwnedLockReleased(redisMock);
  });

  it('releases the lock when email configuration is missing', async () => {
    delete process.env.RESEND_API_KEY;

    const result = await deliverGiftEmailForSession(mockStripe, 'cs_test_123');

    expect(result.ok).toBe(false);
    expect(mockStripe.checkout.sessions.retrieve).not.toHaveBeenCalled();
    expectOwnedLockReleased(redisMock);
  });

  it('releases the lock when session validation fails', async () => {
    currentSession.payment_status = 'unpaid';

    const result = await deliverGiftEmailForSession(mockStripe, 'cs_test_123');

    expect(result.ok).toBe(false);
    expect(global.fetch).not.toHaveBeenCalled();
    expectOwnedLockReleased(redisMock);
  });
});
