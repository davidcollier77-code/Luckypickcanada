# Feature Specification: Freebuff Playwright Agent Guidance

**Feature Branch**: `docs/playwright-agentmd-guidance-20261115`

**Created**: 2026-11-15

**Status**: Implemented; verification and owner approval pending

**Input**: User request to add concise, Freebuff-only Playwright mode and CLI guidance to AGENTS.md, including a ChatGPT exclusion and permission for Freebuff to maintain setup scripts when the environment changes. The repository owner subsequently authorized a narrowly scoped continuation of already-submitted PR #1908 to consolidate QA-checker governance, require independent final self-review, and define a direct-human-instruction exception to the post-submission hard stop.

## User Scenarios & Testing

### User Story 1 - Select the correct browser-testing path (Priority: P1)

Freebuff can identify the interactive CLI launcher, the standard Playwright mode and the opt-in SwiftShader investigation mode. ChatGPT is explicitly excluded from the repository CLI and its setup scripts.

**Why this priority**: The guidance prevents accidental use of the wrong rendering mode and separates Freebuff's managed CLI environment from ChatGPT's browser workflow.

**Independent Test**: Inspect AGENTS.md and confirm all mode commands, their purposes, the ChatGPT exclusion and script-maintenance authority are explicit.

**Acceptance Scenarios**:

1. **Given** Freebuff is performing normal QA or CI testing, **When** it reads the guidance, **Then** it selects Option A.
2. **Given** Freebuff is investigating software-rendered graphics behaviour, **When** it reads the guidance, **Then** it selects Option B and understands it is not a physical-GPU performance measurement.
3. **Given** Freebuff needs an interactive browser session, **When** it reads the guidance, **Then** it uses the repository CLI launcher and maintains its setup scripts when environment changes require it.
4. **Given** ChatGPT reads the same governance file, **When** it encounters this section, **Then** it does not use, load, modify or maintain the repository Playwright CLI system or its startup scripts.

### User Story 2 - Apply QA requirements before specification and before submission (Priority: P1)

The agent inspects applicable QA checker definitions before specifying work, uses their actual requirements to shape the task, and independently reviews the completed implementation and full diff against those requirements before PR submission. A CI result does not replace this review.

**Why this priority**: Checker requirements must influence task design rather than being discovered after implementation, and independent review must catch unmet requirements before submission.

**Independent Test**: Inspect AGENTS.md, PR_SUBMISSION.md and the governance regression test for one authoritative planning requirement and an explicit final self-review requirement.

**Acceptance Scenarios**:

1. **Given** a proposed task may be evaluated by repository QA infrastructure, **When** the agent prepares its specification, **Then** it inspects the applicable workflows, scripts, configurations, tests, evidence, thresholds and approval rules first.
2. **Given** implementation is complete, **When** the agent prepares submission, **Then** it reviews the complete diff against every applicable checker requirement, resolves in-scope gaps or records exact blockers, and does not substitute CI status for this review.

### User Story 3 - Resume a submitted PR only on direct owner instruction (Priority: P1)

The agent stops after successful PR submission. It may resume work on that PR only when the repository owner directly instructs it to continue or make specified changes; the exception is limited to the expressly authorized work and does not waive any approval or QA gate.

**Why this priority**: The hard stop prevents unapproved post-submission scope changes while allowing the owner to authorize a precise exception.

**Independent Test**: Inspect PR_SUBMISSION.md and the governance regression test for a direct-owner-only exception and explicit rejection of inferred permission.

**Acceptance Scenarios**:

1. **Given** a submitted PR remains open or receives comments or CI findings, **When** no direct owner instruction authorizes further work, **Then** the agent stops and does not change the PR.
2. **Given** the repository owner directly instructs the agent to make specified changes to an existing PR, **When** the agent resumes, **Then** it performs only that work, retains all scope and approval gates, updates the handoff and stops again.

### Edge Cases

- The standard and SwiftShader commands must remain distinct; normal QA and CI must not silently switch to SwiftShader.
- A change to Freebuff's runtime or dependencies may invalidate startup scripts; Freebuff must verify and maintain only the relevant setup scripts.
- The ChatGPT exclusion applies to the repository CLI system, not to the separate browser-tool exception governing ChatGPT's browser access.

## Requirements

### Functional Requirements

- **FR-001**: AGENTS.md MUST state that the Playwright CLI guidance applies to Freebuff only and explicitly exclude ChatGPT from using, loading, modifying or maintaining the repository CLI and associated startup scripts.
- **FR-002**: AGENTS.md MUST identify the interactive CLI launcher and document Option A (standard) and Option B (SwiftShader), including their commands and purposes.
- **FR-003**: AGENTS.md MUST state that standard QA and CI continue to use Option A and that SwiftShader does not measure physical GPU performance.
- **FR-004**: AGENTS.md MUST direct Freebuff to verify and maintain relevant startup, browser-runtime and CLI setup scripts when environment, dependency or browser-runtime changes affect them.
- **FR-005**: The Playwright guidance MUST remain limited to governance instructions and its focused regression guard; it MUST NOT change browser scripts, test configurations, CI workflows or application behavior.
- **FR-006**: AGENTS.md MUST require inspection of applicable QA checker definitions before task specification, including actual scope, triggers, inputs, evidence, thresholds, approvals and pass/fail behaviour.
- **FR-007**: AGENTS.md and PR_SUBMISSION.md MUST require an independent pre-submission review of the completed implementation and complete diff against every applicable checker requirement; CI results MUST NOT substitute for this review.
- **FR-008**: PR_SUBMISSION.md MUST permit continuation on an already-submitted PR only after a clear, direct instruction from the repository owner; the exception MUST be limited to the expressly authorized work and MUST NOT waive any repository gate.
- **FR-009**: The governance regression test MUST guard the QA-planning requirement, final self-review requirement, owner-directed exception and prohibition on inferred permission.

## Success Criteria

### Measurable Outcomes

- **SC-001**: The new AGENTS.md section identifies all three browser paths: interactive CLI, standard Playwright and SwiftShader.
- **SC-002**: The ChatGPT restriction and Freebuff maintenance responsibility are explicit and unambiguous.
- **SC-003**: The governance regression suite contains assertions for each required instruction.
- **SC-004**: No browser runtime, Playwright configuration, CI workflow or application file is changed.
- **SC-005**: QA checker requirements are documented as an input to task specification and as an independent pre-submission review requirement, with no duplicate generic QA summary section.
- **SC-006**: The post-submission exception requires direct repository-owner instruction and explicitly rejects permission inferred from an open PR, comments, CI results or review findings.
- **SC-007**: The governance regression test asserts the consolidated requirements; unavailable test execution is recorded as NOT RUN, never as PASS.

## Assumptions

- Existing Playwright commands and configuration names are correct and remain unchanged.
- README.md remains the detailed setup reference; AGENTS.md contains only concise operational rules.
- ChatGPT's existing browser-tool exception remains separate from Freebuff's repository CLI system.
