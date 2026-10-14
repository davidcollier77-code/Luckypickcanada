# Feature Specification: Explore Your Luck Effect Repair

**Feature Branch**: `fix/local-sparkling-confetti-audio`

**Created**: 2026-10-13

**Status**: Draft for implementation and verification

**Input**: Repair the existing Explore Your Luck celebration after the golden maple-leaf particles disappeared and the sound began playing late. Preserve the working scroll interaction and homepage appearance.

## User Scenarios & Testing

### User Story 1 - Visible golden-leaf burst (Priority: P1)

A visitor taps Explore Your Luck and sees a clear burst of golden Canadian maple leaves at the button's location before and during the existing scroll transition.

**Why this priority**: The visual celebration is the primary requested interaction and is currently missing from the recording.

**Independent Test**: In Playwright with reduced motion disabled, tap the button and verify the confetti canvas contains rendered non-transparent pixels within 750 ms.

**Acceptance Scenarios**:
1. **Given** the homepage has hydrated and reduced motion is not requested, **When** the visitor activates Explore Your Luck, **Then** golden maple-leaf particles render immediately without waiting for an image network request.
2. **Given** path-based particles are unavailable in a browser, **When** the visitor activates the button, **Then** the visible gold star/circle fallback still renders.
3. **Given** the burst is visible, **When** the page scrolls, **Then** the fixed particle canvas is not clipped by the hero container.

### User Story 2 - Synchronized confetti pop sound (Priority: P1)

A visitor hears the short magical confetti pop sound at the start of the celebration, not after the scroll transition.

**Why this priority**: The current code first imports Howler and creates the sound on activation, which can defer playback until after the intended moment.

**Independent Test**: Confirm the sound asset request begins during page initialization, before activation, then inspect the interaction on a mobile browser.

**Acceptance Scenarios**:
1. **Given** the sound has been preloaded, **When** the visitor taps Explore Your Luck, **Then** playback is requested synchronously in the tap handler alongside the particle burst.
2. **Given** preload has not completed, **When** activation occurs, **Then** the sound must not unexpectedly start late after scrolling finishes; preload can complete for a later activation.
3. **Given** reduced motion is preferred, **When** the button is activated, **Then** the existing direct scroll behavior remains and the decorative burst/confetti pop sound do not play.

### User Story 3 - Preserve navigation behavior (Priority: P1)

The visitor reaches the same Play & Explore / Lucky Meter section with the existing eased scroll.

**Independent Test**: Existing Playwright coverage verifies scroll progression, final target position, cooldown and keyboard interruption.

**Acceptance Scenarios**:
1. The target remains the element with ID `play-explore`.
2. The scroll remains approximately 1.5 seconds with the existing easing and user-interruption behavior.
3. The homepage wording, layout, hero asset, background, and other features remain unchanged.

## Requirements

- **FR-001**: Render the existing golden maple-leaf outline as a valid `canvas-confetti` path shape with an explicit transform matrix.
- **FR-002**: Fire confetti synchronously on activation without waiting for a bitmap download/decode.
- **FR-003**: Increase the burst from 40 to 72 particles and slightly enlarge the default particle scale.
- **FR-004**: Preload the existing same-origin `public/sounds/confetti-pop.wav` asset during component initialization and share the load promise.
- **FR-005**: Play the confetti pop sound synchronously only when the sound has loaded; do not queue delayed playback after activation.
- **FR-006**: Preserve existing scroll target, duration, easing, cooldown, interrupt handling, keyboard activation, touch behavior and reduced-motion behavior.
- **FR-007**: Verify actual drawn particles in Playwright rather than asserting only that a canvas element exists.
- **FR-008**: Use the existing same-origin `media-src 'self'` permission for the local sound; remove the obsolete external audio-host allowance without loosening any CSP directive.

## Edge Cases

- Path rendering is unsupported: use the existing gold star/circle fallback.
- Audio preload fails: continue navigation and confetti without an unhandled rejection; log a warning.
- The user activates before preload finishes: do not play a late sound; initialize it for the next interaction.
- Reduced-motion preference is active: keep direct scrolling and omit decorative animation/audio.

## Success Criteria

- **SC-001**: Playwright observes more than five sampled non-transparent pixels in the confetti canvas within 750 ms of activation.
- **SC-002**: The confetti pop sound asset request starts before the user activates the button.
- **SC-003**: Existing scroll, cooldown and keyboard-interruption tests continue to pass.
- **SC-004**: No homepage layout, wording, hero background, business logic or dependencies change.
- **SC-005**: The required build remains below the hard 495 MB maximum.

## Assumptions

- The sound is the existing local asset at `public/sounds/confetti-pop.wav`, already committed on `main`.
- Playback uses the same-origin `/sounds/confetti-pop.wav` path, so no external audio CDN or additional CSP host allowance is needed.
- Modern browsers supporting `canvas-confetti` path rendering use `Path2D` and `DOMMatrix`; other browsers receive the existing fallback particles.
- The implementation is limited to this homepage interaction and its directly related verification.
