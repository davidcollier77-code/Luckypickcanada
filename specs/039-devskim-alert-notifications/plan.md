# Implementation Plan: Append-Only DevSkim Alert Report and Notifications

**Branch**: `chore/devskim-alerts-artifact`  
**Date**: 2026-10-21  
**Spec**: [spec.md](./spec.md)

## Summary

Keep one shared append-only `devskim-alerts.md` report, deduplicate findings by stable SARIF identity, and notify issue #1556 only when genuinely new findings require a report PR.

## Technical Design

1. The read-only scan job runs DevSkim once, uploads that SARIF to GitHub Code Scanning, and uploads the same SARIF as the `devskim-sarif` workflow artifact.
2. The trusted main/schedule-only job downloads only `devskim-alerts.sarif`; it must never download a scan-only Markdown file over the shared `devskim-alerts.md`.
3. `.github/scripts/append_devskim_findings.py` implements the append-only report update and stable deduplication. It uses rule ID + file URI + stable SARIF fingerprint; if no stable fingerprint exists, it uses rule ID + file URI + source line. Human-readable wording is not part of the identity.
4. The report-update job checks for an existing open bot report PR and updates that branch; otherwise it creates a new report branch and PR. It must fail visibly if it cannot verify the PR URL. It never pushes directly to main or merges a PR.
5. A notification comment on issue #1556 is posted only after changes have been committed to a report branch and an open report PR URL is verified. The comment links to the PR, the shared report on main, and the workflow run.

## Security and Scope

- Pull-request scans remain read-only for repository contents; report and issue writes are restricted to the trusted main/schedule-only job.
- Keep third-party actions pinned to full commit SHAs with version comments.
- Do not add credentials, secrets, or external services.
- Existing report entries are never automatically removed.
- The report contains findings reported by these DevSkim scans; it is not presented as a complete export of historical GitHub Code Scanning alerts.

## Verification Requirements

- Unit tests exercise the actual Python report implementation for first finding, repeated finding, wording change with the same fingerprint, and a genuinely new finding.
- Run `pnpm test -- __tests__/devskim-dedup.test.js` and `./jules-verify.sh`; record actual outcomes in the PR summary.
- CI must verify the latest branch head. Bot-PR creation and issue-comment delivery remain pending until an eligible main/schedule run executes.
