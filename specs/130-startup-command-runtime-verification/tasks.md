# Tasks: Freebuff Startup Command Runtime Verification

**Input**: Design documents from `specs/130-startup-command-runtime-verification/`
**Prerequisites**: `plan.md`, `spec.md`

## Phase 1: Specify

- [x] T001 Read `AGENTS.md`, all four Memory Bank files and `.docs/manifest.json`; inspect `README.md`, `scripts/verify-startup.sh`, `scripts/bootstrap-pnpm.sh`, `__tests__/freebuff-startup-command.test.js`, `__tests__/bootstrap-pnpm.test.js`, `freebuff-verify.sh` and `specs/129-startup-command-verification/`.
- [x] T002 Confirm `HEAD` equals the fetched `main` tip `d09f945f` and that the only unrelated open PR is #1765 (DevSkim report).
- [x] T003 Write `specs/130-startup-command-runtime-verification/spec.md` and `plan.md`.

## Phase 2: Plan

- [x] T004 Write this task list and point `.specify/feature.json` at this feature.

## Phase 3: Implement (verification, no production change)

- [x] T005 Execute the installed command verbatim; record exit status, elapsed time, output order and pre/post lockfile hashes.
- [x] T006 Prove failure short-circuiting in disposable fixtures: missing, empty and oversized `AGENTS.md`; invalid manifest; invalid pnpm pin; failing install.
- [x] T007 Prove the bootstrap installs the pinned pnpm when absent, using an isolated `HOME` with no `pnpm` on `PATH`.
- [x] T008 Prove `CI=true` reaches the install process and that the install needs no interactive input.
- [x] T009 Probe `pnpm exec playwright cli --help` for exit status, elapsed time and browser processes; record that no browser launches.
- [x] T010 Confirm the Memory Bank files are checked, not preloaded, and that `AGENTS.md` §1 step 4 remains the loading path.
- [x] T011 Record the outcome in `memory-bank/activeContext.md`.

## Phase 4: Verify

- [x] T012 Run `bash -n` on `scripts/verify-startup.sh`, `scripts/bootstrap-pnpm.sh` and `freebuff-verify.sh`.
- [x] T013 Run the focused Vitest startup and bootstrap suites.
- [x] T014 Run `./freebuff-verify.sh` and measure the production build against the 495 MiB hard cap.
- [x] T015 Run `git diff --check`, audit the complete final diff and perform the second error check.
- [x] T016 Publish the PR with the evidence table, PR link and full HEAD SHA; confirm OPEN and UNMERGED.

## Dependencies

- T005–T011 depend on T001–T004.
- T012–T015 depend on T005–T011.
- T016 depends on T015.

## Implementation Strategy

Evidence-only change set: one Spec Kit feature directory plus the Memory Bank task record. The startup command, its scripts, `README.md` and the guard tests are exercised, not edited, unless a verified defect appears.
