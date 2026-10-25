# Tasks: Gemini Reviewer Fresh Base Checkout

**Input**: specs/053-gemini-reviewer-fresh-base-checkout/spec.md and plan.md

## Phase 1: Setup

- [x] T001 Inspect AGENTS.md, Jules governance, routed troubleshooting materials, the latest failed job, workflow YAML, and existing regression test.
- [x] T002 Verify run 40240151685 failed with the repeated syntax error after PR #1606 merged, and comment-triggered run 40240145268 succeeded.

## Phase 2: Foundational

- [x] T003 Confirm the reviewer-workflow test already checks trusted checkout and workflow permissions.

## Phase 3: User Story 1 — Use the current trusted base

**Independent test**: The workflow must use github.event.pull_request.base.ref || github.event.repository.default_branch, and the stale-SHA expression must not appear.

- [x] T004 [US1] Change the checkout ref in .github/workflows/gemini-reviewer.yml to resolve the current trusted base branch.
- [x] T005 [US1] Update the regression assertion in __tests__/gemini-reviewer-workflow.test.ts to enforce the new ref and reject the old SHA expression.
- [x] T006 [US1] Add spec, plan, tasks, and requirement-checklist artifacts; update active context and the canonical PR summary.
- [ ] T007 [US1] Run focused reviewer test, full pnpm test, and ./jules-verify.sh; record exact current-head CI results. These commands are not available in the current API-connected session.
- [ ] T008 [US1] After owner-controlled merge, trigger a fresh eligible pull_request_target event and confirm that the automatic reviewer proceeds past script startup. Do not merge this PR from an agent session.

## Dependencies and execution order

- T001–T003 establish the failure and intended trust boundary.
- T004–T006 implement the minimal workflow/test repair and required task artifacts.
- T007 depends on the proposed changes and actual CI evidence.
- T008 depends on an owner-controlled merge and a new automatic PR event, so it remains pending.

## Implementation strategy

Make only the checkout-ref change and its regression test. Preserve limited permissions and the trusted-code boundary. Use GitHub CI for verification and keep the repair PR open for owner review.
