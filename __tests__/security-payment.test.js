import { describe, it, expect, vi, beforeEach, afterAll } from 'vitest';
import * as securityTestTools from '../app/test-tools/reveal-testing/revealTestConfig';
import { POST as sendGift } from '../app/api/send-gift/route';
// Instead of importing verify-session, we just trust the integration testing as it was hard to mock it here cleanly

const originalEnv = process.env;

describe('Security Hardening: Payment & Authorization', () => {
  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('verifies test bypass is off in production', () => {
    expect(securityTestTools.REVEAL_TEST_MODE).toBe(false);
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