## 2026-09-27 — Controlled Dependency Refresh (PR #1286)

- Authorized a controlled refresh of exactly five outdated devDependencies: prettier 3.9.6 → 3.9.9, react-hook-form 7.87.0 → 7.89.0, tailwind-merge 3.6.0 → 3.7.0, playwright 1.62.1 → 1.63.0, and playwright-chromium 1.62.1 → 1.63.0.
- Preserved already-current packages, including @playwright/test 1.63.0, Sonner 2.0.8, Stylelint 17.15.0, Stylelint Config Standard 40.0.0, Tailwind CSS 4.2.4, and Wrangler 4.141.0.
- Reconciled package.json and pnpm-lock.yaml; peer/snapshot references for react-hook-form and prettier were aligned with the upgraded versions.
- Verified final GitHub diff contains only memory-bank documentation plus the authorized package.json/pnpm-lock.yaml dependency changes.
- GitHub Actions run 36315064397 passed frozen installation and the full repository PR build-validation pipeline through Wrangler build and Git status.
- Protected-file authorization workflow run 36315063676 passed.
- pnpm test was not executed because no existing PR workflow invokes it and the local environment cannot clone the public GitHub repository.
- Build-size measurement required by AGENTS.md was not performed by the existing workflow; no size result is claimed.
- No deployment or merge was performed.

## 2026-09-27 — Premium/Flagship Web Audio Reveal Extension

- Generalized the verified Standard-tier Web Audio initialization gate so Premium and Flagship also create/resume the same AudioContext and decode the same Standard audio buffers on the user interaction.
- Generalized the Standard Web Audio scheduler and matched Howler fallback to all recognized tiers.
- Preserved the existing hit cadence: Standard 3 / Premium 4 / Flagship 5, including the final-hit offset derived from `TIER_HITS`.
- Changed only `app/lucky-card-reveal.js` for application behavior; no new audio assets or visual/VFX changes.
- Source diff reconciled successfully. No GitHub Actions run or commit status is currently attached to the PR head, so browser/test/build verification remains pending.
## 2026-09-27 — Documentation Refresh Symlink Compatibility Repair

- Verified run `36308236510` failed in `scripts/refresh-docs.js` because the updater rejected an intentional `.docs/` symlink while cleaning stale temp files.
- Verified current `main` contains 90 symlinked documentation snapshot files under `.docs/`, and the updater itself creates these links for shared library snapshots.
- Repaired `scripts/refresh-docs.js` so final-path symlinks are allowed only when their fully resolved target remains inside `.docs/`; intermediate symlink traversal and escaping targets remain blocked.
- Verification completed: branch diff is limited to the updater script, and a synthetic filesystem test confirmed safe internal symlink acceptance plus rejection of an escaping symlink.
- Final GitHub Actions refresh run is intentionally deferred to the user-triggered post-merge verification.
## 2026-09-26 — Standard Final Reveal Audio Texture Pass

- Added four nonuniform, low-gain electrical flicker bursts during the Standard final discharge to match the small plasma/spark activity visible in the supplied capture.
- Reused the existing `standard_electrical_arc.mp3` in both the native Web Audio path and the Howler fallback; no new audio asset was introduced.
- Preserved the existing main final-hit and post-flip audio levels/timing and all Premium/Flagship behavior.
- Verification status: source diff and timing-path reconciliation completed; CI/build/runtime playback verification remains required.

## 2026-09-26 — OpenNext Publish Hang Repair
- Verified current main's post-#1264 deploy run `36230678014` succeeds through build and OpenNext artifact verification but hangs at the publish step.
- Matched the failure mode to upstream OpenNext Cloudflare issue #1273, which documents the same remote R2 cache population hang and the `OPEN_NEXT_DEPLOY=true wrangler deploy` workaround.
- Implemented the minimal workflow-only workaround on branch `fix/cloudflare-deploy-bypass-open-next-cache-populate`.
- Production verification remains pending until CI deploy completion and live visual checks.

## 2026-09-26 — Cloudflare API Rate-Limit Deployment Repair
- Verified a fresh CI retry reproduced the deployment blocker as Cloudflare HTTP 429 on the Worker deployments endpoint after successful Next.js and OpenNext builds.
- Added a bounded retry/backoff around the existing Wrangler publish command, retrying only recognized Cloudflare rate-limit responses.
- Kept the repair limited to `.github/workflows/deploy-open-next.yml`; no application code or secrets changed.
- Production CSS verification remains pending until the deployment completes successfully.

## 2026-09-26 — Cloudflare Retry Control-Flow Correction
- Verified the first retry wrapper did not reach its classification logic because the runner's default `-e` setting exited on Wrangler's non-zero 429 status.
- Corrected the wrapper to capture Wrangler failures safely and apply the intended rate-limit retry policy.
- Scope remains limited to `.github/workflows/deploy-open-next.yml`; no application runtime or secrets changed.

