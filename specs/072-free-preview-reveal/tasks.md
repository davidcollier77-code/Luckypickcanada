# Tasks: Free Preview Reveal in the Checkout Modals

**Input**: Design documents from `specs/072-free-preview-reveal/`

**Prerequisites**: `plan.md`, `spec.md`

## Phase 1: Setup and Baseline

- [X] T001 [US1] Inspect `app/checkout-modal.jsx`, `app/test-tools/reveal-testing/revealTestConfig.js`,
  `app/homepage/HomePage.js` reveal wiring, `app/lucky-reveal-popup.js`, and the checkout styles.
- [X] T002 [US1] Confirm the baseline defect: `REVEAL_TEST_MODE` intercepted the paid form submit and,
  for gifts, posted to `/api/send-gift`, which a free preview must never do.
- [X] T003 [US1] Confirm all three modal types (`lucky_pick`, `gift_package`, `tip`) share one form and
  that only the first two may preview.

## Phase 2: User Story 1 — Lucky Pick preview (Priority: P1)

- [X] T004 [US1] Replace `canBypassRevealPayment` with `canPreviewReveal(type)` gated by
  `REVEAL_TEST_MODE`, and enable the switch.
- [X] T005 [US1] Render a separate `type="button"` **Preview Reveal — FREE** control outside the form,
  with a short note that previews take no payment and send no emails.
- [X] T006 [US1] Route the preview to the existing reveal via `onPreviewReveal(type, game)` in
  `app/homepage/HomePage.js`.

## Phase 3: User Story 2 — Gift preview (Priority: P1)

- [X] T007 [US2] Ensure the gift preview ignores recipient fields and makes no `/api/send-gift` call.
- [X] T008 [US2] Keep gift delivery and email routes untouched.

## Phase 4: User Story 3 — Switch off, tip jar, paid flow preserved (Priority: P1)

- [X] T009 [US3] Restore the paid submit handler to the original duplicate-submit guard so
  `/api/checkout` submission, validation, and reset behaviour are unchanged.
- [X] T010 [US3] Exclude `tip` from `canPreviewReveal` so the tip jar has no preview control.
- [X] T011 [US3] Remove the tracked stale `app/checkout-modal.jsx.orig` that held the old
  `/api/send-gift` preview bypass.
- [X] T012 [US3] Add secondary button styling for the preview control without changing existing CTA
  styling, artwork, or animations.

## Phase 5: Tests, Documentation and Verification

- [X] T013 [US1] Add `__tests__/components/CheckoutModal.test.jsx` covering both flows, both game
  sizes, no network call, tip exclusion, switch-off hiding, and an untouched paid submit.
- [X] T014 [US1] Update `__tests__/security-payment.test.js` for the new switch semantics and add a
  source guard that the modal never references `/api/send-gift` or `/api/checkout` for previews.
- [X] T015 [US1] Rewrite `app/test-tools/reveal-testing/README.md`.
- [X] T016 [US1] Run the focused tests, `pnpm test`, `pnpm exec tsc --noEmit`, and
  `./freebuff-verify.sh`; record the measured production build size.
- [ ] T017 [US1] PENDING — owner review of the open, unmerged PR; no browser-level visual check of the
  new button was performed in this workspace.
