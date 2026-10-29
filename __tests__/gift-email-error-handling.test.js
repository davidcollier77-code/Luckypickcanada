import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { deliverGiftEmailForSession } from '../app/gift-email';
import { Redis } from '@upstash/redis';

// Mock fetch for sendGiftEmail
global.fetch = vi.fn();

describe('Gift Delivery Error Handling', () => {
  const originalEnv = process.env;
  let mockStripe;
  let redisMock;

  beforeEach(() => {
    vi.resetAllMocks();
    process.env = {
      ...originalEnv,
      UPSTASH_REDIS_REST_URL: 'mock-url',
      UPSTASH_REDIS_REST_TOKEN: 'mock-token',
      RESEND_API_KEY: 'test-resend-key',
      GIFT_FROM_EMAIL: 'test@example.com'
    };

    mockStripe = {
      checkout: {
        sessions: {
          retrieve: vi.fn().mockResolvedValue({
            id: 'cs_test_123',
            payment_status: 'paid',
            amount_total: 299,
            currency: 'cad',
            metadata: {
              checkoutType: 'gift_package',
              recipientEmail: 'test@test.com',
              recipientName: 'Test Recipient',
              senderName: 'Sender'
            }
          }),
          update: vi.fn().mockResolvedValue({})
        }
      }
    };

    redisMock = {
      set: vi.fn().mockResolvedValue('OK'),
      // Just returning a dummy string will fail the exact token match,
      // but we can mock randomUUID to return a known token.
      get: vi.fn().mockResolvedValue('cs_test_123-1234567890-mocked-uuid'),
      del: vi.fn().mockResolvedValue(1)
    };

    vi.spyOn(Redis, 'fromEnv').mockReturnValue(redisMock);

    vi.spyOn(Date, 'now').mockReturnValue(1234567890);
    vi.spyOn(crypto, 'randomUUID').mockReturnValue('mocked-uuid');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('releases lock when stripe update fails (exception thrown)', async () => {
    // Force stripe update to throw an exception
    mockStripe.checkout.sessions.update.mockRejectedValue(new Error('Stripe API Error'));

    const redisDelSpy = vi.spyOn(redisMock, 'del');

    const result = await deliverGiftEmailForSession(mockStripe, 'cs_test_123');

    expect(result.ok).toBe(false);
    expect(result.reason).toBe('An unexpected error occurred during delivery.');

    // Ensure the lock was claimed and deleted in finally
    expect(redisMock.set).toHaveBeenCalled();
    expect(redisDelSpy).toHaveBeenCalledWith('gift-delivery-lock:cs_test_123');
  });

  it('releases lock when sendGiftEmail (fetch) throws an exception', async () => {
    // Force fetch to throw an exception
    global.fetch.mockRejectedValue(new Error('Network error'));

    const redisDelSpy = vi.spyOn(redisMock, 'del');

    const result = await deliverGiftEmailForSession(mockStripe, 'cs_test_123');

    expect(result.ok).toBe(false);
    expect(result.reason).toBe('An unexpected error occurred during delivery.');

    // Ensure the lock was claimed and deleted in finally
    expect(redisMock.set).toHaveBeenCalled();
    expect(redisDelSpy).toHaveBeenCalledWith('gift-delivery-lock:cs_test_123');

    // Crucially, verify that the second stripe update (rollback) was NOT called
    // because we caught the exception in the outer catch block
    expect(mockStripe.checkout.sessions.update).toHaveBeenCalledTimes(1);
  });
});
