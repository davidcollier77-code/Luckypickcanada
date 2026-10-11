# Feature Specification: Optimize Modern Image Formats

**Date**: 2026-10-11
**Context**: Optimize modern image formats on the Lucky Card Reveal page ("/reveal") while preserving or improving visual quality.

## Objective
Use modern formats (WebP/AVIF) to reduce file sizes for images loaded on the `/reveal` route, addressing Page Analysis warnings without compromising visual quality, adhering strictly to the non-negotiable image quality requirement (preserve or improve).

## Scope
- Convert relevant images on the `/reveal` route to modern formats (WebP preferred for balance of quality/size).
- Update application references to use the optimized images.
- Keep original source assets intact.
- Out of scope: Other pages, general caching policies, structural changes, JS splitting.

## Requirements
- Images must not suffer visible quality degradation.
- Ensure all converted assets are successfully loaded on `/reveal`.
- Revisions must not cause the total project size to exceed 495MB.

## Success Criteria
- Page Analysis warning regarding modern image formats on `/reveal` is resolved or measurably reduced.
- Reduced file payload for image assets on `/reveal`.
- Visual quality remains identical or better.
