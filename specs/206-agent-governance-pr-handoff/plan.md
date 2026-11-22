# Implementation Plan: Agent Governance and PR Handoff

**Branch**: `206-agent-governance-pr-handoff` | **Date**: 2026-11-21 | **Spec**: [spec.md](spec.md)

## Summary

Make focused, coordinated changes to repository governance, PR handoff documentation and governance regression tests. Update the stale active-context header identified by the four-file Memory Bank health check. Preserve all unrelated repository policies and existing workflows.

## Technical Context

**Language/Version**: Markdown and JavaScript test source; repository runtime Node.js 26.x.

**Primary Dependencies**: Existing GitHub Actions, Vitest and Python governance checker. No dependencies added.

**Storage**: GitHub repository files and existing workflow artifacts; no production data changes.

**Testing**: Existing agent governance Vitest suite and protected-file PR workflow, executed by GitHub Actions.

**Target Platform**: GitHub repository and existing GitHub Actions.

**Project Type**: Repository governance and documentation.

**Constraints**: Preserve the current protected-file gate, seven checker categories, exact approval digest semantics, ChatGPT and Freebuff instruction separation, Freebuff Playwright workflow, and production build cap. No startup script, Spec Kit tooling, `.docs/` manifest or application change.

## Constitution Check

- `AGENTS.md` remains the sole governance authority.
- Required Spec Kit stages are represented by the specification, plan, task list and implementation.
- Memory Bank remains context only; the active-context status is corrected without adding governance rules.
- No production code, dependency, secret, deployment or application behavior is changed.
- No `.docs/` library files are modified.

## Project Structure

- `AGENTS.md` — full-read mandate, BOTH secrets and Memory Bank requirements, Spec Kit version-agnostic policy, dynamic Freebuff task groups, simplified ChatGPT tool guidance.
- `PR_SUBMISSION.md` — post-PR current-head report inspection and owner handoff.
- `__tests__/agent-governance-single-source.test.js` — dynamic manifest and governance/report regression assertions.
- `memory-bank/activeContext.md` — accurate current task and merged Lucky Meter status.
- `specs/206-agent-governance-pr-handoff/` — this feature's specification, plan and tasks.

## Complexity Tracking

No constitution violation or new system is introduced. Existing report and protected-file workflows are reused.
