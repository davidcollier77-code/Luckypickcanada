# Implementation Plan: Freebuff Playwright Agent Guidance

**Branch**: `docs/playwright-agentmd-guidance-20261115` | **Date**: 2026-11-15 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/164-playwright-agentmd-guidance/spec.md`

## Summary

Retain the concise Freebuff-only Playwright guidance and consolidate QA governance: remove duplicate checker instructions, make checker requirements inform task specification and independent final self-review, define a direct-owner-only exception to the post-submission hard stop, and extend the governance regression test. Keep the work within governance documentation, its existing regression test, Spec Kit records and Memory Bank task records. Do not change README.md, browser scripts, Playwright configurations, CI workflows or application code.

## Technical Context

**Language/Version**: Markdown documentation; existing JavaScript test
**Primary Dependencies**: None added
**Storage**: Repository files only
**Testing**: Existing `__tests__/agent-governance-single-source.test.js` Vitest suite
**Target Platform**: GitHub repository
**Project Type**: Governance documentation and regression test
**Performance Goals**: No runtime or build impact
**Constraints**: Existing dedicated governance PR #1908; continuation explicitly authorized by the repository owner; preserve existing browser-tool exceptions and unrelated governance; owner approval, protected-file authorization and QA scope gates remain mandatory

## Constitution Check

- AGENTS.md remains the sole governance authority.
- The change is explicitly authorized by the repository owner.
- The AGENTS.md protection workflow requires a dedicated governance PR and human authorization before merge.
- No application, browser runtime, security, payment, deployment or data boundary is changed.
- The Spec Kit artifacts record both the original Playwright guidance and the owner-authorized QA-governance continuation.
- PR #1908 remains open and unmerged; direct owner instruction permits this specific continuation but does not satisfy the separate QA-scope owner approval or protected-file environment authorization.

## Project Structure

```text
AGENTS.md
__tests__/agent-governance-single-source.test.js
.specify/feature.json
specs/164-playwright-agentmd-guidance/
├── spec.md
├── plan.md
├── tasks.md
├── checklists/requirements.md
└── evidence.md
memory-bank/
├── activeContext.md
└── progress.md
```

**Structure Decision**: Documentation-only governance change, with one existing governance test extended and the required task records added. No application or Playwright implementation files are touched.

## Complexity Tracking

No constitution violations or additional architectural complexity.
