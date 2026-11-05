# Tasks: About Page Return to Home Gold CTA

**Input**: Design documents from `specs/093-about-home-gold-cta/`

**Prerequisites**: `plan.md` and `spec.md`

**Tests**: Browser regression coverage is required by the feature's acceptance criteria.

## Phase 1: User Story 1 — Consistent About Page Home Action (Priority: P1)

**Goal**: Give the About-page Return to Home link the shared sitewide gold CTA treatment while preserving its home navigation and accessible name.

**Independent Test**: Run the existing sitewide gold CTA Playwright spec and verify the About link's shared gradient, raised edge, accessible name, and `href="/"`.

- [X] T001 [US1] Replace the obsolete dark-style About-link assertions with gold-style, accessible-name, and homepage-destination assertions in `tests/visual/sitewide-gold-cta.spec.ts`.
- [X] T002 [US1] Apply `.gold-3d-btn` and the aria-hidden decorative home icon to the existing Return to Home link in `app/about/page.js`, preserving `href="/"`, label, and wrapper.
- [ ] T003 [US1] Run the targeted browser regression spec `pnpm exec playwright test tests/visual/sitewide-gold-cta.spec.ts` and record its actual result.
- [ ] T004 [US1] Run `./freebuff-verify.sh`, confirm required checks, and record the measured production build size against the 495 MB maximum.

## Dependencies & Execution Order

1. T001 establishes the regression expectation.
2. T002 implements the requested visual change.
3. T003 and T004 provide runtime and repository-level verification; both remain pending until executed.

No tasks are independent enough to require parallel execution.

## Implementation Strategy

Deliver the single P1 user story only. Do not broaden the change to other buttons, page copy, global styles, or navigation.
