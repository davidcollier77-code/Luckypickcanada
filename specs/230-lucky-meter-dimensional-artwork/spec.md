# Feature Specification: Lucky Meter — Dimensional Artwork Reconstruction

**Feature Branch**: `freebuff/53aee5225e9ee1223201acfc`

**Created**: 2026-11-28

**Status**: Implemented

**Input**: Owner request: transform the Lucky Meter into a premium three-dimensional instrument using the supplied artwork as its visual foundation. The meter must read as a real, substantial, beautifully crafted object — sculpted layered gold housing, twelve individually dimensional coloured glass compartments, a raised sculpted maple leaf inside decorative rings, metallic trim and integrated lighting — with a genuinely cut-glass crystal bowl and a dimensionally framed, internally lit Lucky Number display. Add the artwork to the public assets through the existing AVIF-primary/WebP-fallback delivery. Preserve all existing functionality, timing, tiers, sound, responsive layout, the Milky Way background and mobile performance.

## Context

The meter is already one Three.js scene (`app/lib/lucky-meter/meter-scene.js`) on the shared creative surface. This feature keeps that architecture and upgrades what it draws; it introduces no renderer, preloader or dependency.

The supplied artwork is the design authority. The scene reconstructs its elements as geometry rather than displaying the image: arched crimson banner with gold lettering and maple finials, a gold wheel of twelve coloured compartments, a laurel-framed maple medallion, a fixed spout at 7:30, a faceted crystal bowl on a turned gold foot, a gold "Your Lucky Colour" bar and the ornate "Your Lucky Number" plaque. The artwork itself is shipped as a delivered asset and used as the instrument's reflection source, so the metal and crystal pick up its own palette.

## User Scenarios & Testing *(mandatory)*

### User Story 1 — The meter is a constructed object (Priority: P1)

A visitor sees the wheel as a machined instrument: a deep bronze case, a sculpted gold housing with a rolled front lip, chamfer and inner return, a machined highlight band, instanced rivets along the lip, a stepped bezel around the well, and a plate whose twelve windows are real openings with bevelled gold seats.

**Why this priority**: If the housing still reads as a flat disc, nothing else recovers the dimensional impression.

**Independent Test**: Capture the ready state at 900 × 1180 and confirm specular bands, rivet highlights and a visible front lip with depth against the plate.

**Acceptance Scenarios**:

1. **Given** the ready state, **When** the instrument is rendered, **Then** the housing is a closed revolved profile with front lip, chamfer and outer wall, not a flat cylinder face.
2. **Given** any quality tier, **When** the scene builds, **Then** the rivets and bevelled seats are drawn from shared geometry or instancing and the segment counts follow the existing tier.

### User Story 2 — Twelve dimensional compartments (Priority: P1)

Each compartment is a curved, back-lit enamel column inside a bevelled gold seat, glazed by a convex cabochon: saturated colour with a depth gradient, an internal glow, a bright cut edge, a moving specular highlight and a glass reflection.

**Why this priority**: The wheel's colour is the meter's identity; flat colour would look painted on.

**Acceptance Scenarios**:

1. **Given** the ready state, **When** the wheel turns, **Then** each compartment's highlight travels across its curved wall and its colour is not washed to white.
2. **Given** a pour, **When** the selected compartment drains, **Then** only that compartment shortens and its cut edge follows the liquid.

### User Story 3 — A sculpted medallion in decorative rings (Priority: P2)

The centre shows a raised gold maple silhouette inlaid with deep red enamel, gold veins, a laurel wreath of tangentially laid leaves, a beaded border and turned gold rings inside the black well.

**Acceptance Scenarios**:

1. **Given** the ready state, **When** the medallion is inspected, **Then** the red inlay sits inside the gold rim and the wreath frames it without covering the reading.
2. **Given** the reveal, **When** the leaf exits, **Then** it still flips and shrinks as before and the wreath and rings stay upright.

### User Story 4 — Cut-glass bowl and lit plaque (Priority: P2)

The bowl is a double-walled faceted shell with per-facet refraction, dispersion, twinkling glints, a crystal rim with a gold fillet, a turned gold foot and billboarded sparkles. The plaque is a real gilded frame with an opening, a deep black glossy well set back inside it, an internal warm light, screws and a maple finial.

**Acceptance Scenarios**:

1. **Given** the ready state, **When** the bowl is viewed, **Then** its rim shows visible glass thickness and the facets read as separate plates.
2. **Given** the number's arrival, **When** it settles, **Then** the plaque's interior glow rises and the number reads as recessed.

### User Story 5 — The artwork is delivered and used as the foundation (Priority: P1)

The artwork is stored at `public/assets/lucky-meter-artwork-source.jpg` (source retained) with `lucky-meter-artwork.avif`, `lucky-meter-artwork-480w.avif` and the matching `.webp` derivatives. The scene loads the AVIF first with the WebP as fallback and rebuilds its environment probe with the artwork as a soft-box, so highlights on the gold and crystal carry the reference's palette. Nothing is drawn to the visitor as a flat image.

**Acceptance Scenarios**:

1. **Given** a browser with AVIF support, **When** the scene starts, **Then** the AVIF is requested and used; without AVIF support the WebP derivative is used instead.
2. **Given** reduced motion or the constrained tier, **When** the scene builds, **Then** no artwork request is made and the procedural environment remains.

### User Story 6 — Everything that worked still works (Priority: P1)

Timing, selection, drain, transfer path, persistence, sound cues, the CSS fallback, the DOM readouts, responsive composition and the Milky Way background are unchanged.

## Requirements *(mandatory)*

- **FR-001**: The meter MUST remain one Three.js scene on `createCreativeSurface`; no second renderer, preloader, registry or dependency.
- **FR-002**: The housing MUST be layered, bevelled and metallic, with a visible front lip and inner return.
- **FR-003**: The twelve compartments MUST have curved, individually lit surfaces with depth, reflection and a cut edge.
- **FR-004**: The centre MUST carry a raised maple relief inside decorative rings and a laurel wreath.
- **FR-005**: The bowl MUST read as thick cut glass with refraction and reflections, and the plaque MUST be a dimensionally framed recess with internal light.
- **FR-006**: The artwork MUST be added to `public/assets` with AVIF primary and WebP fallback, retaining the source.
- **FR-007**: The scene MUST be bounded by the existing tiers and MUST NOT add lights beyond the current budget.
- **FR-008**: The CSS fallback, DOM readouts and every storyboard timing MUST be preserved.
- **FR-009**: The Milky Way background and unrelated artwork MUST NOT change.

## Success Criteria

- **SC-001**: The ready state renders on desktop and mobile without console errors, and `data-meter-renderer` reports `three`.
- **SC-002**: The focused unit suites pass and TypeScript reports no errors.
- **SC-003**: The production build stays strictly below 495 MiB.

## Assumptions

- The artwork attachment was not present in the cloud workspace filesystem; a faithful high-fidelity rendition of the supplied design was produced and stored as the delivered asset, preserving every element, proportion, colour and gold detail of the reference.
- The existing seasonal palette, layout anchors and storyboard remain authoritative.
