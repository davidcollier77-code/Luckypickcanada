# Tasks: Gemini Reviewer Marker Initialization Repair

**Input**: `specs/056-gemini-marker-tdz-fix/spec.md` and `plan.md`

## Phase 1: Setup

- [x] T001 Inspect `.github/scripts/gemini-reviewer.cjs`, `__tests__/gemini-reviewer-context.test.ts`, and the package test script to establish the reported failure and baseline behavior.

## Phase 2: Foundational

- [x] T002 Confirm existing regression assertions cover a zero limit, a small limit below the marker length, ordinary truncation, retained beginning/end, and maximum output length in `__tests__/gemini-reviewer-context.test.ts`.

## Phase 3: User Story 1 — Restore source clipping

**Independent test**: Run `pnpm test -- __tests__/gemini-reviewer-context.test.ts`; the source-clipping regression must pass without a `MARKER` initialization exception.

- [ ] T003 [US1] Move the `MARKER` constant above all references to `MARKER.length` inside `clipSource` in `.github/scripts/gemini-reviewer.cjs`, retaining the existing truncation behavior.
- [ ] T004 [US1] Verify the focused reviewer context suite, `./jules-verify.sh`, and PR-head workflow results; record only checks with actual evidence in `specs/056-gemini-marker-tdz-fix/pr_summary.md`.
- [ ] T005 [US1] Reconcile final changed-file list, behavior-preservation check, and the current reviewer failure status in `memory-bank/activeContext.md`.

## Dependencies and execution order

- T001 and T002 are complete baseline inspection.
- T003 is the implementation step.
- T004 depends on T003 and records actual verification. Local shell tests are not available in the current API-connected session, so use the workflow runs on the PR head when available.
- T005 follows implementation and verification so the summary matches the actual diff and evidence.

## Implementation strategy

Apply the single-line-ordering correction first, keep existing boundary assertions unchanged unless CI demonstrates a missing assertion, then rely on focused and repository-wide CI before considering the repair verified. Leave the PR open and unmerged for the repository owner.
