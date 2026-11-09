# Tasks: Playwright CLI Agent Toolkit

**Input**: `specs/122-playwright-cli-agent-toolkit/`
**Prerequisites**: `spec.md`, `plan.md`
**Tests**: Static integrity coverage is required.

## Phase 1: Setup

- [x] T001 Confirm feature 122 is next and create `specs/122-playwright-cli-agent-toolkit/`; do not duplicate completed evaluation feature 108.
- [x] T002 Record the pinned Microsoft CLI v0.1.23 source and commit in `.agents/skills/playwright-cli/UPSTREAM.md`.
- [x] T003 Preserve the upstream Apache-2.0 license in `.agents/skills/playwright-cli/LICENSE`.

## Phase 2: Foundational

- [x] T004 Vendor and adapt the official skill entrypoint in `.agents/skills/playwright-cli/SKILL.md`.
- [x] T005 Vendor all ten official guides in `.agents/skills/playwright-cli/references/`.

## Phase 3: User Story 1 — Discoverable official skill (P1)

**Goal**: Make the full upstream skill available in a fresh checkout.
**Independent Test**: The skill, ten linked references, license and upstream provenance are present.

- [x] T006 [US1] Add the linked Microsoft skill entrypoint and repository command guidance in `.agents/skills/playwright-cli/SKILL.md`.
- [x] T007 [P] [US1] Add every upstream specialist guide in `.agents/skills/playwright-cli/references/`.

## Phase 4: User Story 2 — Eight browser-work capabilities (P1)

**Goal**: Document all eight capability areas and project-specific safeguards.
**Independent Test**: The guide has eight capability sections, command examples, viewport/test conventions and credential protections.

- [x] T008 [US2] Document interaction, responsive/mobile, test generation/repair, network/API inspection, debugging/tracing, visual QA, storage/auth and PDF/video/evidence in `.agents/skills/playwright-cli/references/lucky-pick-canada.md`.

## Phase 5: User Story 3 — Repeatable local CLI setup (P1)

**Goal**: Verify and prepare the repo-local CLI without adding global packages or changing the system.
**Independent Test**: Setup script validates the CLI and optional browser modes; Vitest protects the skill and its eight capabilities.

- [x] T009 [US3] Add the Node/pnpm/local CLI setup script with optional Chromium install and launch probe in `scripts/setup-playwright-agent.sh`.
- [x] T010 [P] [US3] Add integrity coverage for upstream files, license, capability sections and existing dependency reuse in `__tests__/playwright-agent-toolkit.test.js`.

## Final Phase: Polish and handoff

- [x] T011 Update `.specify/feature.json` to `specs/122-playwright-cli-agent-toolkit`.
- [x] T012 Record verified task context in `memory-bank/activeContext.md` and `memory-bank/progress.md`.
- [x] T013 Review the diff, run available verification and submit one canonical-summary PR that stays open and unmerged.

## Dependencies & Execution Order

Setup and provenance precede the official skill. The upstream references and local guide are independent after the skill directory exists. Setup script and integrity test are separate files. Memory Bank and final audit follow implementation.

## Parallel Opportunities

T007 and T008 are independent once the directory structure exists. T009 and T010 can be developed independently once the local command contract is defined.

## Independent Test Criteria

- **US1**: All ten upstream guides, skill entrypoint, license and provenance exist.
- **US2**: All eight capability sections and repository-specific safeguards exist.
- **US3**: Setup script invokes `pnpm exec playwright cli`; static test protects the bundle and confirms no extra CLI dependency.

## Suggested MVP

US1 and US2 provide the persistent skill and all eight capabilities. US3 makes setup repeatable and guards it.

## Format Validation

All tasks use checkbox, sequential ID, applicable story label and concrete repository paths.
