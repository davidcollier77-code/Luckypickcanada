# Tasks: Homepage Welcome Panel Cleanup

**Input**: Design documents from `/specs/118-hero-welcome-panel-cleanup/`

**Prerequisites**: plan.md, spec.md

## Phase 1: Setup

- [X] T001 Inspect current main, existing hero implementation, merged PR #1780, open PRs and the existing Explore scroll control; confirm no duplicate work.

## Phase 2: Foundational

No foundational work is required. This is a presentation-only change with no shared infrastructure, state, API, data or dependency changes.

## Phase 3: User Story 1 — A shorter welcome panel (Priority: P1)

**Goal**: Keep the welcome panel and its explanatory copy, remove its large gold CTA and gold note, and move the painted Explore title/arrows closer without changing their behaviour.

**Independent Test**: Confirm the panel's content and dark/gold treatment remain, the two unwanted elements are absent, the Explore button is still rendered after the panel, and existing browser interaction tests continue to validate its scroll destination.

- [X] T002 [US1] Remove only the welcome-card CTA and gold note from `app/homepage/Hero.js`, retaining the heading, lede, paragraph and separate `<ExploreLuckButton />`.
- [X] T003 [US1] Compact the welcome panel padding and divider margins and remove the unused CTA/note styles in `themes/default/hero.css`.
- [X] T004 [US1] Update `__tests__/homepage-hero-layout.test.js` to assert retained copy, absence of removed elements/styles, compact card framing and continued Explore control placement.
- [ ] T005 [US1] Run the focused Vitest guard and the existing Playwright homepage visual/Explore interaction suites; refresh visual baselines only from actual browser renders in `tests/visual/__screenshots__/`.

## Phase 4: Polish and verification

- [ ] T006 Run `./freebuff-verify.sh`, type-check, full Vitest, required Playwright checks, and build-size measurement; inspect the complete diff and record actual outcomes.

## Dependencies & Execution Order

- T001 precedes implementation.
- T002 and T003 are the application change; T004 guards the resulting markup and layout.
- T005 depends on T002–T004.
- T006 depends on the implementation and test results.

## Parallel Opportunities

- T002 and T003 affect separate files and may be implemented in parallel.
- T004 is a separate test file and can be prepared alongside the application changes.
- Browser verification and full repository verification are sequential handoff gates after the files are assembled.

## Implementation Strategy

1. Complete the scoped markup and CSS changes.
2. Update the deterministic source guard.
3. Verify the welcome panel and existing Explore control on mobile and desktop.
4. Run the repository verification gate and inspect the complete final diff before PR handoff.
