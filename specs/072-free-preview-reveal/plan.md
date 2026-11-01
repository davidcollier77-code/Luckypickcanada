# Implementation Plan: Free Preview Reveal in the Checkout Modals

**Branch**: `freebuff/a593ca30d6b549f6e9249fcc` | **Date**: 2026-11-01 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/072-free-preview-reveal/spec.md`

## Summary

Turn `REVEAL_TEST_MODE` into a preview-only switch and add a `type="button"` preview control outside
the checkout form in the Lucky Pick and Gift modals. Remove the old form-submit interception (which
also called `/api/send-gift`), so the paid `/api/checkout` POST runs exactly as before in both switch
states. The preview reuses the homepage's existing reveal state and `LuckyRevealPopup`.

## Technical Context

**Language/Version**: JavaScript / React 19, Next.js 16.4.3 App Router, Node.js 22 target.

**Primary Dependencies**: none added. Existing `createLuckyReveal()` (`app/lucky-reveal.js`) and
`LuckyRevealPopup` (`app/lucky-reveal-popup.js`) are reused unchanged.

**Storage**: none. Previews are not persisted.

**Target Platform**: Next.js client components, deployed to Cloudflare Workers via OpenNext.

**Constraints**: no change to Stripe, verification, gift delivery, database, secrets, deployment,
artwork, animations, or the tip jar. Public previews require no authentication.

**Scale/Scope**: one config helper, one modal component, one homepage prop rename, a small secondary
button style, one component test file, one updated security test, and the preview README.

## Constitution Check

- **Single source of truth**: `AGENTS.md` followed; one task group, one feature directory.
- **Verify before acting**: the existing test-mode bypass, its `/api/send-gift` call, the homepage
  reveal wiring, and the tip modal share the same component and were inspected before editing.
- **Protect core systems**: payment routes, verification, email delivery, database, secrets, and
  deployment are untouched. The preview cannot submit the form because it is a button outside the
  form with `type="button"`.
- **Testing**: component-level tests plus the existing security test, then the repository gate.
- **Result**: PASS — the change removes a payment bypass rather than weakening one.

## Phase 0: Research

- The paid path is a plain HTML form POST to `/api/checkout`; React only guards duplicate submits.
  Restoring that handler verbatim (minus the test-mode branch) is the smallest way to guarantee
  unchanged paid behaviour.
- The homepage already closes the checkout modal and calls `startLuckyReveal(game)`, so the preview
  only needs the same callback with a different prop name.
- `canBypassRevealPayment()` existed solely to enable the interception; it is replaced by
  `canPreviewReveal(type)`, which is also false for `tip` so the tip jar can never gain a preview.

## Phase 1: Implementation Design

1. `app/test-tools/reveal-testing/revealTestConfig.js`: export `REVEAL_TEST_MODE = true` and
   `canPreviewReveal(revealType)` limited to `lucky_pick` and `gift_package`; delete
   `canBypassRevealPayment`.
2. `app/checkout-modal.jsx`: accept `onPreviewReveal`, render the preview button and the
   "no payment / no emails" note after `</form>`, and reduce `requestRevealAccess` to the original
   paid-only duplicate-submit guard.
3. `app/homepage/HomePage.js`: rename the modal prop to `onPreviewReveal`; it still closes the modal
   and calls `startLuckyReveal(luckyPickGame)`.
4. `themes/default/homepage.css`: add secondary preview button styles reusing existing brand colours,
   appended after the checkout-modal rules.
5. Delete the tracked stale backup `app/checkout-modal.jsx.orig`, which contained the removed
   `/api/send-gift` preview bypass.
6. Tests: new `__tests__/components/CheckoutModal.test.jsx`; update `__tests__/security-payment.test.js`
   for the new switch semantics and a source guard against preview routing.
7. Rewrite `app/test-tools/reveal-testing/README.md`.

## Project Structure

```text
app/
├── checkout-modal.jsx                         # preview button + unchanged paid form
├── homepage/HomePage.js                       # onPreviewReveal wiring
└── test-tools/reveal-testing/
    ├── revealTestConfig.js                    # REVEAL_TEST_MODE + canPreviewReveal
    └── README.md                              # accurate switch/behaviour documentation
themes/default/homepage.css                    # secondary preview button styling
__tests__/
├── components/CheckoutModal.test.jsx          # new preview/paid component coverage
└── security-payment.test.js                   # updated switch + source guard
specs/072-free-preview-reveal/
├── spec.md
├── plan.md
└── tasks.md
```

## Verification Evidence (Browser)

`artifacts/preview-reveal-check.cjs` drives the local dev server with Playwright at 1440x900 / DPR 2 and
records 22/22 passing checks: the preview control is visible and correctly labelled in both eligible
modals, is a `type="button"` outside the checkout form, is absent from the tip modal, keeps the paid
submit button in place, and pressing it opens `LuckyRevealPopup` with no request to `/api/checkout`,
`/api/send-gift`, or Stripe, no `submit` event, and no page navigation. Only one request follows the
press: the reveal popup's deferred JS chunk.

Screenshots: `artifacts/preview-reveal-{lucky-pick,gift,tip}-modal*.png` and
`artifacts/preview-reveal-*-reveal.png`; report: `artifacts/preview-reveal-report.json`.

Observed but intentionally unchanged: the reused reveal panel keeps its paid "PAYMENT COMPLETE"
eyebrow during a preview. It is misleading for a free preview, but changing it would exceed FR-008
(reveal design unchanged), so it is recorded as an open owner decision.

## Complexity Tracking

No constitution violations. No new dependency, route, API, environment variable, database change, or
architecture change. One existing prop is renamed and one stale tracked backup is removed.
