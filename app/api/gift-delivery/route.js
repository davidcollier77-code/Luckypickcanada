import Stripe from 'stripe';
import { deliverGiftEmailForSession } from '../../gift-email';

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

async function findCheckoutSession(stripe, paymentId) {
  if (!paymentId) {
    return null;
  }

  if (paymentId.startsWith('cs_')) {
    return stripe.checkout.sessions.retrieve(paymentId);
  }

  if (!paymentId.startsWith('pi_')) {
    return null;
  }

  const sessions = await stripe.checkout.sessions.list({
    payment_intent: paymentId,
    limit: 1,
  });

  return sessions.data[0] || null;
}

export async function GET(request) {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  const paymentId = new URL(request.url).searchParams.get('session_id') || new URL(request.url).searchParams.get('payment_id');

  if (!secretKey || !paymentId) {
    return redirectHome(request, { giftError: 'Unable to verify the gift payment.' });
  }

  const stripe = new Stripe(secretKey);

  try {
    const session = await findCheckoutSession(stripe, paymentId);

    if (!session) {
      return redirectHome(request, { giftError: 'Unable to find the paid gift checkout session.' });
    }

    const result = await deliverGiftEmailForSession(stripe, session.id);

    if (result.ok) {
      return redirectHome(request, { giftSent: '1' });
    }

    return redirectHome(request, { giftError: result.reason || 'Unable to send this lucky pick gift right now.' });
  } catch (error) {
    console.error('Gift delivery failed', error);
    return redirectHome(request, { giftError: 'Unable to send this lucky pick gift right now.' });
  }
}
