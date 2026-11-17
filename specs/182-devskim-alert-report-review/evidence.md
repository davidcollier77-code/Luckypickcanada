# Evidence: DevSkim Alert Report Review and Cleanup

**Date**: 2026-11-17
**Branch**: `freebuff/c3e3aea4b5256eb42e63e937`
**Base**: `main` at `44b2b3b787b2beffb8ab834e004c7c4da59dde67`
**Scanner**: DevSkim CLI `1.0.103+7f8e5e24f6` (`Microsoft.CST.DevSkim.CLI`)

## Current-head scan

Installed the same release line used by the repository workflow with the .NET 8 SDK, then scanned each affected file at HEAD:

```text
$ devskim --version
devskim 1.0.103+7f8e5e24f6

$ devskim analyze -I .github/scripts/test_check_qa_pr_scope.py -O /tmp/ds/test_check_qa_pr_scope.py.sarif -f sarif
$ devskim analyze -I .github/scripts/test_review_pr_changes.py -O /tmp/ds/test_review_pr_changes.py.sarif -f sarif
$ devskim analyze -I .github/scripts/review_pr_changes.py -O /tmp/ds/review_pr_changes.py.sarif -f sarif
$ devskim analyze -I .github/scripts/test_report_visual_qa_install_timings.py -O /tmp/ds/test_report_visual_qa_install_timings.py.sarif -f sarif
```

Parsed results:

```text
test_check_qa_pr_scope.py: 2 finding(s)
  DS176209 line 415 level note | Suspicious comment | 'TODO'
  DS176209 line 161 level note | Suspicious comment | 'TODO'
test_review_pr_changes.py: 1 finding(s)
  DS162092 line 140 level note | Do not leave debug code in production | 'localhost'
review_pr_changes.py: 2 finding(s)
  DS162092 line 570 level note | Do not leave debug code in production | '127.0.0.1'
  DS162092 line 569 level note | Do not leave debug code in production | 'localhost'
test_report_visual_qa_install_timings.py: 0 finding(s)
```

## Pre-fix reproduction for DS173237

```text
$ git show 0b12cd86:.github/scripts/test_report_visual_qa_install_timings.py > /tmp/ds/old_timings.py
$ devskim analyze -I /tmp/ds/old_timings.py -O /tmp/ds/old_timings.sarif -f sarif

old_timings.py: 1 finding(s)
  DS173237 line 100 level error | Do not store tokens or keys in source code. | '"6027091ad6c3171ff7329c82a3aa623e17822726"'
```

The current file contains `"head_sha": "fixture-head-sha-value"` at line 155 and scans with zero findings, confirming the PR #1920 remediation rather than a suppression.

## Production filter replay

The six current results were combined into `devskim-alerts.sarif` and passed through the repository's production filter:

```text
$ python3 .github/scripts/suppress_devskim_false_positives.py
Suppressed 0 verified false positives in SARIF.
filter exit=0
remaining after production filter: 6
  DS162092 review_pr_changes.py 570
  DS162092 review_pr_changes.py 569
  DS176209 test_check_qa_pr_scope.py 415
  DS176209 test_check_qa_pr_scope.py 161
  DS162092 test_review_pr_changes.py 140
```

No audited suppression covered these locations, so the report cleanup does not alter what the Security-tab upload contains, and the five live findings will be appended again by the next scheduled scan unless an exact-span suppression is approved.

## Git-history evidence for the stale identities

```text
$ git log --format='%h %ad %s' --date=iso -S'<each devskim-id>' -- devskim-alerts.md
77c18907 2026-11-16 02:47:10 -0400 chore: record new DevSkim alerts (automated) (#1903)   # all ten ids

$ git log --format='%h %ad %s' --date=iso -1 bc6f2016
bc6f2016 2026-11-16 02:28:29 -0400 Improve QA checker evidence, defect coverage and browser reliability (#1925)
```

Per-revision token locations:

```text
test_check_qa_pr_scope.py
  2e7cd054 (2026-11-14): TODO at line 123
  e5b86a99 (2026-11-14): TODO at line 160
  c688e0fd/HEAD (2026-11-15): TODO at lines 161 and 415

review_pr_changes.py
  e5b86a99 (2026-11-14, 551 lines): "localhost" 313, "127.0.0.1" 314
  bc6f2016/HEAD (2026-11-16, 1119 lines): "localhost" 569, "127.0.0.1" 570

test_review_pr_changes.py
  e5b86a99: localhost fixture at line 133
  bc6f2016/HEAD: localhost fixture at line 140

test_report_visual_qa_install_timings.py
  0b12cd86: 40-hex head_sha at line 100
  b47dbd49/HEAD: "fixture-head-sha-value" at line 155
```

## Repository checks

```text
$ PYTHONPATH=.github/scripts python3 -m unittest test_check_qa_pr_scope test_review_pr_changes \
    test_summarize_devskim_findings test_verify_pr_verification_status
Ran 149 tests in 0.327s
OK
exit 0

$ python3 -m unittest discover -s .github/scripts -p 'test_suppress_devskim_false_positives.py'
Ran 100 tests in 0.114s
OK
exit 0

$ SPEC_KIT_BASE_REF=44b2b3b7 ./freebuff-verify.sh
All Spec Kit task-artifact verifier tests passed.
✅ Verified changed artifact: specs/182-devskim-alert-report-review/spec.md
✅ Verified changed artifact: specs/182-devskim-alert-report-review/plan.md
✅ Verified changed artifact: specs/182-devskim-alert-report-review/tasks.md
--- Running Type Check ---
--- Running Build Check ---
✓ Compiled successfully in 13.0s
Tests complete: 48 passed, 0 failed.
✅ All verification steps passed.
exit 0

$ git diff --check
exit 0
```

Production build measurement (`.next` + `public`):

```text
$ du -sb .next public
308888587   .next
35310384    public
total: 344,198,971 bytes = 328.25 MiB
```

The measured size is strictly below the 495 MiB cap.

## Limitations

- The GitHub Actions DevSkim and PR-triggered checks have not run yet; they are PENDING until the pull request exists. The local CLI is the same release line but is not the workflow action itself.
- Removing the five live false positives without a suppression means the next scheduled scan can append them again. A durable exact-span suppression is proposed in `triage.md` and deliberately not implemented without owner approval.
- No browser or visual check was run: the change set is documentation/tooling only and is classified non-rendering. No application runtime behaviour was modified.
- GitHub code-scanning alert states were not retrieved or dismissed; this task reconciles the shared report, not individual alert lifecycle records.
