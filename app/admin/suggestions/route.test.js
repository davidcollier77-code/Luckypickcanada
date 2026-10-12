import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GET, POST } from './route.js';
import crypto from 'crypto';

vi.mock('../../suggestions', () => ({
  listSuggestions: vi.fn().mockResolvedValue({ isConfigured: true, suggestions: [] }),
}));

vi.mock('../../spam-protection', () => ({
  getClientIp: vi.fn().mockReturnValue('127.0.0.1'),
  checkApiRateLimit: vi.fn().mockResolvedValue({ ok: true }),
}));

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
      RESEND_API_KEY: 'test-key',
    };
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-12T12:00:00Z'));
    global.fetch.mockReset().mockResolvedValue({ ok: true });
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  function formRequest(email) {
    const formData = new FormData();
    formData.append('email', email);
    return new Request('https://luckypickcanada.ca/admin/suggestions', {
      method: 'POST',
      body: formData,
    });
  }

  function magicToken(expiresAt = Date.now() + 15 * 60000, secret = mockPassword) {
    const timestamp = String(expiresAt);
    const signature = crypto.createHmac('sha256', secret).update(timestamp).digest('hex');
    return timestamp + '.' + signature;
  }

  describe('POST login', () => {
    it('returns 429 when rate limit is exceeded', async () => {
      const { checkApiRateLimit } = await import('../../spam-protection');
      checkApiRateLimit.mockResolvedValueOnce({ ok: false });

      const response = await POST(formRequest(mockAdminEmail));
      expect(response.status).toBe(429);
      expect(await response.text()).toContain('Too many attempts. Please try again later.');
    });

    it('does not send email for an unknown address and uses a generic response', async () => {
      const response = await POST(formRequest('wrong@example.com'));
      expect(response.status).toBe(200);
      expect(await response.text()).toContain('If the email matches our records');
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('sends a magic link with the token in the fragment, not the query string', async () => {
      const response = await POST(formRequest(mockAdminEmail));
      expect(response.status).toBe(200);
      expect(await response.text()).toContain('If the email matches our records');
      expect(global.fetch).toHaveBeenCalledTimes(1);

      const [url, options] = global.fetch.mock.calls[0];
      expect(url).toBe('https://api.resend.com/emails');
      const body = JSON.parse(options.body);
      const link = body.html.match(/href="([^"]+)"/)[1];
      expect(new URL(link).search).toBe('');
      expect(new URL(link).hash).toMatch(/^#auth=\d+\.[a-f0-9]{64}$/);
    });

    it('returns a generic response when the email provider throws', async () => {
      global.fetch.mockRejectedValueOnce(new Error('private provider detail'));
      const response = await POST(formRequest(mockAdminEmail));
      expect(response.status).toBe(200);
      expect(await response.text()).toContain('If the email matches our records');
    });

    it('fails closed when required admin email configuration is missing', async () => {
      delete process.env.ADMIN_EMAIL;
      delete process.env.SUGGESTIONS_TO_EMAIL;
      const response = await POST(formRequest(mockAdminEmail));
      expect(response.status).toBe(503);
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('fails closed when the signing secret is missing', async () => {
      delete process.env.ADMIN_PASSWORD;
      const response = await POST(formRequest(mockAdminEmail));
      expect(response.status).toBe(503);
      expect(global.fetch).not.toHaveBeenCalled();
    });
  });

  describe('POST magic-link exchange', () => {
    it('exchanges a valid token from the request body for a secure session cookie', async () => {
      const response = await POST(new Request('https://luckypickcanada.ca/admin/suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ authToken: magicToken() }),
      }));

      expect(response.status).toBe(204);
      expect(response.headers.get('Set-Cookie')).toContain('HttpOnly; Secure; SameSite=Lax; Path=/admin/suggestions; Max-Age=86400');
      expect(response.headers.get('Cache-Control')).toBe('no-store');
    });

    it('rejects expired tokens', async () => {
      const response = await POST(new Request('https://luckypickcanada.ca/admin/suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ authToken: magicToken(Date.now() - 1000) }),
      }));
      expect(response.status).toBe(401);
    });

    it('rejects tokens signed with the wrong secret', async () => {
      const response = await POST(new Request('https://luckypickcanada.ca/admin/suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ authToken: magicToken(Date.now() + 60000, 'wrong-secret') }),
      }));
      expect(response.status).toBe(401);
    });

    it('rejects malformed JSON', async () => {
      const response = await POST(new Request('https://luckypickcanada.ca/admin/suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{',
      }));
      expect(response.status).toBe(400);
    });
  });

  describe('GET suggestions', () => {
    it('returns 401 when no session exists', async () => {
      const response = await GET(new Request('https://luckypickcanada.ca/admin/suggestions'));
      expect(response.status).toBe(401);
    });

    it('accepts a valid 24-hour session cookie', async () => {
      const expiresAt = Date.now() + 86400000;
      const signature = crypto.createHmac('sha256', mockPassword).update(String(expiresAt)).digest('hex');
      const response = await GET(new Request('https://luckypickcanada.ca/admin/suggestions', {
        headers: { cookie: 'suggestions_admin=' + expiresAt + '.' + signature },
      }));
      expect(response.status).toBe(200);
      expect(response.headers.get('Referrer-Policy')).toBe('no-referrer');
      expect(response.headers.get('Cache-Control')).toBe('no-store');
    });

    it('rejects expired sessions', async () => {
      const expiresAt = Date.now() - 1000;
      const signature = crypto.createHmac('sha256', mockPassword).update(String(expiresAt)).digest('hex');
      const response = await GET(new Request('https://luckypickcanada.ca/admin/suggestions', {
        headers: { cookie: 'suggestions_admin=' + expiresAt + '.' + signature },
      }));
      expect(response.status).toBe(401);
    });

    it('fails closed when required authentication configuration is missing', async () => {
      delete process.env.ADMIN_PASSWORD;
      const response = await GET(new Request('https://luckypickcanada.ca/admin/suggestions'));
      expect(response.status).toBe(503);
    });
  });
});
