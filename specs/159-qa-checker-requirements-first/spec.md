# Feature Specification: QA Checker Requirements Before Task Specification

**Feature Branch**: `159-qa-checker-requirements-first`

**Created**: 2026-11-14

**Status**: Implemented

**Input**: Require repository agents to understand applicable QA checker expectations before writing task specifications, so tasks are scoped and designed to meet those requirements from the outset.

## User Scenarios & Testing

### User Story 1 — Agents plan against actual QA requirements (Priority: P1)

An agent preparing a repository-changing task identifies the QA checkers that will evaluate the proposed work and understands their actual requirements before drafting the task specification.

**Why this priority**: Without this knowledge, task scope and acceptance criteria can omit mandatory checks or conflict with existing safeguards.

**Independent Test**: Read AGENTS.md and verify it establishes checker review as a planning-stage prerequisite and requires checker expectations to inform task specification.

**Acceptance Scenarios**:

1. **Given** a task may affect files or behaviour covered by repository QA, **When** the agent begins task planning, **Then** the agent inspects applicable workflows, checker scripts, configurations, tests and written requirements before drafting the specification.
2. **Given** the applicable checkers have been inspected, **When** the agent defines the task, **Then** checker scope, triggers, inputs, evidence, thresholds, approval conditions and pass/fail behaviour inform the scope, constraints, acceptance criteria and verification plan.
3. **Given** a checker requirement is unclear, conflicting or appears insufficient, **When** the task is specified, **Then** the gap or conflict is recorded and material conflicts are raised with the owner before implementation.

### Edge Cases

- A task appears documentation-only but changes a protected governance or checker requirement.
- A checker name suggests a purpose that differs from its actual workflow or script behaviour.
- No applicable checker exists; the agent records that finding rather than inventing requirements.
- A requested change would weaken or bypass an existing check.

## Requirements

### Functional Requirements

- **FR-001**: AGENTS.md MUST establish applicable QA checker review as a prerequisite before task specification, not merely before implementation or submission.
- **FR-002**: Agents MUST inspect actual checker workflows, scripts, configurations, relevant tests and written requirements.
- **FR-003**: Agents MUST understand checker purpose, scope, triggers, inputs, evidence, thresholds, approval conditions and pass/fail behaviour.
- **FR-004**: Agents MUST use those findings to define task scope, constraints, implementation approach, acceptance criteria and verification plan.
- **FR-005**: Agents MUST record gaps or conflicts and raise material conflicts with the owner before implementation.
- **FR-006**: Agents MUST NOT weaken, bypass, suppress or redefine existing checks merely to make a task pass.
- **FR-007**: A governance regression test MUST guard the new AGENTS.md requirement.

## Success Criteria

- **SC-001**: The new planning-stage section appears in AGENTS.md before implementation guidance.
- **SC-002**: The governance regression test asserts the section title and key planning-stage requirements.
- **SC-003**: The PR changes only AGENTS.md, its governance regression test, and required Spec Kit/Memory Bank records.
- **SC-004**: No claim of local test success is made unless the test is actually executed.

## Assumptions

- Existing checker requirements remain authoritative; this change makes agents review and apply them earlier rather than changing checker behaviour.
- The existing protected-file authorization workflow and dedicated governance PR classifier remain in force.
- The task is documentation and governance focused; no application or checker implementation changes are required.
