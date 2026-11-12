# Feature Specification: Reliable Playwright Browser Work in a Cold Freebuff Cloud Workspace

**Feature Branch**: `freebuff/db0186c675176d0ca7d8d91e`
**Created**: 2026-11-12
**Status**: Implemented

**Input**: Owner request to make the repository's Playwright browser automation work every time it is needed in the
Freebuff Cloud workspace, with no manual setup and no repeated failures, on an account that only has an Android phone.

## Verified baseline (2026-11-12, this workspace)

- The documented startup command never ran for this chat: `$HOME` was created empty, with no `node_modules`, no
  `~/.local/chromium-libs`, no `~/.cache/ms-playwright`, and no `.profile`/`.bashrc`. `agent-output.log` began with the
  first agent command, so no startup output exists for the session.
- `scripts/setup-chromium-libs.sh` did not parse at HEAD: `line 186: unexpected EOF while looking for matching '`.
  The reuse branch read `printf '%s\n  echo` where it must read `printf '%s\n' "$check_output"`. Every provisioning,
  check and persist path was therefore dead, and the startup command would have stopped at that step.
- A bare `pnpm exec playwright cli open https://luckypickcanada.ca` in a non-interactive `bash -c` shell failed with
  `Chromium distribution 'chrome' is not found at /opt/google/chrome/chrome`, because the CLI's default channel is a
  system Chrome the image does not ship.
- With the syntax fixed, `bash scripts/setup-chromium-libs.sh` provisioned 27 MB of libraries and reported
  `PASS 2 Chromium binaries link with 0 missing shared objects`.
- With the libraries applied and `--browser=chromium`, the CLI opened the live site, reported the correct title, and
  captured a 1.5 MB screenshot.

## User Scenarios & Testing

### User Story 1 — One command works from a cold workspace (Priority: P1)

An agent in a freshly created chat runs a single command and drives a browser, without installing anything first,
exporting variables, or remembering a browser flag.

**Independent Test**: In a workspace with the libraries removed, `./scripts/playwright-cli.sh open
https://luckypickcanada.ca` provisions what is missing, launches, and returns the real page title.

**Acceptance Scenarios**

1. Given a workspace with no `~/.local/chromium-libs`, when the wrapper runs, then it provisions 27 MB of libraries and
   loads the page.
2. Given a provisioned workspace, when the wrapper runs again, then it re-uses the libraries and the browser.
3. Given no `node_modules`, when the wrapper runs, then it installs the frozen dependency tree first.

### User Story 2 — No manual environment or channel flags (Priority: P1)

A non-interactive shell launches the pinned Chromium, not a system Chrome, and finds its shared libraries and fonts
without the caller exporting anything.

**Independent Test**: `env -u LD_LIBRARY_PATH ./scripts/playwright-cli.sh --raw eval "() => document.title"` returns the
site title.

**Acceptance Scenarios**

1. Given a shell with no `LD_LIBRARY_PATH`, `FONTCONFIG_FILE` or `FONTCONFIG_PATH`, when the wrapper launches, then it
   succeeds.
2. Given `open` with no `--browser`, when the wrapper runs, then it selects the pinned Chromium.
3. Given an explicit `--browser=firefox`, when the wrapper runs, then it does not override the choice.

### User Story 3 — A broken provisioning script cannot ship again (Priority: P2)

A shell script that does not parse fails the test suite instead of disabling browser work silently.

**Independent Test**: `pnpm exec vitest run __tests__/playwright-cli-wrapper.test.js` fails when any script under
`scripts/` is made syntactically invalid.

**Acceptance Scenarios**

1. Given a mangled quote in any `scripts/*.sh`, when the suite runs, then the test reports the failing file.
2. Given valid scripts, when the suite runs, then it passes.

### Edge Cases

- A restored workspace drops `node_modules`, the browser cache and the libraries; the wrapper re-checks each rather
  than trusting a marker.
- A previous browser daemon may still be running; the wrapper does not terminate one, and `close`/`close-all` remains
  the caller's explicit action.
- `playwright test` needs none of this because `playwright.config.ts` already injects the same paths.

## Requirements

- **FR-001**: `scripts/setup-chromium-libs.sh` MUST parse, and MUST print the reuse message followed by `check` output
  and the environment snippet when a complete prefix already exists.
- **FR-002**: A new `scripts/playwright-cli.sh` MUST install missing dependencies, provision missing libraries, install
  the pinned browser when absent, apply the runtime environment, and exec `pnpm exec playwright cli`.
- **FR-003**: The wrapper MUST add `--browser=chromium` to `open` when the caller supplied no `--browser`.
- **FR-004**: The wrapper MUST pass `test` through to `pnpm exec playwright test` without changing its arguments.
- **FR-005**: The wrapper MUST support `--dry-run`, printing the resolved command and changing nothing.
- **FR-006**: `__tests__/playwright-cli-wrapper.test.js` MUST assert that every script in `scripts/` parses and MUST
  cover the `open`, explicit-browser, non-launch and `test` argument paths.
- **FR-007**: `README.md` MUST document the wrapper as the command for interactive browser work, replacing the manual
  `eval`-and-`--browser` instruction.
- **FR-008**: `.agents/skills/playwright-cli/SKILL.md` and its Lucky Pick Canada reference MUST direct agents to the
  wrapper, so a later chat finds it without being told.

## Success Criteria

- **SC-001**: Cold library provisioning followed by a wrapper launch loads the live site in one command (measured
  6.3 s with the libraries removed).
- **SC-002**: A wrapper `eval` with `LD_LIBRARY_PATH` unset returns
  `Lucky Pick Canada | Daily Lucky Picks, Cards & Stories`.
- **SC-003**: A screenshot captured through the wrapper is a valid 1.5 MB PNG.
- **SC-004**: The focused suite passes (5 tests) and `./freebuff-verify.sh` passes.
- **SC-005**: No application code, dependency, lockfile, workflow, hosting or secret change.

## Assumptions

- Freebuff Cloud does not run the project startup command for this workspace, so setup must be self-healing at first
  use rather than dependent on a platform setting the repository cannot read.
- The pinned Chromium (1248) and the private library prefix are the only browser runtime this image needs.
- `--browser=chromium` remains necessary while the image ships no system Chrome.
