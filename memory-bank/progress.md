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
  - Mitigated race conditions and duplicate email deliveries for paid gift packages by wrapping the fulfillment process (`gift-email.js`) in an atomic Upstash Redis lock (`SET NX`).
  - Audited legacy functionality and securely removed the unauthenticated `/api/send-gift` endpoint.
  - Broadened Stripe webhook handler to support `checkout.session.async_payment_succeeded`.
- **Security Hardening Follow-up (CodeRabbit Review):**
  - Updated Redis lock implementation for gift deliveries to fail closed on initialization errors, properly use a unique lock token, and release locks via a Lua script in a `finally` block to prevent deadlocks.
  - Implemented a 24-hour Redis 'sent marker' fallback in case Stripe metadata fails to update after successful email delivery, reinforcing idempotency.
  - Reinforced `test_bypass` checking in the browser to ensure `REVEAL_TEST_MODE` is strictly evaluated before rendering unverified reveals.
- **Security Hardening Follow-up (Rate-limit regression on PR #1367):**
  - Restored the `checkApiRateLimit(getClientIp(request), 'verify_session', 60, 3600000)` guard and `export const dynamic = 'force-dynamic'` on `/api/verify-session`, rejecting with HTTP 429 `{ ok: false, error: 'rate_limited' }` before the Stripe client is constructed so an unauthenticated caller cannot burn Stripe quota or probe session IDs.
  - Raised the ceiling from 10/hour to 60/hour so shared/NAT and carrier-grade NAT customers are not locked out of a paid reveal they already paid for.
  - Replaced the console-only failure path in `HomePage.js` with a visible `role="alert"` notice that distinguishes a 429 rate limit from other verification failures and from a network failure.
  - Verification: 27/27 Vitest tests pass; `pnpm build` succeeds with a 290.42 MB `.next` (limit 495 MB) and lists `/api/verify-session` as a dynamic route.
- **Security Hardening Follow-up (durable sent-marker regression on PR #1367):**
  - `app/gift-email.js` only wrote the durable `gift_sent:<sessionId>` marker inside the `catch` around the Stripe metadata update, so a delivered gift left no marker when that update failed. The marker is now written unconditionally as soon as `sendGiftEmail` reports success and *before* the Stripe update, which makes delivery at-most-once regardless of what Stripe does afterwards. The marker write has its own `try`/`catch` that logs a `CRITICAL:` error, so a Redis failure cannot abort an already-delivered gift.
  - Restored the marker TTL from 24 hours to 7 days as the named constant `GIFT_SENT_MARKER_TTL_SECONDS` (converted to `px` milliseconds), because Stripe retries `checkout.session.completed` and the async payment equivalents for up to ~3 days.
  - Restored the post-lock re-read of the marker. It was absent at this revision: the marker was read once *before* `SET NX`, so a request whose read raced another request's send + marker write + lock release would claim the freed lock and send a second gift. The authoritative read now happens inside the `try` so the existing `finally` still releases the lock on the early `alreadyDelivered` return.
  - Left the Redis lock semantics (`nx: true`, 120s TTL, token-checked Lua release), the Stripe fallback lock, and `test_bypass` handling untouched.
  - Verification: 27/27 Vitest tests pass; a clean `pnpm build` succeeds with a 290.46 MiB / 304.57 MB `.next` (limit 495 MB). A temporary 8-case harness (not committed) confirmed call order `email -> marker -> stripe`, the marker surviving a throwing Stripe metadata update, a 7-day `px` TTL, no marker when the send fails, `{ ok: true, alreadyDelivered: true }` on both the pre-lock and post-lock marker reads with the lock released, delivery still reported successful when the marker write throws, and the unchanged `{ px: 120000, nx: true }` lock. That harness fails 4 of 8 cases against the pre-fix revision.
