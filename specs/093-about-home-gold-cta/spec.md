# Feature Specification: About Page Return to Home Gold CTA

**Feature Branch**: `polish/about-home-gold-cta-20261105`

**Created**: 2026-11-05

**Status**: Implemented — verification pending

**Input**: User description: Make the Return to Home button at the bottom of the About the Creator & Our Story page visually match the site's existing gold buttons, without changing its function.

## User Scenarios & Testing

### User Story 1 - Consistent About Page Home Action (Priority: P1)

A visitor reaches the bottom of the About the Creator & Our Story page and sees a Return to Home link that uses the same premium metallic gold treatment as the site's other primary actions. Selecting it still navigates to the homepage.

**Why this priority**: The inconsistent dark treatment is the only issue reported and is the sole requested change.

**Independent Test**: Open `/about`, inspect the final Return to Home link, and verify its shared gold styling, accessible name, and homepage destination.

**Acceptance Scenarios**:

1. **Given** a visitor is on `/about`, **When** the page finishes rendering, **Then** the Return to Home link uses the existing `.gold-3d-btn` treatment and decorative home icon.
2. **Given** the visitor activates Return to Home, **When** the link is followed, **Then** its destination remains `/` and its accessible name remains “Return to Home”.

### Edge Cases

- At narrow mobile widths, the link remains full-width within its existing centered, size-limited wrapper.
- When reduced motion is enabled, the shared global gold style follows the existing reduced-motion rules.

## Requirements

### Functional Requirements

- **FR-001**: The About-page Return to Home link MUST use the existing global `.gold-3d-btn` styling rather than a page-specific dark style.
- **FR-002**: The visible link label MUST remain “Return to Home” and its destination MUST remain `/`.
- **FR-003**: Any decorative home icon MUST be hidden from assistive technology so the accessible link name remains unchanged.
- **FR-004**: The existing wrapper, width, placement, and spacing MUST remain unchanged.
- **FR-005**: No other page content, navigation, functionality, or global gold-button styling may change.

## Success Criteria

- **SC-001**: The About-page link renders the same global metallic gold gradient and raised edge as other `.gold-3d-btn` CTAs.
- **SC-002**: Automated browser verification confirms the link still targets `/` and exposes the accessible name “Return to Home”.
- **SC-003**: The link remains visible and full-width on the existing mobile and desktop page layouts.

## Assumptions

- The established global `.gold-3d-btn` class is the authoritative source for the site's gold CTA appearance.
- A small decorative home icon is appropriate to make this navigation action visually consistent with the site's other icon-led gold CTAs.
- The existing global reduced-motion and keyboard-focus behavior should be reused without additional CSS.
