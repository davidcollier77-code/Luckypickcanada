# AVIF Image Optimization

## Goal
Improve image-loading performance across the application by implementing AVIF as the preferred delivery format for eligible raster images, with WebP or original formats as fallbacks, keeping `images.unoptimized: true` and current deployment intact.

## Scope
Convert large candidate images in `public/` (hero, map, cards, backgrounds) to AVIF format if file size reduces significantly without visual quality loss. Implement `<picture>` tags or CSS `image-set()` mechanisms to conditionally serve the optimized formats. Measure and report size savings.

## Constraints
* Hard 495MB build size limit.
* `images.unoptimized: true` must remain.
* Strict preservation of existing functionality, visual quality, interactions, and responsive design.
* Must not use external MCP services without approval.
* No unauthorized dependency upgrades or code refactors outside of asset optimization.
