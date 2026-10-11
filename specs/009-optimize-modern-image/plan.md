# Implementation Plan

## Technical Context
- **Feature Name**: Optimize modern image formats on the Lucky Card Reveal page
- **Primary Domain**: UI Assets / Performance Optimization
- **Tech Stack**: Next.js App Router, React
- **Key Libraries**: Sharp CLI for asset conversion (already verified), WebP format.
- **Project Structure**: Image assets are located in `/public`. The main reveal route is `/app/reveal` and rendering logic is in `/app/lucky-card-reveal.js` and `/app/lucky-card-content.js`.

## Constitution Check
- The project adheres to strict size limits (495 MB).
- Original source assets must be kept.
- Visual quality must be preserved or improved.
- No new runtime dependencies will be introduced to the Next.js bundle; images are processed ahead of time.

## Phase 0: Outline & Research
- We have investigated AVIF vs WebP for file size and quality.
- WebP offers excellent file size reduction while preserving high-fidelity visual quality.
- Sharp CLI has been verified to convert to `.webp` efficiently.
- WebP replaces AVIF because it is more widely supported while hitting the file size reduction goal.

## Phase 1: Design & Contracts
- The `LUCKY_CARD_IMAGES` object in `/app/lucky-card-content.js` will map to `.webp` paths.
- The `src` fields in `app/lucky-card-reveal.js` will point to `NGC4216_crawford.webp` and `IMG_20260728_220305_112042.webp`.
- The share component (`app/lucky-card-share.js`) pulls image sources from the rendered DOM, which Next.js Image handles, but drawing the final PNG to canvas remains the same.
