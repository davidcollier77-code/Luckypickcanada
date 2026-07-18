import Stripe from 'stripe';
import { createGiftReveal, sendGiftEmail } from '../../gift-email';

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
  const resendApiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.GIFT_FROM_EMAIL;
  const paymentId = new URL(request.url).searchParams.get('session_id') || new URL(request.url).searchParams.get('payment_id');

  if (!secretKey || !paymentId) {
    return redirectHome(request, { giftError: 'Unable to verify the gift payment.' });
  }

  if (!resendApiKey || !fromEmail) {
    return redirectHome(request, { giftError: 'Gift email is ready, but email delivery needs RESEND_API_KEY and GIFT_FROM_EMAIL.' });
  }

  const stripe = new Stripe(secretKey);

  try {
    const session = await findCheckoutSession(stripe, paymentId);

    if (!session) {
      return redirectHome(request, { giftError: 'Unable to find the paid gift checkout session.' });
    }

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

    const reveal = createGiftReveal(metadata);
    const emailResult = await sendGiftEmail({ metadata, resendApiKey, fromEmail, reveal });

    if (!emailResult.ok) {
      console.error('Gift email failed', emailResult.details);
      return redirectHome(request, { giftError: 'Payment succeeded, but the gift email could not be sent right now.' });
    }

    await stripe.checkout.sessions.update(session.id, {
      metadata: {
        ...metadata,
        giftDeliveredAt: new Date().toISOString(),
        giftNumbers: reveal.numbers.join(','),
        giftLuckyColor: reveal.luckyColor,
        giftLuckyDay: reveal.luckyDay,
      },
    });

    return redirectHome(request, { giftSent: '1' });
  } catch (error) {
    console.error('Gift delivery failed', error);
    return redirectHome(request, { giftError: 'Unable to send this lucky pick gift right now.' });
  }
}
