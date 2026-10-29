# Implementation Plan

## Technical Context
- Runtime: Node.js 22, Next.js App Router.
- State: Stripe Checkout Session metadata.
- Concurrency: Upstash Redis lock per Checkout Session.
- Email provider: Resend `POST /emails` with a stable idempotency key.

## Decisions
1. Persist `giftDeliveryStatus=pending`, a pending timestamp, and the generated reveal fields before calling Resend. A retry must rebuild the same email from those saved fields.
2. Change metadata to `giftDeliveryStatus=sent` and set `giftDeliveredAt` only after Resend confirms success. A failed or uncertain attempt remains pending.
3. Retry pending requests with the same idempotency key and exact payload only within a conservative 23-hour window. Resend documents that keys are retained for 24 hours; older or incomplete attempts require manual reconciliation rather than a possibly duplicate send.
4. Replace the Redis GET-then-DEL release with a Lua compare-and-delete operation so one request cannot delete another request's lock.
5. Keep all post-lock work inside try/finally and add regression coverage for state transitions and early exits.

## Verification
- Add focused Vitest cases for success, thrown request, provider rejection, safe retry, stale-pending protection, missing configuration, validation failure, Stripe failure, and atomic lock release.
- Run the targeted tests, full `pnpm test`, formatting checks, production build with measured size, and `./jules-verify.sh` where the execution environment permits.
- Inspect the final PR diff and actual GitHub Actions results. Do not claim checks that were not executed.
