# Tasks: Agent Integration and QA Guidance

**Input**: Design documents from specs/124-agent-integration-qa-guidance/

**Prerequisites**: plan.md and spec.md.

## Phase 1: Inspect and plan
- [x] T001 Confirm current main HEAD and check for duplicate active work.
- [x] T002 Read AGENTS.md, project Memory Bank, .docs/manifest.json, applicable task-group guidance and Playwright CLI guide.
- [x] T003 Inspect actual PR workflow definitions and record branch-protection access limitation.

## Phase 2: Update authoritative guidance
- [x] T004 Update the existing AGENTS.md integration list to the seven owner-confirmed integrations.
- [x] T005 Clarify Playwright CLI versus Browserless and summarize the eight existing Playwright capability areas.
- [x] T006 Update the QA contract with workflow-backed gate descriptions and conditional behavior.
- [x] T007 State the strict 495 MiB build cap and independently reviewable PR splitting requirement.
- [x] T008 Preserve production app, database, deployment and scheduled workflow configuration.

## Phase 3: Verification and handoff
- [x] T009 Review the generated file contents and confirm no Neon or Browserbase tool guidance remains in AGENTS.md.
- [ ] T010 Run ./freebuff-verify.sh, git diff --check and available local checks (BLOCKED: this session has GitHub API access but no repository shell).
- [ ] T011 Confirm PR CI results for the new HEAD after submission (PENDING).
- [x] T012 Prepare one canonical PR summary with exact changed files, evidence and outstanding checks.

## Dependencies and execution order
- T001–T003 precede the guidance edits.
- T004–T008 depend on the inspected baseline and are implemented as one cohesive documentation change.
- T009 follows the edits.
- T010–T011 are verification gates; local execution is blocked and CI evidence is pending.
- T012 records the actual implementation and verification status.

## Implementation Strategy
Keep the PR documentation-only. Do not modify workflows, application code, package files, production storage, hosting configuration or scheduled automation.
