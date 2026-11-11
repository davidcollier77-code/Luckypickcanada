# Tasks: PR Submission Governance Consolidation

**Input**: Design documents from specs/136-pr-submission-governance/

## Phase 1: Inspect and specify
- [X] T001 Inspect AGENTS.md, root PR_SUMMARY.md, the repository governance test, Spec Kit definitions/templates, and current Gatekeeper summaries.
- [X] T002 Create the feature specification and quality checklist.

## Phase 2: Consolidate governance
- [X] T003 Add Gatekeeper preflight guidance requiring inspection of applicable workflow definitions and referenced scripts before implementation.
- [X] T004 Create PR_SUBMISSION.md with complete PR body requirements, pre-submission checklist, branch/head/base validation, one non-draft submission, and immediate hard stop.
- [X] T005 Remove duplicated PR summary, handoff, and branch-validation procedure from AGENTS.md; replace it with the PR_SUBMISSION.md reference.
- [X] T006 Keep AGENTS.md at or below 300 lines and remove the obsolete root PR_SUMMARY.md; confirm PR_SUBMISSION.md is the active reusable procedure.

## Phase 3: Verify and hand off
- [ ] T007 Run the repository governance tests and ./freebuff-verify.sh when a repository shell is available. BLOCKED in this connected session; neither check is claimed as passed.
- [X] T008 Review the GitHub branch diff, record verification limitations accurately, prepare the complete PR description, and open regular non-draft PR #1815 against main. Leave it open and unmerged for the owner.

## Verification note
The PR was opened at the owner's direction with the unavailable local checks explicitly disclosed in its description. PR-triggered checks are separate from the local checks above.