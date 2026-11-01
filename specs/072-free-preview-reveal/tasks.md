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
- [X] T017 [US1] Owner review of the open, unmerged PR.
- [X] T018 [US1] Playwright browser verification against the local dev server (1440x900, DPR 2): the
  preview control is visible and labelled in the Lucky Pick and Gift modals, absent on the tip jar,
  is `type="button"` outside the checkout form, and pressing it opens the reveal with zero requests to
  `/api/checkout`, `/api/send-gift`, or Stripe, no form `submit` event, and no navigation (22/22 checks).
  Screenshots and the machine-readable report live in `artifacts/` as untracked evidence.
- [ ] T019 [US1] Open product decision (not implemented, out of scope by FR-008): the reused reveal
  panel still shows its paid "PAYMENT COMPLETE" eyebrow during a free preview.


## Follow-up Phase — Production Visibility Correction

- [X] T020 [US1] Correct the production-only visibility defect by setting the existing
  `REVEAL_TEST_MODE` switch to `true` directly; preserve the eligible-type allowlist and the
  `false` off-switch behavior.
- [X] T021 [US1] Add a regression assertion that the configured switch is explicitly enabled and both
  permitted preview types are visible under the enabled setting; keep the tip jar excluded.
- [ ] T022 [US1] Run focused tests and `./freebuff-verify.sh`; inspect the final diff and record the
  production build size and any pending PR checks.
