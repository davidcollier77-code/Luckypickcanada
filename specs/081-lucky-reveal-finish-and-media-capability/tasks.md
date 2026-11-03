# Tasks: Lucky Reveal Finish Polish and Reusable Media Inspection

**Feature**: `specs/081-lucky-reveal-finish-and-media-capability`

## Phase 1 — Setup

- [x] T001 Confirm the shipped finish baseline: five confetti waves, `ticks: 150`, fixed `CONFETTI_WINDOW_MS` removal, image-only share ladder, infinite number glow, existing sparkle/pop and no video/audio tooling (`ffmpeg`, `ffprobe` absent; no audio model).
- [x] T002 Create `specs/081-lucky-reveal-finish-and-media-capability/` artifacts (spec, plan, tasks, checklist) and point `.specify/feature.json` at it.
- [x] T003 Reuse `scripts/setup-chromium-libs.sh` for browser checks; its security posture is unchanged (no root, no sandbox flag, `no-new-privileges` intact).

## Phase 2 — User Story 1 (leaves float off screen, US1)

- [x] T004 [US1] Raise the per-particle lifetime to 300 ticks so gravity carries every leaf past the bottom edge before expiry (`app/lucky-reveal-celebration.jsx`).
- [x] T005 [US1] Replace the fixed window with canvas pixel sampling (200 ms, starting 1400 ms after launch) plus a 12 s fallback timeout.
- [x] T006 [US1] Fade/unmount the particle layer only after that signal; wave counts (86 ≤ 96), palette, leaf shape and above-panel layering unchanged.

## Phase 3 — User Story 2 (native Android sharing, US2)

- [x] T007 [US2] Send files + message + link to `navigator.share` when the image payload is supported (`app/share-lucky-pick-button.js`).
- [x] T008 [US2] Fall back to a native text/link share before the custom window; both `AbortError`s report "Sharing cancelled." and open nothing.
- [x] T009 [US2] Keep the custom download / copy-image / copy-link window as the final fallback, including when the image cannot be prepared.

## Phase 4 — User Story 3 (four golden pulses, US3)

- [x] T010 [US3] Report confetti completion upward exactly once (`onConfettiSettled`) from the celebration.
- [x] T011 [US3] Add four staggered golden pulses around each number ball via a `::after` ring, leaving the ball's own animation untouched (`app/lucky-reveal-popup.js`).
- [x] T012 [US3] Clear the finishing class after the fourth pulse so the balls return to their normal appearance; reduced motion runs no pulses.

## Phase 5 — User Story 4 (finishing sound, US4)

- [x] T013 [US4] Source "Healing Spell Chime (Fantasy RPG)" by Assetsmith (Freesound) and verify the CC0 1.0 public-domain dedication on the sound page and the licence deed.
- [x] T014 [US4] Add `public/sounds/reveal-finish-chime.mp3` (mono 44.1 kHz, 2.77 s, 44,764 B) and its provenance record `public/sounds/reveal-finish-chime-sources.md`.
- [x] T015 [US4] Add `preloadRevealFinishChime`/`playRevealFinishChime` and play it once with the first pulse; opening sparkle and confetti pop preserved.

## Phase 6 — User Story 5 (video and audio inspection, US5)

- [x] T016 [US5] Add `scripts/setup-media-tools.sh` (idempotent, unprivileged): FFmpeg/FFprobe static build, private Python venv with vosk + torch + transformers, Vosk speech model, AudioSet model cache, `--check`/`--env`.
- [x] T017 [US5] Add `scripts/inspect-media.py` with `probe`, `frames`, `transcribe`, `events`, `audio` and `review`.
- [x] T018 [US5] Demonstrate a real audio review (speech transcript and sound-event labels) and a video frame review; evidence in `artifacts/media-inspection/`.

## Phase 7 — Tests and verification

