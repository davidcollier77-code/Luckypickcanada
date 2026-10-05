# Progress

## Milestones

- **Initial Setup**: Project scaffolded using Next.js App Router, Tailwind CSS, and Framer Motion.
- **Visual Foundation**: Hero section, sky backdrop, Milky Way HD image integration, shooting stars, and ambient star twinkle implemented.
- **Interactivity**: Homepage interaction added with interactive Lucky Pick card reveal (6/7 picks), dynamic color and day selection logic, tip jar, and gift package.
- **Payment & Cloud Integration**: Added Stripe checkout support and email handling configuration logic.
- **Mobile Performance Phase 1**: Addressed LCP delays, optimized heavy hero images to WEBP, corrected fetch priorities, eliminated endless cache busting, and handled 500 errors gracefully with Upstash.
- **Mobile Performance Phase 2**: Eliminated render-blocking CSS logic in `layout.js` by reverting to Next.js CSS asset bundling. Dynamically imported Howler.js (`audio.js`) only upon user click interactions, removing 41 KiB of unused JS from the initial page load.
- **Security & Reliability Phase 1**: Resolved intermittent Turnstile loading issues, fixed Gift Experience pricing inconsistencies, implemented distributed rate limiting via Upstash Redis, and fortified the gift delivery webhook/GET route integration against race conditions.

## Completed Tasks

- **Atomic duplicate protection**: Replaced the fingerprint read/write race with `SET NX PX`; verified successful claims, concurrent rejection, spam logging, and outage fallback in the 27-test suite. The Redis error-handling and atomic counter-expiry review findings were already resolved in the starting revision.
- Integrated Cloudflare Turnstile into public forms.
- Replaced the hardcoded 'crypto.randomUUID()' in `app/layout.js` styles path with the stable Next.js build ID/commit hash, resolving unstable style reloads.
- Reduced unused JavaScript and render-blocking CSS warnings in Lighthouse/PageSpeed audits for the mobile configuration.
- Refactored `TurnstileField` to use `next/script` for reliable initialization.
- Secured rate-limiting paths using distributed Redis state.

- **Redis spam protection resilience**: Added operation failure handling and atomic counter expiry in `app/spam-protection.js`; verified outage/limit/duplicate behavior with 15 regression tests and counter TTL/concurrency behavior against local Redis.
- **Security Hardening (Payment & Gift Fulfillment):**
  - Secured the Lucky Pick Reveal flow by introducing server-side validation (`/api/verify-session`) against Stripe to authorize the reveal, instead of trusting client URL parameters.
  - Mitigated race conditions and duplicate email deliveries for paid gift packages by wrapping the fulfillment process (`gift-email.js`) in an Upstash Redis lock claimed with `SET NX` (120s TTL) on a `gift_lock:<session_id>` key. The guard is Redis-only; with no Redis client the code falls back to a non-atomic Stripe metadata claim.
  - Audited legacy functionality and securely removed the unauthenticated `/api/send-gift` endpoint.
  - Broadened Stripe webhook handler to support `checkout.session.async_payment_succeeded`.
- **Security Hardening Follow-up (CodeRabbit Review):**
  - Reworked the Redis gift lock to claim the lock with a unique `crypto.randomUUID()` token, release it through a token-checking Lua script in a `finally` block so a failed delivery cannot leave a session deadlocked, and fail closed when an already-constructed client errors during `SET NX`. Initialization failures do not fail closed: `getRedisClient()` returns `null` and the code falls back to a Stripe metadata claim (`giftDeliveredAt: 'processing'`) that its own comment notes is not perfectly atomic.
  - Added a Redis `gift_sent:<session_id>` marker, initially written only when the post-send Stripe metadata update failed, so a retry inside that window would be suppressed instead of resending. The marker is Redis-only; with no Redis client the only durable record of a delivery is the Stripe metadata write. A later commit in this same PR (`fix(gift-email): persist durable sent marker before Stripe metadata update`) changed this to an unconditional pre-Stripe write, restored a 7-day TTL, and restored the post-lock re-read — see the durable sent-marker entry below.
  - Made no behavioural change to the `test_bypass` branch in `HomePage.js`: it was already gated on `REVEAL_TEST_MODE` before this follow-up, and the follow-up only re-indented the block (the gate was applied earlier in the same PR series by `fix(homepage): gate test_bypass reveal on test mode`).
