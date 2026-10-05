import { Redis } from '@upstash/redis';
const luckyColors = ['Aurora Green', 'Star Gold', 'Midnight Blue', 'Lucky Red', 'Moonlight Silver', 'Northern Purple', 'Sky Blue'];
const luckyDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export function generateNumbers(count, max) {
  const numbers = Array.from({ length: max }, (_, index) => index + 1);

  for (let index = numbers.length - 1; index > 0; index -= 1) {
    const randomBuffer = new Uint32Array(1);
    crypto.getRandomValues(randomBuffer);
    const swapIndex = randomBuffer[0] % (index + 1);
    [numbers[index], numbers[swapIndex]] = [numbers[swapIndex], numbers[index]];
  }

  return numbers.slice(0, count).sort((a, b) => a - b);
}

function pickOne(items) {
  const randomBuffer = new Uint32Array(1);
  crypto.getRandomValues(randomBuffer);
  return items[randomBuffer[0] % items.length];
}

function escapeHtml(value) {
  return String(value || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export function createGiftReveal(metadata) {
  const isSevenPick = metadata.luckyPickGame === '7';
  const numbers = generateNumbers(isSevenPick ? 7 : 6, isSevenPick ? 50 : 49);

  return {
    gameName: isSevenPick ? '7 Pick' : '6 Pick',
    numbers,
    luckyColor: pickOne(luckyColors),
    luckyDay: pickOne(luckyDays),
  };
}

export function buildGiftEmail({ metadata, gameName, numbers, luckyColor, luckyDay }) {
  const recipientName = escapeHtml(metadata.recipientName || 'Friend');
  const senderName = escapeHtml(metadata.senderName || 'Someone');
  const giftMessage = escapeHtml(metadata.giftMessage || 'Wishing you a lucky day.');
  const numberHtml = numbers.map((number) => `<span style="display:inline-grid;place-items:center;width:42px;height:42px;margin:4px;border-radius:50%;background:#fef3c7;color:#0f172a;font-weight:900;box-shadow:0 0 18px rgba(250,204,21,0.6);">${number}</span>`).join('');

  return `
    <div style="margin:0;padding:28px;background:#061826;color:#f8fafc;font-family:Arial,Helvetica,sans-serif;">
      <div style="max-width:640px;margin:0 auto;padding:28px;border-radius:28px;background:radial-gradient(circle at 10% 5%, rgba(250,204,21,0.22), transparent 18%), radial-gradient(circle at 82% 12%, rgba(94,234,212,0.32), transparent 24%), linear-gradient(140deg,#03131f,#0f172a 52%,#164e63);border:1px solid rgba(153,246,228,0.42);">
        <p style="margin:0 0 10px;text-transform:uppercase;letter-spacing:2px;color:#99f6e4;font-weight:800;">Lucky Pick Canada Gift</p>
        <h1 style="margin:0 0 16px;font-size:34px;line-height:1;">${recipientName}, your lucky reveal is here</h1>
        <p style="font-size:17px;line-height:1.6;">${senderName} sent you a Lucky Pick Canada reveal.</p>
        <blockquote style="margin:18px 0;padding:16px;border-left:4px solid #5eead4;background:rgba(255,255,255,0.1);border-radius:14px;line-height:1.6;">${giftMessage}</blockquote>
        <h2 style="margin:22px 0 10px;">${escapeHtml(gameName)}</h2>
        <div>${numberHtml}</div>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:12px;margin-top:18px;">
          <div style="padding:14px;border-radius:18px;background:rgba(153,246,228,0.16);border:1px solid rgba(153,246,228,0.34);">
            <p style="margin:0 0 6px;color:#99f6e4;font-weight:800;">Lucky color</p>
            <strong style="font-size:21px;">${escapeHtml(luckyColor)}</strong>
          </div>
          <div style="padding:14px;border-radius:18px;background:rgba(253,230,138,0.15);border:1px solid rgba(253,230,138,0.34);">
            <p style="margin:0 0 6px;color:#fde68a;font-weight:800;">Lucky day</p>
            <strong style="font-size:21px;">${escapeHtml(luckyDay)}</strong>
          </div>
        </div>
        <p style="margin-top:22px;line-height:1.6;color:#d1fae5;">Auroras and stars have revealed your randomly generated lucky pick. Picks are for fun and entertainment only.</p>
      </div>
    </div>
  `;
}

export async function sendGiftEmail({ metadata, resendApiKey, fromEmail, reveal = createGiftReveal(metadata) }) {
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: fromEmail,
      to: metadata.recipientEmail,
      subject: `${metadata.senderName || 'Someone'} sent you a Lucky Pick Canada gift`,
      html: buildGiftEmail({ metadata, ...reveal }),
    }),
  });

  if (!response.ok) {
    return { ok: false, details: await response.text(), reveal };
  }

  return { ok: true, details: await response.text(), reveal };
}

