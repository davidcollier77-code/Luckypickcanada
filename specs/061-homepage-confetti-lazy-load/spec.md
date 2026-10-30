# Homepage Confetti Library Deferred Loading

## Goal
Reduce the homepage's initial JavaScript by loading `canvas-confetti` only when the hero Explore interaction can use it, without changing the effect, the scroll behavior, or any visual output.

## Evidence for the change
- The rendered homepage document referenced 9 initial JS chunks totalling 631,196 bytes raw / 197,142 bytes gzip.
- `/_next/static/chunks/373-3e8767e7d59f84d2.js` (20,631 bytes raw / 7,752 bytes gzip) was part of that initial set and contained the `canvas-confetti` runtime (`shapeFromPath`).
- The library is only used after the Explore button is activated; visitors who never activate it, and visitors who prefer reduced motion, never render the particles.

## Requirements
- **FR-001**: Remove the static `canvas-confetti` import from `app/homepage/ExploreLuckButton.js` and load it through a cached dynamic `import()`.
- **FR-002**: Prefetch the library after hydration (mirroring the existing confetti-pop audio preload) so the first activation still renders particles immediately.
- **FR-003**: Start the eased scroll without waiting on the import; the error path must log and leave the scroll intact.
- **FR-004**: Skip the prefetch for `prefers-reduced-motion` visitors because their activation path returns before particles fire.
- **FR-005**: Reset the cached promise after a failed import so a later activation can retry.

## Acceptance Scenarios
1. The served homepage HTML no longer references a chunk containing `canvas-confetti`.
2. Initial homepage JavaScript bytes (raw and gzip) decrease relative to the recorded baseline.
3. Activating Explore still fires the same golden maple-leaf burst and the same eased scroll to `#play-explore`.
4. Reduced-motion activation still only scrolls, without particles or library download.
5. Cooldown, interrupt handling, and cleanup behavior are unchanged.

## Out of Scope
- Changing confetti parameters, colors, shape geometry, timing, or canvas handling.
- Changing AVIF/WebP image delivery, preload hints, CSS, layout, copy, audio, or any other route.
- Adding dependencies or changing build configuration.
