# Feature Specification: Playwright Chromium Runtime Environment

**Feature Branch**: `freebuff/0fe51d9fb70d7d5eedbd7455`
**Created**: 2026-11-12
**Status**: Implemented

**Input**: Owner request to make the repository's Playwright installation launch Chromium reliably in the Freebuff
workspace, fix the missing `libnspr4.so`, keep the fix working across workspace restarts, and deliver the exact
Freebuff startup configuration. No application, dependency, workflow, hosting or secret change.

## Verified baseline

- `scripts/setup-chromium-libs.sh` provisions Chromium's Linux libraries without root into
  `~/.local/chromium-libs` (27 MB) and `scripts/setup-playwright-agent.sh` installs and probes the project-pinned
  Chromium. Playwright 1.64.1, Chromium 1248, Node.js 26.13.0, pnpm 10.30.3.
- The libraries and browser were present and `scripts/setup-chromium-libs.sh --check` reported
  `PASS … 0 missing shared objects`, yet a plain Playwright launch in a non-interactive shell still failed:
  `chrome-headless-shell: error while loading shared libraries: libnspr4.so` (exit 127).
- Freebuff's tool shells are non-login, non-interactive `bash -c` processes (`$-` = `hBc`, `BASH_ENV` unset) and
  `$HOME` contained no `.profile` or `.bashrc`. The startup command's `eval "$(… --env)"` therefore died with that
  process, so every later shell started with no `LD_LIBRARY_PATH` and no `FONTCONFIG_*`.
- `--check` validated only the full `chrome` binary. A headless `chromium.launch()` runs
  `chrome-headless-shell`, so the check could report PASS while the headless path was still broken.
- A plain `bash scripts/setup-chromium-libs.sh` re-downloaded and re-unpacked all 18 packages even when the prefix was
  already complete.

## User Scenarios & Testing

### User Story 1 — Chromium launches without per-command setup (Priority: P1)

An agent runs the repository's Playwright test suite or setup probe in a fresh, non-interactive shell and Chromium
starts.

**Independent Test**: `env -u LD_LIBRARY_PATH -u FONTCONFIG_FILE -u FONTCONFIG_PATH pnpm exec playwright test
tests/visual/gold-cta.spec.ts --project=desktop` passes without exporting anything first.

**Acceptance Scenarios**:

1. Given a provisioned workspace, when a Playwright Test run starts in a bare shell, then Chromium launches and the
   tests execute.
2. Given a provisioned workspace, when `scripts/setup-playwright-agent.sh --probe-browser` runs with no library
   environment, then it applies the environment itself and prints `PASS: Chromium launched and rendered a probe page`.

### User Story 2 — The environment survives the startup process (Priority: P1)

The startup command's exports are not lost when it exits.

**Independent Test**: `bash -lc 'printf "%s" "$LD_LIBRARY_PATH"'` reports the prefix after startup has run.

**Acceptance Scenarios**:

1. Given the documented startup command has run, when a login or interactive shell starts later, then
   `LD_LIBRARY_PATH`, `FONTCONFIG_FILE` and `FONTCONFIG_PATH` are set and Chromium finds its libraries.
2. Given the startup command runs twice, then the shell profiles contain exactly one wired block and nothing is
   downloaded again.

### User Story 3 — A cold workspace recovers without root (Priority: P1)

A workspace whose prefix was dropped by a restore re-provisions from the startup command.

**Independent Test**: `CHROMIUM_LIBS_PREFIX=/tmp/chromium-cold bash scripts/setup-chromium-libs.sh` installs
`libnspr4.so` and passes the link check.

**Acceptance Scenarios**:

1. Given an empty prefix, when the startup command runs, then the packages are unpacked and the probe passes.
2. Given a complete prefix, when the startup command runs, then provisioning is skipped, no download happens and the
   browser install step is a no-op.

## Requirements

- **FR-001**: `scripts/setup-chromium-libs.sh --check` MUST validate every Playwright Chromium binary the workspace can
  launch (full `chrome` and `chrome-headless-shell`) and the fontconfig files.
- **FR-002**: A plain `scripts/setup-chromium-libs.sh` run MUST reuse an already-complete prefix instead of
  re-downloading and re-unpacking packages.
- **FR-003**: `scripts/setup-chromium-libs.sh --persist` MUST write `~/.local/chromium-libs/env.sh` and wire it into
  `~/.profile` and `~/.bashrc` through one guarded block that is rewritten idempotently.
- **FR-004**: `scripts/setup-chromium-libs.sh --env` MUST emit POSIX-compatible, idempotent exports that preserve an
  existing `LD_LIBRARY_PATH` precedence.
- **FR-005**: `scripts/setup-playwright-agent.sh` MUST apply that environment to its own process before probing, so
  the probe works with no caller setup.
- **FR-006**: `playwright.config.ts` MUST add the provisioned library and font paths to the browser environment when
  `~/.local/chromium-libs` exists, and MUST be a no-op on developer machines and CI runners that have system
  libraries.
- **FR-007**: The documented Freebuff startup command MUST provision, export, persist and probe, in that order, and
  `README.md` MUST document it as the value for the project startup setting.
- **FR-008**: `__tests__/freebuff-startup-command.test.js` MUST pin the documented command, execute it in an isolated
  fixture, and prove the probe inherits the exported paths.
- **FR-009**: No application code, dependency, lockfile, workflow, integration, hosting, deployment, secret,
  `AGENTS.md` or `.docs/` change.

## Success Criteria

- **SC-001**: A Playwright Test run in a shell with no library environment passes (`gold-cta`, 4/4).
- **SC-002**: `scripts/setup-playwright-agent.sh --probe-browser` prints both PASS lines with no caller setup.
- **SC-003**: The documented startup command exits 0 and a second run downloads nothing and leaves one profile block.
- **SC-004**: Real browser interaction works: `playwright cli open`, `click` and `screenshot` against the live site
  with legible rendered text.
- **SC-005**: The guard test, `bash -n`, `pnpm exec tsc --noEmit` and `./freebuff-verify.sh` pass, and the production
  build stays strictly below 495 MiB.

## Assumptions

- `$HOME` (`/workspace/homes/<workspace>`) is durable, so `~/.local/chromium-libs` and `~/.profile` survive a
  restart; the Playwright browser cache and the prefix may still be dropped by a restore, which is why the startup
  command re-checks and re-provisions instead of assuming one-off setup.
- Root is unavailable (`no new privileges`), so `playwright install --with-deps` remains impossible and apt is used
  only as an unprivileged downloader.
- A non-interactive `bash -c` shell does not read any profile, so `playwright cli` in such a shell still needs the
  three values supplied by Freebuff's Variables section or an inline `--env`.
