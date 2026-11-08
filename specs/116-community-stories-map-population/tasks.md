# Tasks: Community Stories Map Population and Statistics Cleanup

**Input**: specs/116-community-stories-map-population/
**Prerequisites**: plan.md, spec.md

## Phase 1: Setup
- [X] T001 Confirm production/development row identity and current rolling 24-hour boundary in Neon; record exact before counts and timestamps.
- [X] T002 Inspect the current map statistics component and related tests in app/lucky-map-of-canada/lucky-map-of-canada.js and tests/visual/map-marker-interaction.spec.ts.

## Phase 2: Foundational
- [X] T003 Create a recoverable before-state for public.lucky_stories on Neon production before writing.
- [X] T004 Confirm production rows 1–8 match development in display_name, location and story; stop if any conflict is found.

## Phase 3: User Story 1 — Complete story collection (P1)
**Goal**: Publish all 21 prepared stories in production and populate the map from their recorded provinces.
**Independent Test**: Query production and verify 21 approved records with IDs 1–21, expected locations and matching story content.
- [X] T005 [US1] Apply prepared timestamps to production IDs 1–8 and insert prepared IDs 9–21 in one Neon transaction, guarded against ID/content conflicts; synchronize the serial sequence.
- [X] T006 [US1] Read back all production records and compare IDs, names, locations, story text, approval state and timestamps against development.
- [X] T007 [US1] Verify map data groups all 21 records under expected province/territory and the map API returns the complete story collection.

## Phase 4: User Story 2 — Single useful statistic (P1)
**Goal**: Show only the all-time total card and remove the two redundant cards.
**Independent Test**: Render the map and assert the single all-time statistic is present while province-count and mapped-marker cards are absent.
- [X] T008 [P] [US2] Remove the province-count and mapped-marker entries from app/lucky-map-of-canada/lucky-map-of-canada.js, preserving the all-time total.
- [X] T009 [P] [US2] Add a unit regression guard in __tests__/community-stories-statistics.test.js for one-card behavior.

## Phase 5: User Story 3 — Last 24 Hours (P1)
**Goal**: Ensure exactly the two intended recent stories appear in the rolling 24-hour filter.
**Independent Test**: Query production and use the UI filter to confirm exactly the two intended records appear.
- [X] T010 [US3] Extend tests/visual/map-marker-interaction.spec.ts with a 21-story fixture, one-card assertion, province grouping and recent-filter assertions.
- [X] T011 [US3] Verify production rolling 24-hour count is exactly two and identify the intended story IDs/names in evidence.

## Phase 6: Polish and Verification
- [ ] T012 Run focused Vitest and Playwright map tests at mobile and desktop viewports (NOT RUN in this connector-only workspace).
- [ ] T013 Run pnpm exec tsc --noEmit and ./freebuff-verify.sh; record build size against 495 MB (NOT RUN in this connector-only workspace).
- [X] T014 Review full diff and confirm no homepage files, unrelated routes or non-map behavior changed; update task list and Memory Bank.
- [X] T015 Create one canonical PR with implementation, data migration evidence, checks and full HEAD SHA; leave it OPEN and UNMERGED.

## Dependencies
- T001–T004 precede the production transaction.
- T005 precedes T006–T007 and T011.
- T008–T009 can proceed independently of production data work.
- T010 depends on the updated statistics expectation.
- T012–T015 follow all implementation tasks.

## Implementation Strategy
Complete guarded production data publication first, then the minimal statistics-only UI change. Verify database state before browser QA. Completion requires all 21 records and intended recent filter behavior. No homepage work is included.
