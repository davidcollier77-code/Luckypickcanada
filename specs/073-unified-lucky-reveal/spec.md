# Feature Specification: Unified Lucky Reveal Experience

**Feature Branch**: `freebuff/a4e5adf82c1dee56b92ed6ee`

**Created**: 2026-11-02

**Status**: Implemented — verification recorded in the PR report

**Input**: Consolidate the two paid Lucky Reveal experiences into one shared reveal system with two
purchase options: **Lucky Reveal** (results on the website, no email) and **Lucky Reveal Gift Edition**
(the same results, also delivered by email).

## Context (verified before design)

- Standard reveal: `app/api/checkout/route.js` option `lucky_pick` at `unitAmount: 100` (CAD $1.00) →
  `success_url /?payment=success&session_id=…`; `app/homepage/HomePage.js` verifies the session and
  renders `app/lucky-reveal-popup.js`. No email is involved anywhere on this path.
- Gift reveal: option `gift_package` at `unitAmount: 299` (CAD $2.99) → `success_url
  /api/gift-delivery?session_id=…`; `app/gift-email.js` generates and emails the reveal and
  `app/api/gift-delivery/route.js` redirects to `/reveal/<sessionId>`, which also renders
  `app/lucky-reveal-popup.js`.
- **Price discrepancy:** the work request labels the standard option "$1.99", but the repository
  charges `unitAmount: 100` (CAD $1.00) and the homepage advertises "CAD $1". Changing a live price
  is explicitly forbidden by the request and by `AGENTS.md` §5, so the existing $1.00 price is
  preserved and the discrepancy is reported rather than silently "fixed".
- Duplicated reveal logic found and measured:
  - `app/gift-email.js` re-implemented `generateNumbers`, the colour/day arrays, and `pickOne`, and
    `createGiftReveal` re-implemented `createLuckyReveal` behind a different result shape.
  - `app/homepage/HomePage.js` and `app/reveal/[revealId]/page.tsx` each mapped server data into the
    popup shape by hand, and the reveal page also carried a third reveal generator
    (`createRevealFromId`) plus its own copy of the colour/day vocabulary.
  - `app/reveal/[revealId]/page.tsx` fell back to a locally fabricated reveal for a gift session
    whose stored numbers were missing, so the website could show results that were never emailed.
- Existing email safeguards already exist and must be preserved: Stripe webhook gating on
  `checkoutType === 'gift_package'`, `validateGiftSession` requiring `payment_status: 'paid'`,
  `checkoutType`, `amount_total: 299`, `currency: 'cad'`, a Redis `SET NX` delivery lock with an
  ownership token, `giftDeliveredAt` idempotency, a persisted pending payload, a stable Resend
  `Idempotency-Key` of `gift-<sessionId>`, and a 23-hour retry window.

## User Scenarios & Testing

### User Story 1 — Buy a Lucky Reveal and see the results on the website (Priority: P1)

A visitor chooses **Lucky Reveal**, pays, and the complete reveal (numbers, lucky color, lucky day)
appears on the website with the existing animation. No email is sent.

**Independent Test**: The checkout option table still exposes `lucky_pick` at 100 cents and its
success callback is unchanged; the homepage maps the verified reveal through the shared mapper; the
gift delivery function refuses this session without calling Resend.

**Acceptance Scenarios**:

1. **Given** the standard option, **When** checkout completes, **Then** the homepage shows the
   server-verified reveal.
2. **Given** a paid standard session, **When** gift delivery is invoked, **Then** it fails closed and
   no email request is made.
3. **Given** the standard option, **Then** the customer copy states that no email delivery is
   included.

### User Story 2 — Buy the Gift Edition and receive the identical reveal by email (Priority: P1)

A visitor chooses **Lucky Reveal Gift Edition**, pays, the same reveal is emailed, and the purchaser
sees the same results on the website.

**Independent Test**: `createGiftReveal` returns the output of the shared `createLuckyReveal`
generator, and its numbers validate through the shared popup mapper.

**Acceptance Scenarios**:

1. **Given** the Gift Edition, **When** checkout completes, **Then** the existing webhook or
   gift-delivery path emails the persisted reveal exactly once.
2. **Given** the Gift Edition, **Then** the website renders the same numbers, color, and day as the
   email.
3. **Given** a repeated webhook, **Then** `giftDeliveredAt` and the stable idempotency key prevent a
   second email.

### User Story 3 — See one clear choice between the two options (Priority: P2)

A visitor sees two visually consistent options with the labels **Lucky Reveal** and
**Lucky Reveal Gift Edition**, including a plain statement of what each includes.

**Independent Test**: Homepage and modal copy contain both labels and say that only the Gift Edition
includes email delivery.

**Acceptance Scenarios**:

1. **Given** the homepage, **Then** both options share the same card structure and state their
   difference.
2. **Given** the modal, **Then** the description for each type states whether email delivery is
   included.
3. **Given** the Stripe checkout page, **Then** the product name and description match the chosen
   option.

### Edge Cases

- A reveal whose stored numbers are missing, duplicated, or out of range must not be replaced with a
  fabricated pick; the website reports that the reveal could not be verified.
- The gift banner must only claim delivery when the server reports `giftDeliveredAt`.
- The tip jar keeps its own copy and never gains reveal purchase options or email delivery.
- The reveal animation, reduced-motion handling, and artwork remain untouched.

## Requirements

- **FR-001**: A single module MUST own reveal generation, the lucky colour/day vocabulary, and the
  mapping into the popup shape.
- **FR-002**: The Gift Edition MUST generate its reveal through that same module, without a second
  random generator or duplicated vocabulary.
- **FR-003**: Both purchase options MUST present results through the shared mapping, and a reveal
  whose numbers cannot be validated MUST NOT be replaced with locally generated results.
- **FR-004**: The customer-facing labels MUST be **Lucky Reveal** and **Lucky Reveal Gift Edition**,
  and each MUST state whether email delivery is included.
- **FR-005**: The standard option MUST NOT trigger gift email delivery, and must fail closed if gift
  delivery is invoked for it.
- **FR-006**: The Gift Edition MUST continue to send the purchased reveal through the existing email
  delivery system with its existing safeguards.
- **FR-007**: Purchase prices and checkout callbacks MUST remain unchanged.
- **FR-008**: The reveal animation, artwork, layout of the surrounding site, and unrelated homepage
  features MUST remain unchanged.

## Success Criteria

- **SC-001**: Automated tests prove both options share one generator and one presentation mapping.
- **SC-002**: Automated tests prove a standard-price session cannot send a gift email.
- **SC-003**: Automated tests prove prices, callbacks, and both labels are intact.
- **SC-004**: The existing gift delivery suite still passes, and `./freebuff-verify.sh` passes with a
  production build under the 495 MB maximum.

## Assumptions and Limits

- The published standard price is CAD $1.00, not $1.99. The price is preserved; changing it needs
  separate owner authorization.
- The Gift Edition keeps its own post-purchase landing route (`/reveal/<sessionId>`) because that
  route is part of the existing gift-delivery handshake; both routes render the same reveal component
  with the same validated data shape.
- No Stripe product, price ID, webhook, database schema, or environment variable is added.
