# Research: Explore Your Luck Effect Repair

## Verified repository findings

1. `app/homepage/ExploreLuckButton.js` loaded `/images/maple-leaf.webp` only after activation, then created `{ type: 'bitmap', bitmap }` without a shape transform matrix.
2. The repository contains `public/images/maple-leaf.svg`, whose path is a gold maple-leaf outline, and already depends on `canvas-confetti`. The library exports `shapeFromPath`, which accepts a path plus matrix, so the existing outline can render without a click-time image fetch.
3. `app/lib/audio.js` imported Howler, constructed a Howl and requested playback only after activation. This creates an avoidable first-activation delay while the module and sound asset load.
4. The visual Playwright test asserted only that a canvas whose style contains `z-index: 100` exists. Canvas creation alone does not prove particles were drawn.
5. Existing scrolling uses `#play-explore`, a 1,500 ms eased requestAnimationFrame transition, a 15-second cooldown and interruption listeners. Those behaviors are preserved.

## Decisions

- Reuse the current gold maple-leaf SVG path with `canvas-confetti.shapeFromPath` and a fixed matrix.
- Fire particles immediately instead of waiting for an image load.
- Increase particle count from 40 to 72 and the base scale from 1.5 to 1.8.
- Preload the existing chime when the component initializes; play synchronously only when loaded, preventing sound from starting unexpectedly after a transition.
- Strengthen Playwright coverage by sampling alpha pixels and checking that the sound request happens before activation.

## Assumptions and limitations

- The selected `/sounds/mixkit-magic-sparkles.mp3` asset remains unchanged. Its acoustic character and licensing details were not independently assessed in this environment.
- A local repository checkout is unavailable because shell DNS resolution for github.com fails. Branch edits were made using the connected GitHub interface; CI/browser runs must provide execution evidence.
- Some snapshots under `.docs/audio/` were returned as compressed/non-readable bytes; the readable local Howler.js, MDN Web Audio and Chrome documentation snapshots were consulted.
