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

## Round 2 — where the mobile LCP render delay actually goes

Method: production build served with `next start`, Lighthouse 12.8.2 with the PageSpeed
Insights mobile profile, plus a CDP probe that reproduces the PSI network profile
(1.6384 Mbps down, 750 kbps up, 150 ms RTT) with a 4x CPU throttle and mobile device
metrics. Averages of repeated runs; the shared CPU varies by ±3-4 score points.

| Probe | Mobile LCP | Images on the wire |
| --- | --- | --- |
| Baseline | 3,880 ms | 694 KiB |
| All JavaScript blocked | 2,576 ms | 519 KiB |
| Mobile sky backdrop blocked | 2,748 ms | 519 KiB |
| Every backdrop-filter, mix-blend-mode and filter disabled | 3,660 ms | 694 KiB |
| Star canvas animation loop disabled | 3,756 ms | 694 KiB |

What the numbers say:

- The LCP element is `img.hero-art-image`. Lighthouse attributes 4,039 ms (80%) of its
  5,050 ms LCP to render delay, and only 9% to load time.
- That delay is byte-bound, not paint-bound: the hero request starts at ~55 ms and
  completes at ~3.6 s because 694 KiB of imagery shares a 1.6 Mbps pipe. LCP lands on
  the `load` event within a few milliseconds in every run.
- Expensive compositing is not the bottleneck. Disabling every blur, blend mode and
  filter saves ~220 ms; stopping the star canvas loop saves ~70 ms. Both remain
  untouched.
- Blocking all JavaScript saves 1,304 ms, so hydration is the second-largest cost, but
  the page cannot ship without its interactive client component.

Change kept: the mobile sky backdrop is re-encoded as AVIF (quality 58) and listed first
in the mobile `image-set`. 175 KiB -> 139 KiB at slightly better fidelity (PSNR 38.1 dB
against the JPEG master, versus 36.9 dB for the WebP that was being served). Total mobile
transfer 777 KiB -> 742 KiB.

Changes measured and reverted, because they made the build worse:

- `sizes="calc(100vw - 21px)"` on the hero artwork. It measured -220 ms in the emulated
  probe, but in the real build Chrome's preload scanner does not evaluate `calc()` in
  `sizes`: it falls back to `100vw`, starts the 1024w request, and the parser then starts
  a second one. Transfer rose to 878 KiB and LCP to 5.6 s. Reverted.
- A 768w hero candidate and a matching `<link rel="preload">` for the hero image: the same
  double fetch, 878 KiB and 4,320 ms LCP. Reverted.
- Re-encoding the hero AVIF at matched quality saves at most 4 KiB, so it was left alone.

Conclusion for this round: mobile 90+ is not reachable by changing rendering behaviour.
On the PSI mobile profile the page must deliver roughly 400 KiB to paint the hero inside
2.5 s, and the first viewport is made of protected artwork (the 199 KiB hero and the
139 KiB Milky Way backdrop) plus the React/Next runtime (174 KiB JS, 56 KiB CSS across
five render-blocking files). The remaining levers are to shrink or withhold that artwork,
which this task forbids, or to replace the single client component with server-rendered
sections, which is a redesign.

## Round 4 — moving the page-wide client boundary

The homepage was one `'use client'` component that owned every section, so the whole
document entered the hydration tree. Two sections carry no state and no handlers, so they
now render on the server and reach the client shell as slots:

- `app/homepage/HomeStaticSections.js` exports `CommunityStoriesSection` and
  `AboutTeaserSection` as plain server components.
- `app/page.js` renders them and passes them to `<HomePage slots={...} />`.
- `HomePage` places `{slots.communityStories}` and `{slots.aboutTeaser}` where the markup
  used to be inline, so that markup is streamed as server output and is not hydrated.

Both states were served side by side (ports 3011 and 3012) and measured alternately with
the PSI mobile profile, so host drift affects both:

| Run | Baseline 32b2a7c7 | Split |
| --- | --- | --- |
| 1 | 4,897 ms LCP, score 72 | 4,819 ms LCP, score 73 |
| 2 | 4,893 ms LCP, score 72 | 4,819 ms LCP, score 71 |
| 3 | 4,820 ms LCP, score 73 | 4,812 ms LCP, score 64 (TBT 770 ms, outlier) |
| 4 | 4,887 ms LCP, score 71 | 4,816 ms LCP, score 72 |
| 5 | - | 4,816 ms LCP, score 70 |

