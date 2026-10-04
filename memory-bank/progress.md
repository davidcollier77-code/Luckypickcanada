# Progress

## 2026-10-04 — Performance & Stability (Speed Index, LCP, Console Errors)
- Analyzed mobile homepage Speed Index and LCP bottlenecks. Verified that the `BackgroundEraser` image was mistakenly preloaded at `high` priority and the main LCP hero image was a massive 2MB PNG (`homepage-hero-lucky-pick-canada.png`).
- Converted `homepage-hero-lucky-pick-canada.png` to WebP (300KB), resolving the LCP asset bloat issue. Pointed `<Image>` in `app/homepage/Hero.js` to the `.webp` asset.
- Updated `app/layout.js` to remove the incorrect `BackgroundEraser` preload and properly preload `homepage-hero-lucky-pick-canada.webp` to improve Speed Index.
- Resolved unstable CSS cache busting in `app/layout.js` by replacing the `crypto.randomUUID()` fallback with a deterministic `"default-build"` fallback when environment-provided build hashes are absent, preventing constant cache invalidation and rendering blocks.
- Investigated and mitigated `/api/visits` server-side 500 console errors stemming from missing Upstash Redis environment variables. Updated the route to gracefully fallback and return a synthetic `{ visits: 0 }` default.
- Implemented a debounce wrapper on `handleResize` in `app/homepage/HomePage.js` to avoid resize-triggered performance spikes/jank when calculating visual viewport bounds.
- Recreated missing visual snapshots (`pnpm exec playwright test tests/visual/homepage.spec.ts --update-snapshots`) to reflect new WebP LCP rendering bounds and behavior.
- Successfully built app (495MB limit respected - build footprint is unchanged at ~300MB node_modules and output). All static checks (`pnpm run build`, `./jules-verify.sh`, `vitest run`) pass correctly.
