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
- [X] T016 Submit one regular, non-draft PR targeting `main`; leave it open and unmerged for owner review.
- [ ] T017 Inspect the current-head consolidated seven-category report after its configured bounded wait and hand off its actual statuses and outstanding approvals.

## Verification Boundary

- Startup preflight: executed with the exact Library `startup.sh --check-only`; result was Node.js 22.16.0 and pnpm unavailable.
- Repository checkout: unavailable in the ChatGPT working container; no repository script or checker suite was executed.
- Source inspection method: T011–T013 used GitHub API file-content reads and PR changed-file inventory plus diff inspection; no local checkout, local script execution or local tests were involved.
- Node.js 26.x / pnpm 10.30.3 project verification: BLOCKED in this session by the missing required runtime/package manager.
- Compatible repository scripts: permitted by current `AGENTS.md` §6 when prerequisites and safety conditions are met; none were run because no local repository checkout is available.
- Application Verification and other PR-triggered checks: PENDING until their results are observed for the submitted PR's exact head.
- Production build size: NOT MEASURED; this documentation-only change does not alter build inputs.

## Definition of Done

- Every in-scope stale policy explanation is corrected or explicitly retained as a historical fact with accurate context.
- Spec 220's dependency work and all its implementation/verification tasks remain pending for the required Node.js 26.x / pnpm 10.30.3 environment.
- The feature pointer targets Spec 223 and all three Spec 223 artifacts appear in the PR diff.
- The exact PR changed-file inventory matches the QA scope declaration.
- The PR is regular, non-draft, open and unmerged; post-submission report outcomes are handed to the owner without inventing passes.
