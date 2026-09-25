# Active Context

Currently focused on the Lucky Card Reveal audio choreography in `app/lucky-card-reveal.js`.

Verified current repository state:
- The active reveal implementation currently loads **6** existing sound assets:
  `beam_energy.mp3`, `beam_impact.mp3`, `electrical_arc.mp3`, `final_lock_on.mp3`, `final_discharge.mp3`, and `reveal_snap.mp3`.
- `plasma_dissipation.mp3` is not present in the current `public/sounds` tree and is not wired in the active implementation.
- The previous implementation rate-shifted repeated impact sounds and looped `electrical_arc.mp3`, which produced repeated pitched transients and an extended post-flip audio bed.
- The supplied Standard/Premium/Flagship captures show the reveal impacts are already temporally aligned to the visual hit cadence; the problem is the audio mix/choreography rather than changing the visual timing.

Current repair on branch \`fix/lucky-card-audio-runtime\`:
- The live/main capture was analyzed from the supplied 23.87s Standard reveal video and its extracted 23.85s mono WAV soundtrack.
- The soundtrack contains two strong non-final impact events around 3.92s and 5.05s, followed by a persistent ~0.199s-period transient train from roughly 11.5s onward. The visual reveal itself is complete before that train, so the persistent train is an audio-lifecycle/mix defect, not desired reveal timing.
- The repair was rebuilt against measured repository asset lengths. Measured MP3 durations: \`beam_energy\` 0.261s, \`beam_impact\` 1.620s, \`electrical_arc\` 2.247s, \`final_lock_on\` 1.176s, \`final_discharge\` 7.706s, \`reveal_snap\` 4.049s, \`mixkit-cinematic-whoosh\` 4.885s, \`mixkit-cinematic-impact\` 9.012s, \`mixkit-magical-impact\` 4.624s, \`mixkit-firework-crackle\` 22.805s.
- Long sources are no longer allowed to run for their full source length. The repair uses the measured 1.620s \`beam_impact\` for physical strikes, removes the long per-hit magical layer, hard-bounds the 4.885s whoosh to each beam window, hard-bounds final discharge and reveal snap, and uses the 2.247s \`electrical_arc\` for the finite post-flip runoff instead of the 22.805s firework-crackle asset.
- No reveal-owned \`loop: true\` remains. Every scheduled one-shot has a tracked stop/fade path, and \`stopAll()\`/unmount cleanup stop all reveal-owned Howler instances.
- Gemini's independent-one-shot recommendation was incorporated at the Howler level: repeated \`play()\` calls receive distinct sound IDs rather than reusing a continuously playing audio bed. Raw \`new Audio()\` was not substituted for the repo's required Howler-based architecture.

Verification status: source-level lifecycle/static verification completed; CI/browser runtime playback verification remains pending.

## 2026-09-25 — Lucky Card Audio Runtime Repair
- Branch: `fix/lucky-card-audio-runtime`
- Verified defect in `app/lucky-card-reveal.js`: `beam_energy.mp3` was configured with `loop: true`, and the audio choreography referenced `F_WRAP` before that visual constant was declared later in the function. This could terminate audio scheduling before the looping beam instance received its shutdown timer.
- Replaced the continuous reveal audio bed with finite authored cues already present in `public/sounds/`: cinematic whoosh, cinematic impact, magical impact, final lock-on, final discharge, reveal snap, and firework crackle.
- Added reveal-owned audio timer tracking and hard cleanup on retrigger/unmount/end-of-sequence.
- Preserved existing Standard 3 / Premium 4 / Flagship 5 hit timing and all visual/card/result/reset/share behavior.
- Browser/runtime playback verification remains outstanding; the code path and source-level lifecycle checks have been completed.
