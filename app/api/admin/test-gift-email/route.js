import crypto from 'crypto';
import { createGiftReveal, sendGiftEmail } from '../../../gift-email';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function cleanText(value, maxLength) {
  return String(value || '').replace(/\s+/g, ' ').trim().slice(0, maxLength);
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function isAuthorized(request) {
  const configuredSecret = process.env.GIFT_TEST_SECRET;
  const providedSecret = request.headers.get('x-gift-test-secret');

  if (!configuredSecret || !providedSecret) {
    return false;
  }

  const configured = Buffer.from(configuredSecret);
  const provided = Buffer.from(providedSecret);

  return configured.length === provided.length && crypto.timingSafeEqual(configured, provided);
}

export async function POST(request) {
  if (!isAuthorized(request)) {
    return Response.json({ error: 'Not found' }, { status: 404 });
  }

  const resendApiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.GIFT_FROM_EMAIL;

  if (!resendApiKey || !fromEmail) {
    return Response.json({ error: 'Gift email delivery needs RESEND_API_KEY and GIFT_FROM_EMAIL.' }, { status: 500 });
  }

  const body = await request.json().catch(() => ({}));
  const recipientEmail = cleanText(body.recipientEmail, 120).toLowerCase();
  const recipientName = cleanText(body.recipientName || 'Friend', 80);
  const senderName = cleanText(body.senderName || 'Lucky Pick Canada', 80);
  const giftMessage = cleanText(body.giftMessage || 'This is a test Lucky Pick Canada gift email.', 500);
  const metadata = {
    checkoutType: 'gift_package',
    luckyPickGame: body.luckyPickGame === '7' ? '7' : '6',
    recipientName,
    recipientEmail,
    senderName,
    giftMessage,
  };

  if (!isValidEmail(recipientEmail)) {
    return Response.json({ error: 'Enter a valid recipientEmail.' }, { status: 400 });
  }

  const reveal = createGiftReveal(metadata);
  const emailResult = await sendGiftEmail({ metadata, resendApiKey, fromEmail, reveal });

  if (!emailResult.ok) {
    console.error('Gift test email failed', emailResult.details);
    return Response.json({ error: 'Gift test email could not be sent right now.' }, { status: 502 });
  }

  return Response.json({
    ok: true,
    recipientEmail,
    gameName: reveal.gameName,
    numbers: reveal.numbers,
    luckyColor: reveal.luckyColor,
    luckyDay: reveal.luckyDay,
  });
}
