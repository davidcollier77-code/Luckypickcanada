import { describe, it, expect, vi, beforeEach } from 'vitest';
import { validatePublicFormSubmission } from './spam-protection';
import { getTurnstileSiteKey } from './turnstile-config';

vi.mock('./turnstile-config', () => ({
  getTurnstileSiteKey: vi.fn(),
}));

describe('spam-protection', () => {

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.TURNSTILE_SECRET_KEY = 'test_secret_key';
    getTurnstileSiteKey.mockReturnValue('test_site_key');
  });

  function setupFetchMock(mockResponse) {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue(mockResponse),
    });
  }

  let ipCounter = 1;
  function createMockRequest(ip) {
    const testIp = ip || `127.0.0.${ipCounter++}`;
    return {
      headers: new Headers({
        'cf-connecting-ip': testIp,
      }),
    };
  }

  function createMockFormData(token = 'valid-token') {
    const formData = new FormData();
    if (token) formData.append('cf-turnstile-response', token);
    return formData;
  }

  it('fails if turnstile token is missing', async () => {
    const result = await validatePublicFormSubmission({
      request: createMockRequest(),
      formData: createMockFormData(null),
      formName: 'test-form',
    });

    expect(result.ok).toBe(false);
    expect(result.error).toBe('Complete the spam check and try again.');
  });

  it('fails if turnstile returns unsuccessful verification', async () => {
    setupFetchMock({ success: false, 'error-codes': ['invalid-input-response'] });

    const result = await validatePublicFormSubmission({
      request: createMockRequest(),
      formData: createMockFormData(),
      formName: 'test-form',
    });

    expect(result.ok).toBe(false);
    expect(result.error).toBe('Spam check failed. Please try again.');
  });

  it('fails if turnstile returns invalid hostname', async () => {
    setupFetchMock({ success: true, hostname: 'evil.com', action: 'test-form' });

    const result = await validatePublicFormSubmission({
      request: createMockRequest(),
      formData: createMockFormData(),
      formName: 'test-form',
    });

    expect(result.ok).toBe(false);
    expect(result.error).toBe('Spam check failed. Please try again.');
  });

  it('fails if turnstile returns invalid action', async () => {
    setupFetchMock({ success: true, hostname: 'luckypickcanada.ca', action: 'wrong-form' });

    const result = await validatePublicFormSubmission({
      request: createMockRequest(),
      formData: createMockFormData(),
      formName: 'test-form',
    });

    expect(result.ok).toBe(false);
    expect(result.error).toBe('Spam check failed. Please try again.');
  });

  it('succeeds with valid token, correct hostname and correct action', async () => {
    setupFetchMock({ success: true, hostname: 'www.luckypickcanada.ca', action: 'test-form' });

    const result = await validatePublicFormSubmission({
      request: createMockRequest(),
      formData: createMockFormData(),
      formName: 'test-form',
    });

    expect(result.ok).toBe(true);
  });
});
