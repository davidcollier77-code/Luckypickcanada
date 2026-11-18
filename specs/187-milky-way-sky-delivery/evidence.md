# Evidence: Render-Time Milky Way Sky Delivery

**Date**: 2026-11-18
**Branch**: `perf/sky-delivery`
**Base**: `main` at `782ac553ffdd0fbb3476e2cc403c3500f981ad4f`
**Task groups**: polishing (image delivery/performance), testing
**Library sources consulted**:
- `.docs/polishing/_websites_mdn_image_types.md` — useful: format order and fallback semantics for AVIF/WebP/JPEG
  delivery informed keeping the existing three-format `<picture>` chain.
- `.docs/polishing/_lovell_sharp.md` — useful: `sharp.avif()` quality/effort options used for the re-encode.
- `.docs/polishing/_vercel-labs_agent-skills_react-best-practices.md` — useful: keeping the new layer a
  server-rendered component with no client state.

## Audit baseline

| Profile | Asset the CSS fetched | Body bytes | Audit transfer | Mechanism |
| --- | --- | --- | --- | --- |
| Mobile (≤820 px) | `/assets/crystal-ball-bg-mobile.avif` | 142,777 | 143,077 | CSS `image-set()` |
| Desktop | `/assets/crystal-ball-bg-desktop.webp` | 427,992 | — | CSS `image-set()` |

The stylesheet requested the artwork while applying, before hydration, so the adaptive plan had no influence on
it. `themes/default/homepage.css` was the only sky reference besides the reveal overlay's inline `image-set()`.

## Change

- `app/components/SkyBackdrop.js` renders the same artwork through `<picture>` with `<source media>` at the
  existing 820 px breakpoint and AVIF → WebP → JPEG order. `loading="eager"`, `fetchPriority="low"`,
  `decoding="async"`, `alt=""`, `aria-hidden="true"`, and the intrinsic 1920x1280 box.
- The gradient that was the top background layer became `.homepage-sky-backdrop::before` (z-index 1) and the
  glow stayed `::after` (z-index 2); the artwork paints between them. `object-position` preserves `center 45%`
  and `center 42%` on mobile.
- `public/assets/crystal-ball-bg-mobile.avif` was re-encoded from `crystal-ball-bg-mobile.jpeg` at quality 52
  (115,765 bytes, PSNR 35.28 dB against the master) and `crystal-ball-bg-desktop.avif` from its JPEG master at
  quality 55 (315,369 bytes, PSNR 36.88 dB against the master; the previous WebP measured 36.90 dB).
  Dimensions are unchanged (1200x800 and 1920x1280).

## Measured result (production server, Chromium)

`node artifacts/milky-way-20261118/probe.mjs` against `next start` on port 3101:

| Profile | Route | Chosen artwork | Natural size | Bytes | Overflow | Console errors |
| --- | --- | --- | --- | --- | --- | --- |
| mobile 390x844 @3x | `/` | mobile.avif | 1200x800 | 115,765 | 0 | 0 |
| mobile 390x844 @3x | `/crystal-ball` | mobile.avif | 1200x800 | 115,765 | 0 | 0 |
| mobile 390x844 @3x | `/map` | mobile.avif | 1200x800 | 115,765 | 0 | 3 (Lucky Stories API 500; no database in this workspace) |
| desktop 1440x900 | `/` | desktop.avif | 1920x1280 | 315,369 | 0 | 0 |
| desktop 1440x900 | `/crystal-ball` | desktop.avif | 1920x1280 | 315,369 | 0 | 0 |
| desktop 1440x900 | `/map` | desktop.avif | 1920x1280 | 315,369 | 0 | 3 (Lucky Stories API 500; no database in this workspace) |

Computed focal treatment was `50% 42%` on mobile and `50% 45%` on desktop, matching the previous
`center 42%` / `center 45%`.

- Mobile: 142,777 → 115,765 body bytes, **−27,012 B (−18.9%)**; audit transfer 143,077 → ~116,065 (−18.9%).
- Desktop: 427,992 → 315,369 body bytes, **−112,623 B (−26.3%)**.
- The reveal overlay also reads `/assets/crystal-ball-bg-desktop.avif`, so it drops from 474,841 to 315,369
  bytes (−33.6%) without a code change.

## Checks

| Check | Result |
| --- | --- |
| `npx vitest run __tests__/milky-way-sky-delivery.test.js __tests__/lucky-reveal-background.test.js` | PASS — 13 tests |
| `npx vitest run` | PASS — 96 files / 995 tests |
| `pnpm exec tsc --noEmit` | PASS |
| `pnpm run build` | PASS |
| Clean production build size (`rm -rf .next && pnpm build && du -sb .next`) | 312,863,961 bytes = 298.37 MiB (limit 495 MiB) |
| `./freebuff-verify.sh` | PASS — exit 0 (Spec Kit gate, type check, production build, docs tests; 48 updater tests passed) |

## Limitations

- PSNR is a signal-to-noise proxy, not a perceptual metric; the mobile encode is 2.8 dB below the previous file
  on a decorative layer that also carries a dark gradient, a screen-blended glow and a `contrast(1.04)` filter.
- The `/map` console errors come from the Lucky Stories API requiring a database this workspace does not have;
  they are unrelated to the backdrop and reproduce on the base revision.
- The visual Playwright suite was not run end to end in this workspace; the single sky assertion was updated to
  read the rendered `currentSrc` rather than the removed CSS background.
