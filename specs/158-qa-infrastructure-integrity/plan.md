# Implementation Plan: QA Infrastructure Integrity

**Branch**: `feat/158-qa-infrastructure-integrity` | **Date**: 2026-11-14 | **Spec**: [spec.md](spec.md)

**Input**: `specs/158-qa-infrastructure-integrity/spec.md`

## Summary

Add trusted, read-only PR scope verification backed by an exact file-path declaration in the PR body. Require digest-bound repository-owner approval for scope expansions, visual baseline updates and governance edits. Accept Playwright, Firecrawl and Browserless evidence labels without changing the automatic Playwright workflow. Preserve raw DevSkim SARIF before the existing filter, report raw/filtered findings, and run focused checker tests alongside existing QA.

No production application code or artwork is in scope.

## Technical Context

**Language/Version**: Python 3, YAML, Markdown

**Primary Dependencies**: Existing GitHub Actions, GitHub CLI (`gh`), jq, existing DevSkim and Playwright toolchains. No new package.

**Storage**: GitHub PR body, changed-file API, issue comments, workflow artifacts.

**Testing**: Python `unittest`; existing complete Vitest, Playwright, DevSkim and governance workflows remain.

**Target Platform**: GitHub Actions on `ubuntu-latest`

**Project Type**: Repository CI / QA infrastructure

**Performance Goals**: Small dependency-free Python checks complete within seconds for normal PR diffs.

**Constraints**:
- New `pull_request_target` workflow must run trusted base-branch code only, use read-only token permissions, and never check out or execute PR code.
- Scope declarations use exact paths, not directory-wide globs.
- Approvals are tied to exact SHA-256 digests of paths and reasons.
- Automated browser testing remains Playwright-based.
- Preserve existing DevSkim suppression/replay and append-only report logic.
- Do not run `freebuff-verify.sh` or repository startup scripts in this ChatGPT environment.
- `.docs/` is read-only; build hard cap remains 495 MB.
- No merge or post-submission CI polling.

**Scale/Scope**: One scope workflow, one reusable scope checker and focused tests, one SARIF summary helper and tests, DevSkim raw evidence retention, PR template and Spec Kit/Memory Bank records.

## Constitution Check

- `AGENTS.md`, `PR_SUBMISSION.md`, the Spec Kit command definitions, templates and constitution were reviewed.
- No production app files, feature code or visual assets are changed.
- Existing Vitest, Crystal Ball, Playwright, DevSkim suppression/replay, Agent MD and verification-integrity checks remain mandatory.
- The new scope workflow checks out only `main`, reads PR metadata/files/comments, and has read-only permissions.
- Existing protected-file/Agent MD authorization is not bypassed.
- Browser evidence declaration does not change the existing automated Playwright runner.

**Gate**: Pass for the infrastructure-only design. Actual test execution and browser access limitations are reported separately.

## Project Structure

```text
specs/158-qa-infrastructure-integrity/
├── spec.md
├── plan.md
├── research.md
├── tasks.md
└── checklists/requirements.md

.github/
├── pull_request_template.md
├── workflows/
│   ├── pr-scope-verification.yml
│   ├── visual-qa.yml
│   └── devskim.yml
└── scripts/
    ├── check_qa_pr_scope.py
    ├── test_check_qa_pr_scope.py
    ├── summarize_devskim_findings.py
    └── test_summarize_devskim_findings.py

.specify/feature.json
memory-bank/activeContext.md
memory-bank/progress.md
```

**Structure Decision**: Extend the existing GitHub Actions and Python QA tooling. New helpers are dependency-free and live beside the existing DevSkim tooling. Current workflows remain the integration points.

## Design Decisions

### PR scope and trust boundary

Use `pull_request_target` and `issue_comment`, with checkout pinned to the trusted `main` ref. Never check out PR code. Read PR metadata, changed-file records and issue comments through the read-only token. Fail closed when required data is missing or malformed. The PR body contains exactly one JSON declaration between fixed markers. Its `paths` value is an exact file list. Renames check both old and new paths. Scope expansions must be added to that list and approved by an exact owner-authored digest comment.

This is deterministic file-scope validation, not semantic static analysis. The report lists every checked path and its declared purpose; reviewers must still compare the actual code hunks with that purpose to catch unrelated behavior inserted into an already-declared file.

### Visual baselines and governance

The checker requires the actual changed screenshot list to equal the declared baseline list and a separate owner approval. Old images remain recoverable through ordinary Git history; no automatic baseline replacement occurs. Governance changes under `.freebuff/`, relevant `.specify/` instructions/templates (excluding the active feature pointer), and explicitly protected governance paths require reasons and a separate owner approval. This does not bypass the existing Agent MD/protected-file workflow.

### Browser evidence

Accept only Playwright, Firecrawl and Browserless. Preserve each tool's true identity, and require a run/artifact/trace reference plus a purpose. The evidence declaration does not independently validate the supplied link and does not change the existing Playwright-based automatic visual workflow.

### DevSkim

Copy raw SARIF before the existing in-place suppression step. Keep the current filtered `devskim-sarif` artifact and add a separate `devskim-sarif-raw` artifact. Summarize raw, filtered and removed counts plus remaining rule/severity/confidence/path/line/message. Keep existing suppression, replay and append-only alert logic unchanged.

### Existing QA protection

Run the new Python test modules and verification-integrity contract tests in the existing Visual QA verification job in addition to the complete unit suite. The verification-integrity audit makes `PR Scope Verification` mandatory on the current head. Test the SARIF summary in the DevSkim workflow. Preserve Crystal Ball tests, Playwright projects and shards, baseline checks, Agent MD gates, security checks and verification-integrity.

## Research

See [research.md](research.md) for the reviewed workflows, PR #1899/DevSkim evidence and environment limitations.

## Complexity Tracking

No architectural dependency or service is added. The change introduces two independent Python helpers and connects them to existing workflows.
