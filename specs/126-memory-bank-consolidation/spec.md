# Feature Specification: Memory Bank Consolidation

**Feature Branch**: 126-memory-bank-consolidation

**Created**: 2026-11-09

**Status**: Implemented; verification pending

**Input**: Owner request to consolidate all four Memory Bank files, substantially reduce the oversized active-context and progress histories, and update AGENTS.md to read all four files.

## User Scenarios & Testing

### User Story 1 — Load useful project context (Priority: P1)

An agent starting work can understand the project's purpose, current state, technical architecture and meaningful history from four concise Memory Bank files without reading hundreds or thousands of lines of stale task logs.

**Why this priority**: The Memory Bank is loaded during initialization. Excessive, duplicated or stale content wastes context and can mislead implementation.

**Independent Test**: Inspect all four files and confirm each has a distinct purpose, current verified facts and no repeated task transcript.

**Acceptance Scenarios**:
1. **Given** a new agent session, **When** it reads the four Memory Bank files, **Then** it can identify project purpose, current context, technical stack and significant milestones.
2. **Given** completed work recorded in history, **When** it is consolidated, **Then** meaningful milestones remain while transient PR logs and repeated status notes are removed.

### User Story 2 — Initialize all four files (Priority: P1)

An agent follows repository governance and reads all four Memory Bank files once during initialization.

**Why this priority**: Two files alone omit the technical context and meaningful project history.

**Independent Test**: Inspect the initialization section in AGENTS.md and confirm it explicitly names all four Memory Bank paths.

**Acceptance Scenarios**:
1. **Given** the agent reads AGENTS.md, **When** it reaches project-context initialization, **Then** it is instructed to read projectBrief.md, activeContext.md, techContext.md and progress.md.
2. **Given** Memory Bank content conflicts with repository state or governance, **When** the agent begins a task, **Then** AGENTS.md and the live repository remain authoritative.

## Edge Cases

- A previously active PR may already have merged; current state must be checked rather than copied from stale memory.
- Historical verification metrics may no longer be current; retain them only as dated historical evidence or omit them.
- Environment-variable names may have changed; do not preserve unverified inventories.
- The four files must remain distinct and concise rather than collapsing into one document.
- No secret values may be added.

## Requirements

### Functional Requirements

- **FR-001**: The four Memory Bank files MUST each have a distinct, clearly stated purpose.
- **FR-002**: activeContext.md MUST describe current repository state and the current task only; completed task transcripts MUST be removed or summarized.
- **FR-003**: progress.md MUST retain significant completed project milestones while removing repetitive PR/CI logs and obsolete task checklists.
- **FR-004**: projectBrief.md MUST retain stable product purpose, core experiences, scope and platform identity.
- **FR-005**: techContext.md MUST retain verified current stack, architecture, testing tools and hard technical constraints.
- **FR-006**: techContext.md MUST correctly identify the 495 MiB limit as the production build-output cap, not a .docs directory limit.
- **FR-007**: AGENTS.md MUST instruct agents to read all four Memory Bank files once during initialization.
- **FR-008**: AGENTS.md changes MUST be limited to the four-file initialization instruction; no general governance rewrite is in scope.
- **FR-009**: Memory Bank content MUST NOT override or duplicate AGENTS.md, contain secrets, or present unverified state as fact.
- **FR-010**: No application code, UI, assets, workflows, dependencies, integrations, deployment settings or production data may change.

## Success Criteria

- **SC-001**: activeContext.md is reduced from 2,289 lines to fewer than 100 lines.
- **SC-002**: progress.md is reduced from 796 lines to fewer than 120 lines while retaining at least ten significant dated milestones.
- **SC-003**: projectBrief.md and techContext.md each remain fewer than 70 lines.
- **SC-004**: AGENTS.md names all four Memory Bank files in its initialization step and has no unrelated changes.
- **SC-005**: A content review confirms no obsolete task is represented as active and no unsupported current-state or environment claim is introduced.
- **SC-006**: The complete diff changes only the four Memory Bank files, the targeted AGENTS.md line, the feature pointer and this feature's Spec Kit artifacts.

## Assumptions

- GitHub main is the source of truth for current repository and PR state.
- Existing commit, PR and workflow history remains available in GitHub; Memory Bank does not need to duplicate it.
- This is a documentation-only task with no application runtime or rendered-output change.
- The 495 MiB production build cap remains unchanged and authoritative in AGENTS.md.
