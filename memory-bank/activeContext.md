# Active Context

- **Current Goal**: Improve image-loading performance across the application by making AVIF the preferred delivery format for eligible raster images.
- **Latest Verified Issue**: Large raster image assets (like the 3.1 MB card poster, 2.5 MB background, and 2.4 MB Milky Way) were being served as JPEGs, PNGs, or WebP. Given Cloudflare configuration and `images.unoptimized: true`, these were not auto-optimizing to next-gen formats beyond the original format.
- **Verified Findings**:
  - `sharp` v0.35.5 successfully achieved 30% to 94% compression ratios on these static assets by generating AVIF outputs.
  - The implementation uses `<picture>` tags to conditionally serve `image/avif` with WebP and original format fallbacks across `Hero.js`, `lucky-meter/page.js`, `lucky-map-of-canada.js`, `share-lucky-pick-button.js`, `crystal-ball/page.js`, and `lucky-card-reveal.js`.
  - Next.js preload hints were properly updated for `Hero.js` to target the `.avif` type.
- **Current Branch**: `avif-optimization`.
- **Additional Fixes**: None, scoped entirely to image optimization.
- **Implementation Status**: Completed AVIF implementation part 2 (Lucky Map, Lucky Meter, Crystal Ball). Verification tests (`pnpm run build`, `./jules-verify.sh`, and `playwright test`) are green. The build size remains well below the 495MB limit (`.next` is 353MB, `public` is 24MB).
- **Next Steps**: Await further requirements or enhancements.

## Crystal Ball Reference-Artwork Correction — 2026-10-15

- **Goal:** Replace the incorrect console-like illustration introduced by merged PR #1484 with a crystal ball matching the supplied target.
- **Verified root cause:** The old component loaded `/assets/crystal-ball-pedestal.avif` (with WebP/PNG fallbacks) as the main artwork. The previous visual test verified asset loading and geometry, not the depicted subject.
- **Current branch:** `fix/crystal-ball-reference-artwork`.
- **Current implementation:** Use a transparent foreground SVG illustration with a reflective blue-violet orb, ruby maple leaf, emerald clover, sapphire drop and ornate gold-and-obsidian pedestal. Preserve the existing page background and interactions.
- **Verification:** OpenNext build validation passed after fixing an SVG syntax typo caught by CI. Visual QA is still pending. Local tests, `./jules-verify.sh`, build-size measurement against 495 MB, and actual mobile/desktop comparison have not been verified from a local checkout.
