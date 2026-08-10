import { sendGiftEmail, createGiftReveal } from '../../gift-email';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function cleanText(value, maxLength) {
  return String(value || '').replace(/\s+/g, ' ').trim().slice(0, maxLength);
}

function isValidEmail(value) {
  return /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/.test(value);
}

// Simple in-memory rate limiter
const rateLimitStore = new Map();
const RATE_LIMIT_WINDOW_MS = 60000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 5; // Max 5 requests per minute per IP

function getRateLimitKey(request) {
  // Try to get IP from various headers (for proxies/load balancers)
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  const cfConnectingIP = request.headers.get('cf-connecting-ip');
  
  return forwarded?.split(',')[0].trim() || realIP || cfConnectingIP || 'unknown';
}

function checkRateLimit(request) {
  const key = getRateLimitKey(request);
  const now = Date.now();
  
  // Clean up old entries
  for (const [k, v] of rateLimitStore.entries()) {
    if (now - v.windowStart > RATE_LIMIT_WINDOW_MS) {
      rateLimitStore.delete(k);
    }
  }
  
  const record = rateLimitStore.get(key);
  
  if (!record) {
    rateLimitStore.set(key, { count: 1, windowStart: now });
    return true;
  }
  
  if (now - record.windowStart > RATE_LIMIT_WINDOW_MS) {
    rateLimitStore.set(key, { count: 1, windowStart: now });
    return true;
  }
  
  if (record.count >= MAX_REQUESTS_PER_WINDOW) {
    return false;
  }
  
  record.count++;
  return true;
}

export async function POST(request) {
  // Check rate limit
  if (!checkRateLimit(request)) {
    console.error('[send-gift] Rate limit exceeded');
    return Response.json({ error: 'Too many requests. Please try again later.' }, { status: 429 });
  }

  // Backend logging added for email provider API key validation
  const resendApiKey = process.env.RESEND_API_KEY;

  const fromEmail = process.env.GIFT_FROM_EMAIL || 'noreply@luckypickcanada.ca';

  try {
    const body = await request.json().catch(() => ({}));
    console.log('[send-gift] Processing gift email request');

    const recipientName = cleanText(body.recipientName, 80);
    const recipientEmail = cleanText(body.recipientEmail, 120).toLowerCase();
    const senderName = cleanText(body.senderName, 80);
    const personalMessage = cleanText(body.personalMessage || body.giftMessage, 500);
    const pickType = body.pickType || body.luckyPickGame || '6';

    if (!recipientName || !isValidEmail(recipientEmail)) {
      console.error('[send-gift] Validation failed: missing recipientName or invalid recipientEmail');
      return Response.json({ error: 'Validation failed: recipient name and a valid email are required.' }, { status: 400 });
    }

    if (!resendApiKey) {
      console.error('[send-gift] Error: RESEND_API_KEY is not defined in process.env.');
      return Response.json({ error: 'RESEND_API_KEY is not configured on the server.' }, { status: 500 });
    }

    const metadata = {
      checkoutType: 'gift_package',
      luckyPickGame: pickType === '7' ? '7' : '6',
      recipientName,
      recipientEmail,
      senderName,
      giftMessage: personalMessage,
    };

    const reveal = createGiftReveal(metadata);
    const emailResult = await sendGiftEmail({ metadata, resendApiKey, fromEmail, reveal });

    if (!emailResult.ok) {
      console.error('[send-gift] Email sending failed:', emailResult.details);
      return Response.json({ error: `Email sending failed: ${emailResult.details}` }, { status: 502 });
    }

    console.log('[send-gift] Gift email successfully sent');
    return Response.json({
      ok: true,
      recipientEmail,
      reveal,
    });
  } catch (error) {
    console.error('[send-gift] Unexpected error occurred during send-gift execution:', error);
    return Response.json({ error: error instanceof Error ? error.message : 'An unexpected error occurred.' }, { status: 500 });
  }
}
