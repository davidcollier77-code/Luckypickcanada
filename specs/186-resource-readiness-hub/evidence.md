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
| Existing preloads | Reveal fetches its standard cues and creates its Howl set on mount; Crystal Ball preloads on intent; map/meter use normal `srcset` markup | Hub registers only small first-display derivatives and never warms APIs |
| Service worker | None exists (`serviceWorker` search across `app`, `components`, `public`, `workers`, `functions`, config) | No service worker added |
| Caching | Images/audio: `public, max-age=31536000, immutable`; pages: `public, s-maxage=3600, stale-while-revalidate=86400` | Hub warms exact markup URLs; no query-string versioning that would miss the existing cache entry |

## Implementation

- `app/lib/resource-readiness.js` — registration contract, idempotent version-aware registration, image/code/
  audio adapters, custom adapter registry, plan-bounded queue, active-experience pause/resume, deduplication,
  readiness snapshots, automatic single retry, explicit retry, release integration and the page-settle gate.
- `app/lib/resource-readiness-manifest.js` — six registrations covering the seven requested experiences; reveal
  is registered once for `/reveal` and `/reveal/[revealId]`; gift delivery/sharing is not registered as another
  animation set; map sky and Crystal Ball audio are `background: false`.
- `components/ResourceReadiness.jsx` and `app/layout.js` — one invisible mount: router prefetcher, settled
  current-route preparation, settled homepage ordering, and one delegated hover/focus/press listener set using
  the existing prefetch policy.
- `components/DailyResonance.tsx`, `app/lucky-card-reveal.js` — hold `beginActiveExperience` while their
  animation runs; no timing, sound, markup or artwork change.
- `docs/graphics-rendering-architecture.md`, Memory Bank and `specs/186-resource-readiness-hub/*`.

## Scheduling repair after the first single-run evidence

The first pass reported one desktop sample (`loadEventEnd` 68 → 104 ms, LCP 228 → 296 ms) and was treated as a
possible homepage regression. Re-measurement found that sample had a stale base server on port 3100 whose
build directory had been replaced, so its HTML referenced missing chunks and two requests failed. A clean
15-pair sample showed no median regression, but prior capable-profile evidence also showed the old schedule
starting hub requests at 295 ms while LCP landed at 344 ms: `load` plus `requestIdleCallback` can still fall
inside the LCP window on a slow or mobile run.

`whenPageSettled` now gates both current-route and homepage preparation. It requires:

1. `document.readyState === 'complete'`;
2. at least 600 ms since the last `largest-contentful-paint` entry;
3. at least 600 ms since the last completed resource entry;
4. a 250 ms floor after the gate is created, with a 20 s bound for pages that never report LCP.

Intent preparation (hover, focus, press) is unchanged and still requires the existing `shouldPrefetchOnIntent`
policy. No adaptive-plan limit was weakened, no registered experience was removed, and no service worker was
introduced.

## Measurements

All browser numbers come from the built production server (`next start`) on this host, Chromium via the
repository Playwright CLI. Base is a clean production build of `fad3adff` in a detached worktree on the same
host and port 3100; branch is this build on port 3000. Each sample used a fresh browser context (cold cache),
1440×900, dark, `en-CA`, five seconds after `load`, and base/branch order alternated across runs. One warm-up
iteration per side was discarded. Artifact: `artifacts/resource-readiness-20261118/homepage-multisample.json`.

### Homepage, 15 paired runs

| Metric | Base median (n=15) | Branch median (n=15) | Median difference | Bootstrap 95% CI of difference | Paired median |
| --- | --- | --- | --- | --- | --- |
| `loadEventEnd` | 302 ms | 302 ms | 0 ms | −43 … +28 ms | 0 ms |
| LCP | 348 ms | 340 ms | −8 ms | −24 … +20 ms | −12 ms |
| Requests after load + 5 s | 26 | 43 | +17 | — | — |
| Registered image requests | 0 | 4 | +4 | — | — |

The load interval includes zero and the probability that the branch median is slower is 0.50 (a coin flip);
the LCP probability is 0.27. Mean paired differences were −6.1 ms (load) and −8.3 ms (LCP). The result is
**no homepage regression beyond measured run-to-run variance**.

Every branch run started its first hub request between **1.22 s and 1.35 s** (median **1.28 s**). Across all 15
runs, **0** hub requests started before `load` and **0** before the final LCP entry, even though branch LCP
ranged from 264 to 388 ms. The +17 requests and +279 KB transfer occur after the LCP window and are the
intended bounded preparation, not critical-path work.

Network conditions reported by Chromium on this host: `downlink 1.55`, `rtt 100`, `effectiveType 4g`,
`deviceMemory 16`, `hardwareConcurrency 8`. The existing plan classifies that as **moderate**, so the homepage
prepared **two** experiences, not three. That is the plan working, not a shortfall.

### Mobile and constrained profiles (390×844, 2× CPU throttle)

| Scenario | `loadEventEnd` | LCP | Hub first request | Hub before load/LCP | Result |
| --- | --- | --- | --- | --- | --- |
| Capable mobile (`downlink 30`, `rtt 30`, 8 GB / 8 cores) | 407 ms | 416 ms | 1.38 s | 0 / 0 | 4 registered images, each exactly once; 43 requests; 0 console errors; no overflow |
| Save-Data, 1 GB / 2 cores (`downlink 0.8`, `rtt 400`) | 476 ms | 480 ms | none | 0 / 0 | 0 registered images, 0 route preparation, 26 requests, 0 console errors, no overflow |

`/reveal` was identical to base: card back **1** request, backdrop **1** request, **15** distinct audio cue
files, same heading and buttons, 0 console errors. Artifacts: `capable-homepage-reveal.json`,
`constrained-mobile.json`.

