# Tasks: Gift Email Test Tool

**Feature**: `specs/085-gift-email-test-tool`

## Phase 1 — Setup

- [x] **T001** Confirm the baseline: `app/api/admin/test-gift-email/route.js` sends a real gift email but
  requires `GIFT_TEST_SECRET`, and `app/gift-email.js` already exposes `createGiftReveal()` and
  `sendGiftEmail()` with server-side `RESEND_API_KEY` / `GIFT_FROM_EMAIL`.
- [x] **T002** Confirm the regular paywall and paid flow are out of scope: `app/api/checkout/route.js`,
  `app/api/gift-delivery/route.js`, `app/api/stripe-webhook/route.js` and
  `app/test-tools/reveal-testing/revealTestConfig.js` are not modified.

## Phase 2 — Foundational

- [x] **T003** Add the switch and helper in `app/test-tools/gift-email/giftEmailTestConfig.js`
  (`GIFT_EMAIL_TEST_MODE = true`, `isGiftEmailTestEnabled()`).
- [x] **T004** Add the server route `app/api/test-tools/gift-email/route.js` with the switch gate,
  cross-site rejection, per-address rate limit, server-side Resend configuration, sanitisation, real
  reveal generation and no-store JSON responses.

## Phase 3 — User Story 1: send a real gift email without payment

- [x] **T005** [US1] Add `app/test-tools/gift-email/page.js` with the form, success/error reporting,
  noindex metadata and the safety explanation.
- [x] **T006** [US1] Add `app/test-tools/gift-email/GiftEmailTestForm.jsx` posting JSON to the test route
  and rendering the generated reveal after a successful send.
- [x] **T007** [US1] Document use, disabling and the safety boundary in
  `app/test-tools/gift-email/README.md`.

## Phase 4 — User Story 2: 6 Pick and 7 Pick fidelity

- [x] **T008** [US2] Pass the chosen game to `createGiftReveal()` and return the emailed reveal in the
  response.
- [x] **T009** [US2] Cover the 6 Pick (six unique 1–49) and 7 Pick (seven unique 1–50) payloads in the
  focused test.

## Phase 5 — User Story 3: preserve the paid flow and protect credentials

- [x] **T010** [US3] Add `__tests__/gift-email-test-tool.test.js` for validation, missing configuration,
  Resend failure, cross-site rejection, rate limiting, the disabled switch and the server-only secrets.
- [x] **T011** [US3] Add source guards proving the test route requires no `GIFT_TEST_SECRET`, references
  no Stripe checkout, and the client form reads no environment variable.
- [x] **T012** [US3] Point `.specify/feature.json` at this feature and record `spec.md`, `plan.md` and
  `tasks.md`.

## Phase 6 — Verification

- [x] **T013** Run `pnpm exec vitest run __tests__/gift-email-test-tool.test.js` and record the result.
- [x] **T014** Run the full `pnpm exec vitest run` and `pnpm exec tsc --noEmit` and record the results.
- [x] **T015** Run `./freebuff-verify.sh` and measure the production build against the 495 MB maximum.
- [ ] **T016** Inspect the complete final diff, update `PR_SUMMARY.md` and `memory-bank/activeContext.md`,
  and leave the PR open and unmerged.
