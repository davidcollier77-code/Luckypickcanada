# Tasks: Homepage Search Listing

**Input**: `specs/151-homepage-search-listing/` · **Prerequisites**: `plan.md`, `spec.md`

## Phase 1 — Setup

- [X] T001 Read the live homepage `<head>`, `robots.txt` and image headers to record the current description, image URL
      and crawler access.
- [X] T002 Capture the deployed homepage with Playwright at 1440 × 900.

## Phase 2 — Implementation

- [X] T003 [US1] Crop the hero band, resize to 1200 × 630 and encode an optimized progressive JPEG as
      `public/luckypickcanada-home-1200x630.jpg`.
- [X] T004 [US1] Point the root `og:image`/`twitter:image` at the homepage capture with matching dimensions and
      descriptive alt text.
- [X] T005 [US2] Publish the approved description verbatim on the standard, Open Graph, Twitter and WebSite JSON-LD
      surfaces through one shared constant.

## Phase 3 — Tests

- [X] T006 Update `__tests__/feature-image-social-sharing.test.js`: keep the feature-route share artwork contract, add
      the homepage capture's dimension/format/size guard and the root metadata guard.

## Phase 4 — Verify

- [X] T007 Focused guard and the full unit suite.
- [X] T008 Type check, production build and build size against the 495 MiB cap.
- [X] T009 `./freebuff-verify.sh`.
- [X] T010 Inspect the built homepage head for all four description surfaces and the absolute image URL; probe the live
      `robots.txt` and image delivery for crawler access.
