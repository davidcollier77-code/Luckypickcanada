# Restore the Lucky Reveal Paywalls

**PR:** [#1704](https://github.com/davidcollier77-code/Luckypickcanada/pull/1704) — open and unmerged,
awaiting owner review. Branch `freebuff/restore-reveal-paywalls` targets `main`.

## Task and task groups

**Task groups: `security` + `testing`.**

- `security` — removes public payment bypasses and restores Stripe enforcement for both paid reveals.
- `testing` — the result is an absence (no preview, no payment-free path), so it needs executed guards,
  a production build inspection, an HTTP smoke test and a browser-level check.

**Assigned task:** restore the paywalls for Personal Reveal and Gift Reveal; remove the free-preview
button; disable all public test-mode or payment-bypass paths; keep CAD $1.00 and CAD $1.99; preserve the
existing Stripe payment and gift-email setup.

## Documents reviewed

| Document | USED | USEFUL | Explanation |
|---|---|---|---|
| `.docs/manifest.json` | YES | YES | Routed the `security` and `testing` groups. |
| `.docs/security/_google_eng-practices.md` | NO | NO | The change removes existing code; no review guidance was needed. |
| `.docs/testing/_google_eng-practices.md` | NO | NO | Guards extend the existing Vitest/Playwright suites. |
| Stripe.js `/stripe/stripe-js` | NO | NO | No Stripe code changed; prices were verified from the route and tests. |
| Next.js `/vercel/next.js` | NO | NO | No framework behaviour was in question. |
| Vitest `/vitest-dev/vitest` | NO | NO | No new mocking or configuration pattern was needed. |
| Playwright `/microsoft/playwright` | NO | NO | Existing spec and a direct probe were used without new guidance. |

## Implemented

- **Preview removed, not hidden** — deleted `app/test-tools/reveal-testing/` (`REVEAL_TEST_MODE`,
  `canPreviewReveal`, README). The modal no longer imports it, accepts `onPreviewReveal`, renders the
  button/note or carries preview CSS; `HomePage` no longer wires the callback.
- **Gift test tool disabled** — `GIFT_EMAIL_TEST_MODE = false` is a compiled constant with no environment
  override. The page shows a "turned off" notice with no form; `POST /api/test-tools/gift-email` returns
  404 before reading configuration or sending email. README and page copy updated.
- **Paid paths preserved** — the form still posts to `/api/checkout`; prices remain 100/199 cents in
  one-time `payment` mode (CAD), with unchanged names, descriptions, metadata, callbacks and URLs.
  `/api/verify-session`, `/api/gift-delivery`, the webhook, `app/gift-email.js` and Resend are untouched.
- **Server-authoritative reveal unchanged** — a `payment=success` URL alone still renders nothing;
  verification requires `payment_status === 'paid'`.
- **Dev-only paths stay gated** — `/api/send-gift` returns 403 outside development; the `/reveal/[id]`
  fallback remains development-only. Neither is publicly reachable.

## Files changed

- Deleted: `app/test-tools/reveal-testing/{revealTestConfig.js,README.md}`
- Added: `specs/086-restore-reveal-paywalls/{spec,plan,tasks}.md`
- Modified: `app/checkout-modal.jsx`, `app/homepage/HomePage.js`, `themes/default/homepage.css`,
  `app/test-tools/gift-email/{giftEmailTestConfig.js,page.js,README.md}`,
  `__tests__/components/CheckoutModal.test.jsx`, `__tests__/security-payment.test.js`,
  `__tests__/gift-email-test-tool.test.js`, `tests/visual/lucky-reveal-selection.spec.ts`,
  `.specify/feature.json`, `memory-bank/activeContext.md`, `memory-bank/progress.md`, `PR_SUMMARY.md`

## Spec Kit

Specify → Plan → Tasks → Implement, one directory: `specs/086-restore-reveal-paywalls/`
(`spec.md`, `plan.md`, `tasks.md`). `.specify/feature.json` points there.

## Verification

| Check | Result | Evidence |
|---|---|---|
| Focused suites | **PASS** | 4 files / 42 tests, exit 0 (`CheckoutModal`, `security-payment`, `gift-email-test-tool`, `stripe-product-alignment`). |
| Full suite | **PASS** | `pnpm exec vitest run` — 38 files / 407 tests, exit 0. |
| TypeScript | **PASS** | `pnpm exec tsc --noEmit` — exit 0. |
| Repository gate | **PASS** | `SPEC_KIT_BASE_REF=a635bdcc… ./freebuff-verify.sh` — exit 0 (Spec Kit, typecheck, build, refresh-docs 19/19). |
| Build size | **PASS** | `.next` 343,866,056 B (327.9 MiB) + `public` 32,840,043 B = 376,706,099 B (359.3 MiB) < 495 MB. |
| Served output | **PASS** | No "Preview Reveal"/preview hook in `.next/static` or `.next/server`; stale webpack cache packs only, never served. |
| Homepage smoke | **PASS** | `next start` port 3100: HTTP 200, 0 preview strings. |
| Gift test page | **PASS** | HTTP 200, "turned off" notice, 0 form labels. |
| Gift test route | **PASS** | `POST /api/test-tools/gift-email` → **404** "turned off". |
| Legacy send route | **PASS** | `POST /api/send-gift` in production → **403** development-only. |
| Prices | **PASS** | Tests assert `unitAmount: 100` and `unitAmount: 199`; checkout route unmodified. |
| Browser popup | **PASS** | Chromium: `previewButtons: 0`, `previewHooks: 0`, `previewNote: 0`, `paidButtons: 1`, `deliveryChoices: 4`. |
| Live Stripe charge | **NOT RUN** | No keys and no charge permitted; no checkout code changed. |
| Real Resend email | **NOT RUN** | Bypass disabled; paid delivery code unchanged and covered by mocked tests. |
| PR-head CI | **PENDING** | Pushed; CI not observed in this session. |
| Owner review/merge | **PENDING** | PR left open and unmerged. |

## Preserved

Prices 100/199, one-time CAD payment, product names/descriptions/metadata, success/cancel callbacks,
server-side verification and persistence, paid gift delivery (session check, Redis lock, Resend),
tip jar, reveal presentation and paid-reveal counter. No dependency, lockfile, secret, environment,
deployment, database or `.docs/` change.

## Remaining issues and limitations

- No live Stripe checkout or real Resend send was executed here.
- The gift test tool remains in the tree, deliberately disabled; re-enabling requires editing the compiled
  constant, and a guard asserts it ships `false`.
- `/api/send-gift` and `/reveal/[id]` remain development-only (403 verified); they are not public.
- Stale `.next/cache` webpack packs still contain the old preview strings; served output is clean.

## Final diff audit

Complete diff reviewed: **19 files — 14 modified, 3 added Spec Kit artifacts, 2 deleted preview files**.
No secret, key or credential value appears. No checkout, Stripe product/price, webhook, verification,
gift delivery, Resend, database, dependency or deployment file is modified.

**USEFUL RESULT: YES** — the preview is removed from source and served output, both public payment-free
paths are closed, prices remain 100/199, and the paid Stripe/email code is untouched. Live charge and real
email remain unverified.
