# Feature Specification: Append-Only DevSkim Alert Report and Notifications

**Feature Branch**: `039-devskim-alert-notifications`
**Created**: 2026-10-21
**Status**: Draft

**Input**: Keep one shared `devskim-alerts.md` file containing newly detected DevSkim findings, avoid duplicate entries on later scans, and notify the repository owner when new findings are added.

## User Scenarios & Testing

### User Story 1 — Preserve newly detected findings (Priority: P1)

As the repository owner, I want newly detected DevSkim findings appended to a shared report so I can review and remediate them without repeatedly checking the Security tab.

**Independent Test**: Given a report with an existing finding, a scan that returns that finding plus a different finding appends only the different finding and leaves the existing entry intact.

**Acceptance Scenarios**
1. Given an empty report, when a scan finds results, then the report is created and each distinct finding is recorded.
2. Given a report that already contains a finding, when a later scan detects that same finding again, then it is not appended a second time.
3. Given existing report entries, when a scan runs, then it does not replace or automatically clear those entries.
4. Given no new findings, when a scan runs, then the report is not needlessly committed and no notification is posted.

### User Story 2 — Notify when new findings arrive (Priority: P1)

As the repository owner, I want a GitHub notification when a genuinely new finding is added.

**Independent Test**: A scan that appends one or more new entries posts one comment on the configured GitHub notification issue with a link to the report and workflow run; a scan adding zero entries posts no comment.

**Acceptance Scenarios**
1. New report entries cause one comment per scan, mentioning `@davidcollier77-code`.
2. A scan containing only already-recorded findings does not notify.
3. Pull-request scans do not modify the shared report or use write permissions.

### User Story 3 — Keep workflow permissions safe (Priority: P1)

The workflow must not grant write permissions to untrusted pull-request execution merely to support report updates.

**Acceptance Scenarios**
1. The scanning job uses read-only repository content permission and only the required Security-events write permission for SARIF upload.
2. Report update and notification steps run only for eligible pushes to `main` or the scheduled scan.
3. No credentials or secret values are written to the report, log, or notification.

## Requirements

- **FR-001**: Keep `devskim-alerts.md` as the sole shared findings report.
- **FR-002**: Append findings that are not already represented in the report; do not overwrite existing entries automatically.
- **FR-003**: Use a stable deduplication key based on finding identity and location where available.
- **FR-004**: Commit the updated report only when new entries were added.
- **FR-005**: Post one GitHub issue comment mentioning the repository owner only when new entries were added.
- **FR-006**: Preserve the existing DevSkim GitHub Security/SARIF upload.
- **FR-007**: Do not give pull-request scans repository content write access.
- **FR-008**: Be explicit that the report covers findings produced by this DevSkim scan; it is not asserted to export all historical GitHub Code Scanning alerts.
- **FR-009**: Transfer SARIF only to the report-update job; a scan-generated Markdown artifact must never overwrite the shared append-only report.

## Constraints and Edge Cases

- A finding may move to a different line as code changes; prefer scanner-provided fingerprints when available and use source location as a fallback.
- Existing report entries remain until intentionally removed after remediation has been reviewed; this workflow does not infer fixes or clear records automatically.
- Branch protection or repository rules may block a workflow token from pushing to `main`; that behavior must be verified in an eligible run.
- GitHub notification delivery depends on repository issue-subscription and user notification settings.

## Success Criteria

- **SC-001**: Repeat scans do not duplicate already-recorded finding identities.
- **SC-002**: New findings are retained in the committed shared file.
- **SC-003**: A GitHub notification comment is posted only when at least one new entry is committed.
- **SC-004**: Pull-request scanning remains unable to write to repository contents.
