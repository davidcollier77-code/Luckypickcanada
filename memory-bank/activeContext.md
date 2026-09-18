# Active Context

## Current Status
- Upgraded Lucky Card reveal to use Howler.js for precise cinematic audio scheduling.
- Added aurora beam sound (`mixkit-firework-crackle.mp3`) and synchronized it with existing strikes.
- Replaced synthetic `OscillatorNode` logic with high-quality Howler.js cinematic shimmer sound.

## Next Steps
- None at this time.

## Previous Context
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
