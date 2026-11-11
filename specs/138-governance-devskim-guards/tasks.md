# Tasks: Protect Agent Governance and Repair DevSkim Benchmark Filtering

**Input**: Design documents from `specs/138-governance-devskim-guards/`

**Prerequisites**: `plan.md`, `spec.md`

## Phase 1: Investigation

- [x] T001 Inspect current AGENTS.md, PR_SUBMISSION.md, selected task-group instructions, Memory Bank, .docs manifest and relevant security/testing references.
- [x] T002 Trace the active Protected File Changes workflow, CODEOWNERS, governance test, DevSkim workflow, suppression helper and regression suite.
- [x] T003 Confirm the precise DevSkim failure: a call to the undefined `is_local_specs_benchmark_path` helper and the two real performance-report paths in specs/134.

## Phase 2: Restore AGENTS.md protection

- [x] T004 Add AGENTS.md to the Protected File Changes workflow path trigger and protected-file runtime list.
- [x] T005 Add the explicit AGENTS.md owner entry to .github/CODEOWNERS.
- [x] T006 Replace obsolete governance-test text/section assertions with current AGENTS.md requirements and regression checks for both owner protections.

## Phase 3: Repair DevSkim path validation

- [x] T007 Add the exact numbered-feature path helper for perf-baseline.json and perf-after.json.
- [x] T008 Include those exact paths in the allowed-artifact and local-probe-origin path checks without broadening other specs JSON eligibility.
- [x] T009 Add positive tests for both reviewed files and negative tests for unrelated paths, malformed JSON and non-URL loopback content.

## Phase 4: Verification and handoff

- [ ] T010 Run Python syntax validation and the complete DevSkim suppression unit suite; resolve every failure.
- [ ] T011 Run the focused and full Vitest suites; resolve every failure.
- [ ] T012 Run ./freebuff-verify.sh and applicable workflow/security checks; measure and report production build size under 495 MiB.
- [ ] T013 Review the final diff; confirm AGENTS.md, PR #1818, its branch and its files remain untouched.
- [ ] T014 Prepare the complete PR description and handoff only after every mandatory pre-submission check passes. Leave the PR open and unmerged.

## Completion Status

Implementation files and regression cases are prepared on the task branch. Verification is intentionally pending until the repository shell-capable environment runs the commands above. No PR has been submitted.
