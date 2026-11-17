# Evidence: Shared Adaptive Performance and Rendering System

**Date**: 2026-11-17 (re-verified after runner restart)
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

## Test results (re-run in this verification pass)

| Check | Command | Result |
| --- | --- | --- |
| Full suite | `pnpm exec vitest run` | 90 files; **910 passed, 1 failed of 911**. The failure is the pre-existing governance assertion proven below. |
| Focused adaptive suites | `pnpm exec vitest run __tests__/adaptive-performance.test.js __tests__/intent-prefetch-link.test.jsx __tests__/audio-adaptive-release.test.js` | PASS — 3 files, 52 tests (run earlier in this task; the full suite above re-includes them) |
| Audio regression suites | `pnpm exec vitest run __tests__/audio-adaptive-release.test.js __tests__/lucky-reveal-phase3.test.js __tests__/lucky-reveal-confetti-phase1.test.js __tests__/lucky-reveal-finish-phase2.test.js __tests__/reveal-applause-retry.test.js __tests__/audio-exports.test.js` | PASS — 6 files, 65 tests |
| Type check | `pnpm exec tsc --noEmit` | PASS — exit 0 |
| Spec Kit task-artifact gate | `SPEC_KIT_BASE_REF=ec4b5258 bash scripts/verify-speckit-task.sh` | PASS — spec/plan/tasks verified for this feature directory |
| Spec Kit verifier suite | `bash scripts/test-verify-speckit-task.sh` | PASS — all tests passed |

### Proof that the one failing test is pre-existing

The PR targets `main` at `ec4b5258`. A detached worktree at that exact commit, with this branch untouched,
runs the same test:

```
git worktree add --detach .base-check ec4b5258
cd .base-check && pnpm exec vitest run __tests__/agent-governance-single-source.test.js
```

Captured output (`artifacts/adaptive-performance-20261117/base-commit-governance.log`, in this PR):

```
FAIL __tests__/agent-governance-single-source.test.js > single-source agent governance
     > documents Freebuff Playwright modes and excludes ChatGPT from the CLI system
AssertionError: expected 'AGENTS.md — REPOSITORY GOVERNANCE\n\n…'
                to contain 'ChatGPT must not load, modify or main…'
Test Files  1 failed (1)
Tests       1 failed | 9 passed (10)
BASE_TEST_EXIT=1
```

The failure is identical on the base commit and on this branch. It asserts a sentence that no longer
exists in the base `AGENTS.md`; this task does not modify `AGENTS.md`. The assertion was neither deleted
nor weakened. The worktree was removed after capture, so the branch and worktree are unchanged.

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

## Production build (fresh rebuild in this pass)

| Check | Result |
| --- | --- |
| `rm -rf .next && pnpm run build` | PASS — compiled successfully, 21/21 static pages, exit 0 (`artifacts/adaptive-performance-20261117/build.log`) |
| Production build size (`.next` + `public`) | **344,157,126 bytes = 328.21 MiB**, below the 495 MiB cap |
| Earlier build of the same commit | 344,342,416 bytes = 328.39 MiB (the figure in the PR description). Both builds are valid; the fresh rebuild supersedes it. |
| `./freebuff-verify.sh` | Spec Kit gate PASS, type check PASS, build PASS, refresh-docs 47/48 |
| Refresh-docs failure | Pre-existing: `every snapshot is valid Markdown or safely identified as legacy HTML` inspects the read-only `.docs/` library, which this task did not modify. |

## Browser measurement (production build, Chromium 1248, headless SwiftShader)

Method: `artifacts/adaptive-performance-20261117/benchmark.mjs` loads the built homepage with device and
network hints injected before application scripts, blocks off-origin requests, counts 2D canvas
`clearRect` calls (one per ambient paint) over a 2.5 s window after a 0.9 s settle, and records long tasks,
heap and load timing. Per-profile CPU throttling uses CDP `Emulation.setCPUThrottlingRate`. Each profile
was measured **three times** and the median is reported; a stale server from an interrupted earlier run was
identified and stopped before these runs, and the earlier invalid run was discarded.

| Profile | Viewport | CPU | Median paints/s | Runs | Long tasks | Heap | Median load |
| --- | --- | --- | --- | --- | --- | --- | --- |
| low mobile (1 GB, 2 cores, Save-Data, 0.4 Mbps) | 360×740@2x | 4× | 30.0 | 30 / 30 / 30 | 0 | 9.5 MB | 150 ms |
| medium mobile (4 GB, 4 cores, 2 Mbps) | 390×844@3x | 2× | 59.6 | 60 / 59.6 / 56.8 | 0 | 9.5 MB | 363 ms |
| **same-viewport capable** (8 GB, 16 cores, 30 Mbps) | 390×844@2x | 1× | **59.2** | 59.2 / 60 / 56 | 0 | 9.5 MB | 203 ms |
| **same-viewport constrained** (1 GB, 2 cores, Save-Data) | 390×844@2x | 1× | **30.0** | 30 / 30 / 28.8 | 0 | 9.5 MB | 225 ms |
| high desktop (8 GB, 16 cores, 30 Mbps) | 1440×900@1x | 1× | 24.4 | 25.2 / 24.4 / 20.8 | 0 | 9.5 MB | 186 ms |
| high desktop, reduced motion | 1440×900@1x | 1× | 0 | 0 / 0 / 0 | 0 | 9.5 MB | 225 ms |

Raw per-run data: `benchmark-run-{1,2,3}.json`; thresholded summary: `benchmark-results.json`.

Measured improvement:

- At an identical viewport and CPU rate, the constrained profile painted **49.3% fewer animation frames**
  than the capable profile (30.0 vs 59.2 per second), matching the 30 fps governor target, with every
  renderer still mounted.
- The capable profile sustained ~60 fps; the low-mobile profile held its 30 fps target even at 4× CPU
  throttling.
- Reduced motion produced **zero** continuous paints after the initial static frame.
- Zero long tasks and zero console errors in every run; heap was 9.5 MB in every profile.
- The 1440×900 desktop result is **raster-bound in this GPU-less environment** (software SwiftShader,
  1.3 MP canvas), not governor-bound; it is reported as an environment limitation, not a product result.

## Limitations

- Headless Chromium uses SwiftShader, so absolute desktop frame rates are not representative of GPU
  hardware. The same-viewport A/B is the valid signal, and capable fps varied between 56 and 60 across runs.
- Prefetch and audio policies are verified by unit/component tests; no browser network-panel measurement
  of hover prefetch was recorded.
- Image delivery remains the approved native `srcset`/`sizes` ladders; the plan's `imageQuality` hint is
  not yet consumed by derivative selection.
- Firefox, WebKit and Samsung Internet were not exercised in this environment.
- `performance.memory` pressure is Chromium-only; other browsers rely on coarse device hints.
- The pre-existing governance assertion and refresh-docs snapshot test remain failing on the base and are
  left untouched.
