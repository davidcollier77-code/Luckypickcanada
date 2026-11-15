# Implementation Plan: Visual QA Install Timing Reporter Corrections

**Feature**: `168-visual-qa-timings-fixes` | **Date**: 2026-11-15 | **Spec**: [spec.md](spec.md)

## Selected Task Groups

- `testing` — offline regression tests for every corrected behaviour.
- `ci` — GitHub Actions job pagination, cache restore-step semantics and log retrieval.
- `security` — DevSkim fixture finding and read-only API/token handling review.

Consulted `.docs/manifest.json` groups `testing` and `ci`. The reporter's behaviour was
verified against `.github/workflows/visual-qa.yml` (step names, cache steps, the QA
`py_compile`/unittest step) and the DevSkim workflow and suppression scripts. `.docs/` was not
modified.

## Summary

Correct six confirmed defects in `.github/scripts/report_visual_qa_install_timings.py` without
changing its output shape, baseline, read-only behaviour, token handling or fixture mode:

1. Chromium hits require a successfully completed restore step.
2. Job pagination no longer stops after a full page when `total_count` is missing or zero.
3. Log retrieval and decoding are separated so corrupt archives fail visibly.
4. Cache parsing keeps the first recorded state for each family.
5. The DevSkim-flagged hexadecimal fixture identifier becomes a harmless dummy.
6. `api_json()` keeps the JSON decoder's diagnostic detail.

The QA workflow already compiles the reporter and runs its focused suite, so no workflow change is
required. All coverage stays offline through fixtures and patched callables.

## Technical Context

**Language/Version**: Python 3 standard library; GitHub REST API.

**Primary Dependencies**: none added. `unittest.mock` is used in tests.

**Storage**: none. Read-only API access only.

**Testing**: `.github/scripts/test_report_visual_qa_install_timings.py` (unittest, offline).

**Constraints**: No workflow, dependency, cache-key, install, Chromium-provisioning, classifier or
baseline change; no token exposure; no network in unit tests.

## Design

### Chromium classification

`chromium_state_from_steps()` reads the `Restore cached Playwright Chromium` step first. No restore
step means `n/a` (the verification job). A restore step that is not `completed`, or whose
conclusion is not `success`, returns `unknown` before the miss-only step is examined. Only then do
the existing miss-step rules apply: `skipped` → `hit`, `success` → `miss`, anything else or an
absent step → `unknown`. `build_row()` therefore falls back to the log-derived state when the step
evidence is inconclusive, and a missing miss-only step keeps the log fallback working.

### Pagination

`load_live()` stops on a page shorter than 100 jobs. A full page only ends pagination when a
positive `total_count` has been reached; a missing, zero or non-integer total is treated as zero and
requests the next page.

### Log retrieval and decoding

`api_bytes()` stays inside the "unavailable log" guard, so a failed request leaves the cache
details `unknown`. `decode_log()` moves outside that guard: its existing corrupt-archive
`ReportError` now propagates through `load_live()` to `main()`, which prints
`VISUAL QA TIMINGS ERROR: ...` and exits 2.

### First recorded cache state

Both the hit and miss branches of `parse_cache_states()` only record a state while that family is
still `unknown`, so a later duplicate restore line cannot replace the key that was actually
restored.

### Error detail

`api_json()` catches `UnicodeDecodeError` and `JSONDecodeError`, and reports the API path plus the
decoder message and line/column position.

### Test fixture identifier

`head_sha` becomes `fixture-head-sha-value`. The report only ever shows its first eight characters,
so an added assertion on `Head: fixture-` preserves that formatting coverage without a
credential-like hexadecimal value.

### Deliberately unchanged

No Visual QA job, step name, install command, cache key, Playwright provisioning, classifier,
baseline value, CLI flag, output layout or application code is modified.

## Verification Plan

1. `python3 -m py_compile` for both Python files.
2. `PYTHONPATH=.github/scripts python3 -m unittest test_report_visual_qa_install_timings -v`.
3. Other QA infrastructure checker suites and the Visual QA classifier guard test.
4. `pnpm run test`, `pnpm exec tsc --noEmit`, `SPEC_KIT_BASE_REF=main ./freebuff-verify.sh` with the
   measured production build size.
5. DevSkim scan of the changed test file with a locally installed DevSkim CLI, plus the DevSkim
   suppression/reporting suites.
6. Record results and limitations in `evidence.md`.
