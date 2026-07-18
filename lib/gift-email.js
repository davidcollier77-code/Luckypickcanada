const luckyColors = ['Aurora Green', 'Star Gold', 'Midnight Blue', 'Lucky Red', 'Moonlight Silver', 'Northern Purple', 'Sky Blue'];
const luckyDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

function generateNumbers(count, max) {
  const numbers = Array.from({ length: max }, (_, index) => index + 1);

  for (let index = numbers.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [numbers[index], numbers[swapIndex]] = [numbers[swapIndex], numbers[index]];
  }

  return numbers.slice(0, count).sort((a, b) => a - b);
}

function pickOne(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function escapeHtml(value) {
  return String(value || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function buildGiftEmail({ metadata, gameName, numbers, luckyColor, luckyDay }) {
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

function validateGiftSession(session) {
  const metadata = session.metadata || {};

  if (session.payment_status !== 'paid' || metadata.checkoutType !== 'gift_package' || session.amount_total !== 499 || session.currency !== 'cad') {
    return { ok: false, reason: 'Only a paid $4.99 gift package can send a gift email.' };
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
  const isSevenPick = metadata.luckyPickGame === '7';
  const gameName = isSevenPick ? '7 Pick' : '6 Pick';
  const numbers = generateNumbers(isSevenPick ? 7 : 6, isSevenPick ? 50 : 49);
  const luckyColor = pickOne(luckyColors);
  const luckyDay = pickOne(luckyDays);

  // Claim delivery by writing giftDeliveredAt BEFORE sending the email. Two
  // delivery paths (the success-redirect GET and the checkout.session.completed
  // webhook) fire within seconds of each other for the same session, so writing
  // the marker only after the (multi-second) Resend call left a wide window in
  // which both callers passed the `!giftDeliveredAt` check and each sent the
  // recipient a duplicate email. Claiming first closes that window.
  await stripe.checkout.sessions.update(sessionId, {
    metadata: {
      ...metadata,
      giftDeliveredAt: new Date().toISOString(),
      giftNumbers: numbers.join(','),
      giftLuckyColor: luckyColor,
      giftLuckyDay: luckyDay,
    },
  });

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
      html: buildGiftEmail({ metadata, gameName, numbers, luckyColor, luckyDay }),
    }),
  });

  if (!response.ok) {
    const details = await response.text();
    console.error('Gift email failed', details);

    // Release the claim so the delivery can be retried on a later invocation.
    // Stripe deletes metadata keys when they are set to an empty string.
    try {
      await stripe.checkout.sessions.update(sessionId, {
        metadata: {
          ...metadata,
          giftDeliveredAt: '',
          giftNumbers: '',
          giftLuckyColor: '',
          giftLuckyDay: '',
        },
      });
    } catch (releaseError) {
      console.error('Failed to release gift delivery claim', releaseError);
    }

    return { ok: false, reason: 'Payment succeeded, but the gift email could not be sent right now.' };
  }

  return { ok: true, delivered: true };
}
