# Tasks: Visual QA Install Timing Reporter Corrections

**Feature**: `168-visual-qa-timings-fixes`
**Input**: [spec.md](./spec.md), [plan.md](./plan.md)

## Phase 1: Investigation

- [x] T001 Confirm the QA workflow compiles the reporter and runs its focused suite without any workflow change.
- [x] T002 Inspect the DevSkim workflow, suppression scripts and reporting scripts to establish how the fixture finding is reported and what counts as cleared.
- [x] T003 Review the PR scope declaration, protected-file, Spec Kit and classifier gates for this CI-only follow-up.

## Phase 2: Corrections

- [x] T004 [US1] Require a successfully completed restore step in `chromium_state_from_steps()` in `.github/scripts/report_visual_qa_install_timings.py`.
- [x] T005 [US1] Keep the first recorded cache state in `parse_cache_states()` so a duplicate restore line cannot overwrite it.
- [x] T006 [US2] Fix job pagination in `load_live()` for missing, zero and positive totals in `.github/scripts/report_visual_qa_install_timings.py`.
- [x] T007 [US3] Separate log retrieval from decoding so a corrupt zip archive fails visibly in `.github/scripts/report_visual_qa_install_timings.py`.
- [x] T008 [US4] Preserve JSON decoding detail in `api_json()` in `.github/scripts/report_visual_qa_install_timings.py`.

## Phase 3: Regression tests

- [x] T009 [P] [US1] Add failed, cancelled, skipped, conclusion-less and incomplete restore-step tests plus the missing-miss-step log fallback test in `.github/scripts/test_report_visual_qa_install_timings.py`.
- [x] T010 [P] [US1] Add the duplicate-hit first-key regression test in `.github/scripts/test_report_visual_qa_install_timings.py`.
- [x] T011 [P] [US2] Add missing/zero/positive total and multiple-full-page pagination tests with a patched API in `.github/scripts/test_report_visual_qa_install_timings.py`.
- [x] T012 [P] [US3] Add unavailable-log and corrupt-zip tests, including a non-zero exit through `main()`, in `.github/scripts/test_report_visual_qa_install_timings.py`.
- [x] T013 [P] [US4] Add the invalid-JSON diagnostic test in `.github/scripts/test_report_visual_qa_install_timings.py`.
- [x] T014 Replace the hexadecimal `head_sha` fixture with a harmless dummy value and assert the preserved eight-character output formatting in `.github/scripts/test_report_visual_qa_install_timings.py`.

## Phase 4: Verification and records

- [x] T015 Run Python compilation and the focused reporter suite; run the remaining QA infrastructure suites and the classifier guard.
- [x] T016 Run the full unit suite, TypeScript check and the repository gate; measure the production build size.
- [x] T017 Run the DevSkim scan for the changed test file and confirm whether the fixture finding is cleared.
- [x] T018 Update `.specify/feature.json`, Memory Bank, `evidence.md` and record results.
- [x] T019 Review the complete diff and prepare the PR description.
- [ ] T020 Open exactly one regular, non-draft, unmerged PR against `main`.
