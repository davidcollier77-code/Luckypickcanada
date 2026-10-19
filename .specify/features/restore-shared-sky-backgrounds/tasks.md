# Tasks: Restore Shared Sky Backgrounds

**Input**: .specify/features/restore-shared-sky-backgrounds/spec.md and plan.md

## Phase 1: Scoped Repair

- [X] T001 Restore import '../themes/default/index.css' before import './globals.css' in app/layout.js.
- [X] T002 Remove the duplicate theme import from app/globals.css.
- [X] T003 Add a Playwright computed-style regression check for the shared backdrop on /, /crystal-ball, and /map in tests/visual/homepage.spec.ts.
- [X] T004 Create scoped Spec Kit artifacts and document the reported visual regression in PR_SUMMARY.md, memory-bank/activeContext.md, and memory-bank/progress.md.

## Phase 2: Verification (Pending Remote CI)

- [ ] T005 Run pnpm exec playwright test tests/visual/homepage.spec.ts and inspect current-head results for the three-route sky backdrop regression check.
- [ ] T006 Run pnpm run test, pnpm tsc --noEmit, and ./jules-verify.sh on the repaired head; fix in-scope failures.
- [ ] T007 Verify Next.js/OpenNext build and measured .next + public output strictly below 495 MiB.
- [ ] T008 Inspect final PR diff and all current-head CI results before claiming the visual regression is resolved.

## Implementation Strategy

Restore the prior CSS loading order first, then verify that the backdrop's CSS remains applied on each affected route. No image, theme CSS declarations, component markup, page copy, or interaction behavior should be redesigned in this task.
