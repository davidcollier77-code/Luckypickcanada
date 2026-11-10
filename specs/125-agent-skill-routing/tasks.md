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
- [x] T015 Align the governance test and AGENTS.md with the actual supported browser tools: project-local Playwright CLI/Test and connected Browserless only; do not list Browserbase.
- [x] T016 Extend the existing fail-closed visual classifier to skip browser provisioning only for .specify/feature.json and direct-child __tests__/*.test.{js,jsx,ts,tsx} unit tests; retain Playwright for visual/e2e and unknown paths.
- [ ] T017 Confirm the full unit suite and updated-head CI; verify the non-rendering PR skips Chromium/baseline/visual regression but still runs unit tests, TypeScript and repository verification.

## Dependencies and execution order

- T001–T003 precede design and edits.
- T004–T007 form one cohesive documentation change.
- T008–T009 follow implementation.
- T010–T011 are verification gates; local execution is blocked and updated-head CI evidence is pending.
- T013 fixes the test clock deterministically; T014 depends on the updated-head CI run.
- T012 records the PR handoff and must remain OPEN and UNMERGED.

## Implementation Strategy

Keep the change within the approved governance documentation plus the single targeted unit-test correction. Do not modify application runtime code, integrations, GitHub workflows, package files, production storage, hosting configuration, secrets or scheduled updater systems. Report unavailable local verification honestly and use PR CI for supported repository checks.


## Supporting CI Classification Follow-up

- [x] T018 Align the browser-tool governance test and `AGENTS.md` with the actual supported tools: project-local Playwright CLI/Test and connected Browserless only; do not list Browserbase.
- [x] T019 Extend the existing fail-closed visual classifier for `.specify/feature.json`, `.github/scripts/classify-visual-changes.sh`, and direct-child `__tests__/*.test.{js,jsx,ts,tsx}` unit tests so this non-rendering governance PR can skip browser provisioning without skipping unit tests, TypeScript or repository verification.
- [x] T020 Add classifier tests for the new non-rendering paths and preserve visual-required behavior for browser/e2e, application, asset, theme, workflow, other script, unknown, empty and mixed changes.
- [x] T021 Confirm run 42737280254 classified this change set as non-rendering and skipped Chromium, baseline and Playwright visual-regression steps; all 462 other unit tests passed.
- [x] T022 Correct the stale governance-test assertion to match the exact authoritative AGENTS.md wording: `MUST NOT add or invoke Browserless`.
- [ ] T023 Confirm the full unit suite, Spec Kit gate, TypeScript and repository checks pass on the new commit.
