# Implementation Plan: DevSkim Source-Span Precision

**Branch**: fix/devskim-source-span-precision-20261024 | **Date**: 2026-10-24 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification in specs/047-devskim-source-span-precision/spec.md

## Summary

Make the existing DevSkim false-positive filter location-aware. Contextual suppressions will require the reported SARIF coordinates to identify the exact reviewed token or safe expression in the current source, rather than accepting a harmless pattern merely because it appears elsewhere on the same line. The lockfile package-name exception will also require the finding span to fall within the allowlisted package identifier. All unknown or ambiguous findings remain reportable.

## Technical Context

**Language/Version**: Python 3 (standard-library-only helper and unittest suite).

**Primary Dependencies**: Existing DevSkim Action v1.0.16, SARIF, GitHub Code Scanning upload action, Python standard library; no dependency changes.

**Storage**: Repository source and transient devskim-alerts.sarif; no persistent runtime store.

**Testing**: Python unittest discovery, Python syntax check, ./jules-verify.sh, DevSkim workflow, CodeQL, PR validation and existing remote CI gates. Tests use synthetic SARIF and local temporary files.

**Target Platform**: GitHub Actions Ubuntu runner; repository-wide DevSkim scan.

**Project Type**: Security-scanning workflow and Python SARIF filter.

**Performance Goals**: No network calls or significant additional scanning work; match a small number of regular expressions per reported finding.

**Constraints**:
- Do not disable DevSkim rules, reduce scanned paths, alter scanner triggers, or weaken validation.
- Do not suppress a contextual finding without valid source coordinates and exact source-context agreement.
- Keep the existing reviewed path/rule allowlist and exact justifications; no blanket suppression.
- Preserve raw SARIF upload/artifact behavior on failure and the report-failure guard from PR #1589.
- Keep .docs/ read-only; do not change application source, APIs, deployment, secrets, or dependencies.

**Scale/Scope**: Two scanner implementation/test files plus spec.md, plan.md, tasks.md, the required specification checklist, and canonical PR summary.

## Constitution Check

- **Single source of truth**: Pass; AGENTS.md is authoritative.
- **Verify before acting**: Pass; current helper, regression suite, workflow, prior PR #1576, merged PR #1588, merged PR #1589, raw historical SARIF, and current filtered SARIF were inspected.
- **Protected systems**: Pass; no application runtime, authentication, API, secret, deployment, or Cloudflare settings are changed. Only the explicitly authorized repository security-scanner helper and its tests are in scope.
- **False-positive safety**: Pass by design; exact source span validation is required; missing coordinates remain visible for contextual rules.
- **Resources**: Pass; standard library only, and .docs/ remains read-only.
- **Verification**: Remote CI is the authoritative repository-wide verification because the connected GitHub interface does not provide a mounted full repository worktree for ./jules-verify.sh.

## Design Decisions

1. Prefer DevSkim's absolute `charOffset`/`charLength` span when present, and require it to match the exact source snippet and calculated start/end lines. Use strict columns only for synthetic fixtures without absolute-offset fields. This is necessary because reviewed historical DevSkim SARIF columns were sometimes one character early even when the absolute offset correctly identified the token.
2. For DS172411, require the finding to begin at the actual setTimeout or test timeout call, and retain the existing safe-callback / test-timeout checks. A string callback, opaque callback, wrong token, or missing start column remains visible.
3. For DS162092 and DS137138, require the reported source text to match the known loopback / development-origin or test-fixture token, in the exact reviewed file and existing context.
4. For DS610000, require the reported range to be inside the known static regex text in the security test, alongside its existing comment and file checks.
5. For the public Cloudflare account ID and allowlisted lockfile package names, validate that the absolute span and snippet overlap only the exact ID literal or package identifier; do not infer safety from another token on the same line. Use the same absolute-span validation for SHA-512 integrity fragments.
6. Keep existing justifications, remove_verified_false_positive_results, scan coverage, workflow behavior, and negative-control philosophy unchanged.
7. Add positive and negative tests, including a same-line unrelated expression, incorrect token columns, and missing coordinates. Do not add an exemption for any new rule or file.

## Project Structure

### Documentation (this feature)

- specs/047-devskim-source-span-precision/spec.md
- specs/047-devskim-source-span-precision/plan.md
- specs/047-devskim-source-span-precision/tasks.md
- specs/047-devskim-source-span-precision/checklists/requirements.md
- specs/047-devskim-source-span-precision/pr_summary.md

### Source Code

- .github/scripts/suppress_devskim_false_positives.py — exact source-span checks.
- .github/scripts/test_suppress_devskim_false_positives.py — positive/negative SARIF regressions.
- .github/workflows/devskim.yml — unchanged; verifies helper and regression tests and uploads scan results.

No separate research, data model, API contract, or quickstart is needed for this narrowly scoped filter change.

## Verification Status at Planning

- **PASS — source inspection**: Historical raw SARIF records contain source coordinates; safe examples were checked against those actual region shapes.
- **DONE (implementation committed on branch)**: Added source-coordinate checks for reviewed timer callbacks, test loopback fixtures, allowlisted localhost origins, the static security-test regex, the public Cloudflare account literal, and allowlisted lockfile package-name matches. Added positive/negative tests including wrong-span, missing-column, truncated-range, and same-line unrelated-expression cases.
- **PENDING / NOT RUN LOCALLY**: This interface does not provide a mounted repository worktree; let the DevSkim PR workflow run its Python syntax and unittest checks.
- **PENDING**: Observe current-head remote CI, including DevSkim suppression count and uploaded SARIF, CodeQL, ./jules-verify.sh, and PR summary validation. No result is claimed until observed.
- **NOT RUN HERE**: Production build and visual QA are unrelated to scanner-only changes; no application/build files are changed.
