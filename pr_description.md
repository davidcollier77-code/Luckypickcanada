🎨 Palette: [UX improvement]

**What:**
Integrated procedural ZzFX audio synthesizers for the Lucky Meter, creating layered, synchronized sound effects that perfectly match the visual timeline. The updates include dynamic, sequenced audio logic utilizing the Web Audio API for exact impact alignment alongside enhanced visual flashes.

**Why:**
The previous implementation relied on statically-imported audio assets and lacked distinct audio/visual sync checkpoints, resulting in a generic "beep" lacking a premium feel. Implementing custom synthesized sequences offers dynamic, perfectly timed audio while reducing asset load.

**Before/After:**
Before: The meter played static sound files at arbitrary intervals lacking cohesion.
After: The meter features a dynamic hum, a tension-building rhythmic tick, and dramatic, tier-specific synthetic impacts synced strictly to `AudioContext.currentTime` with synchronized on-canvas flash effects.

**Accessibility:**
Added visual flashes and pulse animations during critical moments, ensuring both audio and visual feedback are simultaneously present.
