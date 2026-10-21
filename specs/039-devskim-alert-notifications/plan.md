# Implementation Plan: Append-Only DevSkim Alert Report and Notifications

**Branch**: `chore/devskim-alerts-artifact`
**Date**: 2026-10-21
**Spec**: [spec.md](./spec.md)

## Summary

Keep the existing DevSkim scan and SARIF upload, add a committed `devskim-alerts.md` report, append only finding identities not already recorded, and post a comment on notification issue #1556 when new findings are appended. Preserve report entries until a person removes them after verified remediation.

## Technical Context

- **Language/Runtime**: YAML workflow with Bash and Python 3 for report generation.
- **Third-party Actions**: Existing repository-pinned checkout and DevSkim action; existing pinned SARIF upload action. Any additional actions should be pinned to verified commit SHAs.
- **Data**: SARIF output from DevSkim and Markdown entries in `devskim-alerts.md`.
- **Verification**: Inspect workflow changes; check generated-report logic against repeated and new finding examples where an execution environment is available; use PR CI and the first eligible main/schedule run to verify commit and notification behavior.
- **Constraints**: No external secret changes; no broad scanner suppressions; maintain the repository 495 MB build cap (no app build expected for workflow-only changes).

## Design

1. Keep the scanning/SARIF job restricted to the permissions necessary to scan and upload SARIF.
2. Restrict persistent report writes and issue comments to a separate job that runs only on `main` push or schedule.
3. Append stable, deduplicated finding records into `devskim-alerts.md`; never automatically clear prior entries.
4. Commit only when new entries exist.
5. Post one comment to issue #1556 with count, report link, and run link only after a successful report commit.
6. Avoid unsupported claims about completeness: DevSkim's SARIF output represents this scan, not necessarily all historical Code Scanning alerts.

## Security and Governance

- Job-level write permissions must not be present on the pull-request scanning job.
- The write-capable job must be gated against `pull_request` events and must not execute PR-supplied workflow code on an untrusted ref.
- Report and comment content must be derived from scan output and fixed URLs; do not include secrets or arbitrary raw log content.
- A failed push due to branch protection must be treated as a blocker, not as successful report persistence.

## Verification Status

- PR CI log reviewed: targeted Crystal Ball tests, all unit tests, and TypeScript check passed; the mandatory `./jules-verify.sh` failed because this task's Spec Kit `spec.md`, `plan.md`, and `tasks.md` were not present in the PR at that run.
- Current changes include the three required task documents to address that governance check.
- Workflow's write path and notification require a fresh eligible run to verify; branch-protection behavior is not yet known.
