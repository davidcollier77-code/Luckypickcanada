# Evidence: Shared Adaptive Performance and Rendering System

**Date**: 2026-11-17
**Branch**: `freebuff/1716deb7870376472b3b3bb7`
**Base**: `main` at `ec4b5258`
**Task groups**: creation, testing, polishing (performance/rendering)
**Library sources consulted**: `.docs/creation/_vercel-labs_agent-skills_react-best-practices.md` (useful:
  effect/listener cleanup and avoiding per-render work), `.docs/testing/_google_eng-practices.md` (useful:
  focused, behaviour-level test expectations), `.docs/testing/_microsoft_playwright.md` (useful: production
  build profile measurement via context hints and CDP throttling).

## Implementation

- `app/lib/adaptive-performance.js` — dependency-free layer:
  - `readNetworkState` / `classifyNetwork`: measured downlink and RTT decide `fast`/`moderate`/`slow`;
    `effectiveType` is only a fallback; unknown labels are discarded; no 5G inference.
  - `readDeviceState`: memory, cores, pixel ratio, viewport, reduced motion, coarse pointer. Missing or
    non-numeric hints stay `null` and never reduce a budget.
  - `readHeapPressure`: optional `performance.memory`, threshold 85%.
  - `resolveAdaptivePlan`: one deterministic plan (tier, frame rate, animation budget, prefetch, audio,
    image-quality hint, parallel-request limit, release flag) with a `reasons` entry per adaptation.
  - Runtime: `getAdaptivePlan`, `refreshAdaptivePlan`, `subscribeToAdaptivePlan` (one shared listener set,
    120 ms debounce, optional 20 s heap poll, complete teardown), `createAdaptiveFrameLoop`,
    `shouldPrefetchOnIntent`, `allowSpeculativeAudio`, `getAdaptiveCapabilities`,
    `registerReleasableResource`, `releaseRegisteredResources`.
- `app/lib/use-adaptive-plan.js` — React binding over the shared subscription.
- Frame governor adopted by `components/Starfield.tsx`, `components/TwinklingStars.tsx`,
  `components/ShootingStars.tsx`, `components/Aurora.tsx` and the homepage canvas in
  `app/homepage/HomePage.js`. Artwork, density constants, reduced-motion branches and fallbacks unchanged.
- `components/IntentPrefetchLink.jsx` — hover only on a capable connection; press/tap/focus on moderate;
  no prefetch on slow/Save-Data; navigation and handlers unchanged; recovers when the connection improves.
- `app/lib/audio.js` — speculative preloads defer under constraint while every playback path uses an
  ungated loader; `releaseIdleAudio` unloads idle decoded sounds and is registered with the release
  registry; a playing sound is never interrupted.

## Unit and component tests

| Check | Command | Result |
| --- | --- | --- |
| Focused adaptive suites | `pnpm exec vitest run __tests__/adaptive-performance.test.js __tests__/intent-prefetch-link.test.jsx __tests__/audio-adaptive-release.test.js` | PASS — 3 files, 52 tests |
| Audio regression suites | `pnpm exec vitest run __tests__/audio-adaptive-release.test.js __tests__/lucky-reveal-phase3.test.js __tests__/lucky-reveal-confetti-phase1.test.js __tests__/lucky-reveal-finish-phase2.test.js __tests__/reveal-applause-retry.test.js __tests__/audio-exports.test.js` | PASS — 6 files, 65 tests |
| Full suite | `pnpm exec vitest run` | 910/911 passed. The single failure is the pre-existing `agent-governance-single-source` assertion, which expects an `AGENTS.md` phrase absent on `main`; this task does not modify `AGENTS.md`. The separate refresh-docs checker (48 tests) has one pre-existing `.docs/` snapshot failure, also unrelated to this change. |
| Type check | `pnpm exec tsc --noEmit` | PASS — exit 0 |

Coverage added by this task:

- Network: absent API, unprefixed and prefixed shapes, unknown labels, label-vs-measurement conflict,
  Save-Data precedence, threshold boundaries.
- Device: missing/zero/non-numeric hints, feature report, capable fallback.
- Profiles: low/medium/high mobile and low/medium/high desktop, plus reason attribution.
- Accessibility: reduced motion pauses animation while every functional budget is unchanged.
- Changing conditions: debounced reassessment, recovery from slow to fast, hidden/visible, throwing
  subscriber isolation.
