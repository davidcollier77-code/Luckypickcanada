# Tasks: Milky Way Background for the Lucky Reveal Experience

**Feature**: `specs/074-lucky-reveal-milky-way-background`

## Phase 1 — Setup

- [x] T001 Confirm the current reveal background layers in `app/lucky-reveal-popup.js` and the homepage artwork declaration (`.homepage-sky-backdrop` in `themes/default/homepage.css`), including the three served asset variants.

## Phase 2 — Foundational

- [x] T002 Add the shared homepage-artwork `image-set()` constant and repoint the popup overlay background to it at `center 45% / cover` in `app/lucky-reveal-popup.js`.

## Phase 3 — User Story 1 (reveal over the homepage sky)

- [x] T003 [US1] Remove the three aurora glow layers, the nine twinkling star points, and `starPositions` from `app/lucky-reveal-popup.js`.
- [x] T004 [US1] Remove the unused `lucky-aurora-glow-1`, `lucky-aurora-glow-2`, and `lucky-twinkle` keyframes from `app/lucky-reveal-popup.js`.
- [x] T005 [US1] Drop the lucky-colour `radialGlow` background values from `themeGlows` and keep the themed border and shadow on the panel in `app/lucky-reveal-popup.js`.
- [x] T006 [US1] Keep the panel scrim dark enough for legible copy over the artwork without reintroducing a second background treatment in `app/lucky-reveal-popup.js`.

## Phase 4 — Tests and verification

- [x] T007 Add `__tests__/lucky-reveal-background.test.js` covering the artwork reference, format order, focal point, removal of the aurora background, absence of meteor/shooting-star effects, and preserved reveal content.
- [x] T008 Run `pnpm exec vitest run`, `pnpm exec tsc --noEmit`, and `./freebuff-verify.sh`; measure the production build size.
- [x] T009 Audit the complete final diff and record the result in the single PR summary.

## Dependencies

- T002 blocks T003–T006.
- T007 depends on T002–T006 being final.
- T008 runs after T007; T009 runs last.

## Implementation Strategy

One sequential pass over a single component, followed by the guard test, the verification gate, and
the diff audit.
