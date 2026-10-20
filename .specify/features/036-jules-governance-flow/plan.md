# Implementation Plan — Jules Governance Flow

## Approach
- Align AGENTS.md, Jules initialization guidance, the Spec Kit constitution, and plan/implement command guidance around one sequential flow.
- Remove the tracked machine-local .specify/feature.json pointer and retire the helper that staged it.
- Update the Spec Kit artifact gate to discover the one task feature from changed files, validate the three canonical artifacts, and reject ambiguous multiple feature directories.
- Update regression tests for worktree, branch, stale, incomplete, and multiple-feature scenarios.

## Boundaries
- Governance/scripts/tests only; no app runtime, dependencies, secrets, deployment, or UI changes.
- Preserve all four Spec Kit stages and the 495 MB build maximum.
- Local shell execution is unavailable in this session; report tests as pending until CI provides actual results.

## Verification
- Inspect the final diff and all changed paths.
- Run the Spec Kit verifier regression tests and ./jules-verify.sh through available repository CI.
- Confirm that exactly one changed feature directory is detected and that no committed feature.json pointer is required.
