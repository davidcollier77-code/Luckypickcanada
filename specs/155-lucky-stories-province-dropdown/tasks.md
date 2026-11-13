# Tasks: Canonical Lucky Stories Province Selection

**Input**: Design documents from `specs/155-lucky-stories-province-dropdown/`

**Prerequisites**: plan.md, spec.md, research.md

## Phase 1: Setup and Baseline Inspection

- [x] T001 Inspect the existing province list, location validator, submission route, modal and relevant tests in `app/lucky-stories.js`, `app/lucky-map-of-canada/lucky-map-of-canada.js`, `app/api/lucky-stories/route.js`, `__tests__/lucky-stories.test.js` and `tests/visual/lucky-stories-pagination.spec.ts`.

## Phase 2: User Story 1 - Select a valid province or territory (Priority: P1)

**Goal**: Visitors choose one of the thirteen canonical full province/territory names and cannot submit a missing or arbitrary location.

**Independent Test**: Unit-test the server allowlist and use Playwright to inspect and interact with the actual modal.

### Tests First

- [ ] T002 Add Vitest cases in `__tests__/lucky-stories.test.js` covering all thirteen canonical names, required location, misspellings and non-canonical values. Retain existing legacy resolver tests.
- [ ] T003 Add a Playwright case in `tests/visual/lucky-stories-pagination.spec.ts` that opens the real story modal, verifies all thirteen full-name options and the required placeholder, and confirms a blank selection blocks submission.

### Implementation

- [ ] T004 Update `app/lucky-stories.js` so new story submissions require one of the exact thirteen canonical full province/territory names and store the canonical name. Leave `getStoryProvince` and legacy record resolution unchanged.
- [ ] T005 Replace the free-text location input in `app/lucky-map-of-canada/lucky-map-of-canada.js` with a required native select. Generate options from `storyProvinces`, submit full canonical names, retain the existing `location` field name, and preserve the modal's styling and all other form protections.

### Verification

- [ ] T006 Run focused Lucky Stories Vitest tests and the focused Playwright story-modal test; confirm all thirteen values, required-field behavior and invalid server submissions.
- [ ] T007 Run `pnpm run test`, `./freebuff-verify.sh`, type checking/build through the gate, and the applicable Playwright browser projects. Measure the production build and confirm it remains below 495 MiB.
- [ ] T008 Review the complete diff to confirm only the requested form, validation, focused tests and Spec Kit artifacts changed; preserve existing story records, resolver behavior, Turnstile, spam controls and visual baselines.

## Dependencies & Execution Order

- T001 is complete and establishes the current baseline.
- T002 and T003 are test-first tasks and precede implementation.
- T004 and T005 implement the server and visitor-facing parts of the same required selection.
- T006 and T007 depend on implementation; T008 is the final diff and safeguard review.
