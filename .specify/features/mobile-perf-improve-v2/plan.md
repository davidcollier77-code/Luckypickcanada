# Implementation Plan: Mobile Performance Improvements

**Branch**: task-mobile-perf-improve-v3 | **Date**: 2026-10-25 | **Spec**: .specify/features/mobile-perf-improve-v2/spec.md

## Summary

Optimize the 675KB PNG image (`1784889264858.png`) used for the Gift Experience section by converting it to AVIF and WebP formats at two responsive sizes (352w and 704w). Also remove an invalid `quality` prop from the map logo image to fix build warnings.

## Design Decisions

1. Generate `.avif` and `.webp` versions of the `1784889264858.png` image using `sharp`.
2. Update `app/homepage/HomePage.js` to use a responsive `<picture>` tag instead of a direct `<img>` tag.
3. Add `suppressHydrationWarning={true}` to the `<picture>` fallback `<img>` to prevent React hydration issues with Playwright tests checking the `ExploreLuckButton`.
4. Remove `quality={85}` from `<Image src="/map-logo-small.png">` in `app/lucky-map-of-canada/lucky-map-of-canada.js`.
