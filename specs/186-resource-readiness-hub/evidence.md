# Evidence: Site-Wide Resource-Readiness Hub

**Date**: 2026-11-18
**Branch**: `freebuff/df6965c97260bd2bd71121ef`
**Base**: `main` at `fad3adff`
**Task groups**: creation, polishing (performance/rendering), testing
**Library sources consulted**:
- `.docs/creation/_vercel-labs_agent-skills_react-best-practices.md` — useful: hook/effect cleanup boundaries and
  avoiding work in render informed the mount and the activity effects.
- `.docs/testing/_google_eng-practices.md` — useful: focused, behaviour-level tests and small changes with
  evidence.
- `.docs/testing/_microsoft_playwright.md` — useful: production-server, profile-based browser measurement.
- `.docs/polishing/_developer_chrome.md` — useful: `requestIdleCallback`, resource timing and `decode()`.

## Audit findings that scoped the work

| Area | Observed state | Consequence |
| --- | --- | --- |
| Adaptive plan | `app/lib/adaptive-performance.js` resolves one plan; one shared subscription; no second detector needed | Hub reads `maxParallelRequests`, `prefetch`, `audioPreload`, `registerReleasableResource` |
| Prefetch | `components/IntentPrefetchLink.jsx` owns route-intent policy for its links | Hub does not add a route prefetcher; the mount injects `router.prefetch` as a code adapter |
| Audio | `app/lib/audio.js` preloads defer under constraint and playback paths force-load | Hub's audio adapter calls only existing prepare functions; never plays |
| Existing preloads | Reveal fetches eight standard cues and creates its Howl set on mount; Crystal Ball preloads on intent; map/meter use normal `srcset` markup | Hub registers only small first-display derivatives and never warms APIs |
| Service worker | None exists (`serviceWorker` search across `app`, `components`, `public`, `workers`, `functions`, config) | No service worker added |
| Caching | Images/audio: `public, max-age=31536000, immutable`; pages: `public, s-maxage=3600, stale-while-revalidate=86400` | Hub warms exact markup URLs; no query-string versioning that would miss the existing cache entry |

## Implementation

- `app/lib/resource-readiness.js` — registration contract, idempotent version-aware registration, image/code/
  audio adapters, custom adapter registry, plan-bounded queue, active-experience pause/resume, deduplication,
  readiness snapshots, automatic single retry, explicit retry and release integration.
- `app/lib/resource-readiness-manifest.js` — six registrations covering the seven requested experiences; reveal
  is registered once for `/reveal` and `/reveal/[revealId]`; gift delivery/sharing is not registered as another
  animation set; map sky and Crystal Ball audio are `background: false`.
- `components/ResourceReadiness.jsx` and `app/layout.js` — one invisible mount: router prefetcher, idle
  current-route preparation, homepage load + two frames + idle ordering, and one delegated hover/focus/press
  listener set using the existing prefetch policy.
- `components/DailyResonance.tsx`, `app/lucky-card-reveal.js` — hold `beginActiveExperience` while their
  animation runs; no timing, sound, markup or artwork change.
- `docs/graphics-rendering-architecture.md`, Memory Bank and `specs/186-resource-readiness-hub/*`.

## Measurements

All browser numbers come from the built production server (`next start`) on this host, Chromium via the
repository Playwright CLI, one 1440×900 desktop run per profile. "Before" is a clean production build of
`fad3adff` in a detached worktree on the same host; "after" is this branch. Single runs, local origin.

| Metric (homepage, desktop) | Before (`fad3adff`) | After | Note |
| --- | --- | --- | --- |
| Requests after load + 5 s | 25 | 37 | +12: 3 registered images, plus route flight/JS for 2 likely-next experiences |
| Spare-image requests in the first 5 s | 0 | 3 | card back, reveal backdrop, Lucky Meter sky; each exactly once |
| `loadEventEnd` | 68 ms | 104 ms | +36 ms local; hub work starts after load (first registered request at ~295 ms) |
| LCP | 228 ms | 296 ms | +68 ms local, within run-to-run noise on this host; not a claimed improvement |
| DOM nodes | 376 | 378 | +2; the mount renders `null` |
| Console errors / failed requests | 0 / 0 | 0 / 0 (homepage) | — |

Network conditions reported by Chromium on this host: `downlink 1.55`, `rtt 100`, `effectiveType 4g`,
`deviceMemory 16`, `hardwareConcurrency 8`. The existing plan classifies that as **moderate**, so the homepage
prepared **two** experiences, not three. That is the plan working, not a shortfall.

| Scenario | Result |
| --- | --- |
| Capable/moderate homepage | 2 likely-next experiences prepared; each registered image requested exactly once; no console errors |
| Save-Data + 1 GB + 2 cores + 390×844 | 0 registered images, 0 route preparations, 0 console errors, no horizontal overflow (`scrollWidth 390 = innerWidth 390`) |
| `/reveal` | card back 1 request, backdrop 1 request (hub + page markup share the same cache entry), 8 existing standard-cue fetches, 0 console errors |

Duplicate-request evidence from the focused suite (real hub, no browser): three experiences sharing one URL
produce **1** adapter call; a repeated preparation produces **0** additional calls; concurrency peaks at **3**;
background audio does not run during idle; auto-retry runs at most **2** attempts.

No speedup is claimed: the hub adds bounded, post-load preparation. Its measurable value is one request per
shared asset, truthful readiness, and zero speculative work on constrained/Save-Data profiles.

## Checks

| Check | Command | Result |
| --- | --- | --- |
| Focused hub suites | `pnpm exec vitest run __tests__/resource-readiness.test.js __tests__/resource-readiness-manifest.test.js` | PASS — 29 tests |
| Full unit suite | `pnpm exec vitest run` | PASS — 94 files, 976 tests |
| Type check | `pnpm exec tsc --noEmit` | PASS — exit 0 |
| Repository gate | `bash ./freebuff-verify.sh` | PASS — exit 0 (Spec Kit gate, governance suites, type check, production build, docs tests) |
| Production build, clean | `rm -rf .next && pnpm run build` | 347,721,519 bytes = 331.61 MiB, below 495 MiB |
| Production build, verify run | `./freebuff-verify.sh` build output | 365,661,187 bytes = 348.72 MiB, below 495 MiB |
| Browser evidence | `./scripts/playwright-cli.sh` probes, artifacts in `artifacts/resource-readiness-20261118/` | PASS — see table above |

## Limitations

- Browser numbers are single local runs with software rendering (no hardware GPU) and Chromium's own connection
  hints; they show ordering and request counts, not production field performance. `transferSize` was 1013 in
  both builds, so byte deltas are not a usable comparison on this local origin.
- The after-run was slower to load/LCP by 36/68 ms in this sample. That is reported, not smoothed over; the hub's
  first registered request starts after `loadEventEnd`.
- No visual baseline file changed and the committed Playwright specs were not run; the visual check was an
  interactive homepage inspection plus the DOM/console/request measurements above.
- Audio was not listened to. The reveal's existing audio preloads and the Crystal Ball loader are unchanged; the
  hub only calls their prepare functions.
- The browser may evict prepared bytes at any time; the hub promises no retention and adds no service worker.
- The owner brief named CAD $1.99 and $2.99 paid reveals; the repository prices CAD $1.00 and CAD $1.99 and were
  deliberately preserved.
