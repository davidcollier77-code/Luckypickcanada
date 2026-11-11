# Tasks: Freebuff Startup Chromium Readiness

**Input**: Design documents from `specs/137-startup-chromium-readiness/`
**Prerequisites**: `plan.md`, `spec.md`

## Phase 1: Specify

- [x] T001 Read `AGENTS.md`, the four Memory Bank files, `.docs/manifest.json`, `README.md`, both startup scripts,
  `scripts/setup-chromium-libs.sh`, `scripts/setup-playwright-agent.sh`, `playwright.config.ts`, the guard test and the
  Node.js 26 migration and startup-command specs.
- [x] T002 Record the baseline: Node.js 26.13.0, pnpm 10.30.3, frozen install passing, Playwright 1.64.1 and
  Chromium 1248 present, Chromium system libraries absent, `sudo` refused.
- [x] T003 Prove the defect: a cold Chromium launch fails on `libnspr4.so`, and
  `./scripts/setup-playwright-agent.sh --probe-browser` exits 126.
- [x] T004 Write this feature's `spec.md` and `plan.md`.

## Phase 2: Plan

- [x] T005 Write this task list and point `.specify/feature.json` at this feature.

## Phase 3: Implement

- [x] T006 Update the startup command in `README.md` to provision the Chromium libraries, export their paths, and probe
  a real launch; document every step.
- [x] T007 Update `__tests__/freebuff-startup-command.test.js` to the new documented string, the new ordering
  assertions, and fixture stand-ins for the Chromium and probe scripts.
- [x] T008 Make `scripts/setup-playwright-agent.sh` executable in the Git index.

## Phase 4: Verify

- [x] T009 Run the focused startup and bootstrap Vitest suites.
- [x] T010 Run the documented command verbatim and confirm the two PASS lines, the exit status and the warm timing.
- [x] T011 Force the provisioning branch with a throwaway library prefix and confirm it recovers.
- [x] T012 Run `./freebuff-verify.sh`, measure the production build against 495 MiB, and audit the final diff.

## Dependencies

- T006–T008 depend on T001–T005.
- T009–T012 depend on T006–T008.

## Implementation Strategy

One documentation/test/mode change set. No new script, dependency or application behaviour: the command reuses the
repository's existing provisioning and setup scripts, and the guard test keeps `README.md` and the shipped command
from drifting apart again.
