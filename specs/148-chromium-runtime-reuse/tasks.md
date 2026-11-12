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

## Phase 5: Review follow-up on PR #1854

- [x] T014 Revision-validate the default browser cache, not only prebaked roots, and reject an incompatible install.
- [x] T015 Make `--browser-root` succeed only for the pinned revision, so `--install-browser` repairs a stale cache.
- [x] T016 Restrict `--check` to the pinned binaries so a stale revision is never reported as launchable.
- [x] T017 Add tests for the pinned read-only root, the wrong read-only revision, the pinned default cache and the
      stale default cache; make the binary assertions independent of a host system Chrome.
- [x] T018 Fix `validate-open-next-repair.yml` so pnpm is installed before `actions/setup-node` uses its cache.
- [x] T019 Add `__tests__/workflow-pnpm-setup-order.test.js` covering every workflow.
- [x] T020 Re-run the detection and guard tests, the real workspace checks, the full suite, the repository gate and
      the production build.

## Dependencies

- T006–T009 depend on T001–T005.
- T010–T013 depend on T006–T009.
- T014–T020 depend on the PR #1854 review findings and T006–T009.

## Implementation Strategy

Keep one provisioning script and make it prefer what the environment already has, instead of adding a second startup
path. Detection is a set of cheap file tests plus one cached `ldconfig` read, so the common case costs microseconds
and the fallback behavior is byte-identical to today.
