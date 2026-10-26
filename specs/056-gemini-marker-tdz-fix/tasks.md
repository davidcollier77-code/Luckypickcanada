# Tasks: Gemini Reviewer Marker Initialization Repair

**Input**: `specs/056-gemini-marker-tdz-fix/spec.md` and `plan.md`

## Phase 1: Setup

- [x] T001 Inspect `.github/scripts/gemini-reviewer.cjs`, `__tests__/gemini-reviewer-context.test.ts`, and the package test script to establish the reported failure and baseline behavior.

## Phase 2: Foundational

- [x] T002 Confirm existing regression assertions cover a zero limit, a small limit below the marker length, ordinary truncation, retained beginning/end, and maximum output length in `__tests__/gemini-reviewer-context.test.ts`.

## Phase 3: User Story 1 — Restore source clipping

**Independent test**: Run `pnpm test -- __tests__/gemini-reviewer-context.test.ts`; the source-clipping regression must pass without a `MARKER` initialization exception.

- [x] T003 Move the `MARKER` constant above all references to `MARKER.length` inside `clipSource` in `.github/scripts/gemini-reviewer.cjs`, retaining the existing truncation behavior.
- [x] T004 Record actual PR-head verification outcomes in `specs/056-gemini-marker-tdz-fix/pr_summary.md`: the full unit-test step, TypeScript/Spec Kit checks, `./jules-verify.sh`, build-size gates, security checks, and the remaining Playwright status.
- [x] T005 Reconcile the final changed-file list, behavior-preservation check, PR #1615, actual CI evidence, and the remaining post-merge full-review dependency in `memory-bank/activeContext.md`.

## Dependencies and execution order

- T001 and T002 are complete baseline inspection.
- T003 is implemented.
- T004 records actual workflow evidence. The full unit-test, TypeScript, Spec Kit gate, repository verification, build, and security steps passed on the code-bearing commit; the Visual QA job was still waiting on Playwright Chromium when last checked.
- T005 is complete; the active context matches the PR and the recorded evidence.

## Implementation strategy

Apply the single-line-ordering correction first, keep existing boundary assertions unchanged, then rely on focused and repository-wide CI before considering the repair verified. Leave the PR open and unmerged for the repository owner.
