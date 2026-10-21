# PR Summary — DevSkim Alert Report and Notifications

## Task Group
- **Selected group**: security.
- **Reason**: This task changes a security-scanner workflow and GitHub Actions permissions.

## Goal
Maintain one shared append-only `devskim-alerts.md` file and notify the repository owner only when a new finding is added.

## Implementation
- Added `devskim-alerts.md` as the shared report.
- Updated the DevSkim workflow:
  - `lint` job produces the SARIF, uploads it to GitHub Security, generates a readable `.md` summary, and uploads both as a named artifact (`devskim-sarif`).
  - `update-report` job downloads that exact artifact instead of running DevSkim a second time, ensuring the Security tab and the report use identical data.
  - Deduplication identity is derived from rule ID + file URI + stable SARIF fingerprint (when present) or rule ID + file URI + line number (fallback). The human-readable message is excluded so a wording change alone cannot create a duplicate.
  - Notification issue number is defined as a workflow-level `env` variable (`DEVSKIM_NOTIFICATION_ISSUE: "1556"`) and referenced by variable in the API call.
  - Concurrency groups are split: PR events use `devskim-pr-{number}`; main/schedule events use `devskim-alerts-main`. PR scans no longer queue behind report-update runs.
  - Report persistence uses a bot PR (`gh pr create --base main`) instead of a direct `git push origin HEAD:main`. Branch protection on main may not permit direct workflow-token pushes; a bot PR respects those rules without requiring a PAT.
- Split scan and report-update jobs. The pull-request scanning job has `contents: read`; only the trusted main/schedule report job receives `contents: write`, `issues: write`, and `pull-requests: write`.
- Report-only pushes are ignored to avoid redundant scans.
- Existing report entries are never automatically removed. The report covers findings returned by DevSkim scans; it is not claimed to be a complete export of all historical GitHub Code Scanning alerts.

## Spec Kit Artifacts
- Added `spec.md`, `plan.md`, and `tasks.md` under `specs/039-devskim-alert-notifications/` in response to the governance failure described below.
- The full required verification on the updated PR head is still pending; do not mark governance as passing until CI reports the actual result.

## Verification
- **CI run**: [Visual QA #649](https://github.com/davidcollier77-code/Luckypickcanada/actions/runs/39671949413), original revision.
  - Targeted tests: PASS.
  - All unit tests: PASS — 93 tests across 14 files.
  - TypeScript: PASS — `pnpm tsc --noEmit` completed with exit code 0.
  - `./jules-verify.sh`: FAIL — no changed Spec Kit feature artifacts were present in that revision. The required three files have since been added, and a fresh CI run is in progress.
- **Local report-logic simulation**: PASS — one finding appended on first scan; same finding produced zero additions on a repeat scan; a new finding appended while preserving the existing entry. Wording-change-only scenario also confirmed stable.
- **Unit tests**: Added `__tests__/devskim-dedup.test.js` — 4 targeted tests covering first finding, repeated finding, changed wording with same fingerprint, and genuinely new finding. Results pending CI run.
- **Permissions review**: PASS by workflow inspection — the pull-request scan job has read-only contents permission; write permissions are scoped to the separate `main` push / schedule job.
- **Not yet verified**: updated-head Spec Kit check and other CI steps; bot-PR creation end-to-end on first eligible main/schedule run; notification delivery in issue #1556. Those require the pending CI and first eligible run after merge.

## Remaining Issues
- Branch-rule inspection is unavailable through this integration. The workflow now creates a bot PR for report updates instead of pushing directly to main; this respects branch protection without requiring a PAT. The shared `devskim-alerts.md` on main is updated only after the bot PR is reviewed and merged — the workflow does not auto-merge.
- End-to-end bot-PR creation and notification delivery must be confirmed on the first eligible run after merge.
- No merge performed.

## Final Status
- **USEFUL RESULT**: YES — implementation and governance artifacts have been added, but full CI and notification delivery are pending verification.
