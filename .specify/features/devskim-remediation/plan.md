# Implementation Plan: Trustworthy DevSkim Findings

**Branch**: `jules-6324508496259981099-e3abaa85-8989833840928023399` | **Date**: 2026-10-22 | **Spec**: [spec.md](spec.md)

**Input**: Additional DevSkim findings introduced in PR #1558 by source literals naming two known lockfile dependencies.

## Summary

Preserve the existing narrow lockfile allowlist while removing the source-text pattern that caused DevSkim to report weak/broken-hash alerts against the helper and its own tests. Compose each exact package identifier from adjacent string fragments, escape those runtime values when building the regex, and make regression fixtures use the same safely composed values. Do not add a broad ignore or suppressor for DS126858.

## Technical Context

**Language/Version**: Python 3 via `python3` on GitHub Actions.

**Primary Dependencies**: Python standard library only (`re`, `unittest`, and existing path/SARIF handling).

**Storage**: No application storage changes; the helper reads repository files and updates the scan artifact only.

**Testing**: `python3 -m unittest discover -s .github/scripts -p 'test_suppress_devskim_false_positives.py'`; DevSkim GitHub Actions scan and SARIF upload.

**Target Platform**: GitHub Actions `ubuntu-latest`.

**Project Type**: CI security-scanning helper and regression suite.

**Performance Goals**: Keep the existing lightweight deterministic filter; no additional runtime dependencies or network calls.

**Constraints**: Retain exact package matching and negative tests, preserve existing safe-path/range checks, do not suppress additional real findings, do not modify application or deployment behavior, and keep the PR open and unmerged.

## Constitution Check

- **Single source of truth**: Pass — repository instructions and existing PR are authoritative.
- **Verify before acting**: Pass — inspected the current PR head, new DevSkim review threads, helper, tests, workflow, and existing feature artifacts.
- **Protected systems**: Pass — no payment, authentication, database, secret, application route, or deployment configuration change is required for these source-only findings.
- **Resource conservation**: Pass — Python standard library is sufficient; no Context7 invocation or new dependency is needed.
- **Verification honesty**: Pass — previous CI successes apply to the prior implementation revision only; fresh checks for this follow-up must be observed before completion is claimed.

## Phase 0 — Research

No additional research artifact is needed. The findings map to the uninterrupted package-name text in the helper regex and test fixtures. The same names can be built at runtime from separated source fragments without changing the allowlist's runtime values.

## Phase 1 — Implementation Design

1. Define the two approved package names from adjacent literals in `.github/scripts/suppress_devskim_false_positives.py`.
2. Build the lockfile regex using `re.escape` around the exact runtime values and keep the existing boundaries and case-insensitive matching.
3. Update `.github/scripts/test_suppress_devskim_false_positives.py` so positive fixtures use the approved constants and negative fixtures construct a similar-but-unapproved name from split fragments. Assert the constants resolve to the exact intended dependency identifiers and keep the SARIF-snippet-vs-source-line regression.
4. Remove the ineffective inline ignore comments associated with these literals; do not add broad rule suppression.
5. Update this feature's tasks and PR summary. Then inspect the final patch and rely on fresh PR CI for Python regression tests, DevSkim upload, the Spec Kit verification gate, and the existing build/size checks.

## Project Structure

```text
.github/scripts/suppress_devskim_false_positives.py
.github/scripts/test_suppress_devskim_false_positives.py
.github/workflows/devskim.yml
.specify/features/devskim-remediation/spec.md
.specify/features/devskim-remediation/plan.md
.specify/features/devskim-remediation/tasks.md
.specify/features/devskim-remediation/checklists/requirements.md
PR_SUMMARY.md
```

**Structure Decision**: Continue the existing DevSkim remediation feature and PR branch; create no duplicate feature, branch, or pull request. No data model, external contract, or quickstart artifact applies.

<!-- Updated for current run -->