LCP separates cleanly by about 75 ms (1.5%): every split run landed at or below 4,819 ms and
every baseline run at or above 4,820 ms. The score did not move - median 71 for the split
against 72 for the baseline, which is inside this host's run-to-run spread. Transfer fell
from 741 to 739 KiB, TBT stayed unchanged within its 390-480 ms drift, and desktop measured
98 (LCP 1.2 s, TBT 60 ms, 1,018 KiB), matching the round 1 desktop result.

The split therefore recovers about 75 ms of LCP and removes real hydration work, but it does
not change the score. Mobile 90+ remains out of reach: the no-JavaScript floor is 2,576 ms
against 4,819 ms with scripts, and 129 of the 174 KiB first-viewport JavaScript is React DOM
plus the Next router, which cannot be shrunk from application code. The remaining sections
either own state (suggestion form, checkout modals, visits badge) or are asserted against
`HomePage.js` source; each would need its own island for a smaller share of the same cost.

Three source-location assertions in `__tests__/first-screen-and-naming.test.js`,
`__tests__/homepage-content-refresh.test.js` and `__tests__/homepage-nav-gold-shimmer.test.js`
read the homepage source directly. They now read `HomePage.js` plus `HomeStaticSections.js`
together; every assertion itself is unchanged.

## Round 4 verification — behavioural parity with 32b2a7c7

The split was measured but not behaviourally re-verified before it was committed, so this pass
closes that gap on the committed tree (`0fa5666c`). The workspace reset had removed the
dependencies and Chromium's shared libraries; `pnpm install --frozen-lockfile` and the
repository wrapper's own provisioning (`./scripts/setup-playwright-agent.sh --probe-browser`,
PASS) restored them. No sudo and no system packages were needed.

**Markup equivalence.** With both production builds served side by side, the outerHTML of the
two moved sections is byte-identical: `#community-section` 1,873 characters on both, and
`.homepage-about-teaser` 1,109 characters on both. The `<nav>` label list is identical too.

**Behavioural parity** (390x844, production builds, same profiler):

| Observation | `32b2a7c7` | Round 4 split |
| --- | --- | --- |
| Star canvas size | 390x844 | 390x844 |
| Lit canvas pixels, two reads 900 ms apart | 1,025 -> 1,022 | 1,033 -> 1,020 |
| Turnstile fallback notice | "Spam check is not configured" | same |
| Suggestion submit disabled | yes | yes |
| Horizontal overflow | 0 | 0 |

**Full Playwright suite**, in the CI configuration (`CI=1`: 2 workers, 1 retry):

| Project | Result |
| --- | --- |
| desktop | 76 passed, 4 skipped, 0 failed |
| mobile-390 | 76 passed, 4 skipped, 0 failed |
| mobile-412 | 75 passed, 1 flaky (passed on retry), 4 skipped, 0 failed |

Two tests fail intermittently in a local run without CI's retry: `gold-cta.spec.ts` "hover
lifts and press flattens each representative CTA" and `mobile-accessibility.spec.ts` "all
audited routes render one main landmark". Both were reproduced on a `32b2a7c7` worktree with
its own production build, and both pass when run alone on the split tree, so neither is caused
by the split: the first is a hover-transform timing race, the second reads `<nav>` labels while
the development server is still streaming.

**Six-experience drive on the split production build**, at 390x844 and 1440x900 and again after
rotating to 844x390: the Daily Card Reveal flips (0 -> 2 canvases, text 628 -> 547), the Crystal
Ball produces its reading (5 -> 20 running animations, text 873 -> 1,201), the Lucky Meter
responds, the Community Map renders 4 stories, the homepage runs 21 animations with its canvas
painting, and every route at every size reports 0 horizontal overflow. Console output contains
only the pre-existing `/api/lucky-stories` 500s, because that route needs the deployed database.

`tsc --noEmit` exit 0, Vitest 87 files / 857 tests passed, `./freebuff-verify.sh` exit 0, clean
production build 344,255,379 bytes = 328.31 MiB.

One measurement trap worth recording: an orphaned `next start` process from an earlier probe
kept serving a `.next` directory that had since been deleted, so its chunk requests returned 500
and the page never hydrated. That looked exactly like a hydration regression in the split.
Killing the listeners by PID and re-measuring cleared it; no orphaned server may survive a probe.
