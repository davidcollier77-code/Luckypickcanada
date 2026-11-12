# Feature Specification: Portable Playwright Chromium Runtime

**Feature Branch**: `freebuff/0fe51d9fb70d7d5eedbd7455-portable`
**Created**: 2026-11-12
**Status**: Implemented

**Input**: Owner request to make the Chromium and Playwright setup work in a fresh workspace instead of depending on
state left behind by earlier sessions, and to deliver the exact startup configuration and variables for future
workspaces. Follows `specs/146-playwright-chromium-runtime`, which fixed the environment reaching later shells in
one workspace.

## Verified baseline (before this change)

- With a completely empty `$HOME`, `scripts/setup-chromium-libs.sh` provisioned the prefix and `libnspr4.so` in 9.5 s,
  then exited **1** with `FAIL no Chromium binary found` — because its `--check` required a browser that a new
  workspace has not downloaded yet. In the startup chain that failure aborted before `--persist`, the browser install
  and the probe, so a fresh workspace could never finish startup.
- The three environment values recommended for Freebuff's Variables section contained this workspace's absolute
  `/workspace/homes/<workspace>/...` paths, which do not exist in another workspace. `--persist` wired
  `~/.profile`/`~/.bashrc`, but measured in this workspace, `LD_LIBRARY_PATH` was still unset in the default command
  shell even after `--persist`, while `FONTCONFIG_FILE` from the same profile appeared. Shell-profile wiring alone is
  therefore not a dependable delivery mechanism.
- `pnpm exec playwright cli` without `--browser=chromium` fails on a missing system Chrome at `/opt/google/chrome/chrome`;
  the CLI defaults to the `chrome` channel and does not read `.profile`.
- The CLI reads `~/.playwright/cli.config.json` (or `$PWTEST_CLI_GLOBAL_CONFIG/.playwright/cli.config.json`), merging
  `browser.browserName` and `browser.launchOptions` over its defaults. A config supplying `browserName: chromium`,
  `launchOptions.channel: chromium` and `launchOptions.env` launched the browser in a shell with no environment
  variables and no flags, and rendered the site's real fonts (`h1` width 520 px, `Cinzel`).

## User Scenarios & Testing

### User Story 1 — A brand-new workspace finishes startup (Priority: P1)

An agent starts a workspace with an empty home; the documented startup command completes and ends with a launchable
browser.

**Independent Test**: in an empty home, `--check-libs` fails, `setup-chromium-libs.sh` provisions and exits 0 even
though no browser exists yet, and `--persist` writes its three artifacts.

**Acceptance Scenarios**:

1. Given an empty `$HOME`, when the startup command runs, then the libraries are provisioned before Chromium is
   downloaded and the chain continues to the browser install.
2. Given an empty `$HOME`, when provisioning finishes, then it exits 0 and states that the browser is installed next.

### User Story 2 — No hardcoded paths in the configuration (Priority: P1)

The owner adds no workspace-specific environment variables; every path is derived from that workspace's `$HOME`.

**Independent Test**: `~/.playwright/cli.config.json` contains only paths under the current `$HOME`, and the CLI
launches with no exported library variables.

**Acceptance Scenarios**:

1. Given a provisioned workspace, when `--persist` runs, then `env.sh`, the profile hooks and the CLI config all point
   at that workspace's prefix.
2. Given a workspace whose prefix moved, when `--persist` runs again, then the CLI config and the profile blocks are
   rewritten rather than duplicated or left stale.

### User Story 3 — The Playwright CLI needs no flags or exports (Priority: P1)

`pnpm exec playwright cli open <url>` works in a plain non-interactive shell.

**Independent Test**: `pnpm exec playwright cli open https://luckypickcanada.ca` after `--persist`, with
`LD_LIBRARY_PATH` unset and no `--browser` flag, then snapshot, click and evaluate.

**Acceptance Scenarios**:

1. Given `--persist` has run, when the CLI opens a page in a bare `bash -c` shell, then the bundled Chromium starts and
   page text renders with the site's fonts.
2. Given an existing CLI config with other keys, when `--persist` runs, then those keys are preserved and only the
   browser/env keys it owns are set.

## Requirements

- **FR-001**: `scripts/setup-chromium-libs.sh` MUST expose `--check-libs`, a browser-independent check over the
  required shared objects, the fontconfig files and the font families.
- **FR-002**: Provisioning MUST gate and verify on `--check-libs`, so an empty workspace succeeds before any browser
  exists, and it MUST reuse a complete prefix without downloading.
- **FR-003**: `--check` MUST remain the strict readiness gate: `--check-libs` plus an `ldd` over every installed
  Chromium binary.
- **FR-004**: `--persist` MUST write `$PREFIX/env.sh`, the guarded `~/.profile`/`~/.bashrc` blocks and
  `~/.playwright/cli.config.json`, all derived from `$HOME`, rewritten idempotently.
- **FR-005**: The CLI config MUST set `browser.browserName` and `launchOptions.channel` to chromium and provide
  `LD_LIBRARY_PATH`, `FONTCONFIG_FILE`, `FONTCONFIG_PATH`, `HOME` and a `PATH`, preserving unrelated existing keys.
- **FR-006**: The documented startup command MUST gate on `--check-libs`, then export, persist, install and probe, and
  end with the strict `--check`.
- **FR-007**: `__tests__/freebuff-startup-command.test.js` MUST pin the new command, its order, and the four Chromium
  steps the fixture observes, including the browser-independent gate.
- **FR-008**: No application code, dependency, lockfile, workflow, integration, hosting, deployment, secret,
  `AGENTS.md` or `.docs/` change.

## Success Criteria

- **SC-001**: Empty-home provisioning exits 0 in about 8 s with `libnspr4.so` present and no browser yet.
- **SC-002**: `--persist` in that empty home writes `env.sh`, both profile blocks and the CLI config.
- **SC-003**: In this workspace, `pnpm exec playwright cli open` works with `LD_LIBRARY_PATH` unset, no `--browser`
  flag, and the header renders in `Cinzel`.
- **SC-004**: The documented startup command exits 0 twice, with no download on the second run.
- **SC-005**: Guard test, `bash -n`, `tsc --noEmit` and `./freebuff-verify.sh` pass; the build stays under 495 MiB.

## Assumptions

- A fresh workspace downloads Chromium through the frozen install or `--install-browser`; both are part of the
  startup command, so no browser is inherited from a previous session.
- `~/.playwright/cli.config.json` is Playwright's documented global CLI config location, so the setting survives
  restarts and applies to every shell shape without an environment variable.
- Profile wiring remains useful for login and interactive shells, but the CLI config and the test config are the paths
  a non-interactive shell actually relies on.
