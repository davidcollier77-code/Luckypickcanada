# Tasks: Startup Readiness Verification

**Input**: Design documents from specs/127-startup-readiness-verification/

**Prerequisites**: plan.md and spec.md.

## Phase 1: Specify

- [x] T001 Inspect AGENTS.md, all four Memory Bank paths, .docs/manifest.json, the existing startup command components, and current script inventory.
- [x] T002 Create the feature specification.

## Phase 2: Plan

- [x] T003 Create the implementation plan and bounded verification strategy.
- [x] T004 Create this dependency-ordered task list.

## Phase 3: Implement

- [ ] T005 Add scripts/verify-startup.sh to check required files, AGENTS.md references, and manifest structure.
- [ ] T006 Update .specify/feature.json to point to this active feature.

## Phase 4: Verify

- [ ] T007 Run bash -n and positive/negative script tests in a full repository checkout.
- [ ] T008 Run git diff --check and ./freebuff-verify.sh.
- [ ] T009 Review the complete diff and current-head PR CI; confirm no application, dependency, workflow, integration, deployment, or .docs content changed.
- [ ] T010 After merge, append `&& bash scripts/verify-startup.sh` to the existing Freebuff startup command without changing its current steps.

## Dependencies & Execution Order

- T001–T004 establish source facts and Spec Kit artifacts.
- T005–T006 implement the bounded repository change.
- T007–T009 are required verification gates.
- T010 is an owner-operated external setting update after merge.

## Implementation Strategy

Deliver one script/Spec Kit-only pull request. Keep the current startup command unchanged until the script is merged to the default branch. Do not merge the PR or alter Freebuff settings.
