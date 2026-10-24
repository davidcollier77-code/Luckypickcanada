# Implementation Plan: DevSkim Report Failure Guard

**Branch**: `fix/devskim-report-failure-guard-20261024` | **Date**: 2026-10-24 | **Spec**: [spec.md](spec.md)

## Summary

Remove `continue-on-error` from the suppression tests and suppression step so failures mark the `lint` job as failed. Preserve the existing `always()` SARIF and artifact uploads for visibility. Because `update-report` requires `needs: lint` and does not use `always()`, it will be skipped on a suppression failure. Add regression tests for that workflow contract.

## Technical Context

- **Language/configuration**: YAML (GitHub Actions) and Python 3 unittest regression tests.
- **Runtime**: GitHub Actions on Ubuntu.
- **Affected paths**: `.github/workflows/devskim.yml`, `.github/scripts/test_suppress_devskim_false_positives.py`, and task-scoped Spec Kit/summary files.
- **Verification**: Python syntax and focused unittest suite via PR CI; required repository gates via `./jules-verify.sh` and applicable CI workflows.
- **Environment limitation**: This shell cannot resolve `github.com`, so no local clone or local test execution is available. Do not claim local commands passed; use current-head GitHub Actions as verification evidence.

## Constitution Check

- PASS — `AGENTS.md` was read first; only the Security task group is selected.
- PASS — The failure path is verified from historical run logs and report-notification records.
- PASS — The change is limited to workflow failure propagation and regression coverage.
- PASS — `.docs/` remains read-only, and `.specify/extensions.yml` was not found.
- PASS — Raw scan upload remains available on failure; no finding rule is disabled and no app/deployment system is changed.

## Design

1. Make the suppression test and filter steps fail the `lint` job if they fail by removing their `continue-on-error` settings.
2. Keep `if: always()` on raw SARIF upload and artifact upload to preserve scan evidence.
3. Keep the report job's `needs: lint` dependency and success-only conditional path. With a failed lint job, the append-only ledger updater is skipped.
4. Add regression tests that assert both suppression steps propagate failure, the report job does not override dependency failure, and raw uploads remain available.
5. Do not change the existing finding allowlists or the report contents; the current ledger is already empty.

## Project Structure

```text
.github/workflows/devskim.yml
.github/scripts/test_suppress_devskim_false_positives.py
devskim-alerts.md (read-only in this task; already zero rows)
pr_summary.md
memory-bank/activeContext.md
specs/046-devskim-report-failure-guard/{spec.md,plan.md,tasks.md}
```

## Verification

- Run `python3 -m py_compile .github/scripts/suppress_devskim_false_positives.py`.
- Run `python3 -m unittest discover -s .github/scripts -p 'test_suppress_devskim_false_positives.py'`.
- Inspect the DevSkim PR workflow and verify failure/skip behavior on the final PR head.
- Run `./jules-verify.sh` and all applicable required PR checks; report actual results only.
- Inspect the complete final diff; confirm no deployment change and no edits to allowlists or `devskim-alerts.md`.
