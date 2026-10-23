# Implementation Plan: Restore CodeQL Python Analysis

**Branch**: `fix/codeql-python-syntax-repair-20261023` | **Date**: 2026-10-23 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification in `specs/043-codeql-python-syntax-repair/spec.md`

## Summary

Repair the malformed checksum-metadata conditional, preserve its suppression behavior, and add a hard-failing Python syntax guard that retains raw SARIF upload on failure. During PR validation, also correct the incompatible Vitest helper and update Next.js to v16.4.3, which fixes the observed extensionless Google Fonts URL parsing failure. Preserve all existing font definitions and visual output.

## Technical Context

- **Language/Version**: Python 3; GitHub Actions YAML; Next.js 16.4.3; Vitest 5.0.0.
- **Primary Dependencies**: Python standard library; Next.js 16.4.3; Vitest 5.0.0; pnpm 10.30.3.
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
3. Keep python3 -m py_compile as a hard-failing workflow step, but use always() on the SARIF upload and fallback warning so syntax failure does not hide raw findings.
4. Replace the unsupported vi.runAllMicrotasksAsync() call with vi.waitFor() without changing the polling behavior covered by the regression test.
5. Upgrade Next.js from 16.4.1 to 16.4.3, which explicitly fixes extensionless Google font URLs in both bundlers. Update the Next/@next lock entries and exact integrity values; leave app/fonts.js unchanged.
6. Remove _source_line_for_region, which has no call sites after switching to _source_line_from_text.

## Files

- `.github/scripts/suppress_devskim_false_positives.py`
- `.github/workflows/devskim.yml`
- `__tests__/lucky-map-refresh.test.jsx`
- `package.json` and `pnpm-lock.yaml` (Next.js patch update only)
- `.github/scripts/test_suppress_devskim_false_positives.py` (existing regression coverage to run; not modified)
- `specs/043-codeql-python-syntax-repair/spec.md`
- `specs/043-codeql-python-syntax-repair/plan.md`
- `specs/043-codeql-python-syntax-repair/tasks.md`


## Follow-up findings and sources

- **VERIFIED:** Visual QA failed at `__tests__/lucky-map-refresh.test.jsx:53` because `vi.runAllMicrotasksAsync` is not available in the installed Vitest version. Replace it with the supported `vi.waitFor()` assertion. Source: https://vitest.dev/api/vi.
- **VERIFIED:** OpenNext validation failed in the Next.js Google font loader while processing `app/fonts.js`. Next.js v16.4.3 release notes list “Fix extensionless Google font URLs in both bundlers”: https://github.com/vercel/next.js/releases/tag/v16.4.3.
- **VERIFIED:** Amazon Q reported that a hard syntax-gate failure could skip SARIF upload. Make upload and the fallback warning run even after validation failures while preserving the failing syntax gate.
