# Implementation Plan: Lucky Reveal Golden Maple-Leaf Celebration and AVIF/WebP Completion

**Feature**: `specs/076-lucky-reveal-celebration-image-optimization`

**Branch**: `freebuff/e948d67e670ae5e5d50291d1`

## Summary

Extract the homepage's maple-leaf confetti path, shape factory and lazy loader into one shared
module, add a `LuckyRevealCelebration` layer to the shared reveal that fires the same leaf burst from
both screen edges after the final number, plays the preloaded homepage confetti pop at burst time,
and settles a small glowing pile of the same leaf outline at the bottom. Give the share-image logo a
WebP variant and load it AVIF → WebP → PNG.

## Technical Context

- **Stack**: existing Next.js App Router client components, `canvas-confetti` (already a dependency),
  Howler through `app/lib/audio.js` (already used by the homepage), inline CSS keyframes, inline SVG.
- **Files changed**:
  - new `app/lib/mapleLeafConfetti.mjs` — single source for the maple-leaf path, matrix, confetti
    module loader and shape cache;
  - new `app/lucky-reveal-celebration.jsx` — the celebration layer;
  - `app/lucky-reveal-popup.js` — renders the celebration and stacks it over the panel;
  - `app/homepage/ExploreLuckButton.js` — imports the shared module instead of owning a copy;
  - `app/lucky-reveal-share-image.js` — AVIF → WebP → PNG logo loading;
  - new `public/BackgroundEraser_20260724_163638777.webp`;
  - new `__tests__/lucky-reveal-celebration.test.js` and
    `__tests__/components/LuckyRevealCelebration.test.jsx`;
  - Spec Kit artifacts and `.specify/feature.json`.
- **Reused pieces**: `MAPLE_LEAF_PATH`/`MAPLE_LEAF_MATRIX` and the `shapeFromPath` normalisation from
  `ExploreLuckButton.js`, the main-thread canvas technique required by the site's CSP, `playConfettiPop`
  and `preloadConfettiPop` from `app/lib/audio.js`, the existing shimmer and maple sparkle from
  feature 075, the existing `image-set()` Milky Way backdrop, and the existing reveal shape from
  `buildLuckyReveal`.
- **No new dependency, route, API, database, environment, or deployment change.**

## Constitution Check

- **I. Single Source of Truth** — `AGENTS.md` remains authoritative; no governance change.
- **II. Verify Before Acting** — homepage effect, audio helpers, reveal popup, share renderer and
  public assets were read before planning; the missing WebP logo variant was confirmed from the
  asset listing.
- **III. Implementation Sequence** — specify → plan → tasks → implement → test → diff audit → PR summary.
- **IV. Protect Core Systems** — checkout, Stripe, gift email, Resend, database, environment,
  deployment and the Little Luck Map are untouched. The reveal only presents the stored result.
- **V. Resource Conservation** — one shared module instead of a second copy of the leaf; no new
  dependency; `.docs/` read-only.
- **VI. Accessibility** — the celebration and settled leaves are `aria-hidden` and
  `pointer-events: none`, the close control keeps focus, and reduced-motion visitors get no animation
  or sound.
- **VII. Image delivery** — MDN's image-format guide was consulted: AVIF has the best compression but
  is not universally decodable and requires `<picture>`/fallback handling, WebP is broadly supported
  and should be second, and PNG remains the lossless/compatibility choice. That is why the logo keeps
  its PNG fallback and the generated share image stays PNG.

**Gate result**: PASS.

## Phase 0 — Research

Local source answered the design questions; no external research was required beyond the mandated
MDN image-format reference for the format strategy (`.docs/polishing/_websites_mdn_image_types.md`,
routed from `/websites/mdn_image_types`). The MDN table confirms AVIF and WebP browser support with
the explicit requirement to provide a compatibility fallback for AVIF, which the ordered logo chain
implements.

## Phase 1 — Design

### Shared maple-leaf confetti (`app/lib/mapleLeafConfetti.mjs`)

- `MAPLE_LEAF_PATH` and `MAPLE_LEAF_MATRIX` move verbatim from `ExploreLuckButton.js`.
- `loadConfetti()` keeps the cached, retry-on-failure dynamic `import('canvas-confetti')`.
- `createMapleLeafShape(confettiLib)` keeps the cached `shapeFromPath` result and returns `null`
  when the browser cannot build path shapes.

### Celebration (`app/lucky-reveal-celebration.jsx`)

- Mount-time preload of `/sounds/confetti-pop.wav` through `preloadConfettiPop()` and a background
  `loadConfetti()` so the burst is instant when it fires. Both are skipped under reduced motion.
- One timer at `startDelayMs`, supplied by the popup as the last number's animation end plus a short
  breath, so the celebration follows the final number rather than the popup opening.
- At fire time: set the celebrating state (opening sparkle + settled leaves), call
  `playConfettiPop()` in the same tick as the particle bursts, and fire symmetric bursts from
  `origin: {x: 0, y: 0.82}` (angle 62, inward) and `origin: {x: 1, y: 0.82}` (angle 118, inward) plus
  two wider, slower follow-ups, using the homepage's gold palette, leaf shape, `ticks`, gravity and
  decay so leaves arc in, drift, rotate and settle downward.
- Dedicated main-thread canvas (`create(canvas, { resize: true, useWorker: false })`) because the CSP
  blocks canvas-confetti's Blob worker; the canvas is removed on unmount and the instance reset.
- Reduced motion renders only the static settled-leaf finish: no burst, no sparkle, no audio.
- The settled finish is a bottom band of the same maple-leaf outline in the gold palette over a soft
  radial gold glow; it is `aria-hidden`, `pointer-events: none`, and never covers the numbers.

### Reveal popup (`app/lucky-reveal-popup.js`)

- Import and render `<LuckyRevealCelebration startDelayMs={...} />` inside the existing overlay, with
  the dialog raised above the static finish and the celebration above the panel so the burst is
  visible on phones as well as desktops.
- The delay is `startNumbersDelay + (numItems - 1) * 0.35 + 0.95` seconds, so six and seven number
  reveals both celebrate after their own last number.
- Nothing else in the popup changes: numbers, rows, swatch, shimmer, sparkle, copy, controls, map CTA.

### Share-image logo (`app/lucky-reveal-share-image.js`, assets)

- Add `public/BackgroundEraser_20260724_163638777.webp` generated from the existing PNG with the
  repository's `sharp` dev dependency; keep the PNG and the existing AVIF.
- Replace the single `LOGO_SRC` with an ordered source list and a loader that tries each format,
  returning the first that decodes; if none load, the header falls back to the wordmark as before.
- The canvas output remains `image/png`.

### Tests`__tests__/lucky-reveal-celebration.test.js` guards: one shared maple-leaf path identical to
`public/images/maple-leaf.svg`, both experiences importing it, side origins, gold palette, confetti
pop preload/play, reduced-motion suppression, settled-leaf finish, celebration timing window, popup
wiring, AVIF/WebP/PNG logo chain and asset existence, background variants untouched, PNG share output,
and that no reveal module generates numbers.
`__tests__/components/LuckyRevealCelebration.test.jsx` renders the real component with a stubbed
particle library and fake timers to prove the delay, the single pop at launch, the two edge origins,
the settled leaves, reduced-motion suppression, and canvas cleanup on unmount.
