# Implementation Plan: Lucky Stories Paged Province Feed

**Branch**: `freebuff/40867abcd68f1e53d3356b9f` | **Date**: 2026-11-08 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/120-lucky-stories-paged-provinces/spec.md`

## Summary

Replace the map's "load up to 100 stories, then filter in the browser" model with a database-backed, province-scoped page of three stories, reached through the existing Lucky Stories API and extended with automatic loading near the feed's end. Province counts come from an aggregate query over all published rows so the heading and map controls stay correct while only a few cards are loaded. The visitor's manual province choice is stored locally; the first visit derives the highest-count province from all-time counts. The owner reports that the identified demo rows have been corrected in production: author names are natural first names and only the leading [dev-seed] marker was removed.

## Technical Context

**Language/Version**: JavaScript (ES modules) on Node.js 22.x, Next.js 16 App Router / React 19

**Primary Dependencies**: `@neondatabase/serverless` (existing), `next`, `react`; no new dependency

**Storage**: Neon PostgreSQL, `public.lucky_stories` and `lucky_story_reactions`; no schema change

**Testing**: Vitest (unit/component), Playwright (browser, intercepted API fixture), `./freebuff-verify.sh`

**Target Platform**: Cloudflare Pages via OpenNext; Node.js runtime for the API route

**Project Type**: Next.js web application

**Performance Goals**: First feed load returns three story rows for one province plus bounded summary aggregates; no full-collection story download on load

**Constraints**: 495 MB build ceiling; preserve existing design/behaviour; no schema changes; no new dependencies; PR stays open and unmerged

**Scale/Scope**: 13 provinces/territories, currently 21 published stories; paging must remain correct as the collection grows

## Constitution Check

- `AGENTS.md` is the only governance source; no governance files change.
- Scope is limited to the Lucky Stories data path, its API response, the map client feed and the identified demonstration author fields.
- Validation, sanitization, approval state, reaction handling, form security and environment handling remain intact.
- Province input is whitelisted and every SQL value is parameterized; no dynamic SQL is built from request text.
- No payment, authentication, deployment, environment or secret changes.
- Accessibility, keyboard support and reduced-motion behaviour are untouched.

## Research and Decisions

1. **Province membership must be identical in SQL and JavaScript.** The existing resolver (`getStoryProvince`) is the map's authority. The plan derives the SQL predicate from the same `storyProvinces` alias table, using code boundaries on the raw location and alias boundaries on a normalized (lower-cased, accent-folded) location. No hard-coded province list is duplicated, and no stored schema change is required.
2. **Paging shape.** Offset paging ordered by `created_at desc, id desc` with `limit`/`offset` parameters. Page size 3; the API clamps the requested limit to 0–12 and rejects negative offsets. Offset paging is sufficient here (small collections, deterministic order, stable enough for a three-row window) and avoids keyset cursor state in the client.
3. **Counts are independent of the page.** One aggregate query returns `count(*)` plus `count(*) filter (where <province predicate>)` for all thirteen regions. A 24-hour variant adds the window predicate. Counts therefore describe all published rows, not the loaded page.
4. **Summary caching.** Reuse the existing KV cache-aside helper for the summary aggregates, keyed by the time window, and invalidate both window keys after a story creation or reaction. Page rows are read directly so a page request never returns another province's rows.
5. **Default province.** `pickDefaultProvince` scans the all-time counts in the canonical `storyProvinces` order and returns the first highest count, so ties are deterministic. Empty collections fall back to the existing `ON` default.
6. **Saved preference.** Only a manual province selection is written to `localStorage`; the automatic default is recomputed. A saved code that is not a valid region, or that has no published stories while others do, is discarded.
7. **Time window.** The existing All-Time / Last 24 Hours toggle is moved to the database predicate (`make_interval(hours => $n)`), so markers, counts, the feed and recent activity stay consistent. New requests are issued when the toggle changes.
8. **Recent activity.** The section keeps its existing markup and previous behaviour of up to three newest published stories per province. A window-function query bounds the result to at most 39 rows (13 regions × 3) for the active time window instead of deriving it from a full collection download.
9. **Shared story links.** A validated numeric `story` parameter returns one linked story, which the client pins at the top of its province feed so the existing open-story behaviour survives paging.
10. **Demonstration authors.** The published feed on 2026-11-08 shows IDs 9–21 with `Dev`-prefixed display names and `[dev-seed]` prefixes, and IDs 1–8 with genuine contributor names. Only IDs 9–21 are demonstration rows. The owner reports that production IDs 9–21 now use distinct natural first names and have only the leading `[dev-seed]` marker removed; the remaining story wording, dates, approval state and province assignments were preserved. This was a data-only correction, not an application hardcode.

## Project Structure

```text
app/
├── lucky-stories.js                         # province resolution, SQL predicates, paged reads, summary, cache
├── api/lucky-stories/route.js               # GET query parsing + paged payload; POST unchanged
├── lucky-map-of-canada/lucky-map-of-canada.js  # province default/restore, paged feed, infinite scroll
└── lucky-map-of-canada/lucky-stories-refresh.js # summary-only refresh with the active window

