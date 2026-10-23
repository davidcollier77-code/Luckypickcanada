# Tasks — Restore Existing Lucky Stories Visibility

## Phase 1 — Setup
- [x] T001 Inspect repository governance, current Lucky Stories API/client code, recent polish PR diff, and production story record counts.

## Phase 2 — Implementation
- [x] T002 [P] Add no-store behavior to the Lucky Stories API in `app/api/lucky-stories/route.js`.
- [x] T003 Refresh immediately on mount and use the stable no-store API URL in `app/lucky-map-of-canada/lucky-map-of-canada.js`, without a timestamp query parameter.
- [x] T004 [P] Add API header/payload and saved-location regression tests in `__tests__/lucky-stories-refresh.test.js` and `__tests__/lucky-stories.test.js`.
- [x] T005 Extract the refresh lifecycle into `app/lucky-map-of-canada/lucky-stories-refresh.js` and test stable request URLs plus single-in-flight polling in `__tests__/lucky-map-refresh.test.jsx`.

## Phase 3 — Verification
- [ ] T006 Run focused and full unit tests, `./jules-verify.sh`, and review the complete diff and current-head CI results.
- [ ] T007 Measure the actual `.next + public` build size and confirm it remains below 495 MiB.

## Dependencies
T002 establishes the no-store API contract. T003 implements the client refresh against that contract. T004–T005 cover API payload/cache behavior and client refresh concurrency. Verification T006–T007 follows implementation.

## MVP
T002 and T003 restore immediate, cache-safe API retrieval; T005 prevents poll pile-ups without changing user data.
