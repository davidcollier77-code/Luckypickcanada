# Tasks: Lucky Meter Deployment CSS Integrity

**Feature**: `specs/208-lucky-meter-deploy-css-integrity`

> States are recorded only after the command actually ran.

## Phase 1 — Deployment pipeline

- [x] T001 Remove the redundant `pnpm run build` step so the OpenNext build is the only build
  that produces the uploaded artifact.
- [x] T002 Pass `GITHUB_SHA` to the OpenNext build so the deployed build ID identifies the commit.
- [x] T003 Assert `.lucky-vessel-scene`, `.lucky-vessel-canvas-host` and
  `.lucky-results-dock` in the compiled CSS before upload.
- [x] T004 Add `scripts/verify-deployed-lucky-meter-css.mjs` and run it after `wrangler deploy`
  with bounded retries and cache-busting.

## Phase 2 — Spark clock

- [x] T005 Schedule every Spark glyph from one absolute start time in
  `components/LuckyMeterSkyWriting.tsx`.
- [x] T006 Preserve the reduced-motion, written-state and onComplete contracts.

## Phase 3 — Tests

- [x] T007 Add unit coverage for stylesheet extraction, missing-selector reporting, retry and
  failure in `__tests__/deploy-css-check.test.js`.
- [x] T008 Add a late-frame regression test proving the next delay shrinks by the lateness.
- [x] T009 Run the focused Vitest files and `tsc --noEmit`.

## Phase 4 — Verification and handoff

- [x] T010 Build the production artifact, measure it, and assert the compiled CSS selectors.
- [x] T011 Run the served check against production to record the current deployment state.
- [x] T012 Run `./freebuff-verify.sh` and record the result.
- [ ] T013 Open the pull request with the complete PR_SUBMISSION.md body (completed by PR creation after this commit).

## Verification Results

- Focused Vitest: 2 files / 10 tests passed.
- Full Vitest: 108 files / 1,147 tests passed.
- `tsc --noEmit`: exit 0.
- Clean build: 417,959,411 bytes (398.60 MiB), below 495 MiB; all three selectors present.
- `SPEC_KIT_BASE_REF=FETCH_HEAD ./freebuff-verify.sh`: exit 0.
- Served check against the current live deployment: fails with the three missing selectors, as intended until the corrected build is deployed.
