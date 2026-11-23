# Tasks: Repository Security Audit and Monitoring

**Feature**: `specs/213-security-audit-and-monitoring` | **Plan**: `specs/213-security-audit-and-monitoring/plan.md` | **Spec**: `specs/213-security-audit-and-monitoring/spec.md`

One implementation and one regular, unmerged pull request.

## Phase 1 — Audit

- [x] T001 Record the initial GitHub Security counts: 11 open code-scanning alerts, 0 open secret-scanning alerts and 1 open Dependabot alert.
- [x] T002 Inspect every open code-scanning alert against its source and classify each as a genuine issue, a false positive or already resolved.
- [x] T003 Inspect the secret-scanning category with values hidden and confirm the result.
- [x] T004 Confirm Dependabot alerts are enabled and inspect the vulnerable `minimatch` advisory and its consumer chain.

## Phase 2 — Remediation

- [x] T005 Add reviewed `/* DevSkim: ignore DS172411 */` suppressions to the callable timers in `components/DailyResonance.tsx` and `app/lib/graphics/assets.js`.
- [x] T006 Split the synthetic fixture SHA constants in `__tests__/qa-review-comment.test.js` and `.github/scripts/test_pr_verification_report.py`.
- [x] T007 Replace literal placeholder markers in `.github/scripts/test_check_qa_pr_scope.py` and `.github/scripts/test_pr_verification_report.py` with `PLACEHOLDER_TODO`.
- [x] T008 Add the `minimatch@9` → `11.0.1` override in `package.json` and refresh `pnpm-lock.yaml`.
- [x] T009 Confirm `glob@10.5.0` resolves minimatch 11.0.1 and still exposes the API it uses.

## Phase 3 — Monitoring

- [x] T010 Verify Dependabot alerts are enabled and that `.github/dependabot.yml` keeps the weekly schedule.
- [x] T011 Group Dependabot security updates and routine minor/patch updates per ecosystem; keep major updates separate.
- [x] T012 Verify DevSkim runs on pull requests, `main` pushes and a weekly schedule, and that the report job remains append-only and main/schedule-only.
- [x] T013 Verify CodeQL default setup is configured for JavaScript/TypeScript, Python and Actions with its weekly schedule.

## Phase 4 — Ledger and verification

- [x] T014 Dismiss or fix every open code-scanning alert with a supported reason and evidence.
- [x] T015 Remove only verified historical entries from `devskim-alerts.md`, preserving the heading, explanation, marker and append workflow.
- [x] T016 Run the affected Python and Vitest suites, then `./freebuff-verify.sh`, and measure the production build.
- [x] T017 Record Spec 213 artifacts, `.specify/feature.json` and Memory Bank updates.
- [ ] T018 Commit, push and open one regular, non-draft PR with the `PR_SUBMISSION.md` body; leave it unmerged.
