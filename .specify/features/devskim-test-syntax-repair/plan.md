# Implementation Plan: DevSkim Regression Test Syntax Repair

## Scope
Correct only the two malformed string literals in `.github/scripts/test_suppress_devskim_false_positives.py`; keep the existing scanner, suppression logic, workflow permissions, triggers, and report-update guard unchanged.

## Steps
1. Replace each split/unterminated fixture-write string with a valid `source_line + "\\n"` argument and explicit UTF-8 encoding.
2. Run Python syntax compilation and the focused unit test suite where a repository shell is available.
3. Use the resulting GitHub Actions run to verify the filter and report pipeline.
4. Inspect the full diff, check the two replacements, and ensure no suppression rules changed.

## Risk and rollback
Low risk: test-fixture syntax only. If tests reveal unrelated or substantive failures after import succeeds, do not weaken tests or widen suppressions; record the failing assertions and repair only in-scope defects.
