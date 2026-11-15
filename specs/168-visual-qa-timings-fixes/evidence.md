# Evidence: Visual QA Install Timing Reporter Corrections

**Date**: 2026-11-15
**Branch**: `freebuff/visual-qa-timings-fixes`
**Base**: `main` at `0b12cd86` (merged PR #1917)

## Focused reporter tests

```text
$ python3 -m py_compile .github/scripts/report_visual_qa_install_timings.py .github/scripts/test_report_visual_qa_install_timings.py
py_compile OK

$ PYTHONPATH=.github/scripts python3 -m unittest test_report_visual_qa_install_timings -v
Ran 34 tests in 0.010s

OK
```

New coverage: a skipped miss-only step is a hit only after a successful restore; failed, cancelled,
skipped, conclusion-less and in-progress restore steps all report `unknown`; a successfully executed
miss-only step stays a `miss`; a missing miss-only step is `unknown` and the log supplies the key;
a duplicate restore line cannot replace the first recorded key; pagination with a missing total, a
zero total, a positive total and multiple full pages; an unavailable log leaves `unknown` and still
renders; a corrupt zip raises a clear error and exits 2 through `main()`; invalid JSON keeps the
decoder message and position.

## QA infrastructure suites (same set the Visual QA workflow runs)

```text
$ python3 -m py_compile .github/scripts/check_qa_pr_scope.py .github/scripts/report_visual_qa_install_timings.py \
    .github/scripts/review_pr_changes.py .github/scripts/summarize_devskim_findings.py \
    .github/scripts/verify_pr_verification_status.py
exit 0

$ PYTHONPATH=.github/scripts python3 -m unittest test_check_qa_pr_scope test_report_visual_qa_install_timings \
    test_review_pr_changes test_summarize_devskim_findings test_verify_pr_verification_status
Ran 142 tests in 0.246s
OK

$ python3 -m unittest discover -s .github/scripts -p 'test_suppress_devskim_false_positives.py'
OK (exit 0)
```

## DevSkim

DevSkim CLI 1.0.103 (`Microsoft.CST.DevSkim.CLI`) was installed locally with the dotnet 8 SDK to run
the scanner's own rules; no suppression, rule id filter or repository check was changed.

```text
$ devskim analyze -I /tmp/ds/base -O /tmp/ds/base.sarif -f sarif -x Error   # pre-fix file from 0b12cd86
$ devskim analyze -I .github/scripts/test_report_visual_qa_install_timings.py -O /tmp/ds/new.sarif -f sarif -x Error

baseline: 1 finding(s)
   DS173237 test_report_visual_qa_install_timings.py line 100 | Do not store tokens or keys in source code.
current: 0 finding(s)
```

The 40-character hexadecimal fixture was replaced with `fixture-head-sha-value`; the added
`Head: fixture-` assertion covers the eight-character output formatting. The finding is cleared by
the source change, not by a suppression.

## Visual QA classification

```text
$ printf '%s\n' <changed files> | bash .github/scripts/classify-visual-changes.sh
classify-visual-changes: 10 known non-rendering path(s) reviewed; visual QA is not required.
visual_required=false
```

## Fixture report (PR #1914 timings, output shape unchanged)

```text
$ python3 .github/scripts/report_visual_qa_install_timings.py --fixture-dir /tmp/tmpbzbyj6px 43730539554
Visual QA dependency install timings
Repository: fixture/repository
Run: 43730539554 (attempt 2, success)  https://github.com/example/repo/actions/runs/43730539554
Head: fixture-
Baseline: PR #1914 run 43730539554 (verification 8s, each browser shard 7s)

Job                     Install Baseline  Delta  pnpm store cache                          Chromium cache
Visual QA                    8s       8s     0s  unknown                                   n/a
Visual QA (shard 1/2)        7s       7s     0s  hit (node-cache-Linux-pnpm-abc123)        hit (playwright-chromium-Linux-1.64.1)
Visual QA (shard 2/2)        7s       7s     0s  miss (node-cache-Linux-pnpm-missing)      miss (playwright-chromium-Linux-1.64.1)
```

The table, cold-store note, unknown-state note, baseline line and exit status are unchanged from
PR #1917.

## Full suite and repository gate

```text
$ pnpm run test
Test Files  80 passed (80)
Tests       788 passed (788)
exit 0

$ SPEC_KIT_BASE_REF=0b12cd86 ./freebuff-verify.sh
All Spec Kit task-artifact verifier tests passed.
✅ Spec Kit task artifacts verified and current: specs/168-visual-qa-timings-fixes
✅ All verification steps passed.
exit 0
```

The gate includes the Spec Kit task verification, verification-status integrity tests, AGENTS.md
protection tests, `pnpm install --frozen-lockfile`, `tsc --noEmit`, the production build and the
refresh-docs tests.

Production build: **304,970,368 bytes (290.84 MiB)**, strictly below the 495 MiB cap.

## Limitations

- Live GitHub API mode was not exercised: this workspace has no authenticated `gh` and no token.
  Pagination, unavailable logs, corrupt archives and invalid JSON are covered through patched
  callables and offline fixtures, which is exactly how the reporter branches are reached.
- The DevSkim findings were produced by the official DevSkim CLI on the changed file (plus the
  pre-fix copy) rather than by the GitHub Security upload. The workflow's suppression/reporting
  suites pass locally; the uploaded SARIF result itself is PENDING until the PR runs.
- Playwright and browser checks were not run and are not applicable: the change set is classified
  non-rendering and no application, style or asset file changed.
- PR-triggered checks are PENDING — they run after PR creation.
