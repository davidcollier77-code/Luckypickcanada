# Implementation Plan: Playwright Chromium Runtime Environment

**Branch**: `freebuff/0fe51d9fb70d7d5eedbd7455` | **Date**: 2026-11-12 | **Spec**: [spec.md](./spec.md)

## Summary

The libraries were never the whole defect: they were installed, but nothing carried `LD_LIBRARY_PATH` and
`FONTCONFIG_*` into the shells that actually launch Playwright. Close that gap inside the existing scripts instead of
adding a new one — make `setup-chromium-libs.sh` verify both Chromium binaries, skip redundant downloads and persist
its environment; make `setup-playwright-agent.sh` apply that environment itself; let `playwright.config.ts` inject it
for Playwright Test; and add the persist step to the documented startup command and its guard test.

## Technical Context

**Language/Version**: Bash 5.2 on Ubuntu 24.04; Node.js 26.13.0; pnpm 10.30.3; Playwright 1.64.1 (Chromium 1248).

**Primary Dependencies**: `scripts/setup-chromium-libs.sh`, `scripts/setup-playwright-agent.sh`,
`scripts/bootstrap-pnpm.sh`, `scripts/verify-startup.sh`, `playwright.config.ts`,
`tests/visual/playwright-fontconfig.ts`; `apt-get` and `dpkg-deb` as an unprivileged downloader.

**Testing**: `__tests__/freebuff-startup-command.test.js`, `pnpm exec tsc --noEmit`, `bash -n`, real Chromium launches,
`./freebuff-verify.sh`.

**Constraints**: No dependency, lockfile, workflow, application, integration, deployment, `AGENTS.md` or `.docs/`
change; no `sudo`; the startup command stays one `bash -lc '…'` line with `&&` chaining.

**Scale/Scope**: Two scripts, one config file, `README.md`, one guard test, one Spec Kit feature directory, Memory Bank.

## Constitution Check

- **Governance**: PASS — `AGENTS.md` untouched; `README.md` still documents exactly one startup command, and the
  guard test executes the same string.
- **Spec Kit sequence**: PASS — specify, plan and tasks recorded before implementation.
- **Smallest correct change**: PASS — no new script (the persist mode belongs to the existing provisioning script).
- **Protected areas**: PASS — no payment, database, auth, secret, binding, hosting or deployment change.
- **Evidence**: REQUIRED — every claim in `evidence.md` is a recorded command result.

**Result**: PASS.

## Phase 0 — Research (measured before editing)

- Reproduced the defect with the libraries already installed: `chromium.launch({headless:true})` exits 127 with
  `chrome-headless-shell: … libnspr4.so: cannot open shared object file`; the same launch with `--env` applied prints
  `LAUNCH OK`.
- Established why: Freebuff tool shells are `bash -c` with `$-` = `hBc`, `BASH_ENV` unset, and no `~/.profile` or
  `~/.bashrc`, so the startup command's exports never reach a later command.
- `--check` inspected only `chrome`; the failing binary was `chrome-headless-shell`.
- `playwright cli open` defaults to the `chrome` channel (`/opt/google/chrome/chrome`, absent); `--browser=chromium`
  uses the bundled build.
- `pnpm install --frozen-lockfile` already downloads Chromium through `playwright-chromium`; an explicit install is a
  no-op when the cache matches.

## Phase 1 — Design

1. `setup-chromium-libs.sh`
   - `chromium_binaries()` returns the system Chrome plus every Playwright `chrome`/`chrome-headless-shell`;
     `--check` fails if any of them reports a missing object, or if the fontconfig files are absent.
   - A plain run returns early when `--check` already passes, so a restored workspace reuses its 27 MB prefix.
   - `print_env` emits a POSIX `case` guard: append the prefix once, keep an existing `LD_LIBRARY_PATH` precedence,
     and stay stable when sourced repeatedly from a profile.
   - `--persist` writes `$PREFIX/env.sh`, then replaces and re-appends one marked block in `~/.profile` and
     `~/.bashrc`. Both files live under `$HOME`, so the wiring survives restarts and never duplicates.
2. `setup-playwright-agent.sh` evaluates `--env` into its own process before probing, so the probe and anything it
   launches work with no caller setup. Its BLOCKED message names the provisioning script.
3. `playwright.config.ts` adds the prefix's library directories and fontconfig paths to `process.env` when
   `libnspr4.so` exists under it. The browser process inherits them. CI runners and developer machines, where the
   prefix is absent, are unchanged.
4. Add `bash scripts/setup-chromium-libs.sh --persist` to the startup command after `--env` and before the probe;
   update `README.md` and the guard test, whose fixture now proves the probe inherits the exported paths, and logs the
   four Chromium steps in order.

## Verification Plan

- `bash -n` on both scripts; `--check`, plain run, `--persist` and a second `--persist`.
- Probe from `env -u LD_LIBRARY_PATH -u FONTCONFIG_FILE -u FONTCONFIG_PATH`.
- `bash -lc` environment check and a double-source check.
- Playwright Test from a bare shell; if that fails it is the config injection, not the shell.
- Cold provisioning into a throwaway prefix; the documented startup command twice.
- `playwright cli open`/`snapshot`/`click`/`screenshot`/`eval` against the live site, with the screenshot inspected.
- `pnpm exec vitest run __tests__/freebuff-startup-command.test.js`, `pnpm exec tsc --noEmit`,
  `./freebuff-verify.sh`, measured build size, `git diff --check`.
