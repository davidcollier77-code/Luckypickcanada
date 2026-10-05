# Active Context

## Current Goals
- Optimize homepage hero image delivery for better performance (PageSpeed Insights).

## Recent Work
- Identified `public/homepage-hero-lucky-pick-canada.webp` as the target for optimization.
- Analyzed container layout and Next.js image config (`unoptimized: true`).
- Resized the image from 1024x1536 to 800x1200 at Q85 WebP, achieving a file size reduction from 293KB to 228KB (~20% savings) without visual degradation in the 1100px max container.

## Open Questions
- None currently.

## Pending Verification
- CI/CD build success.
- Visual inspection in staging.
