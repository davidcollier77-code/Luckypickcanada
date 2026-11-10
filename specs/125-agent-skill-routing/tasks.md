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
- [ ] T011 Confirm updated-head PR CI results. Previous head failed two date-dependent allowance tests in Visual QA run 42732428053; the clock fixture correction is committed and new-head CI is pending.
- [x] T012 Complete the final PR diff audit, publish the canonical PR summary, and confirm PR #1795 is OPEN and UNMERGED.

## Phase 4: Repair date-dependent CI tests

- [x] T013 Freeze Vitest system time to the fixed fixture date in the two affected `__tests__/crystal-ball-daily-usage.test.js` cases; restore real timers after each test. Do not change production date handling.
- [ ] T014 Re-run the targeted Crystal Ball allowance and Oracle tests, then confirm all applicable updated-head PR CI gates (PENDING: GitHub Actions must run on the latest HEAD).

## Dependencies and execution order

- T001–T003 precede design and edits.
- T004–T007 form one cohesive documentation change.
- T008–T009 follow implementation.
- T010–T011 are verification gates; local execution is blocked and updated-head CI evidence is pending.
- T013 fixes the test clock deterministically; T014 depends on the updated-head CI run.
- T012 records the PR handoff and must remain OPEN and UNMERGED.

## Implementation Strategy

Keep the change within the approved governance documentation plus the single targeted unit-test correction. Do not modify application runtime code, integrations, GitHub workflows, package files, production storage, hosting configuration, secrets or scheduled updater systems. Report unavailable local verification honestly and use PR CI for supported repository checks.
