# Tasks: Canonical Lucky Stories Province Selection

**Input**: Design documents from `specs/155-lucky-stories-province-dropdown/`

**Prerequisites**: plan.md, spec.md, research.md

## Phase 1: Setup and Baseline Inspection

- [x] T001 Inspect the existing province list, location validator, submission route, modal and relevant tests in `app/lucky-stories.js`, `app/lucky-map-of-canada/lucky-map-of-canada.js`, `app/api/lucky-stories/route.js`, `__tests__/lucky-stories.test.js` and `tests/visual/lucky-stories-pagination.spec.ts`.

## Phase 2: User Story 1 - Select a valid province or territory (Priority: P1)

**Goal**: Visitors choose one of the thirteen canonical full province/territory names and cannot submit a missing or arbitrary location.

**Independent Test**: Unit-test the server allowlist and use Playwright to inspect and interact with the actual modal.

### Tests First

- [x] T002 Add Vitest cases in `__tests__/lucky-stories.test.js` covering all thirteen canonical names, required location, misspellings and non-canonical values. Retain existing legacy resolver tests.
- [x] T003 Add a Playwright case in `tests/visual/lucky-stories-pagination.spec.ts` that opens the real story modal, verifies all thirteen full-name options and the required placeholder, and confirms a blank selection blocks submission.

### Implementation

- [x] T004 Extract the existing thirteen `storyProvinces` records unchanged into a dependency-free `app/lucky-story-provinces.js` module; import and re-export them from `app/lucky-stories.js` so existing server imports remain compatible.
- [x] T005 Update `app/lucky-stories.js` so new story submissions require one of the exact thirteen canonical full province/territory names and store the canonical name. Leave `getStoryProvince` and legacy record resolution unchanged.
- [x] T006 Replace the free-text location input in `app/lucky-map-of-canada/lucky-map-of-canada.js` with a required native select. Generate options from the shared province module, submit full canonical names, retain the existing `location` field name, and preserve the modal's styling and all other form protections.

### Verification

- [x] T007 Check focused Vitest and Playwright execution availability. The current session has no local repository checkout, and the GitHub clone attempt failed because this environment could not resolve `github.com`; focused runtime tests are therefore recorded as NOT RUN, not passed.
- [x] T008 Inspect the required PR CI coverage and record full unit, `./freebuff-verify.sh`, type-check, production-build/build-size and Playwright checks as PENDING CI. The Visual QA workflow runs the unit suite and `freebuff-verify.sh`, with two Playwright shards for application changes; no local execution or build-size measurement is claimed.
- [x] T009 Review the complete diff to confirm only the shared province data module, requested form, validation, focused tests and Spec Kit artifacts changed; preserve existing story records, resolver behavior, Turnstile, spam controls and visual baselines.

## Dependencies & Execution Order

- T001 is complete and establishes the current baseline.
- T002 and T003 are test-first tasks and precede implementation.
- T004, T005 and T006 implement the shared data, server validation and visitor-facing selection after both tests are written.
- T007 and T008 record the local execution limitation and the required CI verification; actual CI results remain pending.
- T009 is the final diff and safeguard review.

## Execution Notes

- The unit and browser regression tests have been added, but neither has been executed in this session.
- Local execution is blocked by the absence of a repository checkout and a failed GitHub clone caused by DNS resolution failure.
- The required PR checks are not considered passed until they report results for the final PR head. The 495 MiB build-size limit remains to be verified by an executable build.
