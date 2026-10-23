# Implementation Plan: Restore CodeQL Python Analysis

**Branch**: `fix/codeql-python-syntax-repair-20261023` | **Date**: 2026-10-23 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification in `specs/043-codeql-python-syntax-repair/spec.md`

## Summary

Repair the malformed checksum-metadata conditional in the Python DevSkim suppression helper. Move the source-line extraction to the existing `snippet` assignment, restore the branch's `justification = (...)` body, and add a fail-fast Python compile step to the DevSkim workflow. Do not change the suppression predicates or their allowlists.

## Technical Context

- **Language/Version**: Python 3; GitHub Actions YAML.
- **Primary Dependencies**: Python standard library only; GitHub-hosted Actions runner.
- **Storage**: N/A.
- **Testing**: `python3 -m py_compile` and existing `unittest` regression suite.
- **Target Platform**: Ubuntu runner for DevSkim CI; CodeQL Python analysis.
- **Project Type**: Security scanning helper and CI workflow.
- **Performance Goals**: Negligible added runtime (syntax compilation only).
- **Constraints**: Avoid weakening security controls or modifying application behavior. Keep allowlisted paths and justifications unchanged.

## Constitution Check

- **Single source of truth**: Followed `AGENTS.md` and existing helper/workflow behavior.
- **Verify before acting**: The CodeQL screen and current source were inspected; exact malformed block was verified.
- **Protect core systems**: No runtime API, auth, payment, database, deployment, or secrets changes.
- **Resource conservation**: No dependencies or build tooling added.
- **Scope gate**: Only the suppression helper and its directly related DevSkim workflow are implementation files. Task artifacts and canonical PR summary document the work.

## Design Decisions

1. Replace the initial `_source_line_for_region(region, safe_path)` call with `_source_line_from_text(source_text, region)`, using the already loaded file text.
2. Restore the existing checksum metadata finding explanation as the body of the checksum conditional.
3. Run `python3 -m py_compile` in a dedicated non-tolerated workflow step before the unittest step, because the current unittest and suppression steps use `continue-on-error` and should not be the only syntax guard.

## Files

- `.github/scripts/suppress_devskim_false_positives.py`
- `.github/workflows/devskim.yml`
- `.github/scripts/test_suppress_devskim_false_positives.py` (existing regression coverage to run; not modified)
- `specs/043-codeql-python-syntax-repair/spec.md`
- `specs/043-codeql-python-syntax-repair/plan.md`
- `specs/043-codeql-python-syntax-repair/tasks.md`
