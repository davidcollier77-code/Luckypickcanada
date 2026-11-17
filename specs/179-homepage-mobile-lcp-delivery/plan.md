# Implementation Plan: Homepage Mobile LCP Delivery

**Feature**: `specs/179-homepage-mobile-lcp-delivery` | **Date**: 2026-11-17

## Evidence Gathered Before Planning

| Investigation | Method | Finding |
| --- | --- | --- |
| LCP composition | Lighthouse `lcp-breakdown-insight` on the local production build | TTFB 9 ms, resource load delay 625 ms, **resource load duration 3 283 ms**, element render delay 201 ms |
| Network ordering | Lighthouse `network-requests` | The hero AVIF starts at 633 ms and finishes at 3 914 ms while sharing a 1.6 Mbps pipe with 41.5 KiB CSS, 51 KiB fonts and ~130 KiB JS |
| Image delivery | PSI "Improve image delivery" + `currentSrc` probe | PSI's mobile profile needs 721 device pixels; the ladder was 669 w → 1024 w, so the browser fetched 203 KiB / 199 KiB transferred |
| Render-blocking CSS | PSI + local `render-blocking-insight` | Five stylesheets, 41.5 KiB gzipped; 13 KiB of it is the Crystal Ball route's CSS |
| Night-sky renderer | V8 CPU profile of the whole first load, 4× CPU, 390×844 | Canvas2D star loop accounts for ~15 ms of sampled self time (<0.3 %); two 236/239 ms framework long tasks dominate |
| Early preload via `Link` header | Built, served and measured | Header served correctly, single fetch, **no change** to request start (632 ms) or LCP; reverted as unmeasured |
| `experimental.cssChunking: 'strict'` | Built and measured | Homepage CSS 41.5 → 39.6 KiB and the Crystal Ball CSS still merged; reverted as not worth the global change |
| Framework JS | Chunk inspection | 2292 is the Next App Router client (`fetchServerResponse`), 5c5d is React DOM; neither is deferrable |

## Approach

1. **Fill the real candidate-ladder gap.** Add a 768 w AVIF and WebP derivative generated from the existing 1024 w master (`sharp`, lanczos3, AVIF q66, WebP q84), list it in ascending order in both `<source>` elements, the `<img srcSet>` fallback and the preload's `imageSrcSet`. Because `sizes` is unchanged and the new step is inserted between existing widths, srcset selection only ever replaces a *more* oversized candidate with a closer one, so no device samples fewer pixels than before.
2. **Keep the artwork untouched.** No re-encode of 669/1024, no change to `sizes`, `fetchPriority`, `loading`, `alt`, the `<picture>` structure, the shimmer overlay or the star canvas.
3. **Prove delivery and fidelity.** A Playwright probe records `currentSrc`/`naturalWidth` per profile; an A/B capture renders the same `<img>` with the 768 w candidate and with the 1024 w file routed over it, with animations disabled, and reports the pixel difference.
4. **Guard the invariant in tests.** The existing hero preload guard now asserts that the hint list equals the picture list (the double-download trap), that the ladder is ascending, that a step exists at or above 721 px, and that only this painting's own derivatives are referenced.

## Rejected Options

- **Serving the 669 w file to phones (PSI's 105 KiB suggestion).** A 390 px viewport at DPR 2.75 needs 1 073 device pixels; 669 w is 1.72× and would visibly soften the gold wordmark. Rejected as a fidelity trade the mission forbids.
- **`Link` response-header preload.** Measured twice: request start unchanged, LCP unchanged. Reverted.
- **`experimental.cssChunking: 'strict'`.** Saved 1.9 KiB and did not separate the Crystal Ball CSS. Reverted.
- **Graphics-capability or canvas changes.** Profiling shows the sky renderer is not a bottleneck; changing it would risk the mission's most protected visuals for no measurable gain.
- **Deferring more JS.** The remaining initial JS is the Next App Router client and React DOM; the modals, FAQ, Howler, confetti and Turnstile runtime are already deferred or lazy (PR #1933).

## Affected Components

- `app/homepage/Hero.js` — candidate ladder and its documentation.
- `public/homepage-hero-lucky-pick-canada-768w.avif` / `.webp` — new derivatives of the existing artwork.
- `__tests__/homepage-hero-preload.test.js`, `__tests__/homepage-hero-layout.test.js` — invariants for the ladder and the asset allowlist.

## Verification Plan

- `pnpm exec vitest run` (full suite), `pnpm exec tsc --noEmit`, `./freebuff-verify.sh`.
- Local production build measured for size (< 495 MiB) and re-measured with Lighthouse 13.6.0 at the PSI mobile and desktop presets, three mobile runs and repeat desktop runs, before and after.
- Browser verification at 390×844, 412×915 and 1440×900: console errors, failed requests, overflow, hero geometry, navigation, countdown presence, star-canvas animation, screenshots.

## Constraints

- No fidelity trade, no new dependency, no hosting/CDN/Workers/secret change, no change to the Milky Way or any animation.
- PSI itself measures the deployed public URL; this branch cannot change that measurement until it is merged and deployed.
