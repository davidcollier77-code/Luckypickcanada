import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getClientIp, checkApiRateLimit } from '../../spam-protection';

export const runtime = 'nodejs';

function readStoredLuckyReveal(metadata: Record<string, string>) {
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

function createStableLuckyReveal(game: '6' | '7', seedSource: string) {
  let seed = 2166136261;

  for (let index = 0; index < seedSource.length; index += 1) {
    seed ^= seedSource.charCodeAt(index);
    seed = Math.imul(seed, 16777619);
  }

  const random = () => {
    seed += 0x6D2B79F5;
    let value = seed;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };

  const isSevenPick = game === '7';
  const count = isSevenPick ? 7 : 6;
  const max = isSevenPick ? 50 : 49;
  const numbers = Array.from({ length: max }, (_, index) => index + 1);

  for (let index = numbers.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [numbers[index], numbers[swapIndex]] = [numbers[swapIndex], numbers[index]];
  }

  const luckyColors = ['Aurora Green', 'Star Gold', 'Midnight Blue', 'Lucky Red', 'Moonlight Silver', 'Northern Purple', 'Sky Blue'];
  const luckyDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  return {
    game,
    numbers: numbers.slice(0, count).sort((a, b) => a - b),
    luckyColor: luckyColors[Math.floor(random() * luckyColors.length)],
    luckyDay: luckyDays[Math.floor(random() * luckyDays.length)],
  };
}

/**
 * Verifies with Stripe that a checkout is paid and has a supported checkout type.
 * Lucky Pick reveals are generated server-side and derived from the verified
 * Checkout Session ID so concurrent requests resolve to the same reveal even
 * when Stripe metadata persistence is delayed or unavailable.
 *
 * @param request - Request with the Stripe checkout ID in the session_id query parameter.
 * @returns JSON with the verified game/reveal and an allowlisted metadata subset,
 * or an error for rate limits, missing configuration, invalid sessions, unsupported
 * checkout types, or unpaid checkouts.
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
    let reveal: ReturnType<typeof readStoredLuckyReveal> = null;

    if (checkoutType === 'lucky_pick') {
      reveal = readStoredLuckyReveal(metadata);

      if (!reveal) {
        reveal = createStableLuckyReveal(game, `${secretKey}:${sessionId}`);

        try {
          await stripe.checkout.sessions.update(sessionId, {
            metadata: {
              ...metadata,
              luckyPickNumbers: reveal.numbers.join(','),
              luckyPickLuckyColor: reveal.luckyColor,
              luckyPickLuckyDay: reveal.luckyDay,
            },
          });
        } catch (error) {
          // Verification already proved payment. Persistence is best-effort because
          // the stable server-derived reveal remains the same on subsequent requests.
          console.error('Lucky reveal metadata persistence failed:', error);
        }
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
