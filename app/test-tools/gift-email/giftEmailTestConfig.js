// GIFT EMAIL TEST SWITCH
//
// `true` enables the gift email test page and its server route. The tool sends a
// real Gift Edition email through the existing server-side Resend configuration
// (RESEND_API_KEY and GIFT_FROM_EMAIL) without creating a Stripe Checkout
// session or taking a payment. It never reads or returns those credentials.
//
// `false` hides the form and makes the route answer 404. The normal paid gift
// flow is never affected by this switch.
export const GIFT_EMAIL_TEST_MODE = true;

export function isGiftEmailTestEnabled() {
  return GIFT_EMAIL_TEST_MODE;
}
