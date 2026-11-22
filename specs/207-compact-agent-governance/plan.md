# Implementation Plan: Compact Agent Governance Instructions

**Branch**: `207-compact-agent-governance` | **Date**: 2026-11-21 | **Spec**: [spec.md](spec.md)

**Input**: Approved governance specification for condensing `AGENTS.md` without weakening requirements.

## Summary

Replace the expanded 478-line governance document with a focused 178-line entry point. Keep direct operational rules in `AGENTS.md`, refer detailed PR, startup, manifest and specialist procedures to their authoritative sources, update the governance regression test, and refresh the current Memory Bank task header.

## Technical Context

**Language/Version**: Markdown and JavaScript test source; repository runtime Node.js 26.x.

**Primary Dependencies**: Existing GitHub Actions, Vitest and Python protected-file classifier. No dependencies added.

**Storage**: GitHub repository files and existing workflow evidence; no production data changes.

**Testing**: `__tests__/agent-governance-single-source.test.js`, protected-file detection/authorization workflow, PR Scope Verification and consolidated PR Verification Report. Local execution is unavailable in this ChatGPT environment.

**Target Platform**: GitHub repository and existing GitHub Actions.

**Project Type**: Repository governance and documentation.

**Constraints**: Preserve the exact protected-file gate, governance digest semantics, separate GitHub Environment authorization, seven checker categories, `PR_SUBMISSION.md`, dynamic manifest routing, Freebuff Playwright procedure, ChatGPT startup restrictions and 495 MiB build cap. Do not change startup files, Spec Kit tooling, `.docs/`, workflows, protected scripts, application code or dependencies.

## Constitution Check

- `AGENTS.md` remains the sole governance authority.
- The specification, plan, task list and implementation follow the current specify → plan → tasks → implement sequence.
- The current Spec Kit workflow and templates were inspected. The workflow is version/tooling aware; no version or fixed command catalogue is added to governance.
- `.freebuff/cmds/` definitions remain Freebuff-only and are not used as ChatGPT operating instructions.
- `PR_SUBMISSION.md` remains the sole source for PR declarations, verification, submission and handoff.
- Memory Bank remains context only. Only the stale active-task heading is refreshed; the other core files are left unchanged after health review.
- No application behavior, dependency, secret, deployment, CI workflow or production data changes.
- `.docs/manifest.json` and the `.docs/` reference library remain unchanged and read-only.

## Project Structure

- `AGENTS.md` — compact, complete repository governance entry point.
- `__tests__/agent-governance-single-source.test.js` — concise-document, safeguard, role-separation, routing and protection regression coverage.
- `memory-bank/activeContext.md` — current task header and verification boundary.
- `specs/207-compact-agent-governance/spec.md` — user scenarios and acceptance requirements.
- `specs/207-compact-agent-governance/plan.md` — this plan.
- `specs/207-compact-agent-governance/tasks.md` — implementation and verification status.

## Complexity Tracking

No new system, dependency, workflow or checker is introduced. Existing references and protection/verification workflows are reused. The 200-line upper bound is intentionally enforced by the governance regression test to prevent a return to the expanded document.