# Feature Specification: DevSkim Regression Test Syntax Repair

**Feature Branch**: `fix/devskim-test-syntax`
**Status**: In progress
**Task Group**: security — repairs the CI security-scanning pipeline's suppression regression suite without changing scan rules.

## Problem
GitHub Actions DevSkim runs on the current main revision repeatedly fail at the `Test DevSkim suppression filter` step. The test module cannot be imported because two `write_text` calls contain unterminated string literals. The scanner itself and SARIF upload succeed, but the suppressor and report-update job do not run.

## Requirements
- Restore valid Python syntax in both affected lockfile fixture writes.
- Keep the intended newline terminator and UTF-8 encoding explicit.
- Do not modify suppression rules, scan coverage, exclusions, SARIF upload behavior, application code, dependencies, secrets, or deployment settings.
- Preserve fail-safe behavior: tests must pass before suppression and Markdown report updates are allowed.

## Acceptance Criteria
1. The regression test module passes Python syntax compilation.
2. The complete suppression unit test suite passes.
3. A fresh DevSkim workflow completes its suppression/filter stage; SARIF and artifact uploads still work.
4. The workflow's report-update job is no longer skipped because of this test syntax error.
5. No security suppression is broadened and no unrelated behavior is changed.

## Evidence at discovery
- DevSkim runs #246, #247, #248, and #249 all fail at `Test DevSkim suppression filter`.
- Latest failing run: https://github.com/davidcollier77-code/Luckypickcanada/actions/runs/40183792859
- Error: `SyntaxError: unterminated string literal` in `.github/scripts/test_suppress_devskim_false_positives.py` at line 207; the same malformed pattern occurs in a second fixture-write call.
