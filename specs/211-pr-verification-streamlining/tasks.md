# Tasks — PR Verification Streamlining

## Applicability and audit

- [x] T001 Add the fail-closed build/visual applicability classifier.
- [x] T002 Gate OpenNext build validation on build applicability, with merge
  group and dispatch always building.
- [x] T003 Recompute applicability from the trusted base in both audit
  workflows.
- [x] T004 Make a required-but-skipped check blocking and a not-applicable check
  harmless.
- [x] T005 Rename the always-required job to Application Verification and keep it
  unconditional.
- [x] T006 Render `NOT RUN — not applicable` with the classifier reason.

## Playwright

- [x] T007 Capture per-spec timings through the JSON reporter and summarize them.
- [x] T008 Add the duration-weighted, file-affine shard planner with exact
  coverage guards.
- [x] T009 Add the affected-spec map and selector in shadow mode.
- [x] T010 Add flake and imbalance warnings without changing run results.
- [x] T011 Add `--forbid-only`; keep every spec, project, config and baseline.
- [x] T012 Update the install-timing reporter for the renamed job.

## Local gate and tests

- [x] T013 Extend `freebuff-verify.sh` with all Python suites, full Vitest,
  docs tests, the build and the size cap.
- [x] T014 Add execution tests for applicability, sharding, timings, selection
  and the workflow contract.
- [x] T015 Preserve and assert Crystal Ball/Oracle, adaptive-performance,
  resource-readiness, DevSkim, CodeQL, Dependabot and the performance checker.

## Documentation and handoff

- [x] T016 Fix the stale `AGENTS.md` references in `PR_SUBMISSION.md` and
  `README.md`.
- [x] T017 Update the PR template, Memory Bank and Spec 211 artifacts.
- [x] T018 Run the local matrix, review the diff and open one unmerged PR.
