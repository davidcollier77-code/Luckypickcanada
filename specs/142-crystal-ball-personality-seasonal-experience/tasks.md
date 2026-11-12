# Tasks: Crystal Ball Personality, Local Time and Canadian Seasonal Identity

**Feature**: `specs/142-crystal-ball-personality-seasonal-experience`
**Input**: spec.md and plan.md

## Phase 1 — Shared local time

- [x] T001 Add `app/lib/local-time.js` with local moment, period boundaries, local-time parsing and
      greeting metadata.
- [x] T002 Expose the shared one-second timestamp from `components/daily-reset-countdown.js`.

## Phase 2 — Canadian calendar model

- [x] T003 Add `app/lib/crystal-ball-calendar.js` with fixed and movable holidays, seasons, upcoming
      occasions, occasion focus, intensity, tone and prompt/fallback keys.
- [x] T004 Implement the exact Canada Day, Christmas and New Year windows and the respectful-only
      Remembrance Day and Truth and Reconciliation treatment.

## Phase 3 — Voice and variety

- [x] T005 Add curated general, seasonal and occasion fallback pools in
      `app/lib/crystal-ball-fortunes.js`, including tone-safe respectful pools.
- [x] T006 Rebuild the oracle system prompts from the occasion tone, adding humour density and
      variety guidance while preserving the existing output contract and safety rules.
- [x] T007 Expand the daily greeting pool and compose it with the local salutation; add quiet
      greetings for solemn days.
- [x] T008 Wire the live greeting and shared local moment into the existing client/component without
      changing visuals, animation or controls.

## Phase 4 — Verification

- [x] T009 Add unit tests for local-time boundaries, DST/midnight and calendar windows.
- [x] T010 Add unit tests for greeting composition, fallback selection and respectful tone.
- [x] T011 Update the oracle route tests and visual greeting spec for the new behaviour.
- [x] T012 Run the focused Vitest suites, type check, production build and `./freebuff-verify.sh`;
      confirm the build stays below 495 MiB.
- [x] T013 Update Memory Bank active context/progress and prepare the PR description.
