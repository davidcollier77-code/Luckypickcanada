# Implementation Plan: Freebuff Playwright Agent Guidance

**Branch**: `docs/playwright-agentmd-guidance-20261115` | **Date**: 2026-11-15 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/164-playwright-agentmd-guidance/spec.md`

## Summary

Add one concise Freebuff-only Playwright guidance section to AGENTS.md and extend the existing governance test to guard its scope, commands, mode separation and maintenance instructions. Do not change README.md, browser scripts, Playwright configurations, CI workflows or application code.

## Technical Context

**Language/Version**: Markdown documentation; existing JavaScript test
**Primary Dependencies**: None added
**Storage**: Repository files only
**Testing**: Existing `__tests__/agent-governance-single-source.test.js` Vitest suite
**Target Platform**: GitHub repository
**Project Type**: Governance documentation and regression test
**Performance Goals**: No runtime or build impact
**Constraints**: Dedicated AGENTS.md governance PR; preserve existing browser-tool exceptions and all unrelated governance wording

## Constitution Check

- AGENTS.md remains the sole governance authority.
- The change is explicitly authorized by the repository owner.
- The AGENTS.md protection workflow requires a dedicated governance PR and human authorization before merge.
- No application, browser runtime, security, payment, deployment or data boundary is changed.
- The Spec Kit artifacts remain concise and scoped to this governance change.

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
