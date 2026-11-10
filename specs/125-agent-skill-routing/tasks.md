# Tasks: Specialist Skill Routing

**Input**: Design documents from `specs/125-agent-skill-routing/`

**Prerequisites**: plan.md and spec.md.

## Phase 1: Inspect and plan

- [x] T001 Read AGENTS.md first and inspect current repository state, active work and relevant prior skill/governance artifacts.
- [x] T002 Read projectBrief.md, activeContext.md, .docs/manifest.json, Spec Kit constitution/templates and the four Spec Kit command definitions.
- [x] T003 Confirm no task group or individual .docs reference document materially applies; classify the task as governance/documentation-only.

## Phase 2: Update authoritative guidance

- [x] T004 Replace the existing long skill-discovery example list with a concise pointer to one specialist routing section while preserving discovery of other relevant installed skills.
- [x] T005 Add all 14 requested skills, each with exactly the two required fields, grouped by practical area.
- [x] T006 Add governance precedence, tool-availability safeguards and an investigate/reconcile/decide conflict-resolution rule.
- [x] T007 Preserve the established Spec Kit, Playwright/Browserless, Cloudflare, Neon, PR gatekeeper, updater and approval instructions.

## Phase 3: Verify and hand off

- [x] T008 Inspect the updated AGENTS.md content; confirm all 14 skill names occur exactly once in the routing section and the file is 271 lines.
- [x] T009 Create the required feature specification, plan and task records and update the feature pointer.
- [ ] T010 Run ./freebuff-verify.sh, git diff --check and available local checks (BLOCKED: this session has GitHub API access but no repository shell).
- [ ] T011 Confirm PR CI results for the new PR HEAD (PENDING until GitHub workflows complete).
- [ ] T012 Complete final PR diff audit, publish one canonical PR summary, and confirm the PR remains OPEN and UNMERGED.

## Dependencies and execution order

- T001–T003 precede design and edits.
- T004–T007 form one cohesive documentation change.
- T008–T009 follow implementation.
- T010–T011 are verification gates; local execution is blocked and CI evidence is pending.
- T012 follows PR creation and current-head review.

## Implementation Strategy

Keep the change documentation-only. Do not modify application code, integrations, GitHub workflows, package files, production storage, hosting configuration, secrets or scheduled updater systems. Report unavailable local verification honestly and use PR CI for supported repository checks.
