# Implementation Plan: Unified Lucky Reveal Experience

**Feature**: `specs/073-unified-lucky-reveal`

**Branch**: `freebuff/a4e5adf82c1dee56b92ed6ee`

## Technical Context

- **Stack**: existing Next.js App Router, React, Stripe Checkout, Resend, Upstash Redis. No new
  dependency, route, or configuration.
- **Existing pieces reused**: `app/lucky-reveal.js` (generator), `app/lucky-reveal-popup.js`
  (presentation, unchanged), `app/gift-email.js` (delivery safeguards), `app/api/checkout/route.js`
  (single checkout entry point), `app/api/verify-session/route.ts` (server verification).
- **Unknowns**: none requiring research; all decisions are internal refactors of verified code.

## Constitution Check

- **I. Single Source of Truth** — no governance file is touched; `AGENTS.md` remains authoritative.
- **II. Verify Before Acting** — the duplicated generators and the price discrepancy were read from
  source before planning.
- **III. Implementation Sequence** — inspect, plan (this file), implement, test, diff audit, report.
- **IV. Protect Core Systems** — Stripe and Resend are **inspected and preserved**. The Master Work
  Request explicitly authorizes this task's payment/email safeguards. Only Stripe product
  **display name/description strings** in `checkoutOptions` change; `unitAmount`, `metadata`,
  `success_url`, `cancel_url`, webhook handling, and all delivery code paths keep their behaviour.
  No schema, secret, or environment change.
- **V. Resource Conservation** — no MCP, no dependency, no documentation refresh; `.docs/` untouched.

**Gate result**: PASS with the payment section scoped as above and recorded in the PR report.

## Phase 0 — Research

No material unknown required research. The routing documents listed in `.docs/manifest.json` for the
`creation` group cover libraries this change does not touch (no new React/Next/Tailwind pattern, no
Gemini API call), so no library snapshot was needed. Existing repository code was the source of truth.

## Phase 1 — Design

### Single source of truth for reveal content (`app/lucky-reveal.js`)

- Exports `LUCKY_COLORS`, `LUCKY_DAYS`, `normalizeLuckyPickGame`, `generateLuckyNumbers`,
  `createLuckyReveal`, `hasValidLuckyNumbers`, `buildLuckyReveal`.
- `buildLuckyReveal` is the only mapping from stored/verified data into the popup shape and returns
  `null` when the numbers cannot be trusted rather than inventing a result.

### Gift delivery (`app/gift-email.js`)

- Removes the local `generateNumbers`, `pickOne`, `luckyColors`, `luckyDays`.
- `createGiftReveal` now derives from `createLuckyReveal` and only renames the game label for the
  email body. All locking, idempotency, pending-payload, and retry-window safeguards are untouched.

### Purchase options and copy

- `app/api/checkout/route.js`: option names/descriptions become "Lucky Reveal" and "Lucky Reveal Gift
  Edition" with an explicit email statement; amounts (100/299), metadata, and callbacks unchanged.
- `app/checkout-modal.jsx`: type copy states the difference at the point of purchase.
- `app/homepage/HomePage.js`: both offer cards share structure and copy that states what each
  includes; reveal construction moves to `buildLuckyReveal`.

### Results presentation (`app/reveal/[revealId]/page.tsx`)

- Uses the shared vocabulary and `buildLuckyReveal`.
- Removes the fabricated-reveal fallback for paid sessions; an unverifiable reveal now reports that it
  could not be verified.
- The gift banner is driven by the server-reported `giftDeliveredAt`, not by a URL parameter.

### Tests

- New `__tests__/lucky-reveal-shared.test.js`: generator rules, mapping validation, Gift Edition
  reuse, and source guards against a second generator/vocabulary.
- `__tests__/gift-email-error-handling.test.js`: standard-price and standard-type sessions never
  reach Resend.
- `__tests__/security-payment.test.js`: prices, callbacks, labels, and email statements.

**Post-design Constitution re-check**: PASS — the change stays inside the reveal/purchase-option
scope, adds no dependency, and preserves every existing safeguard.