Duplicate-request evidence from the focused suite (real hub, no browser): three experiences sharing one URL
produce **1** adapter call; a repeated preparation produces **0** additional calls; concurrency peaks at **3**;
background audio does not run during idle; auto-retry runs at most **2** attempts; a current-route code
prefetch is skipped.

No speedup is claimed. The hub adds bounded, post-settle preparation. Its measurable value is one request per
shared asset, truthful readiness, and zero speculative work on constrained/Save-Data profiles.

## Review follow-up (Graphite, Amazon Q, Pullfrog)

Graphite's AI review did not run: its check on `704fe90` reports "AI code review did not run because
this PR is too large", so it produced no findings to verify. Amazon Q's five advisory findings and
Pullfrog's six findings were each checked against the code at `704fe90`; false positives were not
re-raised as defects.

| Finding | Independent verification | Resolution |
| --- | --- | --- |
| Amazon Q: `job.controller.signal.aborted` can throw | Real only where `AbortController` is absent, because the fallback stores `{ signal: undefined }`; below the app's browser floor but inconsistent with the fallback. | Guarded with `signal?.aborted`. |
| Amazon Q: `skipped` makes an experience permanently partial | Half true: a policy skip should not be a terminal cache entry, but merely dropping it from `partial` would cache the skip forever. | Policy skips are no longer terminal; the next preparation re-evaluates them. Readiness still reports `partial` because a skipped resource was not prepared. |
| Amazon Q: `getAdaptivePlan()` null dereference | Disproven: the getter returns `SERVER_PLAN` on the server and `refreshAdaptivePlan()` in the browser; it never returns null. | No change. |
| Amazon Q: stale router closure | Disproven: the prefetch callback reads `routerRef.current`, which the same effect refreshes on `[router]`. | No change. |
| Amazon Q: Lucky Number Generator dependency ambiguity | Not a defect: the dependency is awaited and the shared `/lucky-meter` code resource is deduplicated. | Manifest comment clarifies that the generator reuses the meter page's bundle. |
| Pullfrog HIGH: stranded staggered retry | Confirmed: a second failure re-queued behind an already-armed timer could be skipped when that timer fired before its `notBefore`, with no timer left. | `scheduleRetry` is deadline-driven: it keeps an earlier timer, replaces a later one, and `pump` re-arms for the earliest pending deadline. Regression test uses two failures 100 ms apart on an idle page. |
| Pullfrog MEDIUM: policy `SKIPPED` cached forever | Confirmed: `current-route` and `speculative-audio-deferred` skips were terminal under a static key. | `SKIPPED` is not a terminal cache entry; a navigated-away current-route skip is tested to prefetch on the next intent. |
| Pullfrog MEDIUM: priority-blind in-flight branch | Confirmed: a critical caller received the background run's partial snapshot. | A higher-priority caller chains one follow-up run after the in-flight background run settles; test covers deferred heavy assets. |
| Pullfrog MEDIUM: mount untested | Confirmed: no suite covered `components/ResourceReadiness.jsx`. | Added `__tests__/resource-readiness-mount.test.jsx`: settle suppression/resume, plan gating, listener cleanup, delegated intent and router prefetch injection (5 tests). |
| Pullfrog LOW: wrong `bytes` | Confirmed: `NGC4216_crawford-1280w.avif` is 47,665 bytes, not 38,666 (the map story image's size). | Corrected, and a manifest test now asserts every declared image `bytes` against `statSync`. |
| Pullfrog LOW: FAILED re-attempt storm | Confirmed: every pointerover/focusin/pointerdown re-entered a failed experience. | Failed resources and snapshots carry a 5 s cooldown; `retryExperience` bypasses it. Test covers repeated intent and post-cooldown retry. |

## Checks

| Check | Command | Result |
| --- | --- | --- |
| Focused hub suites | `pnpm exec vitest run __tests__/resource-readiness.test.js __tests__/resource-readiness-manifest.test.js __tests__/resource-readiness-mount.test.jsx` | PASS — 41 tests across 3 files |
| Full unit suite | `pnpm exec vitest run` | PASS — 95 files, 988 tests |
| Type check | `pnpm exec tsc --noEmit` | PASS — exit 0 |
| Repository gate | `SPEC_KIT_BASE_REF=fad3adfff0bfa115c99eb19120973591ab30036d bash ./freebuff-verify.sh` | PASS — exit 0 (Spec Kit gate, governance suites, type check, production build, docs tests) |
| Production build | `rm -rf .next && pnpm run build` | PASS — 312,552,759 bytes = 298.07 MiB, below 495 MiB |
| Homepage comparison | Playwright production-server probe | PASS — 15 paired runs, see table |
| Capable/mobile and Save-Data profiles | Playwright production-server probe | PASS — see table |
| `/reveal` duplicate check | Playwright production-server probe | PASS — same counts as base |

## Limitations

- Browser numbers are local software-rendered runs (no hardware GPU) with Chromium's connection hints, not
  production field data. Fifteen paired runs make the median comparison meaningful on this host, but the
  confidence intervals are host-specific.
- `transferSize` totals are stable per build but are local-origin values, not a field byte comparison.
- No visual baseline file changed and the committed Playwright visual specs were not run; the visual check was
  an interactive homepage capture plus the DOM/console/request measurements.
- Audio was not listened to. The reveal's existing audio preloads and the Crystal Ball loader are unchanged; the
  hub only calls their prepare functions.
- The browser may evict prepared bytes at any time; the hub promises no retention and adds no service worker.
- The owner brief named CAD $1.99 and $2.99 paid reveals; the repository prices CAD $1.00 and CAD $1.99 and were
  deliberately preserved.
