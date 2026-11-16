# Feature 172 — Tasks

## Phase P1: Test quality

- [x] T001 Add `test-quality` with four rules (no assertion, tautological
      assertion, un-restored mock, unnamed snapshot) and a suggested fix each.
- [x] T002 Add controlled fixtures proving each rule fires on the defect and is
      silent on its harmless counterpart.
- [x] T003 Publish it as its own sticky comment, scoped to changed test files.

## Phase P2: Security on the PR page

- [x] T004 Summarise open code-scanning alerts (path, line, rule, severity,
      remediation link) instead of leaving them only in the Security tab.
- [x] T005 Grade the summary FAIL for high/critical, WARN otherwise, and report
      an unavailable API without failing.

## Phase P3: Performance

- [x] T006 Add `performance` with three resource-leak rules (interval, listener,
      animation frame) and teardown suggestions.
- [x] T007 Record that a measured runtime budget is deferred: it needs a browser
      baseline this environment cannot produce, and guessed thresholds would
      risk `main`.

## Phase P4: Visual QA summary

- [x] T008 Publish one `workflow_run` summary of the Visual QA checks for the
      head, after the run, without giving the PR workflow write access.
- [x] T009 Label a skipped shard NOT RUN rather than a pass, and link the run.

## Phase P5: Reporting hygiene

- [x] T010 One marker per check, update in place, refuse unmarked or oversized
      bodies, keep the publisher shared and tested.
- [x] T011 Add the workflow hygiene suite: trusted triggers, no PR-head checkout,
      unique markers, advisory publication, least privilege.

## Verification

- [x] T012 Run `test_checker_suite`, the hygiene suite, the full unit suite,
      `tsc --noEmit`, `./freebuff-verify.sh` and measure the build size.
