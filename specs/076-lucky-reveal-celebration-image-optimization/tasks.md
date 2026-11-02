# Tasks: Lucky Reveal Golden Maple-Leaf Celebration and AVIF/WebP Completion

**Feature**: `specs/076-lucky-reveal-celebration-image-optimization`

## Phase 1 — Setup

- [x] T001 Confirm the merged reveal (features 074/075), the homepage celebration in `app/homepage/ExploreLuckButton.js`, the audio helpers in `app/lib/audio.js`, the share-image renderer, and the public raster assets before changing anything.
- [x] T002 Confirm which raster assets the reveal and its share-image renderer actually load, and which already have AVIF/WebP variants.

## Phase 2 — Foundational

- [x] T003 Extract `MAPLE_LEAF_PATH`, `MAPLE_LEAF_MATRIX`, `loadConfetti` and the cached leaf-shape factory into `app/lib/mapleLeafConfetti.mjs`.
- [x] T004 Point `app/homepage/ExploreLuckButton.js` at the shared module with no behavioural change to the homepage effect.

## Phase 3 — User Story 1 (celebration)

- [x] T005 [US1] Add `app/lucky-reveal-celebration.jsx` with preloaded confetti pop, lazy `canvas-confetti` loading, side bursts from both edges, opening sparkle, settled-leaf finish with golden glow, and full cleanup.
- [x] T006 [US1] Render the celebration from `app/lucky-reveal-popup.js` with a delay derived from the final number's reveal animation, keeping the reveal panel above the static finish.
- [x] T007 [US1] Keep the existing golden shimmer and maple-leaf sparkle, and make sure the celebration never covers the numbers or blocks the close control.

## Phase 4 — User Story 2 (motion and sound)

- [x] T008 [US2] Skip the burst, sparkle, and audio under `prefers-reduced-motion: reduce`, leaving only the static finish.
- [x] T009 [US2] Fail silently when the audio cannot load or play, so the reveal is unaffected.

## Phase 5 — User Story 3 (image formats)

- [x] T010 [US3] Generate `public/BackgroundEraser_20260724_163638777.webp` from the existing PNG with `sharp`, keeping the PNG and the existing AVIF.
- [x] T011 [US3] Load the share-image logo AVIF → WebP → PNG in `app/lucky-reveal-share-image.js`, keeping the generated share image a PNG.
- [x] T012 [US3] Re-verify the reveal background's existing AVIF/WebP/JPEG `image-set()` order and that SVG artwork stays vector.

## Phase 6 — Tests and verification

- [x] T013 Add `__tests__/lucky-reveal-celebration.test.js` and `__tests__/components/LuckyRevealCelebration.test.jsx` covering the shared leaf path, celebration wiring and timing, reduced motion, audio reuse, canvas cleanup, and the logo format chain and assets.
- [x] T014 Run the focused reveal suites, the full `pnpm exec vitest run`, `pnpm exec tsc --noEmit`, `./freebuff-verify.sh`, and measure the production build size.
- [x] T015 Audit the complete final diff and record the result, plus anything unverified, in the single PR summary.

## Dependencies

- T003 blocks T004, T005 and T013.
- T005 and T006 must land together for the celebration to be reachable.
- T010 blocks T011.
- T014 runs after T013; T015 runs last.

## Implementation Strategy

One sequential pass: verify the baseline, extract the shared leaf module, build the celebration layer
and wire it into the popup, add the logo WebP and the ordered loader, then add the guard test, run the
verification gate, and audit the final diff.
