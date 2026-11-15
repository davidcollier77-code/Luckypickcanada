# Implementation Plan: QA Checker Hardening

**Branch**: `freebuff/qa-checker-hardening-20261115` | **Date**: 2026-11-15 | **Spec**: [spec.md](spec.md)

**Input**: `specs/163-qa-checker-hardening/spec.md`

## Summary

Repair the inherited `changed_paths()` crash, add a dependency-free patch-level reviewer for high-confidence security and reliability findings, add an optional visual-impact declaration, and remove the duplicated `freebuff-verify.sh` step from Visual QA while preserving standalone TypeScript, unit, build, visual, Crystal Ball, DevSkim, CodeQL, and verification-integrity coverage.

No application code or visual assets are in scope.

## Technical Context

**Language/Version**: Python 3, Bash, YAML, Markdown

**Primary Dependencies**: Existing Python standard library, GitHub Actions, GitHub CLI, jq, Vitest, TypeScript, Playwright. No new package.

**Storage**: GitHub pull-request metadata, changed-file records and patches, issue comments, workflow summaries.

**Testing**: Python `unittest`; existing Vitest, Playwright, TypeScript, and repository verification gates.

**Target Platform**: GitHub Actions on `ubuntu-latest`

**Project Type**: Repository CI / QA infrastructure

**Performance Goals**: Scope and change review complete in seconds for a normal PR; no extra dependency installation.

**Constraints**:
- Preserve exact-path scope validation and all existing approvals.
- Inspect added patch lines only; do not scan the whole repository.
- Hard-fail only high-confidence secrets, private keys, and merge markers.
- Treat all other risky patterns as advisory, evidence-backed warnings.
- Do not duplicate DevSkim/CodeQL generic injection detection.
- Do not require `freebuff-verify.sh` in QA.
- Preserve existing Playwright baselines, shards, and Crystal Ball coverage. Run browser shards only for changes that can affect frontend rendering or browser behavior; skip known CI-only and backend API-only changes without skipping the always-on unit, TypeScript, security, scope, or build checks.
- Keep production build below 495 MiB.
- No live AI requests.

**Scale/Scope**: One fixed scope helper, one new changed-code reviewer, focused Python tests, Visual QA/PR Scope workflow updates, one PR template field, Spec Kit and Memory Bank records.

## Constitution Check

- `AGENTS.md`, `PR_SUBMISSION.md`, the Spec Kit commands/templates, and the constitution were reviewed.
- The change is limited to QA infrastructure and task records.
- No payment, database, authentication, hosting, secrets, or application behavior is changed.
- Existing security scanners and protected-file approvals remain authoritative.
- The implementation follows INSPECT → PLAN → IMPLEMENT → TEST → REPORT.
- `.docs/` remains read-only.
- No dependency is added.

**Gate**: Pass for the infrastructure-only design.

## Project Structure

```text
specs/163-qa-checker-hardening/
├── spec.md
├── plan.md
├── research.md
├── tasks.md
├── checklists/requirements.md
└── evidence.md

.github/
├── pull_request_template.md
├── workflows/
│   ├── pr-scope-verification.yml
│   └── visual-qa.yml
└── scripts/
    ├── check_qa_pr_scope.py
    ├── test_check_qa_pr_scope.py
    ├── review_pr_changes.py
    └── test_review_pr_changes.py

__tests__/visual-qa-chromium-cache.test.js
.specify/feature.json
memory-bank/activeContext.md
memory-bank/progress.md
memory-bank/techContext.md
```

**Structure Decision**: Extend the existing Python QA tooling and workflows. The new reviewer is a sibling of the scope checker and consumes the same GitHub file records.

## Design Decisions

### File-record handling

`changed_paths()` will read `previous_filename` only when it is a non-empty string. A record whose status is `renamed` or `copied` without a previous path fails closed. Duplicate current and previous names are rejected. This preserves rename coverage while allowing ordinary GitHub records.

### Visual QA classification

The path classifier remains fail-closed for unknown paths but explicitly recognizes two non-rendering categories: GitHub automation/configuration under .github/, and Next.js API route handlers under app/api/ and pages/api/. These paths do not need screenshot/browser inspection merely because they changed. The PR scope checker's visual-path detection uses the same API exclusions and does not treat CI files as visual paths. Frontend routes/components, styles, assets, browser/e2e tests, visual tooling configuration, and unknown paths continue to require browser evidence. A visual_impact.required: true declaration continues to force browser coverage for an otherwise non-visual path. Any mixed change set with at least one visual path requires Playwright.

This changes only the browser-evidence requirement. The stable Visual QA job continues to run the full unit suite and standalone TypeScript check on every PR; other CI, security, scope, build and governance gates are unchanged.

### Changed-code review

The reviewer parses unified-diff hunk headers to map added lines to new-file line numbers. It ignores binary/oversized records without patches and scans only added lines. Findings are deduplicated by path, line, rule, and excerpt.

Hard findings:
- Private key block headers.
- Recognizable AWS, GitHub, Stripe live, Slack, and Google API token formats.
- Merge-conflict markers.

Advisory warnings:
- Unsafe HTML sinks and dynamic code execution.
- External `http://` links and `target="_blank"` without `noopener`.
- Hardcoded credential assignments that are not environment lookups or placeholders.
- Added package dependency entries.
- Type/lint suppressions, debugger statements and deprecated APIs.

The report explicitly says warnings are not confirmed vulnerabilities. Secret-like excerpts are redacted before the report reaches logs or the step summary. Test fixtures use constructed strings or placeholder markers so the reviewer's own PR remains clean.

### Visual impact

The scope declaration gains an optional `visual_impact` object:

```json
"visual_impact": {
  "required": true,
  "reason": "Changes the homepage hero layout and animation"
}
```

A `required: true` declaration requires browser evidence even when path detection does not, and the Visual QA classifier also forces the browser job for that declaration. A `required: false` declaration on a path-classified visual change is preserved as a reviewer warning; it does not remove the existing browser-evidence failure. Playwright, Firecrawl, and Browserless remain equally valid.

### Freebuff verification

Remove the `Run AGENTS.md Spec Kit verification` step from `visual-qa.yml` and replace it with an explicit `pnpm exec tsc --noEmit` step. Keep the full Vitest suite and existing OpenNext build workflow. Do not delete `freebuff-verify.sh` or its own unit test. Update the workflow guard test to assert the new wiring and the absence of the Freebuff dependency.

### Existing coverage

- DevSkim and CodeQL remain the broad security scanners.
- TypeScript, Vitest, and OpenNext build remain the broad correctness/build checks.
- Playwright shards and baselines remain unchanged.
- Crystal Ball daily-fortune, follow-up, quota, timeout, fallback, outage, and browser specs remain intact and are run as focused verification.
- The Daily Resonance unit test pins its local clock to its mocked date fixture so a real calendar day cannot turn a valid persisted-result test into a false failure.
- Verification Integrity continues to audit current-head checks; PR Scope remains required.

## Research

See [research.md](research.md) for inspected checker behavior, the reproduced root cause, and the false-positive/duplication decisions.

## Complexity Tracking

No new service, package, database, or production path is added. The change fixes one shared helper and adds one focused checker with local fixtures.
