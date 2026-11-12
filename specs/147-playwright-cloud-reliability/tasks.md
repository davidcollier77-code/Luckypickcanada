# Tasks: Reliable Playwright Browser Work in a Cold Freebuff Cloud Workspace

**Feature**: `specs/147-playwright-cloud-reliability`

## Phase 1 — Diagnosis

- [x] **T001** Confirm the workspace was cold: no `node_modules`, no `~/.local/chromium-libs`, no
  `~/.cache/ms-playwright`, no `.profile`/`.bashrc`, and an `agent-output.log` with no startup output.
- [x] **T002** Run `bash -n` over every shell script and find `scripts/setup-chromium-libs.sh` failing with
  `unexpected EOF while looking for matching '` at the reuse branch.
- [x] **T003** Reproduce the bare-shell failure: `Chromium distribution 'chrome' is not found at /opt/google/chrome/chrome`.

## Phase 2 — Repair and provision

- [x] **T004** Restore `printf '%s\n' "$check_output"` in `scripts/setup-chromium-libs.sh`.
- [x] **T005** Install the frozen dependency tree (pnpm 10.30.3, 22 s) and provision the libraries (27 MB,
  `PASS 2 Chromium binaries link with 0 missing shared objects`).
- [x] **T006** Prove the working incantation: libraries applied plus `--browser=chromium` opens
  `https://luckypickcanada.ca` and captures a screenshot.

## Phase 3 — Make it one command

- [x] **T007** Add `scripts/playwright-cli.sh` with dependency, library, browser and environment preparation, the
  Chromium channel default, `test` pass-through and `--dry-run`.
- [x] **T008** Add `__tests__/playwright-cli-wrapper.test.js`: parse guard for every script plus the four argument paths.

## Phase 4 — Documentation

- [x] **T009** Replace the README's manual `eval`/`--browser` instruction with the wrapper.
- [x] **T010** Point `.agents/skills/playwright-cli/SKILL.md` and its Lucky Pick Canada reference at the wrapper.

## Phase 5 — Verification

- [x] **T011** Focused suite: 5 tests pass.
- [x] **T012** Cold self-heal: move the library prefix aside, run the wrapper, confirm it re-provisions and loads the
  live site (6.3 s).
- [x] **T013** Run with `LD_LIBRARY_PATH` unset and confirm the correct page title, then capture a 1.5 MB screenshot.
- [x] **T014** Run `./freebuff-verify.sh` and confirm the governance gate, type check, production build and
  refresh-docs tests pass.
