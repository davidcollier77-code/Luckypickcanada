# Implementation Plan: Cold-workspace-safe Freebuff startup command

**Branch**: `209-cold-startup-browser-install-order` | **Date**: 2026-11-22 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/209-cold-startup-browser-install-order/spec.md`

## Summary

Move `bash scripts/setup-playwright-agent.sh --install-browser` ahead of the strict
`bash scripts/setup-chromium-libs.sh --check` gate in the documented Freebuff startup command, keeping
`--env` and `--persist` in place and leaving the probe last. Update the README step list and the test that
pins the documented command so the two cannot drift, then run the command on a genuinely cold workspace.

## Technical Context

**Language/Version**: Bash 5.x, Node.js 26.x, pnpm 10.30.3

**Primary Dependencies**: `playwright` / `playwright-chromium` 1.64.x; `apt-get` and `dpkg-deb` used only as an
unprivileged downloader and unpacker

**Storage**: `$HOME` only — `~/.local/chromium-libs`, `~/.cache/ms-playwright`, `~/.playwright/cli.config.json`,
`~/.profile`, `~/.bashrc`

**Testing**: `vitest` — `__tests__/freebuff-startup-command.test.js` executes the documented string against shell
fixtures; the real command was then run once on a cold workspace

**Target Platform**: Freebuff Cloud Linux workspace (no root, `no new privileges`)

**Constraints**: no system-wide writes, no `sudo`, production build strictly below 495 MiB

**Scale/Scope**: two changed files plus this Spec Kit artifact set

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- Smallest correct change: only `README.md` and `__tests__/freebuff-startup-command.test.js` change, plus spec artifacts.
- Protected areas: `AGENTS.md`, `scripts/verify-startup.sh`, `freebuff-verify.sh` and every governance, payment,
  database, authentication, hosting and secrets file are untouched.
- Security: no credentials, no secret reads, no environment dumping. The scripts already quote every exported value.
- Data boundaries: unchanged; nothing in `app/`, `components/` or the API routes is touched.
- Build: no bundle-affecting change; the size gate is unaffected.

## Project Structure

### Documentation (this feature)

```text
specs/209-cold-startup-browser-install-order/
├── spec.md
├── plan.md
└── tasks.md
```

### Source Code (repository root)

```text
README.md                                  # the copy-paste command and its numbered step list
__tests__/freebuff-startup-command.test.js  # pins the documented string and executes it
scripts/setup-playwright-agent.sh           # unchanged; --install-browser and --probe-browser are now separate calls
scripts/setup-chromium-libs.sh              # unchanged; --check, --env and --persist are unchanged
```

**Structure Decision**: single project. The change is an ordering fix in the committed command plus the test that
pins it; no script needed to change, because `setup-playwright-agent.sh` already applies `--env` to its own process
and skips the download when `--browser-root` reports the pinned revision.

## Cold-start defect and remedy

`scripts/setup-chromium-libs.sh --check` validates the runtime libraries, the fontconfig files **and** every
installed Chromium binary. On a workspace that has never had a browser it therefore fails. The documented
`--check || provision` branch then runs the no-argument path, which ends by calling the same `check` — and that
second call fails for the same reason. Under `bash -lc '… && …'` the whole startup chain aborts after the
libraries have been provisioned and before the browser is downloaded.

Three remedies were considered:

| Remedy | Result |
| --- | --- |
| Gate on `--check-libs` (browser-independent by design) and install the browser after the exports | Cold-safe, but moves the browser install behind `--env`/`--persist` and weakens the strict binary check to a library-only gate |
| Make the no-argument path end in `check_libs` | Changes a shared script (and a governance-adjacent behaviour) to hide an ordering mistake in the command |
| **Install the browser before the strict check (chosen)** | The strict check becomes an assertion about a browser that exists; no script changes; matches the owner's instruction |

`setup-playwright-agent.sh --install-browser` only downloads and unpacks, so it needs no `LD_LIBRARY_PATH`; it also
applies `--env` to its own process when the libraries are already provisioned. Splitting it from
`--probe-browser` is therefore safe: the probe re-applies the same environment itself and still runs last.

## Out of scope — pre-existing blocker found while proving the change

`scripts/verify-startup.sh` (step 1) fails at `main` HEAD `859bec46` on **every** workspace, cold or warm:

```text
❌ Startup verification failed: AGENTS.md is missing the four-file initialization instruction
```

The script greps `AGENTS.md` for the literal sentence `Read all four Memory Bank files once`; the current
`AGENTS.md` says "At task initialization, read and health-check all four core files" instead. Both
`AGENTS.md` and `scripts/verify-startup.sh` are protected governance files, so this specification does not
change either one. It is reported to the owner for authorization. The cold-workspace proof covers steps 2–9,
which is the whole chain this change touches.

## Complexity Tracking

No constitution violations. No new abstraction, script, dependency or configuration was introduced.
