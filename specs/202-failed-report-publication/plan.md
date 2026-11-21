# Implementation Plan: Publish a FAILED Report Instead of a Placeholder

**Branch**: `freebuff/856a686c49f64f37f6ddb027-failed-report` | **Date**: 2026-11-21 | **Spec**: `specs/202-failed-report-publication/spec.md`

## Summary

`pr_verification_report.py` writes the complete seven-category body before it returns. Exit 1 means "at least one category is `FAILED`", not "the report could not be built", yet the workflow's placeholder guard treats every non-zero status as a render error and overwrites the body. The fix narrows the guard to `status` values other than 0 and 1, or a missing/empty body, so a `FAILED` report is published with its evidence while a genuine render error still replaces a stale report.

## Technical Context

**Language/Version**: Python 3 standard library for the renderer and its tests; YAML for GitHub Actions; Vitest for the workflow-contract test; Node.js 26.x repository runtime.

**Primary Dependencies**: None added.

**Storage**: None.

**Testing**: `python3 .github/scripts/test_pr_verification_report.py`, `pnpm exec vitest run __tests__/checker-suite-workflows.test.js`, and `./freebuff-verify.sh`.

**Target Platform**: GitHub Actions on `pull_request_target`, `issue_comment` and `workflow_run`.

**Constraints**: Do not change the seven categories, their meanings, the four statuses, the declarations, the sticky publication, the approval digests or the job conclusions. Do not modify `AGENTS.md`, DevSkim, the Playwright shards or any protection gate. Keep the production build strictly below 495 MiB.

**Scale/Scope**: One workflow condition, two contract tests and one Spec Kit feature.

## Constitution Check

- **Single source of truth**: PASS — no submission procedure changes.
- **Verify before acting**: PASS — the renderer's write-before-return order and the workflow's guard were inspected in source.
- **Protect core systems**: PASS — no application, payment, authentication, hosting, database or secrets configuration changes.
- **Resource conservation**: PASS — no dependency, service or paid usage.
- **Development workflow**: PASS — spec, plan and tasks are added; the Spec Kit gate stays active.
- **QA requirements**: PASS — every checker and shard is unchanged; only publication of an already-rendered result changes.
- **Preservation**: PASS — no visitor-facing behaviour changes.

## Project Structure

```text
.github/workflows/pr-verification-report.yml   # placeholder guard excludes exit 1
.github/scripts/test_pr_verification_report.py  # renderer body + workflow contract tests
__tests__/checker-suite-workflows.test.js       # Vitest workflow-hygiene assertion
specs/202-failed-report-publication/{spec,plan,tasks}.md
.specify/feature.json                           # active feature pointer
```

## Phase 0 — Research

`main()` in `pr_verification_report.py` builds the report, renders the Markdown, prints it, writes `--comment` and `--summary`, and only then returns `0` when the overall status is not `FAILED` and `1` when it is. The workflow captures that status and, for any non-zero value, overwrites `comment.md` with the "could not be built" placeholder; the separate gate step already prints the correct "at least one category is FAILED" message for exit 1, but the comment itself never reaches the pull request.

## Phase 1 — Design

The placeholder condition becomes "status is neither 0 nor 1, or the body is missing/empty". Exit 1 therefore publishes the rendered body and the job still fails through the unchanged gate step. Exit 2 and unexpected statuses keep the placeholder, so a failed render can never leave an earlier passing report visible. No renderer change is required.

## Verification and Limitations

Local verification runs the report and Vitest contract suites plus `./freebuff-verify.sh` (install, Spec Kit gate, checker suites, TypeScript, build and build-size measurement). The GitHub-triggered behaviour is **PENDING — runs after PR creation**; the workflow change can only be observed on a later report run and is not claimed as executed here.