# Progress

## 2026-09-26 — Standard Audio Stale-Fallback Lifecycle Repair
- Re-checked the lifecycle race reported by Sourcery on PR #1262 against current `main`.
- Confirmed that the existing mounted/transaction checks covered `ctx.resume()` and successful decode completion, but did not cover the `preloadPromise` result before the fallback branch.
- Added an unconditional mounted/transaction guard immediately after the preload await so stale operations return instead of invoking Howler fallback audio.
- Added the same stale-operation guard in the Web Audio initialization catch path so unmounted/superseded operations cannot schedule fallback audio.
- Kept the repair limited to `app/lucky-card-reveal.js` runtime logic; no timing, assets, visuals, or tier choreography changed.
- Verification pending: CI/build/test checks and final diff audit.


## 2026-09-26 — OpenNext Remote Cache Deployment Repair
- Deep-dived the supplied production recording and verified the regression is visual/layout-wide, not an audio defect.
- Forced live production retrieval and verified homepage/reveal HTML referenced stale CSS assets `cc4b9b8ab9f722ff.css` and `ac4b46593ca20d2e.css`.
- Inspected those live CSS assets and verified Tailwind utilities required by the rendered markup were missing, while literal Tailwind directives remained.
- Verified the GitHub deployment workflow cleared local `.next/cache` and `.open-next` but then deployed with raw `wrangler deploy`, while the repository uses the OpenNext R2 incremental cache.
- Confirmed the OpenNext Cloudflare CLI deploy path populates the remote cache before calling Wrangler.
- Changed `.github/workflows/deploy-open-next.yml` to use `pnpm exec opennextjs-cloudflare deploy --config ./wrangler.jsonc` after the existing build/worker checks.
- Updated `memory-bank/activeContext.md` with the verified diagnosis and scope.
- Verification pending: remote CI/build and post-deployment live visual verification.

## 2026-09-26 — Production CSS Regression Repair
- Compared known-good `e1e7d2f` against current `f740f66` and confirmed PR #1261 explicitly deleted:
  - `postcss.config.js`
  - `tailwind.config.js`
- Confirmed the current application still uses Tailwind CSS v3 directives in `app/globals.css` and still declares Tailwind/PostCSS/Autoprefixer dependencies.
- Restored both configuration files verbatim from the known-good `e1e7d2f` baseline on branch `fix/restore-tailwind-postcss-after-audio`.
- No audio or visual application code was changed by this repair.

# Progress

## COMPLETED
- Verified the current Lucky Card Reveal audio implementation uses 6 active reveal sound assets, not 7.
- Verified the previous implementation contained rate-randomized repeated impacts and a looping post-flip electrical arc.
- Implemented a scoped audio-choreography repair in `app/lucky-card-reveal.js`:
  - removed impact-rate randomization;
  - replaced final beam replay/rate escalation with a continuous energy bed plus volume escalation;
  - separated beam fade-out from the final discharge;
  - moved residual electrical audio to after the completed 3D flip;
  - changed the electrical arc from a loop to a finite, fading pass.
- Preserved existing visual timing, tier hit counts (Standard 3 / Premium 4 / Flagship 5), card artwork, reduced-motion behavior, and unrelated site audio.

## 2026-09-24 - Lucky Card Audio Choreography Repair
- Branch: `fix/lucky-card-audio-choreography`
- Commit: `0dbad92e16667100fe3bff15fcbfbb8b3eb445f2`
- Verification status at this checkpoint: code diff reconciled to a single changed application file; CI/browser verification still required before completion.

## 2026-09-25 — Lucky Card Audio Runtime Repair
- Branch: `fix/lucky-card-audio-runtime`
- Fixed the confirmed looping-audio lifecycle defect in `app/lucky-card-reveal.js`.
- Removed the looping reveal bed and rebuilt the reveal audio as finite synchronized cues using existing repository sound assets.
- Added tracked audio timer cleanup and a hard final stop.
- Restored `playButtonClick()` for the reveal button as a separate cue.
- Source-level verification completed; browser/runtime playback verification remains pending.


