# Feature Specification: Freebuff Startup Chromium Readiness

**Feature Branch**: `freebuff/5a4ef38f3323a2930a7d92c1`

**Created**: 2026-11-11

**Status**: Implemented

**Input**: Owner request to update the Freebuff startup command so it provisions Chromium's Linux runtime libraries
and proves a real browser launch, and to make the Playwright setup script executable, keeping the README guard test
in sync. No application, dependency, workflow, integration, hosting or deployment change.

## Verified baseline

- `node --version` is v26.13.0; `.nvmrc` is `26`, `package.json#engines.node` is `26.x`, and all six workflows request
  Node.js 26. `env -i bash -lc` resolves `node` and `npm` from the login profile; `pnpm` is absent until the
  bootstrap runs.
- `source scripts/bootstrap-pnpm.sh` installs `pnpm@10.30.3` into `$HOME/.local` when missing and reports the pinned
  version; `CI=true pnpm install --frozen-lockfile` exits 0 (27.7 s cold, "Already up to date" warm).
- `pnpm exec playwright cli --help` exits 0 against Playwright 1.64.1, and `playwright-chromium`'s install script
  downloads Chromium 1248 into `~/.cache/ms-playwright`.
- **Defect 1**: no Chromium system libraries are present in the workspace image and `sudo` is refused by the "no new
  privileges" flag. A cold `pnpm exec playwright cli open` fails with
  `error while loading shared libraries: libnspr4.so`. `scripts/setup-chromium-libs.sh` provisions the libraries
  without root into `~/.local/chromium-libs` (10.9 s, 27 MB) and then reports `PASS … 0 missing shared objects`, but
  the startup command never invoked it, so every fresh workspace shipped a Chromium that could not start.
- **Defect 2**: `scripts/setup-playwright-agent.sh` was committed as `100644` while
  `.agents/skills/playwright-cli/references/lucky-pick-canada.md` documents `./scripts/setup-playwright-agent.sh
  --install-browser`. The documented form exits 126 (`Permission denied`); the toolkit test only greps the script's
  text, so nothing caught the mode.
- `__tests__/freebuff-startup-command.test.js` pins and executes the single startup command documented in `README.md`,
  so the command and the guard must change together.

## User Scenarios & Testing

### User Story 1 — A fresh workspace can launch Chromium (Priority: P1)

An agent opening a new workspace runs browser QA without diagnosing a missing shared object first.

**Independent Test**: Run the documented startup command in a workspace with no `~/.local/chromium-libs`; it exits 0
and prints `PASS: Chromium launched and rendered a probe page`.

**Acceptance Scenarios**:

1. Given an unprovisioned workspace, when the startup command runs, then the libraries are provisioned and a headless
   Chromium launch succeeds before the command exits.
2. Given an already-provisioned workspace, when the startup command runs, then provisioning is skipped and the browser
   install step is a no-op, so the warm path stays fast.
3. Given a provisioning failure, when the startup command runs, then it stops non-zero before the launch probe and the
   remaining steps do not run.

### User Story 2 — The documented command is the guarded command (Priority: P1)

`README.md` documents exactly one startup command, and the guard test executes that same string, including the new
steps and their order.

**Independent Test**: `pnpm exec vitest run __tests__/freebuff-startup-command.test.js`.

**Acceptance Scenarios**:

1. Given the repository, when the guard test runs, then the documented command equals the tested string and the new
   library, environment and probe steps run after the frozen install and the CLI check.
2. Given the documented command run in a fixture without `pnpm` on `PATH`, then the context check, the bootstrap and
   the install still execute in order, and the fixture's Chromium and probe stand-ins are invoked after them.

### User Story 3 — The setup script is runnable as documented (Priority: P2)

`./scripts/setup-playwright-agent.sh --probe-browser` runs instead of exiting 126.

**Independent Test**: `test -x scripts/setup-playwright-agent.sh` and the probe with the library environment applied.

## Requirements

- **FR-001**: The startup command MUST keep its existing guarded prefix and order: context check, pnpm bootstrap,
  `CI=true pnpm install --frozen-lockfile`, `pnpm exec playwright cli --help`.
- **FR-002**: It MUST provision Chromium's Linux libraries through `scripts/setup-chromium-libs.sh`, invoking the
  provisioning path only when `--check` fails.
- **FR-003**: It MUST export the provisioned library and font paths in the shell that runs the launch probe.
- **FR-004**: It MUST prove a real headless Chromium launch by running the repository setup script with
  `--install-browser --probe-browser`.
- **FR-005**: `README.md` MUST document exactly that command and explain every step, and MUST keep stating that the
  four Memory Bank files are checked, not preloaded.
- **FR-006**: `__tests__/freebuff-startup-command.test.js` MUST pin the new command and execute it in an isolated
  fixture that stands in for the Chromium and probe scripts.
- **FR-007**: `scripts/setup-playwright-agent.sh` MUST be executable in the Git index.
- **FR-008**: No application code, dependency, lockfile, workflow, integration, hosting, deployment, secret,
  `AGENTS.md` or `.docs/` change.

## Success Criteria

- **SC-001**: The documented command exits 0 in this workspace and reports both `PASS: pnpm exec playwright cli is
  available.` and `PASS: Chromium launched and rendered a probe page.`
- **SC-002**: A second run skips provisioning and completes without downloading anything.
- **SC-003**: The startup guard and bootstrap suites pass, and the documented command remains the only one in
  `README.md`.
- **SC-004**: `./freebuff-verify.sh` passes and the measured production build stays strictly below 495 MiB.
- **SC-005**: The final diff is limited to `README.md`, the guard test, the script mode, this feature's artifacts and
  the Memory Bank task record.

## Assumptions

- `scripts/setup-chromium-libs.sh` remains the supported no-root path; `playwright install --with-deps` is unavailable
  because it needs root.
- The library prefix under `$HOME` and the Playwright browser cache may be dropped when a workspace is restored, so
  both steps must stay in the startup command rather than being treated as one-off setup.
- Freebuff settings are stored outside the repository; this feature documents the value to paste there.
