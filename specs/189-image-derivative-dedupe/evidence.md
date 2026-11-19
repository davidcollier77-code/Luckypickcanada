# Evidence: Reuse an Already Loaded Responsive Image Derivative

**Date**: 2026-11-18
**Branch**: `perf/image-derivative-dedupe`
**Base**: `main` at `782ac553ffdd0fbb3476e2cc403c3500f981ad4f`
**Task groups**: performance, testing
**Library sources consulted**:
- `.docs/testing/_google_eng-practices.md` — useful: focused regression tests around the changed adapter.
- `.docs/nextjs/_vercel_nextjs_docs.md` — not useful for this task (no routing or rendering change).

## Cause

- `components/DailyResonance.tsx:923` paints the sky through `srcSet` 640w/1024w/1400w; the browser picks the
  width for the rendered box.
- `components/CrystalBall/CrystalBall.tsx:665` paints the pedestal through `srcSet` 420w/716w.
- `app/lib/resource-readiness-manifest.js` registers one fixed derivative for background preparation:
  `/images/lucky-meter-night-sky-640w.avif` and `/assets/crystal-ball-pedestal-420w.avif`.
- `prepareImageResource` created a new `Image` unconditionally, so whenever the picture picked another width the
  same artwork was fetched a second time — the audit's "1024w followed by 640w" and "pedestal followed by 420w".

## Change

- `imageIdentity(url)` normalises absolute or root-relative URLs to a path and removes a `-<digits>w` token
  before the extension; directory and format stay part of the identity.
- `imageIdentityIsLoaded(identity)` checks the hub's own successful loads, rendered images
  (`complete && naturalWidth > 0`, `currentSrc`), and resource-timing entries that delivered bytes.
- The image adapter returns `{ reused: true, identity, reason: 'same-image-loaded' }` before creating an
  `Image`; `executeJob` settles it as `READY`, so experience readiness still completes.
- A successful hub load records the identity; `resetResourceReadiness()` clears it.
- The manifest gained a comment documenting the derivative-registration rule. No URL changed.

## Measured result

Production server (`next start` on port 3103), Chromium, cold context per route. `MASK_LOADED=1` hides the
signals the hub reads, so the same build behaves like the pre-fix hub and shows what would have been requested.

| Route | Viewport | Masked (pre-fix behaviour) | After | Bytes removed |
| --- | --- | --- | --- | --- |
| `/lucky-meter` | 1024x768@1x | 1024w + 640w = 429,071 B | 1024w only = 367,745 B | **61,326 B (−14.3%)** |
| `/lucky-meter` | 1440x900@1x | 1400w + 640w = 654,987 B | 1400w only = 593,661 B | **61,326 B (−9.4%)** |
| `/lucky-meter` | 1024x768@2x | 1400w + 640w = 654,987 B | 1400w only = 593,661 B | **61,326 B (−9.4%)** |
| `/crystal-ball` | 1024x768@2x | 716w + 420w = 723,677 B | 716w only = 656,971 B | **66,706 B (−9.2%)** |
| `/crystal-ball` | 1024x768@1x | 420w = 497,014 B | 420w = 497,014 B | 0 (hub URL = painted URL; HTTP cache) |
| `/crystal-ball` | 1440x900@1x | 420w = 497,014 B | 420w = 497,014 B | 0 (hub URL = painted URL; HTTP cache) |

The removed bytes are exactly the registered derivative's size (640w AVIF 61,326 B; 420w AVIF 66,706 B), which
confirms the second transfer is gone rather than deferred. The painted element was unchanged: `currentSrc`,
`naturalWidth` (1024/1400/420/716 as the browser chose) and rendered width matched in both runs, and no route
logged a console error.

## Checks

| Check | Result |
| --- | --- |
| `npx vitest run __tests__/resource-readiness-image-identity.test.js` | PASS — 7 tests |
| `npx vitest run __tests__/resource-readiness.test.js` | PASS — 27 tests |
| `npx vitest run` | PASS — 96 files / 995 tests |
| `pnpm exec tsc --noEmit` | PASS |
| `pnpm run build` | PASS |
| Clean production build size (`rm -rf .next && pnpm build && du -sb .next`) | 312,611,511 bytes = 298.13 MiB (limit 495 MiB) |
| `./freebuff-verify.sh` | PASS — exit 0 (Spec Kit gate, type check, build, docs tests) |
| Browser probe, unmasked / masked | PASS — see table above, 0 console errors |

## Limitations

- The masked run is a behavioural control inside the same build, not a separately deployed pre-fix build; the
  audit's own requests (1024w then 640w, pedestal then 420w) are the production baseline.
- At 1x viewports the Crystal Ball picture already selects the hub's 420w URL, so no network duplicate exists
  there; the change still avoids a redundant decode path and covers the 2x case the audit measured.
- The hub still registers one derivative per artwork; making the registration width-aware (matching the
  rendered box) would be a separate design change and is not needed to remove the duplicate.
- The probe used a local production server, so CDN/caching headers were not part of the measurement.
