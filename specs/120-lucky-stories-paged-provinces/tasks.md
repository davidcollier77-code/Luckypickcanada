# Tasks: Lucky Stories Paged Province Feed

**Input**: `specs/120-lucky-stories-paged-provinces/`
**Prerequisites**: plan.md, spec.md

## Phase 1: Setup

- [x] T001 Read governance, Memory Bank, routed library references and the existing Lucky Stories data/UI/API/test files.
- [x] T002 Record the current published rows from the live stories feed and identify the demonstration records and their author values.

## Phase 2: Foundational

- [x] T003 Add a parameterized SQL province predicate derived from `storyProvinces`, plus query parsing, deterministic default-province selection and row mapping in `app/lucky-stories.js`.
- [x] T004 Add independent province-count aggregates, the optional 24-hour window, the bounded recent slice and summary cache invalidation in `app/lucky-stories.js`.
- [x] T005 Return the paged province payload from `app/api/lucky-stories/route.js` for `province`, `offset`, `limit`, `hours`, `summary` and `story` parameters.
- [x] T006 Make the refresh helper request summary-only data for the active window in `app/lucky-map-of-canada/lucky-stories-refresh.js`.

## Phase 3: User Story 1 — Read a province's stories a few at a time (P1)

**Goal**: Three stories first, three more near the feed's end, no full-collection download.
**Independent Test**: Load a province with seven stories and observe 3 → 6 → 7 cards from page requests limited to three.

- [x] T007 [US1] Replace the full-collection client feed with page state, request tokens, append de-duplication and an IntersectionObserver sentinel in `app/lucky-map-of-canada/lucky-map-of-canada.js`.
- [x] T008 [US1] Add a browser test for the three-row page, automatic follow-up page, stop condition and absence of cross-province rows in `tests/visual/lucky-stories-pagination.spec.ts`.

## Phase 4: User Story 2 — Start on the busiest province and return to my choice (P1)

**Goal**: Highest-count province on a first visit; the visitor's manual choice restored afterwards.
**Independent Test**: Clear storage, load the page, manually choose another province, reload and observe the choice restored.

- [x] T009 [US2] Select the highest-count province by default and restore only a valid, non-empty manual choice from local storage in `app/lucky-map-of-canada/lucky-map-of-canada.js`.

## Phase 5: User Story 3 — Trust the province filter and counts (P1)

**Goal**: Province filtering happens in SQL; displayed counts are full published totals and stay current.
**Independent Test**: The heading shows the province total while three cards are loaded; switching province replaces every card.

- [x] T010 [US3] Drive map markers, province controls, the panel heading, recent activity and the 24-hour toggle from summary counts and DB-windowed requests in `app/lucky-map-of-canada/lucky-map-of-canada.js`.
- [x] T011 [US3] Update the map interaction fixture for the paged payload and keep keyboard/24-hour coverage in `tests/visual/map-marker-interaction.spec.ts`.
- [x] T012 [US3] Add unit coverage for query parsing, the SQL province predicate, independent counts, paging offsets, default selection and exact story-text preservation in `__tests__/lucky-stories-pagination.test.js`.

## Phase 6: User Story 4 — Present demonstration stories naturally (P1)

**Goal**: Only positively identified demonstration rows get natural first-name-only authors; all other fields and records are untouched.
**Independent Test**: Compare the published rows before and after the correction and confirm only demonstration author display names differ.

- [ ] T013 [US4] Apply the author-display-name correction to published demonstration story IDs 9–21 and read back the unchanged story text, dates and provinces. **Blocked**: this workspace has no Neon SQL credentials; the statement and read-back are recorded in the PR summary for the owner.
- [x] T014 [US4] Verify genuine contributor rows (IDs 1–8) are unchanged and report any uncertain record.

## Phase 7: Verification and handoff

- [x] T015 Run focused Vitest, Playwright (map interaction and pagination), `pnpm exec tsc --noEmit` and `./freebuff-verify.sh`; measure the production build size.
- [x] T016 Inspect the complete diff, update this task list and the canonical PR summary, and confirm the PR is open and unmerged. Done: the 16-file diff was reviewed, the canonical body was updated, and PR #1783 remains open and unmerged.

## Verification evidence (2026-11-08)

- `pnpm exec vitest run`: 54 files / 446 tests **PASS**, including 13 new query, SQL-filter, paging, count and text-preservation tests.
- `pnpm exec playwright test tests/visual/lucky-stories-pagination.spec.ts tests/visual/map-marker-interaction.spec.ts`: 15/15 **PASS** across desktop 1440×900, mobile-390 and mobile-412. The feed rendered 3 → 6 → 7 cards with `limit=3` and offsets 0/3/6, and the province switch left zero cards from the previous province.
- `pnpm exec tsc --noEmit`: exit 0 **PASS**.
- `./freebuff-verify.sh`: exit 0 **PASS** (Spec Kit gate, verification-integrity tests, TypeScript, production build, docs-refresh suite 36/36).
- Production build measured `.next` + `public` = 426.44 MB, below the 495 MB ceiling **PASS**.
- T013 is **BLOCKED**: this workspace has no Neon SQL credential and the connected Neon integration exposes no SQL execution tool. The owner-run statement and required read-back are recorded in the PR summary; no story text, date, creation date, province or genuine author was modified.
- Live-database browser verification is **NOT RUN** (no database configured in this workspace); Playwright answers `/api/lucky-stories` from a local fixture.

- PR #1783: https://github.com/davidcollier77-code/Luckypickcanada/pull/1783 — open and unmerged.

## Dependencies

- T003–T006 precede every user story.
- T007 and T009–T010 share one client file and run in sequence.
- T011–T012 follow the payload change.
- T013–T014 require database write access and are independent of the code change.
- T015–T016 follow all implementable work.

## Implementation Strategy

Deliver the data path first, then the paged client feed and its browser/unit evidence. The author-presentation correction is a data-only change that must not be emulated in application code; it is reported with its exact statement until credentials are available.
