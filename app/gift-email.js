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

function validateGiftSession(session) {
  const metadata = session.metadata || {};

  if (session.payment_status !== 'paid' || metadata.checkoutType !== 'gift_package' || session.amount_total !== 299 || session.currency !== 'cad') {
    return { ok: false, reason: 'Only a paid $2.99 gift package can send a gift email.' };
  }

  if (metadata.giftDeliveredAt) {
    return { ok: true, alreadyDelivered: true, metadata };
  }

  if (!metadata.recipientEmail || !metadata.recipientName) {
    return { ok: false, reason: 'The gift recipient details were missing.' };
  }

  return { ok: true, alreadyDelivered: false, metadata };
}




function getRedisClient() {
  try {
    if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
      return null;
    }
    return Redis.fromEnv();
  } catch (error) {
    console.error('Gift Redis client initialization failed', { operation: 'fromEnv', error });
    return null;
  }
}

const GIFT_LOCK_TTL_MS = 120000;

// Fallback lock store for environments without Upstash configured, so an
// unconfigured environment degrades to per-instance locking instead of
// dropping the concurrency guard entirely.
const memoryGiftLocks = new Map();

function pruneMemoryGiftLocks() {
  const currentTime = Date.now();

  for (const [key, entry] of memoryGiftLocks) {
    if (entry.expiresAt <= currentTime) {
      memoryGiftLocks.delete(key);
    }
  }
}

async function acquireGiftLock(redis, lockKey) {
  if (redis) {
    try {
      const claimed = await redis.set(lockKey, '1', { px: GIFT_LOCK_TTL_MS, nx: true });
      if (claimed === null) {
        return { acquired: false, inProgress: true };
      }
    } catch (err) {
      console.error('Failed to acquire gift lock', err);
      return { acquired: false, unavailable: true };
    }

    return { acquired: true };
  }

  pruneMemoryGiftLocks();

  if (memoryGiftLocks.has(lockKey)) {
    return { acquired: false, inProgress: true };
  }

  memoryGiftLocks.set(lockKey, { expiresAt: Date.now() + GIFT_LOCK_TTL_MS });
  return { acquired: true };
}

async function releaseGiftLock(redis, lockKey) {
  try {
    if (redis) {
      await redis.del(lockKey);
      return;
    }

    memoryGiftLocks.delete(lockKey);
  } catch (e) {
    console.error('Failed to release gift lock', e);
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

  // Atomic lock using Redis to prevent concurrent webhook/fallback race conditions
  const redis = getRedisClient();
  const lockKey = `gift_lock:${sessionId}`;
  const lock = await acquireGiftLock(redis, lockKey);

  if (!lock.acquired) {
    return {
      ok: false,
      reason: lock.unavailable
        ? 'Gift fulfillment service temporarily unavailable.'
        : 'Gift fulfillment is already in progress for this session.',
    };
  }

  const metadata = validation.metadata;
  const reveal = createGiftReveal(metadata);
  const giftDeliveredAt = new Date().toISOString();

  const emailResult = await sendGiftEmail({ metadata, resendApiKey, fromEmail, reveal });

  if (!emailResult.ok) {
    console.error('Gift email failed', emailResult.details);
    await releaseGiftLock(redis, lockKey);
    return { ok: false, reason: 'Payment succeeded, but the gift email could not be sent right now.' };
  }

  // Only mark as delivered AFTER successful send
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

  await releaseGiftLock(redis, lockKey);

  return { ok: true, delivered: true, reveal };
}
