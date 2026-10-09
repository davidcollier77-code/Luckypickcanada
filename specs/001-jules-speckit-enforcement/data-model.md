# Verification State Model

This governance feature adds no application or user data model. It validates the existing local Spec Kit task context.

## Input state

- **State file**: `.specify/feature.json` (ignored per-checkout state managed by Spec Kit)
- **Pointer field**: `feature_directory` (required, non-empty string)
- **Feature directory**: Must resolve to a child directory within the current repository checkout.
- **Required artifacts**: Non-empty `spec.md`, `plan.md`, and `tasks.md` in the active feature directory.

## Validation outcomes

- **PASS**: The state file parses, points inside the repository, all three required artifacts are present and non-empty, and each artifact is changed in the current worktree or in the current branch diff against its base.
- **FAIL**: The state file is missing/empty/invalid; the pointer is missing, empty, or escapes the checkout; any artifact is missing/empty; or the artifacts are unchanged remnants of a prior task.

The state file is local-only and is not committed. The feature artifacts themselves are part of the repository change and may be committed with the task.
