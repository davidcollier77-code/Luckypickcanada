# Active Context

## Current Status
- Fixed a reduced-motion bug in the Lucky Card reveal sequence.
- Verified `shouldReduceMotion` correctly disables the 700ms CSS transform transition.
- Ensured normal-motion users retain the existing 700ms transition.

## Next Steps
- None at this time.

## Previous Context
- Upgraded Lucky Card reveal visuals and audio to enhance the "forging" aspect.
- Separated card-local visual effects onto a foreground canvas (fgCanvasRef).
- Improved Framer Motion physical reactions to sync directionally with strikes.
- Implemented targeted impacts around the card perimeter.
- Added tiered audio scaling and ethereal resonance tails.
- Ensured card artwork and basic functionality remain untouched.
- Fixed ONLY the unwanted lingering/echo-like audio tail that occurred after the Cosmic Lightning strike in the Lucky Meter.
- Removed the delayed `soundsRef.current.impactLightning.play()` calls from the script phases (Phase 1, 2, 3, and 4) within the `animateCanvas` render loop in `components/DailyResonance.tsx`.
- Preserved the primary cinematic `impactLightning` playback at the 7.5s reveal mark.
- Preserved the visual `spawnLightning` calls within the canvas animation loop, ensuring lightning visuals remain fully intact.
- Preserved Fireworks, Meteor Shower, buildup, button audio, percentage animation, and all other unrelated behavior.
- Polished the CGI quality of the Lucky Meter visuals (lightning bloom, lightning core, meteor flares, and firework glow arcs).
- Addressed the phantom lightning issue by removing the sympathetic visual branch from the Cosmic Lightning tier and converted its accompanying audio to a true 250ms delayed acoustic echo with a lower pitch and volume.
- Identified a bug where stars in `TwinklingStars.tsx` rendered over the mountain background of the Lucky Meter due to mismatched image proportions (`object-fit: cover`, `object-position: center 40%`) vs the static CSS mask and full-height star generation.
- Dynamically calculated the true horizon Y position in `TwinklingStars.tsx` and `Aurora.tsx` relative to the viewport size.
- Restricted random star Y generation so stars physically cannot exist below the calculated skyline, while updating the density math to keep star counts consistent.
- Re-tightened the CSS alpha mask to strictly fade stars right before the calculated dynamic horizon line.
- Fixed Lucky Meter immediate button response by removing the deferred Howler trigger and wiring it to the synchronized playButtonClick path from app/lib/audio.js.
- Corrected Meteor Shower audio presentation by placing mixkit-cinematic-impact at the 7.5s visual reveal/impact point, fulfilling the required cinematic character without displacing the dedicated mixkit-meteor atmospheric entry sound.
- Eliminated a severe animation-restart lifecycle regression (for Meteor Shower, Cosmic Lightning, Fireworks) by introducing hasAnimatedRef to lock out unintended animateCanvas executions fired by React state renders after timeline completion.
- Identified that `impactMeteor` was being reused for firework rocket launches, causing a cinematic whoosh instead of a firework whistle/launch sound.
- Downloaded `mixkit-firework-whistle.mp3` as the new dedicated firework launch sound, matching the project's CC0/Mixkit licensing.
- Added `fireworkLaunch` to `soundsRef` and initialized it using Howler.js.
- Modified `Fireworks` tier logic in `DailyResonance.tsx` to use `soundsRef.current.fireworkLaunch` for rocket launches, retaining Howler's `.play()` ID for overlapping asynchronous playback.
- Verified meteors remain unaffected and use `impactMeteor`.
- Fixed card reveal animation to build up visually on hits rather than lingering beam effect.
