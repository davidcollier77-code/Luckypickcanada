# Feature Specification: Lucky Reveal Golden Maple-Leaf Celebration and AVIF/WebP Completion

**Feature Branch**: `freebuff/e948d67e670ae5e5d50291d1`

**Created**: 2026-11-02

**Status**: Implemented — verification recorded in the single PR summary

**Input**: Phase 1 of the Master Work Request. Finish the shared Lucky Reveal experience used by the
$1 Lucky Pick and the $1.99 Lucky Pick Gift with a golden maple-leaf celebration after the final
number, and complete AVIF/WebP coverage for every applicable raster asset in the reveal and its
static share image. Both six-number and seven-number reveals are in scope.

## Context (verified before design)

- Both paid experiences render one component: `app/lucky-reveal-popup.js` (`LuckyRevealPopup`),
  used by `app/homepage/HomePage.js`, the free preview switch, and the gift landing route
  `app/reveal/[revealId]/page.tsx`. Features 074 (Milky Way background) and 075 (row layout,
  colour swatch, golden shimmer, maple-leaf sparkle, single share control) are merged on `main`.
- The homepage celebration is `app/homepage/ExploreLuckButton.js`. It builds the maple-leaf particle
  from `MAPLE_LEAF_PATH` (the outline of `public/images/maple-leaf.svg`, viewBox `-2015 -2000 4030
  4030`), normalises it with `MAPLE_LEAF_MATRIX`, and fires `canvas-confetti` from a dedicated
  main-thread canvas because the site's Content Security Policy blocks canvas-confetti's default
  Blob worker. The audio is `playConfettiPop()` / `preloadConfettiPop()` in `app/lib/audio.js`, which
  plays the same-origin `/sounds/confetti-pop.wav`.
- `public/assets/crystal-ball-bg-desktop.{avif,webp,jpeg}` (the reveal background) already carry all
  three variants and are referenced AVIF → WebP → JPEG through CSS `image-set()`.
- The only raster asset the reveal's share-image renderer loads is the site logo,
  `/BackgroundEraser_20260724_163638777.png` in `app/lucky-reveal-share-image.js`. An `.avif`
  variant exists; **no WebP variant exists**, and the renderer only ever requests the PNG.
- All reveal decoration other than that logo is inline SVG (sparkle, settled leaves) or the shared
  maple-leaf vector path, so those stay vector.
- The generated share image must stay a PNG: it is handed to the device share panel and download
  path, where PNG is the compatible, opaque format.

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Celebrate the finished reveal (Priority: P1)

A customer watches the final number settle, and golden maple leaves burst in from both sides of the
screen, drift and rotate as they fall, and come to rest in a small glowing pile along the bottom,
while the existing confetti pop plays at the moment the burst starts.

**Why this priority**: This is the requested Phase 1 finish for the paid reveal; the reveal is the
product the customer paid for.

**Independent Test**: Open a 6 Pick and a 7 Pick reveal, confirm the celebration starts only after
the last number has landed, leaves enter from both edges, the sound plays with the burst, and the
result stays readable.

**Acceptance Scenarios**:

1. **Given** a six-number or seven-number reveal, **When** the final number finishes its reveal
   animation, **Then** golden maple leaves launch from the left and right edges of the viewport.
2. **Given** the celebration, **Then** the leaves use the same maple-leaf outline, gold palette and
   particle shape as the homepage Explore Your Luck burst, not a different leaf.
3. **Given** the celebration starts, **Then** `/sounds/confetti-pop.wav` plays at the same moment the
   first burst appears, from the already-preloaded sound instance.
4. **Given** the celebration, **Then** a brief opening golden sparkle and a soft bottom glow plus a
   small accumulation of settled leaves finish it, and the numbers, colour, and day stay readable.
5. **Given** the whole sequence, **Then** it completes in roughly two to three seconds.

### User Story 2 — Respect motion and sound preferences (Priority: P2)

A visitor who has reduced motion enabled, or whose browser blocks the sound, still gets the finished
reveal without being forced into animation or audio.

**Independent Test**: Load the reveal with `prefers-reduced-motion: reduce` and confirm no particle
burst, no sparkle sweep, no sound request playback, and that the results are immediately readable.

**Acceptance Scenarios**:

