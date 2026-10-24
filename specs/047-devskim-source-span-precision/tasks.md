# Tasks: DevSkim Source-Span Precision

**Input**: Design documents from specs/047-devskim-source-span-precision/

**Prerequisites**: spec.md and plan.md

## Phase 1: Setup and Baseline

- [X] T001 Read repository governance, the Security task-group guidance, routed docs, constitution, Spec Kit definitions/templates, scanner helper, tests, workflow, prior DevSkim PRs, and historical raw/filtered SARIF.
- [X] T002 Confirm PR #1589 has merged and check for duplicate branches/PRs before creating this task branch.
- [X] T003 Define fail-open behavior for ambiguous contextual matches: missing coordinates or mismatched spans remain visible.

## Phase 2: Exact-Span Matching (US1)

**Goal**: A suppression must match the precise location reported by SARIF, not only a safe-looking line.

- [ ] T004 Add source-region extraction and coordinate-validation helpers to .github/scripts/suppress_devskim_false_positives.py.
- [ ] T005 Require DS172411 results to start at the exact safe setTimeout / test timeout call before applying existing callback checks.
- [ ] T006 Require DS162092 and DS137138 results in test fixtures and allowlisted local origins to match the exact reported source token.
- [ ] T007 Require DS610000's reported range to point inside the known static source-matching regex in the security test.
- [ ] T008 Require Cloudflare account-ID results to overlap the known ID literal and lockfile package-name results to overlap the exact allowlisted package identifier; keep SHA-512 digest checks intact.

## Phase 3: Regression Tests (US1, US2)

**Goal**: Prove safe matches are still suppressed while unrelated/unsafe matches remain visible.

- [ ] T009 Add positive tests using valid source columns matching known real DevSkim region formats.
- [ ] T010 Add negative tests for unrelated expressions on the same line, the wrong token/columns, missing columns, and cross-line regions.
- [ ] T011 Add lockfile tests showing a known package-name warning is suppressed only when the reported range is inside that package name, not another same-line hash-looking value.
- [ ] T012 Run Python syntax validation and the full DevSkim suppression unittest discovery command.

## Phase 4: Verification and Handoff

- [ ] T013 Run ./jules-verify.sh and confirm the Spec Kit gate on the final branch in available CI.
- [ ] T014 Inspect the full final diff twice for accidental allowlist expansion, changed justifications, workflow/report scope drift, and any possibility of hiding a genuine finding.
- [ ] T015 Check DevSkim current-head logs and SARIF artifact to confirm exact source-span changes preserve approved false-positive reductions and retain unmatched results.
- [ ] T016 Complete the canonical PR summary with actual stage methods, files, checks, evidence, limits, and final review status.

## Dependency Order

T004 precedes T005-T008. T009-T011 depend on the matching logic. T012-T015 depend on implementation/tests. T016 follows the final diff and observed verification.

## Acceptance Checklist

- [ ] All existing expected-safe test cases still pass with actual source coordinates.
- [ ] All new incorrect-span and missing-coordinate negative cases remain reportable.
- [ ] No rule, directory, or workflow trigger was globally disabled.
- [ ] The exact prior suppression justifications remain unchanged.
- [ ] Final PR remains open and unmerged for owner review.
