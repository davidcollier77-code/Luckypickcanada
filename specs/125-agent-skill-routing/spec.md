# Feature Specification: Specialist Skill Routing

**Feature Branch**: `docs/agent-skill-routing-20261109`

**Created**: 2026-11-09

**Status**: Ready for review

**Input**: Owner-authorized request to add concise routing guidance for 14 specialist skills to the existing authoritative `AGENTS.md`, with explicit conflict investigation and resolution rules.

## User Scenarios & Testing

### User Story 1 - Agent selects the right specialist guidance (Priority: P1)

A coding agent can identify what each of the 14 skills is for and when to use it without loading every skill for every task.

**Why this priority**: Clear routing makes specialist guidance useful without creating a second or competing governance system.

**Independent Test**: Inspect the skill-routing section and verify all 14 requested skills appear once, each with exactly the two requested fields: "What it's used for" and "When to use it."

**Acceptance Scenarios**:
1. Given a task that matches one specialist area, when the agent reads the routing guide, then it can identify the relevant skill and its trigger.
2. Given a task that does not match a skill, when the agent selects skills, then it does not load unrelated guidance.

### User Story 2 - Agent resolves conflicting skill instructions (Priority: P1)

When two skills appear to disagree, the agent investigates the source and context of the disagreement, then selects the safest compatible approach instead of guessing or blindly stopping.

**Why this priority**: The user explicitly wants the agent to troubleshoot conflicts and decide the best solution while respecting repository governance.

**Independent Test**: Review the conflict-resolution rule and confirm it requires comparison of scope, assumptions, versions, actual project configuration and authoritative documentation, with escalation only when the conflict cannot be safely reconciled or requires approval.

**Acceptance Scenarios**:
1. Given overlapping skills with different recommendations, when the agent investigates the task context, then it chooses the least disruptive approach consistent with repository governance and records its rationale.
2. Given an irreconcilable conflict or an approach requiring new permissions or scope, when the agent reaches that point, then it pauses only the affected action and asks the owner.

### User Story 3 - Existing governance and tool routing remain intact (Priority: P1)

The agent uses the new skill guide without changing established Spec Kit, browser, integration, database, gatekeeper or updater behavior.

**Why this priority**: Specialist skills must supplement, not compete with, the project's established instructions and tools.

**Independent Test**: Compare the final diff with the baseline and verify existing governance and integration rules remain unchanged outside the intended skill-discovery/routing section.

**Acceptance Scenarios**:
1. Given a task requiring Spec Kit, when an execution skill is selected, then the four required stages remain in order.
2. Given browser work, when a skill mentions another browser tool, then the existing Playwright-first and Browserless-fallback policy remains authoritative.
3. Given a skill mentions an unavailable CLI or integration, when the agent considers using it, then it verifies availability before use.

## Edge Cases

- Two skills overlap but serve different phases of the same task.
- A skill is listed but is not installed in the current agent environment.
- A skill assumes a tool, integration or account permission that is not available.
- A skill's recommendation conflicts with the actual repository architecture or current official documentation.
- A proposed resolution would expand scope, add dependencies, change a provider or require owner approval.

## Requirements

### Functional Requirements

- **FR-001**: The existing `AGENTS.md` MUST contain all 14 requested skills: `frontend-design`, `web-design-guidelines`, `shadcn-ui`, `wrangler`, `verification-before-completion`, `executing-plans`, `security-review`, `github-actions-docs`, `canvas-design`, `systematic-debugging`, `workers-best-practices`, `extract-design-system`, `neon-postgres` and `performance`.
- **FR-002**: Each skill entry MUST contain exactly two concise fields: what it is used for and when to use it.
- **FR-003**: The guide MUST make repository governance, approved task scope, actual project configuration and authorized integrations take precedence over specialist skill suggestions.
- **FR-004**: When skill instructions conflict, the agent MUST investigate their purpose, scope, assumptions and version; inspect actual repository configuration and authoritative documentation; select the safest, least disruptive compatible approach; and record the rationale.
- **FR-005**: If a conflict cannot be safely reconciled or requires approval or scope expansion, the agent MUST pause only the affected action and ask the owner.
- **FR-006**: The guide MUST prohibit assuming a skill-mentioned tool, CLI, MCP, browser, service or integration is installed, connected, authenticated or available.
- **FR-007**: Existing Spec Kit, Playwright/Browserless, Cloudflare, Neon, PR gatekeeper and updater rules MUST remain intact.
- **FR-008**: `executing-plans` MUST NOT replace or bypass the required Specify → Plan → Tasks → Implement sequence.
- **FR-009**: The guide MUST remain within approximately 285 lines where practical, without removing existing governance to meet the target.
- **FR-010**: No application code, integration configuration, workflows, dependencies, secrets, database or deployment settings may be changed.

## Success Criteria

- **SC-001**: All 14 requested skill names appear exactly once in the specialist routing section.
- **SC-002**: Each of the 14 entries contains exactly the two required fields.
- **SC-003**: Conflict handling requires investigation and a reasoned decision, not arbitrary selection.
- **SC-004**: Existing governance and integration policies remain unchanged outside the intended routing update.
- **SC-005**: The updated `AGENTS.md` remains at or below approximately 285 lines.
- **SC-006**: The complete final diff contains only the approved governance, Spec Kit and Memory Bank files.

## Assumptions

- The 14 skill descriptions and routing boundaries were researched and agreed with the owner before implementation.
- Skills are optional specialist guidance, not a guarantee of tool availability or permission.
- The existing repository rules and project configuration remain authoritative.
- This is a documentation/governance task; no browser-visible application behavior changes.
