# Tasks: Unified Lucky Reveal Experience

**Feature**: `specs/073-unified-lucky-reveal`

## Phase 1 — Setup

- [x] T001 Confirm the current prices, checkout callbacks, and email safeguards in `app/api/checkout/route.js`, `app/gift-email.js`, `app/api/gift-delivery/route.js`, and `app/api/stripe-webhook/route.js`.

## Phase 2 — Foundational

- [x] T002 Create the shared reveal module in `app/lucky-reveal.js` with `LUCKY_COLORS`, `LUCKY_DAYS`, `normalizeLuckyPickGame`, `generateLuckyNumbers`, `createLuckyReveal`, `hasValidLuckyNumbers`, and `buildLuckyReveal`.

## Phase 3 — User Story 1 (standard Lucky Reveal, website only)

- [x] T003 [US1] Map the verified session reveal through `buildLuckyReveal` in `app/homepage/HomePage.js`.
- [x] T004 [US1] State "Website reveal only · No email delivery" and rename the option to Lucky Reveal in `app/homepage/HomePage.js` and `app/checkout-modal.jsx`.
- [x] T005 [US1] Rename the `lucky_pick` checkout option to "Lucky Reveal" with a no-email description while keeping `unitAmount: 100` in `app/api/checkout/route.js`.

## Phase 4 — User Story 2 (Gift Edition reuses the same reveal)

- [x] T006 [US2] Replace the duplicated generator and colour/day vocabulary in `app/gift-email.js` with `createLuckyReveal`, `LUCKY_COLORS`, and `LUCKY_DAYS` from `app/lucky-reveal.js`.
- [x] T007 [US2] Present Gift Edition results through `buildLuckyReveal` in `app/reveal/[revealId]/page.tsx`, removing the fabricated fallback reveal.
- [x] T008 [US2] Drive the gift banner from the server-reported `giftDeliveredAt` in `app/reveal/[revealId]/page.tsx`.

## Phase 5 — User Story 3 (one clear purchase choice)

- [x] T009 [US3] Align both homepage offer cards on the labels Lucky Reveal and Lucky Reveal Gift Edition with explicit inclusion statements in `app/homepage/HomePage.js`.
- [x] T010 [US3] Align the modal descriptions for both options in `app/checkout-modal.jsx`.
- [x] T011 [US3] Rename the `gift_package` checkout option to "Lucky Reveal Gift Edition" in `app/api/checkout/route.js`.

## Phase 6 — Tests and verification

- [x] T012 Add `__tests__/lucky-reveal-shared.test.js` covering generator rules, mapping validation, Gift Edition reuse, and source guards.
- [x] T013 Add standard-option email-refusal tests to `__tests__/gift-email-error-handling.test.js`.
- [x] T014 Add price, callback, and label regression tests to `__tests__/security-payment.test.js`.
- [x] T015 Run `pnpm exec vitest run`, `pnpm tsc --noEmit`, `./freebuff-verify.sh`, and measure the production build size.
- [x] T016 Audit the complete final diff and record the result in the single PR summary.

## Phase 7 — Stripe product alignment (added 2026-11-02, same feature and PR)

- [x] T017 Realign the Gift Edition price 299 → 199 in `app/api/checkout/route.js` and the matching `amount_total` guard in `app/gift-email.js` (authorized by the owner's Stripe alignment request).
- [x] T018 Rename the tip jar Stripe product to "Tip Jar" while keeping the customer-entered `tipAmount` and the $0.50 minimum in `app/api/checkout/route.js`.
- [x] T019 State the suggested CAD $5.00 tip in `app/checkout-modal.jsx`.
- [x] T020 Update the gift price copy in `app/homepage/HomePage.js` and the reveal test-tool comments to CAD $1.99.
- [x] T021 Add `__tests__/stripe-product-alignment.test.js` and update the prices asserted in `__tests__/security-payment.test.js` and `__tests__/gift-email-error-handling.test.js`.

## Phase 8 — Official Checkout labels and dead route cleanup (added 2026-11-02)

- [x] T022 Set the Stripe Checkout product names to `Lucky Pick` and `Lucky Pick Gift` in `app/api/checkout/route.js`, keeping the Lucky Reveal website presentation and every amount, currency, and callback unchanged.
- [x] T023 Update `__tests__/security-payment.test.js` and `__tests__/stripe-product-alignment.test.js` for the official labels and the unchanged website labels.
- [x] T024 Prove `app/api/verify-session/route.js` is an empty tracked placeholder, confirm the compiled endpoint comes from `route.ts`, and delete only the empty file.

## Dependencies

- T002 blocks T003, T006–T008, and T012.
- T005, T011, T013, T017, and T018 must land together so no option can reach the wrong delivery path and the gift price guard never disagrees with the charged amount.
- Verification (T015) runs only after every implementation task is complete.

## Implementation Strategy

One sequential pass: shared module first, then both purchase options, then presentation, then the
regression suite, then the verification gate and diff audit.