## 2026-09-25 — Measured Audio Timing Repair
- Analyzed the supplied Standard reveal capture and extracted soundtrack rather than relying on filenames alone.
- Measured repository MP3 source lengths by parsing their actual frame headers.
- Confirmed the long-tail risk: several reveal cues are multi-second assets, including `mixkit-cinematic-impact.mp3` (9.012s), `final_discharge.mp3` (7.706s), `reveal_snap.mp3` (4.049s), and `mixkit-firework-crackle.mp3` (22.805s).
- Updated `app/lucky-card-reveal.js` so no long source is allowed to run as an unbounded reveal layer; each cue is explicitly faded/stopped inside its visual phase.
- Replaced the per-hit long impact/magic stack with the measured 1.620s `beam_impact.mp3`, hard-bounded to the contact event.
- Replaced the 22.805s firework crackle post-flip cue with the 2.247s `electrical_arc.mp3` and hard-stopped it after the intended runoff window.
- No visual choreography, tier counts, card artwork, reset, collection, share, or reduced-motion behavior was intentionally changed.
## 2026-09-25 — Lucky Card Reveal Standard Audio Sync Repair
- Identified precise waveform peaks for beamApproach (1.04s) and beamImpact (0.208s peak, 0.13s audible start).
- Adjusted app/lucky-card-reveal.js audio scheduling so beam_impact.mp3 plays 0.13s early and mixkit-cinematic-whoosh.mp3 skips its first 0.64s.
- Flawlessly aligned audio climaxes to the verified visual contact timing (0.4s) for Standard hits without adding dependencies, changing visuals, or expanding scope.

## 2026-09-25 — Standard-Tier Audio Sound-Design Repair
- Branch: `fix/lucky-card-standard-audio-sound-design`
- Changed `app/lucky-card-reveal.js` so **Standard only** uses a coherent layered sound sequence instead of isolated hit cues.
- Added the existing `beam_energy.mp3` as a short non-looping texture and `electrical_arc.mp3` as a bounded material/electrical response around each Standard contact.
- Shortened the Standard final discharge and reveal-snap tails so the flip/reveal does not become a long tonal audio bed.
- Preserved the verified PR #1242 timing compensation: `beamApproach` seeks to 0.64s and `beam_impact.mp3` is scheduled 0.13s before the visual contact to compensate for source leading silence.
- Premium and Flagship audio choreography was deliberately left unchanged.
- No visual/VFX timing or artwork changes were made.
- Verification still required: repository tests/build and final diff inspection before merge.

## 2026-09-25 — Gemini GitHub Integration Cleanup
- Verified PR #1233 removed the repository GitHub Actions workflow that invoked Gemini CLI.
- Confirmed the current `main` branch contains no `run-gemini-cli` action, `@gemini-cli` trigger, or dedicated Gemini Code Agent workflow.
- Preserved the site's separate Gemini-powered Oracle endpoint in `functions/api/oracle.js`.
- Removed the obsolete `.gemini/` ignore rule left over from the removed GitHub integration.


## 2026-09-25 — Security License and GitHub Actions Pinning
- Removed the stale npm `package-lock.json`, eliminating the flagged optional LGPL `@img/sharp-libvips-*` lockfile entries. The authoritative dependency lockfile remains `pnpm-lock.yaml`.
- Pinned every third-party action in `.github/workflows/deploy-open-next.yml`, `.github/workflows/update-spec-kit.yml`, and `.github/workflows/validate-open-next-repair.yml` to full 40-character commit SHAs.
- No application runtime code or dependency versions were changed.


## 2026-09-25 — GCP Key Redaction and Action Pin Monitoring
- Verified the three flagged workflows already had immutable 40-character action pins.
- Redacted 9 `AIza...` values from `.docs/deep-dive/_android_developers.md` and added weekly Dependabot monitoring for GitHub Actions.
## 2026-09-25 — Lucky Card Reveal Web Audio Implementation (Standard Tier)
- Identified the synchronization and mobile initialization problem caused by scheduling Howler.js using JavaScript `setTimeout` inside a loop for the Standard tier reveal sequence.
- Refactored `app/lucky-card-reveal.js` to utilize the native Web Audio API for precise scheduling for the Standard tier.
- Audio buffers are fetched on mount, decoded upon the user interaction event, and scheduled strictly against `audioContext.currentTime` using absolute offsets.
- Volume fades were implemented using `linearRampToValueAtTime` to remove reliance on async library wrappers.
- The Premium/Flagship tier fallback and visual sequencing were retained as required.


## 2026-09-26 — Cloudflare Deployment Concurrency Guard
- Branch: `fix/cloudflare-deploy-concurrency`
- Added workflow-level GitHub Actions concurrency control to `.github/workflows/deploy-open-next.yml` with group `cloudflare-deploy` and `cancel-in-progress: true`.
- Preserved the existing rate-limit-aware deployment backoff and direct Wrangler/OpenNext bypass path.
- No application runtime or secret changes.
- CI verification remains pending.


## 2026-09-26 — Standard Reveal Tonal-Cue Repair

