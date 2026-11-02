# Feature Specification: Milky Way Background for the Lucky Reveal Experience

**Feature Branch**: `freebuff/22482c484ffb5108687ad98e`

**Created**: 2026-11-02

**Status**: Implemented — verification recorded in the PR report

**Input**: Replace the existing background inside the Lucky Reveal experience with the same
Milky Way / starfield background artwork used on the homepage. Remove the current reveal
background. Use the background artwork only; meteorites and shooting-star effects are not required.
Change nothing else.

## Context (verified before design)

- The Lucky Reveal experience is `LuckyRevealPopup` in `app/lucky-reveal-popup.js`. It is rendered
  after a paid reveal on the homepage (`app/homepage/HomePage.js`), from the free preview switch,
  and on the gift landing route (`app/reveal/[revealId]/page.tsx`).
- Its current background is self-contained in the component: a near-opaque blurred scrim
  (`rgba(2, 4, 8, 0.90)` plus `blur(12px)`), a dialog gradient that includes a lucky-colour radial
  glow, three animated aurora glow blobs, and nine twinkling star points, all animated with the
  `lucky-aurora-glow-1`, `lucky-aurora-glow-2`, and `lucky-twinkle` keyframes.
- The homepage background artwork is the fixed `.homepage-sky-backdrop` layer
  (`app/page.js` → `themes/default/homepage.css`), which paints
  `/assets/crystal-ball-bg-desktop.webp`, `.avif`, or `.jpeg` through CSS `image-set()` at
  `center 45% / cover`, with a subtle vertical darkening gradient and a `#02050a` base colour.
- The homepage also runs dynamic atmosphere (star canvases, shooting stars). That atmosphere is not
  part of the requested background artwork and is not reproduced here.

## User Scenarios & Testing

### User Story 1 — See the reveal over the homepage sky (Priority: P1)

A customer completes a Lucky Reveal and the reveal panel appears over the same Milky Way / starfield
artwork that the homepage uses, instead of the old reveal-only aurora background.

**Independent Test**: Render the popup and inspect its overlay: the background image is the homepage
artwork in AVIF/WebP/JPEG order, and the old aurora layers, twinkle stars, and their keyframes are
absent from the component.

**Acceptance Scenarios**:

1. **Given** the reveal popup opens, **Then** the full-viewport overlay paints the homepage Milky Way
   artwork with cover sizing and the homepage's 45% vertical focal point.
2. **Given** the reveal content, **Then** the panel keeps a dark scrim so the title, numbers, lucky
   colour, lucky day, and controls stay legible over the artwork.
3. **Given** the paid reveal, free preview, and gift landing routes, **Then** all three show the same
   background because they render the same component.

### Edge Cases

- A browser without `image-set()` support must still get a dark panel; the overlay base colour
  remains `#02050a`.
- The lucky-colour identity must survive the background change through the existing themed border
  glow and outer shadow.
- No meteor, shooting-star, or new animated layer may be added as part of this task.

## Requirements

- **FR-001**: The Lucky Reveal background MUST be the homepage Milky Way / starfield artwork, served
  from the same three asset variants the homepage uses (`webp`, `avif`, `jpeg`).
- **FR-002**: The current reveal-only background MUST be removed: the aurora glow layers, the
  twinkling star points, and the reveal background gradient with its lucky-colour radial glow.
- **FR-003**: Meteorite and shooting-star effects MUST NOT be added.
- **FR-004**: Reveal copy, numbers, lucky colour, lucky day, share control, map button, close control,
  keyboard behaviour, and animation timing MUST remain unchanged.
- **FR-005**: The popup MUST remain legible over the artwork through a dark panel scrim.
- **FR-006**: No payment, email, database, API route, dependency, or deployment file may change.

## Success Criteria

- **SC-001**: An automated source guard proves the popup references the homepage artwork and no
  longer contains the removed aurora background.
- **SC-002**: `pnpm exec tsc --noEmit`, the repository test suite, and `./freebuff-verify.sh` pass,
  with a production build below the 495 MB maximum.
- **SC-003**: The final diff contains only the popup background change, this feature's Spec Kit
  artifacts, the feature pointer, memory context, and the new guard test.

## Assumptions and Limits

- "The same background artwork used on the homepage" means the photographic Milky Way layer
  (`.homepage-sky-backdrop`), not the homepage's animated star canvases or shooting stars, which the
  request explicitly excludes as optional.
- The panel remains a translucent scrim rather than the opaque `0.90` overlay, because the artwork is
  now the background and must be visible.
- Browser-level screenshots of the reveal cannot be produced in this container; the change is
  verified by typecheck, the production build, the test suite, and a source guard.
