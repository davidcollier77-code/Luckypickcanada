'use server'

import { stripe } from '@/lib/stripe'

// The LuckyPick reveal is a fixed $1.00 CAD.
const LUCKY_PICK_CENTS = 100

export async function startLuckyPickCheckoutSession() {
  const session = await stripe.checkout.sessions.create({
    ui_mode: 'embedded_page',
    redirect_on_completion: 'never',
    line_items: [
      {
        price_data: {
          currency: 'cad',
          product_data: {
            name: 'LuckyPick Reveal',
            description: 'Your personalized lucky numbers, colour, day, and message.',
          },
          unit_amount: LUCKY_PICK_CENTS,
        },
        quantity: 1,
      },
    ],
    mode: 'payment',
  })

  return session.client_secret
}

// Pay-what-you-want tip jar limits (in cents).
const MIN_TIP_CENTS = 100 // $1.00
const MAX_TIP_CENTS = 50000 // $500.00

export async function startTipCheckoutSession(amountInCents: number) {
  // Validate the amount fully on the server so it can never be tampered with.
  if (
    typeof amountInCents !== 'number' ||
    !Number.isFinite(amountInCents) ||
    !Number.isInteger(amountInCents)
  ) {
    throw new Error('Invalid tip amount.')
  }
  if (amountInCents < MIN_TIP_CENTS) {
    throw new Error('The minimum tip is $1.00.')
  }
  if (amountInCents > MAX_TIP_CENTS) {
    throw new Error('The maximum tip is $500.00.')
  }

  const session = await stripe.checkout.sessions.create({
    ui_mode: 'embedded_page',
    redirect_on_completion: 'never',
    submit_type: 'donate',
    line_items: [
      {
        price_data: {
          currency: 'cad',
          product_data: {
            name: 'Support LuckyPickCanada.ca',
            description: 'A little tip to help keep the luck flowing. Thank you!',
          },
          unit_amount: amountInCents,
        },
        quantity: 1,
      },
    ],
    mode: 'payment',
  })

  return session.client_secret
}
