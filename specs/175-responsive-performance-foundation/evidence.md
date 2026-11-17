# Evidence: Responsive Performance Foundation

All measurements use Lighthouse 12.8.2 — the same engine PageSpeed Insights runs — with the default mobile emulation (412x823, DPR 1.75, 4x CPU slowdown, 1.47 Mbps / 150 ms RTT simulated) and the desktop preset (1350x940). Every run is software-rendered: this environment has no hardware GPU (`/dev/dri` and `/dev/nvidia*` absent), so absolute values are not comparable with a physical-GPU desktop.

## PageSpeed Insights availability

The PageSpeed Insights API (`runPagespeed`, the endpoint behind `pagespeed.web.dev`) returned HTTP 429 for this environment:

```
"Quota exceeded for quota metric 'Queries' and limit 'Queries per day' of service
 'pagespeedonline.googleapis.com' for consumer 'project_number:583797351490'."
```

Lighthouse 12.8.2 was therefore run locally with the PSI profiles. It is the same audit engine and the same throttling model, so the numbers are directly comparable, but they are **not** a `pagespeed.web.dev` result and are not claimed as one.

## Before — live production site (`https://luckypickcanada.ca/`)

| Platform | Score | LCP | TBT | FCP | Speed Index | CLS | Transfer |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Mobile | **58** | 5,831 ms | 754 ms | 1,863 ms | 3,782 ms | 0 | 2,912 KiB |
| Desktop | **95** | 1,374 ms | 28 ms | 547 ms | 1,152 ms | 0 | 3,231 KiB |

Diagnosed causes (from the request waterfall, long tasks and bootup attribution):

1. **1,975 KiB of third-party challenge payload** — `challenges.cloudflare.com` XHRs of 1,561 KiB + 208 KiB plus a 219 KiB document, fetched for a Suggestion Box that sits far below the fold. That is 68% of the page's total transfer and it competed directly with the LCP artwork: the hero image's simulated *load delay* was 2,725 ms (47% of LCP).
2. **Route prefetch work** — the four first-viewport navigation links made Next.js prefetch four routes during load; the resulting tasks were attributed to the router chunk as 317–402 ms blocking tasks and are where the simulated LCP landed.
3. **Fonts** — four families preloaded at high priority; two of them (Inter as a fallback face, Playfair Display on About/Reveal only) are not used above the fold on most routes.

## Before / after — local production build (same environment, same command)

| Run | Score | LCP | TBT | Transfer |
| --- | --- | --- | --- | --- |
| Mobile before (2 runs) | 68 / 67 | 5,500 / 5,567 ms | 469 / 475 ms | 961 KiB |
| Mobile after (5 runs) | 72 / 73 / 75 / 72 / 74 | 5,047 / 5,035 / 5,038 / 4,964 / 5,044 ms | 373 / 338 / 307 / 399 / 333 ms | 777 KiB |
| Desktop before | 97 | 1,272 ms | 32 ms | 1,205 KiB |
| Desktop after (2 runs) | 98 / 98 | 1,153 / 1,197 ms | 32 / 57 ms | 1,091 / 1,020 KiB |

Medians: mobile **67.5 → 73**, transfer **961 → 777 KiB (−19%)**, TBT **472 → 338 ms (−28%)**, LCP **5,534 → 5,035 ms (−9%)**; desktop **97 → 98**, transfer **1,205 → ~1,055 KiB (−12%)**.

Two runs in the "after" set aborted with Lighthouse's `NO_NAVSTART` trace error and produced no metrics; they are excluded rather than reported as results.

The local before/after pair understates the live gain: the live site spends 1,975 KiB on the challenge payload that a local build never fetches (no site key configured locally), so the deferred-loading change removes far more transfer in production than the 184 KiB local delta shows.

## Verified behaviour (Playwright, repository wrapper)

- Homepage at 390 px: **zero** `challenges.cloudflare.com` requests and zero Turnstile preload hints after `load`; after scrolling to the Suggestion Box the widget mounted, the challenge completed and the submit control became enabled (`submitDisabled: false`, `verified: true`) with Cloudflare's public test site key `1x00000000000000000000AA` on a local server only.
- `tests/visual/turnstile-loading.spec.ts`: 2/2 passed on the `desktop` project.
- `app/turnstile-field.test.jsx`: 9/9 passed.
- No console errors at 390 px or 1440 px; no horizontal overflow (`scrollWidth === clientWidth` at both widths); body font still resolves to Manrope first; the homepage canvas and hero artwork render unchanged.

## Remaining bottleneck (not solved in this task)

Mobile LCP after the change is still ~5.0 s, and 77% of it is **render delay** (3,854 ms) rather than network:

```
TTFB 454 ms | Resource load delay 258 ms | Resource load duration 397 ms | Element render delay 3,854 ms
```

The hero AVIF is available at ~1.1 s of simulated time; the paint is held back by main-thread work. Mobile main-thread attribution after the change: `ScriptEvaluation 789 ms`, `Style & Layout 690 ms`, `Rendering 319 ms`, `Other 935 ms` for a 330-node page.

Two reference routes prove this is homepage-specific rather than platform-wide: `/privacy` (59 nodes) scores **92** with LCP 2,645 ms and `/about` (89 nodes) scores **94** with LCP 2,562 ms on the same shell, CSS and React runtime.

So the remaining gap is the homepage's own composition: hydrating one large client component that owns the whole marketing page, plus first-viewport compositing cost (a full-viewport `filter`, several `backdrop-filter` surfaces, layered gradients and `mix-blend-mode`) under a 4x CPU slowdown. Closing it needs either server-rendered static sections with smaller client islands, or the planned GPU-composited ambient layer — both outside this performance-only scope, which forbids a GPU upgrade and a visual redesign.

**Mobile 90+ is therefore not achieved and is not claimed.** Desktop 90+ is verified (98).

## Assets deliberately not degraded

Lighthouse reports "properly size images: est savings of 105 KiB" for the hero artwork on the mobile profile. That number assumes Lighthouse's emulated DPR of 1.75; real phones report DPR 2.6–3, where the same 369 CSS px artwork genuinely needs the 1024w candidate. Serving a smaller candidate would soften the painting on real devices to satisfy a simulator, so the existing `srcset`/`sizes`/AVIF-first `<picture>` was left intact. This is a judgement call, recorded rather than hidden.

## Limitations

- Live "after" numbers require a deployment. Cloudflare is off-limits in this task and no deployment was performed, so the production improvement is verified only for the parts that do not depend on the live site key (zero challenge requests before interaction, and the request waterfall on a production build).
- No hardware GPU: all numbers are software-rendered, so frame-rate and compositing costs read worse than on a real device.
- `pagespeed.web.dev` itself was not driven; the API quota block above is the reason.
- The full Playwright visual-baseline suite was not run; verification covered the updated Turnstile spec, the Turnstile unit suite, a browser probe at 390/1440 px, and the repository gate.
- Lighthouse run-to-run variance on this shared CPU is ±3 points and ±90 ms TBT, which is why before/after are reported as run sets with medians rather than single runs.
