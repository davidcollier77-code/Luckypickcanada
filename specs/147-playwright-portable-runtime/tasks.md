# Tasks: Portable Playwright Chromium Runtime

**Input**: Design documents from `specs/147-playwright-portable-runtime/`
**Prerequisites**: `plan.md`, `spec.md`

## Phase 1: Specify

- [x] T001 Read `AGENTS.md`, the Memory Bank, `README.md`, both Playwright scripts, `playwright.config.ts`, the guard
  test and `specs/146-playwright-chromium-runtime/`.
- [x] T002 Reproduce the fresh-workspace failure in an empty `$HOME` (provisioning exits 1 on a missing browser).
- [x] T003 Measure profile delivery (`LD_LIBRARY_PATH` absent in command shells) and Playwright's global CLI config
  behaviour, including its default `chrome` channel.
- [x] T004 Write `spec.md` and `plan.md`.

## Phase 2: Plan

- [x] T005 Write this task list and point `.specify/feature.json` at this feature.

## Phase 3: Implement

- [x] T006 `setup-chromium-libs.sh`: `check_libs` (browser-independent), strict `check`, `--check-libs`, provisioning
  gate/verify, and a `write_cli_config` step inside `--persist`.
- [x] T007 `README.md`: new startup command, updated steps, and the statement that no environment variables are needed.
- [x] T008 `__tests__/freebuff-startup-command.test.js`: new pinned command, gate order, strict-check-after-probe and
  fixture behaviour.
- [x] T009 `.agents/skills/playwright-cli/references/lucky-pick-canada.md`: note the generated CLI config.

## Phase 4: Verify

- [x] T010 `bash -n`; `--check-libs` and `--check` on the provisioned prefix.
- [x] T011 Empty-home provisioning (exit 0, browser note) and `--persist` artifacts.
- [x] T012 CLI launch with no variables and no `--browser`, then snapshot, click, evaluate and close.
- [x] T013 Documented startup command twice; single profile blocks; CLI config content.
- [x] T014 Guard test, `tsc --noEmit`, `./freebuff-verify.sh`, build size, diff audit.

## Dependencies

- T006–T009 depend on T001–T005.
- T010–T014 depend on T006–T009.

## Implementation Strategy

Continuation of the same tooling theme with no new script: browser-independent readiness in the existing
provisioning script, and the browser environment delivered through Playwright's own config under `$HOME` instead of
hardcoded variables.
