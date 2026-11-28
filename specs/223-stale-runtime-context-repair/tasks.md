# Tasks: Stale ChatGPT Runtime Documentation Reconciliation

**Input**: `specs/223-stale-runtime-context-repair/spec.md` and `plan.md`
**Prerequisites**: Current `AGENTS.md` §6, `.docs/manifest.json`, the four core Memory Bank files, affected Spec Kit records, `PR_SUBMISSION.md` and applicable QA checker definitions.
**Tests**: Documentation consistency and exact-path review; PR-triggered Application Verification and seven-category report. No local project test/build is claimed.

## Phase 1 — Investigation and Specification

- [X] T001 Run the exact ChatGPT Library startup preflight and record the observed Node.js/pnpm environment without substituting another script.
- [X] T002 Read the complete current `AGENTS.md`, `.docs/manifest.json`, four core Memory Bank files and `PR_SUBMISSION.md`; inspect the applicable PR template, QA scope checker and PR report workflow.
- [X] T003 Search current repository documents for stale blanket statements that ChatGPT is prohibited from repository scripts, tests, builds, verification or `freebuff-verify.sh`.
- [X] T004 Classify each match: distinguish incorrect policy explanations from historically accurate statements that a command was not run.
- [X] T005 Define the exact 16-path scope and preserve Spec 220's separate dependency implementation boundary.

## Phase 2 — Documentation Implementation

- [X] T006 Correct Spec 220 `spec.md`, `plan.md` and `tasks.md` to state the actual Node.js 26.x / pnpm 10.30.3 blocker and current compatible-script permission.
- [X] T007 Correct the stale verification rationale in Specs 175, 176, 177, 197 and 216 without changing their historical test/build outcomes.
- [X] T008 Correct the obsolete `freebuff-verify.sh` prohibition in Spec 164's evidence record while preserving its NOT RUN status.
- [X] T009 Correct the affected active-context and progress explanations in the Memory Bank while preserving historical dates and non-execution facts.
- [X] T010 Add the complete Spec 223 plan and task artifacts and update `.specify/feature.json` to point to Spec 223.

## Phase 3 — Review and Verification

- [X] T011 Confirm every intended changed path, exact path inventory and latest blob state through GitHub API file-content reads and PR changed-file inventory plus diff inspection; no local checkout or local script execution.
- [X] T012 Search the affected documentation again for blanket script-prohibition wording; inspect every remaining match in context.
- [X] T013 Review the complete consolidated diff for unrelated changes, lost historical facts, contradictory Node.js/pnpm requirements and inaccurate verification claims.
- [X] T014 Confirm Spec 220 remains unimplemented, all dependency tasks remain unchecked, and no package/configuration/production change entered this PR.
- [X] T015 Complete the PR-body self-review, exact QA-scope declaration, task-group/reference/Memory Bank reporting and truthful local/CI verification statuses.
- [X] T016 Submit one regular, non-draft PR targeting `main`; leave it open and unmerged for owner review. The owner subsequently merged PR #2043.
- [X] T017 Inspect the current-head consolidated seven-category report and hand off its actual seven category statuses, supporting checks and outstanding governance finding.

## Verification Boundary

- Startup preflight: the original pre-submission record used the Library `startup.sh --check-only` invocation. For this closeout, the exact current Library script was re-read and executed as `bash startup.sh`; it completed without installing anything and reported Node.js 22.16.0 and pnpm unavailable.
- Repository checkout: unavailable in the ChatGPT working container. Source inspection and the final report review used read-only GitHub API file, PR, workflow and check-run evidence. No repository script or local checker suite was executed.
- Node.js 26.x / pnpm 10.30.3 project verification: BLOCKED in this session by the missing required runtime/package manager; no project commands were run under Node.js 22.
- Compatible repository scripts: permitted by current `AGENTS.md` §6 when prerequisites and safety conditions are met; none were run because no local repository checkout is available.
- PR #2043 final report: last published report matched head `7ce7c3678d157dabce99bfe5cec609474787e22e`. QA Checker, DevSkim, PR Scope Verification, Protected File Changes, Verification Integrity and Dependency Health & Vulnerability Review were **PASSED**; Governance and Workflow Verification was **FAILED** because the PR body omitted the exact required labels for Spec Kit stages, Spec Kit artifact paths and Memory Bank. The report's Application Verification result was **PASSED**; Visual QA and OpenNext build validation were **SKIPPED — NOT APPLICABLE**. No report refresh after merge is claimed.
- Production build size: NOT MEASURED; this documentation-only change does not alter build inputs.

## Definition of Done

- Every in-scope stale policy explanation is corrected or explicitly retained as a historical fact with accurate context.
- Spec 220's dependency work and all its implementation/verification tasks remain pending for the required Node.js 26.x / pnpm 10.30.3 environment.
- The feature pointer targets Spec 223 and all three Spec 223 artifacts appear in the PR diff.
- The exact PR changed-file inventory matches the QA scope declaration.
- PR #2043 was regular, non-draft, open and unmerged at owner handoff, then merged by the owner; the final published report outcomes and the governance-label failure are recorded above.
