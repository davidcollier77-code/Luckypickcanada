# Implementation Plan: Gemini Reviewer Startup Repair

**Branch**: `fix/gemini-reviewer-syntax-repair-20261025` | **Date**: 2026-10-25 | **Spec**: `specs/052-gemini-reviewer-syntax-repair/spec.md`

## Summary

Repair the verified JavaScript parse failure in the trusted Gemini reviewer entrypoint. The event-specific validation guard was duplicated into the model-prompt array by mistake. Restore the stricter guard to the existing early validation block and delete the stray line. Add a regression assertion to protect the guard's uniqueness and placement.

## Technical Context

**Language/Version**: Existing CommonJS JavaScript executed by the GitHub Actions Node runtime; no runtime change.
**Primary Dependencies**: Node.js built-ins and the repository's existing Vitest test setup; no dependency changes.
**Storage**: None.
**Testing**: `pnpm test`; the existing reviewer test runs `node --check` against the two reviewer scripts; `./jules-verify.sh`.
**Target Platform**: GitHub Actions on the repository's existing Linux runner.
**Project Type**: CI/reviewer automation.
**Performance Goals**: No performance change is required for this syntax repair.
**Constraints**: Keep the trusted-base checkout, permissions, secret handling, model fallback chain, and app behavior unchanged. Do not merge the PR.

## Constitution Check

- Scope is limited to the reviewer script, its regression test, the task's Spec Kit artifacts, and a necessary active-context correction: PASS.
- No protected payment, database, authentication, deployment, or application API surface changes: PASS.
- Existing validation and trusted-code execution boundaries are preserved: PASS.
- Tests and `./jules-verify.sh` must be supported by actual current-head evidence; they are not claimed passed from this API-only session: PASS.

## Phase 0 — Research

Research was limited to the failed job logs, the workflow's trusted-base checkout, the exact source lines, the existing reviewer regression test, the package test script, and routed troubleshooting resources. The log identifies `SyntaxError: Unexpected token 'if'` at line 394. No external API or library research was needed because the failure is JavaScript syntax and placement, not a model/API response issue. No `research.md` is warranted.

## Phase 1 — Design

- Update `.github/scripts/gemini-reviewer.cjs` by moving the event-specific mode restriction into the single early guard and removing the stray duplicate from the prompt array.
- Update `__tests__/gemini-reviewer-workflow.test.ts` to assert exactly one guard exists, it occurs before prompt construction, and manual dispatch is restricted to supported modes.
- Update `memory-bank/activeContext.md` to replace stale reviewer-task state with the verified current failure and honest pending-verification status.
- No data model, external contract, new dependency, application UI, or manual quickstart is needed; the exact checks are listed in `tasks.md`.