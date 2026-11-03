# Implementation Plan: Gift Email Test Tool

**Feature**: `specs/085-gift-email-test-tool`
**Branch**: `freebuff/e6b5a381045c337886e3bec8`

## Technical context

- Next.js App Router (16.4.3) with a page under `app/test-tools/` and a `nodejs` route handler.
- Email: the existing `app/gift-email.js` `createGiftReveal()` and `sendGiftEmail()` functions, which
  already send through `https://api.resend.com/emails` with `RESEND_API_KEY` and `GIFT_FROM_EMAIL`.
- Validation: the existing `app/form-security.js` sanitisers and email check.
- Abuse boundary: the existing `app/spam-protection.js` `checkApiRateLimit()` plus an Origin check,
  following the repository's existing API-route conventions.
- No dependency, database, Stripe, environment-variable or deployment change.

## Constitution check

- Single source of truth: the change follows `AGENTS.md` and reuses repository helpers; it adds no second
  governance system.
- Verify before acting: the baseline was inspected before editing — the existing
  `/api/admin/test-gift-email` route requires `GIFT_TEST_SECRET`, which the task explicitly excludes.
- Implementation sequence: specification, plan and tasks artifacts are recorded before implementation
  validation; implementation is scoped to the files below.
- Protect core systems: Stripe checkout, prices, products, webhook, paid gift delivery, Resend credentials
  and the reveal paywall are not modified. No secret is added to the client.
- Resource conservation: no `.docs/` file is edited and no MCP is used.

## Design

1. **Switch** — `app/test-tools/gift-email/giftEmailTestConfig.js` exports `GIFT_EMAIL_TEST_MODE = true` and
   `isGiftEmailTestEnabled()`, mirroring the existing public-preview switch pattern. Off means the page
   hides the form and the route returns 404.
2. **Page** — `app/test-tools/gift-email/page.js` is a server component with `robots: noindex, nofollow`.
   It explains what the tool does, what it does not do, and the limits. It renders the client form only
   when the switch is on.
3. **Form** — `GiftEmailTestForm.jsx` posts JSON to the test route, disables the button while sending, and
   shows either a truthful error or the delivery result with the generated reveal. It reads no
   environment variable.
4. **Route** — `app/api/test-tools/gift-email/route.js` (POST, `runtime = 'nodejs'`, `force-dynamic`):
   - switch gate (404 when off), cross-site Origin rejection (403), per-address rate limit (5 per hour),
     and a clear 503 when the server Resend configuration is absent;
   - sanitises the recipient email/name, sender name and message with `app/form-security.js` to the same
     limits the paid checkout uses;
   - builds the reveal with `createGiftReveal()` and sends with the same `sendGiftEmail()` used by paid
     delivery, so no second email implementation exists;
   - returns `{ ok, deliveryStatus, recipientEmail, reveal }` with `Cache-Control: no-store`, and never
     returns credentials or the raw provider body.
5. **Documentation** — `app/test-tools/gift-email/README.md` records how to use and disable the tool and
   its safety boundary.
6. **Regression guard** — `__tests__/gift-email-test-tool.test.js` covers both games, validation, missing
   configuration, Resend failure, cross-site rejection, rate limiting, the disabled switch, and source
   guards for the absent test secret, the server-only credentials, and no Stripe/paywall change.

## Files

- Added: `app/test-tools/gift-email/giftEmailTestConfig.js`
- Added: `app/test-tools/gift-email/page.js`
- Added: `app/test-tools/gift-email/GiftEmailTestForm.jsx`
- Added: `app/test-tools/gift-email/README.md`
- Added: `app/api/test-tools/gift-email/route.js`
- Added: `__tests__/gift-email-test-tool.test.js`
- Added: `specs/085-gift-email-test-tool/{spec,plan,tasks}.md`
- Updated: `.specify/feature.json`, `memory-bank/activeContext.md`, `PR_SUMMARY.md`

## Alternatives rejected

- **Reusing `/api/admin/test-gift-email`** — it requires `GIFT_TEST_SECRET`, which the task explicitly
  says must not be needed. Weakening its authorization would change an existing admin endpoint and its
  meaning; a separate switch-gated test route preserves it.
- **Calling the paid `/api/checkout` or `/api/gift-delivery` with a fake session** — that would touch
  Stripe state and the paid delivery lock/idempotency path, which the task forbids.
- **New email template** — a test-specific template could not verify the real gift email. The existing
  `sendGiftEmail()` is reused unchanged.
- **Client-side Resend call** — would expose the API key in the browser.
- **A new dependency** — the form needs only `fetch` and React state.

## Verification

- Focused `__tests__/gift-email-test-tool.test.js`.
- Full `pnpm exec vitest run`, `pnpm exec tsc --noEmit`, `./freebuff-verify.sh`.
- Production build measured against the 495 MB hard maximum.
- A real Resend send is only possible where the server credentials exist; if they are absent in this
  workspace, that check is reported as NOT RUN rather than passed.