__tests__/lucky-stories-pagination.test.js   # query parsing, predicate, counts, page and row mapping
tests/visual/map-marker-interaction.spec.ts  # fixture updated for paged payload
tests/visual/lucky-stories-pagination.spec.ts# browser proof of 3-row pages and province-scoped counts

specs/120-lucky-stories-paged-provinces/{spec,plan,tasks}.md
```

**Structure Decision**: Existing single Next.js application; only the existing Lucky Stories modules and their tests change.

## Data Model

No schema change. Existing `lucky_stories` columns (`id`, `display_name`, `location`, `story`, `approved`, `created_at`) are read as before. The API payload changes from `{ stories (up to 100), provinceCounts, totalStories, provincesWithStories, isConfigured }` to:

```text
{
  stories: Story[],            // current province page only
  linkedStory: Story | null,   // shared-link lookup
  provinceCounts: { [code]: number },        // active window, all published rows
  allTimeProvinceCounts: { [code]: number }, // used for the automatic default
  totalStories: number,        // all-time published total (existing statistic)
  provincesWithStories: number,
  recentStories: Story[],      // up to three newest per province, at most 39 total, active window
  defaultProvince: string,
  selectedProvince: string,
  provinceTotal: number,       // full count for the selected province
  hasMore: boolean,
  isConfigured: boolean
}
```

Story objects keep their existing shape (`id`, `firstName`, `province`, `provinceName`, `story`, `preview`, `createdAt`, `reactionCount`).

## Verification Plan

- Vitest: query parsing/clamping, province predicate parameterization, deterministic default, paged DB reads, counts independent of the page, exact story-text preservation.
- Playwright: the map fixture is updated for the paged payload; markers, keyboard activation, 24-hour filter and a new paging test (3 → 6 → 7, no cross-province rows, full count from the first page).
- `./freebuff-verify.sh` (pnpm bootstrap, Spec Kit gate, verification-integrity tests, TypeScript, production build, refresh-docs tests).
- Production build size measured against the 495 MB ceiling.
- Live Neon read-back for the author correction, or a reported blocker with the exact statement.

## Risks and Mitigations

- **Duplicate province rules (JS and SQL).** Both are generated from `storyProvinces`; the SQL predicate is derived, not hand-written. A parity unit test asserts the generated parameters and the existing resolver test suite stays in place. Live counts and feeds are compared during verification if credentials exist.
- **No direct Neon write access in this workspace.** The author correction cannot be executed from here without exposing credentials. The plan records the exact IDs, before/after names and a guarded statement; the task remains incomplete until it is run and read back.
- **Paging races.** A request token discards a superseded province/timeframe response; appends de-duplicate by story id.
- **Stale counts.** Summary cache TTL is 60 seconds and both window keys are invalidated after in-app publishes; the client refreshes summary counts every 60 seconds.
- **Build ceiling and browser tooling.** The build size is measured in verification; Playwright availability in this VM is reported factually if Chromium cannot start.

## Follow-up plan: Homepage responsive visual QA

- Preserve the approved hero composition and its source artwork, copy, navigation, Explore interaction, AVIF-first/WebP fallback and reduced-motion behavior.
- Inspect the failed Playwright expected/actual/diff images first. The mobile snapshots depict an older hero composition; they are not an acceptable target for the current approved markup.
- Extend the existing homepage Playwright coverage with a first-screen geometry sweep at 320, 360, 390, 412, 768, 820, 1024, 1180 and 1440 CSS pixels. Check horizontal overflow, hero text clipping, navigation-link containment and Explore control visibility.
- Correct the sitewide gold CTA browser assertion to wait for the completed pressed-edge transition and inspect the measured 1px edge depth; do not weaken the design contract.
- Regenerate only the three committed viewport screenshots through Playwright's real `--update-snapshots` execution. Do not synthesize or hand-edit the PNGs.
- Run the existing browser projects and required repository verification on the updated head. Preserve any unrelated or unavailable checks as explicit statuses.
- Ghost Invasion is not run against the hosted PR or production site: its installed local-only runner requires a disposable loopback app and same-origin reset endpoint. No such local checkout/fixture is available in this session, so do not claim a Ghost Invasion result. The independent review is limited to the captured Playwright evidence and source inspection.
