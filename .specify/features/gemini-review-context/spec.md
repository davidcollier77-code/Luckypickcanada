# Feature Specification: Gemini Reviewer Source Context

**Feature Branch**: `improve/gemini-review-context`
**Status**: Implementation candidate; CI and live-model acceptance pending

## User need
Gemini must review code in context rather than as disconnected diff hunks. It should inspect bounded full source for changed files, compare selected files with the PR base, and inspect relevant local imports to detect regressions that require surrounding context.

## Acceptance criteria
- Changed source is fetched read-only by immutable PR head SHA; selected base versions use immutable base SHA.
- Source/import context has strict file and character budgets and honest missing/truncated coverage.
- Relative imports are resolved against the repository tree; source is never executed.
- The review prompt checks end-to-end behavior and image preload/type/srcSet/sizes matching, using merged PR #1610 as the regression reference.
- Fallback task-group selection uses changed paths and defect domain rather than generic title words alone.
- Trusted workflow boundaries, Gemini rules, opt-in fix behavior, and Gemini 3.8 → 3.6 → 3.5 fallback order remain unchanged.
- Unit tests cover import extraction, path traversal rejection, task-group selection, clipping, line anchors, and batch-relevant context.
