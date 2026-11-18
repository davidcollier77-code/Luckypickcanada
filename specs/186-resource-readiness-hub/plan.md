# Implementation Plan: Site-Wide Resource-Readiness Hub

**Feature**: `specs/186-resource-readiness-hub`

**Branch**: `freebuff/df6965c97260bd2bd71121ef`

**Base**: `main` at `fad3adff`

## Summary

Add one dependency-free hub at `app/lib/resource-readiness.js` that owns a registration contract, bounded
preparation scheduling, real readiness states, deduplication, retry and release. Experience registrations live
in `app/lib/resource-readiness-manifest.js`. One invisible client mount,
`components/ResourceReadiness.jsx`, connects the hub to the Next.js router, the current route, homepage idle
capacity and link intent. The two foreground animations (Lucky Card Reveal and Daily Resonance) hold the hub's
active-experience marker while they run.

The hub composes with Feature 180: `getAdaptivePlan`, `subscribeToAdaptivePlan`, `allowSpeculativeAudio` and
`registerReleasableResource` are reused. It adds no capability probe, frame loop, listener-heavy subscription,
route prefetcher or audio player.

## Technical Context

- **Runtime**: Next.js App Router 16.4.5, React 19.3.1, browser and Workers-compatible server import.
- **Language**: dependency-free ES modules plus one client component and one React hook reuse.
- **Testing**: Vitest + jsdom; new hub and manifest suites; existing homepage, reveal, Daily Resonance and
  adaptive suites as regression checks.
- **Performance**: no new dependency, no new asset, no new server work. Speculative work is bounded, idle-only
  for background, and policy-gated by the existing plan.
- **Constraints**: Cloudflare Pages configuration untouched; no service worker, storage layer, paid service or
  infrastructure; production build below 495 MiB; protected files untouched.

## Constitution Check

- **Preserve visuals and functionality**: the mount renders nothing; no markup, copy, artwork, timing, price or
  sound changes. Only preparation ordering is affected.
- **Smallest correct change**: two new library modules, one mount, one layout insertion, two activity effects,
  two focused test files plus documentation and Spec Kit artifacts.
- **Reuse the single adaptive source**: plan reads and the plan subscription are the existing ones. The hub owns
  no browser capability measurement.
- **Protected areas**: no payment, database, authentication, security, hosting, deployment, environment or
  secret file is touched.
- **Evidence first**: caching and service-worker status were inspected before design; the hub relies on them
  instead of adding a new cache layer.

## Phase 0: Research (repository evidence, no external research needed)

1. **No service worker exists.** `grep -ril serviceWorker` across `app`, `components`, `public`, `workers`,
   `functions` and `next.config.mjs` returns nothing, so no offline/precache layer is added.
2. **HTTP caching already fits preparation.** `next.config.mjs` sends `public, max-age=31536000, immutable`
   for image and audio paths and `public, s-maxage=3600, stale-while-revalidate=86400` for pages. The hub warms
   the same immutable asset URLs the markup uses; it adds no cache-busting query string, because that would
   create a second cache entry the page never reads.
3. **Versioned identity lives in the registration.** `version` participates in the prepared-state key so a
   changed asset is re-prepared, while the URL stays byte-identical for HTTP-cache reuse.
4. **Feature 180 is the only adaptive governor.** Its plan already exposes `maxParallelRequests`, `prefetch`,
   `audioPreload`, visibility and release. The hub reads those values and never re-derives them.
5. **Existing experiences preload ad hoc.** The reveal creates its Howl set and fetches its audio on mount; the
   Crystal Ball preloads its audio on intent; the map loads its own images in markup. The hub therefore
   registers small, already-used derivatives and never preloads an entire library or an API.
6. **Renderer-agnostic contract.** Resource descriptors are `{ kind, url|route, prepare? }`; adapters are
   registered by kind. A future Canvas/WebGL/WebGPU renderer can register a `texture`/`buffer` adapter without a
   hub change. No renderer migration and no WebGPU requirement.

## Phase 1: Design

### Files

```
app/lib/resource-readiness.js            # hub: contract, adapters, scheduler, readiness, retry, release
app/lib/resource-readiness-manifest.js   # six experience registrations covering seven experiences
components/ResourceReadiness.jsx         # invisible site mount: route, homepage idle, delegated intent
app/layout.js                            # mounts the invisible component once
components/DailyResonance.tsx            # holds active-experience marker while the cinematic runs
app/lucky-card-reveal.js                 # holds active-experience marker while the reveal runs
__tests__/resource-readiness.test.js     # hub contract and scheduling coverage
__tests__/resource-readiness-manifest.test.js # coverage, routes, dedupe, budgets, asset existence
docs/graphics-rendering-architecture.md  # architecture record for the hub and future adapters
memory-bank/{activeContext,progress,techContext}.md
specs/186-resource-readiness-hub/*
```

### Registration contract

| Field | Purpose |
|-------|---------|
| `id` | Stable experience identity; `/reveal` and `/reveal/:id` share `reveal`. |
| `version` | Invalidates prepared state when a registered asset changes. |
| `routes` | Exact route or segment prefix used for current-route and intent preparation. |
| `dependsOn` | Experiences prepared before this one; missing or cyclic dependencies fail safely. |
| `resources[]` | `id`, `kind`, `url` or `route`, optional `background`, optional `bytes`, optional `prepare`. |

### Readiness states

`idle → queued → preparing → fetched → initialized → ready`, with `failed` (error + attempts) and `skipped`
(policy or environment). The image adapter marks `fetched` on load and `initialized` after decode; the code
adapter marks `fetched` when the router prefetch settles; the audio adapter marks `fetched` before the existing
Howler/Web Audio prepare resolves and never calls play.

### Scheduling

- Queue ordered critical → intent → background, then registration order.
- Concurrency `min(plan.maxParallelRequests, 3)`.
- Background jobs wait while an active experience holds the foreground, the document is hidden, or the plan is
  `prefetch: none`; the existing shared plan subscription wakes the queue.
- Background resources marked `background: false` (map sky, Crystal Ball audio) are deferred to route/intent
  preparation and the snapshot reports `partial`.
- Background runs only from `whenIdle` (requestIdleCallback with a 2 s timeout). Current-route and homepage
  scheduling first pass `whenPageSettled`: `load`, 600 ms of quiet after the last LCP/resource entry, a 250 ms
  floor and a 20 s bound. This keeps preparation out of the load/LCP window on slow connections.
- One automatic retry per resource after 250 ms; `retryExperience` resets only failed entries.

### Release

`releaseExperienceResources`/`releaseAllPreparedResources` drop settled entries only; queued/preparing work is
left alone. The hub registers one release callback with Feature 180's registry on first preparation, so memory
pressure clears decoded references without a second detector. HTTP cache entries are untouched and audio
unloading stays owned by `app/lib/audio.js`.

## Re-evaluated Constitution Check

No dependency, protected configuration, data path or visual asset changes. The homepage keeps critical-first
ordering, every reduction is plan-driven and reversible, and readiness never claims more than the adapter
actually completed. No violation.
