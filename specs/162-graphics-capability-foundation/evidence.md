# Verification Evidence — Adaptive Graphics Capability Foundation

- **Feature**: `specs/162-graphics-capability-foundation`
- **Branch**: `freebuff/ac8a265279e6080fde702b01`
- **Base**: `main` (`3d26f05d`, including merged feature 161)
- **Date**: 2026-11-14
- **Spec Kit stages**: Specify (`spec.md`), Plan (`plan.md`), Tasks (`tasks.md`), Implement (source, tests and Memory Bank)

## What was implemented

- Added one dependency-free shared module, `app/lib/graphics-capabilities.js`, providing:
  - lazy, page-lifetime-cached Canvas 2D, WebGL and `Path2D` capability checks (no probe at import
    time, and a probe WebGL context is released with `WEBGL_lose_context`);
  - a conservative device profile derived only from Save-Data, `deviceMemory` and
    `hardwareConcurrency`, with a standard tier when those hints are absent;
  - pixel-ratio caps (2 standard, 1.5 constrained) and a particle scale (1 standard, 0.7
    constrained);
  - safe 2D/WebGL getters that return `null` instead of throwing;
  - reduced-motion and document-visibility reads/listeners with cleanup;
  - a context-loss watcher that cancels WebGL loss so restoration is allowed and only observes 2D
    loss, where the event exists.
- Adopted the shared layer in the homepage star canvas, Aurora, the Lucky Meter WebGL engine and
  stage, the Lucky Card reveal, both share-image canvases, confetti pixel sampling, the maple-leaf
  `Path2D` path, the Explore Luck confetti instance, and the three retained legacy starfield
  components.
- Removed the engine's `powerPreference: 'high-performance'` hint. No replacement power preference
  or `failIfMajorPerformanceCaveat` was added, so each browser chooses its own GPU, software
  rasterizer and power profile.
- Added non-fatal fallbacks: static homepage/Aurora frames, the existing static cinematic glow on
  WebGL failure or loss, the existing share-image error message, basic confetti shapes without
  `Path2D`, and an Explore scroll that still runs when confetti creation fails.
- Added `__tests__/graphics-capabilities.test.js` for the shared layer and source guards, and
  `__tests__/cosmic-event-stage-fallback.test.jsx` for the WebGL-unavailable, context-loss and
  completion paths.

## Changed files

- `app/lib/graphics-capabilities.js` — new shared capability/runtime layer.
- `app/homepage/HomePage.js` — safe canvas acquisition, motion/visibility lifecycle, context loss,
  constrained density.
- `app/homepage/ExploreLuckButton.js` — confetti creation failure no longer blocks the Explore
  scroll.
- `app/lib/mapleLeafConfetti.mjs` — `Path2D` capability before `shapeFromPath`, basic-shape
  fallback retained.
- `app/lucky-card-reveal.js` — safe reveal canvas getters, null guard and context-loss cleanup.
- `app/lucky-card-share.js` — existing handled share-image error when 2D is unavailable.
- `app/lucky-reveal-celebration.jsx` — safe painted-pixel sampling.
- `app/lucky-reveal-share-image.js` — shared safe 2D getter for the existing guarded path.
- `components/Aurora.tsx` — safe 2D acquisition, DPR cap, shared motion/visibility, context loss.
- `components/CosmicEventStage.jsx` — static glow when the engine reports context loss.
- `components/cosmic-event-engine.js` — shared WebGL acquisition, no forced power preference,
  visibility pause/resume, context-loss lifecycle, constrained particle scale.
- `components/Starfield.tsx`, `components/TwinklingStars.tsx`, `components/ShootingStars.tsx` —
  retained legacy canvases moved onto the same safe lifecycle so the unsafe pattern cannot return.
- `__tests__/graphics-capabilities.test.js` — new focused unit/source guards.
- `__tests__/cosmic-event-stage-fallback.test.jsx` — deterministic static-glow, context-loss and
  completion coverage for the cinematic stage.
- `__tests__/lucky-card-reveal-presentation.test.js` — exact import-list guard updated for the new
  shared local import.
- `.specify/feature.json` — points at this feature.
- `specs/162-graphics-capability-foundation/*` — Spec Kit artifacts and this evidence.
- `memory-bank/activeContext.md`, `progress.md`, `techContext.md` — task state and verified facts.

