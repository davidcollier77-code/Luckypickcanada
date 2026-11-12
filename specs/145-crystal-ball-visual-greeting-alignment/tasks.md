# Tasks: Crystal Ball Visual Greeting Alignment

**Input**: Design documents from `specs/145-crystal-ball-visual-greeting-alignment/`

## Phase 1: Align Visual Assertions

- [x] T001 Add a shared Playwright assertion helper that reads the live `GREETINGS` source and browser-local quiet-day message in `tests/visual/crystal-ball-greeting-assertions.ts`.
- [x] T002 Update `tests/visual/crystal-ball-greeting.spec.ts` to recognize all current personalities, allow quiet-day greetings, and verify the persisted greeting index does not repeat the previous day's index.
- [x] T003 Update `tests/visual/crystal-ball-interactions.spec.ts` to use the shared recognized-greeting assertion.
- [x] T004 Update `tests/visual/crystal-ball.spec.ts` to use the shared recognized-greeting assertion.
- [ ] T005 Run the affected Visual QA specs across desktop, mobile-390 and mobile-412 and confirm the existing greeting, fortune, artwork and follow-up assertions pass.

## Dependencies & Execution Order

- T001 is the shared helper.
- T002, T003 and T004 consume the helper and can be checked independently.
- T005 is the PR-triggered Playwright verification.
