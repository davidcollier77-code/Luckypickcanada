# Feature Specification: PR Verification Report Timing

**Feature Branch**: `freebuff/856a686c49f64f37f6ddb027-epr-timing`

**Created**: 2026-11-21

**Status**: Implemented

**Input**: The consolidated PR verification report is triggered by individual `workflow_run` completion events and by pull-request events, but it does not use the audit's existing bounded wait. It therefore reads evidence while sibling checks are still pending and publishes an incomplete result for the current head. Correct the timing without changing the seven categories, the declarations or the report's publication and failure behaviour, and make the two `PR_SUBMISSION.md` reading points explicit.

## User Scenarios & Testing

### User Story 1 — The report describes settled current-head checks (Priority: P1)

An owner or submitter opening a pull request sees one consolidated report whose seven categories describe the checks that actually ran for the current head, not a snapshot taken while sibling checks were still queued.

**Why this priority**: The first trigger for a head is a pull-request event or the first checker to finish. Without waiting, the report publishes `NOT RUN` for checks that are merely pending and has to be replaced by a later refresh, which is exactly the misleading state the report exists to prevent.

**Independent Test**: Drive `wait_for_current_head` with a scripted sequence of GitHub responses: no check runs, then partially created checks, then pending checks, then settled checks. Assert that the wait keeps polling until the current head's audited checks are settled, and that the audit of the early snapshot is `NOT VERIFIED` while the settled snapshot is `VERIFIED`.

**Acceptance Scenarios**:

1. **Given** a head whose required checks have not been created yet, **When** the wait runs, **Then** it keeps polling instead of returning the empty snapshot.
2. **Given** a head with one required check still running, **When** the wait runs, **Then** it returns only after that check completes.
3. **Given** a head whose required checks are settled and no Visual QA run exists, **When** the wait runs, **Then** it returns without sleeping through the whole deadline.
4. **Given** a pending Visual QA shard, **When** the required checks are already green, **Then** the wait continues until the shard completes.
5. **Given** a check that never finishes, **When** the deadline passes, **Then** the wait returns and the published audit reports the real pending/incomplete status, never a pass.

### User Story 2 — A commit that lands mid-wait is followed (Priority: P1)

A push that arrives while the report is waiting is reported against the new head, and the checks of the previous head are never presented as evidence for it.

**Independent Test**: Poll one head with a pending check, then return a new head with its own pending and settled checks; assert the wait follows the new head and the final audit names the new SHA.

### User Story 3 — Timing correction changes nothing else (Priority: P1)

The seven categories, their meanings, the exact declarations, the sticky publication and the exit-code/failure behaviour of the report are unchanged.

**Independent Test**: The existing report and scope suites plus the workflow-contract assertions continue to pass; the workflow still publishes one sticky comment from trusted `main`, still replaces a render failure with a marker-first `NOT RUN` placeholder, and still fails the job when a category is `FAILED`.

### User Story 4 — Submission reading points are explicit (Priority: P2)

Freebuff is explicitly required to read `PR_SUBMISSION.md` before implementation begins, alongside the applicable QA checker requirements, and again immediately before creating the pull request as the final submission checklist.

**Independent Test**: Assert both the guide and the pull request template contain the two reading points, and that the exact pre-submission code-quality and protected-file declarations are still present and unchanged.

## Requirements

### Functional Requirements

- **FR-001**: The report workflow MUST use the existing bounded wait in `verify_pr_verification_status.py` before it reads evidence, instead of adding a second polling loop.
- **FR-002**: The wait MUST be bounded and MUST remain shorter than the job timeout, so an unfinished check cannot stall the report indefinitely.
- **FR-003**: The wait MUST re-read the pull request on every poll and follow a head that changes during the wait.
- **FR-004**: Pending, missing, skipped, cancelled, neutral and stale results MUST NOT be treated as passed; a deadline expiry MUST produce the accurate incomplete result.
- **FR-005**: Waiting MUST NOT be a gate: the audit, the renderer and the existing status gate still decide the published status and the job conclusion.
- **FR-006**: The seven categories, their meanings, the four statuses and the exact declarations MUST remain unchanged, as MUST the sticky-comment publication and the exit-code/failure behaviour.
- **FR-007**: The workflow-contract tests MUST assert the wait invocation, its position before the evidence fetch and its bound relative to the job timeout.
- **FR-008**: The auditor's regression suite MUST cover the early-trigger snapshot, delayed check creation, a pending required check, a pending conditional shard, a head change during the wait and the timeout path.
- **FR-009**: `PR_SUBMISSION.md` MUST require reading at two points: before implementation begins alongside the QA checker requirements, and immediately before PR creation as the final submission checklist.
- **FR-010**: `.github/pull_request_template.md` MUST carry the same two reading points without changing the required sections, markers or exact declarations.
- **FR-011**: `freebuff-verify.sh` MUST run the consolidated report contract suite and MUST NOT ask submitters for manual browser evidence that the submission requirements no longer require.

### Key Entities

- **Bounded wait**: the existing `wait_for_current_head` capability, parameterised by `--wait-seconds` and `--poll-interval`.
- **Current-head snapshot**: pull request metadata plus the check runs created for that head, re-read on every poll.
- **Report evidence bundle**: the settled pull request, diff, comments, check runs, verification audit, alerts and dependency advisories read after the wait.

## Success Criteria

- **SC-001**: A run triggered before sibling checks exist no longer publishes their `NOT RUN` snapshot as the final word for the head.
- **SC-002**: The wait never exceeds its bound and returns honest evidence when the bound is reached.
- **SC-003**: A head change during the wait is reported against the new head.
- **SC-004**: All existing report, scope and workflow-contract suites still pass unchanged in meaning.
- **SC-005**: The guide and the template state both reading points and keep every exact declaration.

## Assumptions

- `workflow_run` and `pull_request_target` remain the only triggers; the pull request's code is never checked out or executed.
- Visual QA remains a conditional check: when it does not run, the report says `NOT RUN` and does not wait for it.
- The 495 MiB build cap, DevSkim, the full unit suite, the type check, the OpenNext build and both Playwright shards remain unchanged.
