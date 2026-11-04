# Feature Specification: Homepage Navigation Consolidation and Golden Shimmer

**Feature Branch**: `freebuff/d1d198f83bbd7f8a37f69b23`
**Created**: 2026-11-04
**Status**: Draft
**Input**: Master Work Request #1 — "Remove the redundant Lucky Map navigation link and retain one Lucky Stories link pointing to the existing Stories homepage. Do not remove the underlying map functionality. Add a subtle, visibly moving golden-light shimmer to the prominent homepage gold lettering, the Explore Your Luck text and downward arrow, and the gold ring around the emblem."

## User Scenarios & Testing *(mandatory)*

### User Story 1 — One clear stories destination in the hero navigation (Priority: P1)

A visitor looking at the homepage hero navigation currently sees two separate
stories destinations ("Community Stories" and "Lucky Map"). They cannot tell
which one to choose, and the map label suggests a different subject from the
stories it actually leads to. After the change, the hero navigation offers one
stories link, named after the site's own stories section, so the visitor knows
exactly where community stories live.

**Why this priority**: Navigation clarity is the first thing a visitor meets on
the busiest page, and the duplicate entry is the specific defect the task names.

**Independent Test**: Load the homepage, read the hero primary navigation, and
confirm it contains exactly one stories link, labelled "Lucky Stories", that
resolves to the existing Lucky Stories area of the homepage. Confirm no link in
that navigation is labelled "Lucky Map".

**Acceptance Scenarios**:

1. **Given** the homepage hero primary navigation, **When** it renders, **Then**
   it contains exactly one stories link and that link is labelled "Lucky Stories".
2. **Given** that stories link, **When** a visitor activates it, **Then** it
   resolves to the existing Lucky Stories area of the homepage (`#community-stories`).
3. **Given** the same navigation, **Then** no link in it is labelled "Lucky Map".
4. **Given** the site's map functionality, **Then** the Lucky Map route still
   serves the map of Canada and the homepage's "EXPLORE LUCKY STORIES" call to
   action still links to it, so the map is not removed or hidden behind the change.

### User Story 2 — Golden light travels over the hero's gold artwork (Priority: P1)

A visitor sees the hero artwork's gold wordmark, its "EXPLORE YOUR LUCK" line
and downward arrow, and the gold ring around the emblem. They are currently
static. After the change, a subtle band of golden light drifts across those gold
areas, so the hero looks alive without any change to the artwork itself.

**Why this priority**: The visual request is the substance of the task and must
be visibly true on the rendered page, not only in source.

**Independent Test**: Load the homepage in a browser at desktop and mobile
sizes, capture the hero twice a few seconds apart, and confirm the gold
wordmark, the Explore Your Luck line/arrow, and the emblem's gold ring each show
a moving gold highlight, with no change to the artwork, wording, colours or
layout.

**Acceptance Scenarios**:

1. **Given** the homepage has loaded, **When** the visitor watches the hero,
   **Then** a moving golden highlight is visible on the gold wordmark, on the
   "EXPLORE YOUR LUCK" line and its downward arrow, and along the gold ring.
2. **Given** the same hero, **Then** the artwork, its wording, its colours and
   the layout are unchanged, and the highlight is decorative only.
3. **Given** a visitor who prefers reduced motion, **Then** no shimmer animation
   appears and the hero is identical to today.
4. **Given** the "Explore Your Luck" control, **When** it is clicked, tapped or
   keyboard-activated, **Then** it still fires its confetti, its sound and its
   eased scroll exactly as before; only the decoration is added.

### User Story 3 — Image delivery is not disturbed (Priority: P1)

The homepage hero artwork is delivered AVIF-first with a WebP fallback. The
decorative work must not alter formats, quality, fallbacks, preloads or any
image-delivery configuration.

**Why this priority**: The task states this as a hard constraint, and the hero is
the largest contentful paint on the site's busiest page.

**Independent Test**: Inspect the served homepage markup and confirm the AVIF
`<source>`, the WebP `<source>` and the WebP `<img>` fallback are unchanged, that
only the existing single AVIF preload hint is emitted, and that no image file,
quality setting or delivery configuration changed.

**Acceptance Scenarios**:

