# Restore the Lucky Reveal Paywalls

**Branch:** `freebuff/restore-reveal-paywalls` targets `main`.

## Task and task groups

**Task groups: `security` + `testing`.**

- `security` — the task removes public payment bypasses and restores Stripe enforcement for both paid
  reveals, so the access-control and monetization boundary is the core of the change.
- `testing` — the required outcome is an absence (no preview, no payment-free path), which needs executed
  guards, a production build inspection, an HTTP smoke test and a browser-level check rather than code
  inspection alone.

**Assigned task:** restore the paywalls for Personal Reveal and Gift Reveal. Remove the free-preview
button and disable all public test-mode or payment-bypass paths that allow either reveal to be accessed
without completing the normal Stripe payment. Keep the prices at CAD $1.00 for Personal Reveal and CAD
$1.99 for Gift Reveal. Preserve the existing Stripe payment and gift-email setup.

## Reference documents reviewed

| Document | USED | USEFUL | Explanation |
|---|---|---|---|
| `.docs/manifest.json` | YES | YES | Routed the `security` and `testing` groups and their reference sets. |
| `.docs/security/_google_eng-practices.md` | NO | NO | The change removes existing code and follows repository patterns; no review guidance was needed. |
| `.docs/testing/_google_eng-practices.md` | NO | NO | The guards extend the repository's existing Vitest and Playwright suites. |
| Stripe.js `/stripe/stripe-js` | NO | NO | No Stripe client or checkout code changed; prices were verified from the existing route and tests. |
| Next.js `/vercel/next.js` | NO | NO | The edits remove an existing client prop and markup; no framework behaviour was in question. |
| Vitest `/vitest-dev/vitest` | NO | NO | No new mocking or configuration pattern was needed. |
| Playwright `/microsoft/playwright` | NO | NO | The existing visual spec and a direct Playwright probe were used without new test-generation guidance. |

## What was actually implemented

- **Free preview removed, not hidden** — deleted `app/test-tools/reveal-testing/` (the
  `REVEAL_TEST_MODE` / `canPreviewReveal` helper and its README). The `checkout-modal` no longer imports
  it, accepts no `onPreviewReveal` prop, renders no preview button or note, and `HomePage` no longer wires
  a preview callback. The preview-only CSS rules were deleted.
- **Gift test tool disabled** — `GIFT_EMAIL_TEST_MODE` is now the compiled constant `false`, with no
  environment override. The page renders a "turned off" notice and no form; `POST
  /api/test-tools/gift-email` returns `404` before reading any configuration or sending email.
- **Paid paths preserved** — the modal still posts its normal form to `/api/checkout`. `/api/checkout`
  still charges 100 cents for `lucky_pick` and 199 for `gift_package` in one-time `payment` mode (CAD),
  with unchanged names, descriptions, metadata, success/cancel URLs and callbacks. `/api/verify-session`,
  `/api/gift-delivery`, the webhook, `app/gift-email.js` and Resend handling were not modified.
- **Server-authoritative reveal unchanged** — a `payment=success` URL alone still produces nothing;
  `verify-session` requires `payment_status === 'paid'`.
- **Legacy dev-only paths remain gated** — `/api/send-gift` still answers 403 outside `NODE_ENV ===
  'development'`; the `/reveal/[id]` deterministic fallback is still development-only. Neither is a
  public bypass; the production smoke confirmed the 403.

## Files changed

- Deleted `app/test-tools/reveal-testing/revealTestConfig.js`
- Deleted `app/test-tools/reveal-testing/README.md`
- Updated `app/checkout-modal.jsx`
- Updated `app/homepage/HomePage.js`
- Updated `themes/default/homepage.css`
- Updated `app/test-tools/gift-email/giftEmailTestConfig.js`
- Updated `app/test-tools/gift-email/page.js`
- Updated `app/test-tools/gift-email/README.md`
- Updated `__tests__/components/CheckoutModal.test.jsx`
- Updated `__tests__/security-payment.test.js`
- Updated `__tests__/gift-email-test-tool.test.js`
- Updated `tests/visual/lucky-reveal-selection.spec.ts`
- Added `specs/086-restore-reveal-paywalls/spec.md`, `plan.md`, `tasks.md`
- Updated `.specify/feature.json`, `memory-bank/activeContext.md`, `memory-bank/progress.md`,
  `PR_SUMMARY.md`

## Spec Kit stages and artifacts

Completed in order under one feature directory:

- **Specify** — `specs/086-restore-reveal-paywalls/spec.md`
- **Plan** — `specs/086-restore-reveal-paywalls/plan.md`
- **Tasks** — `specs/086-restore-reveal-paywalls/tasks.md`
- **Implement** — all implementation tasks complete; verification is recorded below and in `tasks.md`.

