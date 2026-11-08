# Feature Specification: Homepage Welcome Panel Cleanup

**Feature Branch**: `fix/hero-welcome-panel-cleanup`

**Created**: 2026-11-08

**Status**: Draft

**Input**: User request to remove the welcome-card gold call-to-action and its gold entertainment-only note, retain the dark welcome panel, and bring the existing Explore title and downward arrows upward on mobile.

## User Scenarios & Testing

### User Story 1 - A shorter welcome panel (Priority: P1)

A visitor opens Lucky Pick Canada on a phone and sees the same dark, gold-edged welcome panel with its existing heading and explanatory copy, without the large gold "Explore free experiences" button or the gold "Free to enjoy · For fun and entertainment only" line. The panel takes up less vertical space, and the existing painted "Explore Your Luck" title and down arrows sit closer beneath it.

**Why this priority**: This is the exact first-screen presentation change requested by the site owner. It makes the introductory content less bulky while preserving the established visual identity.

**Independent Test**: Inspect the homepage welcome panel at mobile and desktop widths. Confirm the panel remains visible with its original heading and paragraph, the two unwanted elements are absent, and the existing Explore control remains below it.

**Acceptance Scenarios**:

1. **Given** the homepage is opened on a phone, **When** the welcome panel renders, **Then** its dark surface, gold border, heading, lede and explanatory paragraph remain, with no large gold CTA or gold disclaimer line.
2. **Given** the welcome panel has rendered, **When** the visitor sees the next artwork section, **Then** the painted Explore title and down arrows remain below the panel with tighter vertical spacing.
3. **Given** the visitor activates the Explore arrows, **When** the control runs, **Then** it still scrolls to the existing Play & Explore section with the existing sound, confetti, cooldown, keyboard, touch and reduced-motion behaviour.

### Edge Cases

- At narrow mobile widths, the paragraph may wrap onto additional lines; the card must grow naturally without clipping text or causing horizontal overflow.
- When reduced motion is enabled, the existing Explore control must continue to use its established immediate-scroll path.
- The Explore control must remain a separate control from the welcome-card content.

## Requirements

### Functional Requirements

- **FR-001**: The welcome panel MUST retain its dark background, gold border, rounded corners, title, lede and existing explanatory paragraph.
- **FR-002**: The welcome panel MUST NOT render the large "Explore free experiences" link/button.
- **FR-003**: The welcome panel MUST NOT render the gold "Free to enjoy · For fun and entertainment only" line.
- **FR-004**: The welcome panel MUST use compact vertical padding and the divider spacing around it MUST be reduced so the painted Explore title and down arrows move closer to the panel.
- **FR-005**: The separate painted Explore control MUST retain its existing scroll destination and interaction behaviour, including confetti, sound, cooldown, keyboard/touch activation and reduced-motion handling.
- **FR-006**: The existing artwork, AVIF-first/WebP fallback, preload, starfield, shimmer, navigation and all content below the hero MUST remain unchanged.

## Key Entities

None. This is a presentation-only change with no data or API changes.

## Success Criteria

### Measurable Outcomes

- **SC-001**: The homepage welcome panel displays its original heading, lede and paragraph, with zero instances of the removed CTA and note.
- **SC-002**: The panel and divider spacing are visibly more compact at 390 px and 412 px viewport widths without horizontal overflow or clipped copy.
- **SC-003**: The Explore arrows remain visible as the existing interactive target and continue scrolling to the Play & Explore section.
- **SC-004**: No artwork, routes, navigation destinations, data, or below-hero features change.

## Assumptions

- The dark welcome panel and its wording are approved and must remain intact.
- The entertainment-only statement elsewhere on the website is not being removed; only the gold line inside this welcome panel is in scope.
- The gold-painted Explore artwork and its downward arrows are not the gold CTA being removed. They are to remain fully functional.