1. **Given** reduced motion, **Then** the burst, opening sparkle, and shimmer do not animate and no
   audio playback is requested.
2. **Given** reduced motion, **Then** the static settled-leaf finish may show without motion.
3. **Given** playback is refused or the file fails, **Then** the reveal still completes normally.

### User Story 3 — Every reveal raster asset is AVIF-first with a WebP fallback (Priority: P3)

The reveal background and the share-image renderer deliver AVIF first, WebP second, and an original
format where a compatibility fallback is required.

**Independent Test**: Inspect the reveal background and the share-image logo requests, and confirm
the format order and existing files.

**Acceptance Scenarios**:

1. **Given** the reveal overlay, **Then** the Milky Way artwork is requested AVIF → WebP → JPEG from
   the existing `public/assets/crystal-ball-bg-desktop.*` files, with no duplicate assets created.
2. **Given** the share-image renderer, **Then** it loads the logo AVIF → WebP → PNG, and the PNG
   fallback remains available.
3. **Given** inline SVG artwork and the maple-leaf vector path, **Then** they remain vector.
4. **Given** the generated shareable image, **Then** it is still produced and shared as a PNG.

### Edge Cases

- The reveal closes before the celebration delay elapses: the timer, canvas, and audio must not fire
  after unmount.
- A browser without `shapeFromPath` support: the celebration must still fire with a supported
  fallback shape rather than throwing.
- The logo AVIF or WebP fails to decode: the renderer must fall back to the next format and still
  draw the image, or keep the wordmark branding if none load.
- The celebration must not block the close control, keyboard focus, or scrolling of the reveal.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: After the final number of a six- or seven-number reveal settles, a golden maple-leaf
  celebration MUST launch from both the left and right sides of the screen.
- **FR-002**: The celebration MUST reuse the homepage's maple-leaf path, gold colours and particle
  shape from one shared module, and MUST NOT introduce different artwork.
- **FR-003**: The celebration MUST play the existing `/sounds/confetti-pop.wav` through the existing
  `playConfettiPop`/`preloadConfettiPop` helpers, synchronised with the burst.
- **FR-004**: The celebration MUST include a brief opening sparkle, a subtle golden finishing effect
  and a small accumulation of fallen leaves near the bottom, without obscuring the numbers.
- **FR-005**: The complete celebration MUST last approximately two to three seconds.
- **FR-006**: The celebration MUST NOT animate or play sound under `prefers-reduced-motion: reduce`,
  and MUST NOT force playback when audio is unavailable.
- **FR-007**: Every applicable raster asset in the reveal and its share-image renderer MUST have
  AVIF and WebP variants, served AVIF first, WebP second, original format last.
- **FR-008**: The existing Milky Way background MUST keep using its existing AVIF, WebP and JPEG
  assets; no duplicate background assets are created.
- **FR-009**: SVG artwork MUST remain vector, and the generated shareable image MUST remain PNG.
- **FR-010**: Number generation, stored results, number order, the reveal layout, copy, gold styling,
  sharing, Stripe, checkout, gift email, Resend, databases, and the Little Luck Map MUST NOT change.

### Key Entities

- **Reveal**: The stored `{game, numbers, luckyColor, luckyDay}` result; presentation only.
- **Celebration**: The transient particle burst plus the settled-leaf finish rendered over the reveal.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Both a 6 Pick and a 7 Pick reveal launch leaves from both sides after the last number,
  and the celebration finishes within three seconds.
- **SC-002**: The reveal requests the shared confetti pop and the homepage leaf shape rather than a
  duplicated copy.
- **SC-003**: 100% of applicable raster assets in the reveal and its share-image renderer have AVIF,
  WebP and (where required) original-format files, and are requested in that order.
- **SC-004**: `./freebuff-verify.sh`, the repository test suite and the type check pass, and the
  production build stays below the 495 MB maximum.

## Assumptions

- "Existing sound settings" means the site's existing audio behaviour: no in-app mute preference is
  stored anywhere in the repository, so there is no saved preference to read. Playback stays
  best-effort and silent failure is acceptable.
- The celebration reuses the existing `canvas-confetti` dependency; no new dependency is added.
- The settled leaves are inline SVG built from the same maple-leaf path, so no raster leaf asset is
  needed for the finish.
