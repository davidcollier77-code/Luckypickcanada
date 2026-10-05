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

function createSeededRandom(seedSource) {
  let seed = 2166136261;

  for (let index = 0; index < seedSource.length; index += 1) {
    seed ^= seedSource.charCodeAt(index);
    seed = Math.imul(seed, 16777619);
  }

  return () => {
    seed += 0x6D2B79F5;
    let value = seed;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function generateDeterministicNumbers(count, max, random) {
  const numbers = Array.from({ length: max }, (_, index) => index + 1);

  for (let index = numbers.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [numbers[index], numbers[swapIndex]] = [numbers[swapIndex], numbers[index]];
  }

  return numbers.slice(0, count).sort((a, b) => a - b);
}

function pickOneWithRandom(items, random) {
  return items[Math.floor(random() * items.length)];
}

function escapeHtml(value) {
  return String(value || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export function createGiftReveal(metadata, seedSource = '') {
  const isSevenPick = metadata.luckyPickGame === '7';
  const count = isSevenPick ? 7 : 6;
  const max = isSevenPick ? 50 : 49;

  if (seedSource) {
    const random = createSeededRandom(seedSource);

    return {
      gameName: isSevenPick ? '7 Pick' : '6 Pick',
      numbers: generateDeterministicNumbers(count, max, random),
      luckyColor: pickOneWithRandom(luckyColors, random),
      luckyDay: pickOneWithRandom(luckyDays, random),
    };
  }

  return {
    gameName: isSevenPick ? '7 Pick' : '6 Pick',
    numbers: generateNumbers(count, max),
    luckyColor: pickOne(luckyColors),
    luckyDay: pickOne(luckyDays),
  };
}

function readStoredGiftReveal(metadata) {
  const numbers = String(metadata.giftNumbers || '')
    .split(',')
    .map((value) => Number(value.trim()))
    .filter((number) => Number.isFinite(number));

  const isSevenPick = metadata.luckyPickGame === '7';
  const expectedCount = isSevenPick ? 7 : 6;
  const max = isSevenPick ? 50 : 49;

  if (
    !metadata.giftLuckyColor ||
    !metadata.giftLuckyDay ||
    numbers.length !== expectedCount ||
    numbers.some((number) => !Number.isInteger(number) || number < 1 || number > max) ||
    new Set(numbers).size !== numbers.length
  ) {
    return null;
  }

  return {
    gameName: isSevenPick ? '7 Pick' : '6 Pick',
    numbers: numbers.sort((a, b) => a - b),
    luckyColor: metadata.giftLuckyColor,
    luckyDay: metadata.giftLuckyDay,
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

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function sendGiftEmail({ metadata, resendApiKey, fromEmail, reveal = createGiftReveal(metadata), sessionId }) {
  const requestBody = {
    from: fromEmail,
    to: metadata.recipientEmail,
    subject: `${metadata.senderName || 'Someone'} sent you a Lucky Pick Canada gift`,
    html: buildGiftEmail({ metadata, ...reveal }),
  };

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
        ...(sessionId ? { 'Idempotency-Key': `gift-package/${sessionId}` } : {}),
      },
      body: JSON.stringify(requestBody),
    });

    if (response.ok) {
      return { ok: true, details: await response.text(), reveal };
    }

    if (response.status === 409 && attempt < 2) {
      await sleep(250 * (attempt + 1));
      continue;
    }

    return { ok: false, details: await response.text(), reveal };
  }

  return { ok: false, details: 'Unable to complete idempotent gift delivery.', reveal };
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

/**
 * Validates a paid gift session and sends its reveal email.
 * Delivery is made idempotent with a stable Resend idempotency key derived from
 * the Stripe Checkout Session ID, so concurrent webhook/fallback requests cannot
 * send duplicate emails. The reveal is deterministic until it is stored in Stripe
 * metadata, which keeps concurrent requests on the same payload.
 *
 * @param {import('stripe').default} stripe - Stripe client for retrieving and updating checkout sessions.
 * @param {string} sessionId - Checkout session ID to validate and deliver.
 * @returns {Promise<object>} Delivery status with a reveal, existing delivery metadata,
 * or a failure reason. Sessions with a delivery marker return alreadyDelivered without resending.
 * @throws {Error} Propagates Stripe errors.
 */
export async function deliverGiftEmailForSession(stripe, sessionId) {
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
    return { ok: true, alreadyDelivered: true, delivered: true, metadata: validation.metadata };
  }

  const metadata = validation.metadata;
  const reveal = readStoredGiftReveal(metadata) || createGiftReveal(metadata, sessionId);

  const emailResult = await sendGiftEmail({
    metadata,
    resendApiKey,
    fromEmail,
    reveal,
    sessionId,
  });

  if (!emailResult.ok) {
    console.error('Gift email failed', emailResult.details);
    return { ok: false, reason: 'Payment succeeded, but the gift email could not be sent right now.' };
  }

  try {
    await stripe.checkout.sessions.update(sessionId, {
      metadata: {
        ...metadata,
        giftDeliveredAt: new Date().toISOString(),
        giftNumbers: reveal.numbers.join(','),
        giftLuckyColor: reveal.luckyColor,
        giftLuckyDay: reveal.luckyDay,
      },
    });
  } catch (error) {
    // Resend idempotency prevents a retry from sending the gift a second time.
    // Leave the result successful so Stripe/webhook retry can reconcile metadata.
    console.error('Gift delivery metadata update failed', error);
  }

  return { ok: true, delivered: true, reveal };
}
