import { Redis } from "@upstash/redis";

const luckyColors = [
  "Aurora Green",
  "Star Gold",
  "Midnight Blue",
  "Lucky Red",
  "Moonlight Silver",
  "Northern Purple",
  "Sky Blue",
];
const luckyDays = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

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
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function createGiftReveal(metadata) {
  const isSevenPick = metadata.luckyPickGame === "7";
  const numbers = generateNumbers(isSevenPick ? 7 : 6, isSevenPick ? 50 : 49);

  return {
    gameName: isSevenPick ? "7 Pick" : "6 Pick",
    numbers,
    luckyColor: pickOne(luckyColors),
    luckyDay: pickOne(luckyDays),
  };
}

export function buildGiftEmail({
  metadata,
  gameName,
  numbers,
  luckyColor,
  luckyDay,
}) {
  const recipientName = escapeHtml(metadata.recipientName || "Friend");
  const senderName = escapeHtml(metadata.senderName || "Someone");
  const giftMessage = escapeHtml(
    metadata.giftMessage || "Wishing you a lucky day.",
  );
  const numberHtml = numbers
    .map(
      (number) =>
        `<span style="display:inline-grid;place-items:center;width:42px;height:42px;margin:4px;border-radius:50%;background:#fef3c7;color:#0f172a;font-weight:900;box-shadow:0 0 18px rgba(250,204,21,0.6);">${number}</span>`,
    )
    .join("");

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
    if (
      !process.env.UPSTASH_REDIS_REST_URL ||
      !process.env.UPSTASH_REDIS_REST_TOKEN
    ) {
      console.warn("Redis not configured for gift delivery locking");
      return null;
    }
    return Redis.fromEnv();
  } catch (error) {
    console.warn("Redis initialization failed:", error.message);
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
  const ownershipToken = `${sessionId}-${Date.now()}-${crypto.randomUUID()}`;
  const ttlSeconds = 300; // 5 minutes - enough for email send + Stripe update

  try {
    // SET NX - only set if key doesn't exist (atomic)
    // Returns 'OK' if set, null if key already exists
    const result = await redis.set(lockKey, ownershipToken, {
      nx: true, // SET NX: Only set if not exists
      ex: ttlSeconds, // Expiration in seconds
    });

    if (result === "OK") {
      return { ok: true, token: ownershipToken };
    }

    // Lock already held by another request
    return { ok: false, reason: "Lock already held by another request" };
  } catch (error) {
    console.error("Failed to claim gift delivery lock:", error);
    return { ok: false, reason: "Lock claim failed" };
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
    const result = await redis.eval(
      'if redis.call("GET", KEYS[1]) == ARGV[1] then return redis.call("DEL", KEYS[1]) else return 0 end',
      [lockKey],
      [ownershipToken],
    );

    if (Number(result) === 1) {
      return { ok: true };
    }

    return {
      ok: false,
      reason: "Token mismatch or lock already released",
    };
  } catch (error) {
    console.error("Failed to release gift delivery lock:", error);
    return { ok: false, reason: "Lock release failed" };
  }
}

