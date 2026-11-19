# Tasks: Protect the Complete Reveal Window

**Feature**: `specs/191-reveal-window-protection`

## Phase 1: Setup

- [X] T001 Read `AGENTS.md`, `PR_SUBMISSION.md`, the Memory Bank files and the applicable `.docs/` sources.
- [X] T002 Inspect the `stageActive` effect, `handleReveal`, `animateReveal`, `handleStageComplete` and the three load-resume branches.
- [X] T003 Confirm the gap: the hold began at `colourSettleMs + eventDelayMs` after `anticipationMs`, 8,320 ms after the press.

## Phase 2: Protection window

- [X] T004 Add idempotent `protectRevealWindow`/`releaseRevealWindow` callbacks using `beginActiveExperience`.
- [X] T005 Take the hold in `handleReveal` before any timer, and in both animating resume branches.
- [X] T006 Release on `handleStageComplete`, on unmount, and from a bounded safety timer.
- [X] T007 Remove the now-redundant `stageActive` effect.
- [X] T008 Leave reduced motion without a hold, since it has no pre-roll or stage.

## Phase 3: Verification

- [X] T009 Add `__tests__/reveal-window-protection.test.jsx` (press-time hold, pre-roll survival, completion release, queued background resume, critical unblocked, unmount release, safety release).
- [X] T010 Run the focused suite, the existing cinematic/lifecycle suites, the full unit suite, `tsc --noEmit` and `./freebuff-verify.sh`.
- [X] T011 Measure a clean production build and record the size.
- [X] T012 Capture press-to-stage and press-to-completion timings in a production browser run.
