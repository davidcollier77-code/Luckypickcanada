# Tasks: Reuse an Already Loaded Responsive Image Derivative

**Feature**: `specs/189-image-derivative-dedupe`

## Phase 1: Setup

- [X] T001 Read `AGENTS.md`, `PR_SUBMISSION.md`, the Memory Bank files and the applicable `.docs/` sources.
- [X] T002 Inspect the image adapter, the readiness snapshots, the manifest registrations and both responsive `<picture>` implementations.
- [X] T003 Confirm that the second request comes from the hub's fixed derivative, not from the picture element.

## Phase 2: Identity reuse

- [X] T004 Add `imageIdentity(url)` (path only, `-<digits>w` removed, format and directory preserved).
- [X] T005 Add loaded-ness detection from hub loads, rendered images and resource-timing entries with delivered bytes.
- [X] T006 Reuse a loaded identity in `prepareImageResource` before any `Image` is created.
- [X] T007 Record hub-loaded identities and clear them in `resetResourceReadiness()`.
- [X] T008 Document the derivative-registration rule in the manifest.

## Phase 3: Verification

- [X] T009 Add `__tests__/resource-readiness-image-identity.test.js` (identity rules, reuse, unrelated artwork, resource timing, zero-byte entries, cross-experience reuse, reset).
- [X] T010 Run the focused suites, the full unit suite, `tsc --noEmit` and `./freebuff-verify.sh`.
- [X] T011 Measure a clean production build and record the size.
- [X] T012 Capture production-server request logs for both routes, with and without the loaded-ness signals masked.