export const GIFT_PROCESSING_MARKER = 'processing';

export function isGiftDelivered(metadata) {
  const marker = metadata?.giftDeliveredAt;
  return Boolean(marker) && marker !== GIFT_PROCESSING_MARKER;
}

function validateGiftSession(session) {
  const metadata = session.metadata || {};

  if (session.payment_status !== 'paid' || metadata.checkoutType !== 'gift_package' || session.amount_total !== 299 || session.currency !== 'cad') {
    return { ok: false, reason: 'Only a paid $2.99 gift package can send a gift email.' };
  }

  if (isGiftDelivered(metadata)) {
    return { ok: true, alreadyDelivered: true, metadata };
  }

  // An intermediate `processing` claim is never a completed delivery. It is left in place so
  // the in-flight lock still arbitrates, and it is overwritten by the durable marker once a
  // later attempt confirms the email, so a terminated process recovers on retry instead of
  // leaving the session permanently claimed.

  if (!metadata.recipientEmail || !metadata.recipientName) {
    return { ok: false, reason: 'The gift recipient details were missing.' };
  }

  return { ok: true, alreadyDelivered: false, metadata };
}

// One TTL for both the Redis lock and the in-memory fallback so a terminated process recovers on
// the same deadline regardless of which path claimed the session.
const GIFT_LOCK_TTL_MS = 120000;

// Stripe retries `checkout.session.completed` and the async payment equivalents
// for up to ~3 days, so the durable sent marker has to outlive that retry window.
// A shorter TTL lets a late retry find no marker and send a second gift email.
const GIFT_SENT_MARKER_TTL_SECONDS = 7 * 24 * 60 * 60;

const RELEASE_LOCK_SCRIPT = "if redis.call('get', KEYS[1]) == ARGV[1] then return redis.call('del', KEYS[1]) else return 0 end";

// Process-level fallback store used when Redis is unconfigured or unreachable. Entries are
// { token, expiresAt } so acquisition is a compare-and-set and release can verify the token
// instead of blindly deleting a lock that has since been handed to another request.
const memoryGiftLocks = new Map();
const memoryGiftSentMarkers = new Map();

function pruneExpiredEntries(store, nowMs) {
  for (const [key, entry] of store.entries()) {
    if (entry.expiresAt <= nowMs) {
      store.delete(key);
    }
  }
}

function getRedisClient() {
  try {
    if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
      return null;
    }
    return Redis.fromEnv();
  } catch (error) {
    console.error('Redis client initialization failed', error);
    return null;
  }
}

function acquireMemoryGiftLock(sessionId, nowMs) {
  pruneExpiredEntries(memoryGiftLocks, nowMs);

  if (memoryGiftLocks.has(sessionId)) {
    return null;
  }

  const token = crypto.randomUUID();
  memoryGiftLocks.set(sessionId, { token, expiresAt: nowMs + GIFT_LOCK_TTL_MS });
  return token;
}

function releaseMemoryGiftLock(sessionId, token) {
  const entry = memoryGiftLocks.get(sessionId);

  if (!entry || entry.token !== token) {
    return false;
  }

  return memoryGiftLocks.delete(sessionId);
}

// Redis is the distributed lock of record. When it is unconfigured or unreachable, the in-memory
// lock provides the same mutual exclusion for this process, using the same unique-token acquire
// and compare-and-set release semantics rather than a blind write.
async function acquireGiftLock(redis, sessionId) {
  if (redis) {
    const lockKey = `gift_lock:${sessionId}`;
    const lockToken = crypto.randomUUID();

    try {
      const claimed = await redis.set(lockKey, lockToken, { px: GIFT_LOCK_TTL_MS, nx: true });

      if (claimed !== null) {
        return {
          held: false,
          release: async () => {
            try {
              await redis.eval(RELEASE_LOCK_SCRIPT, [lockKey], [lockToken]);
            } catch (error) {
              console.error('Failed to release gift lock', error);
            }
          },
        };
      }

      return { held: true };
    } catch (error) {
      console.error('Failed to acquire gift lock', error);
    }
  }

  const memoryToken = acquireMemoryGiftLock(sessionId, Date.now());

  if (!memoryToken) {
    return { held: true };
  }

  return {
    held: false,
    release: async () => {
      releaseMemoryGiftLock(sessionId, memoryToken);
    },
  };
}