- **Security Hardening Follow-up (Rate-limit regression on PR #1367):**
  - Restored the `checkApiRateLimit(getClientIp(request), 'verify_session', 60, 3600000)` guard and `export const dynamic = 'force-dynamic'` on `/api/verify-session`, rejecting with HTTP 429 `{ ok: false, error: 'rate_limited' }` before the Stripe client is constructed so an unauthenticated caller cannot burn Stripe quota or probe session IDs.
  - Raised the ceiling from 10/hour to 60/hour so shared/NAT and carrier-grade NAT customers are not locked out of a paid reveal they already paid for.
  - Replaced the console-only failure path in `HomePage.js` with a visible `role="alert"` notice that distinguishes a 429 rate limit from other verification failures and from a network failure.
- Verification: 27/27 Vitest tests pass; `pnpm build` succeeds and lists `/api/verify-session` as a dynamic (`ƒ`) route. Re-measured on this branch after the documentation corrections: `.next` is 305 MB (limit 495 MB); an earlier run in this PR series recorded 290.42 MB.
- **Security Hardening Follow-up (durable sent-marker regression on PR #1367):**
  - `app/gift-email.js` only wrote the durable `gift_sent:<sessionId>` marker inside the `catch` around the Stripe metadata update, so a delivered gift left no marker when that update failed. The marker is now written unconditionally as soon as `sendGiftEmail` reports success and *before* the Stripe update, which makes delivery at-most-once regardless of what Stripe does afterwards. The marker write has its own `try`/`catch` that logs a `CRITICAL:` error, so a Redis failure cannot abort an already-delivered gift.
  - Restored the marker TTL from 24 hours to 7 days as the named constant `GIFT_SENT_MARKER_TTL_SECONDS` (converted to `px` milliseconds), because Stripe retries `checkout.session.completed` and the async payment equivalents for up to ~3 days.
  - Restored the post-lock re-read of the marker. It was absent at this revision: the marker was read once *before* `SET NX`, so a request whose read raced another request's send + marker write + lock release would claim the freed lock and send a second gift. The authoritative read now happens inside the `try` so the existing `finally` still releases the lock on the early `alreadyDelivered` return.
  - Left the Redis lock semantics (`nx: true`, 120s TTL, token-checked Lua release), the Stripe fallback lock, and `test_bypass` handling untouched.
  - Verification: 27/27 Vitest tests pass; a clean `pnpm build` succeeds with a 290.46 MiB / 304.57 MB `.next` (limit 495 MB). A temporary 8-case harness (not committed) confirmed call order `email -> marker -> stripe`, the marker surviving a throwing Stripe metadata update, a 7-day `px` TTL, no marker when the send fails, `{ ok: true, alreadyDelivered: true }` on both the pre-lock and post-lock marker reads with the lock released, delivery still reported successful when the marker write throws, and the unchanged `{ px: 120000, nx: true }` lock. That harness fails 4 of 8 cases against the pre-fix revision.
- **Security Hardening Follow-up (Redis-less fallback lock finding on PR #1367):**
  - Removed the unconditional `giftDeliveredAt: 'processing'` Stripe metadata overwrite. It was not a compare-and-set, so it never provided mutual exclusion, and it permanently claimed a session whenever the writing process died.
  - Restored a real process-level lock store in `app/gift-email.js` (`Map<sessionId, { token, expiresAt }>`) that engages when the Redis client is missing **or** Redis throws/unreachable, using the same unique-token acquire and compare-and-set release semantics as the Redis path instead of a blind write.
  - Release is compare-and-set on both paths (Lua script for Redis, token check for the Map), so a slow request whose claim already expired cannot release a newer holder's lock.
  - Unified the lock TTL: one `GIFT_LOCK_TTL_MS = 120000` feeds both the Redis `px` and the in-memory `expiresAt`, so a terminated process recovers on the same deadline.
  - `validateGiftSession` now short-circuits only on a completed marker; a stale `processing` claim is recovered from by re-acquiring the lock and re-attempting. The claim is released in `finally` on every path, including a throwing `sendGiftEmail`.
  - `isGiftDelivered()` is exported and gates the `/api/gift-delivery` reveal redirect, so an intermediate `processing` state can no longer render "Gift Dispatched Successfully" for a gift that was never sent.
  - Reconciled with the durable sent-marker fix above (both changes touched the same function): the marker is still written before the Stripe update, keeps the 7-day `GIFT_SENT_MARKER_TTL_SECONDS`, and is still re-read after the lock is acquired. The pre-lock read, post-lock re-read, and marker write now share `wasGiftAlreadySent()` / `rememberGiftSent()`, which gained an in-memory counterpart so duplicate emails stay prevented with Redis unavailable.
  - Verification: 42/42 Vitest tests pass (15 new, 10 of which fail against the pre-fix revision); `pnpm tsc --noEmit` clean; `pnpm build` succeeds with a 348 MB `.next`, 101 MB excluding cache (limit 495 MB).
