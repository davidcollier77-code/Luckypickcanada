# Feature Specification: Modernize Assets

## Background
The Lucky Card Reveal visual assets need modernization to reduce file weight, improve performance, and ensure smooth UX without sacrificing visual quality or altering the aesthetic of the page.

## Purpose
Convert large PNG and JPG assets used throughout the reveal page into appropriate modern formats (like WebP) that yield better file size for the exact same fidelity. Update necessary references in the codebase to point to these newly optimized assets.

## Scope
- Convert social open-graph image (`1785347037732.png`) to WebP.
- Convert share popup logo (`BackgroundEraser_20260724_163638777.png`) to WebP.
- Convert map modal image (`IMG_20260731_055452_187611.png`) to WebP.
- Convert small map logo (`map-logo-small.png`) to WebP.
- Verify existing webp conversions for cards and other assets.
- Update code references in `app/lucky-card-share.js` and `app/lucky-map-of-canada/lucky-map-of-canada.js`.
- Confirm visual fidelity has not degraded.
- Confirm build size does not exceed the 495MB limit.

## Implementation Guidelines
- Preserve original PNG files.
- Ensure that the resulting webp assets are equal in visual quality.
- Do not make extraneous functional changes or layout modifications.
