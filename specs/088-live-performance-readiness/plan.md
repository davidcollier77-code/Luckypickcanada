# Implementation Plan: Live-Traffic Performance Readiness

**Feature**: `specs/088-live-performance-readiness`
**Branch**: `freebuff/c1e1aaa103045da1dc1fde0f`

## Technical Context

- Next.js App Router (16.4.3) on Cloudflare Workers via OpenNext; homepage is
  statically prerendered (`dynamic = 'force-static'`).
- Images are pre-optimized files in `public/` and delivered with the native
  `<picture>` element: AVIF source first, WebP source second, WebP `<img>`
  fallback. `next.config.mjs` sets `images.unoptimized`, so Next.js image
  optimization is not in play.
- The homepage hero (`app/homepage/Hero.js`) additionally emits React
  `preload()` resource hints for the hero artwork.

## Baseline Evidence (measured 2026-11-04)

Harness: `artifacts/perf-audit/probe.cjs` (Playwright Chromium 153, cold context,
mobile 390x844 @3x and desktop 1440x900) against the local production build
(`pnpm build` + `next start`, 48 requests).

| Metric | Mobile | Desktop |
| --- | --- | --- |
| Hero AVIF transferred | 198.6 KiB | 198.6 KiB |
| Hero WebP transferred | 293.1 KiB | 293.1 KiB |
| Total transfer | 1,982.6 KiB | 2,142.3 KiB |
| LCP | 492 ms | recorded in `baseline-desktop.json` |
| CLS | 0 | 0 |

Both hero variants are transferred in a browser that supports both formats.
Cause: `Hero.js` emits two `preload()` image hints — one `type="image/avif"`,
one `type="image/webp"`. A preload hint's `type` only filters formats the
browser cannot decode; it cannot express "whichever source the `<picture>`
element will choose". Chromium therefore fetches both hinted URLs, and the
`<picture>` then paints the AVIF. ~293 KiB per view (about 30% of all image
bytes, 15% of total transfer) is downloaded and never displayed.

## Decision

Emit a single early resource hint for the AVIF artwork and keep the existing
`<picture>` sources (AVIF → WebP) plus the WebP `<img>` fallback unchanged.

- AVIF is the format modern browsers actually paint (MDN: supported in Chrome,
  Edge, Opera, Safari, Firefox), so the hint still gives the LCP artwork early,
  high-priority discovery for the large majority of visitors.
- Browsers that cannot decode AVIF never match the AVIF hint (the `type`
  filter works for that case); they pick the WebP `<source>` from the markup,
  which sits in the first screen of the initial HTML, and paint as before.
- Nothing about the artwork, quality, dimensions, layout, or fallback order
  changes; only the redundant network hint is removed.

### Alternatives considered

1. **Preload neither format.** Loses early high-priority discovery of the LCP
   image for every visitor — rejected.
2. **Keep both hints.** This is the current defect: 293 KiB of waste per view.
3. **Client-side format detection before hinting.** Requires JavaScript and
   delays discovery past CSS/JS execution — larger regression than the
   fallback-only delay for non-AVIF browsers.
4. **Preload the WebP hint only.** Makes the AVIF-capable majority download and
   use the 293 KiB WebP instead of the 199 KiB AVIF — a net loss.

## Scope

Files changed:

- `app/homepage/Hero.js` — remove the WebP preload hint, document why only one
  format is hinted.
- `__tests__/homepage-hero-preload.test.js` — new guard: exactly one hero
  preload, it is AVIF with high priority and responsive `imageSrcSet`; AVIF and
  WebP `<picture>` sources and the WebP fallback remain; both files exist.
- `specs/088-live-performance-readiness/{spec,plan,tasks}.md` +
  `checklists/requirements.md`; `.specify/feature.json` pointer.
- `artifacts/perf-audit/` — probe plus baseline and post-change reports.
- `PR_SUMMARY.md` — canonical report.

Not changed: artwork files, image encoding, CSS, layout, fonts, scripts,
routes, APIs, payments, email, database, deployment configuration.

## Verification Plan

1. `pnpm exec vitest run __tests__/homepage-hero-preload.test.js` — new guard.
2. Rebuild and re-run the probe on both profiles; compare hero requests, total
   transfer, LCP, CLS against the baselines; confirm exactly one hero variant
   is requested and the LCP element is still the AVIF hero.
3. Screenshot parity at 1440x900 and 390x844 against baseline screenshots.
4. `./freebuff-verify.sh` (Spec Kit gate, typecheck, production build,
   refresh-docs tests) and record the measured build size.
5. Full `pnpm exec vitest run` to confirm no unrelated regression.

## Risks

- Non-AVIF browsers lose the early hint for the fallback artwork; they still
  receive and display WebP from the `<picture>` markup. This affects browsers
  older than Safari 16.4 / Firefox 93 and is the accepted trade-off for
  removing ~293 KiB from every other visit.
- Measurements come from a local production build, not the live Cloudflare
  edge; markup and assets are identical, so the request pattern is
  representative.
