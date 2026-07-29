# Reveal testing controls

## Purpose

This isolated development-only control launches the existing Lucky Pick reveal presentation without sending the developer through Stripe. It is limited to the $1 Lucky Pick and $4.99 Gift flows so their 6 Pick and 7 Pick reveal output can be checked repeatedly.

## Enable test mode

1. Open `app/test-tools/reveal-testing/revealTestConfig.js`.
2. Change `REVEAL_TEST_MODE` from `false` to `true`.
3. Run the app locally with `npm run dev`.
4. Open either eligible reveal flow, select a game, and submit its existing form. The reveal launches directly instead of posting to checkout.

## Disable test mode

Change `REVEAL_TEST_MODE` back to `false`.

## Safety boundary

**DEVELOPMENT TESTING ONLY. DO NOT ENABLE FOR LIVE CUSTOMER USE.**

The bypass only evaluates to true in local `next dev` development mode. Production and Vercel preview builds always submit to `/api/checkout` and preserve the existing Stripe payment requirement. The bypass never calls or changes Stripe, payment verification, webhooks, email delivery, databases, or payment environment variables.

## Scope

- Included: $1 Lucky Pick reveal and $4.99 Gift reveal presentation testing.
- Excluded: Lucky Card Reveal, tip jar, all production customer payment flows, and all payment/email/backend systems.
