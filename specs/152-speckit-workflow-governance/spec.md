# Feature Specification: Spec Kit Workflow Governance Alignment

**Feature Branch**: `governance/speckit-workflow-alignment-152`
**Created**: 2026-11-13
**Status**: In Progress

**Input**: Owner authorization to clarify the Spec Kit workflow in `AGENTS.md`, including all nine command definitions, the four core stages, completion of required template sections, change notification, and narrowly scoped governance updates when the workflow changes.

## User Scenarios & Testing

### User Story 1 — Freebuff follows the complete Spec Kit workflow (Priority: P1)

When Freebuff works on a repository-changing task, it follows all nine installed Spec Kit command definitions and their applicable instructions. It completes the four core stages in order and fills every required section, field and group in the applicable templates.

**Why this priority**: The repository's governance must accurately describe the workflow so required planning and implementation work is not skipped or misunderstood.

**Independent Test**: Inspect Section A.9 of `AGENTS.md` and the governance regression test. Confirm that all nine command names are covered, the four core stages are sequenced, supporting commands are conditional, and required template content is explicitly required.

**Acceptance Scenarios**:

1. **Given** the repository's installed Spec Kit 1.4.0 command set, **When** Freebuff starts a repository-changing task, **Then** it follows Specify, Plan, Tasks and Implement in that order and consults all nine command definitions for applicable instructions.
2. **Given** a template contains required, conditional and optional sections, **When** Freebuff creates the artifact, **Then** every required section is completed, conditional sections are completed when applicable, and optional sections are handled according to their instructions without invented content.
3. **Given** a Spec Kit update changes the core stages, their names or order, or required groups or sections, **When** Freebuff checks the installed version and command definitions, **Then** it notifies the owner, explains the change and impact, and makes only the authorized surgical correction to `AGENTS.md`.

### Edge Cases

- A Spec Kit version changes but the four core stages and required groups do not. Freebuff reports the version change and confirms whether the workflow itself changed.
- A supporting command is not relevant to a task. Freebuff follows the command's applicable instructions without mechanically running every supporting command.
- A template section is explicitly conditional or optional. Freebuff does not invent content to fill an irrelevant section.
- A required section cannot be completed from available information. Freebuff identifies the specific gap rather than silently leaving it incomplete.

## Requirements

### Functional Requirements

- **FR-001**: `AGENTS.md` MUST identify all nine installed command definitions and distinguish the four core stages—Specify, Plan, Tasks and Implement—from the five supporting commands—Clarify, Analyze, Checklist, Constitution and Converge.
- **FR-002**: Freebuff MUST complete the four core stages in that order for repository-changing tasks. Specify, Plan and Tasks MUST be completed before implementation.
- **FR-003**: Freebuff MUST complete every required section, field and group in each applicable template. Conditional content MUST be completed when applicable. Optional content MUST follow the command and template instructions; irrelevant content MUST NOT be invented.
- **FR-004**: Freebuff MUST follow supporting command definitions when their instructions or task requirements make them applicable, without mechanically running all five supporting commands for every task.
- **FR-005**: Before the workflow, Freebuff MUST check the installed Spec Kit version, all nine available command definitions, the core-stage names and order, and required template sections and groups against the recorded baseline.
- **FR-006**: If the version, command set, core stages, sequence or required groups change, Freebuff MUST notify the owner and explain the change and its effect on the workflow.
- **FR-007**: Freebuff is authorized to make only the necessary surgical update to `AGENTS.md` to keep it aligned with the current Spec Kit workflow. Unrelated governance and requirements MUST remain unchanged, and the exact update MUST be reported.
- **FR-008**: The governance regression test MUST enforce the updated workflow wording and verify that all nine command definition files remain present.

### Success Criteria

- **SC-001**: Section A.9 explicitly records the installed Spec Kit 1.4.0 baseline, all four core stages and all five supporting commands.
- **SC-002**: Section A.9 requires all required template content, distinguishes conditional and optional content, and prohibits invented content.
- **SC-003**: Section A.9 requires workflow-change notification and authorizes only a narrowly scoped correction to `AGENTS.md`.
- **SC-004**: The governance regression test asserts the new workflow rules and checks for all nine command files.
- **SC-005**: The PR changes no application behavior, visuals, dependencies, integrations, security controls or deployment configuration.

## Assumptions

- The repository's installed Spec Kit baseline is 1.4.0, as recorded in `.specify/init-options.json`, `.specify/integration.json` and the integration manifests.
- The four core stages and five supporting commands are the nine command definitions currently installed under `.freebuff/cmds/`.
- The owner has explicitly authorized this narrowly scoped `AGENTS.md` governance correction. The repository's protected-file authorization gate still applies before merge.
- A documentation-only governance change does not require a production build; the focused governance test and applicable repository verification remain relevant.
