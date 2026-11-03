# Tasks: Paid Lucky Reveal Counter and Reveal Popup Map CTA Removal

**Feature**: `specs/084-lucky-reveal-counter`

## Phase 1 — Setup

- [x] **T001** Confirm the baseline: the reveal popup renders the "Add me to the Little Luck Map" CTA
  (`app/lucky-reveal-popup.js`), and `app/homepage/HomePage.js` renders the reserved zero-height
  `#lucky-map` slot directly between `#personalized` and `#tip-jar-section`.
- [x] **T002** Confirm the paid completion paths that can observe a successful purchase:
  `/api/verify-session` (Personal), `/api/gift-delivery` (Gift success redirect) and
  `/api/stripe-webhook` (`checkout.session.completed`).

## Phase 2 — Foundational

- [x] **T003** Add the `lucky_reveal_tally` table (`session_id` unique, `reveal_type` constrained to the
  two paid reveal products) to `app/lib/db-init.js`.
- [x] **T004** Add `app/lucky-reveal-tally.js` with `recordLuckyRevealCreated` (atomic
  `ON CONFLICT DO NOTHING`) and `getLuckyRevealCount` (count, clamped to 0, never throws).

## Phase 3 — User Story 1: the homepage paid-reveal counter

- [x] **T005** [US1] Add `GET /api/lucky-reveals-count` in `app/api/lucky-reveals-count/route.js`
  returning `{ total }` with `no-store`.
- [x] **T006** [US1] Add `app/homepage/LuckyRevealsCounter.js`, rendering the exact label
  "LUCKY REVEALS CREATED TO DATE" and starting at 0 before reading the endpoint.
- [x] **T007** [US1] Replace the reserved `#lucky-map` slot in `app/homepage/HomePage.js` with the counter
  so it sits below the Lucky Reveal section and above the Tip Jar.
- [x] **T008** [US1] Replace `.homepage-map-slot` in `themes/default/homepage.css` with the premium
  neon-gold counter treatment, including a `prefers-reduced-motion` guard.

## Phase 4 — User Story 2: one increment per completed paid reveal

- [x] **T009** [US2] Record the tally in `app/api/verify-session/route.ts` after the session is paid and
  its `checkoutType` is a paid reveal product.
- [x] **T010** [US2] Record the tally in `app/api/gift-delivery/route.js` after the gift session is paid,
  without changing email delivery or the redirect behaviour.
- [x] **T011** [US2] Record the tally in `app/api/stripe-webhook/route.js` on a paid
  `checkout.session.completed` for either reveal product, before the existing gift-delivery branch.
- [x] **T012** [US2] Add `__tests__/lucky-reveal-counter.test.js`: one increment per paid purchase,
  duplicate suppression, rejection of tips/invalid input, graceful 0 on an unconfigured or failing store,
  and source guards for all three recording points and the read endpoint.

## Phase 5 — User Story 3: remove the popup map CTA

- [x] **T013** [US3] Remove the "Add me to the Little Luck Map" button, its unused `playButtonClick`
  import and its `.lucky-map-button-enhanced` styles from `app/lucky-reveal-popup.js`.
- [x] **T014** [US3] Update `__tests__/lucky-reveal-background.test.js` and
  `__tests__/lucky-reveal-polish.test.js` to assert the CTA is gone while every remaining control stays.
- [x] **T015** [US3] Update `__tests__/security-payment.test.js` and
  `tests/visual/lucky-reveal-selection.spec.ts` from the empty map slot to the paid-reveal counter,
  keeping the position checks and the no-location-collection guard.

## Phase 6 — Polish and verification

- [x] **T016** Point `.specify/feature.json` at this feature and record the Spec Kit artifacts
  (`spec.md`, `plan.md`, `tasks.md`, `data-model.md`, contract, checklist).
- [x] **T017** Run the focused suites and the full `pnpm exec vitest run`; record the real results.
- [x] **T018** Run `pnpm exec tsc --noEmit` and `./freebuff-verify.sh`; measure the production build
  against the 495 MB maximum.
- [x] **T019** Update `PR_SUMMARY.md` and `memory-bank/activeContext.md`, audit the complete final diff and
  leave the PR open and unmerged.

## Notes

- T003–T004 are the blocking prerequisites for every tally call site.
- No live Stripe checkout, real charge or real gift email is sent by this task; those remain unverified
  and are recorded as such.