- [x] T019 Add `__tests__/lucky-reveal-finish-phase2.test.js` and update the 080/076 celebration guards for the new lifetime, completion signal and finish wiring.
- [x] T020 Run the focused suites, full `pnpm exec vitest run`, `pnpm exec tsc --noEmit`, `./freebuff-verify.sh`, and measure the production build.
- [x] T021 Browser-verify the finish and the reduced-motion path in Chromium (desktop 1440x900, mobile 390x844); evidence in `artifacts/reveal-finish-phase2/`.
- [x] T022 Audit the final diff and record the results in the single PR summary ([PR #1687](https://github.com/davidcollier77-code/Luckypickcanada/pull/1687)), leaving the PR open and unmerged.

## Verification record

- Focused Vitest (`finish-phase2`, `confetti-phase1`, `celebration`, `LuckyRevealCelebration`, `followup`) — 5 files / 52 tests PASS.
- Full `pnpm exec vitest run` — 347 tests PASS.
- `pnpm exec tsc --noEmit` — exit 0.
- `./freebuff-verify.sh` — exit 0 (Spec Kit gate, typecheck, production build, refresh-docs 19/19).
- Production build `.next` — 299,540,437 bytes / 285.6 MiB on the first gate run and 339,394,765 bytes / 323.7 MiB on the re-run after the final comment edit; both are below the 495 MB hard maximum.
- `scripts/setup-media-tools.sh --check` — PASS ffmpeg 7.0.2, PASS ffprobe 7.0.2, PASS python audio stack (torch 2.15.0+cpu, transformers 5.22.1), PASS speech model, PASS audio-event model, PASS Chromium libraries; stack 1.5 G under `$HOME`.
- Real audio review: Vosk transcript of a CC0 speech recording (words with timings); AudioSet labels on the shipped reveal sounds (`Ding`, `Clang`, `Burst, pop`, `Chime`).
- Chromium probe (`artifacts/reveal-finish-phase2-probe.cjs`), launched with **no** `--no-sandbox`: desktop painted pixels 4506→16190 ms then empty at the same sample the layer left (`leavesGoneBeforeCleanup: true`); mobile 4266→12761 ms then empty; four-pulse class appeared only after the layer was gone, cleared after 4420 ms (desktop) / 4769 ms (mobile) with resting glow `0`; `reveal-finish-chime.mp3` requested on both; no page errors; reduced motion had no canvas, no pulse class and no chime request.
- Not verified: a physical Android share sheet (no device in this workspace) — the Web Share ladder is exercised by source guards and was not device-tested; audible playback (no audio output device here); the "supplied recording" was not present in this workspace, so the media capability is demonstrated on recordings built from workspace material.


## Phase 8 — Post-merge Cloudflare compile regression (2026-11-03)

- [x] T023 Reproduce the supplied build error against main and trace the duplicate
  `CONFETTI_WATCH_TIMEOUT_MS` declarations to the reveal component and its Phase 2 test.
- [x] T024 Keep the specified 12,000 ms fallback, remove the duplicate 30,000 ms
  declaration, and add a regression assertion that exactly one timeout declaration
  exists in `app/lucky-reveal-celebration.jsx`.
- [ ] T025 Run the focused reveal component and lifecycle tests, full
  `pnpm exec vitest run`, `pnpm exec tsc --noEmit`, `./freebuff-verify.sh`,
  and `npx @opennextjs/cloudflare build` on the hotfix PR head. Record each result
  independently and measure the production build against the 495 MB hard maximum.

### Hotfix verification record

- Supplied main build — **FAIL (pre-fix)**: duplicate identifier
  `CONFETTI_WATCH_TIMEOUT_MS` at `app/lucky-reveal-celebration.jsx:32`.
- Source and regression-test changes — implementation recorded; final PR diff audit pending.
- Focused tests — **PENDING**.
- Full Vitest — **PENDING**.
- TypeScript — **PENDING**.
- `./freebuff-verify.sh` — **PENDING**.
- OpenNext Cloudflare build and measured build size — **PENDING**.

## Phase 9 — Phase 2 polish (2026-11-03)

- [x] T026 Add `REVEAL_GLOW_PULSE_MS`, `preloadRevealGlowPulse`, `startRevealGlowPulse` and
  `stopRevealGlowPulse` to `app/lib/audio.js`.
- [x] T027 Generate the seamless 3 s atmospheric loop
  (`public/sounds/reveal-glow-pulse.wav` + `scripts/generate-reveal-glow-pulse.mjs`) and record its
  provenance in `public/sounds/reveal-glow-pulse-sources.md`.
- [x] T028 Start the atmosphere on the first ball's glow frame (`GLOW_START_MS`) and stop it with the
  reveal, sharing `REVEAL_GLOW_PULSE_MS` with the CSS glow animation.
- [x] T029 Measure painted pixels in the celebration, fire `onConfettiFinishing` at
  `FINISHING_LEAF_RATIO` of the peak, and keep the four pulses on the empty-canvas signal.
- [x] T030 Move the finishing chime to `startFinishingChime` (`onConfettiFinishing`) so it begins
  while a few leaves are still falling.
- [x] T031 Replace the single share button and modal with four always-visible actions: Share to Apps
  (share icon, native Web Share ladder) plus Copy the website link, Copy the image and Download the
  image, with an explicit graceful fallback.
- [x] T032 Add `getShareLink(reveal)` for the result's same-site link with a website fallback.
- [x] T033 Add `__tests__/lucky-reveal-phase2.test.js` and update the Phase 1/081/075 guards.
- [x] T034 Run focused and full Vitest, `tsc --noEmit`, `./freebuff-verify.sh`, measure the
  production build, and run the Chromium probe for both games, six and seven numbers, audio timing,
  all four sharing options, mobile native sharing and the fallback.
- [x] T035 Audit the final diff and update the single PR summary, leaving the PR open and unmerged.

### Phase 2 verification record

- Focused Vitest (`lucky-reveal-phase2`, `lucky-reveal-finish-phase2`, `lucky-reveal-celebration`,
  `components/LuckyRevealCelebration`) — **PASS** 4 files / 52 tests.
- Full `pnpm exec vitest run` — **PASS** 35 files / 366 tests.
- `pnpm exec tsc --noEmit` — **PASS** exit 0.
- `./freebuff-verify.sh` — **PASS** exit 0 (Spec Kit gate, typecheck, production build,
  refresh-docs 19/19).
- Production build `.next` — **PASS** 339,682,181 bytes / 323.9 MiB, below the 495 MB hard maximum.
- Chromium probe (`artifacts/reveal-phase2-probe.cjs`, evidence in
  `artifacts/reveal-phase2/report.json`) against the production build — **PASS** 41/41 checks over
  four scenarios: desktop 6 Pick Personal, desktop 7 Pick Gift, mobile 7 Pick Personal, mobile 6
  Pick Gift without Web Share. Six and seven numbers render in range; all four options are visible
  with 55–58 px (Share to Apps) and 70–75 px (the three preserved actions) tap targets; the native
  payload carries one 1.76–1.79 MB PNG, the stored numbers, and the site link; the atmosphere starts
  3.29–3.45 s after opening as a 3 s loop and stops on close; the chime begins with 173–2703 painted
  pixels still on the canvas (782–2543 ms before the canvas is cleared); the four pulses start only
  once the canvas is gone; without Web Share the fallback message appears and the three existing
  actions stay usable; no page errors.
- **Pending / not verified:** a physical Android device share sheet (the probe stubs
  `navigator.share`; no device exists in this workspace), audible playback (no audio output device),
  and a real-device visual check of the atmosphere mix level.

## Phase 10 — Phase 3 recorded applause and Android share repair (2026-11-03)

- [x] T036 Remove the generated pulse asset, its provenance and `scripts/generate-reveal-glow-pulse.mjs`.
- [x] T037 Source Mixkit "Small group cheer and applause" (478), verify the Sound Effects Free License
  for commercial web use and no required attribution, and record all provenance in
  `public/sounds/reveal-applause-sources.md`.
- [x] T038 Derive `public/sounds/reveal-applause.wav` (5.6 s, mono 44.1 kHz 16-bit, fades) and remove
  the finishing chime asset, helpers and provenance so it cannot clash.
- [x] T039 Replace the atmosphere and chime in `app/lib/audio.js` and `app/lucky-reveal-popup.js` with
  `preloadRevealApplause` / `playRevealApplause`, keeping the opening sparkle and confetti pop.
- [x] T040 Add session-owned audio lifecycle (`beginRevealAudioSession` / `endRevealAudioSession`),
  one request per session, immediate stop on close, and no late start after a close.
- [x] T041 Play the applause on the measured finishing cue (8 % of peak leaves, 2.5 s lead) after all
  numbers, while the golden pulses remain on the empty-canvas signal.
- [x] T042 Prepare the share image before the tap and call `navigator.share` synchronously from the
  tap, once, with eyes-open fallbacks for cancel, unsupported and failure.
- [x] T043 Report copying honestly and harden `getShareLink` against query, fragment and payment
  identifiers.
- [x] T044 Add `__tests__/lucky-reveal-phase3.test.js` and update the Phase 1/081/075 guards.
- [x] T045 Run focused and full Vitest, `tsc --noEmit`, `./freebuff-verify.sh`, measure the production
  build, and run the Phase 3 Chromium probe (both games, six and seven numbers, applause timing,
  close-during-load, reopen, share success/cancel/failure/unsupported).
- [x] T046 Audit the final diff and update the single PR summary, leaving the PR open and unmerged.

### Phase 3 verification record

- Focused Vitest (`lucky-reveal-phase3`, `finish-phase2`, `confetti-phase1`, `celebration`, `polish`) —
  **PASS** 5 files / 85 tests.
- Full `vitest run` — **PASS** 35 files / 373 tests.
- `tsc --noEmit` — **PASS** exit 0.
- `./freebuff-verify.sh` — **PASS** (Spec Kit gate, typecheck, production build, refresh-docs 19/19;
  final line "All verification steps passed").
- Production build `.next` — **PASS** 340,354,762 bytes / 343 MB, below the 495 MB hard maximum.
- Phase 3 Chromium probe (`artifacts/reveal-phase3-probe.cjs`; the JSON report it writes is generated
  locally and is not committed) against the production build — **PASS** 61/61 checks over six
  runs: desktop 6 Personal, desktop 7 Gift, mobile 7 Personal (cancel), mobile 6 Gift without Web
  Share, mobile 7 Personal (share failure), desktop 6 with a 6 s delayed applause load and an early
  close. Measured: applause requested once per reveal, only after all 6 or 7 numbers were visible and
  with 130–2836 painted leaf pixels still on screen; the media element was paused on close and no
  reveal played applause more than once; a decode completing after close produced no applause play.
  `navigator.share` was called 1–3 ms after the tap with a 1.76–1.77 MB PNG, the stored numbers and
  `https://luckypickcanada.ca`; cancellation reported "Sharing cancelled." with one call; a failing
  panel reported the explicit fallback with one call; no Web Share showed the fallback and left the
  three local actions; no page errors.
- **Not verified:** a physical Samsung/Android device share sheet (no device in this workspace) and
  audible playback/loudness (no audio output device). Both must be confirmed on real hardware before
  the share repair is called device-verified.

## Phase 11 — PR #1692 review repair (2026-11-03)

- [x] T047 Fetch and verify every DevSkim annotation on the PR head; classify each against its source.
- [x] T048 Recheck and keep the Amazon Q audio retry fix; add a behavioural regression test for a
  failed decode followed by a successful same-session retry and for a close before a late decode.
- [x] T049 Remove the generated `artifacts/reveal-phase3/report.json` that produced 36 loopback
  notices, keeping the probe script and local report generation.
- [x] T050 Document the DS137138 negative-fixture and DS172411 callable-timer false positives inline
  at their exact lines without widening any scanner allowlist.
- [x] T051 Re-run focused and full Vitest, `tsc --noEmit`, the DevSkim suppression tests and
  real-SARIF replay, `./freebuff-verify.sh`, and measure the production build.
- [ ] T052 Inspect the complete diff, update the single PR body, request an independent re-review, and
  leave the PR open and unmerged.

### Phase 4 verification record

- Focused Vitest (`reveal-applause-retry`, `lucky-reveal-phase3`) — **PASS** 2 files / 30 tests.
- Full `vitest run` — **PASS** 36 files / 376 tests.
- `tsc --noEmit` — **PASS** exit 0.
- DevSkim suppression unit tests — **PASS** 70 tests OK.
- DevSkim real-SARIF replay — **NOT RUN locally**: the replay requires the scanner's
  `devskim-alerts.sarif`, which only the CI DevSkim job produces; the job runs the same replay.
- `./freebuff-verify.sh` — **PASS**, final line "All verification steps passed".
- Production build — **PASS** `.next` 342,207,481 bytes / 326.35 MiB, `public` 32,840,043 bytes;
  combined 375,047,524 bytes, below the 495 MB hard maximum.
- DevSkim on the new head, the independent re-review, and the real-device checks remain to be recorded
  in the PR body.

## Phase 12 — Reveal roadmap Phase 3 audit: reliability and performance (2026-11-03)

- [x] T053 Establish the audit baseline: `pnpm install --frozen-lockfile`, full Vitest 36 files / 376
  tests PASS, `pnpm exec tsc --noEmit` exit 0, and search the repository for any existing sound control
  (none exists — the confirmed deficiency).
- [x] T054 Audit the six and seven pick experiences on an Android-emulated Chromium phone (Pixel 7 UA,
  412x915 and 390x844, Personal and Gift) with the new `artifacts/reveal-phase3-audit-probe.cjs`.
- [x] T055 Confirm the browser-autoplay path by rejecting every media `play()`, and confirm the
  `prefers-reduced-motion: reduce` path paints no canvas and requests and plays no sound.
- [x] T056 Confirm animation and sound cleanup after close: no dialog, canvas or celebration layer,
  no media element playing, and no applause after the close.
- [x] T057 Measure the reveal's sound assets and confirm Howler is still one lazy-loaded dependency;
  record the bytes rather than re-encoding the approved applause recording.
- [x] T058 Implement the confirmed deficiency: `setRevealAudioMuted`/`isRevealAudioMuted` in
  `app/lib/audio.js`, the 44 px `aria-pressed` toggle in `app/lucky-reveal-popup.js`, and the
  celebration-pop gate in `app/lucky-reveal-celebration.jsx`.
- [x] T059 Add `__tests__/reveal-audio-mute.test.js` (module behaviour) and the control guards in
  `__tests__/lucky-reveal-phase3.test.js`; supply the new export in the celebration component test's
  audio mock.
- [x] T060 Run focused and full Vitest, `tsc --noEmit`, `./freebuff-verify.sh`, and measure the
  production build against the 495 MB hard maximum.
- [x] T061 Audit the complete final diff, update the single PR summary, and leave the PR open and
  unmerged.

### Phase 3 audit verification record

- Focused Vitest (`lucky-reveal-phase3`, `reveal-audio-mute`, `components/LuckyRevealCelebration`,
  `lucky-reveal-celebration`) — **PASS** 4 files / 55 tests.
- Full `pnpm exec vitest run` — **PASS** 37 files / 385 tests.
- `pnpm exec tsc --noEmit` — **PASS** exit 0 (baseline and post-implementation).
- `./freebuff-verify.sh` — **PASS**, final line "All verification steps passed" (Spec Kit gate, type
  check, production build, refresh-docs 19/19). Run with `SPEC_KIT_BASE_REF=9b43b1da` because this
  workspace's `origin/main` ref is stale at `a2c1222a` (PR #1676) while the branch starts at
  `9b43b1da` (PR #1699 merge); the stale ref made the gate see 133 unrelated files and multiple
  feature directories.
- Production build — **PASS** `.next` 317,499,221 bytes / 302.8 MiB, `public` 32,840,043 bytes;
  combined 350,339,264 bytes / 334.1 MiB, below the 495 MB hard maximum.
- Chromium audit probe (`artifacts/reveal-phase3-audit-probe.cjs`) against the production build —
  **PASS** 156/156 checks over eight scenarios: Android Pixel 7 UA at 412x915 (6 Personal, 7
  Personal, 6 mute-before-cue, 6 mute-during-applause, 6 audio-blocked), Android 390x844 (7 Gift),
  390x844 reduced motion, and desktop 1440x900 (7). Measured: 0 px page and panel horizontal
  overflow in every run; panel 15..397 of 412 and 15..375 of 390; 44x44 sound control with
  `aria-pressed` and "Mute reveal sound"/"Unmute reveal sound"; close and sound controls never
  overlap and both hit-test to themselves; sharing actions 55–75 px tall, unclipped, non-overlapping;
  applause exactly once per reveal with 197–314 painted leaf pixels at the cue; muting before the cue
  produced 0 reveal cue plays afterwards while the golden pulses still ran; muting during the
  applause paused it with 0 media elements left playing; four rejected `play()` calls (autoplay
  blocked) produced 0 uncaught errors, 2 expected playback logs, painted leaves and the pulses, with
  close and map usable; reduced motion painted no canvas (55 samples) and played 0 reveal cues;
  closing removed the dialog, canvas and celebration layer with nothing playing and no late applause.
- Sound assets the reveal requests (measured response bytes): `reveal-applause.wav` 493,964 (range
  request), `confetti-pop.wav` 43,244, `chime-sound.mp3` 20,435; the UI `button-click.wav` 35,918 is a
  separate user-initiated click. Howler remains the single lazy-loaded audio dependency; no new
  dependency was added and no asset was re-encoded.
- **Not verified:** a physical Samsung/Android device (the runs use Chromium Android emulation), the
  device-level mute and volume path, and audible playback/loudness (no audio output device in this
  workspace). Those are reported as unverified, never as passed.
