import { NextResponse } from 'next/server';
import Stripe from 'stripe';

export const runtime = 'nodejs';

const checkoutOptions = {
  lucky_pick: {
    name: 'Lucky Pick Canada',
    description: 'A 6 Pick or 7 Pick result with no duplicate numbers, slow reveal with stars and Aurora, lucky color, and lucky day of the week.',
    unitAmount: 100,
  },
  gift_package: {
    name: 'Lucky Pick Canada gift package',
    description: 'Send a Lucky Pick reveal by email with a personal greeting.',
    unitAmount: 499,
  },
};

function cleanText(value, maxLength) {
  return String(value || '').replace(/\s+/g, ' ').trim().slice(0, maxLength);
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function dollarsToCents(amount) {
  const normalizedAmount = String(amount || '').trim();

  if (!/^\d+(\.\d{1,2})?$/.test(normalizedAmount)) {
    return null;
  }

  const [dollars, cents = ''] = normalizedAmount.split('.');
  return Number(dollars) * 100 + Number(cents.padEnd(2, '0'));
}

export async function POST(request) {
  let origin;
  try {
    origin = new URL(request.url).origin;
  } catch (urlError) {
    console.error('Failed to parse origin from request url', urlError);
    origin = 'https://luckypickcanada.ca';
  }

  try {
    const secretKey = process.env.STRIPE_SECRET_KEY;

    if (!secretKey) {
      const errorMsg = 'Stripe is not configured. Set STRIPE_SECRET_KEY.';
      return NextResponse.redirect(new URL(`/?payment=error&message=${encodeURIComponent(errorMsg)}`, origin).toString(), 303);
    }

    const formData = await request.formData();
    const checkoutType = formData.get('checkoutType');
    const luckyPickGame = formData.get('luckyPickGame') === '7' ? '7' : '6';
    const giftDetails = {
      recipientName: cleanText(formData.get('recipientName'), 80),
      recipientEmail: cleanText(formData.get('recipientEmail'), 120).toLowerCase(),
      senderName: cleanText(formData.get('senderName'), 80),
      giftMessage: cleanText(formData.get('giftMessage'), 500),
    };
    const stripe = new Stripe(secretKey, {
      httpClient: Stripe.createFetchHttpClient(),
    });

    let checkoutOption = checkoutOptions[checkoutType];

    if (checkoutType === 'gift_package') {
      if (!giftDetails.recipientName || !isValidEmail(giftDetails.recipientEmail)) {
        const errorMsg = 'Enter the recipient name and a valid recipient email.';
        return NextResponse.redirect(new URL(`/?payment=error&message=${encodeURIComponent(errorMsg)}`, origin).toString(), 303);
      }
    }

    if (checkoutType === 'tip') {
      const tipAmount = dollarsToCents(formData.get('tipAmount'));

      if (!tipAmount || tipAmount < 50) {
        const errorMsg = 'Enter a tip amount of at least $0.50.';
        return NextResponse.redirect(new URL(`/?payment=error&message=${encodeURIComponent(errorMsg)}`, origin).toString(), 303);
      }

      checkoutOption = {
        name: 'Lucky Pick Canada tip jar',
        description: 'Thanks for supporting Lucky Pick Canada.',
        unitAmount: tipAmount,
      };
    }

    if (!checkoutOption) {
      const errorMsg = 'Choose a valid checkout option.';
      return NextResponse.redirect(new URL(`/?payment=error&message=${encodeURIComponent(errorMsg)}`, origin).toString(), 303);
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'cad',
            product_data: {
              name: checkoutOption.name,
              description: checkoutOption.description,
            },
            unit_amount: checkoutOption.unitAmount,
          },
          quantity: 1,
        },
      ],
      metadata: {
        checkoutType,
        luckyPickGame: ['lucky_pick', 'gift_package'].includes(checkoutType) ? luckyPickGame : '',
        recipientName: checkoutType === 'gift_package' ? giftDetails.recipientName : '',
        recipientEmail: checkoutType === 'gift_package' ? giftDetails.recipientEmail : '',
        senderName: checkoutType === 'gift_package' ? giftDetails.senderName : '',
        giftMessage: checkoutType === 'gift_package' ? giftDetails.giftMessage : '',
      },
      success_url: checkoutType === 'lucky_pick'
        ? `${origin}/?payment=success&pick=${luckyPickGame}&session_id={CHECKOUT_SESSION_ID}`
        : checkoutType === 'gift_package'
          ? `${origin}/api/gift-delivery?session_id={CHECKOUT_SESSION_ID}`
          : `${origin}/?payment=success`,
      cancel_url: `${origin}/?payment=cancelled`,
    });

    if (!session || !session.url) {
      const errorMsg = 'Stripe did not return a checkout URL.';
      return NextResponse.redirect(new URL(`/?payment=error&message=${encodeURIComponent(errorMsg)}`, origin).toString(), 303);
    }

    return NextResponse.redirect(session.url, 303);
  } catch (error) {
    console.error('Stripe checkout failed', error);
    const errorMsg = error instanceof Error ? error.message : 'Unable to start checkout.';
    return NextResponse.redirect(new URL(`/?payment=error&message=${encodeURIComponent(errorMsg)}`, origin).toString(), 303);
  }
}
