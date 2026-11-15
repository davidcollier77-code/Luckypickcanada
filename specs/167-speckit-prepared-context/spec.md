# Feature Specification: Use Prepared Context in Spec Kit Stages

**Feature Branch**: `chore/speckit-use-prepared-context`

**Created**: 2026-11-15

**Status**: Implemented

**Input**: Owner request: Remove duplicate setup-script and extension-hook execution instructions from the four core Spec Kit command definitions. Freebuff completes repository preparation before entering Spec Kit; the stages must use that prepared context instead of rerunning preparation.

## User Scenarios & Testing

### User Story 1 - Continue from Freebuff's prepared context (Priority: P1)

Freebuff completes repository preparation before invoking the Spec Kit stages. Each stage uses the existing branch, feature directory, required files and prepared template/context information without rerunning setup scripts.

**Why this priority**: Repeating preparation inside Spec Kit duplicates work and can create unnecessary or conflicting setup.

**Independent Test**: Review each of the four command definitions and confirm that it obtains its required inputs from existing repository files or prepared context and does not instruct the agent to rerun a setup script.

**Acceptance Scenarios**:

1. **Given** Freebuff has prepared the repository and feature context, **When** a core Spec Kit stage starts, **Then** it uses that context and does not rerun its setup, resolver or prerequisite script.
2. **Given** a required prepared path, file or template is missing, **When** the stage needs that prerequisite, **Then** it reports the exact missing item and stops that stage rather than rerunning preparation.

### User Story 2 - Preserve the four-stage workflow (Priority: P1)

The specify, plan, tasks and implement stages continue to produce their required artifacts and perform their existing substantive work.

**Why this priority**: Removing duplicate preparation must not weaken or remove the development workflow.

**Independent Test**: Compare the updated command definitions with their prior responsibilities and confirm that specification quality, technical planning, task generation, implementation sequencing and completion validation remain.

**Acceptance Scenarios**:

1. **Given** the required inputs are available, **When** each stage runs, **Then** it performs its original stage responsibilities and produces or updates its required artifact.
2. **Given** a stage previously included extension-hook dispatch instructions, **When** the updated stage runs, **Then** it does not dispatch configured hooks or command hooks.

### Edge Cases

- The prepared feature pointer or required feature artifacts are absent, invalid or incomplete.
- A prepared template value is unavailable and the standard repository template must be read directly.
- Repository configuration indicates additional template layers that cannot be determined from the available files; the stage must report the missing context rather than run a resolver.
- A stage is invoked without the required preceding-stage artifact; it must report the prerequisite rather than recreate setup.

## Requirements

### Functional Requirements

- **FR-001**: The four core command definitions MUST NOT instruct Freebuff to rerun setup, template-resolver or prerequisite scripts.
- **FR-002**: The four core command definitions MUST NOT dispatch or execute configured pre-stage or post-stage extension hooks.
- **FR-003**: Each stage MUST use the existing branch, feature context, prepared paths, templates and artifacts supplied or created before that stage.
- **FR-004**: If required prepared context or an artifact is missing, the stage MUST report the exact missing prerequisite and stop rather than rerun preparation.
- **FR-005**: Specify MUST retain specification creation, template structure, quality validation and checklist responsibilities.
- **FR-006**: Plan MUST retain technical planning, constitution checks, research and design-artifact responsibilities.
- **FR-007**: Tasks MUST retain dependency-ordered, user-story-based task generation and required task formatting.
- **FR-008**: Implement MUST retain task execution, dependency ordering, checklist review and implementation validation.
- **FR-009**: Changes MUST be limited to the four core command definitions and the Spec Kit feature artifacts required by repository governance. `AGENTS.md`, the constitution, templates, scripts and unrelated files MUST remain unchanged.

### Key Entities

- **Prepared feature context**: Existing branch, feature directory, feature pointer, paths, templates and design artifacts prepared before the relevant Spec Kit stage.
- **Core Spec Kit stages**: Specify, Plan, Tasks and Implement command definitions.

## Success Criteria

### Measurable Outcomes

- **SC-001**: All four core command definitions contain no instructions to execute their former setup, resolver or prerequisite scripts.
- **SC-002**: All four core command definitions contain no pre-stage or post-stage extension-hook dispatch procedures.
- **SC-003**: All four core stage responsibilities and required outputs remain represented.
- **SC-004**: The pull request changes no files outside the four command definitions and the required feature spec, plan and tasks artifacts.
- **SC-005**: `AGENTS.md` remains unchanged.

## Assumptions

- Freebuff performs the required repository preparation before starting the Spec Kit workflow.
- The existing repository feature pointer and prepared artifacts are the source of stage context.
- The standard templates remain available under `.specify/templates/`.
- This documentation-only workflow change does not require a production build; applicable repository checks still run through the normal PR workflow.
