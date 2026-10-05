import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getClientIp, checkApiRateLimit } from '../../spam-protection';

export const runtime = 'nodejs';

/**
 * Verifies with Stripe that a checkout is paid and has a supported checkout type.
 *
 * @param request - Request with the Stripe checkout ID in the session_id query parameter.
 * @returns JSON with the game and session metadata, or an error for rate limits,
 * missing configuration, invalid sessions, unsupported checkout types, or unpaid checkouts.
 */
export async function GET(request: Request) {
  const ip = getClientIp(request);
  const rateLimit = await checkApiRateLimit(ip, 'verify_session', 20, 60000); // 20 per minute
  if (!rateLimit.ok) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get('session_id');

  if (!sessionId) {
    return NextResponse.json({ error: 'Missing session_id' }, { status: 400 });
  }

  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    return NextResponse.json({ error: 'Stripe is not configured.' }, { status: 500 });
  }

  const stripe = new Stripe(secretKey, { httpClient: Stripe.createFetchHttpClient() });

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== 'paid') {
      return NextResponse.json({ error: 'Payment not completed' }, { status: 402 });
    }

    if (session.metadata?.checkoutType !== 'lucky_pick' && session.metadata?.checkoutType !== 'gift_package') {
      return NextResponse.json({ error: 'Invalid checkout type' }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      game: session.metadata.luckyPickGame || '6',
      metadata: session.metadata,
    });
  } catch (error) {
    console.error('Session verification failed:', error);
    return NextResponse.json({ error: 'Invalid session' }, { status: 400 });
  }
}
