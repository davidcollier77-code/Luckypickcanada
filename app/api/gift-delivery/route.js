import Stripe from 'stripe';

export const runtime = 'nodejs';

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

function redirectHome(request, params) {
  const url = new URL('/', request.url);

  Object.entries(params).forEach(([key, value]) => {
    if (value) {
      url.searchParams.set(key, value);
    }
  });

  return Response.redirect(url, 303);
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

export async function GET(request) {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  const resendApiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.GIFT_FROM_EMAIL;
  const sessionId = new URL(request.url).searchParams.get('session_id');

  if (!secretKey || !sessionId) {
    return redirectHome(request, { giftError: 'Unable to verify the gift payment.' });
  }

  if (!resendApiKey || !fromEmail) {
    return redirectHome(request, { giftError: 'Gift email is ready, but email delivery needs RESEND_API_KEY and GIFT_FROM_EMAIL.' });
  }

  const stripe = new Stripe(secretKey);

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    const metadata = session.metadata || {};

    if (session.payment_status !== 'paid' || metadata.checkoutType !== 'gift_package' || session.amount_total !== 499 || session.currency !== 'cad') {
      return redirectHome(request, { giftError: 'Only a paid $4.99 gift package can send a gift email.' });
    }

    if (metadata.giftDeliveredAt) {
      return redirectHome(request, { giftSent: '1' });
    }

    if (!metadata.recipientEmail || !metadata.recipientName) {
      return redirectHome(request, { giftError: 'The gift recipient details were missing.' });
    }

    const isSevenPick = metadata.luckyPickGame === '7';
    const gameName = isSevenPick ? '7 Pick' : '6 Pick';
    const numbers = generateNumbers(isSevenPick ? 7 : 6, isSevenPick ? 50 : 49);
    const luckyColor = pickOne(luckyColors);
    const luckyDay = pickOne(luckyDays);

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
      return redirectHome(request, { giftError: 'Payment succeeded, but the gift email could not be sent right now.' });
    }

    await stripe.checkout.sessions.update(sessionId, {
      metadata: {
        ...metadata,
        giftDeliveredAt: new Date().toISOString(),
        giftNumbers: numbers.join(','),
        giftLuckyColor: luckyColor,
        giftLuckyDay: luckyDay,
      },
    });

    return redirectHome(request, { giftSent: '1' });
  } catch (error) {
    console.error('Gift delivery failed', error);
    return redirectHome(request, { giftError: 'Unable to send this lucky pick gift right now.' });
  }
}
