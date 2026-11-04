# Feature Specification: Restore the Lucky Reveal Paywalls

**Feature Branch**: `freebuff/restore-reveal-paywalls`
**Created**: 2026-11-03
**Status**: Draft

**Input**: Restore the paywalls for Personal Reveal and Gift Reveal. Remove the free-preview button and
disable all public test-mode or payment-bypass paths that allow either reveal to be accessed without
completing the normal Stripe payment. Keep the existing prices unchanged: CAD $1.00 for Personal Reveal
and CAD $1.99 for Gift Reveal. Preserve the existing Stripe payment and gift-email setup.

**Follow-up (2026-11-04)**: remove the disabled gift email test tool and its route entirely, rather than
leaving a switch that could re-create the payment bypass.

## User Scenarios & Testing

### User Story 1 — The Personal Reveal requires a completed payment (Priority: P1)

A visitor opens the Lucky Reveal purchase popup. The only action is **Continue to secure checkout**,
which posts to `/api/checkout`. The reveal is generated only after `/api/verify-session` confirms a paid
Stripe Checkout session of type `lucky_pick`, and the website shows the server-verified reveal.

**Why this priority**: A free preview of the personal reveal removes the product's paywall and must not
exist on the public site.

**Independent Test**: Open the popup in a browser and confirm no free-preview control or explanatory
"no payment is taken" text exists; confirm the only reveal-starting request is the paid form post; and
confirm `/api/verify-session` still rejects an unpaid session with `402`.

**Acceptance Scenarios**:

1. **Given** any purchase surface, **When** the popup renders, **Then** it offers the paid checkout
   action and no free preview.
2. **Given** a visitor has not paid, **When** they request a reveal, **Then** no reveal is generated or
   shown by the site.
3. **Given** a paid `lucky_pick` session, **When** the success page verifies it, **Then** the persisted
   reveal is shown exactly as before.

---

### User Story 2 — The Gift Reveal requires a completed payment (Priority: P1)

A visitor can send the Gift Edition only by paying the normal CAD $1.99 Stripe Checkout. The gift
delivery route verifies the paid session before sending the email, and the reveal page accepts only a
verified `gift_package` session.

**Why this priority**: The gift reveal and its email are the paid product; any unauthenticated path that
generates or emails one without payment is a paywall bypass.

**Independent Test**: Confirm the gift test page and route do not exist and answer `404`; confirm
`/api/gift-delivery` still requires `payment_status === 'paid'` and `checkoutType === 'gift_package'`;
confirm no other public page or route generates a Gift Reveal.

**Acceptance Scenarios**:

1. **Given** the former gift email test tool, **When** the site is deployed, **Then** its page, client
   form, switch and route are absent and `/test-tools/gift-email` returns 404.
2. **Given** an unpaid or non-gift session, **When** it reaches gift delivery or verification, **Then** it
   is rejected.
3. **Given** a paid gift session, **When** delivery runs, **Then** the existing Resend send and
   idempotency behaviour are unchanged.

---

### User Story 3 — No public test switch can restore a bypass (Priority: P1)

The repository contains no public switch, helper, or button that launches either reveal without a paid
Stripe session. The only remaining test paths are local-only and blocked outside development.

**Why this priority**: A disabled button that can be re-enabled by a one-line constant is still a
governance risk, so the preview implementation is removed rather than hidden.

**Independent Test**: Assert the preview module is absent, the modal and homepage contain no preview
wiring, the compiled production output contains no "Preview Reveal" string, and the gift test page and
route are absent.

**Acceptance Scenarios**:

1. **Given** the source tree, **When** searching the purchase surfaces, **Then** no preview button,
   `canPreviewReveal`, `onPreviewReveal`, or preview CSS hook exists.
2. **Given** the production build, **When** searching the generated chunks, **Then** "Preview Reveal"
   does not appear.
3. **Given** the legacy `/api/send-gift` endpoint, **When** called outside development, **Then** it still
   returns 403.

### Edge Cases

- The tip jar keeps its own paid form and never gains a reveal control.
- The unified popup keeps both delivery choices, the 6/7 Pick choice, prices and recipient fields.
- Removing the preview must not change the paid submit guard, callbacks, metadata, or success URLs.
- The gift test page and route are removed entirely; no test form, switch or endpoint remains.

## Requirements

### Functional Requirements

- **FR-001**: No purchase surface MUST render a free-preview button, note, or preview styling hook.
- **FR-002**: No public switch, helper, page, or route MUST generate a Personal or Gift Reveal without a
  paid Stripe Checkout session.
- **FR-003**: The gift-email test tool MUST be removed: its page, client form, switch, README and route
  MUST not exist, and `/test-tools/gift-email` and `POST /api/test-tools/gift-email` MUST return 404.
- **FR-004**: Personal Reveal MUST remain CAD $1.00 and Gift Reveal CAD $1.99, both one-time `payment` in
  CAD, with the existing product names, descriptions and metadata.
- **FR-005**: Stripe checkout, webhook, session verification, gift delivery, Resend configuration and the
  reveal presentation MUST remain functionally unchanged.
- **FR-006**: The paid success path MUST remain server-authoritative: a `payment=success` URL alone MUST
  NOT produce a reveal.
- **FR-007**: Tests MUST guard the absence of the preview, the removed gift test page and route, the
  unchanged prices, and the dev-only restriction of the legacy send endpoint.

### Key Entities

- **Paid checkout session**: a Stripe session with `payment_status = paid` and a `checkoutType` of
  `lucky_pick` or `gift_package`.
- **Reveal**: the server-generated or stored numbers, lucky colour and lucky day for one paid session.

## Success Criteria

### Measurable Outcomes

- **SC-001**: Zero free-preview controls or preview strings exist in the purchase surfaces or the
  production build output.
- **SC-002**: The gift test page and route are absent, and requesting either returns 404.
- **SC-003**: Both prices remain 100 and 199 cents, and all existing payment/email tests pass.
- **SC-004**: The full test suite, type check, repository verification gate and production build pass, and
  the build stays below the 495 MB maximum.

## Assumptions

- The gift email test tool added in PR #1703 is merged but disabled; this follow-up removes it entirely
  (page, client form, switch, README, route and test), so no payment-free gift path can be re-enabled.
- The `/api/send-gift` endpoint and the `/reveal/[id]` development fallback are already restricted to
  `NODE_ENV === 'development'` and are not publicly reachable; they are left in place and covered by a
  guard test.
- No Stripe dashboard, product, price, webhook, secret, or environment change is required.
