# Implementation Plan: Freebuff Startup Chromium Readiness

**Branch**: `freebuff/5a4ef38f3323a2930a7d92c1` | **Date**: 2026-11-11 | **Spec**: [spec.md](./spec.md)

## Summary

Extend the documented Freebuff startup command with three steps after the existing guarded prefix: provision
Chromium's Linux libraries only when `--check` fails, export the provisioned library and font paths, then run the
repository setup script with `--install-browser --probe-browser` to install the project-pinned Chromium and prove a
real headless launch. Update `README.md` and the guard test to the same string, and mark
`scripts/setup-playwright-agent.sh` executable so its documented `./scripts/...` form works.

## Technical Context

**Language/Version**: Bash 5.2 on Ubuntu 24.04; Node.js 26.13.0; pnpm 10.30.3; Playwright 1.64.1 (Chromium 1248).

**Primary Dependencies**: `scripts/verify-startup.sh`, `scripts/bootstrap-pnpm.sh`, `scripts/setup-chromium-libs.sh`,
`scripts/setup-playwright-agent.sh`, `apt-get`/`dpkg-deb` used as an unprivileged downloader.

**Testing**: `__tests__/freebuff-startup-command.test.js`, `__tests__/bootstrap-pnpm.test.js`, `bash -n`,
`./freebuff-verify.sh`.

**Constraints**: No dependency, lockfile, workflow, application, integration, deployment, `AGENTS.md` or `.docs/`
change; no `sudo`; the command must stay a single `bash -lc '…'` line; all steps chained with `&&`.

**Scale/Scope**: `README.md`, one test file, one file mode, one Spec Kit feature directory, the Memory Bank record.

## Constitution Check

- **Governance**: PASS — `AGENTS.md` untouched; the documented value is the one the guard test executes.
- **Spec Kit sequence**: PASS — specify, plan and tasks recorded in this directory before implementation.
- **Smallest correct change**: PASS — adds the missing steps and fixes a wrong file mode; no new script.
- **Protected areas**: PASS — no payment, database, auth, secret, binding, hosting or deployment change.
- **Evidence**: REQUIRED — every claim below is a recorded command result.

**Result**: PASS.

## Phase 0 — Research (measured before editing)

- The workspace image has none of Chromium's shared libraries and `sudo` fails with the "no new privileges" flag, so
  `playwright install --with-deps` cannot run; `scripts/setup-chromium-libs.sh` provisions into `$HOME` in 10.9 s.
- A cold CLI launch without the library environment fails on `libnspr4.so`; with it, both the setup script's probe and
  `pnpm exec playwright cli open --browser=chromium` succeed.
- The frozen install already downloads Chromium through `playwright-chromium`; an explicit install costs 1.4 s when the
  browser is cached, so it is safe to keep in startup.
- All commands the vendored skill uses exist in the bundled CLI 1.64.1.

## Phase 1 — Design

1. Keep the guarded prefix unchanged so the existing ordering guarantees and rejected-form tests still hold.
2. Append `(bash scripts/setup-chromium-libs.sh --check >/dev/null 2>&1 || bash scripts/setup-chromium-libs.sh)` so
   the 0.06 s check gates the 10.9 s provisioning.
3. Append `eval "$(bash scripts/setup-chromium-libs.sh --env)"` in the same shell, because the exports must reach the
   probe.
4. Append `bash scripts/setup-playwright-agent.sh --install-browser --probe-browser`; run it through `bash` so it
   works regardless of the mode bit, and fix the bit as well.
5. Update the guard test string, the ordering assertions, and the fixture with stand-ins for the two new scripts.
6. Document the command and each step in `README.md`.

## Verification Plan

- `bash -n` on `README.md`'s command is not applicable; run `bash -n` on the touched shell entrypoints unchanged.
- `pnpm exec vitest run __tests__/freebuff-startup-command.test.js __tests__/bootstrap-pnpm.test.js`.
- The documented command verbatim, warm, with exit status and elapsed time.
- The documented command with a renamed library prefix to force the provisioning branch.
- `./freebuff-verify.sh` and the measured `.next` + `public` size against 495 MiB.
- `git diff --check`, `git status --porcelain` and a complete diff audit.
