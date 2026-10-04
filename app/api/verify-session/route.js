import { NextResponse } from 'next/server';
import Stripe from 'stripe';

export const runtime = 'nodejs';

export async function GET(request) {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  const sessionId = new URL(request.url).searchParams.get('session_id');

  if (!secretKey || !sessionId) {
    return NextResponse.json({ ok: false, error: 'Invalid request' }, { status: 400 });
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
