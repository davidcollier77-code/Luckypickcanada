# Implementation Plan: PR Verification Report Timing

**Branch**: `freebuff/856a686c49f64f37f6ddb027-epr-timing` | **Date**: 2026-11-21 | **Spec**: `specs/201-pr-verification-report-timing/spec.md`

## Summary

The consolidated report is refreshed by `pull_request_target` events and by every `workflow_run` completion, so its first run for a head normally happens before the sibling checks finish. The job read evidence immediately and published the pending snapshot. The audit script already owns a bounded, head-following wait (`--wait-seconds`, `--poll-interval`), and the Verification Integrity workflow already uses it; the report workflow simply never passed the flags.

The correction adds one step to `.github/workflows/pr-verification-report.yml` that runs the same audit with `--wait-seconds 600 --poll-interval 15` before the evidence fetch. The audit, renderer, sticky publication and status gate are unchanged.

## Technical Context

**Language/Version**: Python 3 standard library for the checker; YAML for GitHub Actions; Vitest for the workflow-contract test; Node.js 26.x repository runtime.

**Primary Dependencies**: None added. The workflow reuses `.github/scripts/verify_pr_verification_status.py` and its existing `wait_for_current_head`.

**Storage**: None.

**Testing**: `python3 .github/scripts/test_verify_pr_verification_status.py`, `python3 .github/scripts/test_pr_verification_report.py`, `pnpm exec vitest run __tests__/checker-suite-workflows.test.js`, and `./freebuff-verify.sh` for the repository gate.

**Target Platform**: GitHub Actions on `pull_request_target`, `issue_comment` and `workflow_run`; only the trusted `main` checkout is used.

**Project Type**: Repository CI/QA verification infrastructure and documentation.

**Performance Goals**: At most ten minutes of bounded waiting on an unsettled head; immediate return once the current head's audited checks are settled.

**Constraints**: Do not change the seven categories, their meanings, the four statuses, the exact declarations, or the report's publication and exit-code behaviour. Do not modify `AGENTS.md`, DevSkim configuration, the Playwright shards or any protection gate. Keep the production build strictly below 495 MiB.

**Scale/Scope**: One workflow step, three regression-test additions, two documentation files, one verification-script correction, one Spec Kit feature and the feature pointer.

## Constitution Check

- **Single source of truth**: PASS — `PR_SUBMISSION.md` stays authoritative; both the guide and the template now state the two reading points; `AGENTS.md` is untouched.
- **Verify before acting**: PASS — the audit's existing wait, the Verification Integrity usage and the report workflow were inspected before changing the trigger timing.
- **Protect core systems**: PASS — no application, payment, authentication, hosting, database or secrets configuration changes; protected-file detection and the human gate are unchanged.
- **Resource conservation**: PASS — no new dependency, service or paid usage; the wait reuses one existing script.
- **Development workflow**: PASS — spec, plan and tasks are added; the Spec Kit gate stays active.
- **QA requirements**: PASS — Playwright, DevSkim, the unit suite, type check and build gate are preserved and still reported inside QA Checker.
- **Preservation**: PASS — no visitor-facing behaviour, artwork, animation, audio, layout or data boundary changes.

## Project Structure

```text
.github/workflows/pr-verification-report.yml   # bounded wait before the evidence fetch
.github/scripts/test_verify_pr_verification_status.py  # settling-wait coverage
.github/scripts/test_pr_verification_report.py  # report workflow timing contract
__tests__/checker-suite-workflows.test.js       # workflow hygiene timing contract
PR_SUBMISSION.md                                # two reading points (governance)
.github/pull_request_template.md                # same two reading points
freebuff-verify.sh                              # runs the report contract suite
specs/201-pr-verification-report-timing/{spec,plan,tasks}.md
.specify/feature.json                           # active feature pointer
```

**Structure Decision**: Reuse the existing checker, workflow and Spec Kit layout. No application source, package, asset, API or infrastructure file is required.

## Phase 0 — Research

`verify_pr_verification_status.py` already implements `wait_for_current_head(repo, pr_number, token, timeout_seconds, poll_seconds, *, loader, clock, sleep)`: it re-reads the pull request on every poll, follows a new head, waits while an audited check run is not completed, requires all `REQUIRED_CHECKS` to have been observed (so delayed creation is tolerated), retries transient API errors inside the same deadline, and caps each sleep to the remaining time. `.github/workflows/verification-integrity.yml` already invokes it with `--wait-seconds 600`; `.github/workflows/pr-verification-report.yml` invoked it only in the audit step without the flag, which is why the report could publish a not-yet-settled head.

## Phase 1 — Design

The workflow runs the wait between "Resolve the pull request" and "Fetch pull request, diff, comments and current-head checks". Running it before the evidence fetch is what makes the fetched `pr.json`/`checks.json` describe the settled head; running the audit afterwards keeps the wait non-authoritative. The step is `continue-on-error: true` and captures `wait_status` (0 verified, 1 settled but incomplete, 2 audit error) so a wait failure cannot suppress the real report: the audit, renderer and status gate below still publish and still fail the job when a category is `FAILED` (renderer exit 1) or the report cannot be built (exit 2).

The wait is bounded at 600 seconds against the job's 15-minute timeout. It returns early as soon as the current head's audited checks are settled and all required checks have been observed, so a documentation-only head does not spend the window waiting for a Visual QA run that never applies. A Visual QA run that has been created but has not finished keeps the wait alive; if it never settles, the deadline returns the honest pending audit and the shard's own completion triggers a fresh report.

## Verification and Limitations

Local verification runs both Python checker suites, the focused Vitest workflow-contract suite, `./freebuff-verify.sh` (install, Spec Kit gate, checker suites, TypeScript, production build, refresh-docs), and the production build size. The GitHub-triggered report remains **PENDING — runs after PR creation**; this plan does not claim it ran. The bounded wait is exercised through injected loader/clock/sleep, not against live GitHub, so the live latency of the wait is unverified here.

## Review Repairs

Review findings on the pull request are addressed only when they are in scope for this timing correction; out-of-scope findings are recorded rather than implemented. No finding may weaken the seven categories, the exact declarations or the status gate.
