# Tasks: Restore the Lucky Reveal Paywalls

**Feature**: `specs/086-restore-reveal-paywalls`

## Phase 1 — Baseline and setup

- [x] **T001** Confirm the task base is `a635bdcc` (merge of PR #1703) and that the public bypasses are
  live: `REVEAL_TEST_MODE = true` renders **Preview Reveal — FREE**, and `GIFT_EMAIL_TEST_MODE = true`
  exposes the payment-free gift email page/route.
- [x] **T002** Confirm the paid flow is otherwise server-authoritative: `/api/verify-session` requires
  `payment_status === 'paid'`; `/api/gift-delivery` requires a paid `gift_package`; `/api/checkout` prices
  are 100 and 199; `/api/send-gift` and the `/reveal/[id]` fallback are development-only.

## Phase 2 — Remove the free preview (US1 + US2)

- [x] **T003** [US1] Delete `app/test-tools/reveal-testing/` (switch helper and README).
- [x] **T004** [US1] Remove the preview import, prop, handler and markup from `app/checkout-modal.jsx`.
- [x] **T005** [US1] Remove the `onPreviewReveal` wiring, `startLuckyReveal` and the unused
  `createLuckyReveal` import from `app/homepage/HomePage.js`.
- [x] **T006** [US1] Delete the preview CSS rules from `themes/default/homepage.css`.

## Phase 3 — Disable the gift-email payment bypass (US2 + US3)

- [x] **T007** [US2] Set `GIFT_EMAIL_TEST_MODE = false` and document that enabling it re-creates a public
  payment bypass.
- [x] **T008** [US2] Update the test page and README so they describe a disabled local diagnostic, not an
  available public tool.

## Phase 4 — Regression guards (US3)

- [x] **T009** [US3] Rewrite `__tests__/components/CheckoutModal.test.jsx` to assert paid-only actions for
  personal, gift, unified and tip flows, with no preview control.
- [x] **T010** [US3] Update `__tests__/security-payment.test.js` to assert the preview module is absent, no
  preview wiring remains, the paid form still posts to `/api/checkout`, prices are 100/199, and the
  dev-only legacy endpoint is blocked outside development.
- [x] **T011** [US3] Extend `__tests__/gift-email-test-tool.test.js` to assert the shipped switch is
  `false`, the helper returns false, and no environment override exists.
- [x] **T012** [US3] Update `tests/visual/lucky-reveal-selection.spec.ts` to assert no preview control and
  drive the reveal popup from a mocked paid verification response.

## Phase 5 — Verification and report

- [x] **T013** Run the focused suites, the full `pnpm exec vitest run`, and `pnpm exec tsc --noEmit`.
- [x] **T014** Run `./freebuff-verify.sh`, measure the production build, and search the build output for
  "Preview Reveal".
- [x] **T015** Run the production smoke checks (homepage, disabled test page/route, prices) and record
  anything not run.
- [x] **T016** Inspect the complete final diff, update `PR_SUMMARY.md`, `memory-bank/activeContext.md` and
  `memory-bank/progress.md`, and leave PR #1704 open and unmerged.
