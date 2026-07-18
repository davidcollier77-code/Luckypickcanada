import Stripe from 'stripe';
import { deliverGiftEmailForSession } from '../../../lib/gift-email.js';

export const runtime = 'nodejs';

function redirectHome(request, params) {
  const url = new URL('/', request.url);

  Object.entries(params).forEach(([key, value]) => {
    if (value) {
      url.searchParams.set(key, value);
    }
  });

  return Response.redirect(url, 303);
}

export async function GET(request) {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  const sessionId = new URL(request.url).searchParams.get('session_id');

  if (!secretKey || !sessionId) {
    return redirectHome(request, { giftError: 'Unable to verify the gift payment.' });
  }

  const stripe = new Stripe(secretKey);

  try {
    const result = await deliverGiftEmailForSession(stripe, sessionId);

    if (result.ok) {
      return redirectHome(request, { giftSent: '1' });
    }

    return redirectHome(request, { giftError: result.reason || 'Unable to send this lucky pick gift right now.' });
  } catch (error) {
    console.error('Gift delivery failed', error);
    return redirectHome(request, { giftError: 'Unable to send this lucky pick gift right now.' });
  }
}
