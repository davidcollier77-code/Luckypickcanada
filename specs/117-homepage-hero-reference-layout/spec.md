# Feature Specification: Homepage hero reference layout

**Feature**: `specs/117-homepage-hero-reference-layout`
**Branch**: `freebuff/c2fffecd2a96680aacf6147a` (task branch `freebuff/c2fffecd2a96680aacf6147e`)
**Created**: 2026-11-08
**Status**: Implemented
**Input**: Master Work Request #1 — "Redesign the existing homepage hero layout to match the supplied visual reference while preserving the existing components, artwork, background, functionality, and all content below the hero."

## Overview

The supplied reference is a portrait poster of the Lucky Pick Canada hero: navigation pill at the
top, the gold-ringed maple-leaf emblem, the painted tagline, the gold wordmark, a maple-leaf divider,
a bordered welcome panel, a second maple-leaf divider, and then the painted "EXPLORE YOUR LUCK"
line and chevron. Today the hero stacks the navigation, a separate welcome block and one flattened
1024 × 1536 artwork whose painted copy still carries an older subtitle between the wordmark and the
divider.

This feature re-composes the existing hero into that reference order. It does not redraw anything:
the same single artwork file (AVIF/WebP, same `srcset`, same preload) is displayed through measured
row windows — emblem/tagline/wordmark, the maple-leaf divider (used above and below the panel), and
the "EXPLORE YOUR LUCK" line with its chevron — with the existing welcome block re-styled as the
bordered panel between the two dividers. The Milky Way backdrop, star canvas, gold shimmer, the
confetti/audio/eased-scroll "Explore Your Luck" control and everything below the hero are untouched.

## User Scenarios & Testing

### User story 1 — The hero reads in the reference order (P1)

A visitor loading `/` sees, top to bottom: the navigation pill, the emblem with its tagline and gold
wordmark, a gold maple-leaf divider, the welcome panel (brand line, "A fun, free place…" heading,
explanation, free CTA, "Free to enjoy · For fun and entertainment only"), a second identical divider,
then "EXPLORE YOUR LUCK" with its chevron.

**Independent test**: load `/`, assert the rendered DOM order of the measured slice classes, the two
divider slices and `.hero-welcome`, and capture desktop and mobile screenshots for comparison with
the reference.

**Acceptance scenarios**:

1. **Given** `/` at 1440 × 900, **When** it renders, **Then** the emblem slice, divider, welcome
   panel, divider and Explore slice appear in that order and every slice is non-empty.
2. **Given** `/` at 390 × 844, **When** it renders, **Then** the same order holds and the document
   has no horizontal overflow.

### User story 2 — Branding keeps its size on every viewport (P2)

The emblem and wordmark are not shrunk to fit a fixed screen height: the hero grows to its content
and the page scrolls, so brand artwork keeps the reference's scale on a phone as well as on desktop.

**Independent test**: measure the rendered wordmark slice height and the emblem slice height at
1440 × 900 and 390 × 844 and assert the artwork column width, not a viewport-height budget, decides
them (`height / width` equals the measured artwork ratio).

**Acceptance scenarios**:

1. **Given** a short desktop viewport, **When** the hero renders, **Then** the artwork column keeps
   its width-derived size and the hero simply extends below the fold.
2. **Given** a 390 px phone, **When** the hero renders, **Then** the art column is the full content
   width and the slices keep the painting's proportions (no letterboxing, no distortion).

### User story 3 — Existing behaviour is preserved (P1)

The navigation links, wording, the gold shimmer over ring/wordmark/Explore line, the star canvas and
Milky Way backdrop, and the Explore control's click/tap, map-leaf confetti, sound, eased scroll,
keyboard interruption, reduced-motion behaviour and accessible name all behave exactly as before.
Everything below the hero is unchanged.

**Independent test**: run the existing source guards and the browser suites that cover the shimmer,
the Explore control, the gold CTAs and mobile accessibility, and diff the files below the hero.

