// @vitest-environment node
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';

const { StripeMock } = vi.hoisted(() => ({ StripeMock: vi.fn() }));
vi.mock('stripe', () => ({ default: StripeMock }));

vi.mock('../app/gift-email', async (importOriginal) => {
  const actual = await importOriginal();

  return { ...actual, deliverGiftEmailForSession: vi.fn() };
});

const SESSION_ID = 'cs_test_123';
const RECIPIENT = 'friend@example.test';

function giftSession({ metadata, ...overrides } = {}) {
  return {
    id: SESSION_ID,
    payment_status: 'paid',
    amount_total: 299,
    currency: 'cad',
    metadata: {
      checkoutType: 'gift_package',
      recipientEmail: RECIPIENT,
      recipientName: 'Friend',
      giftDeliveredAt: '',
      ...(metadata || {}),
    },
    ...overrides,
  };
}

function request(query = '') {
  return new Request(`https://example.test/api/gift-delivery?session_id=${SESSION_ID}${query}`);
}

let deliverGiftEmailForSession;
let GET;
let retrieve;

beforeEach(async () => {
  vi.resetModules();
  vi.useFakeTimers();

  const stripeMockModule = await import('stripe');
  const giftEmailModule = await import('../app/gift-email');

  deliverGiftEmailForSession = giftEmailModule.deliverGiftEmailForSession;
  retrieve = vi.fn().mockResolvedValue(giftSession());
  const stripeClient = { checkout: { sessions: { retrieve, list: vi.fn() } } };
  StripeMock.mockImplementation(function StripeStub() {
    return stripeClient;
  });

  vi.stubEnv('STRIPE_SECRET_KEY', 'sk_test_key');

  const route = await import('../app/api/gift-delivery/route');
  GET = route.GET;
  expect(stripeMockModule.default).toBeDefined();
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllEnvs();
});

// Runs the handler while advancing the fake clock so the bounded delivery wait completes.
async function runHandler(req) {
  const pending = GET(req);
  await vi.runAllTimersAsync();
  return pending;
}

describe('gift delivery success gating', () => {
  it('does not redirect to a success reveal while the gift lock is held', async () => {
    deliverGiftEmailForSession.mockResolvedValue({
      ok: false,
      lockHeld: true,
      reason: 'Gift fulfillment is already in progress for this session.',
    });

    const response = await runHandler(request());

    expect(response.status).toBe(202);
    expect(response.headers.get('Location')).toBeNull();

    const body = await response.text();
    expect(body).not.toContain('Gift Dispatched Successfully');
    expect(body).not.toContain(`/reveal/${SESSION_ID}`);
    // The pending screen must not leak the recipient address.
    expect(body).not.toContain(RECIPIENT);
  });

  it('redirects to the success reveal once the lock holder confirms delivery', async () => {
    deliverGiftEmailForSession.mockResolvedValue({ ok: false, lockHeld: true, reason: 'in progress' });

    retrieve
      .mockResolvedValueOnce(giftSession())
      .mockResolvedValueOnce(giftSession({ metadata: { giftDeliveredAt: '' } }))
      .mockResolvedValue(giftSession({ metadata: { giftDeliveredAt: '2026-01-01T00:00:05.000Z' } }));

    const response = await runHandler(request());

    expect(response.status).toBe(303);
    expect(response.headers.get('Location')).toContain(`/reveal/${SESSION_ID}`);
    expect(response.headers.get('Location')).toContain('giftDelivered=1');
    expect(response.headers.get('Location')).toContain(`recipientEmail=${encodeURIComponent(RECIPIENT)}`);
  });

  it('treats an in-flight giftDeliveredAt placeholder as unconfirmed delivery', async () => {
    // The Redis-less fallback lock writes "processing" into giftDeliveredAt.
    retrieve.mockResolvedValue(giftSession({ metadata: { giftDeliveredAt: 'processing' } }));
    deliverGiftEmailForSession.mockResolvedValue({ ok: true, alreadyDelivered: true });

    const response = await runHandler(request());

    expect(response.status).toBe(303);
    expect(response.headers.get('Location')).toContain('/?');
    expect(response.headers.get('Location')).not.toContain(`/reveal/${SESSION_ID}`);
    expect(response.headers.get('Location')).not.toContain('giftDelivered=1');
  });

  it('confirms delivery when this request actually sent the email', async () => {
    deliverGiftEmailForSession.mockResolvedValue({ ok: true, delivered: true, reveal: {} });

    const response = await runHandler(request());

    expect(response.status).toBe(303);
    expect(response.headers.get('Location')).toContain('/reveal/');
    expect(response.headers.get('Location')).toContain('giftDelivered=1');
  });

  it('keeps the payment guard for sessions that are not a paid gift package', async () => {
    retrieve.mockResolvedValue(giftSession({ payment_status: 'unpaid' }));

    const response = await runHandler(request());

    expect(response.status).toBe(303);
    expect(response.headers.get('Location')).toContain('giftError=');
    expect(deliverGiftEmailForSession).not.toHaveBeenCalled();
  });

  it('renders the pending home link as a single escaped attribute', async () => {
    deliverGiftEmailForSession.mockResolvedValue({ ok: false, lockHeld: true, reason: 'in progress' });

    const response = await runHandler(request());
    const body = await response.text();

    // The home link is derived from the incoming Host header, so it must be escaped and
    // must not be able to terminate its attribute and inject markup or a handler.
    expect(body).toContain('href="https://example.test/"');
    expect(body).not.toMatch(/<a\b[^>]*\son[a-z]+\s*=/i);
    expect(body).not.toContain('onmouseover');
  });
});