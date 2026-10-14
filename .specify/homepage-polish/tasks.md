# Tasks

## Phase 1: CSS and Structural Adjustments
- [X] T001 [US1] Update `themes/default/homepage.css` to adjust background treatment of `.homepage-community-card`.
- [X] T002 [US1] Update `app/homepage/HomePage.js` to remove the opaque dark overlay and adjust image styling for Lucky Stories container.

## Phase 2: React Component Fixes
- [X] T003 [US2] Update `app/turnstile-field.jsx` to correct the empty loading container and broken visual display.

## Phase 3: SEO and Metadata Updates
- [X] T004 [US3] Update `app/layout.js` metadata (Title, Description, OpenGraph, Twitter, JSON-LD) to match SEO requirements.
- [X] T005 [US4] Update `app/homepage/Hero.js` with the improved alt text for the hero image.
- [X] T006 [US5] Update `app/page.js` to apply the `premium-surface` class or relevant glass-panel styling to the `.homepage-seo-section` and refine the content.

## Phase 4: Verification
- [X] T007 [P] Run `pnpm run build` and measure the build size to ensure it's under 495 MB.
- [X] T008 [P] Run `pnpm exec playwright test` for visual and functional verification.
- [X] T009 [P] Run `./jules-verify.sh`.
