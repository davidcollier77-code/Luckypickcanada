# Feature Specification: Memory Bank Lifecycle and Cleanup

**Feature Branch**: `docs/memory-bank-maintenance-20261106`
**Created**: 2026-11-06
**Status**: Implementation prepared; repository verification pending
**Task groups**: `deep-dive` (audit existing context, history, and overlapping PR work); `testing` (check consistency and required evidence).

**Input**: Keep the Memory Bank useful and current without allowing it to become a diary or losing important project knowledge. Use a rolling 30-day working history, preserve older material when it remains important, and never leave active context empty or unclear.

## User Scenarios & Testing

### User Story 1 — Agents can quickly understand the project and current state (Priority: P1)
A coding agent reads the Memory Bank and can distinguish permanent project facts, current unfinished work, and completed milestones without searching through unrelated historical task logs.

**Independent Test**: Review the three files and confirm each fact is in the correct file, active context identifies current open work (or explicitly says none), and permanent project details remain available.

### User Story 2 — The Memory Bank stays concise without losing important knowledge (Priority: P1)
At task completion, completed work is summarized, duplicated or stale details are removed, and important older decisions or constraints are retained.

**Independent Test**: Compare the cleaned files with the previous records and verify that enduring project facts and important milestones survive while repetitive per-PR detail is consolidated.

## Requirements

- **FR-001**: `projectBrief.md` MUST contain lasting project purpose, architecture, product facts, and enduring experience constraints; it MUST NOT become a chronological task log.
- **FR-002**: `activeContext.md` MUST contain current unfinished work, open PRs, blockers, and unresolved decisions only. It MUST remain explicit and useful even when no work is active.
- **FR-003**: `progress.md` MUST be a concise record of meaningful completed milestones, normally covering approximately the most recent 30 days.
- **FR-004**: Entries older than 30 days MUST be retained when they preserve important architecture, product behavior, decisions, constraints, or lessons; age alone MUST NOT trigger deletion.
- **FR-005**: Related tasks and PRs MUST be consolidated where practical; routine command logs, duplicate implementation details, stale statuses, and speculative claims MUST NOT accumulate.
- **FR-006**: The Memory Bank MUST contain verified, non-secret information and MUST NOT override `AGENTS.md`.
- **FR-007**: The lifecycle policy MUST NOT impose an arbitrary file-size limit or remove context solely to meet a size target.

## Success Criteria

- **SC-001**: An agent can identify the purpose of each Memory Bank file and where new information belongs.
- **SC-002**: Active context contains only current work and clearly states the no-active-work case.
- **SC-003**: Progress is organized as consolidated milestones rather than a per-PR diary.
- **SC-004**: Important product, technical, and design facts remain available in the project brief.
- **SC-005**: The policy is stated once authoritatively in `AGENTS.md` and echoed briefly by the Freebuff entrypoint.

## Assumptions and Scope
- Thirty days is the normal working-history window, not an automatic deletion deadline.
- The task changes repository guidance and Markdown memory only; application behavior, dependencies, `.docs/`, workflows, payments, and deployment settings are out of scope.
- Current PR state must be checked live before future work; memory is a handoff, not proof of current GitHub status.
