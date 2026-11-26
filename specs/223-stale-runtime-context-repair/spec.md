# Feature Specification: Correct Stale Spec 220 Runtime Context

**Feature Branch**: `docs/2042-runtime-context-repair`
**Created**: 2026-11-26
**Status**: Implemented

## User Scenarios & Testing

### User Story 1 — Read accurate active task context (Priority: P1)

A future ChatGPT session reads the Spec 220 entry in the Memory Bank and sees the same execution boundaries as the authoritative current `AGENTS.md`.

**Why this priority**: The stale sentence directly contradicted the newly clarified script permissions and could cause future work to be incorrectly blocked.

**Independent Test**: Read the Spec 220 verification-environment entry and compare its runtime and script-permission wording with current `AGENTS.md` §6.

**Acceptance Scenarios**:
1. **Given** the Spec 220 entry is read, **When** ChatGPT checks the execution boundary, **Then** it distinguishes Node.js 26-dependent operations and the repository Playwright CLI/setup from other compatible scripts.
2. **Given** the existing Node.js 22.x, missing pnpm and no-checkout facts, **When** the entry is corrected, **Then** those environment facts remain unchanged.

## Requirements

- **FR-001**: Replace the stale blanket-prohibition sentence in `memory-bank/activeContext.md` with wording aligned to current `AGENTS.md` §6.
- **FR-002**: Preserve the surrounding Spec 220 facts, task status, dependency findings and implementation constraints.
- **FR-003**: Do not change application code, dependencies, deployment configuration, Cloudflare settings or production resources.
- **FR-004**: Record the correction in the Spec Kit artifacts and durable progress history.

## Success Criteria

- **SC-001**: The exact stale sentence is absent from the Spec 220 active-context entry.
- **SC-002**: The replacement states that Node.js 26-dependent project operations and the repository Playwright CLI/setup are blocked, while other compatible repository and Freebuff verification/PR-support scripts remain permitted subject to their prerequisites and side effects.
- **SC-003**: Existing Node.js 22.x, pnpm and repository-checkout facts are preserved.

## Assumptions

- Current `AGENTS.md` §6 is authoritative and takes precedence over stale Memory Bank wording.
- This is a documentation-only correction to a confirmed review finding; no wider Memory Bank consolidation is authorized.
