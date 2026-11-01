# Feature Specification: Free Preview Reveal in the Checkout Modals

**Feature Branch**: `freebuff/a593ca30d6b549f6e9249fcc`

**Created**: 2026-11-01

**Status**: Implemented — verification recorded in the PR report

**Input**: Add a separate free Preview Reveal button to both the Lucky Pick and Gift checkout
modals, without changing the paid checkout flow.

## Context (verified before design)

- `app/checkout-modal.jsx` renders one paid form (`action="/api/checkout"`, `method="post"`) for the
  `lucky_pick`, `gift_package`, and `tip` modal types.
- `app/test-tools/reveal-testing/revealTestConfig.js` exported `REVEAL_TEST_MODE = false` plus
  `canBypassRevealPayment()`, which `app/checkout-modal.jsx` used to intercept the form submit, and,
  for gifts, to `POST /api/send-gift` before opening the reveal. That interception is exactly the
  behaviour the task forbids for previews.
- `app/homepage/HomePage.js` already owns the reveal state: `startLuckyReveal(game)` builds a reveal
  with the existing `createLuckyReveal()` helper and renders the existing
  `LuckyRevealPopup` (`app/lucky-reveal-popup.js`), which is unchanged.
- The tip jar is the third `CheckoutModal` type and must stay preview-free.

## User Scenarios & Testing

### User Story 1 — Preview a Lucky Pick reveal for free (Priority: P1)

A visitor opens the $1 Lucky Pick modal, chooses 6 Pick or 7 Pick, and presses
**Preview Reveal — FREE**. The modal closes and the existing reveal animation plays for that game,
with no payment, Stripe session, checkout submission, email, or login.

**Independent Test**: A component test renders the Lucky Pick modal and asserts that pressing the
preview button calls the preview handler with the selected game and performs no `fetch`, while the
paid button and form remain present and untouched.

**Acceptance Scenarios**:

1. **Given** the preview switch is on, **When** the Lucky Pick modal opens, **Then** both
   **Continue to secure checkout** and **Preview Reveal — FREE** are present with an explanation that
   previews send no emails.
2. **Given** 6 Pick is selected, **When** the preview button is pressed, **Then** the reveal opens
   for 6 Pick.
3. **Given** 7 Pick is selected, **When** the preview button is pressed, **Then** the reveal opens
   for 7 Pick.
4. **Given** a preview is pressed, **Then** the checkout form is not submitted, no Stripe session is
   created, no payment is taken, and no email is sent.

### User Story 2 — Preview a Gift reveal for free (Priority: P1)

A visitor opens the $2.99 Gift modal and previews the reveal without entering recipient details,
without sending a gift email, and without paying.

**Independent Test**: A component test renders the Gift modal, presses the preview button while the
required recipient fields are empty, and asserts the handler receives the gift type and no request is
made.

**Acceptance Scenarios**:

1. **Given** the Gift modal is open with empty recipient fields, **When** the preview button is
   pressed, **Then** the reveal opens and no validation blocks it.
2. **Given** a gift preview, **Then** `/api/send-gift` is never called.

### User Story 3 — Disable previews and keep paid checkout exactly as before (Priority: P1)

The owner sets `REVEAL_TEST_MODE` to `false`; the preview buttons disappear. The paid
**Continue to secure checkout** button posts to `/api/checkout` in both switch states.

**Independent Test**: A component test flips the switch off, asserts the preview button and its note
are absent, and asserts the paid submit still triggers the existing submitting state.

**Acceptance Scenarios**:

1. **Given** the switch is off, **Then** no preview button or preview note is rendered for either
   eligible type.
2. **Given** either switch state, **When** the paid form is submitted, **Then** the existing
   `/api/checkout` POST happens with the unchanged duplicate-submit guard.
3. **Given** the tip jar modal, **Then** there is no preview button and tip payments are unchanged.

### Edge Cases

- Pressing the preview must not require valid recipient details; it is outside the form, so native
  `required` validation cannot block it.
- Preview must not reuse the paid reveal persistence or verification routes.
- Duplicate-submit protection and the 8-second submitting reset stay on the paid path only.
- Keyboard and focus behaviour: the preview is a normal focusable button with the site's existing
  focus-visible outline; nothing about the reveal animation, artwork, or reduced-motion handling
  changes.

## Requirements

- **FR-001**: The Lucky Pick and Gift modals MUST each render a separate **Preview Reveal — FREE**
  button when previews are enabled.
- **FR-002**: The preview button MUST be `type="button"`, outside the checkout `<form>`, and MUST NOT
  submit the form, open `/api/checkout`, create a Stripe session, take payment, call
  `/api/send-gift`, send email, or write to the database.
- **FR-003**: The preview MUST open the existing reveal animation for the selected 6 Pick or 7 Pick
  game.
- **FR-004**: `REVEAL_TEST_MODE` MUST be the single on/off switch; `false` MUST hide the preview
  button and its explanation.
- **FR-005**: The preview MUST be available to public visitors with no login requirement.
- **FR-006**: The tip jar MUST NOT expose a preview button, and tip payments MUST be unchanged.
- **FR-007**: The paid **Continue to secure checkout** flow MUST behave exactly as before in both
  switch states, including its `/api/checkout` submission and duplicate-submit guard.
- **FR-008**: Existing artwork, animations, copy outside the added button/explanation, and layout
  MUST remain unchanged.
- **FR-009**: The preview README and tests MUST document and verify the switch and the behaviour.

## Success Criteria

- **SC-001**: Component tests prove preview works for both eligible flows and both game sizes, makes
  no network request, is absent on the tip jar, and disappears when the switch is off.
- **SC-002**: A component test proves the paid submit still runs and never calls the preview handler.
- **SC-003**: No Stripe, verification, gift-delivery, database, secret, or deployment file changes.
- **SC-004**: `./freebuff-verify.sh` passes and the production build stays under the 495 MB maximum.

## Assumptions and Limits

- Previews are generated in the browser by the existing `createLuckyReveal()` helper; they are not
  persisted paid reveal records, which is why no database or API call is involved.
- Enabling `REVEAL_TEST_MODE` for this task makes the preview button publicly visible; the paid
  checkout and its security controls are unchanged.
- Browser verification on 2026-11-01 (Playwright, local dev server) confirmed FR-001 to FR-006 and
  FR-008 with 22/22 checks; screenshots and the report are in `artifacts/`. The reveal panel's existing
  paid "PAYMENT COMPLETE" eyebrow is still shown during a preview: changing it would exceed FR-008, so
  it is recorded as an open product decision rather than an implemented change.


## Follow-up — production visibility correction (2026-11-01)

The first production check found that the preview helper was still gated by
`process.env.NODE_ENV !== 'production'`. This made the button available in local development but
hidden on the deployed production site, despite the feature requirement that public visitors can use
it while the owner switch is enabled. The temporary production setting must be explicit:
`REVEAL_TEST_MODE = true` shows the two permitted preview buttons in production as well as development;
setting it to `false` hides them. The preview remains separate from the paid form and no payment,
gift-delivery, email, database, or tip-jar behavior is changed.
