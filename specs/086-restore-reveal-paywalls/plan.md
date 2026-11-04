# Implementation Plan: Restore the Lucky Reveal Paywalls

**Feature**: `specs/086-restore-reveal-paywalls`
**Branch**: `freebuff/restore-reveal-paywalls`

## Technical context

- Next.js App Router (16.4.3). The purchase popup is the client component `app/checkout-modal.jsx`,
  rendered by `app/homepage/HomePage.js`; both were extended by the free-preview feature 072.
- The free-preview switch lives in `app/test-tools/reveal-testing/revealTestConfig.js` and is read only
  by the modal.
- The gift email test tool (merged from PR #1703) exposes a public page and route gated by
  `GIFT_EMAIL_TEST_MODE` in `app/test-tools/gift-email/giftEmailTestConfig.js`.
- Stripe products, prices, callbacks, webhook, `/api/verify-session`, `/api/gift-delivery` and
  `app/gift-email.js` are unchanged.

## Constitution check

- Single source of truth: follows `AGENTS.md`; no second governance system.
- Verify before acting: the current branch base is `a635bdcc` (the merge of PR #1703). The preview was
  enabled (`REVEAL_TEST_MODE = true`) and the gift test switch was `true`, so both were live bypasses.
  Confirmed no other public switch generates a reveal.
- Spec Kit sequence: specify, plan and tasks are recorded under one feature directory, `086`.
- Protect core systems: no price, product, metadata, callback, webhook, verification, delivery, Resend,
  database, environment or dependency change. Removing a bypass strengthens, not weakens, payment
  enforcement.
- Resource conservation: `.docs/` is read-only and no MCP is used.

## Design

1. **Remove the preview implementation** — delete `app/test-tools/reveal-testing/` (switch helper and
   README), remove the `canPreviewReveal` import, the `onPreviewReveal` prop, the preview-button handler
   and the preview markup from `app/checkout-modal.jsx`, remove the `onPreviewReveal` wiring and the now
   unused `startLuckyReveal`/`createLuckyReveal` import from `app/homepage/HomePage.js`, and delete the
   preview CSS rules from `themes/default/homepage.css`.
2. **Disable the gift test tool** — set `GIFT_EMAIL_TEST_MODE = false` with a comment that enabling it
   re-creates a public payment bypass. The route already returns 404 and the page already hides the form
   when the switch is false. Update the page and README wording so they describe a disabled local tool,
   not an available public feature.
3. **Regression guards** — rewrite `__tests__/components/CheckoutModal.test.jsx` so every flow asserts the
   paid-only action and the absence of a preview. Update `__tests__/security-payment.test.js` to assert
   the preview module is gone, no preview wiring remains, the paid form still posts to `/api/checkout`,
   the gift test page/route are absent, and the dev-only legacy endpoint is still blocked outside
   development.
4. **Remove the disabled tool (follow-up, 2026-11-04)** — delete `app/test-tools/gift-email/` (page,
   client form, switch, README), `app/api/test-tools/gift-email/route.js` and
   `__tests__/gift-email-test-tool.test.js`. With the switch and route gone, the path cannot be
   re-enabled by editing a constant; the only gift email code left is the paid delivery in
   `app/gift-email.js`.
5. **Browser check** — update `tests/visual/lucky-reveal-selection.spec.ts`: assert the selection popup has
   no preview control, and drive the reveal popup through a mocked paid `verify-session` response instead
   of the removed preview.

## Files

- Deleted: `app/test-tools/reveal-testing/revealTestConfig.js`, `app/test-tools/reveal-testing/README.md`
- Updated: `app/checkout-modal.jsx`, `app/homepage/HomePage.js`, `themes/default/homepage.css`
- Deleted (follow-up): `app/test-tools/gift-email/{page.js,GiftEmailTestForm.jsx,giftEmailTestConfig.js,README.md}`,
  `app/api/test-tools/gift-email/route.js`, `__tests__/gift-email-test-tool.test.js`
- Updated: `__tests__/components/CheckoutModal.test.jsx`, `__tests__/security-payment.test.js`,
  `tests/visual/lucky-reveal-selection.spec.ts`
- Added: `specs/086-restore-reveal-paywalls/{spec,plan,tasks}.md`
- Updated: `.specify/feature.json`, `memory-bank/activeContext.md`, `memory-bank/progress.md`,
  `PR_SUMMARY.md`

## Alternatives rejected

- **Set `REVEAL_TEST_MODE = false` and keep the button code** — leaves a one-line switch and the preview
  implementation in the product; the task explicitly says remove the button. Deleting is unambiguous.
- **Hide the gift test page behind a secret** — the task requires disabling public bypasses and keeping
  the existing paid flow; a team secret still leaves a payment-free gift path. Shipping the compiled
  switch as `false` is simpler and fails closed.
- **Keep the gift test tool disabled** — superseded by the owner's follow-up: a disabled public bypass
  and its route still invite re-enabling. Removing the page, form, switch, route and test is final.
- **Change prices or Stripe configuration** — explicitly out of scope and already correct (100/199).
- **New dependency** — none needed.

## Verification

- Focused: `__tests__/components/CheckoutModal.test.jsx`, `__tests__/security-payment.test.js`,
  `__tests__/stripe-product-alignment.test.js`.
- Full `pnpm exec vitest run`, `pnpm exec tsc --noEmit`, `./freebuff-verify.sh`.
- Production build measured against the 495 MB maximum; search the build output for "Preview Reveal".
- Production smoke with `next start`: homepage 200, no preview string in the served HTML/chunks, gift test
  page and route 404, checkout route still prices 100/199.
- Optional browser probe of the popup if Chromium is available; otherwise report it as NOT RUN.
