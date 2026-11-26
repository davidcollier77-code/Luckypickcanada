# Feature Specification: Stale Runtime-Boundary Context Correction

**Feature Branch**: `223-stale-runtime-boundary-context-correction`
**Created**: 2026-11-26
**Status**: Implemented

## Goal

Remove the stale Spec 220 Memory Bank statement that incorrectly says ChatGPT-only `AGENTS.md` §6 prohibits repository shell scripts, dependency installs, builds and tests as a blanket rule.

## User Story 1 — Accurate future task context (Priority: P1)

As ChatGPT initializing future Luckypickcanada work, I need the Spec 220 Verification environment note to reflect the merged §6 boundaries so that I do not incorrectly block compatible verification and PR-support scripts.

**Independent Test**: Read the Spec 220 Verification environment bullet and compare it with the current ChatGPT-only §6.

**Acceptance Scenarios**:

1. **Given** the merged §6 permits compatible repository and Freebuff QA/PR-support scripts, **When** the Spec 220 entry is read, **Then** it states that only Node.js 26.x-dependent operations and the repository Playwright CLI/setup are blocked in this environment.
2. **Given** Spec 220 contains dependency research and implementation constraints, **When** the stale sentence is corrected, **Then** all unrelated Spec 220 details remain unchanged.

## Requirements

- **FR-001**: Replace only the stale blanket-prohibition sentence in the Spec 220 Verification environment bullet.
- **FR-002**: Preserve the rest of the Spec 220 entry and all unrelated historical context.
- **FR-003**: Record the correction in the current Active Context and durable Progress Memory Bank records.
- **FR-004**: Keep the change documentation-only; do not change AGENTS.md, application code, dependencies, workflows, deployment configuration or production resources.

## Success Criteria

- **SC-001**: No occurrence of the identified stale sentence remains in `memory-bank/activeContext.md`.
- **SC-002**: The replacement accurately distinguishes blocked Node.js 26.x-dependent operations and unavailable repository Playwright CLI/setup from permitted compatible scripts.
- **SC-003**: The surrounding Spec 220 context is byte-for-byte preserved apart from the targeted sentence and the new current-task header.

## Scope

Only the active Spec Kit pointer, this feature's Spec Kit artifacts and the two required Memory Bank records.
