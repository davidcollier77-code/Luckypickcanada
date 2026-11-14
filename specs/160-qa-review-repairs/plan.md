# Implementation Plan: QA Review Repairs

**Branch**: `fix/160-qa-review-repairs` | **Date**: 2026-11-14 | **Spec**: `specs/160-qa-review-repairs/spec.md`

**Input**: Feature specification from `specs/160-qa-review-repairs/spec.md`

## Summary

Repair the confirmed defects found while reviewing PR #1900 feedback. Make changed-file parsing compatible with GitHub's optional rename field, restore the malformed changed-file count guard, cover exact-path and AVIF classification edges, reject explicit pending browser-evidence placeholders, and protect existing SARIF and conditional-check fixes with regression tests. Preserve the parent PR's approval integrity and QA scope.

## Technical Context

**Language/Version**: Python 3.11+ for checker scripts and tests; Markdown documentation.

**Primary Dependencies**: Python standard library; GitHub Actions; GitHub CLI and jq in the existing workflow.

**Storage**: N/A.

**Testing**: `unittest` suites and `py_compile`, already wired into `.github/workflows/visual-qa.yml`.

**Target Platform**: GitHub-hosted Ubuntu Actions runners.

**Project Type**: Repository QA infrastructure and CI support scripts.

**Performance Goals**: Checker and unit-test execution remains suitable for the existing five-minute scope job and 25-minute Visual QA job.

**Constraints**: No application code, dependencies, visual assets or screenshot baselines; no change to approval semantics or protected-file authorization. Local execution and Playwright access are unavailable in this GitHub-only session and must be reported as blocked rather than claimed.

**Scale/Scope**: Five existing QA-support files plus focused Spec Kit and Memory Bank records; no production application files.

## Constitution Check

- **Scope and purpose**: Pass. Repairs are limited to confirmed QA infrastructure and diagnostics.
- **Preserve safeguards**: Pass. Full-body/current-head approval digest, owner-only approval, protected-file gate and exact scope manifest remain unchanged.
- **Test-first regression coverage**: Pass by design. Every fixed edge has a focused unit assertion added to the existing test suites.
- **Evidence integrity**: Pass. Browser evidence placeholder validation is not represented as a remote status verifier; CI remains the source of executed test evidence.
- **Workflow sequence**: Specify, Plan, Tasks and Implement artifacts are recorded in order.
- **Environment constraints**: Local Python execution and Playwright via Firecrawl are unavailable here. No startup scripts or `freebuff-verify.sh` are run.

## Design and Decisions

1. Treat `previous_filename` as optional: include it only when non-null; detect duplicates across both old and new paths in one shared set.
2. Require the `changed_files` key before validating its exact integer count. Continue rejecting booleans, despite `bool` subclassing `int`.
3. Validate path segments with an explicit character class that places hyphen first, permits `[]`, `()` and spaces, rejects commas and retains explicit `*`/`?` glob rejection.
4. Recognize `.avif` as a visual baseline format, retaining all existing extensions.
5. Retain field-aware missing-path diagnostics and the existing BLOCKED renderer fallback; add direct regression tests.
6. Reject explicit browser evidence placeholder values (including `pending-pr-check`) while documenting that the checker does not fetch or assess arbitrary remote run status.
7. Keep conditional group filtering scoped to the supplied group name and test two separate groups with opposite outcomes.
8. Preserve filename context around malformed raw/filtered SARIF parsing and test both error paths.
9. Keep `jq 'add // []'` on both pagination endpoints; the parent branch already contains the repair, so add no duplicate workflow change.
10. Retain the complete PR-body/head approval digest and explicit duplication of expansion paths in the exact path manifest. Those are intentional contracts, not defects.

## Repository QA Review

- `.github/workflows/visual-qa.yml`: the `verify` job runs `py_compile` and all three checker unit suites before the full test suite; the PR classifier keeps Playwright visual shards separate and only runs them for visual-path changes.
- `.github/workflows/pr-scope-verification.yml`: the trusted-base checker fetches the PR, all file pages and owner comments; both empty-capable jq endpoints already use `add // []`.
- `.github/workflows/devskim.yml`: the raw SARIF copy is preserved before filtering; syntax, summary tests, suppression, replay, filter and upload outcomes are reported separately.
- `.github/scripts/verify_pr_verification_status.py`: conditional checks are grouped by prefix and the group name; regression coverage verifies no cross-group aggregation.
- The PR is stacked on `feat/158-qa-infrastructure-integrity`. Existing workflow branch filters target `main`, so GitHub PR-triggered workflows are not expected to run for the stacked base. This is a known submission/verification limitation, not an application test result.

## Project Structure

QA code:
- `.github/scripts/check_qa_pr_scope.py`
- `.github/scripts/test_check_qa_pr_scope.py`
- `.github/scripts/test_summarize_devskim_findings.py`
- `.github/scripts/test_verify_pr_verification_status.py`
- `.github/pull_request_template.md`

Documentation:
- `specs/160-qa-review-repairs/{spec,plan,research,tasks}.md`
- `specs/160-qa-review-repairs/checklists/requirements.md`
- `.specify/feature.json`
- `memory-bank/activeContext.md`
- `memory-bank/progress.md`

**Structure Decision**: Use the existing paths under .github/scripts and the .github PR-template location. Do not add another workflow or change the existing runtime/CI architecture. Keep this as a dependent repair branch based on PR #1900.

## Complexity Tracking

No constitution violations or architectural additions. No separate service, dependency or persistent data model is introduced.
