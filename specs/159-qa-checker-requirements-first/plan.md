# Implementation Plan: QA Checker Requirements Before Task Specification

**Branch**: `chore/159-qa-checker-requirements-first` | **Date**: 2026-11-14 | **Spec**: `specs/159-qa-checker-requirements-first/spec.md`

## Summary

Add a dedicated Section A requirement in AGENTS.md making inspection and understanding of applicable QA checkers a prerequisite to task specification. Extend the existing governance regression test to protect the new requirement. Preserve all existing governance and checker behaviour.

## Technical Context

**Language/Version**: Markdown governance; JavaScript/Vitest regression test.

**Primary Dependencies**: Existing repository AGENTS.md and governance test harness.

**Storage**: N/A.

**Testing**: Existing `__tests__/agent-governance-single-source.test.js`; full test execution unavailable in the connected GitHub-only workspace.

**Target Platform**: GitHub repository governance and CI.

**Project Type**: Existing Next.js web application repository; this task changes governance documentation and its test only.

**Constraints**: Dedicated governance PR; owner authorization remains required before merge; no unrelated files; no repository startup or verification scripts executed.

## Design and Decisions

- Insert a standalone, clearly titled requirement in Section A — PREPARE AND PLAN, before the existing QA implementation/validation requirement.
- Explicitly state that checker understanding is required before drafting the task specification.
- Require inspection of actual definitions and tests, not assumptions from names.
- Enumerate the checker details agents must understand and how they must influence task requirements.
- Add regression assertions for the heading, timing and task-specification relationship.
- Do not change checker code, workflows, thresholds, approvals or runtime behaviour.

## Constitution Check

- Single source of truth: satisfied; AGENTS.md remains canonical.
- Verify before acting: satisfied through repository source inspection; local execution is unavailable and disclosed.
- Implementation sequence: specify → plan → tasks → implement artifacts are recorded in this feature.
- Protected governance: dedicated PR only; explicit owner authorization before merge remains mandatory.
- Scope control: no production application changes.

## Project Structure

Documentation:
- `AGENTS.md`
- `__tests__/agent-governance-single-source.test.js`
- `specs/159-qa-checker-requirements-first/{spec,plan,research,tasks}.md`
- `memory-bank/{activeContext,progress}.md`

## Verification Plan

- Inspect the AGENTS.md insertion and governance test diff.
- Confirm changed paths remain within the dedicated governance surface.
- Local test execution is BLOCKED because this connected GitHub-only workspace does not provide a local repository runtime.
- GitHub PR workflows are PENDING after PR creation; no pass is claimed.
