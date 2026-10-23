# Tasks: Reduce DevSkim False-Positive Noise

**Input**: Design documents in specs/042-devskim-noise-filtering/

**Prerequisites**: spec.md and plan.md

## Phase 1: Setup and Baseline

- [X] T001 Inspect AGENTS.md, the security specialist guidance, the existing DevSkim workflow, suppression helper, regression tests, and the 82-entry report PR.
- [X] T002 Classify observed finding patterns and define narrowly scoped allowlist boundaries in specs/042-devskim-noise-filtering/spec.md.
- [X] T003 Record implementation choices, guarded conditions, and verification constraints in specs/042-devskim-noise-filtering/plan.md.

## Phase 2: Implement Verified Suppression Rules (US1)

**Goal**: Remove only proven, context-matched false positives while keeping genuine or ambiguous findings visible.

- [X] T004 Extend SAFE_METADATA_KEY_TYPES and add exact manifest checksum-map validation in .github/scripts/suppress_devskim_false_positives.py.
- [X] T005 Add exact contextual predicates for the documented Cloudflare account identifier, callable timer callbacks, test-timeout settings, localhost test fixtures, development CORS origins, and the security-test regex in .github/scripts/suppress_devskim_false_positives.py.
- [X] T006 Add the exact reviewed suppression justifications to the verified-result removal allowlist in .github/scripts/suppress_devskim_false_positives.py.
- [X] T007 Preserve all other findings and keep the main DevSkim rules, scan triggers, and report updater unchanged.

## Phase 3: Regression Tests (US2)

**Goal**: Demonstrate both accepted false positives and negative cases that must remain visible.

- [X] T008 Add positive and negative test cases for metadata hashes, contextual timer findings, loopback fixtures, and static security-test regexes in .github/scripts/test_suppress_devskim_false_positives.py.
- [X] T009 Add SARIF tests demonstrating that only exact approved justifications are removed from uploaded results in .github/scripts/test_suppress_devskim_false_positives.py.

## Phase 4: Validation and Handoff

- [X] T010 Verify CI reports 39 passing suppression regression tests and the filter step completes successfully.
- [X] T011 Verify the dedicated DevSkim scan workflow uploads filtered SARIF successfully and records its actual suppression count.
- [X] T012 Verify the OpenNext build-artifact gate and CodeQL/static-analysis checks on the inspected implementation commit.
- [ ] T013 Recheck Visual QA and the Spec Kit governance gate on the current PR head after the required feature artifacts were added.
- [ ] T014 Inspect the final PR diff and check for overly broad suppressions, unrelated files, or claims unsupported by CI.

## Acceptance Checklist

- [X] No DevSkim rule is disabled globally.
- [X] No directory or file category is removed from scanning.
- [X] Unknown secret-like values and string/opaque timer callbacks remain unsuppressed.
- [X] Each new suppression has an exact justification and regression coverage.
- [ ] Final current-head CI and governance gates reviewed before reporting the result as fully verified.
