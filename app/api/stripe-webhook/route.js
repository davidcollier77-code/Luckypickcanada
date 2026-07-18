import Stripe from 'stripe';
import { deliverGiftEmailForSession } from '../../gift-email';

export const runtime = 'nodejs';

export async function POST(request) {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const signature = request.headers.get('stripe-signature');

  if (!secretKey || !webhookSecret || !signature) {
    return Response.json({ error: 'Stripe webhook is not configured.' }, { status: 500 });
  }

  const stripe = new Stripe(secretKey);
  const payload = await request.text();
  let event;

  try {
    event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  } catch (error) {
    console.error('Stripe webhook signature verification failed', error);
    return Response.json({ error: 'Invalid Stripe webhook signature.' }, { status: 400 });
  }

  if (event.type !== 'checkout.session.completed') {
    return Response.json({ received: true });
  }

  const session = event.data.object;

  if (!session?.id) {
    return Response.json({ error: 'Stripe webhook session was missing.' }, { status: 400 });
  }

  if (session.metadata?.checkoutType !== 'gift_package') {
    return Response.json({ received: true });
  }

  try {
    const result = await deliverGiftEmailForSession(stripe, session.id);

    if (!result.ok) {
      console.error('Gift webhook delivery failed', result.reason);
      return Response.json({ error: result.reason || 'Gift email delivery failed.' }, { status: 500 });
    }

    return Response.json({ received: true, giftDelivered: Boolean(result.delivered), alreadyDelivered: Boolean(result.alreadyDelivered) });
  } catch (error) {
    console.error('Gift webhook delivery failed', error);
    return Response.json({ error: 'Gift email delivery failed.' }, { status: 500 });
  }
}
