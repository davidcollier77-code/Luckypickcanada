# Implementation Plan: Gemini Reviewer Marker Initialization Repair

**Branch**: `fix/gemini-marker-tdz-20261026` | **Date**: 2026-10-26 | **Spec**: `specs/056-gemini-marker-tdz-fix/spec.md`

## Summary

Move the existing `MARKER` constant declaration to the top of `clipSource`, before the function can evaluate `MARKER.length`. Preserve the current clipping algorithm and use its existing boundary regression tests. This is the smallest correction for the verified temporal-dead-zone error.

## Technical Context

**Language/Version**: CommonJS JavaScript on the repository's Node.js 22.x Actions runtime  
**Primary Dependencies**: Existing Node.js built-ins and Vitest; no dependency changes  
**Storage**: None  
**Testing**: `pnpm test -- __tests__/gemini-reviewer-context.test.ts`; `./jules-verify.sh`; PR-head CI  
**Target Platform**: GitHub Actions and repository-supported Node.js 22.x  
**Project Type**: CI/reviewer automation  
**Performance Goals**: No performance change required  
**Constraints**: Keep output bounded by the caller's limit; preserve the source beginning/end for ordinary truncation; do not change triggers, permissions, prompt construction, provider fallback, application code, or dependencies.

## Constitution Check

- Task is restricted to the reviewer clipping helper, existing focused test coverage, and this task's Spec Kit/PR evidence: PASS.
- No protected payment, database, authentication, API route, deployment, environment, or secret changes: PASS.
- Existing validation and trusted-base reviewer execution remain unchanged: PASS.
- Verification claims will be based only on actual GitHub Actions evidence because this session has no repository shell for local test execution: PASS.

## Phase 0 — Research

The source and existing test were inspected on `main`. The verified defect is declaration ordering inside `clipSource`: an early boundary branch reads `MARKER.length` before the block-scoped constant is initialized. The existing test covers zero and small limits and ordinary truncation, so no additional library research or optional research artifact is needed.

## Phase 1 — Design

1. Move the `MARKER` declaration immediately after normalizing `source`, before every read of `MARKER.length`.
2. Preserve the early tiny-limit behavior and the current head/tail calculation.
3. Rely on the existing regression test covering zero, small, and ordinary limits; CI will confirm it catches the defect and passes after the repair.
4. Update the canonical PR summary with exact changed files and actual verification status.

## Project Structure

```text
.github/scripts/gemini-reviewer.cjs
__tests__/gemini-reviewer-context.test.ts
specs/056-gemini-marker-tdz-fix/
  spec.md
  plan.md
  tasks.md
  pr_summary.md
```

No data model, API contract, quickstart, or new test file is necessary. The existing focused test already covers the faulty boundary conditions.
