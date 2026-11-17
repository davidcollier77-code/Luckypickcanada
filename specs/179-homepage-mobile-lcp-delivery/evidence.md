# Evidence: Homepage Mobile LCP Delivery

Captured 2026-11-17. Every number below is lab data; this origin has no CrUX field data.

## 1. PageSpeed Insights baselines (live `https://luckypickcanada.ca`, before any change)

| | Mobile | Desktop |
| --- | --- | --- |
| Report | <https://pagespeed.web.dev/analysis/https-luckypickcanada-ca/dkb5k82qb5?form_factor=mobile> | <https://pagespeed.web.dev/analysis/https-luckypickcanada-ca/4iltgxrud6?form_factor=desktop> |
| Captured | 2026-11-17 09:23 EST | 2026-11-17 09:25 EST |
| Performance | **76** | **98** |
| Accessibility / Best practices / SEO | 96 / 100 / 100 | 96 / 100 / 100 |
| Field data (CrUX) | **No Data** | **No Data** |
| FCP | 1.2 s | 0.3 s |
| LCP | **4.1 s** | 1.1 s |
| TBT | 350 ms | 50 ms |
| CLS | 0 | 0 |
| Speed Index | 4.8 s | 0.8 s |
| Environment | Moto G Power emulation, slow 4G, Lighthouse 13.6.0, HeadlessChromium 157 | Emulated desktop, custom throttling |

Mobile diagnostics reported by PSI: improve image delivery (−105 KiB), render-blocking requests (−710 ms), efficient cache lifetimes (−47 KiB), legacy JavaScript (−22 KiB), minimise main-thread work (3.5 s), reduce unused JavaScript (−54 KiB), 8 long tasks, 2 non-composited animations. The Pixel/Agentic Browsing tab reported 2/2.

## 2. Local production-build baselines

Lighthouse 13.6.0 from `/tmp` (not a project dependency), Chromium 156.0.8078.4, `--preset=perf` (the PSI mobile profile: 412×823, DPR 1.75, slow 4G, 4× CPU) and `--preset=desktop`, against `next start` of the production build on `127.0.0.1:3100`. No hardware GPU is present in this environment, so rendering is software for both baseline and after runs.

### Mobile (before)

| Run | Score | FCP | LCP | TBT | CLS | SI | Transfer |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | 61 | 2.5 s | 4.3 s | 800 ms | 0 | 4.2 s | 724 KiB |
| 2 | 68 | 2.4 s | 4.1 s | 550 ms | 0 | 4.0 s | 724 KiB |
| 3 | 69 | 2.5 s | 4.1 s | 500 ms | 0 | 4.1 s | 724 KiB |

Median **68**. Hero request: starts 633 ms, 204 594 B (1024 w AVIF), finishes 3 914 ms. LCP breakdown: TTFB 9 ms, load delay 625 ms, **load duration 3 283 ms**, render delay 201 ms.

### Desktop (before)

| Run | Score | FCP | LCP | TBT | SI |
| --- | --- | --- | --- | --- | --- |
| 1 | 98 | 0.3 s | 1.2 s | 60 ms | 0.5 s |
| 2 | 98 | 0.3 s | 1.2 s | 50 ms | 0.5 s |

## 3. Investigation findings

| Area | Evidence | Conclusion |
| --- | --- | --- |
| LCP chain | `lcp-breakdown-insight`, `network-requests` | Byte/pipe-bound: one 204 KB image plus 41.5 KiB CSS, 51 KiB fonts and ~130 KiB JS on a 1.6 Mbps pipe |
| Candidate ladder | `currentSrc` probe | PSI's profile needs 721 device px; the ladder offered 669 w and 1024 w, so Chrome fetched the 203 KiB 1024 w file |
| Render-blocking CSS | `render-blocking-insight` | Five files, 41.5 KiB gzipped, each modelled as a separate blocking round trip; 13 KiB of it is the Crystal Ball route's stylesheet |
| Initial JS | chunk inspection | 2292 (67 KiB gz) is the Next App Router client (`fetchServerResponse`), 5c5d (64 KiB gz) is React DOM; neither is deferrable. Howler, confetti, modals and the Turnstile widget are already deferred by PR #1933 |
| Night sky | V8 CPU profile, whole first load, 4× CPU, 390×844 | Canvas2D star loop ≈ 15 ms self time (<0.3 % of samples). Two 236 ms / 239 ms framework long tasks dominate TBT. No canvas change is justified, so none was made |
| `Link` preload header | Built, served, measured | Header delivered correctly, one fetch only (`Link:` present, no second hero request), request start still 632 ms, LCP 4.1→4.2 s. **Reverted** — no measured gain |
| `experimental.cssChunking: 'strict'` | Built, measured | Homepage blocking CSS 41 556 → 39 641 B gz; the Crystal Ball CSS still merged. **Reverted** — 1.9 KiB for a global config change |

## 4. The change

Added `public/homepage-hero-lucky-pick-canada-768w.avif` (146 289 B) and `.webp` (222 894 B), generated from the existing 1024 w master with `sharp` (lanczos3, AVIF q66 / WebP q84), and inserted them into the ascending ladder used by both `<source>` elements, the `<img>` fallback and the preload `imageSrcSet`. `sizes`, `fetchPriority`, `loading`, `alt`, the `<picture>` structure, the artwork and every layer above it are unchanged.

