# Active Context

Currently focused on the Lucky Card Reveal audio choreography in `app/lucky-card-reveal.js`.

Verified current repository state:
- The active reveal implementation currently loads **6** existing sound assets:
  `beam_energy.mp3`, `beam_impact.mp3`, `electrical_arc.mp3`, `final_lock_on.mp3`, `final_discharge.mp3`, and `reveal_snap.mp3`.
- `plasma_dissipation.mp3` is not present in the current `public/sounds` tree and is not wired in the active implementation.
- The previous implementation rate-shifted repeated impact sounds and looped `electrical_arc.mp3`, which produced repeated pitched transients and an extended post-flip audio bed.
- The supplied Standard/Premium/Flagship captures show the reveal impacts are already temporally aligned to the visual hit cadence; the problem is the audio mix/choreography rather than changing the visual timing.

Current repair on branch `fix/lucky-card-audio-choreography`:
- Keep one beam-energy instance instead of replaying/rate-shifting it for the final escalation.
- Remove per-hit playback-rate randomization from `beam_impact.mp3`; use volume escalation instead.
- Keep final lock-on and discharge as distinct events.
- Fade the beam-energy bed out into the final discharge rather than leaving it underneath the flip.
- Make `electrical_arc.mp3` a single finite post-flip pass starting after the 3D flip completes, with a controlled fade-out instead of looping.
- Preserve all existing tier counts, visual choreography, card artwork, accessibility/reduced-motion behavior, and unrelated audio.

Verification status: code diff inspected; repository CI/browser verification is pending.

## 2026-09-25 — Lucky Card Audio Runtime Repair
- Branch: `fix/lucky-card-audio-runtime`
- Verified defect in `app/lucky-card-reveal.js`: `beam_energy.mp3` was configured with `loop: true`, and the audio choreography referenced `F_WRAP` before that visual constant was declared later in the function. This could terminate audio scheduling before the looping beam instance received its shutdown timer.
- Replaced the continuous reveal audio bed with finite authored cues already present in `public/sounds/`: cinematic whoosh, cinematic impact, magical impact, final lock-on, final discharge, reveal snap, and firework crackle.
- Added reveal-owned audio timer tracking and hard cleanup on retrigger/unmount/end-of-sequence.
- Preserved existing Standard 3 / Premium 4 / Flagship 5 hit timing and all visual/card/result/reset/share behavior.
- Browser/runtime playback verification remains outstanding; the code path and source-level lifecycle checks have been completed.
