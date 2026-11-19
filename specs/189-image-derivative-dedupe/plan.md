# Implementation Plan: Reuse an Already Loaded Responsive Image Derivative

**Feature**: `specs/189-image-derivative-dedupe`

**Branch**: `perf/image-derivative-dedupe`

**Base**: `main` at `782ac553`

## Summary

The readiness hub prepares a fixed derivative for each artwork (`lucky-meter-night-sky-640w.avif`,
`crystal-ball-pedestal-420w.avif`). The route's responsive `<picture>` independently paints whichever width the
browser picks for the rendered box (1024w/1400w for the sky, 420w/716w for the pedestal). When the two choices
differ, the same artwork is downloaded twice. The fix gives every image an identity independent of its width
token and lets the image adapter reuse any derivative the page has already loaded.

## Technical Context

- **Runtime**: Next.js App Router 16.4.5, React 19.3.1, browser `Image`/resource timing.
- **Hub**: `app/lib/resource-readiness.js` (queue, adapters, snapshots); manifest in
  `app/lib/resource-readiness-manifest.js`.
- **Testing**: Vitest + jsdom, with an `Image` stub and stubbed `performance.getEntriesByType`.
- **Constraints**: no change to `<picture>`, `srcset`, `sizes`, layout, CSS, assets, manifest URLs or
  dependencies; production build below 495 MiB.

## Constitution Check

- **Preserve artwork and quality**: the painted element is never touched. Reuse removes a download, not a
  rendered pixel.
- **Smallest correct change**: one exported identity helper, one loaded-ness helper, one early return in the
  image adapter, one identity record on load, one reset line and one manifest comment.
- **Fail safe**: identity comparison includes directory and format, so it can never conflate two different
  pictures or serve WebP for an AVIF request. An unloaded derivative keeps the full request/decode/retry path.
- **Protected areas**: no payment, database, authentication, security, hosting, deployment, environment or
  secret file touched.
- **Evidence first**: the audit's two routes were reproduced in a production build, including a masked run that
  hides the loaded-ness signals to show what the old behaviour would request.

## Phase 0: Research (repository evidence)

1. `components/DailyResonance.tsx:923` renders the sky with
   `srcSet="…-640w.avif 640w, …-1024w.avif 1024w, ….avif 1400w"`; `components/CrystalBall/CrystalBall.tsx:665`
   renders the pedestal with `420w`/`716w`. Both are responsive `<picture>` elements.
2. The manifest registers the 640w and 420w variants for background preparation
   (`app/lib/resource-readiness-manifest.js:48-63`), which is the second request when the picture picked
   another width.
3. `prepareImageResource` had no awareness of the document, so it always created a new `Image`.
4. The snapshot intentionally exposes only state/label/attempts/error/reason, so reuse is proven by request
   absence and readiness state rather than a public `result` field.
5. Resource-timing entries and `img.currentSrc` are absolute URLs while manifest URLs are root-relative, so the
   identity helper normalises through `new URL(url, base).pathname`.

## Phase 1: Design

### Files

```
app/lib/resource-readiness.js                  # identity, loaded-ness check, adapter reuse
app/lib/resource-readiness-manifest.js         # comment documenting derivative reuse
__tests__/resource-readiness-image-identity.test.js
specs/189-image-derivative-dedupe/*
artifacts/image-derivative-20261118/*
```

### Contract

| Case | Before | After |
| --- | --- | --- |
| Painted 1024w, hub prepares 640w | 640w request + decode | reuse, `ready`, no request |
| Painted 716w, hub prepares 420w | 420w request + decode | reuse, `ready`, no request |
| Painted 420w, hub prepares 420w | second `Image`, HTTP cache hit | reuse, no `Image` |
| Artwork not painted | request + decode | unchanged |
| Different artwork/format/directory | request + decode | unchanged |

### Lifecycle

- `imageIdentity(url)` → path with `-<digits>w` removed before the extension.
- `imageIdentityIsLoaded(identity)` checks `loadedImageIdentities`, then `document.images`
  (`complete && naturalWidth > 0`), then resource-timing entries with delivered bytes.
- The adapter returns `{ reused: true, identity, reason: 'same-image-loaded' }` before creating an `Image`;
  `executeJob` marks it `READY`, so experience readiness and dependent gates complete normally.
- A successful hub load records the identity; `resetResourceReadiness()` clears the set.

## Re-evaluated Constitution Check

No visual, layout, asset or scheduling-policy change. Only redundant hub requests are removed. No violation.
