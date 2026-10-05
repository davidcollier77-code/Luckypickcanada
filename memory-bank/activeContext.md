# Active Context

## Current Goals
- Ensure homepage mobile rendering achieves optimal Speed Index and Largest Contentful Paint (LCP) benchmarks.
- Mitigate console errors and unexpected fallbacks triggered by absent cloud services (Upstash Redis) or frantic user events (window resizes).
- Resolve browser reliability warnings from performance scans.
- **New:** Ensure form and payment security mechanisms (Turnstile, rate limiting, gift delivery) are robust and do not cause intermittent availability issues.

## Recent Work
- Duplicate fingerprints now use a Redis `SET NX` claim with the existing ten-minute expiry; rejected claims record spam attempts, and local outage markers remain effective. Concurrent claims and fallback behavior pass regression tests.
- Fixed Redis operation failures in spam protection to log operation/key context and use the existing memory fallback; counters now initialize with an expiry atomically. Local fallback blocks and duplicate markers remain effective after failed Redis writes.
- Refactored `app/turnstile-field.js` to utilize `next/script` (`lazyOnload`), replacing a complex, manual DOM injection approach that was susceptible to hydration and routing race conditions, causing intermittent "Spam check is not configured" errors.
- Corrected a pricing inconsistency in `app/api/checkout/route.js`, updating the `gift_package` unit amount from 199 to 299 to match the intended $2.99 CAD price point used in the UI and validation.
- Upgraded the in-memory rate limiting map in `app/spam-protection.js` to utilize Upstash Redis for distributed state, enabling robust rate limiting across ephemeral Cloudflare Worker instances.
- Enhanced `app/api/gift-delivery/route.js` to securely lean on the Stripe webhook for definitive email delivery, prioritizing early redirects to the reveal page if `metadata.giftDeliveredAt` is already set to prevent potential race-condition abuses on the GET route.
- Modified `app/layout.js` to utilize native Next.js CSS imports.
- Refactored `app/lib/audio.js` to load the `howler` dependency dynamically.
- Investigated and improved the mobile Speed Index and LCP on the homepage.
- Handled the massive 2MB `homepage-hero-lucky-pick-canada.png` by converting it to `webp` (300KB).
- Removed an erroneous `fetchPriority="high"` tag for a non-LCP asset.
- Eliminated an unstable cache-busting behavior in `app/layout.js`.
- Addressed server console 500 errors in `app/api/visits/route.js`.
- Mitigated visual jank on viewport resize.

## Open Questions
- None. Security updates have been implemented and builds succeed.

