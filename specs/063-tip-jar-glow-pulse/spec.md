# Tip Jar Glow Pulse Match

## Goal

Give the homepage Tip Jar button the same subtle, continuously breathing golden glow pulse as the Suggestion button, while keeping the existing shimmer sweep and all button behavior unchanged.

## Current State

The Suggestion button uses a dedicated `suggestion-btn-glow` class and the `suggestionBtnGlow` keyframes from `app/globals.css`. The Tip Jar button already uses the shared `gold-3d-btn` depth treatment and shimmer overlay, but it does not receive the glow pulse. The pulse is therefore attached to a suggestion-specific class even though the effect is appropriate for both adjacent gold calls to action.

## Requirements

- **FR-001:** The Tip Jar and Suggestion buttons must share one reusable gold-button glow class and the same existing three-second ease-in-out infinite pulse.
- **FR-002:** The existing pulse keyframe shadow layers, warm amber colour, and intensity must remain unchanged.
- **FR-003:** The Tip Jar's existing shimmer sweep must remain unchanged; the Suggestion button must retain its current shimmer and pulse.
- **FR-004:** The shared glow pulse must pause on press so the common flattened active shadow remains visible.
- **FR-005:** The shared glow pulse must be disabled under `prefers-reduced-motion: reduce`.
- **FR-006:** Button wording, colour gradient, size, layout, focus treatment, handlers, modal behavior, and destinations must not change.

## Acceptance Scenarios

1. The Tip Jar and Suggestion buttons show the same gently pulsing amber outer glow at rest.
2. Both continue to use their existing moving shimmer sweep with no change to its direction, gradient, or timing.
3. Pressing either button pauses the glow pulse and exposes its existing pressed-state shadow.
4. With reduced motion enabled, neither button runs the glow pulse or shimmer animation.
5. The Tip Jar still opens the same tip-jar flow, and the Suggestion form still submits with its existing disabled/submitting behavior.

## Out of Scope

- Changing any other homepage buttons or their animation treatment.
- Changing the pulse timing, keyframe shadow values, shimmer timing, colour palette, copy, layout, artwork, or button functionality.
- New dependencies, assets, routes, or configuration changes.
