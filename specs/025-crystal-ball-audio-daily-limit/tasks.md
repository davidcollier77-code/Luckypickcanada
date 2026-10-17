# Tasks: Crystal Ball Audio and Daily Question Limit

## Phase 1 — Specify

- [x] T001 Define the user stories, audio moments, quota semantics, edge cases, and success criteria in specs/025-crystal-ball-audio-daily-limit/spec.md.
- [x] T002 Review the specification quality criteria in specs/025-crystal-ball-audio-daily-limit/checklists/requirements.md.

## Phase 2 — Plan and research

- [x] T003 Record verified findings and storage/audio decisions in specs/025-crystal-ball-audio-daily-limit/research.md.
- [x] T004 Document architecture, constraints, and verification plan in specs/025-crystal-ball-audio-daily-limit/plan.md.
- [x] T005 Define the quota entity in specs/025-crystal-ball-audio-daily-limit/data-model.md.
- [x] T006 Document API contract and validation workflow in specs/025-crystal-ball-audio-daily-limit/contracts/oracle-quota.md and specs/025-crystal-ball-audio-daily-limit/quickstart.md.

## Phase 3 — User Story 1 (P1): Reveal audio

- [x] T007 Add Howler-backed preloading and phase-based sound helpers in app/lib/audio.js.
- [x] T008 Connect energy, reveal, and golden-leaf cues in app/components/CrystalBall/CrystalBall.tsx.
- [x] T009 Preserve styling and provide quota messaging in app/components/CrystalBall/CrystalBall.module.css.

## Phase 4 — User Story 2 (P1): Daily quota

- [x] T010 Implement hashed daily keys, reservation, commit, release, and quota summary in app/lib/oracle-usage.js.
- [x] T011 Enforce the limit and expose uncached status in app/api/oracle/route.js.
- [x] T012 Refresh and display quota state in app/crystal-ball-client/CrystalBallClient.js.
- [x] T013 Add quota unit coverage in __tests__/oracle-usage.test.js.
- [x] T014 Extend tests/visual/crystal-ball-interactions.spec.ts with deterministic quota responses.
- [x] T015 Add three-answer UI coverage in tests/visual/crystal-ball-daily-limit.spec.ts.

## Phase 5 — Verify and report

- [ ] T016 Run pnpm exec vitest run __tests__/oracle-usage.test.js and pnpm run test; record actual outcomes.
- [ ] T017 Run both Crystal Ball Playwright specs through playwright.config.ts in desktop and mobile projects.
- [ ] T018 Run pnpm tsc --noEmit, ./jules-verify.sh, and pnpm run build.
- [ ] T019 Measure .next plus public; stop if size is at least 495 MB and verify audio on a real mobile device.
- [ ] T020 Inspect PR CI, inspect the final diff, and reconcile the summary's changed-file list before merge.

## Dependencies and execution order

Specify → plan/research → implementation → tests and final checks. Verification tasks remain open until commands and CI outcomes are observed.

## Parallel opportunities

Once a checkout exists, unit quota tests and browser tests can run independently. Type-check, build, repository verification, and output-size checks should be recorded separately.
