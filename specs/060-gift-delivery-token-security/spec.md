# Gift Delivery Reliability and Retry Safety

## Goal
A paid gift must not be marked sent until Resend accepts the email. Failures and uncertain outcomes must remain recoverable without changing the payload on retry or risking duplicate emails.

## Functional Requirements
- Keep cryptographically secure Redis lock ownership tokens.
- Release a lock with one atomic compare-and-delete operation so an expired owner cannot delete a newer owner's lock.
- Persist a pending delivery state and the exact gift reveal before the first Resend request.
- Reuse the persisted reveal and `gift-<checkout-session-id>` idempotency key for every retry of a pending attempt.
- Set `giftDeliveredAt` and `giftDeliveryStatus=sent` only after Resend returns a successful response.
- Keep failed or uncertain attempts pending; never claim they were sent.
- Resend documents a 24-hour idempotency-key retention window. Stop automatic retry before that window expires and require manual reconciliation for stale or malformed pending state.
- Release the acquired lock on every return path and exception.

## Acceptance Scenarios
1. A successful Resend response changes the Stripe metadata from pending to sent.
2. A thrown request or non-success response leaves the attempt pending without `giftDeliveredAt`.
3. A retry within the safe window reuses the saved numbers, lucky color, lucky day, email content, and idempotency key.
4. An old or incomplete pending attempt is flagged for manual review and is not re-sent automatically.
5. Missing configuration, invalid sessions, Stripe exceptions, and normal completion release only the current owner's lock.
6. The existing successful-delivery check remains compatible with older sessions that already have `giftDeliveredAt`.

## Out of Scope
- Changing payment eligibility, email design, user interface, or the Stripe/Resend integration model.
- Automatically retrying unresolved attempts after the provider's idempotency guarantee may have expired.