`.specify/feature.json` points at `specs/086-restore-reveal-paywalls`.

## Verification (commands actually run and results)

| Check | Result | Evidence |
|---|---|---|
| Focused suites | **PASS** | `pnpm exec vitest run __tests__/components/CheckoutModal.test.jsx __tests__/security-payment.test.js __tests__/gift-email-test-tool.test.js __tests__/stripe-product-alignment.test.js` — 4 files, 42 tests passed, exit 0. |
| Full suite | **PASS** | `pnpm exec vitest run` — 38 files, 407 tests passed, exit 0. |
| TypeScript | **PASS** | `pnpm exec tsc --noEmit` — exit 0. |
| Repository gate | **PASS** | `SPEC_KIT_BASE_REF=a635bdccf5b60d4f662a256815845c7cca53abd7 ./freebuff-verify.sh` — exit 0: Spec Kit gate, typecheck, production build, refresh-docs 19/19. |
| Production build size | **PASS** | `.next` 343,866,056 B / 327.9 MiB; combined with `public` 32,840,043 B = 376,706,099 B / 359.3 MiB, below the 495 MB maximum. |
| Served output contains no preview | **PASS** | `grep -rl "Preview Reveal\|checkout-modal-preview" .next/static .next/server` returned nothing. Only stale `.next/cache/webpack/*` packs still contain the string from an earlier build; they are not served. |
| Production homepage | **PASS** | `next start` on port 3100 returned HTTP 200 with 0 occurrences of "Preview Reveal". |
| Gift test page disabled | **PASS** | `/test-tools/gift-email` returned HTTP 200 with the "turned off" notice and 0 occurrences of the submit form label. |
| Gift test route disabled | **PASS** | `POST /api/test-tools/gift-email` returned **404** `{"error":"The gift email test tool is turned off."}`. |
| Legacy send endpoint | **PASS** | `POST /api/send-gift` in production returned **403** `"This endpoint is restricted to development test mode."` |
| Prices unchanged | **PASS** | `stripe-product-alignment` and `security-payment` tests assert `unitAmount: 100` and `unitAmount: 199`; the checkout route was not modified. |
| Browser popup check | **PASS** | Playwright Chromium against the production server: `previewButtons: 0`, `previewHooks: 0`, `previewNote: 0`, `paidButtons: 1`, `deliveryChoices: 4`. |
| Live Stripe payment | **NOT RUN** | No Stripe keys and no charge is permitted in this workspace; no checkout code changed. |
| Real Resend gift delivery | **NOT RUN** | The bypass is disabled, so no test send was possible or appropriate; the paid delivery code is unchanged and covered by existing mocked tests. |
| PR-head CI | **PENDING** | Available after the branch is pushed. |
| Owner review / merge | **PENDING** | The PR is intentionally left open and unmerged. |

## Behavior preserved

- Personal Reveal remains CAD $1.00 and Gift Reveal CAD $1.99, one-time `payment` in CAD, with the same
  Stripe product names, descriptions, metadata, success/cancel URLs and webhook behaviour.
- The paid reveal is still persisted and verified server-side; the success URL alone cannot render one.
- Gift delivery still requires a paid `gift_package` session, the Redis delivery lock/idempotency and the
  Resend configuration; `app/gift-email.js` is untouched.
- The tip jar, the unified popup's delivery/game choices, the reveal presentation and the paid-reveal
  counter are unchanged.
- No dependency, lockfile, secret, environment variable, deployment configuration, database or `.docs/`
  file was changed.

## Remaining issues and limitations

- A live Stripe checkout and a real Resend gift delivery were not executed here; no keys or charges are
  available, and the change does not alter those code paths.
- The gift test tool and its route still exist, deliberately disabled. A future contributor could re-enable
  it only by editing the compiled constant; the README says not to, and a guard asserts it ships `false`.
- The legacy `/api/send-gift` endpoint and the `/reveal/[id]` fallback remain development-only; they are not
  publicly reachable and the production 403 was verified.
- The stale webpack cache in `.next/cache` still contains the removed preview strings; a clean build removes
  them, but the served output was verified clean.

## Final diff audit

The complete final diff was reviewed: 13 tracked files changed (2 deleted, 11 modified) plus the new
`specs/086-restore-reveal-paywalls/` directory, `memory-bank` notes and this summary. No secret, key or
credential value appears in the diff. No checkout, Stripe product/price, webhook, verification, gift
delivery, Resend, database, dependency or deployment file is modified.

**USEFUL RESULT: YES** — the free-preview control is removed from source and served output, both public
payment-free paths are closed (preview deleted, gift tool 404/form hidden), prices remain 100/199, and the
paid Stripe/email code is untouched. Live charge and real email are explicitly unverified.
