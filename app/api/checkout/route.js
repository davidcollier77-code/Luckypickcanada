import Stripe from 'stripe';

export const runtime = 'nodejs';

export async function POST(request) {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  const priceId = process.env.STRIPE_PRICE_ID;

  if (!secretKey || !priceId) {
    return Response.json(
      { error: 'Stripe is not configured. Set STRIPE_SECRET_KEY and STRIPE_PRICE_ID.' },
      { status: 500 },
    );
  }

  try {
    const stripe = new Stripe(secretKey);
    const origin = new URL(request.url).origin;

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${origin}/?payment=success`,
      cancel_url: `${origin}/?payment=cancelled`,
    });

    if (!session.url) {
      return Response.json({ error: 'Stripe did not return a checkout URL.' }, { status: 502 });
    }

    return Response.redirect(session.url, 303);
  } catch (error) {
    console.error('Stripe checkout failed', error);
    return Response.json({ error: 'Unable to start checkout.' }, { status: 500 });
  }
}
