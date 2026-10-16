# Feature Specification: Premium Golden Maple-Leaf Assets

**Feature Branch**: `polish/crystal-ball-golden-leaf-assets`

**Created**: 2026-10-16

**Status**: In Progress

**Input**: User authorization to replace the Crystal Ball's inline SVG cursor leaf with polished raster artwork delivered as AVIF/WebP, with a compatible fallback, and reuse the same artwork for the falling-leaf animation.

## User Scenarios & Testing

### User Story 1 — Consistent premium golden leaf (Priority: P1)

A visitor asks the Crystal Ball a question and sees one polished gold maple leaf follow the fortune text, while an identically styled copy travels into the answer panel before the text reveal begins.

**Why this priority**: The cursor and falling copy are prominent details in the existing reveal. A consistent, high-quality leaf improves the main interaction without redesigning the page.

**Independent Test**: Run the Crystal Ball interaction test, inspect the cursor and flying leaf, and verify both use the same supported image sources.

**Acceptance Scenarios**:

1. **Given** the Crystal Ball page is loaded in a modern browser, **When** the cursor or flying leaf is shown, **Then** the AVIF source is preferred and WebP is available as the next source.
2. **Given** the browser cannot use either raster source, **When** the leaf is rendered, **Then** the transparent SVG fallback is used.
3. **Given** a fortune is requested, **When** the reveal runs, **Then** the original Crystal Ball artwork remains unchanged and the separate flying leaf is the same asset as the text cursor.
4. **Given** reduced motion is enabled, **When** a fortune is returned, **Then** the existing reduced-motion behavior continues to skip the decorative flight.

## Requirements

- **FR-001**: Provide a transparent golden maple-leaf artwork with AVIF, WebP, and SVG fallback resources.
- **FR-002**: The shared GoldenLeaf component must prefer AVIF, then WebP, then the SVG fallback.
- **FR-003**: Both cursor and flying-leaf uses must render through the shared GoldenLeaf component.
- **FR-004**: Preserve decorative/aria-hidden semantics and the existing cursor and flight CSS classes.
- **FR-005**: Preserve the reveal order, repeated questions, reduced-motion behavior, Crystal Ball artwork, and page background.
- **FR-006**: Add Playwright assertions for source order, fallback path, image load, and shared usage.

## Constraints

- Do not add runtime dependencies or change APIs, database state, the Crystal Ball artwork, background, wording, or reveal state machine.
- Keep transparent edges and a usable vector fallback.
- Keep the build below the repository's 495 MB maximum.

## Success Criteria

- **SC-001**: AVIF and WebP assets load with transparency and both are smaller than the existing main artwork's PNG fallback (for context, that PNG is approximately 1.53 MB).
- **SC-002**: Playwright verifies the cursor and flying leaf share the same ordered AVIF/WebP sources and SVG fallback.
- **SC-003**: Existing reveal sequencing and repeated-question assertions remain present.
- **SC-004**: Automated repository verification and deployment-build checks pass before merge.
