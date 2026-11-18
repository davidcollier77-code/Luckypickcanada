# Tasks: Single-Download Reveal Audio Delivery

**Feature**: `specs/188-reveal-audio-delivery`

## Phase 1: Setup

- [X] T001 Read `AGENTS.md`, `PR_SUBMISSION.md`, the four Memory Bank files, the selected task groups and the applicable `.docs/` sources.
- [X] T002 Inspect the Howler preload effects, the Web Audio decode path and the Howler fallback in `app/lucky-card-reveal.js`.
- [X] T003 Confirm the duplicate cause: one `fetch()` per standard URL plus one Howler preload per same URL, eight URLs.

## Phase 2: Delivery

- [X] T004 Add one stable `createStandardHowls(sources)` factory with the unchanged authored volumes and preload flags.
- [X] T005 Feed Howler object URLs built from the already-fetched `ArrayBuffer`s, and revoke them on unmount.
- [X] T006 Keep the fetched buffers for the Web Audio decode path and keep the authored-URL fallback when the fetch fails.
- [X] T007 Guard against a late fetch creating audio after unmount.

## Phase 3: Verification

- [X] T008 Add `__tests__/reveal-audio-delivery.test.js` covering single URL references, object-URL delivery, preserved volumes, Web Audio path and fallback.
- [X] T009 Run the focused suite, the reveal/celebration/audio regression suites, `tsc --noEmit`, the full unit suite and `./freebuff-verify.sh`.
- [X] T010 Measure a clean production build and record the size.
- [X] T011 Capture a production-server browser request log for the reveal route.
