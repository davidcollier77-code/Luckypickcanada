# Feature Specification: Refresh Baseline Reuse for Open Updater Pull Requests

**Feature Branch**: `freebuff/e001f4616ba90ebf2d84b833`
**Created**: 2026-11-28
**Status**: Implemented — local updater regression suite passing
**Input**: Owner request to repair the Documentation Library updater so it detects genuine upstream changes, stops re-reporting already-applied documents, and records unchanged documents between runs without changing its design or schedule.

## Problem Statement

The updater compares every run against the default branch. When a scheduled or manual run publishes refreshed snapshots to `auto/docs-refresh`, the new content lives only on that branch until the pull request is merged. The next run checks out `main` again, so the same differences reappear and are re-reported and re-pushed.

Observed run history:

- PR #2062 received three commits for the same two document changes: `d9c906d` (run 46087185545, created 00:19Z), `08d8ccb` (same run, 01:32Z) and `50b5337` (run 46094064746, 01:38Z). Its final report still read "2 updated".
- The Cloudflare Pages snapshot changed once in that pull request and only once in its history: a genuine upstream edit (moving Pages guidance to Workers Static Assets). It was not volatile. It was re-applied because the follow-up run compared against `main` again.
- The NumPy snapshot changed by exactly one line in nine consecutive refreshes (#2025, #2029, #2030, #2032, #2051, #2053, #2055, #2056, #2062). That is the separate rotating Cloudflare email-protection token cause repaired by Spec 228; #2062 was the single legitimate clean-up pass.

## User Scenarios & Testing

### User Story 1 — Stop recreating pending updates (Priority: P1)

As the documentation library maintainer, I need a run that starts while an updater pull request is still open to compare against that pull request's snapshots, so documents already refreshed are reported as unchanged instead of updated again.

**Independent Test**: Publish a refresh to a pending branch, then run the refresh from the default branch twice — once with the pending branch as baseline and once without it. Without the baseline the document is updated again and produces a new commit; with the baseline it is `CURRENT (no changes)` and the staged tree equals the pending branch.

### User Story 2 — Keep genuine changes flowing (Priority: P1)

As the maintainer, I need genuine upstream content changes to be detected even while a refresh pull request is open.

**Independent Test**: With the pending baseline in place, change the controlled upstream fixture. The same run reports the document as updated, rewrites the snapshot and creates a commit.

### User Story 3 — Keep the manifest honest (Priority: P1)

As the maintainer, I need `lastUpdated` and `githubShas` to move only when a run verified something, so manifest-only churn cannot masquerade as documentation work.

**Independent Test**: Failed and rejected downloads leave both the recorded SHA and the timestamp untouched; a verified, content-identical download advances the SHA but not the timestamp; a content change advances both.

## Requirements

### Functional Requirements

- **FR-001**: When an open `auto/docs-refresh` pull request exists, the workflow MUST reuse that branch's `.docs` tree as the comparison baseline before running the refresh.
- **FR-002**: `manifest.groups` MUST remain authoritative from the default branch, so a pending branch can never reintroduce a deliberately removed document.
- **FR-003**: When no open refresh pull request exists, or the pending branch cannot be fetched, the workflow MUST behave exactly as before (compare against the default branch) and must not fail the run.
- **FR-004**: The "Check for Changes" gate MUST compare the staged `.docs` tree against the selected baseline so an unchanged repeat run creates no commit, no branch update and no pull request comment.
- **FR-005**: A genuine upstream content change MUST still be detected, validated and applied while a refresh pull request is open.
- **FR-006**: Upstream SHAs MUST be recorded only after a download passes validation; download and validation failures MUST remain visible and must not be counted as updates.
- **FR-007**: Documents that share an upstream repository SHA MUST be decided independently by their own content and their own SHA pin.
- **FR-008**: Volatile URL tokens (Cloudflare email-protection fragments), replaced nonces, `sealed_token` query values and line-ending or trailing-whitespace differences MUST NOT produce recurring false updates.
- **FR-009**: The refresh schedule, timezone, scheduler slots, scheduler activation guard and manual dispatch MUST remain unchanged.
- **FR-010**: PR creation/update behaviour, validation, integrity safeguards, the approved inventory and the 495 MiB library cap MUST be preserved.

### Non-Functional Requirements

- The repair adds one small helper script and one workflow step; it does not restructure the updater, its transport, its validation or its reporting.
- The helper is pure and unit-testable; no new dependency is introduced.

## Out of Scope

- Changing the recorded-SHA strategy from repository-head pins to per-file pins.
- Changing cron expressions, timezone, scheduler slots, run frequency or the Cloudflare scheduler Worker.
- Rewriting `.docs` snapshots, source URLs, inventory or group routing.
- Weakening validation, integrity checks or the 495 MiB documentation cap.

## Success Criteria

- **SC-001**: A repeat run with an open refresh pull request reports `0 updated`, keeps the snapshot byte-identical and produces no new commit against the pending branch.
- **SC-002**: A genuine change during an open pull request is reported as updated and committed.
- **SC-003**: Failed and rejected downloads never advance `githubShas` or `lastUpdated`.
- **SC-004**: The updater regression suite covers every scenario above and passes.
- **SC-005**: The workflow still declares exactly the three original cron entries, the activation guard and `workflow_dispatch`.
