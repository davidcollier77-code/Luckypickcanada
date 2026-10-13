# Feature Specification: Enhance Homepage Golden Arrow Interaction

## Feature Overview

The subtle golden arrow interaction on the homepage needs to be enhanced to provide a more magical and rewarding experience when users discover and click it. This should be achieved through improved particle effects and a magical chime sound. A strict 15-second cooldown must prevent rapid re-triggering of the effect.

## Success Criteria

1.  **Visual Enhancement**: When clicked, the golden arrow triggers a richer, more polished burst of golden confetti and sparkles that fit the "magical golden moment" theme. The effect cleans up properly.
2.  **Audio Integration**: A short, magical golden chime plays alongside the visual effect. The sound only plays on a successful activation, handles errors gracefully, and does not autoplay.
3.  **Cooldown Mechanism**: A strict 15-second cooldown is enforced. Repeated clicks within this window do not trigger the visuals or sound again.
4.  **Preservation of Subtlety**: The arrow remains subtle and discoverable. It does not look like a conventional call to action. Normal scrolling and site functionality remain unobstructed.
5.  **Preservation of Existing State**: Tests pass, visual baselines (where unaffected) pass, accessibility is maintained, no new dependencies are introduced unless justified and approved, and the final build size remains strictly under 495 MB.

## Implementation Requirements

- Use `canvas-confetti` (already present) to improve the visual burst instead of relying solely on the CSS animation.
- Implement the audio playback via `howler` in `app/lib/audio.js` using an existing local sound file (e.g., `mixkit-magic-sparkles.mp3`).
- Modify `COOLDOWN_MS` to 15,000ms.
- Update Playwright visual tests in `tests/visual/homepage.spec.ts`.
