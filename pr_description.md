## Description

This PR fully implements the three reported mobile Speed Analyzer findings regarding the Lucky Pick Canada homepage, establishing actual root causes and resolving them appropriately in the current codebase context.

**1. SPEED INDEX:**
- **Finding/Baseline:** Speed index was exceptionally high. A major cause was the cache-busting behavior for `app/layout.js` which used `crypto.randomUUID()` when environment variables were not available, forcing the CSS to be re-downloaded constantly on every page load in some environments. Additionally, an unused image (`BackgroundEraser_20260724_163638777.png`) was aggressively preloaded with `fetchPriority="high"`, stealing bandwidth from critical path resources.
- **Fix:** Swapped `crypto.randomUUID()` for a deterministic `"default-build"` fallback to preserve CSS cacheability. Removed the incorrect `BackgroundEraser` preload, and added an optimized preload for the hero image.

**2. LCP (Largest Contentful Paint):**
- **Finding/Baseline:** LCP was extremely long. The hero element is a 2MB `homepage-hero-lucky-pick-canada.png` asset. Due to Next.js image optimization being bypassed (`unoptimized: true` in `next.config.mjs` for Cloudflare compatibility), the raw 2MB file was served directly to mobile devices.
- **Fix:** Converted the 2MB PNG to a 300KB WebP (`homepage-hero-lucky-pick-canada.webp`). Updated `app/homepage/Hero.js` to reference the WebP. Added a `fetchPriority="high"` preload to `app/layout.js` specifically for this new asset. This cuts the critical payload by ~85%.

**3. BROWSER CONSOLE ERRORS:**
- **Finding/Baseline:** `/api/visits` was throwing a 500 server error when the Upstash Redis environment variables were not populated, leading to visible client-side console errors on every load. `HomePage.js` had potential errors related to `handleResize`.
- **Fix:** Refactored `app/api/visits/route.js` to gracefully fall back and return a default `{ visits: 0 }` response when `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` are missing, instead of failing with a 500. Additionally, wrapped the `handleResize` function in `app/homepage/HomePage.js` in a 200ms `setTimeout` debounce to mitigate frantic canvas recalibrations.

**Visuals & Boundaries:**
- Verified that the high-definition Milky Way background is fully preserved and un-altered.
- Verified that Aurora was not reintroduced.
- Verified that shooting star behavior functions correctly without interference.
- Maintained all existing interaction sequences and visual coverage.
- Build remains well under the 495MB safety ceiling. Playwright visual tests and Vitest passing.
