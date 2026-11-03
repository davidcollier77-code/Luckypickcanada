# Feature Specification: Paid Lucky Reveal Counter and Reveal Popup Map CTA Removal

**Feature Branch**: `freebuff/7b6750b84aced857e5b48588`
**Created**: 2026-11-03
**Status**: Draft

**Input**: Remove the "Add me to the Little Luck Map" button from the Lucky Reveal popup. Replace the
reserved empty homepage slot below the Lucky Reveal card and above the Tip Jar with a premium neon-gold
counter displaying "LUCKY REVEALS CREATED TO DATE", starting at zero. Increase the counter once for each
successfully completed paid Personal Reveal ($1.00) or Gift Reveal ($1.99) purchase, with duplicate
counting prevented. Preserve existing payment, gift-email, reveal and map functionality.

## User Scenarios & Testing

### User Story 1 — The homepage shows how many paid reveals have been created (Priority: P1)

A visitor scrolls past the Lucky Reveal card and, before the Tip Jar, sees a premium neon-gold counter
labelled "LUCKY REVEALS CREATED TO DATE" with a large number. Before any counted purchase the number is
zero, and it reflects the real total as purchases complete.

**Why this priority**: The counter is the visible outcome the owner asked for; without it the task has no
user-facing result.

**Independent Test**: Load the homepage with a known stored total and confirm the counter sits between the
reveal section and the Tip Jar, shows the exact label and the formatted total; load it with no stored rows
and confirm it shows 0.

**Acceptance Scenarios**:

1. **Given** no paid reveal has been recorded, **When** the homepage renders, **Then** the counter shows
   "LUCKY REVEALS CREATED TO DATE" and 0.
2. **Given** a stored total of 4,321 paid reveals, **When** the homepage loads, **Then** the counter shows
   4,321 in the premium neon-gold treatment.
3. **Given** a visitor at a narrow viewport, **When** the homepage renders, **Then** the counter stays
   centred without horizontal overflow, and with reduced motion preferred it holds still.

---

### User Story 2 — Each completed paid reveal is counted exactly once (Priority: P1)

When a customer completes a Personal Reveal (CAD $1.00) or Gift Reveal (CAD $1.99) purchase, the public
total increases by exactly one. Reloading the success page, retrying verification, or a repeated payment
notification for the same purchase never increases it again.

**Why this priority**: A social-proof number is only meaningful if it is accurate and cannot be inflated
by refreshes or replayed notifications.

**Independent Test**: Drive the paid-completion paths with the same purchase identifier repeatedly and
confirm one increment; drive tips, free previews, cancelled and unpaid checkouts and confirm no increment.

**Acceptance Scenarios**:

1. **Given** a paid Personal Reveal purchase, **When** its payment is verified, **Then** the total
   increases by one.
2. **Given** a paid Gift Reveal purchase, **When** its payment is verified, **Then** the total increases
   by one.
3. **Given** the same purchase is verified again or its completion notification is repeated, **When** the
   system processes it, **Then** the total is unchanged.
4. **Given** a Tip Jar payment, a free preview, a cancelled checkout or an unpaid session, **When** it is
   processed, **Then** the total is unchanged.

---

### User Story 3 — The reveal popup no longer offers the map invitation (Priority: P2)

A customer who completes a reveal sees the same reveal, numbers, lucky colour, lucky day, sharing control
and close control, but the popup no longer shows the "Add me to the Little Luck Map" button.

**Why this priority**: It is the removal the owner requested alongside the new counter and keeps the
popup focused on the reveal and sharing.

**Independent Test**: Open the paid reveal popup and confirm the map invitation and its pressed/hover
styling are absent while every remaining control still works.

**Acceptance Scenarios**:

1. **Given** a completed reveal, **When** the popup opens, **Then** no "Add me to the Little Luck Map"
   control is rendered.
2. **Given** the same popup, **When** the customer uses it, **Then** the reveal content, sharing control,
   close control, Escape handling, sound and celebration behave as before.

---

### Edge Cases

- The same payment is reported by both the completion notification and the success-page verification: the
  total must increase once.
- A customer pays but never returns to the success page: the purchase is still counted once its payment is
  confirmed as paid.
- The counter store is unavailable or unconfigured: the homepage still renders and shows 0; no purchase
  path fails because counting is unavailable.
- The stored total is absent, malformed or negative: the counter shows 0 rather than an invalid value.
- Existing historical reveals from before this counter: they are not backfilled, so the counter starts at
  zero as requested.

## Requirements

### Functional Requirements

- **FR-001**: The Lucky Reveal popup MUST NOT render the "Add me to the Little Luck Map" control or any
  styling that exists only for it.
- **FR-002**: The homepage MUST render a premium neon-gold counter labelled exactly
  "LUCKY REVEALS CREATED TO DATE" in the position previously reserved directly below the Lucky Reveal
  section and above the Tip Jar section.
- **FR-003**: The counter MUST display 0 when no paid reveal has been recorded.
- **FR-004**: The counter MUST increase by exactly one for each successfully completed paid Personal
  Reveal (CAD $1.00) purchase and each successfully completed paid Gift Reveal (CAD $1.99) purchase.
- **FR-005**: The counter MUST NOT increase more than once for the same purchase, regardless of repeated
  verification, reloads or repeated payment notifications.
- **FR-006**: The counter MUST NOT increase for tips, free previews, cancelled checkouts, failed payments
  or unpaid sessions.
- **FR-007**: A failure or absence of the counter store MUST NOT break checkout, payment verification,
  gift delivery, the reveal or the homepage; the counter degrades to 0.
- **FR-008**: The counter number MUST be readable as a number to assistive technology and MUST respect
  `prefers-reduced-motion` for any animation.
- **FR-009**: Existing payment, gift-email delivery, reveal presentation/sound/sharing, and Little Luck Map
  functionality MUST be preserved, including prices, metadata, callbacks, safeguards and routes.

### Key Entities

- **Counted paid reveal**: One successfully paid reveal purchase, identified by its checkout session,
  recorded once with the purchase type (Personal or Gift). It is the unit the public total counts.
- **Public reveal total**: The number of recorded paid reveals, displayed on the homepage. Empty means 0.

## Success Criteria

### Measurable Outcomes

- **SC-001**: The homepage shows the exact label and a numeric total that matches the stored count in 100%
  of loads, including the zero state before any counted purchase.
- **SC-002**: Replaying the same purchase completion 10 times increases the total by exactly 1.
- **SC-003**: 0 increments occur for tips, free previews, cancelled checkouts and unpaid sessions.
- **SC-004**: The reveal popup renders 0 map invitations while every previously shipped control remains
  present and usable.
- **SC-005**: All existing automated checks for payment, gift email, reveal and map behaviour continue to
  pass, and the production build stays below the 495 MB maximum.

## Assumptions

- The counter launches at zero; historical purchases made before this feature are deliberately not
  backfilled, as the request specifies a starting value of zero.
- A purchase is "successfully completed" when the existing server-side payment verification or the
  payment provider's completion notification confirms the session is paid and is a Personal or Gift
  Reveal product.
- The counter is a public, read-only display; no customer identity or location data is collected for it.
- The existing data store used for Lucky Reveal persistence is the appropriate place to record counted
  purchases.
