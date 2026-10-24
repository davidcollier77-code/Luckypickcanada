# Implementation Plan: DevSkim Self-Test False-Positive Filtering

**Branch**: `fix/devskim-self-suppression-20261024` | **Date**: 2026-10-24 | **Spec**: [spec.md](spec.md)

## Summary
The current report entries point to two DevSkim helper/test files. The source resolver rejects those paths before the existing DS137138/DS162092 fixture predicate can execute. Allow only the two exact files for safe source inspection, scope those two rule IDs to the new exception, and regression-test SARIF filtering. Clear the report entries only after current-head verification.

## Technical Context
- **Language**: Python 3; standard library only.
- **Runtime**: GitHub Actions on Ubuntu.
- **Tests**: Python compile check, the existing unittest suite, and required repository CI.
- **Scope**: Two Python helper files, the alert ledger, task artifacts, PR summary, and active context.
- **Constraints**: No dependencies, app changes, deployments, secret changes, global rule disables, or broad scan exclusions. Preserve all existing behavior and allowlists outside the exact exception.

## Constitution Check
- PASS — `AGENTS.md` is authoritative and only the `security` task group is selected.
- PASS — the cause is verified in `resolve_safe_artifact_uri` and `process_sarif`.
- PASS — `.docs/` remains read-only; no additional MCP or Context7 call is required.
- PASS — no protected application or deployment systems are changed.

## Design
1. Add `DEVSKIM_SELF_TEST_FILES` with only the suppressor and its test file.
2. Let the safe resolver inspect those exact paths.
3. Apply the exception only to DS137138 and DS162092. Other IDs and unlisted paths retain current checks.
4. Add an integration test through `suppress_sarif`: remove four synthetic expected cases but keep controls for another file and another rule.
5. Require focused tests and the live PR DevSkim check before removing the 12 ledger rows. Preserve the report title, explanation, and append marker.
6. Update the canonical summary with actual checks and limitations.

## Project Structure
```text
.github/scripts/suppress_devskim_false_positives.py
.github/scripts/test_suppress_devskim_false_positives.py
devskim-alerts.md
pr_summary.md
memory-bank/activeContext.md
specs/045-devskim-self-suppression/{spec.md,plan.md,tasks.md}
```

## Verification
Run the Python syntax and unit-test checks in CI, review the DevSkim result on the current PR head, run `./jules-verify.sh` and required gates, inspect the full final diff twice, and confirm no finding row remains in the reconciled report. Local repository cloning is unavailable in this session because the connected shell cannot resolve GitHub; local success will not be claimed. Any build-size report must remain below the 495 MiB cap.