- Cleanup: two subscribers share one listener set, last unsubscribe removes every listener, no timers.
- Frame governor: 60 fps capable, 30 fps constrained, recovery mid-loop, hidden/reduced-motion stop,
  cancel/dispose, real rAF path.
- Resources: release once per episode, failure isolation, idle-audio unload/reload, playing sound preserved.
- Preservation: every ambient renderer uses the governor, density constants, reduced-motion branches and
  artwork calls remain; no cookie/storage/user-agent reads.

## Production build

| Check | Result |
| --- | --- |
| `pnpm run build` (inside `./freebuff-verify.sh`) | PASS — compiled successfully, 21/21 static pages |
| Production build size (`.next` + `public`) | **344,342,416 bytes = 328.39 MiB**, below the 495 MiB cap |
| `./freebuff-verify.sh` | Spec Kit gate PASS, type check PASS, build PASS, refresh-docs tests 47/48 |
| Refresh-docs failure | Pre-existing: `every snapshot is valid Markdown or safely identified as legacy HTML` inspects the read-only `.docs/` library, which this task did not modify (`.docs/` absent from `git status`). Recorded in `activeContext.md` as a known pristine-`main` failure. |

## Browser measurement (production build, Chromium 1248, headless SwiftShader)

Method: `artifacts/adaptive-performance-20261117/benchmark.mjs` loads the built homepage with device and
network hints injected before application scripts, blocks off-origin requests, counts 2D canvas
`clearRect` calls (one per ambient paint) over a 2.5 s window, and records long tasks, heap and load timing.
Per-profile CPU throttling uses CDP `Emulation.setCPUThrottlingRate`.

| Profile | Viewport | CPU | Paints/s | Long tasks | Heap | DOMContentLoaded |
| --- | --- | --- | --- | --- | --- | --- |
| low mobile (1 GB, 2 cores, Save-Data, 0.4 Mbps) | 360×740@2x | 4× | 24.4 | 60 ms total | 9.5 MB | 253 ms |
| medium mobile (4 GB, 4 cores, 2 Mbps) | 390×844@3x | 2× | 45.2 | 0 | 9.5 MB | 525 ms |
| **same-viewport capable** (8 GB, 16 cores, 30 Mbps) | 390×844@2x | 1× | **56.4** | 0 | 9.5 MB | 105 ms |
| **same-viewport constrained** (1 GB, 2 cores, Save-Data) | 390×844@2x | 1× | **29.6** | 0 | 9.5 MB | 93 ms |
| high desktop (8 GB, 16 cores, 30 Mbps) | 1440×900@1x | 1× | 20.8 | 0 | 9.5 MB | 146 ms |
| high desktop, reduced motion | 1440×900@1x | 1× | 0 | 0 | 9.5 MB | 85 ms |

Interpretation and measured improvement:

- At an identical viewport and CPU rate, the constrained profile painted **47.5% fewer animation frames**
  than the capable profile (29.6 vs 56.4 per second), exactly the 30 fps governor target, with every
  renderer still mounted and zero long tasks.
- The capable profile stayed near 60 fps; the medium profile was limited by its own 2× CPU throttle, and the
  low profile by its 4× throttle plus software rasterisation.
- Reduced motion produced **zero** continuous paints after the initial static frame.
- Heap use was identical (9.5 MB) across profiles and no console errors occurred in any run.
- The 1440×900 desktop result is **raster-bound in this GPU-less environment** (software SwiftShader,
  1.3 MP canvas), not governor-bound; it is reported as an environment limitation rather than a product
  result. The governor never adds frames beyond the device's budget.

## Limitations

- Headless Chromium uses SwiftShader, so absolute desktop frame rates are not representative of a GPU.
  The same-viewport A/B comparison is the valid signal.
- Prefetch and audio policies are verified by unit/component tests; no browser network-panel measurement
  of hover prefetch was recorded.
- Image delivery remains the approved native `srcset`/`sizes` ladders; the plan's `imageQuality` hint is
  not yet consumed by derivative selection.
- Firefox, WebKit and Samsung Internet were not exercised in this environment.
- `performance.memory` pressure is Chromium-only; other browsers rely on coarse device hints.
