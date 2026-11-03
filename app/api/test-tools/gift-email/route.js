import { createGiftReveal, sendGiftEmail } from '../../../gift-email';
import {
  isValidEmailAddress,
  sanitizePlainText,
  sanitizeSingleLine,
} from '../../../form-security';
import { checkApiRateLimit, getClientIp } from '../../../spam-protection';
import { isGiftEmailTestEnabled } from '../../../test-tools/gift-email/giftEmailTestConfig';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const RATE_LIMIT_LIMIT = 5;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;

function noStoreJson(payload, status = 200) {
  return Response.json(payload, {
    status,
    headers: { 'Cache-Control': 'no-store' },
  });
}

/**
 * Collects every host representation the request exposes. Behind a proxy or a
 * local `next start`, the handler's URL can resolve to an internal address while
 * the browser still uses the public host, so both the headers and the URL are
 * checked rather than trusting one of them.
 */
function getRequestHosts(request) {
  const hosts = new Set();
  const addHost = (value) => {
    String(value || '')
      .split(',')
      .forEach((part) => {
        const host = part.trim().toLowerCase();
        if (host) {
          hosts.add(host);
        }
      });
  };

  addHost(request.headers.get('host'));
  addHost(request.headers.get('x-forwarded-host'));

  try {
    addHost(new URL(request.url).host);
  } catch {
    // A malformed internal URL leaves only the header hosts, which is enough.
  }

  return hosts;
}

/**
 * Rejects cross-site browser requests. The tool takes no secret, so this is the
 * boundary that keeps another site from driving a visitor's browser to send
 * test emails. Non-browser requests carry no Origin header and are limited by
 * the per-IP rate limit instead.
 */
function isCrossSiteRequest(request) {
  const origin = request.headers.get('origin');

  if (!origin) {
    return false;
  }

  try {
    return !getRequestHosts(request).has(new URL(origin).host.toLowerCase());
  } catch {
    return true;
  }
}

/**
 * Sends one real Gift Edition email for a test reveal. This bypasses the Stripe
 * payment requirement only: the reveal and the email are the same generator and
 * Resend request the paid gift flow uses.
 */
export async function POST(request) {
  if (!isGiftEmailTestEnabled()) {
    return noStoreJson({ error: 'The gift email test tool is turned off.' }, 404);
  }

  if (isCrossSiteRequest(request)) {
    return noStoreJson({ error: 'This request was not made from this site.' }, 403);
  }

  const ip = getClientIp(request);
  const rateLimit = await checkApiRateLimit(
    ip,
    'gift_email_test',
    RATE_LIMIT_LIMIT,
    RATE_LIMIT_WINDOW_MS,
  );

  if (!rateLimit.ok) {
    return noStoreJson(
      { error: 'Too many test gift emails from this address. Please try again later.' },
      429,
    );
  }

  const resendApiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.GIFT_FROM_EMAIL;

  if (!resendApiKey || !fromEmail) {
    return noStoreJson(
      {
        error:
          'Gift email is not configured on the server. RESEND_API_KEY and GIFT_FROM_EMAIL are required.',
      },
      503,
    );
  }

  const body = await request.json().catch(() => null);

  if (!body || typeof body !== 'object') {
    return noStoreJson({ error: 'Send the gift details as JSON.' }, 400);
  }

  const recipientEmail = sanitizeSingleLine(body.recipientEmail, 120).toLowerCase();
  const recipientName = sanitizeSingleLine(body.recipientName, 80) || 'Friend';
  const senderName = sanitizeSingleLine(body.senderName, 80) || 'Lucky Pick Canada';
  const giftMessage =
    sanitizePlainText(body.giftMessage, 500) || 'This is a test Lucky Pick Canada gift email.';
  const luckyPickGame = body.luckyPickGame === '7' ? '7' : '6';

  if (!isValidEmailAddress(recipientEmail)) {
    return noStoreJson({ error: 'Enter a valid recipient email address.' }, 400);
  }

  const metadata = {
    checkoutType: 'gift_package',
    luckyPickGame,
    recipientName,
    recipientEmail,
    senderName,
    giftMessage,
  };

  const reveal = createGiftReveal(metadata);
  const emailResult = await sendGiftEmail({
    metadata,
    resendApiKey,
    fromEmail,
    reveal,
  });

  if (!emailResult.ok) {
    console.error('Gift test email was not accepted by Resend:', emailResult.details);

    return noStoreJson(
      {
        error:
          'Resend did not accept the test gift email. Check the server logs and the Resend configuration.',
      },
      502,
    );
  }

  return noStoreJson({
    ok: true,
    deliveryStatus: 'sent',
    recipientEmail,
    reveal: {
      gameName: reveal.gameName,
      numbers: reveal.numbers,
      luckyColor: reveal.luckyColor,
      luckyDay: reveal.luckyDay,
    },
  });
}