async function wasGiftAlreadySent(redis, sessionId, errorMessage = 'Failed to check sent marker') {
  if (redis) {
    try {
      if (await redis.get(`gift_sent:${sessionId}`)) {
        return true;
      }

      return false;
    } catch (error) {
      console.error(errorMessage, error);
    }
  }

  pruneExpiredEntries(memoryGiftSentMarkers, Date.now());
  return memoryGiftSentMarkers.has(sessionId);
}

async function rememberGiftSent(redis, sessionId) {
  if (redis) {
    try {
      await redis.set(`gift_sent:${sessionId}`, '1', { px: GIFT_SENT_MARKER_TTL_SECONDS * 1000 });
      return;
    } catch (error) {
      console.error('CRITICAL: Gift email was delivered but the durable gift sent marker could not be written; a retry may send a duplicate gift.', error);
    }
  }

  const nowMs = Date.now();
  pruneExpiredEntries(memoryGiftSentMarkers, nowMs);

  if (!memoryGiftSentMarkers.has(sessionId)) {
    memoryGiftSentMarkers.set(sessionId, { token: '1', expiresAt: nowMs + GIFT_SENT_MARKER_TTL_SECONDS * 1000 });
  }
}

export async function deliverGiftEmailForSession(stripe, sessionId) {
  const resendApiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.GIFT_FROM_EMAIL;

  if (!resendApiKey || !fromEmail) {
    return { ok: false, reason: 'Gift email is ready, but email delivery needs RESEND_API_KEY and GIFT_FROM_EMAIL.' };
  }

  const session = await stripe.checkout.sessions.retrieve(sessionId);
  const validation = validateGiftSession(session);

  if (!validation.ok || validation.alreadyDelivered) {
    return validation;
  }

  const metadata = validation.metadata;
  const redis = getRedisClient();

  if (await wasGiftAlreadySent(redis, sessionId)) {
    return { ok: true, alreadyDelivered: true, metadata };
  }

  const lock = await acquireGiftLock(redis, sessionId);

  if (lock.held) {
    return { ok: false, reason: 'Gift fulfillment is already in progress for this session.', lockHeld: true };
  }

  const reveal = createGiftReveal(metadata);
  const giftDeliveredAt = new Date().toISOString();

  try {
    // Re-read the durable sent marker now that the lock is held. The read before lock
    // acquisition runs a Redis round-trip first, which leaves a TOCTOU window: a concurrent
    // request can send the email, write the marker, and release the lock before this one claims
    // it. Holding the lock makes this second read authoritative. Keep it, or a retry sends a
    // second gift email with a freshly randomized reveal.
    if (await wasGiftAlreadySent(redis, sessionId, 'Failed to re-check sent marker after acquiring gift lock')) {
      return { ok: true, alreadyDelivered: true, metadata };
    }

    const emailResult = await sendGiftEmail({ metadata, resendApiKey, fromEmail, reveal });

    if (!emailResult.ok) {
      console.error('Gift email failed', emailResult.details);
      return { ok: false, reason: 'Payment succeeded, but the gift email could not be sent right now.' };
    }

    // The email is out, so record it before the Stripe write. Writing the durable marker here,
    // rather than after the Stripe update, is what makes delivery at-most-once: a Stripe failure
    // can no longer leave a sent gift unrecorded, and a retry that reads the marker is stopped
    // before it can send a second gift with a differently randomized reveal.
    await rememberGiftSent(redis, sessionId);

    // The durable Stripe marker is written only after the email is confirmed sent.
    try {
      await stripe.checkout.sessions.update(sessionId, {
        metadata: {
          ...metadata,
          giftDeliveredAt,
          giftNumbers: reveal.numbers.join(','),
          giftLuckyColor: reveal.luckyColor,
          giftLuckyDay: reveal.luckyDay,
        },
      });
    } catch (stripeError) {
      console.error('Failed to update Stripe metadata after successful email delivery', stripeError);
    }

    return { ok: true, delivered: true, reveal };
  } finally {
    // Always release the claim, including when sendGiftEmail throws, so a failed or terminated
    // attempt can never leave the session permanently claimed.
    await lock.release();
  }
}
