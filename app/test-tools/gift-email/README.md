# Gift email test tool

## Purpose

`/test-tools/gift-email` sends one real Gift Edition email through the existing server-side Resend
configuration. It exists to verify that the gift reveal generates correctly and that Resend delivers
the email. It bypasses the Stripe payment requirement only.

## Use it

1. Keep `GIFT_EMAIL_TEST_MODE = true` in `giftEmailTestConfig.js` (the default).
2. Make sure the server environment already has `RESEND_API_KEY` and `GIFT_FROM_EMAIL` set.
3. Open `/test-tools/gift-email`, fill in the recipient email and name, optionally the sender name and
   message, choose 6 Pick or 7 Pick, then press **Send test gift email**.
4. The page reports the delivery result and the generated numbers, lucky colour and lucky day.

No API key or test secret is entered in the browser. The admin endpoint at
`/api/admin/test-gift-email` is separate and still requires `GIFT_TEST_SECRET`; this tool does not
use it.

## Safety boundary

- The page and route are gated by `GIFT_EMAIL_TEST_MODE`; when it is `false` the page hides the form
  and the route answers 404.
- The route rejects cross-site browser requests and is rate-limited to 5 sends per hour per address.
- The route uses the same `createGiftReveal()` and `sendGiftEmail()` functions as the paid gift
  delivery, so the generated reveal and the email markup are the real ones.
- It never creates a Stripe Checkout session, never changes prices, products or the payment flow,
  and never touches the regular paywall or the free preview.
- `RESEND_API_KEY` and `GIFT_FROM_EMAIL` are read only on the server. The browser receives no
  credential and no provider response body.
- The page sets `robots: noindex, nofollow` and is not linked from site navigation.

## Tests

`__tests__/gift-email-test-tool.test.js` covers the 6 Pick and 7 Pick payloads, validation, Resend
failure, cross-site rejection, rate limiting, the disabled switch, missing configuration, and source
guards that the route does not require `GIFT_TEST_SECRET` or reference Stripe.
