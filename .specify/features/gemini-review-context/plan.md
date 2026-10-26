# Plan: Gemini Default Review Coverage and Relevant Documentation

**Branch**: `improve/gemini-default-review-coverage-20261026` | **Date**: 2026-10-26
**Spec**: `.specify/features/gemini-review-context/spec.md`

## Summary

Use the reviewer's existing bounded, immutable-SHA source retrieval on automatic first-pass reviews. Raise the explicit changed-source budget and disclose caps clearly. Keep initial reviews free of document-selection model calls, while changing full-review and repair-all selection so Gemini CLI tips and the Deep Research agent snapshot are optional and task-relevant rather than mandatory for every selected group.

## Technical Context

- **Language / Runtime**: Node.js 22.x CommonJS reviewer script.
- **Dependencies**: Existing built-in Node APIs and direct Gemini/GitHub HTTP calls; no new dependencies.
- **Testing**: `pnpm test -- __tests__/gemini-reviewer-context.test.ts`, `pnpm test -- __tests__/gemini-reviewer-workflow.test.ts`, `pnpm test`, TypeScript build check, `./jules-verify.sh`, PR-head GitHub Actions.
- **Target**: Trusted-base GitHub Actions workflow; never execute PR-head code.
- **Constraints**: Preserve Gemini 3.8 → 3.6 → 3.5 fallback order, 0.80 confidence threshold, workflow permissions, inline suggestion boundaries, and no-merge policy.

## Design Decisions

1. **Automatic source context**: call `collectSourceContext(pr, files)` for every eligible review mode, including `initial`. Retain immutable head/base SHAs, the trusted Git tree, import traversal protection, source caching, batch-specific context rendering, and the 12-probe fallback cap.
2. **Explicit bounded coverage**: define named limits for changed-source file count, per-file source characters, and total source characters. Do not silently slice away changed source candidates; add a coverage limitation whenever a count or character limit prevents source from being loaded. All available text patches continue into review batches independently.
3. **Optional Gemini references**: remove the automatic "both Gemini references per group" selection. The CLI tips snapshot is eligible only for direct Gemini CLI/configuration/command tasks. The `_websites_ai_google_dev_gemini-api.md` snapshot is specifically the Gemini Deep Research agent page and is eligible only for Deep Research / Interactions API tasks. Do not load either simply because the path is present in a selected group.
4. **Task-scoped documents**: keep full-review/repair-all task-group selection and selected-group path restrictions for other snapshots. Apply a deterministic relevance guard to Gemini reference snapshots even if the selector requests them. Initial review still skips the extra document-selection model call and library snapshots.
5. **Evidence reporting**: report source retrieval record count, exact limitations, selected/loaded documents, and whether the model found each loaded document materially useful. A yellow verdict remains mandatory when any coverage gap exists.
6. **Tests**: add helper-level tests for CLI/API document relevance, bounded file selection/disclosure, and initial-mode source collection code path; update rule/config assertions to reflect optional references.

## Project Structure

- `.github/scripts/gemini-reviewer.cjs`
- `.gemini/rules/luckypickcanada.md`
- `__tests__/gemini-reviewer-context.test.ts`
- `__tests__/gemini-reviewer-workflow.test.ts`
- `.specify/features/gemini-review-context/{spec.md,plan.md,tasks.md,checklists/requirements.md}`
- `PR_SUMMARY.md`

## Verification Plan

- Parse the reviewer script and inspect the full diff for unexpected changes.
- Run focused and full Vitest plus repository verification where possible.
- Confirm current-head GitHub Actions for tests, TypeScript, source retrieval behavior and workflow integrity.
- Check that the source retrieval limits are logged as coverage gaps and that every patch-bearing file still goes to a review batch.
- Check the actual document selection guards against normal code tasks, explicit CLI tasks and explicit Deep Research/Interactions API tasks.
- Do not claim live-model quality is proven solely from prompt assertions or CI. Leave the PR open and unmerged.
