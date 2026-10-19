# Feature Specification: Restore Shared Sky Backgrounds

**Feature Branch**: fix/restore-shared-sky-backgrounds-1534

**Created**: 2026-10-19

**Status**: Implementation candidate; current-head verification pending

**Input**: User reports that after the latest homepage CSS performance change, the shared sky background disappeared from the Crystal Ball and Lucky Map areas, while the Lucky Meter and card reveal appeared mostly unchanged.

## User Scenarios & Testing

### User Story 1 — Restore the shared night-sky environment (Priority: P1)

As a visitor, I should see the intended cosmic sky behind the homepage, Crystal Ball, and Lucky Map surfaces rather than a flat dark background.

**Independent Test**: Browser-based checks visit /, /crystal-ball, and /map, then assert that the shared backdrop element receives its expected fixed positioning, stacking level, image background, transparent page surface, and hidden fallback foundation.

**Acceptance Scenarios**:

1. **Given** the homepage loads, **When** the shared backdrop is rendered, **Then** its sky-image background and positioning rules are present.
2. **Given** the Crystal Ball or Lucky Map page loads, **When** the page applies its shared backdrop, **Then** the same image and transparency rules remain active.
3. **Given** the Lucky Meter and card reveal sections have their own visual treatments, **When** the shared backdrop import is repaired, **Then** those sections' markup, artwork, styling, and interactions are not changed.

## Edge Cases

- The shared backdrop element is in the markup but its stylesheet rule is absent or overridden.
- The page-level dark foundation obscures the intended image.
- The route is dynamically rendered (Lucky Map) and still must load the shared theme stylesheet.
- Browser image decoding may be pending; the regression test asserts the CSS image source is applied, while CI browser checks remain responsible for runtime behavior.

## Requirements

### Functional Requirements

- **FR-001**: Restore the previously working theme-first CSS import order in app/layout.js.
- **FR-002**: Remove the duplicate theme @import from app/globals.css so the same theme is not imported through both routes.
- **FR-003**: Preserve the shared sky-image CSS rules and existing backdrop elements; do not replace or redesign the artwork.
- **FR-004**: Add a Playwright regression check for backdrop styling on the homepage, Crystal Ball, and Lucky Map routes.
- **FR-005**: Do not modify Lucky Meter, Lucky Card Reveal, their artwork, interactions, page copy, or assets.
- **FR-006**: Report test, governance, production build, and measured build-size results only after they are observed.

## Success Criteria

- **SC-001**: Each target route has a .homepage-sky-backdrop whose computed image includes crystal-ball-bg-desktop.
- **SC-002**: Computed positioning remains fixed at z-index -30; the page background is transparent and the fallback foundation is hidden on target routes.
- **SC-003**: Existing browser visual baselines and route behavior pass after the import order is restored.
- **SC-004**: The production build and measured .next + public output stay strictly below the repository's 495 MiB hard limit.
