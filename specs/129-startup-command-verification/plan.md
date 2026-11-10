# Implementation Plan: Freebuff Startup Command and Memory Bank Availability

**Branch**: `freebuff/2c75b8a266dccd2efd39936d` | **Date**: 2026-11-10 | **Spec**: [spec.md](./spec.md)

## Summary

Reorder the Freebuff startup command so the context check reports first, restore `CI=true` on the frozen install,
keep both the pinned pnpm bootstrap and the Playwright CLI check, document that exact command as the setting value,
and extend the committed guard so it executes the documented command instead of a stale shorter variant. Add one
size guard to `scripts/verify-startup.sh` for the only automatic context channel (`AGENTS.md`).

## Technical Context

**Language/Version**: Bash 5.2 (and Bash 3.2-compatible scripts), Node.js 22.x engines (workspace runs 26.13.0).
**Primary Dependencies**: Existing shell utilities, Node.js, pnpm 10.30.3 (`packageManager`), Playwright 1.64.
**Storage**: None — repository files only.
**Testing**: `pnpm exec vitest run __tests__/freebuff-startup-command.test.js`, `bash -n`,
positive/negative `scripts/verify-startup.sh` runs, the corrected command executed end to end, `./freebuff-verify.sh`.
**Target Platform**: Freebuff Linux workspace startup command plus GitHub checkout.
**Project Type**: Repository startup tooling and documentation.
**Performance Goals**: The startup check adds one process and no network work; the full command measured 7 s in the
steady state before the change.
**Constraints**: No application, dependency, workflow, integration, deployment or `.docs/` change; `AGENTS.md`
unchanged; the Freebuff project setting stays an owner action.
**Scale/Scope**: Two scripts/tests, `README.md`, three Spec Kit artifacts and the Memory Bank task record.

## Constitution Check

- Governance: PASS — `AGENTS.md` stays unchanged and remains the only auto-loaded instruction file.
- Spec Kit sequence: PASS — specify → plan → tasks → implement, this feature directory only.
- Smallest correct change: PASS — ordering, one restored flag, documentation, guard coverage, one size check.
- Preserve behaviour: PASS — the bootstrap, frozen install and Playwright check keep working; rejection of the
  `bash scripts/…` and bare `source …` forms is retained.
- Evidence: REQUIRED — executed command output, guard-test runs, `./freebuff-verify.sh` and build size.
- Blast radius: none outside startup tooling; no browser-visible output changes.

## Phase 0 — Research

- Executed the live command (exit 0, 7 s) and inspected each segment's real effect.
- Confirmed Freebuff's context channel empirically in this session: `AGENTS.md` arrived as project instructions,
  while the four Memory Bank files required explicit reads; startup-command output is not injected.
- Confirmed Freebuff Cloud reads `AGENTS.md` up to about 64 KiB (freebuff/codebuff knowledge-file documentation).
- Confirmed `bash -lc` is required for `node`/`npm` discovery under a minimal `PATH`.
- Confirmed `pnpm exec playwright cli --help` is a genuine local command.
- Confirmed `CI=true` was part of the previously audited and tested form and is absent from the live command.

## Phase 1 — Design

1. `scripts/verify-startup.sh`: keep every existing check; add a measured `AGENTS.md` size guard against a 65536-byte
   ceiling; make the success output state the measured size and that `AGENTS.md` is the auto-loaded channel.
2. Startup command (documented, owner-applied):
   ```bash
   bash -lc 'bash scripts/verify-startup.sh && source scripts/bootstrap-pnpm.sh && CI=true pnpm install --frozen-lockfile && pnpm exec playwright cli --help'
   ```
3. `__tests__/freebuff-startup-command.test.js`: pin the new command, stub `scripts/verify-startup.sh` in the
   fixture, assert execution order, assert the installed command line and `CI=true`, and keep both rejected-form
   proofs.
4. `README.md`: one documented command described as the settings value, with ordered responsibilities and an
   explicit statement that the Memory Bank files are checked, not preloaded.

No `data-model.md`, `contracts/` or `quickstart.md`: there is no entity, external contract or manual scenario beyond
the commands recorded in `tasks.md`.

## Verification Plan

- `bash -n scripts/verify-startup.sh`
- `bash scripts/verify-startup.sh` from the repository root and from another directory
- Negative checks: missing file, empty file, oversized `AGENTS.md` (restored afterwards)
- `pnpm exec vitest run __tests__/freebuff-startup-command.test.js`
- The corrected startup command executed verbatim, with its elapsed time
- `./freebuff-verify.sh` and the measured `.next` + `public` size against 495 MiB
- `git diff --check`, complete final diff audit
