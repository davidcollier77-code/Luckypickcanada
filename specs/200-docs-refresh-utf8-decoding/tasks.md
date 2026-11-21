# Tasks: UTF-8-Safe Documentation Refresh

**Input**: spec.md and plan.md  
**Prerequisites**: plan.md and spec.md

## Phase 1: Setup

**Purpose**: Confirm the current updater behavior and required safeguards.

- [x] T001 Inspect the response readers, test harness and scheduler assertions in scripts/refresh-docs.js, scripts/test-refresh-docs.js and .github/workflows/refresh-docs.yml.

## Phase 2: Foundational

**Purpose**: No new infrastructure is required; retain the existing byte and storage limits.

- [x] T002 Confirm the 10 MB per-response limit and 495 MiB documentation-library limit remain unchanged in scripts/refresh-docs.js.

## Phase 3: User Story 1 — Preserve valid streamed documentation (Priority: P1)

**Goal**: Reconstruct valid UTF-8 across arbitrary HTTP chunk boundaries and reject malformed byte sequences without damaging existing snapshots.

**Independent Test**: Feed the fetch helper a valid response whose four-byte Unicode code point is split across chunks and assert exact text equality; feed malformed UTF-8 and assert a clear rejection.

### Tests

- [x] T003 [US1] Extend the HTTPS response mock to emit multiple Buffer chunks and response-stream errors in scripts/test-refresh-docs.js.
- [x] T004 [US1] Add valid split-code-point and malformed-UTF-8 regression tests in scripts/test-refresh-docs.js.

### Implementation

- [x] T005 [US1] Add bounded byte collection and fatal whole-response UTF-8 decoding to the documentation fetch path in scripts/refresh-docs.js.
- [x] T006 [US1] Apply the same safe decoding and byte accounting to the GitHub commit-SHA response reader in scripts/refresh-docs.js.
- [x] T007 [US1] Add the standalone documentation-refresh regression suite to the Node 26 QA verification job in .github/workflows/visual-qa.yml.

## Phase 4: Polish and Cross-Cutting Verification

**Purpose**: Confirm protected updater behavior remains represented and hand off exact verification status.

- [x] T008 Review that existing timeout, HTTPS/redirect, token-sanitization, 10 MB size, retry and scheduled-slot assertions remain in scripts/test-refresh-docs.js.
- [x] T009 Verify the configured URL inventory and refresh schedule remain untouched in .docs/manifest.json and .github/workflows/refresh-docs.yml.
- [x] T010 Record unavailable local execution and the PR-triggered verification responsibilities in the PR handoff PR_SUBMISSION.md.

## Dependencies & Execution Order

- T001–T002 establish the current behavior and boundaries.
- T003–T004 establish regression coverage before the decoder repair.
- T005–T006 implement the two response-reader fixes.
- T007 ensures the regression suite runs for future pull requests.
- T008–T010 complete the preservation and handoff review.

## Implementation Strategy

The P1 story is the complete task. No application deployment, URL replacement, manifest edit or visual-baseline update is required. Local execution is recorded as blocked when the supported Node 26 checkout is unavailable; the Node 26 pull-request QA job runs the test suite after submission.
