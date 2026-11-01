// PUBLIC REVEAL PREVIEW
// Set to false to hide the free preview buttons.
//
// While enabled, every visitor can preview Lucky Pick and Gift reveals.
// The normal Stripe checkout remains available for paid purchases and gift email delivery.
export const REVEAL_TEST_MODE = true;

const TESTABLE_REVEAL_TYPES = new Set(['lucky_pick', 'gift_package']);

export function canBypassRevealPayment(revealType) {
  return REVEAL_TEST_MODE && TESTABLE_REVEAL_TYPES.has(revealType);
}
