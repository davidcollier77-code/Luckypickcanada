// PUBLIC PREVIEW SWITCH
//
// `true` shows the "Preview Reveal — FREE" button in the $1 Lucky Pick and
// $2.99 Gift checkout modals. `false` hides it. The preview only launches the
// existing reveal presentation: it never submits the checkout form, creates a
// Stripe session, takes a payment, sends an email, or touches the database.
// It does not intercept or change the paid "Continue to secure checkout" path.
export const REVEAL_TEST_MODE = true;

// Eligible flows only. The tip jar never exposes a preview.
const PREVIEW_REVEAL_TYPES = new Set(['lucky_pick', 'gift_package']);

export function canPreviewReveal(revealType) {
  return REVEAL_TEST_MODE && PREVIEW_REVEAL_TYPES.has(revealType);
}
