# Implementation Plan: AVIF Image Optimization

## Phase 0: Research and Tooling Validation
1. Verify `sharp` encoder compatibility and availability.
2. Develop a script (`scripts/optimize-images.mjs`) to test AVIF conversions (e.g., `sharp(input).avif({ quality: 65 }).toFile(output)`).
3. Validate conversion on the hero image (`public/homepage-hero-lucky-pick-canada.webp`) and measure savings.

## Phase 1: Asset Conversion
1. Convert the hero image and verify its visual fidelity.
2. Convert the large background and poster images (`NGC4216_crawford.jpg`, `a_polished_high_detail_card_illustration_poster_i.png`, `BackgroundEraser_20260724_163638777.png`).
3. Convert representative standard/premium/flagship card artworks.
4. Record exact byte savings for each accepted conversion. Discard conversions that increase size or degrade quality unacceptably.

## Phase 2: Frontend Implementation
1. Refactor `app/homepage/Hero.js` to use an AVIF preload and standard HTML `<picture>` tag wrapping the `<Image>` or `<img>` for fallback support.
2. Refactor large asset usages in components like `app/crystal-ball/page.js` and `app/lucky-meter/page.js` to utilize `<picture>`.
3. Update `app/lucky-card-content.js` and dynamic `<picture>` tags inside `app/lucky-card-reveal.js` to serve AVIF versions with WebP fallbacks.

## Phase 3: Verification
1. Run `pnpm run build` to verify standard build constraints.
2. Measure `.next` and `public` folders to ensure the total build output stays well below 495MB.
3. Run `pnpm exec playwright test` to verify no visual regressions occurred.
4. Run `./jules-verify.sh`.
