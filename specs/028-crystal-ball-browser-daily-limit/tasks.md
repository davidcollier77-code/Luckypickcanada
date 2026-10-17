# Tasks: Crystal Ball Browser-Local Daily Allowance

**Input**: \`specs/028-crystal-ball-browser-daily-limit/spec.md\` and \`plan.md\`

## Phase 1 — Specify and plan

- [x] T001 Define the local-day allowance, countdown, valid-question behavior, and accepted localStorage bypass limitation in \`spec.md\`.
- [x] T002 Document browser storage, local-midnight rollover, API boundary, and verification gates in \`plan.md\`.

## Phase 2 — Implement local allowance (P1)

- [x] T003 Add \`app/crystal-ball-client/daily-usage.js\` to read/write the visitor-local count, validate persisted values, use local date keys, and fall back to in-memory state if storage is unavailable.
- [x] T004 Update \`app/crystal-ball-client/CrystalBallClient.js\` to remove the GET quota fetch, load the local counter, synchronize storage events, reset at local date change, and count only successful AI-backed answers.
- [x] T005 Add a visible HH:MM:SS local-midnight countdown to \`app/components/CrystalBall/CrystalBall.tsx\` and style it in \`CrystalBall.module.css\`.

## Phase 3 — Remove server-side daily quota, preserve safeguards (P1)

- [x] T006 Remove Redis/KV/memory daily quota reservations, UTC-day quota keys, and the \`GET /api/oracle\` status handler from \`app/api/oracle/route.js\`.
- [x] T007 Preserve the short-window API rate limit, CORS, sanitization, prompt-injection filters, 120-character maximum, AI prompt/model, response aliases, and fallback response behavior.
- [x] T008 Reject missing, non-string, empty, oversized, and filtered questions before an AI-provider fetch.
- [x] T009 Remove obsolete \`app/lib/oracle-usage.js\` and its old server-quota unit test; point Visual QA at the new client-side unit tests.

## Phase 4 — Regression tests and CI (P1)

- [x] T010 Add \`__tests__/crystal-ball-daily-usage.test.js\` for local calendar keys, local-midnight boundaries, old-day reset, clamped values, and in-memory fallback.
- [ ] T011 Extend \`tests/visual/crystal-ball-daily-limit.spec.ts\` to assert that the live countdown renders and the three-question lockout still works.
- [ ] T012 Run targeted Vitest and Crystal Ball Playwright tests on the candidate.
- [ ] T013 Run the full test suite, standalone TypeScript check, \`./jules-verify.sh\`, production build, and OpenNext/Cloudflare validation.
- [ ] T014 Measure the final combined \`.next + public\` size and confirm it is below 495 MiB.
- [ ] T015 Inspect the final branch diff and current-head CI checks; record exact outcomes in \`PR_SUMMARY.md\`.

## Dependencies and execution order

Specify → plan → implementation → targeted tests → full tests/build/governance → final diff audit. Merge only after required current-head checks pass; physical browser/timezone behavior should be confirmed through the Playwright tests and remains distinct from build validation.
