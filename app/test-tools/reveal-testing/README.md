# Reveal preview control

## Purpose

`REVEAL_TEST_MODE` is the single on/off switch for the **Preview Reveal — FREE** button in the
$1 Lucky Pick and $2.99 Gift checkout modals. The button opens the existing reveal animation
(6 Pick or 7 Pick, as selected in the modal) so the presentation can be checked without paying.

The preview is public: no account or login is required while the switch is on.

## Enable previews

1. Open `app/test-tools/reveal-testing/revealTestConfig.js`.
2. Set `REVEAL_TEST_MODE` to `true`.
3. Start the app with `pnpm dev` (or `pnpm start` for a production build that already includes the
   enabled switch).
4. Open either the Lucky Pick or Gift checkout modal. Both the paid
   **Continue to secure checkout** button and the separate **Preview Reveal — FREE** button appear.
5. Choose 6 Pick or 7 Pick, then press **Preview Reveal — FREE**. The modal closes and the existing
   reveal popup opens for that game.

## Disable previews

Set `REVEAL_TEST_MODE` back to `false`. The preview buttons and their explanation disappear from
both modals. The paid checkout button is unaffected in either state.

## Safety boundary

- The preview is a `type="button"` control outside the checkout `<form>`. It never submits the form,
  never opens `/api/checkout`, never creates a Stripe Checkout session, never takes a payment, never
  calls `/api/send-gift`, never sends an email, and never writes to the database.
- `REVEAL_TEST_MODE` does not modify the paid form submission. Pressing **Continue to secure
  checkout** always posts to `/api/checkout` and follows the unchanged Stripe, verification, and
  gift-delivery routes.
- The reveal content is generated in the browser by the existing `createLuckyReveal()` helper; it is
  not the persisted, paid reveal record.

## Scope

- Included: the $1 Lucky Pick and $2.99 Gift checkout modals, with their 6 Pick and 7 Pick reveal
  presentations.
- Excluded: the tip jar (no preview button, tip payments unchanged), Lucky Card Reveal, and all
  production payment, verification, email, and database systems.

## Tests

- `__tests__/components/CheckoutModal.test.jsx` — preview visibility for both flows, preview for the
  selected 6/7 pick, no fetch/checkout/gift call from a preview, no preview on the tip jar, hidden
  when the switch is off, and an untouched paid submit.
- `__tests__/security-payment.test.js` — the switch/helper semantics and a source guard that the
  checkout modal never routes to `/api/send-gift` or `/api/checkout` from the preview.
