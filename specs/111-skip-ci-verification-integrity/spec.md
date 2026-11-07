# Feature Specification: Skip-CI Verification Integrity

**Feature Branch**: `freebuff/cef6175f03deca51d10d44c1`

**Created**: 2026-11-07

**Status**: Implemented

**Input**: Implement safeguards against unverified commits containing "[skip ci]" creating a false impression that a PR has passed verification.

## Context

GitHub skips `push` and `pull_request` workflow runs when the pull request's
HEAD commit contains a CI-skip directive (`[skip ci]`, `[ci skip]`, `[no ci]`,
`[skip actions]`, `[actions skip]`, or a `skip-checks: true` trailer). GitHub
documents that skipped checks remain "Pending", but the pull request's check
list also still shows the green results of the previous commit. A reviewer can
therefore read a green pull request while the current head never ran the
required workflows. This repository already contains examples of such commits
(for example `16588a15 [skip ci] fix(devskim): repair three code review
findings`), so the risk is concrete, not hypothetical.

The repository owns no tool that reports verification against the exact current
head; verification evidence lives only in prose in the PR body and in the
GitHub checks UI.

## User Scenarios & Testing

### User Story 1 — A skipped human head cannot look verified (Priority: P1)

As the repository owner, I want a pull request whose current head carries a
CI-skip directive to be reported as NOT VERIFIED with every unrun check marked
NOT RUN, so that green checks from an earlier commit can never be mistaken for
proof that the latest commit passed.

**Why this priority**: This is the exact false impression the task requires to be
prevented.

**Independent Test**: Audit a fixture pull request whose earlier commit has all
required checks green and whose head commit contains `[skip ci]`; the report must
be NOT VERIFIED, each required check must be NOT RUN, and the earlier runs must
be listed as ignored.

**Acceptance Scenarios**:

1. **Given** green required checks on an earlier SHA and a head commit containing `[skip ci]`, **When** the audit runs, **Then** the overall status is NOT VERIFIED and every required check is NOT RUN.
2. **Given** a head commit without a skip directive and all required checks completed successfully on that head, **When** the audit runs, **Then** the overall status is VERIFIED.
3. **Given** the head commit changed while the audit waited, **When** the audit completes, **Then** it describes the newest head SHA, not the SHA it started with.

### User Story 2 — Automated commits are audited the same way (Priority: P2)

As the repository owner, I want CI-skip detection to include commits authored by
automation, because agents and bots also push `[skip ci]` commits.

**Independent Test**: Audit a fixture whose head is authored by `github-actions[bot]`
with a `skip-checks: true` trailer and green checks on an earlier commit; the
report must be NOT VERIFIED, identify the actor as automation and mark the
required checks NOT RUN.

**Acceptance Scenarios**:

1. **Given** a bot-authored head commit containing a documented skip directive, **When** the audit runs, **Then** the skip is detected and the head is NOT VERIFIED.
2. **Given** an earlier human commit with a skip directive but a clean, fully verified head, **When** the audit runs, **Then** the head is VERIFIED and the earlier skipped commit is recorded for transparency.

### User Story 3 — Skipped, stale and conditional checks are never passes (Priority: P3)

As a reviewer, I want every check that did not run for the current head to be
labelled NOT RUN, so that "pending", "skipped", "cancelled" and "from an earlier
commit" are never read as verification.

**Independent Test**: Audit fixtures with a missing check, a `skipped`
conclusion, a `neutral` conclusion, a pending run and a stale successful run;
none may be reported as PASS.

**Acceptance Scenarios**:

1. **Given** a required check with no run on the current head, **When** the audit runs, **Then** it is NOT RUN and the pull request is NOT VERIFIED.
2. **Given** a check whose latest run on the current head failed after an older successful run, **When** the audit runs, **Then** it is FAIL.
3. **Given** a conditional check (Visual QA) that its own workflow legitimately skipped for a non-visual change, **When** the audit runs, **Then** it is reported NOT RUN, is not counted as a pass, and its workflow behaviour is unchanged.

### Edge Cases

- A check run exists for the same check name but on an earlier commit: it is listed as ignored and is never evidence for the current head.
- The head SHA is absent from the pull request's commit list: the audit fails closed.
- A run is completed with a null conclusion, or with `neutral`, `cancelled` or `skipped`: NOT RUN.
- A newer failed re-run must override an older successful run of the same check.
- A commit message contains `[skip city]` or `skip-checks: false`: not a skip directive.
- GitHub's API is unavailable or the token is absent: the audit exits with a distinct error code and never reports VERIFIED.

## Requirements

### Functional Requirements

- **FR-001**: The audit MUST detect all five documented CI-skip strings and the `skip-checks: true` trailer, case-insensitively, on commits authored by humans and by automation.
- **FR-002**: The audit MUST read the pull request's current head SHA at audit time and re-read it while waiting, so verification always describes the actual current head.
- **FR-003**: The audit MUST match check runs to the exact current head SHA and MUST NOT use a run attached to any other SHA as evidence.
- **FR-004**: The audit MUST report PASS only for a completed `success` run on the current head; failures as FAIL; incomplete runs as PENDING; and missing, stale, skipped, neutral, cancelled or null-conclusion checks as NOT RUN.
- **FR-005**: A CI-skip directive on the head commit MUST make the overall status NOT VERIFIED even if other checks are green, and each required check without a run MUST explain that the head's directive caused the skip.
- **FR-006**: Checks that legitimately do not apply to every pull request MUST be reported NOT RUN when they did not run, MUST never count as passed verification, and MUST retain their existing workflow conditions.
- **FR-007**: The audit MUST be exposed as a read-only pull-request check that GitHub does not skip because of commit-message directives, without checking out or executing pull-request code.
- **FR-008**: The audit command MUST exit non-zero when the head is not verified and write the same evidence to the GitHub step summary.
- **FR-009**: No existing workflow, required check, branch-protection setting or CI exception may be weakened or removed.
- **FR-010**: Automated tests MUST cover human and automated skips, stale checks, missing checks, skipped/neutral/cancelled conclusions, re-runs, conditional checks and CLI exit codes.

### Success Criteria

- **SC-001**: A fixture reproducing green earlier checks plus a `[skip ci]` head is reported NOT VERIFIED with all required checks NOT RUN.
- **SC-002**: A clean head with all required checks successful is reported VERIFIED.
- **SC-003**: No audited fixture reports an unrun check as PASS.
- **SC-004**: The new unit suite, `./freebuff-verify.sh`, TypeScript and the production build pass, and the measured build stays below the 495 MB maximum.
- **SC-005**: The workflow guard test proves the audit runs on `pull_request_target` and has no path filter that could hide it.

## Scope

**In scope**: a verification-status auditor under `.github/scripts/`, its unit
tests, one new read-only audit workflow, the local verification hook for the
tests, Spec Kit artifacts and Memory Bank records.

**Out of scope**: changing or removing CI skip directives, modifying existing
workflow behaviour, branch-protection settings, application code, dependencies,
payments, database, authentication, secrets, deployment or `.docs/` content.
