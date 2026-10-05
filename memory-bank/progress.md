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
- Replaced the hardcoded `crypto.randomUUID()` in `app/layout.js` styles path with the stable Next.js build ID/commit hash, resolving unstable style reloads.
- Reduced unused JavaScript and render-blocking CSS warnings in Lighthouse/PageSpeed audits for the mobile configuration.
- Refactored `TurnstileField` to use `next/script` for reliable initialization.
- Secured rate-limiting paths using distributed Redis state.
- **Redis spam protection resilience**: Added operation failure handling and atomic counter expiry in `app/spam-protection.js`; verified outage/limit/duplicate behavior with 15 regression tests and counter TTL/concurrency behavior against local Redis.

## In-Progress Corrective Work

- **Paid Lucky Pick persistence follow-up (PR #1371)**: Corrected strict database `game` validation, removed the duplicate generated-reveal `game` key, and rebuilt the broken persistence regression tests from the actual merged state of PR #1370. Final CI/reviewer verification remains pending.

## 2026-10-05 - DNS/Scanner Discrepancy Investigation
- **Investigated:** The low DNS Health score for `www.luckypickcanada.ca` reported by security scanners.
- **Findings:** The scanner incorrectly penalized the `www` hostname for lacking SPF, DMARC, and DKIM records. The `www` hostname is strictly configured as an HTTP 301 redirect to the canonical root domain (`luckypickcanada.ca`) and never sends email. The root domain correctly possesses all required email authentication records for the Resend integration.
- **Action:** No changes made. Determined the configuration is technically correct and secure, and the scanner report for the `www` hostname should be safely ignored.
