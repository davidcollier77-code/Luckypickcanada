# Tasks: Crystal Ball Daily Fortune Experience

**Input**: Design documents from `specs/121-crystal-ball-daily-fortune/`

**Organization**: Tasks follow the user stories in `spec.md`. All tasks are in scope for this single feature.

## Phase 1: Setup

- [X] T001 Confirm the existing Crystal Ball component, daily-usage module, Oracle route, audio helpers, styles, tests and FAQ before changing code.
- [X] T002 Create the feature artifacts under `specs/121-crystal-ball-daily-fortune/` and point `.specify/feature.json` at this directory.

## Phase 2: Foundational

- [X] T003 Add pure local-midnight helpers in `app/lib/daily-reset.js` using the local calendar constructor for DST-safe deadlines.
- [X] T004 Add one shared one-second countdown store and `useDailyResetCountdown` hook in `components/daily-reset-countdown.js` with focus, visibility and page-show recovery.

## Phase 3: User Story 1 - Daily fortune without a question (P1)

- [X] T005 [US1] Replace the three-answer state in `app/crystal-ball-client/daily-usage.js` with one fortune and one follow-up per local date, including storage validation and in-memory fallback.
- [X] T006 [US1] Add `mode: 'fortune'` to `app/api/oracle/route.js`, keep rate limiting and validation, and include deterministic calendar context in the prompt.
- [X] T007 [US1] Expand the Canadian fortune fallbacks with general, seasonal and holiday-aware alternatives.
- [X] T008 [US1] Render the three greetings, **Generate My Fortune**, saved-fortune restoration and the existing reveal/animation/audio sequence in `app/components/CrystalBall/CrystalBall.tsx`.
- [X] T009 [US1] Persist successful fortunes, ignore failed or empty responses, and synchronize storage/date changes in `app/crystal-ball-client/CrystalBallClient.js`.

## Phase 4: User Story 2 - One optional follow-up (P1)

- [X] T010 [US2] Add `mode: 'follow-up'` to `app/api/oracle/route.js`, require a valid question, and include the original fortune as context.
- [X] T011 [US2] Render the follow-up prompt, labelled input and **Ask the Crystal Ball** button after the fortune in `CrystalBall.tsx`.
- [X] T012 [US2] Persist one follow-up answer per day, restore it on refresh, and block a second follow-up in `CrystalBallClient.js`.

## Phase 5: User Story 3 - Shared countdown (P2)

- [X] T013 [US3] Replace the Crystal Ball quota timer with the shared countdown hook in `CrystalBall.tsx`.
- [X] T014 [US3] Route `components/midnight-countdown.js` (Card Reveal) through the shared engine without changing its visible wording.
- [X] T015 [US3] Replace the Lucky Meter's inline midnight timer with the shared hook in `components/DailyResonance.tsx`, preserving its separate allowance.

## Phase 6: User Story 4 - Personality and calendar accuracy (P2)

- [X] T016 [US4] Implement Easter, Good Friday, Victoria Day, Canada Day, Thanksgiving, Halloween, Remembrance Day, New Year's, Valentine's Day and Christmas calculations plus season and weekday context.
- [X] T017 [US4] Update the Oracle system prompts for the daily-fortune and follow-up voices, including Canadian humour, variety, 2-4 sentences and lottery-safety wording.

## Phase 7: User Story 5 - FAQ (P3)

- [X] T018 [US5] Replace the old three-question FAQ entry with the five approved Crystal Ball questions and update the daily-reset answer in `app/homepage/faq-content.js`.

## Phase 8: Polish and verification

- [X] T019 Update Vitest coverage for daily usage, the shared reset clock, DST boundaries, holiday calculation and Oracle request modes.
- [X] T020 Update Playwright coverage for the greeting, no-question generation, save/restore, one follow-up, failure-without-consumption, and countdown agreement.
- [X] T021 Add minimal greeting/follow-up styles that reuse the existing Crystal Ball design language.
- [X] T022 Run `./freebuff-verify.sh`, Vitest, focused Playwright tests, measure the production build, and audit the final diff.
- [X] T023 Update `memory-bank/activeContext.md` and `memory-bank/progress.md`, then publish one open, unmerged PR with the canonical evidence summary.


## Phase 9: Independent review repairs

- [X] T024 Serialize fortune and follow-up allowance operations across same-origin tabs with the Web Locks API; re-read persisted usage after acquiring the lock and refuse a second successful delivery.
- [X] T025 Preserve the parsed Oracle request mode and calendar context through the outer error handler so malformed provider JSON or an unexpected exception returns a fallback for the requested mode.
- [X] T026 Add unit and Playwright regressions for concurrent tab requests and malformed follow-up provider responses; replace the DevSkim-triggering Playwright per-test timeout call with equivalent suite configuration.
- [X] T027 Run `./freebuff-verify.sh`, full Vitest, required Playwright Visual QA, production build-size measurement, and final diff/error audit on the repair head.

## Phase 10: PR #1785 review follow-up

- [X] T028 [US1] Apply the latest persisted usage before rejecting a duplicate fortune response in `CrystalBallClient.js` so the UI cannot remain stale.
- [X] T029 [US1] Strengthen the two-tab Playwright test to hold the first request, click the second tab under the lock, and prove one request, one saved reading, and adoption in both tabs.
- [X] T030 [US1] Add a browser regression for a tab that misses the storage event and receives a duplicate response; it must adopt the already-saved reading.
- [X] T031 [US4] Remove the unused `context` field from the Oracle success payload and assert it is absent while prompt context remains covered.
- [X] T032 [Testing] Add fallback lock-queue regressions for synchronous throws and rejected operations; record that the claimed deadlock does not reproduce and make no production queue change.
- [X] T033 [Testing] Inspect the initial-fortune adoption effect for the reported infinite loop; change it only if a reproducible loop is demonstrated.
- [X] T034 Run focused Vitest, full Vitest, required Playwright Visual QA, `./freebuff-verify.sh`, production build-size measurement, and the complete diff/error audit on the review-follow-up head.
  - BLOCKED: the pre-existing three-page countdown case cannot navigate `/reveal` in this VM's headless shell (browser closes before load; an isolated one-page probe reproduces it). The six review-specific two-tab browser cases pass in all three projects.
- [X] T035 Update the Memory Bank and the canonical PR body with the new HEAD SHA and verification evidence.
