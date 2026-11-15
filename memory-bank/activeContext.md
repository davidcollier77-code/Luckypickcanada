# Active Context — Adaptive graphics capability foundation

- **Updated:** 2026-11-14
- **Repository:** davidcollier77-code/Luckypickcanada
- **Branch:** `freebuff/ac8a265279e6080fde702b01`
- **Base:** `main` (`3d26f05d`, including merged feature 161)
- **Spec Kit feature:** `specs/162-graphics-capability-foundation`

## Current Task

The site now has one shared, dependency-free graphics capability layer at
`app/lib/graphics-capabilities.js`. Every active canvas and WebGL renderer uses it for safe context
acquisition, reduced-motion and visibility lifecycle, and context-loss handling. The browser still
chooses its own GPU, software rasterizer and power profile; no renderer, vendor or browser name is
forced or rejected.

## Scope and safeguards

- Canvas 2D, WebGL and `Path2D` checks are lazy and cached for the page lifetime. Importing the
  module performs no graphics work.
- Safe getters return `null`; the existing static glow, CSS backdrop, share-image error and basic
  confetti shapes remain the fallbacks.
- `powerPreference: 'high-performance'` was removed from the cinematic engine. No replacement power
  preference or `failIfMajorPerformanceCaveat` was added.
- The homepage keeps its approved star density on standard devices; only a constrained tier uses
  the shared 0.7 particle scale. DPR is capped at 2 standard and 1.5 constrained for canvases that
  already scale by DPR.
- `playwright.config.ts`, `playwright.swiftshader.config.ts`, visual baselines, QA checkers,
  protected files and the dependency lockfile are unchanged.
- No feature was migrated to GPU rendering; this is a compatibility and lifecycle foundation only.

## Verification

- Focused graphics tests: 14/14 passed; cosmic stage fallback tests: 3/3 passed; affected
  component run 43/43 passed.
- Full Vitest: 751/751 passed in 79 files.
- `pnpm exec tsc --noEmit`: exit 0.
- `./freebuff-verify.sh`: exit 0, including 36/36 documentation tests.
- Clean production build: 302,780,210 bytes (288.75 MiB), below the 495 MiB cap.
- Production-build Chromium checks: normal homepage canvas painted 4,994 alpha pixels; reduced
  motion added zero clears in 800 ms; the no-2D page kept its heading and canvas with zero graphics
  page errors.
- Committed homepage visual baselines and interactions passed for desktop, mobile-390 and
  mobile-412 (22 passed, 5 expected skips, 0 failed).
- Firefox/WebKit launch is blocked by missing native host libraries; Samsung Internet is not
  installed. These are recorded as untested in `evidence.md`, not claimed as passes.

## Remaining

- Open the regular, non-draft PR for owner review.
- Cross-browser verification in Firefox, WebKit/Safari and Samsung Internet must run in an
  environment that provides those browsers and native libraries.
