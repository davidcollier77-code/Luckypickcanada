import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { checkApiRateLimit, getClientIp } from '../../spam-protection';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Verification is a paid flow: a customer only needs one call per purchase, so the
// ceiling is set high enough for shared/NAT and carrier-grade NAT addresses while
// still bounding how much Stripe quota an unauthenticated caller can burn.
const VERIFY_SESSION_LIMIT = 60;
const VERIFY_SESSION_WINDOW_MS = 60 * 60 * 1000;

export async function GET(request) {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  const sessionId = new URL(request.url).searchParams.get('session_id');

  if (!secretKey || !sessionId) {
    return NextResponse.json({ ok: false, error: 'Invalid request' }, { status: 400 });
  }

  const rateLimit = await checkApiRateLimit(
    getClientIp(request),
    'verify_session',
    VERIFY_SESSION_LIMIT,
    VERIFY_SESSION_WINDOW_MS,
  );

  if (!rateLimit.ok) {
    return NextResponse.json({ ok: false, error: 'rate_limited' }, { status: 429 });
  }

  const stripe = new Stripe(secretKey, {
    httpClient: Stripe.createFetchHttpClient(),
  });

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (!session) {
      return NextResponse.json({ ok: false, error: 'Session not found' }, { status: 404 });
    }

    const metadata = session.metadata || {};

    if (session.payment_status !== 'paid' || metadata.checkoutType !== 'lucky_pick') {
      return NextResponse.json({ ok: false, error: 'Payment not verified' }, { status: 403 });
    }

    return NextResponse.json({ ok: true, luckyPickGame: metadata.luckyPickGame });
  } catch (error) {
    console.error('Verify session failed', error);
    return NextResponse.json({ ok: false, error: 'Verification failed' }, { status: 500 });
  }
}
