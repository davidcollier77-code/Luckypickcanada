import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GET, POST } from './route.js';
import crypto from 'crypto';

// Mock dependencies
vi.mock('../../suggestions', () => ({
  listSuggestions: vi.fn().mockResolvedValue({ isConfigured: true, suggestions: [] }),
}));

vi.mock('../../spam-protection', () => ({
  getClientIp: vi.fn().mockReturnValue('127.0.0.1'),
  checkApiRateLimit: vi.fn().mockResolvedValue({ ok: true }),
}));

describe('Admin Suggestions Route', () => {
  const originalEnv = process.env;
  const mockPassword = 'test-admin-password';

  beforeEach(() => {
    process.env = { ...originalEnv, ADMIN_PASSWORD: mockPassword };
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2023, 1, 1, 12, 0, 0, 0));
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  describe('POST login', () => {
    it('returns 429 when rate limit is exceeded', async () => {
      const { checkApiRateLimit } = await import('../../spam-protection');
      checkApiRateLimit.mockResolvedValueOnce({ ok: false });

      const formData = new FormData();
      formData.append('password', mockPassword);
      const request = new Request('http://localhost/admin/suggestions', {
        method: 'POST',
        body: formData,
        headers: {
          'cf-connecting-ip': '127.0.0.1'
        }
      });

      const response = await POST(request);
      expect(response.status).toBe(429);
      const html = await response.text();
      expect(html).toContain('Too many attempts. Please try again later.');
    });

    it('returns 401 with incorrect password', async () => {
      const formData = new FormData();
      formData.append('password', 'wrong-password');
      const request = new Request('http://localhost/admin/suggestions', {
        method: 'POST',
        body: formData,
      });

      const response = await POST(request);
      expect(response.status).toBe(401);
      const html = await response.text();
      expect(html).toContain('Incorrect admin password.');
    });

    it('sets a valid HMAC cookie and redirects on correct password', async () => {
      const formData = new FormData();
      formData.append('password', mockPassword);
      const request = new Request('http://localhost/admin/suggestions', {
        method: 'POST',
        body: formData,
      });

      const response = await POST(request);
      expect(response.status).toBe(303);
      expect(response.headers.get('Location')).toBe('/admin/suggestions');

      const setCookie = response.headers.get('Set-Cookie');
      expect(setCookie).toContain('suggestions_admin=');
      expect(setCookie).toContain('HttpOnly; Secure; SameSite=Lax; Path=/admin/suggestions; Max-Age=86400');
    });
  });

  describe('GET suggestions', () => {
    it('returns 401 if not authorized', async () => {
      const request = new Request('http://localhost/admin/suggestions');
      const response = await GET(request);
      expect(response.status).toBe(401);
    });

    it('returns 200 with valid session cookie', async () => {
      const expiresAt = Date.now() + 86400000;
      const hmac = crypto.createHmac('sha256', mockPassword).update(String(expiresAt)).digest('hex');
      const sessionToken = `${expiresAt}.${hmac}`;

      const request = new Request('http://localhost/admin/suggestions', {
        headers: {
          cookie: `suggestions_admin=${sessionToken}`
        }
      });

      const response = await GET(request);
      expect(response.status).toBe(200);
    });

    it('returns 401 with an expired session cookie', async () => {
      const expiresAt = Date.now() - 1000; // Expired 1 second ago
      const hmac = crypto.createHmac('sha256', mockPassword).update(String(expiresAt)).digest('hex');
      const sessionToken = `${expiresAt}.${hmac}`;

      const request = new Request('http://localhost/admin/suggestions', {
        headers: {
          cookie: `suggestions_admin=${sessionToken}`
        }
      });

      const response = await GET(request);
      expect(response.status).toBe(401);
    });

    it('returns 401 with an invalid HMAC', async () => {
      const expiresAt = Date.now() + 86400000;
      const hmac = crypto.createHmac('sha256', 'wrong-secret').update(String(expiresAt)).digest('hex');
      const sessionToken = `${expiresAt}.${hmac}`;

      const request = new Request('http://localhost/admin/suggestions', {
        headers: {
          cookie: `suggestions_admin=${sessionToken}`
        }
      });

      const response = await GET(request);
      expect(response.status).toBe(401);
    });

    it('returns 401 if cookie is malformed (no timestamp)', async () => {
      const hmac = crypto.createHmac('sha256', mockPassword).update(String(Date.now() + 86400000)).digest('hex');

      const request = new Request('http://localhost/admin/suggestions', {
        headers: {
          cookie: `suggestions_admin=${hmac}` // Missing timestamp.
        }
      });

      const response = await GET(request);
      expect(response.status).toBe(401);
    });
  });
});
