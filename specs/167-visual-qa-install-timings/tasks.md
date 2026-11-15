# Tasks: Visual QA Install Timing Report

**Feature**: `167-visual-qa-install-timings`
**Input**: [spec.md](./spec.md), [plan.md](./plan.md)

## Phase 1: Investigation

- [x] T001 Inspect the Visual QA workflow's job and step names, the PR #1914 job timings and the two cache steps.
- [x] T002 Confirm the cache log contract (`Cache restored from key:`, `Cache not found for input keys:`) and the Chromium cache-miss step semantics.
- [x] T003 Review the PR scope declaration, protected-file and Spec Kit gates for a CI-only change.

## Phase 2: Reporter

- [x] T004 Implement `.github/scripts/report_visual_qa_install_timings.py` with run/job selection, whole-second durations and the embedded PR #1914 baseline.
- [x] T005 Parse pnpm and Chromium cache states and keys from job logs, with the Chromium step-conclusion fallback.
- [x] T006 Support plain-text and one-entry zip job logs, defensive redirect handling and token resolution without printing secrets.
- [x] T007 Render the comparison table and `--json`, including cold-store and unknown-state notes.
- [x] T008 Support `--fixture-dir` so every path is testable offline.

## Phase 3: Tests and CI wiring

- [x] T009 Add `.github/scripts/test_report_visual_qa_install_timings.py` covering cache parsing, decoding, selection, timing, fallback, rendering, JSON and failure paths.
- [x] T010 Add the reporter and its test to the QA `py_compile`/unittest step without changing any install or browser step.

## Phase 4: Verification and records

- [x] T011 Run the focused Python tests, full unit suite, TypeScript and the repository gate; record the build size.
- [x] T012 Update `.specify/feature.json`, Memory Bank and `evidence.md`.
- [ ] T013 Review the complete diff, prepare the PR body and open one regular, non-draft, unmerged PR.
