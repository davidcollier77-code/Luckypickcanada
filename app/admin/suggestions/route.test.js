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

// Mock fetch for Resend
global.fetch = vi.fn().mockResolvedValue({ ok: true });

describe('Admin Suggestions Route', () => {
  const originalEnv = process.env;
  const mockPassword = 'test-admin-password';
  const mockAdminEmail = 'admin@luckypickcanada.ca';

  beforeEach(() => {
    process.env = {
      ...originalEnv,
      ADMIN_PASSWORD: mockPassword,
      ADMIN_EMAIL: mockAdminEmail,
      RESEND_API_KEY: 'test-key'
    };
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2023, 1, 1, 12, 0, 0, 0));
    global.fetch.mockClear();
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
      formData.append('email', mockAdminEmail);
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

    it('returns success message but does not send email if email is incorrect', async () => {
      const formData = new FormData();
      formData.append('email', 'wrong@example.com');
      const request = new Request('http://localhost/admin/suggestions', {
        method: 'POST',
        body: formData,
      });

      const response = await POST(request);
      expect(response.status).toBe(200);
      const html = await response.text();
      expect(html).toContain('If the email matches our records, a login link has been sent.');
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('returns success message and sends email if email is correct', async () => {
      const formData = new FormData();
      formData.append('email', mockAdminEmail);
      const request = new Request('http://localhost/admin/suggestions', {
        method: 'POST',
        body: formData,
      });

      const response = await POST(request);
      expect(response.status).toBe(200);
      const html = await response.text();
      expect(html).toContain('If the email matches our records, a login link has been sent.');

      // Because vi.useFakeTimers is enabled, setTimeout won't actually trigger microtasks on next tick
      // unless we advance timers or use a loop. Let's instead just use vi.runAllTimersAsync()
      // wait for promises to resolve instead of trying to run fake timers which vitest complains about with act
      await new Promise(process.nextTick);
      expect(global.fetch).toHaveBeenCalledTimes(1);
      const [url, options] = global.fetch.mock.calls[0];
      expect(url).toBe('https://api.resend.com/emails');
      const body = JSON.parse(options.body);
      expect(body.to).toBe(mockAdminEmail);
      expect(body.html).toContain('?auth=');
    });
  });

  describe('GET suggestions', () => {
    it('returns 401 if not authorized', async () => {
      const request = new Request('http://localhost/admin/suggestions');
      const response = await GET(request);
      expect(response.status).toBe(401);
    });

    it('accepts valid ?auth= token and redirects with cookie', async () => {
      const expiresAt = Date.now() + 15 * 60000;
      const hmac = crypto.createHmac('sha256', mockPassword).update(String(expiresAt)).digest('hex');
      const token = `${expiresAt}.${hmac}`;

      const request = new Request(`http://localhost/admin/suggestions?auth=${token}`);
      const response = await GET(request);

      expect(response.status).toBe(303);
      expect(response.headers.get('Location')).toBe('/admin/suggestions');

      const setCookie = response.headers.get('Set-Cookie');
      expect(setCookie).toContain('suggestions_admin=');
      expect(setCookie).toContain('HttpOnly; Secure; SameSite=Lax; Path=/admin/suggestions; Max-Age=86400');
    });

    it('rejects expired ?auth= token', async () => {
      const expiresAt = Date.now() - 1000;
      const hmac = crypto.createHmac('sha256', mockPassword).update(String(expiresAt)).digest('hex');
      const token = `${expiresAt}.${hmac}`;

      const request = new Request(`http://localhost/admin/suggestions?auth=${token}`);
      const response = await GET(request);

      expect(response.status).toBe(401);
      const html = await response.text();
      expect(html).toContain('Login link is invalid or has expired.');
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

    it('returns 401 with an invalid session HMAC', async () => {
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
  });
});
