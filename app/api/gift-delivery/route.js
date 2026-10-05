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

    const metadata = session.metadata || {};

    // If it's not a gift package, or not paid, redirect to home
    if (session.payment_status !== 'paid' || metadata.checkoutType !== 'gift_package') {
      return redirectHome(request, { giftError: 'Unable to verify the gift payment.' });
    }

    // Only redirect to reveal if delivery was completed by webhook
    if (metadata.giftDeliveredAt) {
      const recipientEmail = metadata.recipientEmail || '';
      const url = new URL(`/reveal/${session.id}`, request.url);
      if (recipientEmail) {
        url.searchParams.set('recipientEmail', recipientEmail);
      }
      return Response.redirect(url, 303);
    }

    // If webhook hasn't processed it yet, attempt delivery here as fallback,
    // but this is mostly handled by webhook now. Let's just do it securely.
    const result = await deliverGiftEmailForSession(stripe, session.id);

    // The webhook may already hold the lock, in which case delivery is about to
    // succeed, so the user still reaches the reveal page.
    if (result.ok || result.alreadyDelivered || result.inProgress) {
      const recipientEmail = session.metadata?.recipientEmail || '';
      const url = new URL(`/reveal/${session.id}`, request.url);
      if (recipientEmail) {
        url.searchParams.set('recipientEmail', recipientEmail);
      }
      return Response.redirect(url, 303);
    }

    return redirectHome(request, { giftError: result.reason || 'Unable to send this lucky pick gift right now.' });
  } catch (error) {
    console.error('Gift delivery failed', error);
    return redirectHome(request, { giftError: 'Unable to send this lucky pick gift right now.' });
  }
}