**Acceptance scenarios**:

1. **Given** the rendered hero, **When** the Explore control is clicked, **Then** confetti pixels are
   drawn, the chime request is made and the page eases to `#play-explore`.
2. **Given** `prefers-reduced-motion: reduce`, **When** the hero renders, **Then** the shimmer layers
   are hidden and the Explore control scrolls without animation.

## Requirements

- **FR-001**: `/` renders the reference order: navigation, emblem/tagline/wordmark, divider, welcome
  panel, divider, "EXPLORE YOUR LUCK" line with chevron.
- **FR-002**: The existing artwork file(s) are the only hero imagery; no new raster asset, no
  redraw, no distortion, and the reference image is never used as site imagery.
- **FR-003**: Keep the AVIF-first / WebP-second `<picture>` delivery, the single AVIF preload hint
  and the `srcset`/`sizes` values. The emblem image is eager/high priority; the three repeated
  decorative crops are lazy/auto so only the lead visual receives high fetch priority.
- **FR-004**: The welcome panel keeps its existing content and elements: the `h1` brand line, the
  "A fun, free place to explore what luck means to you." heading, the "more than fortune and fame"
  explanation, the gold `#play-explore` CTA and the entertainment-only note.
- **FR-005**: The maple-leaf divider is the painting's own divider band, reused above and below the
  panel, at its original proportions.
- **FR-006**: The hero no longer forces `100svh`; artwork size is derived from the column width, so
  branding is never shrunk to fit a fixed screen height.
- **FR-007**: Gold shimmer keeps sweeping the emblem ring, the wordmark and the "EXPLORE YOUR LUCK"
  line/chevron, stays decorative (`pointer-events: none`, `aria-hidden`), and is hidden for reduced
  motion.
- **FR-008**: The Explore control's hit target covers the full visible Explore slice and is at least
  44 px tall, while retaining its accessible name, confetti, sound, eased scroll, cooldown, keyboard
  interruption and reduced-motion path.
- **FR-009**: Navigation labels/destinations, all copy, and every section below the hero are
  unchanged; no route, API, dependency, payment, database or deployment configuration changes.
- **FR-010**: No horizontal overflow at 1440 × 900, 1024 × 768, 412 × 915 and 390 × 844, and no new
  control below the 44 px touch-target floor.

## Success Criteria

- **SC-001**: At 1440 × 900 and 390 × 844 the measured DOM order matches FR-001 and every slice
  renders with a height/width ratio equal to its measured artwork rows (±1 px rounding).
- **SC-002**: Screenshots at both sizes show the composition of the reference: emblem, tagline,
  wordmark, divider, bordered panel, divider, Explore line and chevron.
- **SC-003**: `scrollWidth === clientWidth` at both sizes; the Explore hit target spans the full
  Explore slice, remains centred, and is at least 44 px tall.
- **SC-004**: The click/confetti/sound/scroll and reduced-motion behaviour passes the existing
  browser coverage.
- **SC-005**: `./freebuff-verify.sh` exits 0, Vitest passes, `tsc --noEmit` exits 0 and the production
  build stays under the 495 MB hard maximum.
- **SC-006**: A regression guard fails if the divider,-panel,-divider order, the preserved content,
  the artwork delivery or the `100svh` removal regress.

## Assumptions and limits

- The reference is a composition guide, not a pixel-exact mock: the painted wordmark is taller than
  the reference's lettering, so vertical rhythm follows the reference while band sizes follow the
  painting.
- The reference's panel shows no button, but FR-004 requires keeping the existing free CTA; it stays
  inside the panel as the last action above the entertainment-only note.
- The painted subtitle band ("A CANADIAN DIGITAL ENTERTAINMENT EXPERIENCE…") is replaced by the
  welcome panel, exactly as the reference replaces it; the artwork file itself is unchanged.
- Verification uses the local production/dev build and emulated viewports; no production deploy is
  part of this task.
