# Implementation Plan: Skip-CI Verification Integrity

**Branch**: `freebuff/cef6175f03deca51d10d44c1` | **Date**: 2026-11-07 | **Spec**: [spec.md](spec.md)

**Input**: Implement safeguards against unverified commits containing "[skip ci]"
creating a false impression that a PR has passed verification.

## Selected Task Groups

- `security` — the task is an integrity safeguard: an unverified change must not
  appear verified. The group's evidence-first verification guidance applies to
  the fail-closed design and the false-positive handling of skip detection.
- `troubleshooting` — the feature starts from a failure mode (green checks that
  belong to an earlier commit) and the plan must reproduce that exact state
  before proving the repair.
- `testing` — every rule is verified by executable unit tests and the
  repository verification gate, including the CLI exit codes.

Read `.freebuff/security.md`, `.freebuff/troubleshooting.md`,
`.freebuff/testing.md` and `.docs/manifest.json`. No additional research was
needed beyond the GitHub Actions skip-run semantics, which the implementation
relies on and which the plan records below.

## Summary

Add a read-only audit, `.github/scripts/verify_pr_verification_status.py`, that
reads a pull request's current head, the pull request's commits and the check
runs for that exact head SHA. It classifies every required check as
PASS/FAIL/PENDING/NOT RUN, ignores check runs from earlier SHAs, detects CI-skip
directives on human and automated commits, and reports NOT VERIFIED with NOT RUN
for every check that did not run on the head. Exit code 0 is reserved for a
fully verified current head; exit 1 means NOT VERIFIED; exit 2 means the audit
could not run.

`.github/workflows/verification-integrity.yml` runs the audit on
`pull_request_target`, which GitHub documents as **not** skipped by commit-message
directives (unlike `push`/`pull_request`). It is read-only, never checks out pull
request code, waits a bounded ten minutes for the current head's checks to settle,
writes the evidence to the job summary and fails the check when verification is
not complete.

## Technical Context

**Language/Version**: Python 3 standard library only (matches the existing
`.github/scripts/` PR review pipeline). Tests use `unittest`.

**Primary Dependencies**: none added. `urllib`, `json`, `re`, `argparse` are
stdlib.

**Testing**: `python3 -m unittest discover -s .github/scripts -p 'test_verify_pr_verification_status.py'`,
the same suite wired into `./freebuff-verify.sh`, Vitest/TypeScript and the
production build.

**Target Platform**: GitHub Actions `ubuntu-latest` for the workflow; any local
Python 3 for the audit and tests.

**Project Type**: Next.js repository with a Python pull-request checker pipeline.

**Constraints**:
- Read-only GitHub access; no pull-request code execution in `pull_request_target`.
- No change to existing workflow triggers, conditions, skip behaviour, required
  checks or branch protection.
- Fail closed on missing data, missing token or an unreadable API response.
- Production build below 495 MB.

## Baseline Evidence

- The repository's own history already contains skipped heads, e.g.
  `16588a15 [skip ci] fix(devskim): repair three code review findings`, so the
  scenario is real in this project.
- GitHub documents the five skip strings and the `skip-checks: true` trailer, and
  states that skipped workflows leave their checks pending and that
  `pull_request_target` is not skipped:
  https://docs.github.com/actions/managing-workflow-runs/skipping-workflow-runs
- Before this change, no repository script read a pull request's head SHA or its
  check runs; verification evidence lived only in prose.

## Design

1. **Pure audit core** (`audit_verification`): accepts GitHub REST-shaped `pr`,
   `commits` and `check_runs`. It derives the head SHA from the PR, selects only
   runs whose `head_sha` equals it, records stale runs separately, and builds one
   record per required/conditional check. A record is PASS only for a completed
   `success`; failures are FAIL, incomplete runs PENDING, and everything else
   NOT RUN with a specific reason.
