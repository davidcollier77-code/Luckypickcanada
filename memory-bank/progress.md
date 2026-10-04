# Progress

## Completed Work
- Investigated and improved the mobile Speed Index and LCP on the homepage.
- Handled the massive 2MB `homepage-hero-lucky-pick-canada.png` by converting it to `webp` (300KB), which was delaying LCP significantly since Next image optimization is disabled.
- Removed an erroneous `fetchPriority="high"` tag for a non-LCP asset (`BackgroundEraser`) in the root `app/layout.js`, transferring this priority to the newly generated `homepage-hero-lucky-pick-canada.webp`.
- Eliminated an unstable cache-busting behavior in `app/layout.js` where `crypto.randomUUID()` caused styles to reload endlessly, harming Speed Index cache hit rates.
- Addressed server console 500 errors in `app/api/visits/route.js` caused by initializing `@upstash/redis` without credentials. Provided a graceful initialization bypass (`{ visits: 0 }`).
- Mitigated visual jank on viewport resize by adding a 200ms debounce to the `handleResize` function in `app/homepage/HomePage.js`.
- Fixed a `LazyLoadImageIssue` DevTools warning on mobile by removing `loading="lazy"` from `communityCover` in `app/homepage/HomePage.js`. Verified `CookieIssue` was external.
- **2026-10-04:** Optimized Mobile LCP and Render-Blocking resources. Replaced the render-blocking `<link rel="stylesheet">` tags in `app/layout.js` with `next/font/google` for optimal, zero-blocking typography delivery. Fixed the primary LCP issue by scaling down the unoptimized `3840px` width Pexels CSS background image used on the homepage to `1920w` for desktop and `1200w` for mobile via media queries. Build size (385MB) remained well below limits and local Playwright regression tests passed successfully.
