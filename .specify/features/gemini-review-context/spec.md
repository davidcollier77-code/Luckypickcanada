# Feature Specification: Gemini Reviewer Source Context

**Feature Branch**: `improve/gemini-review-context`
**Status**: Implementation candidate; CI and live-model acceptance pending

## User need
Gemini must review code in context rather than as disconnected diff hunks. It should inspect bounded full source for changed files, compare selected files with the PR base, and inspect relevant local imports to detect regressions that require surrounding context.

## Acceptance criteria
- Changed source is fetched read-only by immutable PR head SHA; selected base versions use immutable base SHA.
- Source/import context has strict file, character, and fallback import-API probe budgets plus honest missing/truncated coverage.
- Relative imports are resolved against the repository tree; source is never executed.
- The review prompt traces asynchronous scheduling, reads/writes, and reachable direct/synchronous call paths; it distinguishes verified ordering defects from unproven timing risks.
- The review prompt checks image preload URL/type/srcSet/sizes and actual browser format selection. It must not assume two typed AVIF/WebP preloads are mutually exclusive; browsers supporting both formats may fetch both files even when the picture uses one.
- Amazon Q's review of merged PR #1610 is used as evidence to improve the reasoning pattern, not as unquestioned authority for a proposed fix.
- Fallback task-group selection uses changed paths and defect domain rather than generic title words alone.
- Trusted workflow boundaries, Gemini rules, opt-in fix behavior, and Gemini 3.8 → 3.6 → 3.5 fallback order remain unchanged.
- The review summary uses consistent red/yellow/green verdicts, lists issues and evidence-backed positives in point form, and places each suggested fix in a collapsible section with copy-friendly text/code blocks.
- A green review is explicitly distinguished from merge approval; required GitHub checks and reviews must also pass.
- Unit tests cover import extraction, path traversal rejection, task-group selection, clipping, line anchors, batch-relevant context, evidence-led async ordering guidance, duplicate-format preload guidance, and review-formatting/verdict helpers.
