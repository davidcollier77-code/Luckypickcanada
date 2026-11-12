# Tasks: Playwright Chromium Runtime Environment

**Input**: Design documents from `specs/146-playwright-chromium-runtime/`
**Prerequisites**: `plan.md`, `spec.md`

## Phase 1: Specify

- [x] T001 Read `AGENTS.md`, the four Memory Bank files, `README.md`, `scripts/setup-chromium-libs.sh`,
  `scripts/setup-playwright-agent.sh`, `playwright.config.ts`, `tests/visual/playwright-fontconfig.ts`, the startup
  guard test and `specs/137-startup-chromium-readiness/`.
- [x] T002 Record the baseline: libraries and browser present, `--check` passing, and a plain headless launch still
  failing with `libnspr4.so` (exit 127).
- [x] T003 Prove why the exports never arrived: `bash -c` tool shell (`$-` = `hBc`), no `BASH_ENV`, no
  `~/.profile`/`~/.bashrc`.
- [x] T004 Write `spec.md` and `plan.md`.

## Phase 2: Plan

- [x] T005 Write this task list and point `.specify/feature.json` at this feature.

## Phase 3: Implement

- [x] T006 `scripts/setup-chromium-libs.sh`: check both Chromium binaries and the fontconfig files, reuse a complete
  prefix, emit idempotent POSIX exports, add `--persist`.
- [x] T007 `scripts/setup-playwright-agent.sh`: apply the Chromium environment to its own process before probing.
- [x] T008 `playwright.config.ts`: inject the provisioned library and font paths for Playwright Test.
- [x] T009 `README.md`: add the persist step and document the three shell cases.
- [x] T010 `__tests__/freebuff-startup-command.test.js`: new pinned command, ordering, fixture `--persist` stand-in and
  a probe-environment assertion.

## Phase 4: Verify

- [x] T011 `bash -n` on both scripts; `--check`, plain run, `--persist` twice.
- [x] T012 Probe with no library environment in the calling shell.
- [x] T013 `bash -lc` environment check, double-source stability, one profile block after two startup runs.
- [x] T014 Playwright Test in a shell with no library environment (`gold-cta`, desktop).
- [x] T015 Cold provisioning into a throwaway prefix.
- [x] T016 The documented startup command twice; real browser interaction with `playwright cli`.
- [x] T017 `pnpm exec vitest run __tests__/freebuff-startup-command.test.js`, `pnpm exec tsc --noEmit`,
  `./freebuff-verify.sh`, build size and diff audit.

## Dependencies

- T006–T010 depend on T001–T005.
- T011–T017 depend on T006–T010.

## Implementation Strategy

One tooling change set inside the existing scripts and the one Playwright config. No new script, dependency or
application behaviour: the persistent environment reuses `~/.local/chromium-libs`, and the guard test keeps
`README.md` and the shipped command from drifting apart again.
