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
