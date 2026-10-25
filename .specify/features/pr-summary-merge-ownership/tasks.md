# Tasks: PR Summary Lifecycle and Human-Owned Merges

**Input**: `.specify/features/pr-summary-merge-ownership/`
**Prerequisites**: `spec.md` and `plan.md`.

## Phase 1: Investigation and specification
- [x] T001 Inspect `AGENTS.md`, `.jules/jules.md`, the Constitution, command guidance, relevant PR workflows, and main-branch ruleset.
- [x] T002 Record the verified gap: report lifecycle was underspecified; no repository-wide agent merge prohibition existed; technical merge restrictions differ from instruction text.
- [x] T003 Create this feature specification and implementation plan.

## Phase 2: Surgical governance change
- [x] T004 Clarify in `AGENTS.md` Section 4 that the existing PR Summary is mandatory, updated in place, evidence-based, and never requires a repeat approval question.
- [x] T005 Add the absolute agent merge prohibition to `AGENTS.md` Section 5 and a final-audit confirmation to Section 7.
- [x] T006 Keep the rule in authoritative `AGENTS.md`; do not modify Jules Master Work Request #1 or duplicate the rule in subordinate governance.
- [ ] T007 Run `./jules-verify.sh` and inspect current-head checks. Shell execution is unavailable through the connected repository interface; keep this pending until GitHub checks provide evidence.

## Phase 3: Final audit
- [x] T008 Inspect the complete changed-file diff and confirm only `AGENTS.md` plus these required Spec Kit artifacts changed.
- [x] T009 Confirm the PR remains open and unmerged; reconcile its body summary with actual files and verification results.
