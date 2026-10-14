# AVIF Optimization Part 2

## Context
Following the successful initial rollout of AVIF optimization for the Lucky Pick Canada homepage hero and card reveals, this specification outlines the final push to optimize remaining major raster assets across three specific experiences: Lucky Meter, Lucky Stories/Map, and Crystal Ball.

## User Stories

### US1: Optimize Shared Homepage Background (Crystal Ball)
As a user visiting the Crystal Ball or homepage, I want the starry background to load quickly so that the immersive experience isn't delayed by heavy image payloads.
- **Priority**: P1
- **Criteria**: The external Pexels JPEGs used for `.homepage-sky-backdrop` must be converted to local AVIFs with WebP/original JPEG fallbacks. The visual composition and media-query cropping must remain identical.

### US2: Optimize Lucky Map Artwork and Form Background
As a user exploring Lucky Stories, I want the interactive map and the submission form background to be lightweight.
- **Priority**: P1
- **Criteria**: The interactive map (`IMG_20260731_055452_187611.png`) must be converted to AVIF with WebP/PNG fallbacks. The modal background (`lucky-map-sky.webp`) must prioritize a smaller AVIF version with CSS `image-set`. The map's crisp boundaries and text must remain legible.

### US3: Optimize Lucky Meter Background
As a user checking my daily resonance, I want the sky background to load efficiently.
- **Priority**: P2
- **Criteria**: The `lucky-meter-night-sky.webp` image must be wrapped in a `<picture>` tag prioritizing the existing `.avif` version, falling back to WebP.
