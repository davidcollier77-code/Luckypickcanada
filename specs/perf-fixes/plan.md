# Implementation Plan: Performance Improvements

## Technical Context
- **Framework:** Next.js (App Router), React, Tailwind CSS, Framer Motion
- **Images:** using native `<img>` tags inside `<picture>` with `srcSet` for AVIF/WebP in several places, but also `next/image` in some locations. Next.js image optimization is disabled in `next.config.mjs` (`unoptimized: true`).

## Phase 0: Research
- **Bottlenecks:**
  - `HomePage.js` uses dynamic imports for `CheckoutModal` and `LuckyRevealPopup`, which is good.
  - The hero image `homepage-hero-lucky-pick-canada.webp` and AVIF variants are large and currently preloaded, but are they lazy-loading properly or are other images blocking?
  - `HomePage.js` canvas animation loops: The ambient star loop already hoisted `ctx.fillStyle` outside the loop.
  - Image paths: Several images are loaded using `<picture><source ...><img></picture>`. `next/image` is imported in some files but not used, or used incorrectly. Wait, `next.config.mjs` sets `unoptimized: true`, meaning `next/image` just acts as a standard `<img>` wrapper essentially. Using native `<picture>` tags with explicit responsive sources (AVIF/WebP) is intended here.

## Phase 1: Implementation Tasks
1. **Fix 1: Optimize Turnstile Loading**
   - In `app/page.js`, Turnstile script is preloaded. Check if it blocks rendering. The script `https://challenges.cloudflare.com/turnstile/v0/api.js?onload=onloadTurnstileCallback&render=explicit` is preloaded via `preload()`. However, `Script` tag with `strategy="afterInteractive"` or `lazyOnload` is better for third parties unless it's strictly critical. Wait, it's a `preload` for the `<head>`, not the script itself.
2. **Fix 2: Canvas Animation Performance (HomePage.js)**
   - Extract `.baseAlpha` calculation. `ctx.globalAlpha = Math.max(0, Math.min(1, currentAlpha));` is evaluated inside the loop. Let's see if any other optimizations exist.
3. **Fix 3: LCP Image Preload**
   - `Hero.js` preloads `homepage-hero-lucky-pick-canada.avif`.
   - `HomePage.js` has a very large image: `1784889264858.png` (gift card artwork). It uses `loading="lazy"`. This is good.
4. **Fix 4: Analytics Script Deferred Loading**
   - In `app/layout.js`, Google Analytics is loaded using `strategy="afterInteractive"`. This is already good.
5. **Fix 5: Unused Imports**
   - Several files (`HomePage.js`, `lucky-card-reveal.js`, `share-lucky-pick-button.js`, `lucky-map-of-canada.js`) import `Image from 'next/image'` but don't use it, or they mix it with native `<picture>` tags.
   - Wait, `HomePage.js` imports `Image from 'next/image'` on line 2, but uses native `<picture>`. Let's remove the unused import to slightly reduce bundle parse time and clean up.

Let's do a quick audit of the homepage performance using lighthouse if possible, or just apply common sense fixes:
1. `app/homepage/HomePage.js`: Unused `import Image from 'next/image'`.
2. `app/homepage/Hero.js`: The image `homepage-hero-lucky-pick-canada.webp` uses `fetchPriority="high"`. This is great.
3. `app/lucky-card-reveal.js`: Unused `Image` import?
4. Look at `app/layout.js`: The Google Analytics script uses `strategy="afterInteractive"`.
5. Look at `package.json` for unused heavy libs loaded globally.
6. The `<picture>` element in `app/homepage/HomePage.js` (line 438) uses `sizes="(max-width: 768px) 352px, 704px"`.
7. Let's check the size of the images.
