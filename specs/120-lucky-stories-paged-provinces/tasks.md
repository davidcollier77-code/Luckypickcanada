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

- [x] T013 [US4] Apply the author-display-name correction to published demonstration story IDs 9–21 and read back the unchanged narrative wording, dates and provinces. **Owner-reported complete (2026-11-08)**: the PR owner reports 21 rows retained, 13 demo authors corrected, 0 seed markers remaining, and contributor IDs 1–8 preserved. The owner also reports that only the leading [dev-seed] marker was removed; this workspace has not independently re-run the production read-back.
- [x] T014 [US4] Verify genuine contributor rows (IDs 1–8) are unchanged and report any uncertain record.

## Phase 7: Verification and handoff

- [x] T015 Re-run focused/full Vitest, Playwright (map interaction and pagination), `pnpm exec tsc --noEmit` and `./freebuff-verify.sh` against the repaired PR HEAD; measure the production build size. **PASS (2026-11-08)**: 54 Vitest files / 447 tests; full Playwright 147 passed, 6 skipped, 0 failed; TypeScript and Freebuff verification passed; production build 335,370,994 bytes (319.83 MiB) < 495 MiB.
- [x] T016 Inspect the complete final diff, update the canonical PR summary with current-head evidence, and confirm the PR is open and unmerged. **PASS (2026-11-08)**: reviewed all 24 changed paths; canonical PR body updated with evidence and limitations; PR #1783 remains open and unmerged.

## Follow-up QA repair tasks

- [x] T017 [US3] Restore the bounded Recent Canadian Activity behaviour of up to three stories per province in `app/lucky-stories.js` and cover it in `__tests__/lucky-stories-pagination.test.js`.
- [x] T018 [US3] Make the map interaction browser test wait for the actual summary API response and hydrated province markers in `tests/visual/map-marker-interaction.spec.ts`.
- [x] T019 [US3] Wait for the final pressed-edge transition in `tests/visual/gold-cta.spec.ts` and replace the fixed pagination sleep with a network-idle condition in `tests/visual/lucky-stories-pagination.spec.ts`.
- [x] T020 Refresh the three homepage screenshot baselines in `tests/visual/__screenshots__/{desktop,mobile-390,mobile-412}/homepage-viewport.png` from the current approved homepage rendering. **PASS (2026-11-08)**: Playwright generated the desktop, mobile-390 and mobile-412 snapshots from the current branch rendering; all 3 regeneration tests passed and only these three PNGs were committed in `3203f086be8eb841eca7ee20e61389cbe05c0741`.
- [x] T021 [Security] Extend the narrowly scoped DevSkim false-positive allowlist for the exact Playwright `test.setTimeout(120_000)` configuration in the three updated visual test files; add regression coverage proving request-derived timeout values are not suppressed. **PASS (2026-11-08)**: the allowlist remains narrowly scoped to the fixed numeric Playwright test timeout in the three named files; request-derived values remain unsuppressed in regression coverage.

## Verification evidence (2026-11-08)

- `pnpm exec vitest run`: 54 files / 446 tests **PASS**, including 13 new query, SQL-filter, paging, count and text-preservation tests.
- `pnpm exec playwright test tests/visual/lucky-stories-pagination.spec.ts tests/visual/map-marker-interaction.spec.ts`: 15/15 **PASS** across desktop 1440×900, mobile-390 and mobile-412. The feed rendered 3 → 6 → 7 cards with `limit=3` and offsets 0/3/6, and the province switch left zero cards from the previous province.
- `pnpm exec tsc --noEmit`: exit 0 **PASS**.
- `./freebuff-verify.sh`: exit 0 **PASS** (Spec Kit gate, verification-integrity tests, TypeScript, production build, docs-refresh suite 36/36).
- Production build measured `.next` + `public` = 426.44 MB, below the 495 MB ceiling **PASS**.
- T013 is **OWNER-REPORTED COMPLETE**: the owner reports the production correction and read-back for IDs 9–21, with IDs 1–8 preserved. The leading [dev-seed] marker was removed; the remaining story wording was preserved. This workspace has not independently queried production.
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

## Current-head repair status