`playwright.config.ts`, `playwright.swiftshader.config.ts`, `.github/workflows/visual-qa.yml`, all
QA checker scripts, `package.json`, `pnpm-lock.yaml`, `app/globals.css` and every committed visual
baseline are unchanged.

## Checks performed

| Check | Status | Evidence |
| --- | --- | --- |
| Focused graphics Vitest | PASS | `__tests__/graphics-capabilities.test.js`: 14/14 tests, exit 0 |
| Cosmic stage fallback Vitest | PASS | `__tests__/cosmic-event-stage-fallback.test.jsx`: 3/3 tests, exit 0 |
| Affected component Vitest | PASS | Graphics plus reveal celebration/confetti files: 4 files, 43/43 tests, exit 0 |
| Full Vitest suite | PASS | 79 files, 751/751 tests, exit 0 |
| Type check | PASS | `pnpm exec tsc --noEmit`, exit 0 |
| Repository gate | PASS | `./freebuff-verify.sh`, exit 0; 36/36 isolated documentation tests |
| Production build (clean) | PASS | 302,780,210 bytes (288.75 MiB), strictly below the 495 MiB cap |
| Production-build browser checks | PASS | Chromium, 1440×900: normal canvas painted 4,994 alpha pixels; reduced motion cleared once and added 0 clears in 800 ms; no-2D page kept its heading and canvas with zero graphics `pageerror`s |
| Committed homepage visual baselines | PASS | Desktop, mobile-390 and mobile-412 baseline and interaction checks matched; 22 passed, 5 environment-appropriate skips, 0 failed |
| Graphics-related page errors | PASS | No matching `pageerror` in the production no-2D scenario or the normal run |
| Standard Playwright config unchanged | PASS | `git diff -- playwright.config.ts` empty; no SwiftShader flags added |
| SwiftShader config unchanged | PASS | `git diff -- playwright.swiftshader.config.ts` empty |
| Protected files unchanged | PASS | No diff for `app/globals.css`, `package.json`, `pnpm-lock.yaml`, `next.config.mjs`, `wrangler.jsonc`, `tailwind.config.js`, `postcss.config.cjs` |
| New dependency/service | PASS | `package.json` and lockfile unchanged; standard browser APIs only |
| Firefox/WebKit | BLOCKED | Browsers downloaded, but launch refused because required host libraries are absent (see below) |
| Samsung Internet | NOT RUN | No Samsung Internet binary is available in this environment |

## Browser coverage and limitations

- **Chromium 156.0.8078.4** (Playwright v1248): desktop 1440×900 and mobile-390/mobile-412 projects
  passed the homepage visual suite. This covers the Chromium engine used by Chrome, Edge and the
  Chromium base of Samsung Internet, but it is not a test of those vendor shells.
- **Firefox**: Playwright downloaded Firefox 157.0, but launch failed host validation. Missing
  libraries were `libxcursor1`, `libgtk-3-0t64`, `libcairo-gobject2` and
  `libgdk-pixbuf-2.0-0`. The workspace has no root access and no apt package metadata, so they
  could not be installed locally.
- **WebKit/Safari**: Playwright downloaded WebKit 27.2, but launch failed host validation. Missing
  libraries included `libgstreamer-1.0.so.0`, `libgtk-4.so.1`, `libgdk_pixbuf-2.0.so.0` and
  `libcairo-gobject.so.2`; the same environment limitation applies.
- The implementation uses only standards-based feature checks (`getContext`, `matchMedia`,
  `visibilityState`, `Path2D`) and has no browser-name or renderer-string branch. Firefox and
  WebKit still require a run in an environment with their native libraries before release claims
  cross-browser browser verification.

## Notes

- The visual baselines use device pixel ratio 1, so the shared DPR caps do not alter them. The
  homepage star count at the tested viewports is unchanged; the constrained particle scale and
  standard DPR cap only apply to lower-tier or higher-DPR devices.
- No artwork, copy, sound, route, data boundary, payment, authentication or deployment setting was
  changed.
- The production build was measured from a clean `.next` directory so cached `next dev` output did
  not inflate the result.
