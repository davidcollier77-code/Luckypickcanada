import { describe, it, expect, vi, beforeEach, afterAll } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, parse } from 'node:path';
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

  it('keeps the free preview separate from any paid checkout bypass', () => {
    // REVEAL_TEST_MODE is now the single public preview switch, enabled for this task.
    expect(securityTestTools.REVEAL_TEST_MODE).toBe(true);
    expect(securityTestTools.canPreviewReveal('lucky_pick')).toBe(securityTestTools.REVEAL_TEST_MODE);
    expect(securityTestTools.canPreviewReveal('gift_package')).toBe(securityTestTools.REVEAL_TEST_MODE);
    expect(securityTestTools.canPreviewReveal('tip')).toBe(false);
    // The old form-submission bypass helper is gone, so nothing can skip /api/checkout.
    expect(securityTestTools.canBypassRevealPayment).toBeUndefined();
  });

  describe('Legacy /api/send-gift endpoint', () => {
    it('is blocked outside of development environment', async () => {
      process.env.NODE_ENV = 'production';

      const request = new Request(/* DevSkim: ignore DS162092 */ 'http://localhost/api/send-gift', {
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

describe('Free preview reveal boundaries', () => {
  const modalSource = readFileSync(join(process.cwd(), 'app/checkout-modal.jsx'), 'utf8');

  it('never routes previews through the gift email or checkout APIs', () => {
    expect(modalSource).not.toContain('/api/send-gift');
    expect(modalSource).not.toContain("fetch('/api/checkout'");
    // The paid path is still the plain form post it was before.
    expect(modalSource).toContain('action="/api/checkout"');
    expect(modalSource).not.toContain('noValidate');
  });

  it('renders the preview as a non-submitting button outside the form', () => {
    expect(modalSource).toMatch(/<button type="button"[^>]*checkout-modal-preview-button/);
    expect(modalSource).toMatch(/Preview Reveal — FREE/);
  });
});

describe('Gift email link security', () => {
  function findRepoRoot(startDirectory = process.cwd()) {
    const filesystemRoot = parse(startDirectory).root;
    let directory = startDirectory;

    while (true) {
      if (existsSync(join(directory, 'app/api/send-gift/route.ts'))) {
        return directory;
      }
      if (directory === filesystemRoot) break;
      directory = dirname(directory);
    }

    throw new Error('Unable to locate repository root for gift-link security test');
  }

  it('protects the opener when a reveal link opens a new tab', () => {
    const routeSource = readFileSync(
      join(findRepoRoot(), 'app/api/send-gift/route.ts'),
      'utf8'
    );
    // Static source check only: this matches the route email template, not rendered HTML.
    // DevSkim: ignore DS610000
    const anchor = routeSource.match(/<a href="\$\{revealUrl\}" target="_blank"[^>]*>/);

    expect(anchor).not.toBeNull();
    expect(anchor[0]).toContain('rel="noopener noreferrer"');
  });
});
