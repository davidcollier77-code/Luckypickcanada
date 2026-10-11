# Implementation Plan: Inori Review Recovery

## 1. Technical Strategy
Keep the workflow-level fix narrow because the upstream action is immutable and does not expose a model-response repair input. Allow the first action step's failure to be inspected, then invoke the same pinned action one additional time only for the specific terminal reason "No review batch completed successfully". Preserve other error states as failures.

The recovery step uses the same provider, API secret reference, language, instructions, and four-request budget as the initial attempt. The outcome-summary step prefers recovery outputs when present and retains both attempt reasons. A final always-running guard re-fails the job if the first attempt failed and the recovery step did not succeed.

## 2. File Modifications
- .github/workflows/inori-review.yml: add the conditional one-time recovery attempt, effective outcome reporting, and fail-closed status guard.
- .specify/features/011-inori-review-recovery/spec.md: define the behavior and acceptance criteria.
- .specify/features/011-inori-review-recovery/plan.md: record this plan.
- .specify/features/011-inori-review-recovery/tasks.md: track implementation and verification.
- .specify/feature.json: point the task-artifact gate to this active feature.
- memory-bank/activeContext.md and memory-bank/progress.md: record task state and verified results.

## 3. Safety and Compatibility
- Do not update the pinned external action SHA or add dependencies.
- Do not change credentials or review permissions.
- Retry at most once and only when the upstream action confirms no review was published.
- If outputs or the retry condition cannot be established, fail closed.

## 4. Verification Plan
- Inspect the branch's exact workflow contents and diff.
- Verify YAML indentation and GitHub Actions expressions, including the condition, output fallback, and terminal guard.
- Confirm the action remains pinned and both attempts use identical review inputs.
- Inspect GitHub Actions checks triggered by the pull request.
- Run ./jules-verify.sh if an executable repository checkout is available. If the environment prevents the command from running, report that limitation explicitly and do not claim it passed.