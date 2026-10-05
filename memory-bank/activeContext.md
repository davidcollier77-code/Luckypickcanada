# Active Context

## Current Goals
- Ensure homepage mobile rendering achieves optimal Speed Index and Largest Contentful Paint (LCP) benchmarks.
- Mitigate console errors and unexpected fallbacks triggered by absent cloud services (Upstash Redis) or frantic user events (window resizes).
- Resolve browser reliability warnings from performance scans.
- **New:** Audit and harden payment/reveal authorization, ensuring no duplicate delivery bugs, client-side forgery loopholes, or bypass legacy routes.

## Recent Work
- Audited and secured payment workflows against client-side parameter tampering (e.g. `payment=success` exploits).
- Implemented `/api/verify-session` to mandate server-authoritative checkout validation for the lucky reveal and the gift feature.
- Hardened duplicate delivery (idempotency) of gifts, strictly relying on `giftDeliveredAt` and gracefully returning without double-charging or resending.
- Restricted the legacy `send-gift` API boundary strictly to the local development environment ensuring test_bypass mechanisms cannot expose production vulnerabilities.
- Added comprehensive `security-payment.test.js` validating the server-side Stripe verification logic and development boundary enforcements.
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
- Server authoritative sessions over extended multi-user traffic.
- Real-world distributed rate limiting observation (KV store interaction).
- Turnstile reliability across various browsers/network speeds.
