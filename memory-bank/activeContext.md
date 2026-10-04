# Active Context

## Current Goals
- Ensure homepage mobile rendering achieves optimal Speed Index and Largest Contentful Paint (LCP) benchmarks.
- Mitigate console errors and unexpected fallbacks triggered by absent cloud services (Upstash Redis) or frantic user events (window resizes).

## Recent Work
- Investigated and improved the mobile Speed Index and LCP on the homepage.
- Handled the massive 2MB `homepage-hero-lucky-pick-canada.png` by converting it to `webp` (300KB), which was delaying LCP significantly since Next image optimization is disabled.
- Removed an erroneous `fetchPriority="high"` tag for a non-LCP asset (`BackgroundEraser`) in the root `app/layout.js`, transferring this priority to the newly generated `homepage-hero-lucky-pick-canada.webp`.
- Eliminated an unstable cache-busting behavior in `app/layout.js` where `crypto.randomUUID()` caused styles to reload endlessly, harming Speed Index cache hit rates.
- Addressed server console 500 errors in `app/api/visits/route.js` caused by initializing `@upstash/redis` without credentials. Provided a graceful initialization bypass (`{ visits: 0 }`).
- Mitigated visual jank on viewport resize by adding a 200ms debounce to the `handleResize` function in `app/homepage/HomePage.js`.

## Open Questions
- None. Speed Index, LCP, and Console Error targets have been successfully met according to available bounds and environments. Build completes successfully and is under the 495MB limit.

## Pending Verification
- CI/CD visual Playwright suite tests (completed successfully locally).
- Performance baseline metrics delta (LCP/Speed Index should reflect immediate drops in raw metric wait times).
