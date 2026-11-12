# Tasks: Reuse an Environment-Provided Chromium Runtime

**Input**: Design documents from `specs/148-chromium-runtime-reuse/`
**Prerequisites**: `plan.md`, `spec.md`

## Phase 1: Specify

- [x] T001 Read `AGENTS.md`, the four Memory Bank files, `.docs/manifest.json`, `README.md`, both Playwright scripts,
      `playwright.config.ts`, the guard test, `specs/146-*` and `specs/147-*`.
- [x] T002 Verify what the Cloud image actually provides (no browser, no `libnspr4.so`, no `/etc/fonts`, no
      `ms-playwright`) and confirm the repository cannot modify it (non-root, `no new privileges`, read-only `/usr`).
- [x] T003 Confirm the Playwright mechanisms: `PLAYWRIGHT_BROWSERS_PATH` at runtime, `PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD`
      at install time, and the pinned revision in `playwright-core/browsers.json`.
- [x] T004 Write `spec.md`.

## Phase 2: Plan

- [x] T005 Write `plan.md` and this task list; point `.specify/feature.json` at this feature.

## Phase 3: Implement

- [x] T006 `setup-chromium-libs.sh`: system-runtime detection (`has_system_runtime`, `ldconfig -p` cache), mode-aware
      `print_env`, `check_libs`, `check`, `write_cli_config`; prebaked browser roots (`pinned_chromium_revision`,
      `prebaked_browser_root`, `browser_root`, symlink-following discovery); `--browser-root`.
- [x] T007 `setup-playwright-agent.sh`: reuse an existing browser instead of installing it; help text updated.
- [x] T008 `__tests__/setup-chromium-runtime-detect.test.js`: five tests over the four directory overrides.
- [x] T009 `README.md` steps 5 and 8 plus the "Where the browser comes from" paragraph; skill reference note.

## Phase 4: Verify

- [x] T010 `bash -n` on both scripts; detection and guard tests.
- [x] T011 This workspace: `--check-libs`, `--check`, `--browser-root`, `--env`, `--persist`, `--install-browser`.
- [x] T012 Read-only pinned root: selection, export, persistence, real `playwright cli` launch; wrong-revision root
      ignored; restore the workspace config.
- [x] T013 `tsc --noEmit`, `./freebuff-verify.sh`, full unit suite, production build size, diff audit.

## Dependencies

- T006–T009 depend on T001–T005.
- T010–T013 depend on T006–T009.

## Implementation Strategy

Keep one provisioning script and make it prefer what the environment already has, instead of adding a second startup
path. Detection is a set of cheap file tests plus one cached `ldconfig` read, so the common case costs microseconds
and the fallback behavior is byte-identical to today.
