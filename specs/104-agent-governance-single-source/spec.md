# Feature Specification: Single-Source Freebuff Governance

**Feature Branch**: freebuff/agent-governance-single-source-20261107
**Created**: 2026-11-07
**Status**: Review correction in progress
**Input**: User-authorized task to consolidate general agent governance into AGENTS.md, remove the redundant .freebuff/freebuff.md entrypoint, and align the saved Freebuff Master Work Request in the Library.

## User Scenarios & Testing

### User Story 1 — One authoritative governance file (Priority: P1)

As the repository owner, I want every coding agent, including Freebuff, to follow one authoritative AGENTS.md so general workflow and safety rules cannot drift between duplicate entrypoints.

**Why this priority**: Duplicated governance can become inconsistent and cause agents to follow stale instructions.

**Independent Test**: Inspect the repository and run the governance regression test; AGENTS.md is authoritative, the redundant entrypoint is absent, and every specialist task-group instruction remains present.

**Acceptance Scenarios**:

1. **Given** a Freebuff task begins, **When** the agent reads repository governance, **Then** it reads AGENTS.md as the sole general governance source.
2. **Given** the general Freebuff entrypoint is removed, **When** task groups are selected, **Then** the selected .freebuff/<group>.md instructions and .freebuff/cmds Spec Kit commands remain available.
3. **Given** external MCP tools are considered, **When** an MCP is connected or initialized but no tool action is invoked, **Then** that connection alone is not described as tool use.

### User Story 2 — Consistent master request (Priority: P1)

As the repository owner, I want the saved Freebuff Master Work Request to refer to AGENTS.md and selected specialist instructions, and to match the canonical PR-summary rules.

**Why this priority**: The reusable request must not reintroduce a deleted governance file or demand reporting that conflicts with repository governance.

**Independent Test**: Read the saved Library template and confirm it names AGENTS.md for general governance, retains selected task-group instructions, and requires one concise evidence-based PR-body summary rather than a separate report or per-document matrix.

**Acceptance Scenarios**:

1. **Given** the owner starts a task from the saved Master Work Request, **When** Freebuff reads the governance section, **Then** it is directed to AGENTS.md and applicable specialist group files only.
2. **Given** Freebuff completes a task, **When** it reports the work, **Then** it updates one canonical PR-body summary with actual verification states and does not create duplicate reports.


### User Story 3 — Reliable governance regression test (Priority: P1)

As a repository maintainer, I want the governance regression test to perform file reads only while its individual tests are running, so a missing or unreadable `AGENTS.md` produces a normal test failure instead of aborting the whole test module during import.

**Why this priority**: The regression test must be reliable and must report failures through Vitest's test runner.

**Independent Test**: Run `pnpm exec vitest run __tests__/agent-governance-single-source.test.js`; all four governance assertions pass, and the test module does not invoke filesystem reads during module initialization.

**Acceptance Scenarios**:

1. **Given** Vitest imports the governance test module, **When** module-level declarations execute, **Then** no `AGENTS.md` read is attempted.
2. **Given** a test needs governance text, **When** that individual test runs, **Then** it reads `AGENTS.md` inside the test callback and any read failure is reported as that test's failure.

## Edge Cases

- Historical specifications, past PR records, and completed task reports may mention .freebuff/freebuff.md; retain those historical records rather than rewriting them.
- The .freebuff directory must remain because it contains task-group guidance and Spec Kit command definitions.
- Do not change the separate production Jules API webhook integration or unrelated agent tooling.
- Do not remove the Memory Bank, .docs/manifest.json, Spec Kit configuration, or the verification gate.

## Requirements

### Functional Requirements

- **FR-001**: AGENTS.md MUST identify itself as the single authoritative repository governance source for all coding agents, including Freebuff.
- **FR-002**: AGENTS.md MUST NOT instruct agents to read .freebuff/freebuff.md.
- **FR-003**: The redundant .freebuff/freebuff.md file MUST be removed after its unique operational requirement is preserved in AGENTS.md.
- **FR-004**: All eight specialist task-group files and the existing .freebuff/cmds Spec Kit command definitions MUST remain intact.
- **FR-005**: AGENTS.md MUST preserve the instruction that MCP connection or initialization alone does not count as MCP use.
- **FR-006**: The saved Freebuff Master Work Request MUST direct agents to AGENTS.md and selected specialist task-group files without referencing the deleted entrypoint.
- **FR-007**: The saved Master Work Request MUST align PR reporting with AGENTS.md: one concise, evidence-based summary in the PR body; no separate report or per-resource USED/USEFUL/version matrix.
- **FR-008**: Historical specifications and completed PR/task records MUST remain unchanged unless they are active instructions.
- **FR-009**: The PR created for this task MUST remain open and unmerged.
- **FR-010**: The governance regression test MUST NOT read `AGENTS.md` at module scope or use an unimported lifecycle hook; each required file read MUST occur inside the test callback that needs it.

## Success Criteria

- **SC-001**: The repository contains no .freebuff/freebuff.md, and AGENTS.md contains no reference to that path.
- **SC-002**: A focused automated test passes and confirms the single-entrypoint rule, retained specialist groups, and preserved MCP-use clarification.
- **SC-003**: The saved Master Work Request contains no reference to .freebuff/freebuff.md and matches the PR-summary rules in AGENTS.md.
- **SC-004**: Existing specialist instructions, command definitions, verification scripts, and historical records are retained.
- **SC-005**: The PR remains open and unmerged for owner review.
- **SC-006**: The governance test passes without a module-scope file read or missing Vitest hook import.

## Assumptions

- AGENTS.md governs repository-wide workflow and safety for Freebuff.
- .freebuff/<group>.md files remain as specialist task-group instructions, not competing general governance.
- .freebuff/cmds remains the installed Spec Kit command directory.
- The Master Work Request is a saved Library artifact and is updated separately from the repository PR.