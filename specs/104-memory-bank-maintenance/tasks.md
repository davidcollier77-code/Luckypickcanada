# Tasks: Memory Bank Lifecycle and Cleanup

**Input**: `spec.md` and `plan.md`
**Prerequisites**: `plan.md`, `spec.md`

## Phase 1: Audit and policy
- [x] T001 Inspect `AGENTS.md`, `.freebuff/freebuff.md`, all three Memory Bank files, relevant task-group instructions, Spec Kit commands, and the current open PR state.
- [x] T002 Define the 30-day working-history policy, older-important-information exception, three-file responsibilities, and non-empty active-context requirement in `AGENTS.md`.

## Phase 2: Memory Bank cleanup
- [x] T003 Update `memory-bank/projectBrief.md` with stable project, architecture, product, and visual facts; remove task-log content.
- [x] T004 Replace historical task notes in `memory-bank/activeContext.md` with current open work, unresolved review/verification follow-up, and this maintenance branch.
- [x] T005 Consolidate completed history in `memory-bank/progress.md` into meaningful dated milestones; remove repeated PR-by-PR and stale status detail.
- [x] T006 Add the concise maintenance reminder to `.freebuff/freebuff.md` and point `.specify/feature.json` to this feature.

## Phase 3: Final review and verification
- [x] T007 Review the complete change set for scope, duplicates, missing enduring facts, stale statuses, and secret values; confirm no arbitrary size limit was introduced.
- [ ] T008 Run `./freebuff-verify.sh` and inspect all PR-head checks when a repository shell/runner is available; record actual results in the PR body before claiming verified completion.

## Completion Conditions
- `projectBrief.md` remains a stable reference, `activeContext.md` is concise and never empty, and `progress.md` is a compact milestone history.
- Older critical facts survive; routine historical detail is consolidated.
- The PR remains open and unmerged for owner review.
