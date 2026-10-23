# Tasks — Restore Existing Lucky Stories Visibility

## Phase 1 — Setup
- [x] T001 Inspect repository governance, current Lucky Stories API/client code, recent polish PR diff, and production story record counts.

## Phase 2 — Implementation
- [ ] T002 [P] Add no-store behavior to the Lucky Stories API in `app/api/lucky-stories/route.js`.
- [ ] T003 Refresh the Lucky Stories API immediately on map mount and bypass browser/CDN URL cache in `app/lucky-map-of-canada/lucky-map-of-canada.js`.
- [ ] T004 [P] Add regression tests in `__tests__/lucky-stories-refresh.test.js`.

## Phase 3 — Verification
- [ ] T005 Run focused and full unit tests, `./jules-verify.sh`, and review the complete diff and current-head CI results.
- [ ] T006 Measure the actual `.next + public` build size and confirm it remains below 495 MiB.

## Dependencies
T002 and T004 can be implemented independently. T003 depends on the caching behavior contract established by T002. Verification T005–T006 follows implementation.

## MVP
T002 and T003 together restore immediate fresh API retrieval without changing user data.
