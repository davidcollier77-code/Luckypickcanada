---
description: "Task list for image optimization feature"
---

# Tasks: Optimize Modern Image Formats

**Input**: Design documents from `/specs/009-optimize-modern-image/`
**Prerequisites**: plan.md, spec.md, research.md

## Phase 1: Setup (Shared Infrastructure)
**Purpose**: Prepare the verification directory for WebP assets

- [x] T001 [P] Ensure output directory exists or process happens inline

## Phase 2: Foundational (Blocking Prerequisites)
**Purpose**: Nothing required here, simple script execution.

## Phase 3: User Story 1 - Optimize Images (Priority: P1) 🎯 MVP
**Goal**: Convert Lucky Card Reveal images to WebP

### Implementation for User Story 1
- [x] T002 [P] [US1] Convert `public/NGC4216_crawford.jpg` to WebP at quality 85
- [x] T003 [P] [US1] Convert `public/IMG_20260728_220305_112042.png` to WebP at quality 85
- [x] T004 [P] [US1] Convert all card graphics (`public/standard-*.png`, `public/premium-*.png`, `public/flagship-*.png`, `public/a_polished_high_detail_card_illustration_poster_i.png`) to WebP at quality 85

## Phase 4: User Story 2 - Update References (Priority: P2)
**Goal**: Point the application logic to the new WebP images.

### Implementation for User Story 2
- [x] T005 [P] [US2] Update `app/lucky-card-reveal.js` to reference `.webp` paths.
- [x] T006 [P] [US2] Update `app/lucky-card-content.js` to reference `.webp` paths.
- [x] T007 [P] [US2] Verify `app/lucky-card-share.js` logic is not broken by the WebP source paths.

## Phase 5: Polish & Cross-Cutting Concerns
**Purpose**: Ensure the final quality and build size is maintained.

- [x] T008 [P] Perform visual inspection of all generated `.webp` files versus their `.png`/`.jpg` originals.
- [x] T009 [P] Run Next.js build to verify the application bundle does not exceed 495 MB.
- [x] T010 [P] Clean up test assets (e.g. `test_avif`, `test_webp` folders and `*.test.avif` files created during research).
