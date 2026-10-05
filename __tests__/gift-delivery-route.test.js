// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { deliverGiftEmailForSession, StripeConstructor } = vi.hoisted(() => ({
  deliverGiftEmailForSession: vi.fn(),
  StripeConstructor: vi.fn(),
}));
vi.mock('stripe', () => ({ default: StripeConstructor }));
vi.mock('../app/gift-email', async (importOriginal) => ({
  ...(await importOriginal()),
  deliverGiftEmailForSession,
}));

const SESSION_ID = 'cs_test_gift_123';

let route;
let session;
let errorLog;

function buildSession(metadataOverrides = {}) {
  return {
    id: SESSION_ID,
    payment_status: 'paid',
    amount_total: 299,
    currency: 'cad',
    metadata: {
      checkoutType: 'gift_package',
      recipientEmail: 'friend@example.test',
      recipientName: 'Friend',
      ...metadataOverrides,
    },
  };
}

function request() {
  return new Request(`https://example.test/api/gift-delivery?session_id=${SESSION_ID}`);
}

beforeEach(async () => {
  vi.resetModules();
  vi.resetAllMocks();
  vi.stubEnv('STRIPE_SECRET_KEY', 'sk_test_key');
  session = buildSession();
  StripeConstructor.mockImplementation(function MockStripe() {
    this.checkout = { sessions: { retrieve: vi.fn(async () => session) } };
  });
  deliverGiftEmailForSession.mockResolvedValue({ ok: true, delivered: true });
  errorLog = vi.spyOn(console, 'error').mockImplementation(() => {});
  route = await import('../app/api/gift-delivery/route');
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});

describe('gift delivery route', () => {
  it('does not treat an intermediate processing claim as a completed delivery', async () => {
    session = buildSession({ giftDeliveredAt: 'processing' });

    const response = await route.GET(request());

    expect(deliverGiftEmailForSession).toHaveBeenCalledWith(expect.any(Object), SESSION_ID);
    expect(response.status).toBe(303);
    expect(response.headers.get('location')).toContain(`/reveal/${SESSION_ID}`);
  });

  it('redirects straight to the reveal page once delivery is durably marked complete', async () => {
    session = buildSession({ giftDeliveredAt: '2026-01-01T00:00:00.000Z' });

    const response = await route.GET(request());

    expect(deliverGiftEmailForSession).not.toHaveBeenCalled();
    expect(response.status).toBe(303);
    expect(response.headers.get('location')).toContain(`/reveal/${SESSION_ID}`);
    expect(response.headers.get('location')).toContain('recipientEmail=friend%40example.test');
  });

  it('surfaces an error when the processing claim cannot be recovered', async () => {
    session = buildSession({ giftDeliveredAt: 'processing' });
    deliverGiftEmailForSession.mockResolvedValue({ ok: false, reason: 'Payment succeeded, but the gift email could not be sent right now.' });

    const response = await route.GET(request());

    expect(response.status).toBe(303);
    expect(response.headers.get('location')).toContain('giftError=');
    expect(response.headers.get('location')).not.toContain('/reveal/');
  });
});