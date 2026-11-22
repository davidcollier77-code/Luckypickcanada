# Feature Specification: Agent Governance and PR Handoff

**Feature Branch**: `206-agent-governance-pr-handoff`

**Created**: 2026-11-21

**Status**: Approved for implementation

**Input**: Owner-authorized governance update for ChatGPT and Freebuff.

## User Scenarios & Testing

### User Story 1 — Clear agent instruction applicability (Priority: P1)

An agent beginning repository work reads the complete governance document and applies only the requirements classified for that agent.

**Independent Test**: The opening instructions require full-document reading; tests protect BOTH / FREEBUFF ONLY / CHATGPT ONLY separation and preserve Freebuff's independent Playwright procedure.

### User Story 2 — Secret-safe repository work (Priority: P1)

Both agents handle implementation, diagnostics, tests and reporting without exposing credentials or sensitive configuration.

**Independent Test**: Governance assertions require secret-safe handling in source, diffs, logs, test fixtures, screenshots, generated artifacts, documentation and PR reporting.

### User Story 3 — Current, maintainable context and task routing (Priority: P1)

Agents load the four core Memory Bank files and derive task-group categories from the current manifest, while distinguishing specialist reference files.

**Independent Test**: Tests derive task groups from `.docs/manifest.json` and verify that manifest groups have matching `.freebuff/` files without fixing a category count.

### User Story 4 — Accurate post-PR verification handoff (Priority: P1)

After opening a PR, the agent inspects the consolidated verification report for the exact current head and reports all seven category outcomes without treating missing or stale evidence as a pass.

**Independent Test**: PR submission assertions require current-head matching, all seven categories, transparent non-PASSED outcomes, separate owner approvals and no merge.

## Requirements

### Functional Requirements

- **FR-001**: Governance MUST require the complete `AGENTS.md` document to be read, understood and followed before repository work.
- **FR-002**: Agent applicability MUST be determined by the existing colour classifications and MUST NOT transfer Freebuff-only instructions to ChatGPT or ChatGPT-only instructions to Freebuff.
- **FR-003**: Both agents MUST protect all secrets and sensitive configuration and MUST NOT expose secret values in code, diagnostics, evidence, tests, screenshots, documentation or PR communication.
- **FR-004**: Both agents MUST read and health-check the four core Memory Bank files, while treating current repository state and `AGENTS.md` as authoritative.
- **FR-005**: Freebuff task-group categories MUST be derived dynamically from `.docs/manifest.json` and matching `.freebuff/<group>.md` files; unlisted `.freebuff/` documents MUST remain specialist/reference documents unless separately routed.
- **FR-006**: Spec Kit guidance MUST follow the current installed tooling and repository definitions without pinning a version or command count.
- **FR-007**: ChatGPT browser guidance MUST state its Playwright execution limitation and allow available retrieval/browser tools to be used sparingly, without redefining Freebuff's Playwright instructions.
- **FR-008**: `PR_SUBMISSION.md` MUST require inspection of the existing consolidated seven-category report after PR creation and exact current-head SHA matching.
- **FR-009**: Missing, stale, skipped, cancelled, incomplete or unavailable report evidence MUST never be represented as a pass.
- **FR-010**: Agents MUST hand report outcomes and approval commands to the owner, MUST NOT self-approve or merge, and MUST NOT autonomously repair post-submission findings without a new explicit instruction.

## Success Criteria

- **SC-001**: Both agent classes have unambiguous and test-protected scope classifications.
- **SC-002**: The secret-handling rule covers implementation, execution evidence and reporting surfaces.
- **SC-003**: Task-group tests adapt when `.docs/manifest.json` adds or removes group keys.
- **SC-004**: The post-submission procedure checks all seven categories against the live PR head and explicitly reports non-PASSED outcomes.
- **SC-005**: Existing protected-file authorization, digest approvals, build-size limit, CI QA and Freebuff Playwright behavior remain intact.

## Assumptions

- `.docs/manifest.json` remains the authoritative list of reference groups; matching `.freebuff/` documents define task-group instruction files.
- The existing PR Verification Report workflow and current-head audit are retained rather than replaced.
- The separate protected-file GitHub Environment and `/approve-governance <digest>` comment remain independent approval gates.
- The ChatGPT startup Library instructions will be reviewed in a separate owner-directed task.
