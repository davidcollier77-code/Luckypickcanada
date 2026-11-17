# Tasks: Exact-Span DevSkim Suppression for Reviewed CI Loopback Tokens

**Input**: Design documents from `/specs/183-devskim-tooling-loopback-suppression/`

**Prerequisites**: plan.md, spec.md

## Phase 1: Narrowed Scope

- [x] T001 Confirm the owner-approved scope is DS162092 only, in the reviewer and its test.
- [x] T002 Leave the two DS176209 placeholder fixtures untouched and visible.
- [x] T003 Prototype the exact predicates against the real SARIF regions for the three in-scope findings.

## Phase 2: Implementation

- [x] T004 Add the two-file loopback allowlist, justification, and exact line patterns.
- [x] T005 Permit the two files in `is_allowed_relative_path` and gate the union to DS162092 in `process_sarif`.
- [x] T006 Add the exact-span predicate with exclusion-set context validation.
- [x] T007 Wire the justification branch and add the justification to the verified set.
- [x] T008 Add two `AuditedFinding` replay families with exact source-line patterns.

## Phase 3: Tests

- [x] T009 Add positive tests for both reviewer exclusion-set tokens and the reviewer-test fixture.
- [x] T010 Add negative tests for a different set member, missing context, unreviewed path, external host, and partial span.
- [x] T011 Add the justification-membership test.
- [x] T012 Add the pipeline test that removes three reviewed results and retains an unrelated result.
- [x] T013 Add the replay test for both audited families and the unrelated survivor.

## Phase 4: Verification and Submission

- [x] T014 Run `py_compile` and the focused 110-test suite.
- [x] T015 Replay real scanner SARIF and confirm three suppressed, three removed, two placeholder results remaining.
- [x] T016 Run `SPEC_KIT_BASE_REF=HEAD ./freebuff-verify.sh`.
- [x] T017 Measure the production build and confirm it is strictly below 495 MiB.
- [x] T018 Write `evidence.md` with exact commands and results.
- [x] T019 Update `memory-bank/activeContext.md` and `memory-bank/progress.md`.
- [x] T020 Review the complete diff against applicable checker requirements.
- [x] T021 Commit, push, and open one regular, non-draft PR for owner review.

## Dependencies & Execution Order

- T004-T008 depend on T001-T003.
- T009-T013 depend on T004-T008.
- T016-T017 depend on T014-T015.
- T021 depends on T016-T020 and a clean final diff.
