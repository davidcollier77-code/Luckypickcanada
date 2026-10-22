# DevSkim Remediation Tasks

## Review and Specification
- [x] Read repository governance and relevant security-task instructions.
- [x] Inspect the current PR branch, changed files, complete review threads, and route/configuration involved.
- [x] Specify the false-positive suppression safety requirements.
- [x] Plan the minimal implementation and regression checks.

## Implementation
- [x] Restrict DS173237 to an explicit allowlist of safe metadata keys and complete SHA/UUID values.
- [x] Tie suppression to the finding's field/range; decline ambiguous snippets.
- [x] Validate and confine SARIF artifact paths before fallback reads.
- [x] Rewrite SARIF atomically and ensure a failed suppression does not block raw SARIF upload.
- [x] Add regression tests for positive and negative matcher/path cases, including SARIF-slice mismatch and broad column ranges.
- [x] Remove unnecessary workflow `sudo`.
- [x] Make the payment-link source matcher readable and accurately document its scope.
- [x] Validate provided webhook account identifiers without requiring an undeclared secret.
- [x] Restore `.specify/feature.json` to the base-branch version.
- [x] Reconcile `PR_SUMMARY.md` with reviewed scope and actual verification evidence.

## Verification and Final Review
- [x] Focused Python regression suite: 20 tests passed in DevSkim run 39754297210.
- [x] Full unit tests, TypeScript, and `./jules-verify.sh`: passed in Visual QA run 39754297284 through the governance step.
- [x] Next.js build, 495 MiB gate, OpenNext build, and Wrangler build validation: passed in run 39754297256. Measured `.next + public`: 325,625,571 bytes (310.54 MiB).
- [x] Jules bridge Wrangler dry-run: passed in run 39754297224; deployment skipped for the pull request.
- [x] Review current changed files and current security scan results; no new DevSkim review comments were created by the latest scan.
- [x] Report pending checks honestly. The Playwright visual-regression step remains in progress and is not claimed as a pass.
- [x] Leave PR #1558 open and unmerged.
