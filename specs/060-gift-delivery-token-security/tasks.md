# Tasks — Gift Delivery Reliability

## Implementation
- [x] Preserve secure lock tokens using `crypto.randomUUID()`.
- [x] Make Redis lock release atomic with compare-and-delete.
- [x] Persist a stable pending state and reveal before the Resend request.
- [x] Mark delivery sent only after Resend returns success.
- [x] Reuse saved reveal details and the same idempotency key for retries within the safe window.
- [x] Require manual reconciliation for stale/incomplete pending attempts.
- [x] Add regression tests for state transitions, retry safety, failures, and lock release.

## Verification
- [ ] Run targeted gift-delivery tests.
- [ ] Run full `pnpm test`.
- [ ] Run formatting checks and the production build; record measured build size.
- [ ] Run `./jules-verify.sh`.
- [ ] Inspect final diff and verify current-head GitHub Actions results.
- [ ] Update the PR body with actual checks and remaining risks.
