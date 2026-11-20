# Implementation Plan: Seven Checker Categories

**Branch**: `freebuff/25590a89225c606a9ca3e3ec` | **Date**: 2026-11-20 | **Spec**: `specs/198-seven-checker-categories/spec.md`

## Summary

Add one consolidated verification-report renderer and workflow that publishes exactly seven checker categories on the pull request and updates the same comment in place. Fold the existing advisory comment outputs (test quality, performance, security alert text, changed-code review, Visual QA summary) into the category that owns them while keeping every underlying checker and its detailed findings. Require the two exact declarations in the PR description. Remove the submitter-side browser-evidence requirement from the scope checker. Add Spec Kit, regression and workflow-hygiene coverage.

## Technical Context

**Language/Version**: Python 3 standard library for the checkers; JavaScript (Vitest) for repository workflow-hygiene tests; YAML for GitHub Actions; Node.js 26.x repository runtime.

**Primary Dependencies**: None added. The new checker imports the existing `check_qa_pr_scope`, `checker_suite`, `review_pr_changes` and `verify_pr_verification_status` modules.

**Storage**: None.

**Testing**: `python3 -m unittest` for the checker suites (wired into the Visual QA verification job), Vitest for the workflow/documentation contract, `./freebuff-verify.sh` for the repository gate, plus a full `pnpm run test`, `pnpm exec tsc --noEmit` and `pnpm run build` measurement.

**Target Platform**: GitHub Actions on `pull_request_target` and `workflow_run`; no pull request code is checked out or executed.

**Project Type**: Repository CI/QA verification infrastructure and documentation.

**Performance Goals**: The report is rendered from a handful of GitHub API responses; no application runtime change.

**Constraints**: Do not modify `AGENTS.md`, `.github/dependabot.yml`, DevSkim configuration or the three external reviewers. Do not remove or weaken any automated test, security check, build check, Playwright test or protection gate. Keep the production build strictly below 495 MiB.

**Scale/Scope**: One new checker module, one new workflow, five updated workflows/tests, two documentation files, one Spec Kit feature and Memory Bank records.

## Constitution Check

- **Single source of truth**: PASS — `PR_SUBMISSION.md` remains the PR procedure; the template mirrors it; `AGENTS.md` is untouched.
- **Verify before acting**: PASS — every existing workflow, checker, script and regression suite was inspected before changing the reporting contract.
- **Protect core systems**: PASS — no application, payment, authentication, hosting, database or secrets configuration changes. Protected-file detection is unchanged and still fail-closed.
- **Resource conservation**: PASS — no new dependency, service or paid usage; one report replaces several comments.
- **Development workflow**: PASS — spec, plan and tasks records are added; the Spec Kit gate remains active.
- **QA requirements**: PASS — Playwright, DevSkim, the unit suite, the type check and the build gate are preserved and now reported as supporting evidence.
- **Preservation**: PASS — no visitor-facing behaviour, artwork, animation, audio, layout or data boundary changes.

## Project Structure

```text
.github/scripts/
├── pr_verification_report.py            # seven-category renderer and evaluator
├── test_pr_verification_report.py       # declaration, status, head, scope, protected, governance tests
├── check_qa_pr_scope.py                 # exact-path scope; browser evidence no longer required
└── test_check_qa_pr_scope.py            # updated contract tests

.github/workflows/
├── pr-verification-report.yml           # one consolidated sticky report
├── pr-scope-verification.yml            # gate only; findings published by the consolidated report
└── visual-qa.yml                        # unchanged Playwright shards; new checker tests wired in

__tests__/
├── checker-suite-workflows.test.js      # workflow hygiene and preserved QA contract
└── qa-review-comment.test.js            # executed sticky-comment publish/update/refusal test

PR_SUBMISSION.md
.github/pull_request_template.md
specs/198-seven-checker-categories/{spec,plan,tasks}.md
memory-bank/{activeContext,techContext,progress}.md
```

**Structure Decision**: Reuse the existing single-repository Spec Kit layout and existing checker modules. No application source, package, asset, API or infrastructure file is required.

## Phase 0 — Research

The existing `checker_suite.py` wrote four independent advisory comments; `visual-qa-summary.yml` aggregated Playwright results separately; `pr-scope-verification.yml` published a fifth changed-code comment; `check_qa_pr_scope.py` required submitter browser evidence for visual paths; and `verify_pr_verification_status.py` already matched check runs to the exact head SHA. The seven-category contract is implemented by aggregating these results into one report while leaving every scanning, testing and build workflow intact.

## Phase 1 — Design

The report is a pure function of an evidence bundle: pull request metadata, changed files, owner comments, current-head check runs, the verification audit and code-scanning alerts. Category evaluation reuses the existing validators, so approval digests, scope rules, protected-file detection and head-SHA matching stay in one place. The renderer always emits seven table rows, uses only `PASSED`/`FAILED`/`WARNING`/`NOT RUN`, and shrinks detail blocks rather than truncating findings when the 60,000-byte comment cap is approached. The workflow resolves the pull request for `workflow_run` events, publishes with the existing marker-based upsert script, and fails only after publishing when a category is `FAILED`.

## Verification and Limitations

Local verification runs the Python checker suites, the new and updated Vitest contract tests, the full unit suite, the TypeScript check, the production build and the build-size measurement. GitHub-triggered results remain pending until the pull request exists; the workflow is defined on `main` and only runs on later pull requests, which is recorded in the PR handoff rather than claimed as executed.