## 5. After-measurements

### Candidate selection (`artifacts/homepage-mobile-lcp-20261117/check-image-candidates.mjs`)

| Profile | Device px needed | Selected | Transfer | Before |
| --- | --- | --- | --- | --- |
| 390×844 @ 2.75 | 1 073 | `homepage-hero-lucky-pick-canada.avif` (1024 w) | 199 KiB | same |
| 412×823 @ 1.75 (PSI) | 721 | **`…-768w.avif`** | **143 KiB** | 199 KiB |
| 412×915 @ 2.75 | 1 133 | `homepage-hero-lucky-pick-canada.avif` (1024 w) | 199 KiB | same |
| 1440×900 @ 1 | 1 440 (declared 1024 px) | `homepage-hero-lucky-pick-canada.avif` (1024 w) | 199 KiB | same |

No profile receives fewer device pixels than it needs; the change only removes oversampling.

### Mobile (after)

| Run | Score | FCP | LCP | TBT | CLS | SI | Hero transfer |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | 77 | 2.4 s | 3.2 s | 490 ms | 0 | 3.7 s | 147 556 B |
| 2 | 79 | 2.4 s | 3.1 s | 420 ms | 0 | 3.7 s | 147 556 B |
| 3 | 77 | 2.4 s | 3.1 s | 480 ms | 0 | 3.6 s | 147 556 B |

Median **77** (from 68). LCP median 3.1 s (from 4.1 s). Every after-run (77–79) is above every before-run (61–69), so the gain is outside run-to-run noise.

### Desktop (after)

| Run | Score | FCP | LCP | TBT | SI |
| --- | --- | --- | --- | --- | --- |
| 1 | 98 | 0.3 s | 1.2 s | 50 ms | 0.5 s |
| 2 | 98 | 0.3 s | 1.2 s | 50 ms | 0.5 s |

Unchanged. (One earlier desktop attempt aborted with a zero score and no metrics — a Lighthouse run failure, not a page failure; it was re-run.)

### Fidelity A/B at the PSI mobile profile (`fidelity-ab.mjs`)

The same `<img>` element screenshotted twice at 412×823 DPR 1.75 with animations disabled, once with the 768 w candidate and once with the 1024 w file routed over that URL: output 648×973, **mean absolute channel difference 2.4 / 255 (0.94 %), PSNR 32.42 dB**, differences concentrated on the gold wordmark's edges. `fidelity-detail-top768-bottom1024.png` shows the wordmark region from both renders; they are visually indistinguishable at the rendered size.

## 6. Verification

| Check | Status | Evidence |
| --- | --- | --- |
| Focused hero suites | PASS | `homepage-hero-preload` 6/6, `homepage-hero-layout` 10/10 |
| Full Vitest suite | PASS except one pre-existing failure | 88 files, 864 passed, 1 failed |
| `pnpm exec tsc --noEmit` | PASS | exit 0 (inside `freebuff-verify.sh`) |
| `./freebuff-verify.sh` | FAIL — pre-existing docs test | Spec Kit gate, governance suites, type check and production build passed; `scripts/test-refresh-docs.js` failed on `legacyHtml > 0` |
| Pre-existing failures reproduced on `main` | PASS | Throwaway worktree at `c9b346da`: `agent-governance-single-source` 1 failed / 9 passed and `test-refresh-docs.js` 47 passed / 1 failed, identical to this branch. Neither reads a file this change touches |
| Production build size | PASS | 366.83 MiB (`du -sb .next public`), cap 495 MiB |
| Browser verification | PASS | 390×844, 412×915, 1440×900: no console errors, no failed requests, no horizontal overflow, 4 navigation links, countdown present, star canvas animating, screenshots in `artifacts/homepage-mobile-lcp-20261117/` |

## 7. Limitations

- **PSI measures the deployed site.** The 76 → 77 local gain cannot appear on `pagespeed.web.dev` until this branch is merged and deployed; no PSI re-run is claimed or implied here.
- **90+ was not reached.** The remaining gap is structural: the LCP element is a 199 KiB painting sharing a 1.6 Mbps pipe with ~130 KiB of non-deferrable framework JS and 41.5 KiB of blocking CSS. PSI's own remaining image recommendation is to serve the 669 w file to phones, which at 390 px × DPR 2.75 is a 1.7× image and would soften the gold wordmark — the fidelity trade the mission forbids. Reaching 90 would require that trade, a smaller artwork, or removing features.
- This environment has no GPU, so local TBT is harsher than PSI's (TBT 420–490 ms locally against 350 ms on PSI). The local after-run TBT improvement is therefore partly measurement environment; the LCP and byte reductions are delivery-side and expected to hold.
- Firefox, WebKit and Samsung Internet were not exercised; only Chromium is provisioned here.
- `freebuff-verify.sh` and the full suite each report one failure that reproduces unchanged on `main`; this diff does not touch `AGENTS.md` or `.docs/`.