2. **Skip detection** (`detect_skip_ci_directives`): literal, case-insensitive
   matching of the five documented strings plus a `skip-checks: true` trailer
   line, so `[skip city]` and `skip-checks: false` do not match. Applied to every
   commit, with the actor classified as human or automation from GitHub's
   `type`/`[bot]` identity. Only a directive on the head blocks verification;
   earlier directives are reported for transparency.
3. **Current-head binding**: the CLI re-reads the pull request during its bounded
   wait and then loads PR, commits and check runs fresh for the final audit, so a
   commit that lands mid-wait is audited instead of the old head.
4. **Workflow**: one new `Verification Integrity` check on
   `pull_request_target` (`opened`, `synchronize`, `reopened`), minimal
   `contents`/`pull-requests`/`checks` read permissions, per-PR concurrency, and
   no path filters. It exits non-zero when the audit is not VERIFIED.
5. **Local gate**: the new unit suite runs inside `./freebuff-verify.sh` before
   typecheck/build, so the rules cannot regress silently.

## Risks and Mitigations

- **The audit itself could be skipped** → it uses `pull_request_target`, which
  GitHub documents as not affected by skip directives, and a workflow guard test
  asserts that trigger.
- **The audit could run before the other workflows finish** → a bounded wait
  (600 s) polls the current head; an unsettled head is reported PENDING/NOT RUN,
  never PASS.
- **A stale green check could be mistaken for the head** → matching is by exact
  `head_sha`; stale runs are listed as ignored and can never satisfy a check.
- **False-positive skip detection could block legitimate pushes** → detection is
  limited to the documented spellings plus the documented trailer, and only the
  head commit blocks verification; earlier skips are informational.
- **Conditional workflows could be forced to always run** → conditional checks
  are audited and reported NOT RUN but their conditions are untouched.
- **Token leakage** → the token is read from `GH_TOKEN`/`GITHUB_TOKEN`, used only
  in request headers, and never printed.

## Repair Increment (2026-11-07)

The review repairs stay inside the audit core and its tests; no workflow,
application, dependency, secret or `.docs/` change is involved.

| Finding | Verdict against the code | Repair |
| --- | --- | --- |
| Empty `head_sha` matched `""` runs (Amazon Q) | Valid | `audit_verification` only selects head runs when the head SHA is non-empty; otherwise every run is stale/ignored. |
| Empty `head_sha` built `/commits//check-runs` (Amazon Q) | Already safe after the previous repair; kept explicit | `load_live` raises before fetching commits or check runs when the head SHA is empty; a test asserts no check-run request is made. |
| Transient API errors aborted the wait (Amazon Q) | Valid | New `TransientApiError` for HTTP 5xx, network and invalid-JSON failures, retried by `wait_for_current_head` inside the same deadline. HTTP 4xx and missing-head errors still fail immediately. |
| Id-less runs bypassed deduplication (Graphite) | Valid | `_run_identity` deduplicates by numeric id when present, otherwise by a stable tuple of name, SHA, status, conclusion and timestamps. Identical partial records collapse; distinct runs are kept. |
| Wait could pass its deadline (Graphite) | Partly valid: the second guard was reachable, but the uncapped sleep could overshoot | The loop computes the remaining budget before sleeping and caps the sleep to it; the deadline guard is evaluated before any sleep. |

`wait_for_current_head` accepts injectable `loader`, `clock` and `sleep`
keywords so retry and deadline behaviour is proven deterministically instead of
by real sleeping. The `_fixture` helper keeps the temporary-directory cleanup
added by the earlier repair, now with the missing `shutil` import.

## Verification Plan

Run the new unit suite; run `./freebuff-verify.sh` with
`SPEC_KIT_BASE_REF=<task base>` (includes the unit suite, Spec Kit gate,
TypeScript, production build, refresh-docs tests); measure `.next + public`
against the 495 MB cap; audit the complete final diff; report live workflow
execution as NOT RUN because a `pull_request_target` workflow cannot run for the
pull request that adds it.
