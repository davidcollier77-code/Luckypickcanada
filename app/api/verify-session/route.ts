import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createLuckyReveal } from '../../lucky-reveal';
import { getClientIp, checkApiRateLimit } from '../../spam-protection';
import { getSql, initializeDatabase } from '../../lib/db-init';

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
      const sql = getSql();

      if (!sql) {
        // Fallback to purely Stripe metadata if database is fundamentally unconfigured.
        // In production we expect the Neon DB to be present.
        reveal = readStoredLuckyReveal(session.metadata || {});
        if (!reveal) {
            console.error('Neon Database not configured, and no Stripe metadata exists. Cannot persist authoritative reveal.');
            return NextResponse.json({ error: 'Database persistence unavailable' }, { status: 500 });
        }
      } else {
        // Ensure DB schema is ready
        await initializeDatabase();

        try {
          // 1. Check if we already have an authoritative reveal in the DB
          let dbReveal = await sql`
            SELECT game, numbers, lucky_color, lucky_day
            FROM lucky_reveals
            WHERE session_id = ${sessionId}
          `;

          if (dbReveal && dbReveal.length > 0) {
            // Authoritative reveal found - validate before using
            const row = dbReveal[0];
            const game = row.game === '7' ? '7' : '6';
            const expectedCount = game === '7' ? 7 : 6;
            const max = game === '7' ? 50 : 49;
            const numbers = String(row.numbers || '')
              .split(',')
              .map((value) => Number(value.trim()));

            if (
              !row.lucky_color ||
              !row.lucky_day ||
              numbers.length !== expectedCount ||
              numbers.some((number) => !Number.isInteger(number) || number < 1 || number > max) ||
              new Set(numbers).size !== numbers.length
            ) {
              console.error('Invalid reveal data found in database for session:', sessionId);
              return NextResponse.json({ error: 'Invalid stored reveal data' }, { status: 500 });
            }

            reveal = {
              game,
              numbers,
              luckyColor: row.lucky_color,
              luckyDay: row.lucky_day,
            };
          } else {
            // 2. No authoritative reveal found. Check Stripe metadata for migration.
            const existingReveal = readStoredLuckyReveal(session.metadata || {});
            let revealToInsert;

            if (existingReveal) {
              // Preserve existing paid reveal from Stripe metadata
              revealToInsert = existingReveal;
            } else {
              // Generate a new reveal
              const generatedReveal = createLuckyReveal(session.metadata?.luckyPickGame === '7' ? '7' : '6');
              revealToInsert = {
                game: generatedReveal.game.name.startsWith('7') ? '7' : '6',
                numbers: generatedReveal.game.numbers,
                luckyColor: generatedReveal.luckyColor,
                luckyDay: generatedReveal.luckyDay,
              };
            }

            const numbersString = revealToInsert.numbers.join(',');
            const gameValue = revealToInsert.game;

            // 3. Atomically attempt to insert the new reveal. ON CONFLICT DO NOTHING ensures
            // if a concurrent request beat us to it, we don't overwrite the authoritative one.
            await sql`
              INSERT INTO lucky_reveals (session_id, game, numbers, lucky_color, lucky_day)
              VALUES (
                ${sessionId},
                ${gameValue},
                ${numbersString},
                ${revealToInsert.luckyColor},
                ${revealToInsert.luckyDay}
              )
              ON CONFLICT (session_id) DO NOTHING
            `;

            // 4. Re-read from DB to get the actual authoritative reveal (either ours or the concurrent winner's)
            dbReveal = await sql`
              SELECT game, numbers, lucky_color, lucky_day
              FROM lucky_reveals
              WHERE session_id = ${sessionId}
            `;

            if (dbReveal && dbReveal.length > 0) {
              const row = dbReveal[0];
              const game = row.game === '7' ? '7' : '6';
              const expectedCount = game === '7' ? 7 : 6;
              const max = game === '7' ? 50 : 49;
              const numbers = String(row.numbers || '')
                .split(',')
                .map((value) => Number(value.trim()));

              if (
                !row.lucky_color ||
                !row.lucky_day ||
                numbers.length !== expectedCount ||
                numbers.some((number) => !Number.isInteger(number) || number < 1 || number > max) ||
                new Set(numbers).size !== numbers.length
              ) {
                console.error('Invalid reveal data found in database after insert for session:', sessionId);
                return NextResponse.json({ error: 'Invalid stored reveal data' }, { status: 500 });
              }

              reveal = {
                game,
                numbers,
                luckyColor: row.lucky_color,
                luckyDay: row.lucky_day,
              };

              // 5. Update Stripe metadata for convenience/read-through.
              // Ignore failures since the DB is now the absolute source of truth.
              try {
                session = await stripe.checkout.sessions.update(sessionId, {
                  metadata: {
                    ...(session.metadata || {}),
                    luckyPickNumbers: numbers.join(','),
                    luckyPickLuckyColor: row.lucky_color,
                    luckyPickLuckyDay: row.lucky_day,
                  },
                });
              } catch (stripeUpdateError) {
                console.error('Non-critical: Failed to update Stripe metadata with DB authoritative reveal', stripeUpdateError);
              }
            } else {
              console.error('Failed to retrieve reveal from DB immediately after insert attempt.');
              return NextResponse.json({ error: 'Failed to retrieve authoritative reveal' }, { status: 500 });
            }
          }
        } catch (dbError) {
          console.error('Database error during Lucky Pick reveal persistence:', dbError);
          return NextResponse.json({ error: 'Database persistence failed' }, { status: 500 });
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
