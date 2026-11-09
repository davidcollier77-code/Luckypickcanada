# Implementation Plan: Agent Integration and QA Guidance

**Branch**: docs/agent-integration-qa-guidance-20261109 | **Date**: 2026-11-09 | **Spec**: spec.md

## Summary

Make a narrow, documentation-only update to the existing authoritative AGENTS.md. Correct the connected integration inventory, clarify Playwright CLI and Browserless roles, describe actual PR workflow gates accurately, and strengthen the strict 495 MiB build cap. Preserve all unrelated governance and workflows.

## Technical Context

**Language/Version**: Markdown and JSON only.
**Primary Dependencies**: Existing AGENTS.md, GitHub Actions workflow definitions and Playwright CLI skill documentation.
**Storage**: N/A; no application data or storage configuration changes.
**Testing**: GitHub diff inspection and PR CI. Local shell commands are unavailable in this connected GitHub API session.
**Target Platform**: GitHub repository documentation and GitHub Actions.
**Project Type**: Repository governance documentation.
**Performance Goals**: No application runtime or build output changes.
**Constraints**: Keep AGENTS.md authoritative; preserve existing governance; do not modify production database, hosting, secrets, workflow files or scheduled updater systems. The production build must remain strictly below 495 MiB.
**Scale/Scope**: AGENTS.md plus concise Spec Kit and Memory Bank records.

## Constitution Check

- Single source of truth: PASS — edit only the existing authoritative AGENTS.md; no secondary governance file.
- Verify before acting: PASS — inspected current main, AGENTS.md, manifest, Memory Bank, task-group guidance, Playwright guide and workflow definitions.
- Implementation sequence: PARTIAL — artifacts prepared in order; Spec Kit setup/resolver scripts cannot execute through the available GitHub API-only session.
- Protect core systems: PASS — no application, database, hosting, secrets or workflow configuration changes.
- Resource conservation: PASS — documentation-only change; no dependency or build changes.

## Phase 0 — Research

- Confirmed main HEAD and PR #1788 merge; reuse the merged Playwright CLI skill and existing eight-area project guide.
- Inspected DevSkim, OpenNext validation, Visual QA, Verification Integrity and Protected File Authorization workflows.
- Confirmed pullfrog.yml is manually dispatched and is not an automatic PR gate.
- Branch-protection endpoint returned HTTP 403; formal required status-check configuration cannot be asserted.
- No individual .docs reference document was needed; .docs/manifest.json was inspected for routing context.

## Phase 1 — Design

### Files changed
- AGENTS.md: update existing browser guidance, QA contract, connected integrations and build-size rule.
- .specify/feature.json: point to this active feature.
- specs/124-agent-integration-qa-guidance/: spec, plan, tasks and requirements checklist.
- memory-bank/activeContext.md: record the current task and branch.
- memory-bank/progress.md: append a concise milestone record.

### Source of truth

Workflow behavior remains defined by the checked-in .github/workflows files. AGENTS.md summarizes those behaviors; it does not replace them. Production database configuration and workflow files remain untouched.

## Verification Plan

- Inspect the complete PR diff and confirm only the listed files changed.
- Run ./freebuff-verify.sh, git diff --check and applicable CI checks when a shell-capable runner executes the PR.
- Confirm DevSkim, OpenNext validation, Visual QA and Verification Integrity on the new PR head; protected-file authorization should not trigger because no protected path is changed.
- No browser test is needed for a documentation-only change if the Visual QA classifier positively classifies the PR as documentation-only; other workflow checks still apply.
