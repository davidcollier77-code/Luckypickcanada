// GIFT EMAIL TEST SWITCH
//
// SHIPPED DISABLED. `true` would enable a public page and route that generate a
// Gift Edition reveal and send its email without creating a Stripe Checkout
// session or taking a payment. That is a payment bypass, so it must stay
// `false` on the public site; a local-only test can flip it temporarily.
//
// `false` hides the form and makes the route answer 404. The normal paid gift
// flow is never affected by this switch.
export const GIFT_EMAIL_TEST_MODE = false;

export function isGiftEmailTestEnabled() {
  return GIFT_EMAIL_TEST_MODE;
}
