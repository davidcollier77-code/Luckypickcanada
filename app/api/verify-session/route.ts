import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createLuckyReveal } from '../../lucky-reveal';
import { getClientIp, checkApiRateLimit } from '../../spam-protection';

export const runtime = 'nodejs';

function readStoredLuckyReveal(metadata) {
  const game = metadata.luckyPickGame === '7' ? '7' : '6';
  const expectedCount = game === '7' ? 7 : 6;
  const max = game === '7' ? 50 : 49;
  const numbers = String(metadata.luckyPickNumbers || '')
    .split(',')
    .map((value) => Number(value.trim()));

  if (
    !metadata.luckyPickLuckyColor ||
    !metadata.luckyPickLuckyDay ||
    numbers.length !== expectedCount ||
    numbers.some((number) => !Number.isInteger(number) || number < 1 || number > max) ||
    new Set(numbers).size !== numbers.length
  ) {
    return null;
  }

  return {
    game,
    numbers,
    luckyColor: metadata.luckyPickLuckyColor,
    luckyDay: metadata.luckyPickLuckyDay,
  };
}

/**
 * Verifies with Stripe that a checkout is paid and has a supported checkout type.
 * Lucky Pick reveals are generated server-side and persisted to the Stripe session
 * so the same paid checkout always returns the same reveal.
 *
 * @param request - Request with the Stripe checkout ID in the session_id query parameter.
 * @returns JSON with the verified game/reveal and an allowlisted metadata subset,
 * or an error for rate limits, missing configuration, invalid sessions, unsupported
 * checkout types, unpaid checkouts, or persistence failures.
 */
export async function GET(request: Request) {
  const ip = getClientIp(request);
  const rateLimit = await checkApiRateLimit(ip, 'verify_session', 20, 60000);
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

    const metadata = session.metadata || {};
    const checkoutType = metadata.checkoutType;

    if (checkoutType !== 'lucky_pick' && checkoutType !== 'gift_package') {
      return NextResponse.json({ error: 'Invalid checkout type' }, { status: 400 });
    }

    const game = metadata.luckyPickGame === '7' ? '7' : '6';
    let reveal;

    if (checkoutType === 'lucky_pick') {
      reveal = readStoredLuckyReveal(metadata);

      if (!reveal) {
        const generatedReveal = createLuckyReveal(game);

        await stripe.checkout.sessions.update(sessionId, {
          metadata: {
            ...metadata,
            luckyPickNumbers: generatedReveal.game.numbers.join(','),
            luckyPickLuckyColor: generatedReveal.luckyColor,
            luckyPickLuckyDay: generatedReveal.luckyDay,
          },
        });

        reveal = {
          game,
          numbers: generatedReveal.game.numbers,
          luckyColor: generatedReveal.luckyColor,
          luckyDay: generatedReveal.luckyDay,
        };
      }
    }

    const safeMetadata = {
      checkoutType,
      giftDeliveredAt: metadata.giftDeliveredAt || '',
      giftNumbers: metadata.giftNumbers || '',
      giftLuckyColor: metadata.giftLuckyColor || '',
      giftLuckyDay: metadata.giftLuckyDay || '',
    };

    return NextResponse.json({
      success: true,
      game,
      metadata: safeMetadata,
      ...(reveal ? { reveal } : {}),
    });
  } catch (error) {
    console.error('Session verification failed:', error);
    return NextResponse.json({ error: 'Invalid session' }, { status: 400 });
  }
}
