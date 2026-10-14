# Implementation Plan: AVIF Optimization Part 2

## Technical Stack & Constraints
- **Images:** `sharp` for local conversion (AVIF/WebP).
- **Delivery:** HTML `<picture>` for standard components (`<Image>`, `<img>`). CSS `image-set()` for `background-image`.
- **Framework:** Next.js `16.3.8`. Images are unoptimized statically (`images.unoptimized: true`), meaning we must construct delivery tags manually rather than relying on automatic optimization API routes.

## Phase 1: Shared Background Conversion (Crystal Ball, Map, Home)
1. Use Node.js script to download:
   - `https://images.pexels.com/photos/21633316/pexels-photo-21633316.jpeg?auto=compress&cs=tinysrgb&w=1920` (Desktop)
   - `https://images.pexels.com/photos/21633316/pexels-photo-21633316.jpeg?auto=compress&cs=tinysrgb&w=1200` (Mobile)
2. Save these to `public/assets/crystal-ball-bg-desktop.jpeg` and `public/assets/crystal-ball-bg-mobile.jpeg`.
3. Use `sharp` to convert both to AVIF (quality 75) and WebP (quality 80) in `public/assets/`.
4. Update `public/themes/default/homepage.css` and `themes/default/homepage.css` to use `image-set(url(...) type('image/avif'), url(...) type('image/webp'), url(...))` inside `.homepage-sky-backdrop`.

## Phase 2: Lucky Map Assets
1. Use `sharp` to convert `public/IMG_20260731_055452_187611.png` to AVIF (effort 6, quality 75) and WebP (effort 6, quality 80).
2. Refactor `app/lucky-map-of-canada/lucky-map-of-canada.js`:
   - Change `.story-modal` backdrop inline style to use `image-set()` prioritizing `lucky-map-sky.avif` over `lucky-map-sky.webp`.
   - Wrap the `<Image src="/IMG_20260731_055452_187611.png" .../>` component inside `<div className="official-map-artwork">` with a `<picture>` tag. Provide `<source>` nodes for AVIF and WebP, rendering the `<Image>` as the fallback.

## Phase 3: Lucky Meter Background
1. In `components/DailyResonance.tsx`, the `lucky-meter-night-sky.webp` is loaded via `<Image>`. Wrap this `<Image>` in a `<picture>` tag.
2. Provide a `<source>` element pointing to the existing `lucky-meter-night-sky.avif`.

## Phase 4: Verification
1. Playwright tests.
2. `./jules-verify.sh`.
3. `pnpm run build` output size check (495MB max).
