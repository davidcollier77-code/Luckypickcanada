# Data Model: Explore Your Luck Effect Repair

No persistent or domain data is introduced.

## In-memory interaction state

- **Maple leaf shape**: A module-level cached `canvas-confetti` path-shape object derived from the existing SVG path and explicit transform matrix. It is not serialized or persisted.
- **Chime instance/load promise**: A single cached Howler instance and its preload promise, held in browser memory.
- **Animation state**: Existing component refs continue to coordinate the scroll animation, cooldown, animation-frame handle and user-interruption cleanup. Their behavior is unchanged.
