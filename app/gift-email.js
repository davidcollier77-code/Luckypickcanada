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

/**
 * Get Redis client for gift delivery locking.
 * Returns null if Redis is not configured (graceful degradation).
 */
function getRedisClient() {
  try {
    if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
      console.warn('Redis not configured for gift delivery locking');
      return null;
    }
    return Redis.fromEnv();
  } catch (error) {
    console.warn('Redis initialization failed:', error.message);
    return null;
  }
}

/**
 * Atomically claim the gift delivery lock for a session using SET NX.
 * Returns { ok: true, token } on success, { ok: false } if already locked.
 * 
 * The token must be used to safely release the lock later.
 */
async function claimGiftDeliveryLock(sessionId) {
  const redis = getRedisClient();
  if (!redis) {
    // No Redis available - cannot guarantee atomicity
    // Fall back to Stripe metadata check only
    return { ok: true, token: null, noRedis: true };
  }
  
  const lockKey = `gift-delivery-lock:${sessionId}`;
  const ownershipToken = `${sessionId}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const ttlSeconds = 300; // 5 minutes - enough for email send + Stripe update
  
  try {
    // SET NX - only set if key doesn't exist (atomic)
    // Returns 'OK' if set, null if key already exists
    const result = await redis.set(lockKey, ownershipToken, {
      nx: true,  // SET NX: Only set if not exists
      ex: ttlSeconds  // Expiration in seconds
    });
    
    if (result === 'OK') {
      return { ok: true, token: ownershipToken };
    }
    
    // Lock already held by another request
    return { ok: false, reason: 'Lock already held by another request' };
  } catch (error) {
    console.error('Failed to claim gift delivery lock:', error);
    return { ok: false, reason: 'Lock claim failed' };
  }
}

/**
 * Release the gift delivery lock with ownership verification.
 * Only releases if the provided token matches the stored token.
 */
async function releaseGiftDeliveryLock(sessionId, ownershipToken) {
  if (!ownershipToken) return { ok: true }; // No token means no Redis, nothing to release
  
  const redis = getRedisClient();
  if (!redis) return { ok: true };
  
  const lockKey = `gift-delivery-lock:${sessionId}`;
  
  try {
    const storedToken = await redis.get(lockKey);
    
    // Only delete if we own the lock
    if (storedToken === ownershipToken) {
      await redis.del(lockKey);
      return { ok: true };
    }
    
    return { ok: false, reason: 'Token mismatch - lock owned by another request' };
  } catch (error) {
    console.error('Failed to release gift delivery lock:', error);
    return { ok: false, reason: 'Lock release failed' };
  }
}

export async function sendGiftEmail({ metadata, resendApiKey, fromEmail, reveal = createGiftReveal(metadata), sessionId }) {
  // Derive stable idempotency key from the verified Stripe Checkout Session ID
  // This ensures retries for the same session cannot create duplicate emails
  const idempotencyKey = sessionId ? `gift-${sessionId}` : undefined;
  
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      'Content-Type': 'application/json',
      // Add idempotency header to prevent duplicate sends on retry
      ...(idempotencyKey && { 'Idempotency-Key': idempotencyKey }),
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

export async function deliverGiftEmailForSession(stripe, sessionId) {
  // CRITICAL: Claim atomic lock BEFORE any side effects
  // This prevents race conditions between concurrent webhook/fallback requests
  const lockResult = await claimGiftDeliveryLock(sessionId);
  
  if (!lockResult.ok) {
    // Lock already held - another request is processing this gift
    // Check if delivery completed by querying Stripe
    try {
      const session = await stripe.checkout.sessions.retrieve(sessionId);
      if (session.metadata?.giftDeliveredAt) {
        return { ok: true, alreadyDelivered: true, delivered: true, metadata: session.metadata };
      }
    } catch (error) {
      console.error('Failed to check delivery status:', error);
    }
    
    return { 
      ok: false, 
      reason: 'Gift delivery is being processed by another request',
      concurrent: true 
    };
  }
  
  const ownershipToken = lockResult.token;
  
  const resendApiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.GIFT_FROM_EMAIL;

  if (!resendApiKey || !fromEmail) {
    return { ok: false, reason: 'Gift email is ready, but email delivery needs RESEND_API_KEY and GIFT_FROM_EMAIL.' };
  }

  const session = await stripe.checkout.sessions.retrieve(sessionId);
  const validation = validateGiftSession(session);

  if (!validation.ok) {
    return validation;
  }

  if (validation.alreadyDelivered) {
    // Already delivered - release lock and return
    await releaseGiftDeliveryLock(sessionId, ownershipToken);
    return { ok: true, alreadyDelivered: true, delivered: true, metadata: validation.metadata };
  }

  const metadata = validation.metadata;
  const reveal = createGiftReveal(metadata);
  
  // Mark as delivered in Stripe BEFORE sending email (optimistic claim)
  // This provides additional safety even if lock fails

  await stripe.checkout.sessions.update(sessionId, {
    metadata: {
      ...metadata,
      giftDeliveredAt: new Date().toISOString(),
      giftNumbers: reveal.numbers.join(','),
      giftLuckyColor: reveal.luckyColor,
      giftLuckyDay: reveal.luckyDay,
    },
  });

  // Send email with idempotency protection
  const emailResult = await sendGiftEmail({ metadata, resendApiKey, fromEmail, reveal, sessionId });

  if (!emailResult.ok) {
    console.error('Gift email failed', emailResult.details);

    // Email failed - roll back the delivery claim
    try {
      await stripe.checkout.sessions.update(sessionId, {
        metadata: {
          ...metadata,
          giftDeliveredAt: null,
          giftNumbers: null,
          giftLuckyColor: null,
          giftLuckyDay: null,
        },
      });
    } catch (releaseError) {
      console.error('Failed to release gift delivery claim', releaseError);
    }
    
    // Release the lock before returning
    await releaseGiftDeliveryLock(sessionId, ownershipToken);

    return { ok: false, reason: 'Payment succeeded, but the gift email could not be sent right now.' };
  }
  
  // Success - release the lock
  await releaseGiftDeliveryLock(sessionId, ownershipToken);

  return { ok: true, delivered: true, reveal };
}
