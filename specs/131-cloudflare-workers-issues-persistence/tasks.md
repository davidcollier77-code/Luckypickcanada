# Tasks: Keep Cloudflare Workers Issues Enabled Across Deployments

**Input**: Design documents from `specs/131-cloudflare-workers-issues-persistence/`

**Prerequisites**: plan.md and spec.md

**Tests**: No new test file was requested for this one-setting configuration change. Existing CI performs unit tests, TypeScript validation, Wrangler/OpenNext validation and Spec Kit governance checks.

## Phase 1: Setup

**Purpose**: Confirm existing configuration and deployment constraints.

- [X] T001 Inspect the existing observability block and confirm the repository's Wrangler version in `wrangler.jsonc` and package configuration.

## Phase 2: Foundational

**Purpose**: Preserve the existing deployment and forwarding path.

- [X] T002 Confirm the existing Cloudflare issue forwarding route and keep credentials, destinations, resolver logic, and updater scheduler out of scope.

## Phase 3: User Story 1 - Preserve issue detection after deployment (Priority: P1)

**Goal**: Ensure normal Wrangler deployments explicitly keep the Workers Issues detector enabled.

**Independent Test**: Validate the Wrangler configuration and confirm the PR diff is limited to the intended setting.

- [X] T003 [US1] Add `observability.issues.enabled: true` while retaining `observability.enabled: true` in `wrangler.jsonc`.
- [ ] T004 [US1] Pass current-head repository verification through `./freebuff-verify.sh` and the applicable checks in `.github/workflows/visual-qa.yml`, `.github/workflows/devskim.yml`, and the existing OpenNext validation workflow.
- [ ] T005 [US1] After deployment of `wrangler.jsonc`, confirm Workers Issues remains enabled in the Cloudflare dashboard and verify a test issue reaches GitHub through the existing route.

## Dependencies & Execution Order

- T001 and T002 establish the existing configuration and scope.
- T003 implements the single configuration change.
- T004 depends on the updated PR head and must pass before merge.
- T005 depends on merge/deployment and requires Cloudflare account-side access.

## Parallel Opportunities

No implementation tasks need parallel execution; all tasks concern one configuration file and sequential verification.

## Implementation Strategy

Complete the single configuration change, pass all applicable current-head CI gates, merge only after the owner authorizes it, then verify the live Cloudflare detector and existing forwarding route.

## Notes

- The PR's initial Visual QA run failed specifically because no changed Spec Kit feature artifacts were present. Unit tests and TypeScript passed; browser visual tests were skipped by the classifier for this configuration-only change.
- Task T004 remains open until the new artifacts are pushed and repository verification passes.
- Task T005 remains open until after deployment and live Cloudflare verification.