- Full current-head CI tested source and test changes at `fadad69efc167a5fd06443e04f0453fc7813490d`.
- `pnpm exec vitest run`: **PASS**, 54 files / 447 tests.
- `pnpm exec tsc --noEmit`: **PASS**.
- `./freebuff-verify.sh`: **PASS**, including Spec Kit artifact verification, verification-integrity tests and documentation refresh suite (36/36).
- Full `pnpm exec playwright test`: **PASS**, 147 passed / 6 skipped / 0 failed. All three homepage screenshot baseline comparisons passed. The responsive width matrix passed at 320, 360, 390, 412, 768, 820, 1024 and 1440 CSS px. The sitewide pressed-gold-edge assertion passed.
- OpenNext Cloudflare worker build, asset/Tailwind checks and Wrangler no-deploy validation: **PASS**.
- Production build size: `.next + public` = 335,370,994 bytes / **319.83 MiB**, below the 495 MiB hard maximum.
- CodeQL: **PASS**. DevSkim: **PASS**; 301 SARIF results, 281 verified false positives suppressed, 20 existing findings remain. No zero-alert claim is made.
- Updater scheduler governance/tests and Wrangler dry run: **PASS**. Verification Integrity: **PASS**.
- The local Playwright server has no `DATABASE_URL`; its unconfigured-database 500 log messages are environment warnings, not failed assertions or confirmed production 500s. Live DB read-back remains separately unverified.
- Ghost Invasion: **BLOCKED / NOT RUN** because its local-only runner requires a disposable localhost app/reset fixture unavailable in this session. No independent Ghost review is claimed.

## Follow-up responsive QA tasks

- [x] T022 Independently compare the current Playwright expected/actual/diff screenshots for desktop, mobile-390 and mobile-412 and inspect the approved hero source/composition. Result: mobile baselines depict the older hero layout; current rendering corresponds to the later approved hero composition. Desktop is a small pixel delta. Ghost Invasion local-only execution is blocked because this session has no local disposable app/reset fixture; no Ghost Invasion execution is claimed.
- [x] T023 Add Playwright responsive first-screen coverage at 320, 360, 390, 412, 768, 820, 1024, 1180 and 1440 CSS pixels. Verify no horizontal overflow, clipped welcome text, hidden navigation links or missing Explore control. **PASS** in the full Playwright run: the matrix executed once in desktop Chromium and passed all nine viewport widths.
- [x] T024 Fix the sitewide gold CTA assertion to wait for the settled pressed-edge state and verify its measured depth is 1 CSS pixel without relaxing the intended appearance. **PASS** in the full Playwright run across desktop, mobile-390 and mobile-412.
- [x] T025 Regenerate only the desktop, mobile-390 and mobile-412 homepage viewport PNG baselines from actual Playwright output and commit them. **PASS**: 3/3 Playwright baseline regeneration tests; exact three-file commit `3203f086be8eb841eca7ee20e61389cbe05c0741`.
- [x] T026 Run current-head Playwright visual QA, `pnpm exec vitest run`, `pnpm exec tsc --noEmit` and `./freebuff-verify.sh`; measure build size against the 495 MB cap, inspect the full diff and update the canonical PR summary. **PASS (2026-11-08)** at `fadad69efc167a5fd06443e04f0453fc7813490d`; see current-head verification status above.

## Follow-up verification status

- Screenshot/source inspection: **PASS** (evidence limited to the Playwright workflow artifact and repository source at the recorded head).
- Ghost Invasion local-only reviewer: **BLOCKED / NOT RUN** (no local repository checkout, disposable application or same-origin reset endpoint available in this session).
- Expanded responsive Playwright matrix: **PASS** at all nine widths (executed once in desktop Chromium).
- CTA transition assertion correction: **PASS** in the full suite for all three projects.
- Three screenshot baseline regeneration: **PASS** (3/3 projects, commit `3203f086be8eb841eca7ee20e61389cbe05c0741`).
- Current-head full verification: **PASS** at `fadad69efc167a5fd06443e04f0453fc7813490d`; see command-specific results above.


## Current responsive QA checkpoint (2026-11-08)

- The one-time PR #1783 snapshot refresh workflow generated the three committed baselines using Playwright Chromium: desktop 1440x900, mobile-390 390x844 and mobile-412 412x915. The selected baseline test passed 3/3.
- Only these files were staged and committed: `tests/visual/__screenshots__/desktop/homepage-viewport.png`, `tests/visual/__screenshots__/mobile-390/homepage-viewport.png`, `tests/visual/__screenshots__/mobile-412/homepage-viewport.png`.
- The temporary snapshot-refresh workflow permission and step were removed; the current Visual QA workflow is read-only and uses only its standard Playwright regression path.
- The responsive geometry matrix is implemented and **passed** at 320, 360, 390, 412, 768, 820, 1024, 1180 and 1440 CSS pixels in the full Playwright run.
- The CTA pressed-edge assertion waits for and parses the settled 1px CSS shadow; this passed in the full Playwright run.
- Standard post-refresh Visual QA passed: 147 tests passed, 6 skipped, 0 failed. Full Vitest (447/447), TypeScript, Freebuff verification, OpenNext/Cloudflare, updater checks, CodeQL, DevSkim and build-size gates also passed at the current verification head.
- Ghost Invasion remains **BLOCKED / NOT RUN** because the installed runner requires a disposable local app and same-origin reset endpoint; the connected session has no local checkout/fixture. No Ghost Invasion verdict is claimed.
