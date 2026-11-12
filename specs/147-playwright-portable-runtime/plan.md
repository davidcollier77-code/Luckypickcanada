# Implementation Plan: Portable Playwright Chromium Runtime

**Branch**: `freebuff/0fe51d9fb70d7d5eedbd7455-portable` | **Date**: 2026-11-12 | **Spec**: [spec.md](./spec.md)

## Summary

Two problems made the fix workspace-specific: provisioning failed in an empty home because its gate needed a browser
that a new workspace has not downloaded, and the environment was delivered through shell profiles and absolute
`Variables` paths. Separate the library readiness from browser readiness, and deliver the browser environment through
Playwright's own global CLI config under `$HOME` so every path is derived rather than hardcoded.

## Technical Context

**Language/Version**: Bash 5.2 on Ubuntu 24.04; Node.js 26.13.0; pnpm 10.30.3; Playwright 1.64.1 (Chromium 1248).

**Primary Dependencies**: `scripts/setup-chromium-libs.sh`, `scripts/setup-playwright-agent.sh`,
`playwright.config.ts`, Playwright's `~/.playwright/cli.config.json` loader; `apt-get`/`dpkg-deb` as an unprivileged
downloader.

**Testing**: empty-home provisioning, `--check-libs`/`--check`, generated CLI config, live CLI interaction,
`__tests__/freebuff-startup-command.test.js`, `tsc --noEmit`, `./freebuff-verify.sh`.

**Constraints**: no new script or dependency; no application, workflow, integration, hosting, secret, `AGENTS.md` or
`.docs/` change; no `sudo`; one `bash -lc '…'` startup line.

**Scale/Scope**: one script (plus its CLI config writer), `README.md`, one guard test, one skill reference note, this
feature directory, Memory Bank.

## Constitution Check

- **Governance**: PASS — `AGENTS.md` untouched; one documented startup command, executed by its guard test.
- **Spec Kit sequence**: PASS — specify, plan and tasks recorded before implementation.
- **Smallest correct change**: PASS — no new script; the CLI config writer lives in the existing provisioning script.
- **Protected areas**: PASS — no payment, database, auth, secret, binding, hosting or deployment change.
- **Evidence**: REQUIRED — `evidence.md` records every measurement.

**Result**: PASS.

## Phase 0 — Research (measured before editing)

- Empty `$HOME`: provisioning unpacked all 18 packages (9.5 s, `libnspr4.so` present) then exited 1 with
  `FAIL no Chromium binary found`, which aborted the startup chain before the browser install step. This is the fresh
  workspace failure mode.
- `bash -c`/`sh -c`/the command shell itself still reported `LD_LIBRARY_PATH` unset after `--persist`, while
  `FONTCONFIG_FILE` from the same profile was present: profiles are not a dependable delivery path.
- A temporary profile marker was not visible in the command shell, confirming profiles are not sourced there.
- Playwright's CLI resolves `~/.playwright/cli.config.json` (or `$PWTEST_CLI_GLOBAL_CONFIG/.playwright/cli.config.json`),
  merges `browser.browserName` and `browser.launchOptions` over defaults, and defaults `channel` to `chrome`.
- A config with `browserName: chromium`, `channel: chromium` and `launchOptions.env` launched the CLI in a shell with
  no library variables and no `--browser` flag, and rendered `h1` in `Cinzel` at 520 px.

## Phase 1 — Design

1. Split readiness: `check_libs` is a file test over a fixed list of the required shared objects plus fontconfig and
   font families; `check` adds an `ldd` over every installed Chromium binary and requires at least one.
2. Provisioning gates and verifies on `check_libs`, so an empty workspace exits 0 and prints what happens next; a
   complete prefix is reused without downloading.
3. `--persist` keeps `env.sh` and the guarded profile blocks, and additionally writes `~/.playwright/cli.config.json`
   through `node`, merging existing keys so only the browser/env keys it owns are set.
4. Startup command: gate on `--check-libs`, then `--env`, `--persist`, install/probe, and finish with the strict
   `--check` so readiness is proven after the browser exists.
5. Update `README.md`, the guard test and the Playwright CLI skill reference to the new behaviour; the skill note tells
   agents not to reinstall browsers when the documented checks explain the state.

## Verification Plan

- Empty-home: gate fails, provisioning exits 0 with the browser note, `--persist` writes all three artifacts.
- Workspace: `--persist` then `pnpm exec playwright cli open` with no variables and no `--browser`, plus snapshot,
  click, evaluate and close.
- Documented startup command twice; profile blocks stay single; CLI config rewritten once.
- Guard test, `bash -n`, `tsc --noEmit`, `./freebuff-verify.sh`, build-size measurement, diff audit.
