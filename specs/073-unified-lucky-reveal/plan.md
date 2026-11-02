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
  Request explicitly authorizes this task's payment/email safeguards. Stripe product **display
  name/description strings** in `checkoutOptions` change, and the Gift Edition `unitAmount` is
  realigned 299 → 199 under the owner's follow-on Stripe alignment request ("Lucky Pick Gift — CAD
  $1.99"), together with the single matching `amount_total` guard in `validateGiftSession` so no
  paid gift can be refused. `metadata`, `success_url`, `cancel_url`, webhook handling, and all other
  delivery code paths keep their behaviour. No schema, secret, or environment change.
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
  Edition" with an explicit email statement; amounts become the official 100/199, and metadata and
  callbacks are unchanged. The Tip Jar keeps `unitAmount: tipAmount` with its CAD-entered amount and
  its $0.50 minimum, and its Stripe product name becomes "Tip Jar".
- `app/checkout-modal.jsx`: type copy states the difference at the point of purchase.
- `app/homepage/HomePage.js`: both offer cards share structure and copy that states what each
  includes; reveal construction moves to `buildLuckyReveal`.

### Checkout labels and the dead route file (2026-11-02 follow-up)

- `app/api/checkout/route.js`: only `product_data.name` changes — "Lucky Pick", "Lucky Pick Gift",
  and the already-correct "Tip Jar". The website keeps "Lucky Reveal". Amounts (100/199), `cad`,
  `mode: 'payment'`, metadata, callbacks and the gift-delivery guard are all untouched.
- `app/api/verify-session/route.js` (0 bytes, tracked) is deleted. `route.ts` is the only
  implementation: the previous build's `.next/server/app/api/verify-session/route.js` contained
  route.ts's own strings, and the file's history contains two commits that intended to remove the
  duplicate placeholder. A test now asserts the endpoint has exactly one route module.

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
- New `__tests__/stripe-product-alignment.test.js`: the three products' names and prices, `cad`
  currency, the single `mode: 'payment'` session creation, absence of subscription/recurring/price-ID
  usage, a customer-entered Tip Jar amount, and agreement between the checkout price and the gift
  `amount_total` guard.

**Post-design Constitution re-check**: PASS — the change stays inside the reveal/purchase-option
scope, adds no dependency, and preserves every existing safeguard.

### Customer-facing consolidation (2026-11-02)

- `app/homepage/HomePage.js`: the two offer cards collapse into one `homepage-offer-featured` card
  labelled **Lucky Reveal** with a single **Choose a Lucky Pick** button. The gift artwork is
  kept (it is not deleted) and the card states both delivery options and their prices. The removed
  handler pair becomes `openLuckyRevealCheckout`, which opens the popup with the new
  `lucky_reveal` type.
- `app/checkout-modal.jsx`: a new `lucky_reveal` mode owns the two choices. The existing game
  fieldset stays; a delivery fieldset carries `Personal Reveal — CAD $1.00` and
  `Gift Reveal — CAD $1.99` and resolves into the hidden `checkoutType`, so the paid form still
  posts `lucky_pick` or `gift_package` exactly as `/api/checkout` expects. Recipient fields render
  only when the resolved type is `gift_package`; the modal repeats the selected amount for
  confirmation. The direct `lucky_pick`, `gift_package`, and `tip` modes are unchanged.
- `app/test-tools/reveal-testing/revealTestConfig.js`: `lucky_reveal` joins the preview allowlist, so
  the free preview stays available without touching the paid path.
- `themes/default/homepage.css`: delivery-option styling plus a desktop rule keeping the single
  card's copy clear of the decorative artwork. The reserved map slot is zero-height.
- Reserved map location: `<div id="lucky-map" className="homepage-map-slot" aria-hidden="true" />`
  sits directly below the reveal section and above the Tip Jar. No map component, geolocation, IP
  lookup, province detection, schema, or location data is added.
- Browser verification: `tests/visual/lucky-reveal-selection.spec.ts` proves the single card, the
  reserved slot's position and emptiness, all four purchase combinations through an intercepted
  `/api/checkout` POST, keyboard selection, and reduced motion on desktop and both mobile
  viewports. `tests/visual/gold-cta.spec.ts` moves from nine to eight homepage gold CTAs because the
  merged card removes one button.
