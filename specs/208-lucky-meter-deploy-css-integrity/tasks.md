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
- [x] T013 Open the pull request with the complete PR_SUBMISSION.md body (PR #2008).

## Phase 5 — PR review resolution

- [x] T014 Add a per-request abort timeout and a bounded `timeout-minutes` to the deploy job.
- [x] T015 Verify the bare visitor-facing `/lucky-meter` response as well as the cache-bypassed
  origin response, and fail on either stale stylesheet set.
- [x] T016 Assert the uploaded artifact's `BUILD_ID` equals the deployed commit SHA and that both
  served page responses identify that build.
- [x] T017 Strengthen the tests: rules split across stylesheets, build identity, cached visitor
  HTML, request timeout, and a late-frame completion at the final deadline.
- [x] T018 Run focused and full Vitest, `tsc --noEmit`, the production build, the served check
  against a local production server and `./freebuff-verify.sh`.
- [x] T019 Commit and push the review resolution so every PR check runs on the new head.

## Phase 6 — Graphite review pass on the final head

- [x] T020 Pass each page variant's cache policy through to its stylesheet fetches so the
  visitor-facing probe is not silently cache-bypassed.
- [x] T021 Make the retry test hermetic and assert the configured delay, and exercise build
  identity on the visitor-facing cached-HTML path plus an earlier-build cache case.
- [x] T022 Run the focused suite, typecheck and `./freebuff-verify.sh`, then push the final head.

## Verification Results

- Focused Vitest after the third review pass: 2 files / 16 tests passed.
- Focused Vitest after review resolution: 2 files / 14 tests passed.
- Full Vitest after review resolution: 108 files / 1,151 tests passed.
- `tsc --noEmit`: exit 0.
- Clean build: 417,959,411 bytes (398.60 MiB), below 495 MiB; all three selectors present.
- Final OpenNext build: 417,975,752 bytes (398.61 MiB); `BUILD_ID` equals the supplied SHA; all three selectors present; a wrong SHA is rejected.
- `SPEC_KIT_BASE_REF=FETCH_HEAD ./freebuff-verify.sh`: exit 0.
- Served check against the current live deployment: fails with the three missing selectors, as intended until the corrected build is deployed.
- Served check against a local production server built with a known `GITHUB_SHA`: passes for the
  cache-bypassed and visitor-facing page with the matching build ID (see `evidence.md`).
