# Tasks: PR Submission Governance Consolidation

**Input**: Design documents from specs/136-pr-submission-governance/

## Phase 1: Inspect and specify
- [X] T001 Inspect AGENTS.md, root PR_SUMMARY.md, the repository governance test, Spec Kit definitions/templates, and current Gatekeeper summaries.
- [X] T002 Create the feature specification and quality checklist.

## Phase 2: Consolidate governance
- [X] T003 Add Gatekeeper preflight guidance requiring inspection of applicable workflow definitions and referenced scripts before implementation.
- [X] T004 Create PR_SUBMISSION.md with complete PR body requirements, pre-submission checklist, branch/head/base validation, one non-draft submission, and immediate hard stop.
- [X] T005 Remove duplicated PR summary, handoff, and branch-recovery procedure from AGENTS.md; replace it with the PR_SUBMISSION.md reference.
- [X] T006 Keep AGENTS.md at or below 300 lines and preserve root PR_SUMMARY.md.

## Phase 3: Verify and hand off
- [ ] T007 Run agent-governance and Spec Kit governance tests plus ./freebuff-verify.sh. BLOCKED here because no repository shell/checkout is available.
- [ ] T008 Review the complete branch diff and submit one regular, non-draft PR only after all applicable pre-submission checks pass; leave it open and unmerged.

T007 is a hard prerequisite for T008. Do not submit while required pre-submission checks remain unverified.