## Pending Verification
- Real-world distributed rate limiting observation (KV store interaction).
- Turnstile reliability across various browsers/network speeds.
- Hardened paid gift fulfillment to prevent concurrent duplicate emails via a temporary Redis NX lock keyed by Stripe session ID.
- Established server-side authorization for paid `lucky_pick` reveals by checking Stripe Session data, closing an exploit that relied on client-side URL parameter manipulation.
- Removed the obsolete and unverified legacy `/api/send-gift` endpoint to enforce paid entitlement boundaries.
- Enhanced Stripe webhook logic to cover asynchronous payment events (`checkout.session.async_payment_succeeded`).
- Addressed CodeRabbit review feedback on PR #1367 to fine-tune Stripe webhooks, Redis locking, and error fallback scenarios in `gift-email.js` and `HomePage.js`.
- Restored per-IP rate limiting on `/api/verify-session` (`verify_session`, 60 requests per hour, 429 with `{ error: 'rate_limited' }` returned before any Stripe call) plus `export const dynamic = 'force-dynamic'`.
- `HomePage.js` now surfaces a visible `role="alert"` message when paid-reveal verification fails, with a dedicated 429 message, instead of only writing to the console.
- Verified with temporary harnesses (not committed): the 61st request is rejected before Stripe is constructed; the 60th still succeeds; the in-memory fallback enforces the same ceiling; unpaid and non-`lucky_pick` sessions remain 403; `test_bypass` and `?pick=` reveals stay gated behind `REVEAL_TEST_MODE = false`.
- Known limitation: the committed Vitest config does not enable JSX for `.js` modules, so `app/homepage/*.js` components cannot be imported by Vitest without a temporary config or `.jsx` copy.
- Closed the durable sent-marker regression in `app/gift-email.js` on PR #1367: the `gift_sent:<sessionId>` marker is now written unconditionally right after a successful send and before the Stripe metadata update (its own `try`/`catch`, logged as `CRITICAL:` on failure), the TTL is a named 7-day `GIFT_SENT_MARKER_TTL_SECONDS`, and the marker is re-read after the `SET NX` lock is acquired so the pre-lock read's TOCTOU window can no longer send a second gift.
- Residual limitation (unchanged, separate from this fix): when Upstash is unconfigured there is no `gift_sent` store at all and the marker write is skipped, so durability depends on the Stripe `giftDeliveredAt` metadata write in that environment.
- Closed the Redis-less fallback lock finding on PR #1367. `giftDeliveredAt: 'processing'` is no longer written to Stripe metadata at all: the durable Stripe `giftDeliveredAt` marker is written only after `sendGiftEmail` confirms a successful send.
- Replaced the non-atomic Stripe-metadata fallback lock with a process-level in-memory lock store (`Map<sessionId, { token, expiresAt }>`) in `app/gift-email.js`, used whenever the Redis client is missing **or** Redis throws/unreachable. The in-memory path mirrors the Redis path: unique `crypto.randomUUID()` token on acquire, TTL expiry with pruning, and compare-and-set release that cannot delete a newer holder's lock. Redis failures now degrade to the in-memory lock instead of failing closed.
- One shared `GIFT_LOCK_TTL_MS = 120000` drives both the Redis `px` and the in-memory `expiresAt`, so a terminated process recovers on the same deadline and a stalled request is never a permanent block.
- `validateGiftSession` no longer treats the intermediate `processing` marker as a completed delivery. A stale claim is recovered from: the request proceeds to acquire the lock and re-attempts, and the marker is overwritten by the real timestamp on success. `isGiftDelivered()` is exported and now also gates the `/api/gift-delivery` reveal redirect, so `processing` can no longer short-circuit to "Gift Dispatched Successfully".
- The claim is released in `finally` on every exit path, including a throwing `sendGiftEmail` (`fetch` / `response.text()` failures), so a failed attempt no longer poisons the session.
- Reconciled with the earlier durable sent-marker fix on the same branch: the marker is still written **before** the Stripe metadata update, keeps its 7-day `GIFT_SENT_MARKER_TTL_SECONDS`, and is still re-read after the lock is acquired. Both the pre-lock and post-lock reads and the marker write now go through `wasGiftAlreadySent()` / `rememberGiftSent()`, which gained an in-memory counterpart so duplicate emails are still prevented when Redis is unavailable (closing the residual limitation noted above).
- Added `__tests__/gift-email.test.js` and `__tests__/gift-delivery-route.test.js` (15 tests) covering concurrent duplicate delivery with Redis absent, mutual exclusion when Redis throws, release on `sendGiftEmail` throw (both lock paths), recovery after a stale `processing` claim, expired-holder token-CAS protection, unique Redis tokens with the Lua release, marker-before-Stripe ordering, and the reveal-redirect behaviour for `processing` vs completed markers. 10 of the 15 fail against the pre-fix code.
- Verification: `pnpm test` 42/42 pass, `pnpm tsc --noEmit` clean, `pnpm build` succeeds with a 348 MB `.next` (101 MB excluding cache), under the 495 MB limit.
- Review-thread closure for the PR #1367 `app/gift-email.js` TOCTOU WARNING: independently re-verified on `bfa6a33` that the post-acquisition re-read runs inside the `claimed !== null` branch while the lock is held, returns `alreadyDelivered` with no Resend call, releases through `lock.release()` (Lua `RELEASE_IF_OWNER` GET/DEL, token CAS on the in-memory path), and keeps the pre-lock read as a fast path only. The existing concurrency tests all start from a cold store, so they exercise lock contention rather than this window; added `__tests__/gift-email.test.js` case "re-reads the sent marker under the lock when it appears between the pre-lock read and SET NX", which reproduces the exact race (pre-lock read misses, marker appears before `SET NX` lands) and fails when the re-read is removed. Suite is now 43/43.
- Measured independently on `30370bb`: `du -sb .next` = 304,594,228 bytes (290.5 MiB / 304.6 MB) against the 495 MB limit; `/api/verify-session` builds as a dynamic route and `/api/send-gift` is still absent.
- Environment note: the Playwright visual suite cannot run in this sandbox. A foreign `Hello from Bun server!` process occupies port 3000, so `page.goto('/')` never reaches the Next dev server and `locator('main')` never appears. `fuser`/`lsof`/`ss`/`netstat` are unavailable to reclaim the port. The Next dev server itself was verified to serve `/` with HTTP 200 on a free port, so the failures are the port collision, not the app.
- Note for future sessions: three sibling commits landed on the PR branch (`c8789ea`, `2b92797`, `bfa6a33`) while a duplicate fix was being prepared. Fetch and re-read `app/gift-email.js` before assuming an earlier revision is current; `git push` is rejected as non-fast-forward until the branch is re-synced.
