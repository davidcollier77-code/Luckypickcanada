✨ Jules: Upgrade Lucky Card Reveal to a premium cinematic experience

**What**
- Brought the `aurora-container` background layers directly into the `/reveal` route to construct a deep, dark atmospheric environment.
- Removed the harsh `bg-yellow-200` rectangular reveal flash and the `aurora-glow` that created a flat yellow panel behind the deck.
- Replaced the linear `xShake/yShake` Framer Motion animation with a smooth, breathable, multi-phase floating physics setup.
- Restructured the Web Audio API synthesizer logic to instead orchestrate the project's existing high-quality `.mp3` files (cinematic drones, buildup charges, impact hits) via `howler.js` and `react-sounds`, allowing for graceful 5-phase volume fades (Anticipation -> Gather -> Tension -> Reveal -> Afterglow).
- Reworked particle properties to pull inward during the energy build-up, and burst in a 360-degree radial array upon the card reveal climax.

**Why**
- The previous implementation relied on synthetic Web Audio API "boops" and "bweeps", alongside linear shaking, flat flashing rectangles, and generic starbursts. This resulted in an arcade-like, slot-machine feel.
- The objective was to create a mysterious, powerful, premium, and sophisticated magic environment that frames the Lucky Card as a valuable artifact.

**Impact**
- **Visuals:** The user is immediately immersed in a deep, atmospheric space. The buildup feels powerful without being explosive, and the reveal itself utilizes beautiful luminous pulses and drifting motes instead of a cartoonish flash. The actual Lucky Cards remain completely untouched per project specifications.
- **Audio:** A professional, fully orchestrated soundscape aligns precisely with the visual milestones.

**Verification**
- Investigated `howler` and `framer-motion` APIs via Context7 to employ the most effective scheduling and sequential layering functions.
- Verified changes locally using Playwright (generated video and final state screenshots) to ensure UI and audio synchronization and confirm the complete removal of the yellow background flash.
