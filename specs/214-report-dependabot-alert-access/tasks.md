# Tasks: Read-only Dependabot alert access for the PR verification report

**Feature**: `specs/214-report-dependabot-alert-access` | **Plan**: `specs/214-report-dependabot-alert-access/plan.md` | **Spec**: `specs/214-report-dependabot-alert-access/spec.md`

One implementation and one separate, regular, unmerged pull request.

## Phase 1 — Confirm the permission boundary

- [x] T001 Inspect `.github/workflows/pr-verification-report.yml`: it reads `dependabot/alerts` with `GH_TOKEN` but declares only `contents`, `pull-requests`, `issues`, `checks` and `security-events`.
- [x] T002 Confirm from GitHub's workflow-permission documentation that `vulnerability-alerts: read` lists Dependabot alerts for `GITHUB_TOKEN`, accepts only `read` or `none`, and is separate from `security-events`.
- [x] T003 Confirm the workflow runs under `pull_request_target`, checks out `ref: main`, and therefore takes its workflow file and permissions from the base branch.

## Phase 2 — Implement

- [x] T004 Add `vulnerability-alerts: read` with a short explanatory comment to the existing top-level `permissions` block.
- [x] T005 Confirm no trigger, permission, concurrency rule, timeout or step changed.

## Phase 3 — Documentation and verification

- [x] T006 Record Spec 214 artifacts documenting the permission, the `pull_request_target` bootstrap limitation and the PR #2014 `WARNING` consequence.
- [x] T007 Record the durable permission fact in `memory-bank/techContext.md`.
- [x] T008 Parse the workflow YAML and confirm the added permission is present.
- [x] T009 Run the Spec Kit governance gate against base `4c6087cfa5a0b47f0ff9b1fdd7d7abec93be216f`.
- [x] T010 Run the Python checker suites that read the report workflow.
- [x] T011 Commit, push and open one separate regular, non-draft PR with the complete `PR_SUBMISSION.md` body; leave it unmerged.
- [x] T012 Hand off the PR link, the observed report outcomes for this PR and PR #2014, and the fact that no governance digest or protected-file authorization applies.
- [ ] T013 After this change reaches `main`, refresh PR #2014's report and confirm its seventh category reports `WARNING` rather than `NOT RUN`, then record the observed Dependabot alert state.

## Delivery notes

- This PR's own report runs the current `main` workflow and will keep its
  seventh category at `NOT RUN`; the permission takes effect only after merge.
- PR #2014's seventh category becomes `WARNING`, not `PASSED`, after merge,
  because that PR changes `.github/dependabot.yml`.
