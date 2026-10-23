# Tasks — Restore Existing Lucky Stories Visibility

## Phase 1 — Setup
- [x] T001 Inspect repository governance, current Lucky Stories API/client code, recent polish PR diff, and production story record counts.

## Phase 2 — Implementation
- [x] T002 [P] Add no-store behavior to the Lucky Stories API in `app/api/lucky-stories/route.js`.
- [x] T003 Refresh immediately on mount and use the stable no-store API URL in `app/lucky-map-of-canada/lucky-map-of-canada.js`, without a timestamp query parameter.
- [x] T004 [P] Add API header/payload and saved-location regression tests in `__tests__/lucky-stories-refresh.test.js` and `__tests__/lucky-stories.test.js`.
- [x] T005 Extract the refresh lifecycle into `app/lucky-map-of-canada/lucky-stories-refresh.js` and test stable request URLs plus single-in-flight polling in `__tests__/lucky-map-refresh.test.jsx`.

## Phase 3 — Verification
- [x] T006 Run focused/full unit tests, TypeScript, `./jules-verify.sh`, Playwright visual regression, and review the complete implementation diff and CI results. Verified on `dd5fec9dcd61529c7c2c2e6963ec091d9ee6f205`: 18 test files / 105 tests passed; TypeScript passed; `./jules-verify.sh` passed (17 passed, 0 failed); Playwright passed (27 tests).
- [x] T007 Measure `.next + public` and enforce the 495 MiB hard cap. Verified on the implementation commit: 332,473,620 bytes (317.07 MiB), below 519,045,120 bytes (495 MiB); OpenNext Cloudflare and Wrangler no-deploy validation passed.

## Dependencies
T002 establishes the no-store API contract. T003 implements the client refresh against that contract. T004–T005 cover API payload/cache behavior and client refresh concurrency. Verification T006–T007 follows implementation.

## MVP
T002 and T003 restore immediate, cache-safe API retrieval; T005 prevents poll pile-ups without changing user data.
