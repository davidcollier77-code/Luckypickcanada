import { getSql, initializeDatabase } from './lib/db-init';

// Only the two paid reveal products reach the public counter. Tips, previews and
// any future product must be added here deliberately, never by accident.
export const TALLIED_REVEAL_TYPES = Object.freeze(['lucky_pick', 'gift_package']);

function isTalliedRevealType(value) {
  return TALLIED_REVEAL_TYPES.includes(value);
}

/**
 * Records one successfully paid reveal for the homepage counter.
 *
 * The paid checkout session id is the idempotency key: the webhook, the
 * success-page verification and a gift-delivery redirect can all observe the
 * same purchase, and only the first insert wins. `ON CONFLICT DO NOTHING` makes
 * the check-and-increment atomic in a single statement.
 *
 * Never throws to its caller: a payment, delivery or webhook must not fail just
 * because the counter could not be updated.
 *
 * @param {{ sessionId?: string, revealType?: string }} [entry] Paid session id
 *   and the `lucky_pick` or `gift_package` product.
 * @returns {Promise<{ counted: boolean, reason?: string }>} Whether this call
 *   created the first tally row for that purchase.
 */
export async function recordLuckyRevealCreated({ sessionId, revealType } = {}) {
  const normalizedSessionId = typeof sessionId === 'string' ? sessionId.trim() : '';

  if (!normalizedSessionId || !isTalliedRevealType(revealType)) {
    return { counted: false, reason: 'invalid' };
  }

  const sql = getSql();
  if (!sql) {
    return { counted: false, reason: 'unconfigured' };
  }

  try {
    await initializeDatabase();
    const inserted = await sql`
      INSERT INTO lucky_reveal_tally (session_id, reveal_type)
      VALUES (${normalizedSessionId}, ${revealType})
      ON CONFLICT (session_id) DO NOTHING
      RETURNING id
    `;

    return { counted: Array.isArray(inserted) && inserted.length > 0 };
  } catch (error) {
    console.error('Failed to record the paid reveal counter:', error);
    return { counted: false, reason: 'error' };
  }
}

/**
 * Reads the public paid-reveal total. An empty tally table is the requested zero
 * state, and a missing store, malformed value or read failure also reports 0 so
 * the homepage always stays truthful instead of breaking.
 *
 * @returns {Promise<number>} The number of recorded paid reveals, never negative.
 */
export async function getLuckyRevealCount() {
  const sql = getSql();
  if (!sql) {
    return 0;
  }

  try {
    await initializeDatabase();
    const rows = await sql`
      SELECT COUNT(*)::int AS total FROM lucky_reveal_tally
    `;
    const total = Number(rows?.[0]?.total);

    return Number.isFinite(total) && total > 0 ? Math.trunc(total) : 0;
  } catch (error) {
    console.error('Failed to read the paid reveal counter:', error);
    return 0;
  }
}