export async function sendGiftEmail({
  metadata,
  resendApiKey,
  fromEmail,
  reveal = createGiftReveal(metadata),
  sessionId,
}) {
  // Derive stable idempotency key from the verified Stripe Checkout Session ID
  // This ensures retries for the same session cannot create duplicate emails
  const idempotencyKey = sessionId ? `gift-${sessionId}` : undefined;

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
      // Add idempotency header to prevent duplicate sends on retry
      ...(idempotencyKey && { "Idempotency-Key": idempotencyKey }),
    },
    body: JSON.stringify({
      from: fromEmail,
      to: metadata.recipientEmail,
      subject: `${metadata.senderName || "Someone"} sent you a Lucky Pick Canada gift`,
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

  if (
    session.payment_status !== "paid" ||
    metadata.checkoutType !== "gift_package" ||
    session.amount_total !== 299 ||
    session.currency !== "cad"
  ) {
    return {
      ok: false,
      reason: "Only a paid $2.99 gift package can send a gift email.",
    };
  }

  if (metadata.giftDeliveredAt) {
    return { ok: true, alreadyDelivered: true, metadata };
  }

  if (!metadata.recipientEmail || !metadata.recipientName) {
    return { ok: false, reason: "The gift recipient details were missing." };
  }

  return { ok: true, alreadyDelivered: false, metadata };
}

const RESEND_SAFE_RETRY_WINDOW_MS = 23 * 60 * 60 * 1000;

function getStoredPendingGiftReveal(metadata) {
  const isSevenPick = metadata.luckyPickGame === "7";
  const expectedCount = isSevenPick ? 7 : 6;
  const maxNumber = isSevenPick ? 50 : 49;
  const numbers = String(metadata.giftNumbers || "")
    .split(",")
    .map((value) => Number(value));

  if (
    numbers.length !== expectedCount ||
    numbers.some(
      (number) =>
        !Number.isInteger(number) || number < 1 || number > maxNumber,
    ) ||
    new Set(numbers).size !== expectedCount ||
    !luckyColors.includes(metadata.giftLuckyColor) ||
    !luckyDays.includes(metadata.giftLuckyDay)
  ) {
    return null;
  }

  return {
    gameName: isSevenPick ? "7 Pick" : "6 Pick",
    numbers,
    luckyColor: metadata.giftLuckyColor,
    luckyDay: metadata.giftLuckyDay,
  };
}

async function requireManualGiftDeliveryReview(stripe, sessionId, metadata, reason) {
  try {
    await stripe.checkout.sessions.update(sessionId, {
      metadata: {
        ...metadata,
        giftDeliveryStatus: "review_required",
      },
    });
  } catch (error) {
    console.error("Failed to mark gift delivery for manual review:", error);
  }

  return { ok: false, reviewRequired: true, reason };
}

export async function deliverGiftEmailForSession(stripe, sessionId) {
  // Claim the lock before reading or changing delivery state.
  const lockResult = await claimGiftDeliveryLock(sessionId);

  if (!lockResult.ok) {
    try {
      const session = await stripe.checkout.sessions.retrieve(sessionId);
      if (session.metadata?.giftDeliveredAt) {
        return {
          ok: true,
          alreadyDelivered: true,
          delivered: true,
          metadata: session.metadata,
        };
      }
    } catch (error) {
      console.error("Failed to check delivery status:", error);
    }

    return {
      ok: false,
      reason: "Gift delivery is being processed by another request",
      concurrent: true,
    };
  }

  const ownershipToken = lockResult.token;

  try {
    const resendApiKey = process.env.RESEND_API_KEY;
    const fromEmail = process.env.GIFT_FROM_EMAIL;

    if (!resendApiKey || !fromEmail) {
      return {
        ok: false,
        reason:
          "Gift email is ready, but email delivery needs RESEND_API_KEY and GIFT_FROM_EMAIL.",
      };
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId);
    const validation = validateGiftSession(session);

    if (!validation.ok) {
      return validation;
    }

    if (validation.alreadyDelivered) {
      return {
        ok: true,
        alreadyDelivered: true,
        delivered: true,
        metadata: validation.metadata,
      };
    }

    const metadata = validation.metadata;

    // A sent marker without giftDeliveredAt is inconsistent. Fail closed rather
    // than risking a duplicate email.
    if (
      metadata.giftDeliveryStatus === "sent" ||
      metadata.giftDeliveryStatus === "review_required"
    ) {
      return requireManualGiftDeliveryReview(
        stripe,
        sessionId,
        metadata,
        "This gift has an unresolved delivery state. Please reconcile it before retrying.",
      );
    }

    let reveal;
    let deliveryMetadata = metadata;

    if (metadata.giftDeliveryStatus === "pending") {
      const pendingAt = Date.parse(metadata.giftDeliveryPendingAt || "");
      const pendingAge = Date.now() - pendingAt;

      // Resend retains email idempotency keys for 24 hours. Stop with a safety
      // margin instead of retrying with a key that may have expired.
      if (
        !Number.isFinite(pendingAt) ||
        pendingAge < 0 ||
        pendingAge >= RESEND_SAFE_RETRY_WINDOW_MS
      ) {
        return requireManualGiftDeliveryReview(
          stripe,
          sessionId,
          metadata,
          "A previous email attempt is outside the safe idempotency retry window. Check Resend before retrying to avoid a duplicate email.",
        );
      }

      reveal = getStoredPendingGiftReveal(metadata);
      if (!reveal) {
        return requireManualGiftDeliveryReview(
          stripe,
          sessionId,
          metadata,
          "The saved gift reveal for a pending email attempt is incomplete. Check Resend before retrying.",
        );
      }
    } else {
      reveal = createGiftReveal(metadata);
      deliveryMetadata = {
        ...metadata,
        giftDeliveryStatus: "pending",
        giftDeliveryPendingAt: new Date(Date.now()).toISOString(),
        giftNumbers: reveal.numbers.join(","),
        giftLuckyColor: reveal.luckyColor,
        giftLuckyDay: reveal.luckyDay,
      };

      // Persist the exact email payload before sending. Retries reuse this reveal
      // and the same Resend idempotency key, including after ambiguous failures.
      await stripe.checkout.sessions.update(sessionId, {
        metadata: deliveryMetadata,
      });
    }

    const emailResult = await sendGiftEmail({
      metadata: deliveryMetadata,
      resendApiKey,
      fromEmail,
      reveal,
      sessionId,
    });

    if (!emailResult.ok) {
      // Leave the attempt pending. Resend did not confirm success, and a retry
      // must reuse the saved payload and idempotency key.
      console.error("Gift email was not accepted by Resend:", emailResult.details);
      return {
        ok: false,
        reason: "Payment succeeded, but the gift email is still pending and can be retried safely.",
        retryable: true,
      };
    }

    // The email request was accepted. Only now mark it as sent in Stripe.
    // If this update fails, the pending record is retained; a retry reuses the
    // same payload/key so Resend can return the original result without resending.
    const latestSession = await stripe.checkout.sessions.retrieve(sessionId);
    await stripe.checkout.sessions.update(sessionId, {
      metadata: {
        ...deliveryMetadata,
        ...(latestSession.metadata || {}),
        giftDeliveryStatus: "sent",
        giftDeliveryPendingAt: null,
        giftDeliveredAt: new Date(Date.now()).toISOString(),
        giftNumbers: reveal.numbers.join(","),
        giftLuckyColor: reveal.luckyColor,
        giftLuckyDay: reveal.luckyDay,
      },
    });

    return { ok: true, delivered: true, reveal };
  } catch (error) {
    console.error("Unexpected error during gift email delivery:", error);
    return {
      ok: false,
      reason:
        "Gift delivery could not be confirmed. The saved pending attempt can be retried safely while its idempotency key is valid.",
      retryable: true,
    };
  } finally {
    await releaseGiftDeliveryLock(sessionId, ownershipToken);
  }
}
