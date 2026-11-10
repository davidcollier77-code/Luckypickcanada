# Implementation Plan: Freebuff Startup Command Runtime Verification

**Branch**: `freebuff/33958ac019917e6d9cfec2d4` | **Date**: 2026-11-10 | **Spec**: [spec.md](./spec.md)

## Summary

Run the installed command verbatim and collect evidence per expectation; force each failure path in disposable fixtures; prove the `CI=true` pass-through and the pnpm install-if-missing branch; confirm the checked-versus-loaded distinction; then run the repository gate and measure the build. No production code or script change is expected unless the evidence exposes a defect.

## Technical Context

**Language/Version**: Bash 5.2, Node.js 26.13.0 in this workspace (`package.json` engines: 22.x; pnpm warns only).
**Primary Dependencies**: pnpm 10.30.3 (`packageManager`), Playwright 1.64 CLI, Node.js, `git`, `wc`, `du`.
**Storage**: None — repository files plus disposable `/tmp` fixtures.
**Testing**: `./freebuff-verify.sh`, focused Vitest suites, executed command, fixture-driven negative cases, `bash -n`, `git diff --check`.
**Target Platform**: Freebuff Linux workspace startup command plus GitHub checkout.
**Constraints**: No `AGENTS.md`, source, dependency, workflow, integration, deployment or `.docs/` change; Freebuff settings stay owner-operated; fixture work never mutates the repository.
**Scale/Scope**: One feature directory, one Memory Bank task record, an evidence-only PR.

## Constitution Check

- Governance: PASS — `AGENTS.md` unchanged; no script edited without a demonstrated defect.
- Spec Kit sequence: PASS — specify → plan → tasks → implement in this directory only.
- Smallest correct change: PASS — verification artifacts only; no speculative hardening.
- Preserve behaviour: PASS — nothing in the startup path is modified.
- Evidence: REQUIRED — every claim backed by a command and its exit status.
- Blast radius: none; no browser-visible output changes.

## Phase 0 — Research

- Confirm `HEAD` is the fetched `main` tip and that PR #1802 (the command change) is merged.
- Read `README.md`, both startup scripts, the guard test, the bootstrap test and the Spec Kit gate scripts.
- Record the runtime environment: login-shell `node`/`npm` resolution, pinned pnpm already installed at `$HOME/.local/bin/pnpm`.

## Phase 1 — Design

1. Execute the command verbatim from the repository root, capturing exit status, elapsed time, output order and pre/post `package.json` + `pnpm-lock.yaml` hashes.
2. Dispose of a fixture per negative case: `AGENTS.md` missing / empty / oversized, invalid manifest, invalid pin, failing install. Use a logging stand-in `pnpm` so "later steps did not run" is observable.
3. Prove `CI=true` reaches the install process through the stand-in, and prove the bootstrap's install branch with an isolated `HOME` and no `pnpm` on `PATH`.
4. Probe Playwright help for exit status, elapsed time and browser processes before/after; check the browser cache is unused by the help command.
5. Confirm the context channel from the live session: `AGENTS.md` arrives as project instructions; the Memory Bank files require explicit reads.

No `data-model.md`, `contracts/` or `quickstart.md`: there is no entity or external contract, and the commands are captured in `tasks.md` and the PR body.

## Verification Plan

- `bash -lc '<installed command>'` — exit status, output order, lockfile hashes.
- Fixture matrix (six cases) — exit status and pnpm invocation log.
- `pnpm exec vitest run __tests__/freebuff-startup-command.test.js __tests__/bootstrap-pnpm.test.js`
- `bash -n` on the three shell entrypoints.
- `./freebuff-verify.sh` — includes the Spec Kit gate, verification-integrity tests, `tsc --noEmit`, production build and docs tests.
- Measured `.next` + `public` size against 495 MiB; `git diff --check`; complete final diff audit.
