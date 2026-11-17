# Tasks: DevSkim Alert Report Review and Cleanup

**Input**: Design documents from `/specs/182-devskim-alert-report-review/`

**Prerequisites**: plan.md, spec.md

## Phase 1: Audit

- [x] T001 Inventory every bullet in `devskim-alerts.md` with rule, path, line, severity, and stable identity.
- [x] T002 Verify each reported path and line exists in the current tree and record the current line content.
- [x] T003 Recover the revision that produced each entry from `git log -S <identity>` and inspect the older file revisions (`2e7cd054`, `e5b86a99`, `0b12cd86`, `bc6f2016`, `b47dbd49`).
- [x] T004 Install DevSkim CLI 1.0.103 and scan `.github/scripts/test_check_qa_pr_scope.py`, `.github/scripts/test_review_pr_changes.py`, `.github/scripts/review_pr_changes.py`, and `.github/scripts/test_report_visual_qa_install_timings.py` at HEAD.
- [x] T005 Scan the pre-fix `0b12cd86` revision of the timing reporter test to reproduce the recorded DS173237 error.
- [x] T006 Replay the combined SARIF through `.github/scripts/suppress_devskim_false_positives.py` to confirm none of the live findings is already an audited suppression.
- [x] T007 Trace data flow, reachability, trust boundaries, and impact for each live finding using the Trail of Bits false-positive workflow in `.docs/security/`.
- [x] T008 Classify each entry as live false positive, stale positional duplicate, or remediated stale entry in `triage.md`.

## Phase 2: Cleanup

- [x] T009 Remove the ten audited entries from `devskim-alerts.md`, preserving the title, explanatory text, and append marker.
- [x] T010 Confirm no DevSkim rule, suppression, workflow, scanner configuration, application source, dependency, or deployment file changed.
- [x] T011 Record the selected security task group, the `.docs/` references used, and the integrations used.

## Phase 3: Verification and Handoff

- [x] T012 Run the Python QA checker suites relevant to the affected tooling.
- [x] T013 Run `./freebuff-verify.sh` (Spec Kit gate, verification-status integrity, AGENTS.md protection, type check, production build, refresh-docs tests).
- [x] T014 Measure the production build (`.next` + `public`) and confirm it is strictly below 495 MiB.
- [x] T015 Write `evidence.md` with the exact commands, outputs, and limitations.
- [x] T016 Update `memory-bank/activeContext.md` and `memory-bank/progress.md`.
- [x] T017 Prepare the exact-path PR scope declaration and open the PR for owner review.

## Dependencies & Execution Order

- T001-T008 must complete before any removal.
- T009 depends on T008.
- T012-T014 depend on T009 and T016.
- T017 depends on a clean final diff and recorded HEAD SHA.
