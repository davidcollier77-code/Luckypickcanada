# Active Context

Completed Lucky Card Reveal audio choreography repair in `app/lucky-card-reveal.js`.

Verified current repository state:
- The active reveal implementation currently loads **6** existing sound assets:
  `beam_energy.mp3`, `beam_impact.mp3`, `electrical_arc.mp3`, `final_lock_on.mp3`, `final_discharge.mp3`, and `reveal_snap.mp3`.
- `plasma_dissipation.mp3` is not present in the current `public/sounds` tree and is not wired in the active implementation.
- The previous implementation rate-shifted repeated impact sounds and looped `electrical_arc.mp3`, which produced repeated pitched transients and an extended post-flip audio bed.
- The supplied Standard/Premium/Flagship captures show the reveal impacts are already temporally aligned to the visual hit cadence; the problem is the audio mix/choreography rather than changing the visual timing.

Current repair on branch `fix/lucky-card-audio-runtime`:
- The previous implementation used aggressive hard-stop cutoffs (e.g. stopping a 4.885s whoosh at 690ms, stopping a 7.7s discharge at 1450ms) which caused the audio to sound chopped and synthetic.
- Replaced the aggressive hard stops with longer fade durations and extended stop times that respect the natural decay lengths of the audio files, while ensuring they do not bleed out of their intended sequence window.
- Asset lengths were verified using `ffprobe`: `mixkit-cinematic-whoosh.mp3` (4.88s), `beam_impact.mp3` (1.59s), `final_lock_on.mp3` (1.15s), `final_discharge.mp3` (7.68s), `reveal_snap.mp3` (4.02s), `electrical_arc.mp3` (2.22s).
- Visual timing constants (`HIT_DURATION = 1.6`, `HIT_CONTACT_OFFSET = 0.4`, `FINAL_FLIP_TIME = 0.6`, `FINAL_FLIP_DURATION = 1.2`) were completely preserved.
- The final fallback cleanup block was extended from `postFlipStart + 2.2` to `postFlipStart + 4.0` to allow the extended tails (like the 3s final discharge fade) to finish gracefully without being cut off by the global audio reset.

## 2026-09-25 — Lucky Card Audio Runtime Repair
## 2026-09-25 — Lucky Card Reveal Standard Audio Sync Repair
- Investigated specific audio sync issues for the Standard tier reveal. Discovered that the `mixkit-cinematic-whoosh.mp3` has its audible climax at ~1.04s, and `beam_impact.mp3` has ~0.13s of silence before its physical attack.
- Repaired audio synchronization without modifying any visual timing by shifting `beam_impact.mp3` playback early by 0.13s, and using Howler`s seek(0.64) on `beamApproach` to perfectly align its climax with the visual contact at `hitStart + 0.4`.

- Branch: `fix/lucky-card-audio-runtime`
- Verified defect in `app/lucky-card-reveal.js`: Audio cues were using hard cutoffs that chopped the audio prematurely.
- Addressed by implementing extended fade/stop windows in `app/lucky-card-reveal.js`: whoosh (4.88s asset → 1.2s stop), beam impact (1.59s asset → 1.6s stop), lock-on (1.15s asset → 1.15s stop), discharge (7.68s asset → 3.0s stop), reveal snap (4.02s asset → 2.5s stop), electrical arc (2.22s asset → 2.2s stop). Assets are deliberately truncated to fit the reveal sequence timing while avoiding the previous aggressive hard cutoffs.
- Ensured build size does not exceed the 495 MB cap.
- Verified standard tests pass.

## 2026-09-25 — Standard-Tier Audio Sound-Design Repair
## 2026-09-25 — Lucky Card Reveal Standard Audio Beeping Fix

- Branch: `fix/lucky-card-standard-audio-sound-design`

- Investigated "strange beeping/tonal noises" during Standard tier reveal.

- Discovered `electrical_arc.mp3` was inadvertently playing on every single contact impact in the Standard tier loop, creating repeated tonal artifacts.

- Removed the `electrical_arc.mp3` trigger and its volume scheduling from the individual hit events, preserving its legitimate single-use post-flip runoff role.

- Verified build size remained well under 495 MB (279 MB).

- Ensured tests and standard verification pass.
- Branch: `fix/lucky-card-standard-audio-sound-design`
- Scope is intentionally restricted to **Standard-tier reveal audio**; Premium and Flagship runtime choreography is preserved.
- The latest supplied Standard capture was analyzed as rendered audio/video evidence. The main hit transients are already close to the visual contact cadence, so this repair does not move the visual timeline or introduce another broad synchronization shift.
- The rendered capture showed a sparse, isolated hit sequence plus long/tonal tails rather than one coherent physical energy event.
- Standard audio was rebuilt as a layered finite sequence using existing repository assets only:
  - approach sweep;
  - short `beam_energy.mp3` texture;
  - physical `beam_impact.mp3` contact;
  - short `electrical_arc.mp3` material/electrical response;
  - final `final_lock_on.mp3` hold;
  - bounded `final_discharge.mp3` throw/flip event;
  - short `reveal_snap.mp3` transient;
  - post-flip `electrical_arc.mp3` runoff.
- The measured 130ms leading-silence compensation for `beam_impact.mp3` and the 0.64s `beamApproach` seek from PR #1242 were retained.
- The old looping beam bed remains removed. No synthesized browser tone or new asset was introduced.
- Premium/Flagship audio code was retained in its verified current form.
- Repository visual choreography, Standard/Premium/Flagship hit counts, card artwork, reset/collection/share behavior, and reduced-motion behavior were not intentionally changed.
- Source-audio audition of the individual GitHub MP3 binaries was not available in this connected execution environment; therefore no claim is made that the source files were literally auditioned here. The repair is based on the supplied rendered capture, verified source durations already recorded by the repository, and the actual current playback code.

## 2026-09-25 — Gemini GitHub Integration Cleanup
- Verified the repository's former Gemini CLI GitHub Actions integration was removed by PR #1233.
- Verified `.github/workflows/gemini-code-agent.yml` is no longer present on `main`, and repository search returns no `google-github-actions/run-gemini-cli`, `@gemini-cli`, or `GEMINI_API_KEY` references belonging to that GitHub workflow.
- The site's separate Oracle feature still uses `env.GEMINI_API_KEY` in `functions/api/oracle.js`; this application integration was not changed.
- Removed the obsolete `.gemini/` Git ignore entry so the repository no longer carries configuration specifically for the removed Gemini CLI workflow.


## 2026-09-25 — Security License and GitHub Actions Pinning
- Removed the stale `package-lock.json`; the repository is governed by pnpm and uses `pnpm-lock.yaml`. The flagged LGPL-3.0-or-later entries were optional `@img/sharp-libvips-*` packages recorded only in that stale npm lockfile.
- Pinned all third-party actions in the three flagged workflows to immutable full commit SHAs, preserving their current major-version behavior via version comments.


## 2026-09-25 — GCP Key Redaction and Action Pin Monitoring
- Verified the three flagged GitHub Actions workflows already use full 40-character commit SHAs; no workflow code change was required.
- Redacted 9 Google API-key-shaped values from `.docs/deep-dive/_android_developers.md`.
- Added `.github/dependabot.yml` to monitor GitHub Actions updates weekly while retaining immutable pins.