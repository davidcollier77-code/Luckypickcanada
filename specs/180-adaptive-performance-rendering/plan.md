# Implementation Plan: Shared Adaptive Performance and Rendering System

**Feature**: `specs/180-adaptive-performance-rendering`

**Branch**: `freebuff/1716deb7870376472b3b3bb7`

**Base**: `main` at `ec4b5258`

## Summary

Add one dependency-free shared layer at `app/lib/adaptive-performance.js` that evaluates network, device,
accessibility and memory signals and resolves a single adaptation plan. Existing renderers consume it through
a frame governor and a shared subscription instead of adding listeners of their own; existing loaders consult
its prefetch and audio policies. The layer composes with `app/lib/graphics-capabilities.js` rather than
duplicating its probes or replacing its render-quality tiers.

## Technical Context

- **Runtime**: Next.js App Router 16.4.3, React 19.3.1, browser and Workers (server-safe module).
- **Language**: dependency-free ES module plus one client hook.
- **Testing**: Vitest + jsdom, following the existing `__tests__/graphics-capabilities.test.js` patterns
  (module reset, stubbed navigator hints, source guards).
- **Performance**: no new dependency, no new network request, no new image or audio asset.
- **Constraints**: Cloudflare Pages configuration untouched; no paid service; production build below 495 MiB.

## Constitution Check

- Preserve visuals and functionality: the plan only reduces frame cadence and speculative loading under a
  measured constraint, and reduced-motion behaviour is unchanged. No artwork, copy, interaction, payment,
  database or authentication path changes.
- Smallest correct change: one new module, one new hook, six consumer edits (four ambient canvases, the
  homepage canvas, the intent-prefetch link) and one audio-policy edit.
- Protected areas: no governance, payment, database, authentication, security, hosting, deployment or secret
  file is touched.
- Tests and evidence: pure resolution tests across profiles, runtime subscription/cleanup tests, frame-loop
  tests, audio cleanup tests and preservation guards.

## Phase 0: Research

No external research was required. The decisions come from the existing repository architecture and
documented browser behaviour already recorded in `docs/graphics-rendering-architecture.md`:

1. **Measure, do not label.** `effectiveType` is a coarse hint and the API does not identify 5G reliably.
   Downlink/RTT measurements decide `fast`/`moderate`/`slow`; labels only break ties when no measurement
   exists.
2. **Missing hints mean capable.** `deviceMemory` and `hardwareConcurrency` are privacy-reduced and absent in
   several browsers; treating absence as weakness would degrade privacy-hardened visitors.
3. **One subscription.** Four independent canvases already register resize, visibility and motion listeners.
   Adding per-component adaptive listeners would multiply background work, so the layer owns one shared
   listener set with a debounce and full teardown.
4. **Do not disturb approved markup.** Image `srcset` ladders and preload hints are asserted by existing
   tests and visual baselines; the plan exposes `imageQuality` for future derivative work and leaves native
   responsive selection in place.
5. **Frame governor, not feature removal.** Constrained devices keep every effect and lose only frame
   cadence, which is the dominant CPU cost of the ambient canvases.

## Phase 1: Design

### Files

```
app/lib/adaptive-performance.js        # new shared layer (pure resolution + runtime)
app/lib/use-adaptive-plan.js           # new client hook over the shared subscription
components/Starfield.tsx               # frame governor
components/TwinklingStars.tsx          # frame governor
components/ShootingStars.tsx           # frame governor
components/Aurora.tsx                  # frame governor
app/homepage/HomePage.js               # frame governor
components/IntentPrefetchLink.jsx      # plan-aware prefetch strength
app/lib/audio.js                       # plan-aware speculative loading + idle release
__tests__/adaptive-performance.test.js # new focused suite
__tests__/intent-prefetch-link.test.jsx# extended policy coverage
__tests__/audio-adaptive-release.test.js# new cleanup coverage
docs/graphics-rendering-architecture.md# architecture record
memory-bank/{activeContext,progress,techContext}.md
specs/180-adaptive-performance-rendering/*
```

### Plan shape

| Field | High (capable) | Balanced | Constrained |
|-------|----------------|----------|-------------|
| `tier` | `high` | `balanced` | `constrained` |
| `frameRate` | 60 | 60 | 30 (0 with reduced motion) |
| `animationBudget` | `full` | `full` | `reduced` (`minimal`) |
| `prefetch` | `intent` | `intent` / `strong-intent` on moderate | `none` on slow/Save-Data |
| `audioPreload` | `eager` | `eager` | `intent` |
| `imageQuality` | `full` | `balanced` | `economy` |
| `maxParallelRequests` | 6 | 4 | 2 |
| `releaseIdleResources` | memory pressure only | memory pressure or hidden+constrained | memory pressure or hidden |

### Runtime contracts

- `getAdaptivePlan()` caches; `refreshAdaptivePlan()` recomputes and notifies only on a signature change.
- `subscribeToAdaptivePlan(listener)` attaches one shared listener set for all consumers and tears it down on
  the last unsubscribe. Debounce 120 ms; heap poll 20 s only when `performance.memory` exists, `unref`'d.
- `createAdaptiveFrameLoop()` reads the cached plan per frame: 60 fps paints every rAF, 30 fps skips alternate
  frames, hidden/reduced-motion stops scheduling; the consumer's existing visibility handling resumes it.
- `registerReleasableResource()` + release-on-pressure runs each callback once per pressure episode, isolated
  from failures.

### Phases

1. Shared layer and hook.
2. Ambient renderer governors (preserve density, artwork and reduced-motion branches).
3. Prefetch and audio policies with forced load on activation.
4. Tests, documentation, evidence, verification and build-size measurement.

## Re-evaluated Constitution Check

The design adds no dependency, touches no protected configuration, and defaults to the current experience
whenever a signal is missing. Every reduction is reversible through the same subscription. No violation.
