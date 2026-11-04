# Restore the Lucky Reveal Paywalls

**PR:** [#1704](https://github.com/davidcollier77-code/Luckypickcanada/pull/1704) — open and unmerged,
awaiting owner review. Branch `freebuff/restore-reveal-paywalls` targets `main`.

## Task and task groups

**Task groups: `security` + `testing`.**

- `security` — removes public payment bypasses and restores Stripe enforcement for both paid reveals.
- `testing` — the result is an absence, so it needs executed guards, a clean production build, an HTTP
  smoke test and a browser-level check.

**Assigned task:** restore the paywalls for Personal Reveal and Gift Reveal; remove the free-preview
button; disable all public test-mode or payment-bypass paths; keep CAD $1.00 and CAD $1.99; preserve the
existing Stripe payment and gift-email setup.

**Follow-up (2026-11-04):** remove the disabled gift email test tool and its route entirely.

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
- **Gift email test tool removed entirely** — deleted `app/test-tools/gift-email/` (page, client form,
  `GIFT_EMAIL_TEST_MODE` switch, README), `app/api/test-tools/gift-email/route.js` and
  `__tests__/gift-email-test-tool.test.js`. `/test-tools/gift-email` and
  `POST /api/test-tools/gift-email` now return 404; no switch or route remains to re-enable the bypass.
  `__tests__/security-payment.test.js` guards the absent page and route.
- **Paid paths preserved** — the form still posts to `/api/checkout`; prices remain 100/199 cents in
  one-time `payment` mode (CAD), with unchanged names, descriptions, metadata, callbacks and URLs.
  `/api/verify-session`, `/api/gift-delivery`, the webhook, `app/gift-email.js` and Resend are untouched.
- **Server-authoritative reveal unchanged** — a `payment=success` URL alone still renders nothing;
  verification requires `payment_status === 'paid'`.
- **Dev-only paths stay gated** — `/api/send-gift` returns 403 outside development; the `/reveal/[id]`
  fallback remains development-only. Neither is publicly reachable.

## Files changed

- Deleted (preview): `app/test-tools/reveal-testing/{revealTestConfig.js,README.md}`
- Deleted (follow-up): `app/test-tools/gift-email/{page.js,GiftEmailTestForm.jsx,giftEmailTestConfig.js,README.md}`,
  `app/api/test-tools/gift-email/route.js`, `__tests__/gift-email-test-tool.test.js`
- Added: `specs/086-restore-reveal-paywalls/{spec,plan,tasks}.md`
- Modified: `app/checkout-modal.jsx`, `app/homepage/HomePage.js`, `themes/default/homepage.css`,
  `__tests__/components/CheckoutModal.test.jsx`, `__tests__/security-payment.test.js`,
  `tests/visual/lucky-reveal-selection.spec.ts`, `.specify/feature.json`,
  `memory-bank/activeContext.md`, `memory-bank/progress.md`, `PR_SUMMARY.md`

## Spec Kit

Specify → Plan → Tasks → Implement, one directory: `specs/086-restore-reveal-paywalls/`
(`spec.md`, `plan.md`, `tasks.md`). `.specify/feature.json` points there. The follow-up is recorded in the
same artifacts (Phase 6) rather than a duplicate feature directory.

## Verification

| Check | Result | Evidence |
|---|---|---|
| Focused suites | **PASS** | 3 files / 32 tests, exit 0 (`CheckoutModal`, `security-payment`, `stripe-product-alignment`). |
| Full suite | **PASS** | `pnpm exec vitest run` — 37 files / 397 tests, exit 0. |
| TypeScript | **PASS** | `pnpm exec tsc --noEmit` — exit 0 on a clean build. |
| Repository gate | **PASS** | `SPEC_KIT_BASE_REF=a635bdcc… ./freebuff-verify.sh` — exit 0 (Spec Kit, typecheck, build, refresh-docs 19/19). A first run failed only because stale `.next/types` referenced the deleted routes; clearing `.next` and rebuilding passed. |
| Build size | **PASS** | `.next` 301,016,019 B (287.1 MiB) + `public` 32,840,043 B = 333,856,062 B (318.4 MiB) < 495 MB. |
| Served output | **PASS** | No `GIFT_EMAIL_TEST_MODE`, `GiftEmailTestForm`, `test-tools/gift-email` or "Gift email test" in `.next/static`/`.next/server`; no such routes in `app-paths-manifest.json`. |
| Homepage smoke | **PASS** | `next start` port 3100: HTTP 200. |
| Gift test page | **PASS** | `/test-tools/gift-email` → **404**. |
| Gift test route | **PASS** | `POST /api/test-tools/gift-email` → **404**. |
| Legacy send route | **PASS** | `POST /api/send-gift` in production → **403** development-only. |
| Prices | **PASS** | Tests assert `unitAmount: 100` and `unitAmount: 199`; checkout route unmodified. |
| Browser popup | **PASS** | Chromium on this build: `previewButtons: 0`, `previewHooks: 0`, `previewNote: 0`, `paidButtons: 1`, `deliveryChoices: 4`. |
| Live Stripe charge | **NOT RUN** | No keys and no charge permitted; no checkout code changed. |
| Real Resend email | **NOT RUN** | Paid delivery code unchanged and covered by mocked tests; no send attempted. |
| PR-head CI | **PENDING** | Pushed; CI not observed in this session. |
| Owner review/merge | **PENDING** | PR left open and unmerged. |

## Preserved

Prices 100/199, one-time CAD payment, product names/descriptions/metadata, success/cancel callbacks,
server-side verification and persistence, paid gift delivery (session check, Redis lock, Resend), tip jar,
reveal presentation and paid-reveal counter. No dependency, lockfile, secret, environment, deployment,
database or `.docs/` change.

## Remaining issues and limitations

- No live Stripe checkout or real Resend send was executed here.
- `/api/send-gift` and `/reveal/[id]` remain development-only (403 verified); they are not public.
- A stale `.next` directory must be cleared when deleting routes, or generated route types fail the type
  check; the committed code builds cleanly from scratch.

## Final diff audit

Complete diff against `main` reviewed: **21 files — 10 modified, 3 added Spec Kit artifacts, 8 deleted**
(2 preview files and 6 gift-tool files). No secret, key or credential value appears. No checkout, Stripe
product/price, webhook, verification, gift delivery, Resend, database, dependency or deployment file is
modified.

**USEFUL RESULT: YES** — the preview and the gift email test tool are gone from source and served output,
both removed URLs return 404, prices remain 100/199, and the paid Stripe/email flow is untouched. Live
charge and real email remain unverified.
