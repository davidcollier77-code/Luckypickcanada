# Active Context — PR Submission Governance Consolidation

- **Updated:** 2026-11-11
- **Repository:** davidcollier77-code/Luckypickcanada
- **Base branch:** main (base commit e15fd89db006421f7719af037c7f47eae6976854)
- **Task branch:** docs/pr-submission-governance-20261111
- **Spec Kit feature:** specs/136-pr-submission-governance

## Current Task

Move detailed PR description and submission instructions from AGENTS.md into PR_SUBMISSION.md. Keep AGENTS.md at or below 300 lines, retain Gatekeeper awareness as pre-implementation guidance, and make the PR handoff reference explicit. Preserve the existing root PR_SUMMARY.md task report.

## Verified Repository Context

- AGENTS.md was 271 lines before this change.
- Root PR_SUMMARY.md is an existing completed report for a documentation-updater task, not a reusable submission procedure.
- No root PR_SUBMISSION.md existed at the inspected base.
- AGENTS.md already listed Gatekeeper workflows but did not explicitly require inspecting applicable workflow definitions and referenced scripts before implementation.
- The existing governance test checks the authoritative governance entrypoint and Connected Integrations rules.

## Implementation

- Added Gatekeeper preflight guidance and retained the workflow-specific Gatekeeper index in AGENTS.md.
- Moved detailed PR-body/reporting, head/base, submission, hard-stop and recovery instructions to PR_SUBMISSION.md.
- Replaced the detailed AGENTS.md handoff with a direct PR_SUBMISSION.md reference.
- Preserved root PR_SUMMARY.md and unrelated governance.

## Verification Status

- **PASS (static review):** AGENTS.md line count and required content assertions checked during document preparation.
- **BLOCKED:** Repository governance tests and ./freebuff-verify.sh were not run; this session has GitHub API access but no repository shell or checkout.
- **NOT SUBMITTED:** No PR was opened because repository verification and final runtime diff review remain outstanding.

## Next Action

Run the governance tests and ./freebuff-verify.sh on this branch, inspect the complete diff, and follow PR_SUBMISSION.md only after all applicable pre-submission checks pass. Do not submit while mandatory pre-submission checks remain unverified.
