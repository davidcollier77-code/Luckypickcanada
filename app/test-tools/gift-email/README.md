# Gift email test tool

## Status: disabled

`GIFT_EMAIL_TEST_MODE` is `false`. The public site therefore has no payment bypass: the page hides
its form and `POST /api/test-tools/gift-email` answers `404`. The regular paid Gift Edition checkout
and delivery are unchanged.

The tool exists only as a local diagnostic. It sends a real Gift Edition email through the existing
server-side Resend configuration without creating a Stripe Checkout session or taking a payment, so
enabling it places a payment-free Gift Reveal path on the public site.

## Local diagnostic use

1. Enable it only in a local checkout you are testing yourself: set `GIFT_EMAIL_TEST_MODE = true` in
   `giftEmailTestConfig.js`. Do not commit that change and do not deploy a build with it enabled.
2. Make sure the local server environment already has `RESEND_API_KEY` and `GIFT_FROM_EMAIL` set.
3. Open `/test-tools/gift-email`, fill in the recipient email and name, optionally the sender name and
   message, choose 6 Pick or 7 Pick, then press **Send test gift email**.
4. Restore `GIFT_EMAIL_TEST_MODE = false` before committing.

No API key or test secret is entered in the browser. The admin endpoint at
`/api/admin/test-gift-email` is separate and still requires `GIFT_TEST_SECRET`; this tool does not
use it.

## Safety boundary

- The page and route are gated by `GIFT_EMAIL_TEST_MODE`; when it is `false` the page hides the form
  and the route answers 404.
- The route rejects cross-site browser requests and is rate-limited to 5 sends per hour per address.
- The route uses the same `createGiftReveal()` and `sendGiftEmail()` functions as the paid gift
  delivery, so the generated reveal and the email markup are the real ones.
- It never creates a Stripe Checkout session, never changes prices, products or the payment flow.
- `RESEND_API_KEY` and `GIFT_FROM_EMAIL` are read only on the server. The browser receives no
  credential and no provider response body.
- The page sets `robots: noindex, nofollow` and is not linked from site navigation.

## Tests

`__tests__/gift-email-test-tool.test.js` covers the 6 Pick and 7 Pick payloads, validation, Resend
failure, cross-site rejection, rate limiting, the disabled switch, missing configuration, the
shipped-disabled state, and source guards that the route does not require `GIFT_TEST_SECRET` or
reference Stripe.
