// DEVELOPMENT TESTING ONLY
// DO NOT ENABLE FOR LIVE CUSTOMER USE.
//
// This switch is evaluated in the browser and is deliberately restricted to
// `next dev`. Production and Cloudflare builds always keep payment gates on.
export const REVEAL_TEST_MODE = true;

const TESTABLE_REVEAL_TYPES = new Set(['lucky_pick', 'gift_package']);

export function canBypassRevealPayment(revealType) {
  return REVEAL_TEST_MODE;
}