- Supplied Standard capture `6384.mp4` was measured at the intended 1.6s hit cadence, with a highly repetitive narrow ~2.1 kHz transient approximately +0.20s into each ordinary hit.
- Current Standard Web Audio scheduling was traced to the `beamEnergy` cue: it begins at `hitStart + 0.08s`, matching the observed placement once the cue's internal transient is accounted for.
- Removed only the Standard playback scheduling for `beamEnergy` in `app/lucky-card-reveal.js`.
- Preserved the Web Audio origin repair from PR #1271, approach/impact timing, final cues, all visual/VFX behavior, and Premium/Flagship choreography.
- Runtime confirmation after rebuilding the branch remains the final verification step; no claim of post-fix browser/device playback has been made.

## 2026-09-26 — Standard Reveal Fresh Audio Asset Rebuild
- Deep-audited the seven existing Standard reveal MP3s from their actual binary contents after the rendered recording showed a recurring computer-like tone.
- Verified `beam_impact.mp3` itself contained the strongest matching narrow tonal structure; source replacement was therefore justified rather than another timing-only patch.
- Sourced eight fresh Mixkit sound-effect assets for Standard-only use and independently checked each candidate for the targeted 2.1 kHz / 1.56 kHz tonal signature before ingestion.
- Added a dedicated Standard audio palette:
  - beam shot
  - physical beam impact
  - subtle card shake
  - stronger final beam
  - mechanical final lock
  - final electrical discharge
  - reveal snap
  - post-flip electrical arc
- Implemented Standard-only Web Audio scheduling and a Standard-only Howler fallback in `app/lucky-card-reveal.js`, while preserving the existing Premium/Flagship legacy asset path.
- Final asset binaries were re-audited after ingestion; all eight passed the same targeted tonal checks.
- No visual/VFX, artwork, tier counts, reset/countdown, collection, share, database, authentication, payment, deployment, or secrets were changed.
- Verification pending: repository CI/build/browser playback capture and final diff audit.

## 2026-09-26 — Standard Audio Fallback Timing Repair
- Addressed Sourcery review finding in the Standard Howler fallback.
- Verified the fallback had no delay around beam, impact, shake, lock, discharge, snap, or post-flip arc playback, causing all fallback cues to fire at reveal start.
- Added matching `scheduleAudio` delays:
  - beam: `hitStart * 1000`
  - impact: `(contact - 0.19) * 1000`
  - shake: `(contact - 0.14) * 1000`
  - final lock: `(hitStart + 0.13) * 1000`
  - final discharge: `finalFlipStartForAudio * 1000`
  - reveal snap: `Math.max(0, finalFlipEndForAudio - 0.65) * 1000`
  - electrical arc: `postFlipStart * 1000`
- No visual/VFX or Premium/Flagship behavior was changed.


## 2026-09-26 — Critical Build/Deployment Safeguards
- Added in-file authorization warnings to the restored Tailwind and PostCSS configuration files.
- Added in-file authorization warnings around the Cloudflare deployment concurrency and rate-limit retry safeguards.
- Preserved all existing configuration and deployment behavior; this is repository-hardening only.


## 2026-09-27 — OpenNext Cloudflare 1.20.6 Dependency Update

- Investigated `@opennextjs/cloudflare` separately from the preceding Wrangler update so dependency causality remains isolated.
- Verified compatibility of OpenNext 1.20.6 with the repository's Next.js 16.3.6 and Wrangler 4.141.0 baseline.
- Updated `package.json` to pin `@opennextjs/cloudflare` at 1.20.6 and updated `pnpm-lock.yaml` to the matching OpenNext Cloudflare 1.20.6 / OpenNext AWS 4.1.4 graph.
- PR #1280 validation run 553 passed all repository checks without deployment.
- Final verification confirmed the Next.js build, OpenNext Cloudflare build, Tailwind compilation, `.open-next` worker/assets outputs, Wrangler build validation, and Git status all passed.


## 2026-09-27 — Tailwind CSS 4.2.4 migration verification
- Final lockfile is intentionally constrained to the Tailwind 4.2.4 dependency graph; unrelated `latest`/peer refreshes were rejected.
- Final validation passed with the frozen lockfile and the repository's normal PR CI.
- Verified build sizes: `.next` 291 MB; `.open-next` 96 MB.
- Temporary verification workflow was removed before finalization.


## 2026-09-27 — Premium/Flagship Web Audio Rename Repair

- Fixed the incomplete `standardWebAudioReady` → `webAudioReady` rename in `app/lucky-card-reveal.js` from the Q follow-up commit on PR #1285.
- Updated the Web Audio unavailable fallback comment to describe recognized-tier fallback rather than Standard-only behavior.
- Scope remains limited to the existing all-tier Web Audio extension; no new assets, visual/VFX, timing, or tier-count changes.
