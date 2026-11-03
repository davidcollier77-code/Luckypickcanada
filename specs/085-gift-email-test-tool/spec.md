# Feature Specification: Gift Email Test Tool

**Feature Branch**: `freebuff/e6b5a381045c337886e3bec8`
**Created**: 2026-11-03
**Status**: Draft

**Input**: Create a simple webpage to test the Lucky Pick Canada gift email system. Allow entry of the
recipient's email, recipient name, sender name, optional gift message, and selection of a 6- or 7-number
Lucky Pick. Allow the gift reveal test to bypass the payment requirement and send the actual gift email
using the existing Resend configuration. Do not require API keys or a separate test secret. Keep the
regular Lucky Pick reveal paywall active and do not change the normal paid gift purchase process, Stripe
products, prices, or payment flow. Keep existing Resend credentials server-side.

## User Scenarios & Testing

### User Story 1 — Send a real gift email from a test page without paying (Priority: P1)

The owner opens a test page, enters a recipient email, recipient name, optional sender name and optional
gift message, chooses a Lucky Pick game, and submits. The page reports that Resend accepted the email and
shows the generated reveal that was emailed. No Stripe Checkout session is created and no payment is
taken.

**Why this priority**: Verifying that the gift reveal generates and that the gift email is actually sent
is the whole purpose of the task.

**Independent Test**: Submit the form with valid details and confirm the page reports success, the
request reached the Resend emails endpoint with the real configured sender and recipient, and the email
body contains the generated numbers, lucky colour, lucky day and gift message.

**Acceptance Scenarios**:

1. **Given** the test tool is enabled and the server has the existing Resend configuration, **When** the
   owner submits valid test details, **Then** one gift email is sent to the entered recipient and the page
   shows the delivery result and the generated reveal.
2. **Given** the server is missing the Resend configuration, **When** the owner submits the form, **Then**
   the page explains that gift email is not configured and sends nothing.
3. **Given** Resend rejects the email, **When** the request completes, **Then** the page shows a truthful
   failure and does not claim the email was sent.

---

### User Story 2 — Choose a 6 Pick or 7 Pick reveal (Priority: P1)

The owner can choose the 6-number game or the 7-number game. The emailed reveal and the on-page result
use the same rules as the paid Gift Edition: six unique numbers from 1–49, or seven unique numbers from
1–50.

**Why this priority**: The generated reveal is what the test exists to inspect, so it must match the paid
product's rules.

**Independent Test**: Send one 6 Pick and one 7 Pick test email and check the emailed numbers, game label,
lucky colour and lucky day against the game rules.

**Acceptance Scenarios**:

1. **Given** the 6 Pick option, **When** the email is sent, **Then** the reveal has six unique numbers
   between 1 and 49 and is labelled "6 Pick".
2. **Given** the 7 Pick option, **When** the email is sent, **Then** the reveal has seven unique numbers
   between 1 and 50 and is labelled "7 Pick".

---

### User Story 3 — Keep the paid flow, paywall and credentials safe (Priority: P1)

The normal paid Lucky Pick reveal and Gift Edition purchase remain unchanged. The test tool exposes no
Resend credential or test secret to the browser, rejects requests from other sites, limits repeated sends,
and can be switched off.

**Why this priority**: The tool deliberately skips payment, so it must not weaken the paid path or leak
the email provider's credentials.

**Independent Test**: Confirm the checkout routes, products and prices are untouched; inspect the browser
payload and page source for credentials; send from a foreign Origin and confirm rejection; exceed the
rate limit and confirm throttling; turn the switch off and confirm the page and route are unavailable.

**Acceptance Scenarios**:

1. **Given** a visitor uses the normal Lucky Pick or Gift Edition checkout, **When** they pay, **Then** the
   Stripe flow, prices and gift-email delivery behave exactly as before.
2. **Given** the test page, **When** the owner inspects the page and its network request, **Then** no API
   key, test secret or provider response body is exposed.
3. **Given** a request from another site or a repeated burst of sends, **When** it reaches the route,
   **Then** it is rejected or throttled.
4. **Given** `GIFT_EMAIL_TEST_MODE` is false, **When** the page or route is opened, **Then** the form is
   hidden and the route returns 404.

### Edge Cases

- An invalid recipient email is rejected before any Resend request.
- Whitespace and letter case in the recipient email are normalised the same way the paid checkout does.
- Over-long names and messages are truncated to the paid checkout's limits (80/80/500 characters).
- Missing recipient name or sender name falls back to the paid email's defaults ("Friend" and "Lucky Pick
  Canada").
- A Resend failure never reports success and never exposes the provider response to the browser.

## Requirements

### Functional Requirements

- **FR-001**: The system MUST provide a test page with fields for recipient email, recipient name, sender
  name, optional gift message, and a 6 Pick / 7 Pick choice.
- **FR-002**: Submitting the form MUST send the real Gift Edition email through the existing server-side
  Resend configuration without creating a Stripe Checkout session or taking a payment.
- **FR-003**: The test MUST require no API key and no separate test secret from the person using the page.
- **FR-004**: The page MUST show whether Resend accepted the email and MUST show the generated numbers,
  game, lucky colour and lucky day that were emailed.
- **FR-005**: The 6 Pick reveal MUST contain six unique numbers from 1–49; the 7 Pick reveal MUST contain
  seven unique numbers from 1–50.
- **FR-006**: The test MUST use the same reveal generator and the same email builder as the paid Gift
  Edition, so the tested artefact is the real one.
- **FR-007**: The system MUST keep `RESEND_API_KEY` and `GIFT_FROM_EMAIL` server-side and MUST NOT return
  them or the raw provider response to the browser.
- **FR-008**: The test route MUST reject cross-site browser requests and MUST limit repeated sends per
  address.
- **FR-009**: The test page and route MUST be switchable off without affecting the paid flow.
- **FR-010**: The normal paid Lucky Pick reveal, the Gift Edition purchase, the Stripe products, prices and
  payment flow, and the regular reveal paywall MUST remain unchanged.

### Key Entities

- **Gift test submission**: recipient email, recipient name, sender name, gift message, and Lucky Pick game.
- **Test result**: delivery status plus the generated game name, numbers, lucky colour and lucky day.

## Success Criteria

### Measurable Outcomes

- **SC-001**: A valid submission produces exactly one accepted Resend email request containing the entered
  recipient, subject and message.
- **SC-002**: Both game choices produce a complete, unique, in-range reveal that matches the emailed body.
- **SC-003**: Zero credentials or test secrets appear in the page source or any browser request payload.
- **SC-004**: No file that implements checkout, Stripe products, prices or the normal gift delivery is
  modified by this task.

## Assumptions

- The existing server environment already holds the Resend credentials used by the paid gift flow; this
  task reuses them and does not provision or rotate them.
- The test page is an internal tool, not a public product surface: it is excluded from search indexing,
  not linked from navigation, and rate-limited.
- "Bypass the payment requirement" means only the Stripe payment step is skipped for this test send; the
  generated reveal and the email content stay identical to the paid product.
