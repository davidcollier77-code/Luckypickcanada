# Tasks: AVIF Image Optimization

- [ ] Verify `sharp` package and create an optimization script `scripts/optimize-images.mjs`.
- [ ] Convert `public/homepage-hero-lucky-pick-canada.webp` to AVIF, measure it.
- [ ] Implement `<picture>` tag rendering and preload link update for Hero image in `app/homepage/Hero.js`.
- [ ] Convert and measure large raster assets (`NGC4216_crawford.jpg`, `a_polished_high_detail_card_illustration_poster_i.png`, `BackgroundEraser_20260724_163638777.png`).
- [ ] Implement AVIF `<picture>` wrappers or CSS `image-set()` in their respective components.
- [ ] Convert and measure representative Lucky Card WebP assets.
- [ ] Update `app/lucky-card-content.js` and `app/lucky-card-reveal.js` to serve card AVIF variants with WebP fallbacks.
- [ ] Measure total build size; ensure < 495MB.
- [ ] Run `pnpm run build` and `pnpm exec playwright test`.
- [ ] Execute `./jules-verify.sh`.