1. **Given** the served homepage, **Then** the `<picture>` sources remain AVIF
   first, WebP second, with the WebP `<img>` fallback.
2. **Given** the served homepage, **Then** the document emits the same single
   AVIF preload hint as before and no additional image hint.
3. **Given** the artwork files, **Then** no image file, format, quality or
   delivery configuration is added, removed or regenerated.

### Edge Cases

- **Width-limited artwork**: on narrow or short viewports the artwork is
  letterboxed inside its container; the decorative highlight must still track
  the painted artwork rather than the container, so it never drifts onto the
  page background.
- **Reduced motion**: the highlight disappears entirely rather than freezing
  mid-sweep, so no static artefact is left on the artwork.
- **Older engines without container-query support**: the decoration must fail
  silently — no layout shift, no missing content, no console error.
- **Page zoom and large text**: no horizontal overflow and no interference with
  the hero's existing hit target.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The homepage hero primary navigation MUST contain exactly one
  stories link.
- **FR-002**: That link MUST be labelled "Lucky Stories" and MUST resolve to the
  existing Lucky Stories area of the homepage (`#community-stories`).
- **FR-003**: The homepage hero primary navigation MUST NOT contain a link
  labelled "Lucky Map".
- **FR-004**: The Lucky Map route and the homepage's "EXPLORE LUCKY STORIES"
  call to action that reaches it MUST remain in place; the map's functionality
  MUST NOT be removed, disabled or replaced.
- **FR-005**: The hero MUST show a subtly moving golden highlight across the
  prominent gold wordmark lettering.
- **FR-006**: The hero MUST show a subtly moving golden highlight across the
  "EXPLORE YOUR LUCK" line and its downward arrow.
- **FR-007**: The hero MUST show a subtly moving golden highlight along the gold
  ring around the emblem.
- **FR-008**: The artwork, wording, colours and layout MUST be preserved; the
  highlight is decoration layered above the existing artwork and MUST NOT
  intercept pointer, tap or keyboard input.
- **FR-009**: The "Explore Your Luck" control MUST keep its existing click, tap,
  keyboard activation, confetti, sound and eased scroll behaviour unchanged.
- **FR-010**: `prefers-reduced-motion: reduce` MUST remove the shimmer animation.
- **FR-011**: AVIF-first delivery, the WebP fallback, the existing preload hint,
  image files, quality settings and delivery configuration MUST be unchanged.

### Key Entities *(include if feature involves data)*

None. The change is presentational markup, styling and one navigation entry; no
data, entity, schema or stored value is introduced or modified.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: The hero primary navigation contains exactly one stories link and
  zero "Lucky Map" links (counted in the served homepage markup).
- **SC-002**: The "Lucky Stories" link resolves to the existing Lucky Stories
  area of the homepage.
- **SC-003**: The Lucky Map route still responds successfully and the homepage's
  "EXPLORE LUCKY STORIES" call to action still points to it.
- **SC-004**: Two browser captures of the hero taken a few seconds apart differ
  measurably in all three decorated regions (wordmark, Explore Your Luck
  line/arrow, gold ring) while the underlying artwork is unchanged.
- **SC-005**: With reduced motion enabled, the shimmer animation is absent and
  the hero is visually identical to today.
- **SC-006**: The document still emits exactly one hero image preload hint, with
  AVIF first and the WebP fallback intact.
- **SC-007**: The production build stays within the repository's 495 MB limit.

## Assumptions

- "The existing Stories homepage" is read as the Lucky Stories area that already
  exists on the homepage (the `#community-stories` section, headed "Lucky
  Stories"), which is where the current "Community Stories" hero link already
  points. The map keeps its own page (`/map`), reached through the homepage's
  "EXPLORE LUCKY STORIES" call to action, the footer navigation and its direct
  route, so no map functionality is lost.
- Only the hero primary navigation on the homepage is in scope. The footer
  navigation's "Lucky Map" entry is a different navigation surface and is left
  untouched.
- The shimmer is a decorative light effect implemented in the existing
  stylesheet and hero markup; it introduces no dependency, asset or artwork
  change.
- Default motion policy: the shimmer animates for visitors who have not asked
  for reduced motion.
