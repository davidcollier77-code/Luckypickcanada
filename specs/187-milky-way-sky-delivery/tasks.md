# Tasks: Render-Time Milky Way Sky Delivery

**Feature**: `specs/187-milky-way-sky-delivery`

## Phase 1: Setup

- [X] T001 Read `AGENTS.md`, `PR_SUBMISSION.md`, the four Memory Bank files, the selected task groups and the applicable `.docs/` sources.
- [X] T002 Inspect `themes/default/homepage.css`, the four routes that paint the sky, the artwork files and the existing delivery guards.
- [X] T003 Measure the audit baseline and candidate encodings against the JPEG masters.

## Phase 2: Delivery

- [X] T004 Add `app/components/SkyBackdrop.js` with mobile/desktop AVIF, WebP and JPEG sources at the 820 px breakpoint.
- [X] T005 Render the shared layer from the homepage, Crystal Ball, Crystal Ball preview and Lucky Map routes.
- [X] T006 Replace the CSS background stack with the artwork element plus the preserved gradient/glow overlays and focal treatment.
- [X] T007 Re-encode the mobile and desktop AVIF artwork at unchanged dimensions.

## Phase 3: Verification

- [X] T008 Add `__tests__/milky-way-sky-delivery.test.js` covering delivery, format order, focal treatment, scheduling hints, dimensions and byte reduction.
- [X] T009 Update the reveal-background unit guard and the homepage visual guard to assert the rendered sky image.
- [X] T010 Run the focused suites, `tsc --noEmit`, the full unit suite, `./freebuff-verify.sh` and measure the production build size.
- [X] T011 Capture production-server browser evidence for the homepage, Crystal Ball and Lucky Map at mobile and desktop widths.
