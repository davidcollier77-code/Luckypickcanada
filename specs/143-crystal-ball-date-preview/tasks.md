# Tasks: Development-Only Crystal Ball Date Preview

**Feature:** `specs/143-crystal-ball-date-preview`
**Input:** spec.md and plan.md

## Phase 1 — Preview model

- [x] T001 Add `app/lib/crystal-ball-preview.js` with production gating, date/time validation,
      local moment construction, URL building, date shifting and occasion presets.
- [x] T002 Add no-op preview storage and preview-only usage state helpers.

## Phase 2 — Preview experience

- [x] T003 Add the development-only `/crystal-ball/preview` route with a production 404.
- [x] T004 Add the preview client that reads the URL, defaults to today, and generates fortunes and
      follow-ups against the preview context without touching daily-usage storage.
- [x] T005 Add the control panel with date/time inputs, occasion presets and time-of-day shortcuts.
- [x] T006 Add optional preview props to `CrystalBall` for the greeting moment, date and reset label;
      keep default behaviour unchanged.

## Phase 3 — Verification

- [x] T007 Add unit tests for production gating, valid/invalid URLs, local moment construction,
      URL building, date shifting and preset coverage.
- [x] T008 Run focused tests, the full unit suite, type check, build, OpenNext build and the
      repository gate with the stacked base; confirm the build is below 495 MiB.
- [x] T009 Confirm `/crystal-ball` is unchanged and the preview route is 404 in production.
- [x] T010 Update Memory Bank and prepare the stacked PR description.
