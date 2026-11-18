# Implementation Plan: Render-Time Milky Way Sky Delivery

**Feature**: `specs/187-milky-way-sky-delivery`

**Branch**: `perf/sky-delivery`

**Base**: `main` at `782ac553`

## Summary

Move the shared Milky Way backdrop from a CSS `image-set()` background to one server-rendered `<picture>` in
`app/components/SkyBackdrop.js`, used by the homepage, Crystal Ball, Crystal Ball preview and Lucky Map routes.
The browser now selects the mobile or desktop artwork itself, keeps the intrinsic ratio, and fetches the
decorative layer at low priority. The existing AVIF files are re-encoded from the repository's JPEG masters at
the same dimensions and format order.

## Technical Context

- **Runtime**: Next.js App Router 16.4.5, React 19.3.1; the component is a plain server component with no
  client state.
- **Assets**: `public/assets/crystal-ball-bg-{mobile,desktop}.{avif,webp,jpeg}`; only the AVIF is re-encoded.
- **Encoding**: repository `sharp` 0.35.5 (libaom 3.15.1), quality 52 mobile / 55 desktop, effort 6.
- **Testing**: Vitest source/asset guard plus the existing reveal-background guard; Playwright visual assertion
  updated to read the rendered image instead of a CSS background layer.
- **Constraints**: no dependency, build step, hosting, cache-header, protected-file or configuration change;
  production build below 495 MiB.

## Constitution Check

- **Preserve visuals**: the artwork, breakpoint, focal positions, gradient, glow, filter and transform are
  unchanged. The gradient becomes a `::before` layer above the image so paint order matches the old background
  stack.
- **Smallest correct change**: one component, four call-site swaps, one CSS block, two guarded assets and the
  assertions that pin them.
- **No new capability**: the browser's own `srcset`/`<source media>` selection replaces CSS selection; no
  user-agent detection, no new adaptive detector.
- **Protected areas**: no payment, database, authentication, security, hosting, deployment, environment or
  secret file is touched.
- **Evidence first**: the audit baseline, the encoded sizes and PSNR against the master JPEG were measured before
  choosing the quality settings.

## Phase 0: Research (repository evidence)

1. **Where the 143,077 bytes came from.** `themes/default/homepage.css` requested
   `/assets/crystal-ball-bg-mobile.avif` (142,777 body bytes; 143,077 with response headers) through
   `image-set()` below 820 px and the 427,992-byte desktop WebP above it. A CSS background is fetched while the
   stylesheet applies, before hydration, so Feature 180's plan could not defer or resize it.
2. **Existing artwork.** The mobile artwork is 1200x800 and the desktop artwork is 1920x1280; the JPEG masters
   are 217,820 and 535,956 bytes. Both are delivered `cover`, so the composition is set by the focal position,
   not by the pixel box.
3. **Encoding headroom.** Re-encoding from the JPEG masters measured:
   | Variant | Quality | Bytes | PSNR vs master | Previous file |
   | --- | --- | --- | --- | --- |
   | mobile | 52 | 115,765 | 35.28 dB | AVIF 142,777 at 38.09 dB |
   | desktop | 55 | 315,369 | 36.88 dB | WebP 427,992 at 36.90 dB |
   Desktop is quality-neutral and 26.3% smaller; mobile trades 2.8 dB for 18.9% fewer bytes on a filtered,
   darkened, heavily cover-cropped atmosphere layer.
4. **Existing guards.** `__tests__/lucky-reveal-background.test.js` and
   `tests/visual/homepage.spec.ts` asserted the CSS background; both are updated to assert the same shared
   artwork through its new delivery.

## Phase 1: Design

### Files

```
app/components/SkyBackdrop.js                 # new server-rendered responsive layer
app/page.js                                   # render SkyBackdrop
app/crystal-ball/page.js                      # render SkyBackdrop
app/crystal-ball/preview/page.js              # render SkyBackdrop
app/lucky-map-of-canada/lucky-map-of-canada.js# render SkyBackdrop
themes/default/homepage.css                   # gradient/glow overlays, focal treatment
public/assets/crystal-ball-bg-mobile.avif     # re-encoded, same 1200x800 artwork
public/assets/crystal-ball-bg-desktop.avif    # re-encoded, same 1920x1280 artwork
__tests__/milky-way-sky-delivery.test.js      # delivery, artwork and byte guard
__tests__/lucky-reveal-background.test.js     # shared-artwork assertion now reads the component
tests/visual/homepage.spec.ts                 # asserts the rendered sky image
specs/187-milky-way-sky-delivery/*
```

### Layer model

| Layer | Implementation | Purpose |
| --- | --- | --- |
| Artwork | `<picture>` + `<img class="homepage-sky-backdrop__art">` | responsive selection, intrinsic ratio |
| Gradient | `.homepage-sky-backdrop::before`, z-index 1 | the old top background layer |
| Glow | `.homepage-sky-backdrop::after`, z-index 2 | unchanged radial/linear screen blend |
| Base | `.homepage-sky-backdrop` background colour and filter | unchanged |

### Scheduling

`loading="eager"` keeps the atmosphere from popping in after first paint; `fetchPriority="low"` keeps it behind
the hero artwork's existing high-priority preload. No preload hint is added for the sky.

## Re-evaluated Constitution Check

The delivery mechanism changes; the artwork, composition and route coverage do not. No new dependency,
configuration or data path is introduced. No violation.
