import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { Redis } from '@upstash/redis';
import { createLuckyReveal } from '../../lucky-reveal';
import { getClientIp, checkApiRateLimit } from '../../spam-protection';

export const runtime = 'nodejs';

const LUCKY_REVEAL_LOCK_TTL_SECONDS = 30;
const RELEASE_LUCKY_REVEAL_LOCK_SCRIPT = `
  if redis.call('GET', KEYS[1]) == ARGV[1] then
    return redis.call('DEL', KEYS[1])
  end
  return 0
`;

function getRedisClient() {
  try {
    if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
      return null;
    }
    return Redis.fromEnv();
  } catch (error) {
    console.error('Redis client initialization failed for lucky reveal persistence', error);
    return null;
  }
}

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

async function claimLuckyRevealLock(sessionId: string) {
  const redis = getRedisClient();
  if (!redis) {
    return { ok: false, reason: 'Lucky reveal persistence is temporarily unavailable.' };
  }

  const key = `lucky-reveal-lock:${sessionId}`;
  const token = crypto.randomUUID();

  try {
    const result = await redis.set(key, token, {
      nx: true,
      ex: LUCKY_REVEAL_LOCK_TTL_SECONDS,
    });

    if (result === 'OK') {
      return { ok: true, token };
    }

    return { ok: false, reason: 'Lucky reveal is being prepared by another request.' };
  } catch (error) {
    console.error('Failed to claim lucky reveal lock', error);
    return { ok: false, reason: 'Lucky reveal persistence is temporarily unavailable.' };
  }
}

async function releaseLuckyRevealLock(sessionId: string, token: string) {
  const redis = getRedisClient();
  if (!redis) return;

  const key = `lucky-reveal-lock:${sessionId}`;

  try {
    const result = await redis.eval(
      RELEASE_LUCKY_REVEAL_LOCK_SCRIPT,
      [key],
      [token]
    ) as number;
    if (result === 0) {
      console.error('Lock release failed: token mismatch or lock not found', { sessionId });
    }
  } catch (error) {
    console.error('Failed to release lucky reveal lock', error);
  }
}

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
    let session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== 'paid') {
      return NextResponse.json({ error: 'Payment not completed' }, { status: 402 });
    }

    const checkoutType = session.metadata?.checkoutType;
    if (checkoutType !== 'lucky_pick' && checkoutType !== 'gift_package') {
      return NextResponse.json({ error: 'Invalid checkout type' }, { status: 400 });
    }

    let reveal = null;

    if (checkoutType === 'lucky_pick') {
      reveal = readStoredLuckyReveal(session.metadata || {});

      if (!reveal) {
        const lock = await claimLuckyRevealLock(sessionId);

        if (!lock.ok) {
          // Another request may already be persisting the reveal. Re-read Stripe
          // once so a concurrent successful write can be used immediately.
          session = await stripe.checkout.sessions.retrieve(sessionId);
          reveal = readStoredLuckyReveal(session.metadata || {});

          if (!reveal) {
            return NextResponse.json(
              { error: lock.reason || 'Unable to prepare lucky reveal.' },
              { status: lock.reason?.includes('another request') ? 409 : 503 }
            );
          }
        } else {
          let releaseLock = true;

          try {
            // Re-read after acquiring the lock so a reveal written just before
            // the lock was acquired is reused rather than regenerated.
            session = await stripe.checkout.sessions.retrieve(sessionId);
            reveal = readStoredLuckyReveal(session.metadata || {});

            if (!reveal) {
              const generatedReveal = createLuckyReveal(session.metadata?.luckyPickGame === '7' ? '7' : '6');

              session = await stripe.checkout.sessions.update(sessionId, {
                metadata: {
                  ...(session.metadata || {}),
                  luckyPickNumbers: generatedReveal.game.numbers.join(','),
                  luckyPickLuckyColor: generatedReveal.luckyColor,
                  luckyPickLuckyDay: generatedReveal.luckyDay,
                },
              });

              reveal = readStoredLuckyReveal(session.metadata || {});

              if (!reveal) {
                // The update returned without verifiable reveal metadata. Re-read
                // Stripe once before treating persistence as failed.
                session = await stripe.checkout.sessions.retrieve(sessionId);
                reveal = readStoredLuckyReveal(session.metadata || {});

                if (!reveal) {
                  // Do not release an ownership lock after an uncertain write.
                  // Let the short TTL expire rather than allowing another request
                  // to generate a second reveal for the same paid session.
                  releaseLock = false;
                  throw new Error('Lucky reveal persistence could not be verified after Stripe update');
                }
              }
            }
          } finally {
            if (releaseLock) {
              await releaseLuckyRevealLock(sessionId, lock.token);
            }
          }
        }
      }
    }

    const m = session.metadata || {};
    return NextResponse.json({
      success: true,
      game: m.luckyPickGame === '7' ? '7' : '6',
      metadata: {
        checkoutType,
        giftDeliveredAt: m.giftDeliveredAt || '',
        giftNumbers: m.giftNumbers || '',
        giftLuckyColor: m.giftLuckyColor || '',
        giftLuckyDay: m.giftLuckyDay || '',
      },
      ...(reveal ? { reveal } : {}),
    });
  } catch (error) {
    console.error('Session verification failed:', error);
    return NextResponse.json({ error: 'Invalid session' }, { status: 400 });
  }
}
