# Tasks: Lucky Reveal Follow-up Polish

**Feature**: `specs/078-lucky-reveal-followup-polish`

## Phase 1 — Setup

- [x] T001 Confirm the merged reveal (076), the close-button stacking, the settled-leaf layout, the homepage card style and the assets the reveal loads.
- [x] T002 Reproduce the close-button dead zone in a real browser before changing anything.

## Phase 2 — User Story 1 (close control)

- [x] T003 [US1] Raise the close button above the content wrapper, enlarge its hit area to 44×44 with `touch-action: manipulation`, and move panel scrolling to the content wrapper.
- [x] T004 [US1] Verify one click/tap closes the reveal at the button centre and lower edge, on desktop and mobile, before and after scrolling.

## Phase 3 — User Story 2 (leaf pile)

- [x] T005 [US2] Replace the even row with a layered, overlapping pile of varied leaves over the gold glow.
- [x] T006 [US2] Paint the celebration layer behind the panel so no leaf can cover numbers, copy, or controls.

## Phase 4 — User Story 3 (container)

- [x] T007 [US3] Apply the homepage card gradient and 16 px backdrop blur to the panel, keeping the lucky-colour border, glow, radius and layout.

## Phase 5 — User Story 4 (images)

- [x] T008 [US4] Measure every reveal image (bytes, pixels, alpha) and record the format decision per asset, including SVG.
- [x] T009 [US4] Generate `public/assets/lucky-reveal-logo-232.{avif,webp,png}` from the existing PNG and load it first in the share renderer.

## Phase 6 — Tests and verification

- [x] T010 Update the celebration guards for the pile and add close-button/panel/logo guards.
- [x] T011 Run the focused suites, full Vitest, `tsc --noEmit`, `./freebuff-verify.sh`, and measure the build.
- [x] T012 Browser-verify close, pile, container and reduced motion on desktop and mobile; capture screenshots.
- [x] T013 Audit the final diff and record results in the single PR summary.
