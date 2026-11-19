# Implementation Plan: Align Link Prefetch with the Adaptive Network Policy

**Feature**: `specs/190-link-prefetch-policy`

**Branch**: `perf/link-prefetch-policy`

**Base**: `main` at `782ac553`

## Summary

`components/IntentPrefetchLink.jsx` already maps hover, focus, press and touch to
`shouldPrefetchOnIntent(plan, intent)` and passes `prefetch={false}` when the policy refuses. Only the hero
used it; every other navigation link was a plain `next/link`, whose default prefetching ignores the plan.
The fix routes every same-origin navigation link through the wrapper and makes the hub's `code` adapter obey
the same policy, so no speculative route work can bypass it.

## Technical Context

- **Runtime**: Next.js 16.4.5 App Router (RSC prefetch), React 19.3.1.
- **Policy source**: `app/lib/adaptive-performance.js` (`PREFETCH_POLICY`, `shouldPrefetchOnIntent`).
- **Link wrapper**: `components/IntentPrefetchLink.jsx` (existing, unchanged behaviour).
- **Hub**: `app/lib/resource-readiness.js` `code` adapter; `configureRoutePrefetch` supplies
  `router.prefetch`.
- **Testing**: Vitest source guards + hub policy tests + two browser runs against a production build.
- **Constraints**: no route, page, layout, copy, artwork, dependency or Next config change; build under
  495 MiB.

## Constitution Check

- **No behaviour loss**: the wrapper renders the same `next/link` anchor with the same props and handlers, and
  it always navigates. Only speculative prefetching is gated.
- **Single policy authority**: the plan's `prefetch` value decides in both places; no new detector.
- **Preserve accessibility**: focus and touch already map to strong intent, so keyboard and mobile navigation
  keep their warm-up on capable connections.
- **Protected areas**: no payment, database, authentication, security, hosting, deployment, environment or
  secret file touched.
- **Evidence first**: the plain-Link inventory was read from the source, and the policy behaviour was measured
  in a production build under Save-Data and on a capable connection.

## Phase 0: Research (repository evidence)

1. `components/IntentPrefetchLink.jsx` sets `prefetch={prefetchEnabled ? undefined : false}` and marks hover
   weak, press/focus/touch strong.
2. `app/lib/adaptive-performance.js` resolves `prefetch` to `none` for Save-Data or a slow network,
   `strong-intent` for a moderate one, otherwise `intent`.
3. Only `app/homepage/Hero.js` imported the wrapper; 24 other navigation links across 11 files used plain
   `next/link` (footer nav, homepage CTAs, legal back links, route components).
4. `app/lib/resource-readiness.js` `prepareCodeResource` called `router.prefetch` with no plan check, so the
   hub could warm a route on a connection where links would not.
5. Chromium in headless mode does not expose `navigator.connection.downlink`, so Save-Data is the reproducible
   constrained profile for browser evidence.

## Phase 1: Design

### Files

```
app/layout.js, app/homepage/HomePage.js, app/homepage/HomeStaticSections.js,
app/about/page.js, app/privacy/page.js, app/terms/page.js, app/lucky-card-reveal.js,
components/AboutSection.tsx, components/LuckyGenerator.tsx, components/DailyResonance.tsx,
app/components/CrystalBall/CrystalBall.tsx          # navigation links use IntentPrefetchLink
components/IntentPrefetchLink.jsx                   # JSDoc props type only
app/lib/resource-readiness.js                       # code adapter obeys the plan
__tests__/link-prefetch-policy.test.js              # source guard + policy behaviour
__tests__/homepage-content-refresh.test.js          # markup guard follows the wrapper
__tests__/homepage-nav-gold-shimmer.test.js         # markup guard follows the wrapper
__tests__/lucky-card-reveal-presentation.test.js    # import guard follows the wrapper
specs/190-link-prefetch-policy/*
artifacts/link-prefetch-20261118/*
```

### Policy matrix

| Plan | Link on hover | Link on press/focus/tap | Hub `code` background | Hub `code` intent |
| --- | --- | --- | --- | --- |
| `intent` (fast) | prefetch | prefetch | prepare | prepare |
| `strong-intent` | no | prefetch | skip | prepare |
| `none` (Save-Data/slow) | no | no | paused by scheduler | skip |

### Notes

- The wrapper's JSDoc props type changed from `Object` to `Record<string, any>` so TypeScript consumers
  (`.tsx`) accept `href`, `className` and data attributes. No runtime change.
- Existing markup guards were updated to assert the same links and wording through the wrapper, not relaxed.
