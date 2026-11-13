# Tasks: Crystal Ball Token Budgets and Fallback Resilience

**Feature:** `specs/153-crystal-ball-token-fallback-limits`
**Input:** spec.md and plan.md

## Phase 1 — Provider budgets and fallback model

- [x] T001 Set the daily fortune `max_completion_tokens` to 900 and the follow-up budget to 700 in
      `app/api/oracle/route.js`, keeping the model, reasoning effort and all other settings.
- [x] T002 Add stable unique identifiers to all 197 daily fallback fortunes and exclusion-aware
      selection that retains the existing general, seasonal and occasion weighting in
      `app/lib/crystal-ball-fortunes.js`.
- [x] T003 Remove the 14 follow-up fallback answers and their selector from
      `app/lib/crystal-ball-fortunes.js`.

## Phase 2 — Follow-up outage and privacy

- [x] T004 Add the exact follow-up outage message in
      `app/lib/crystal-ball-follow-up-message.js` and return it from every follow-up provider
      failure in the oracle route without a substitute reading.
- [x] T005 Map follow-up provider unavailability to the exact message in the production client,
      preserve the daily follow-up limit, and keep the message visible after submission in
      `app/components/CrystalBall/CrystalBall.tsx`.
- [x] T006 Remove follow-up question and answer persistence from
      `app/crystal-ball-client/daily-usage.js`, `app/crystal-ball-client/CrystalBallClient.js`
      and the preview usage shape while keeping the fortune and both used flags.

## Phase 3 — Consecutive-day fallback selection

- [x] T007 Add `app/crystal-ball-client/fallback-history.js` storing only the last fallback ID and
      local date, with a previous-local-day exclusion helper.
- [x] T008 Send the previous day's fallback ID with the daily fortune request, validate it in the
      route, and record the returned fallback ID and date in the client.
- [x] T009 Preserve seasonal and holiday relevance when the excluded ID is filtered.

## Phase 4 — Verification

- [x] T010 Update and add focused tests for the token budgets, 197-fortune inventory, stable IDs,
      consecutive-day exclusion, seasonal relevance, follow-up outage message, no Q&A persistence
      and preview usage shape.
- [x] T011 Run the focused Crystal Ball tests, the applicable full unit suite, `tsc --noEmit`, the
      production build and `./freebuff-verify.sh`; confirm the build stays below 495 MiB.
- [x] T012 Inspect the final diff for preserved visuals, daily delivery, limits and unrelated
      functionality; record evidence and update Memory Bank context.
