# Audit Evidence Record — 2026-11-10

All values below were captured from the production site `https://luckypickcanada.ca/` and this repository on 2026-11-10 (UTC). Audit only; no application file was modified.

## Tooling and fallbacks

| Tool | Result | Evidence |
|---|---|---|
| Firecrawl (primary content retrieval) | **FAILED** — `Unauthorized: Invalid token` on scrape and map | `FIRECRAWL_SCRAPE` and `FIRECRAWL_MAP_MULTIPLE_URLS_BASED_ON_OPTIONS` returned the error |
| Crawlbase (governed fallback) | **PASS** — homepage HTML, `sitemap.xml`, `robots.txt` retrieved with `cb_status 200` | `CRAWLBASE_CRAWL_URL`, account `crawlbase_fired-hallux` |
| Browserless | **PASS** — rendered measurements, per-route profiling, accessibility DOM audit | `BROWSERLESS_EXECUTE_CUSTOM_FUNCTION`, `BROWSERLESS_TAKE_SCREENSHOT` |
| Repository Playwright CLI | **FAILED (environment)** — `pnpm exec playwright screenshot` exited 1 for desktop and iPhone 13 captures; Chromium 1248 is installed | Exit codes recorded; Browserless used as the governed fallback |
| `curl` | **PASS** — headers, redirects, asset sizes | See HTTP table |

## Route inventory

`robots.txt` declares `https://luckypickcanada.ca/sitemap.xml`; the sitemap lists 6 URLs: `/`, `/lucky-meter`, `/map`, `/crystal-ball`, `/reveal`, `/about`. `/privacy` and `/terms` return 200 with `<meta name="robots" content="noindex, follow">`.

## HTTP behaviour

| Request | Status | Destination |
|---|---|---|
| `/` | 200 | — |
| `/stories` | 308 | `/map` |
| `/lucky-map-of-canada` | 308 | `/map` |
| `/where-luck-has-been-found-in-canada` | 308 | `/map` |
| `https://www.luckypickcanada.ca/` | 301 | `https://luckypickcanada.ca/` |
| `/nonexistent-audit-page-xyz` | 404 | body `<title>` is the homepage title |

Homepage response headers include HSTS (`max-age=15552000`), CSP, `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`, COOP, `x-nextjs-cache: HIT`.

**Static asset caching (production):**

```
homepage-hero-lucky-pick-canada.avif -> cache-control: public, max-age=0, must-revalidate
_next/static/css/92104dd48f9c9155.css -> cache-control: public, max-age=0, must-revalidate
sounds/confetti-pop.wav              -> cache-control: public, max-age=0, must-revalidate
```

This contradicts the intent of `next.config.mjs` (`public, max-age=31536000, immutable` for images and `s-maxage=3600` for pages).

## Desktop measurements (1440×900, Browserless)

| Route | Status | FCP | LCP | CLS | TTFB | Requests | Transfer |
|---|---|---|---|---|---|---|---|
| `/` | 200 | 1224 ms | 1224 ms | 0 | 727 ms | 44 | 1,071 KB |
| `/lucky-meter` | 200 | 1344 ms | 1344 ms | 0 | 426 ms | 40 | 409 KB |
| `/crystal-ball` | 200 | 612 ms | 804 ms | 0 | 278 ms | 38 | 988 KB |
| `/reveal` | 200 | 384 ms | 384 ms | 0.01 | 16 ms | 56 | 1,540 KB |
| `/map` | 200 | 564 ms | 1224 ms | 0 | 21 ms | 33 | 111 KB |
| `/about` | 200 | 1084 ms | 1084 ms | 0 | 240 ms | 16 | 5 KB |

All six routes: HTTP 200, one H1, `lang="en-CA"`, skip link, `<main>`, no missing `alt` attributes, no unnamed buttons or links.

## Mobile measurements (390×844, emulated iPhone UA)

| Route | FCP | LCP | CLS | TTFB | Requests | Transfer | Horizontal overflow |
|---|---|---|---|---|---|---|---|
| `/` | 1932 ms | 2036 ms | 0 | 1536 ms | 44 | 827 KB | No (scrollWidth 390) |
| `/lucky-meter` | 824 ms | 1160 ms | 0 | 244 ms | 40 | 409 KB | No |
| `/crystal-ball` | 584 ms | 1004 ms | 0 | 278 ms | 38 | 1,144 KB | No |
| `/reveal` | 416 ms | 424 ms | 0 | 165 ms | 70 | 1,529 KB | No |
| `/map` | 380 ms | 908 ms | 0 | 159 ms | 35 | 114 KB | No |
| `/about` | 676 ms | 676 ms | 0 | 292 ms | 16 | 5 KB | No |

## Payload composition

**Homepage top resources (transfer):**

| Resource | Type | KB |
|---|---|---|
| `crystal-ball-bg-desktop.webp` | css background | 418 |
| `homepage-hero-lucky-pick-canada.avif` | preload image | 199 |
| `2292-*.js` | script | 65 |
| `5c5d0c68-*.js` | script | 64 |
| `e4af272ccee01ff0-s.p.woff2` | font | 48 |
| `confetti-pop.wav` | audio | 43 |
| `d66728dbbd8a1aeb.css` | stylesheet | 29 |

**`/crystal-ball`:** 988 KB total, of which **902 KB is audio** preloaded on entry — `crystal-ball-energy.wav` 676 KB, `crystal-ball-reveal.wav` 138 KB, `crystal-ball-leaf.wav` 88 KB.

**`/reveal`:** 1,540 KB total, of which **1,352 KB is audio** — including `final_discharge.mp3` 228 KB and `standard_final_discharge.mp3` 210 KB as separate downloads, plus 12 other cue files.

**Fonts:** 4 preloaded WOFF2 files, 137,216 bytes total. CSS files total ~52 KB.

**Repository assets:** `public/` is 33 MB. Audio: 28 MP3 (3.6 MB) + 6 WAV (1.4 MB) = 5.26 MB. Rasters: 105 files, 28.45 MB; top-level PNG/JPG alone 15 MB. Unreferenced by `app/`, `components/` or `themes/`: `a_polished_high_detail_card_illustration_poster_i.png` (3.1 MB), `1785347037732.png` (1.3 MB), `IMG_20260728_220305_112042.png` (342 KB).

**Responsive background:** `themes/default/homepage.css:491` sets `.homepage-sky-backdrop` to `/assets/crystal-ball-bg-desktop.webp` via `image-set`; `homepage.css:772` switches to the mobile variant inside a media query. Both variants exist: desktop WebP 427,992 bytes / AVIF 474,841; mobile WebP 178,720 / AVIF 195,447. The desktop sky is the single largest homepage resource at 418 KB transferred and is a fixed, full-viewport photographic background.

## Hero geometry (rendered)

| Viewport | H1 top | H1 font size | Explore button top | Hero artwork height | Fixed nav | Back-to-top |
|---|---|---|---|---|---|---|
| 1440×900 | 912 px | 15.2 px | 1,175 px | 1,044 px | No | No |
| 390×844 | 502 px | 12.9 px | 701 px | 524 px | No | No |

Page height: 9,348 px desktop / 8,445 px mobile. Sections: 10. `.gold-3d-btn` instances on the homepage: 8. Heading structure: one H1, 12 H2, 1 H3. FAQ: 14 items with `aria-expanded`. JSON-LD on `/`: `WebSite` + `FAQPage` (14 questions, matching `app/homepage/faq-content.js`). Other routes: `WebSite` only; 404: inherits homepage title.

## Accessibility DOM audit (Browserless)

| Route | Buttons | Unnamed buttons | Links | Unnamed links | Inputs | Unlabelled inputs | Images | Missing alt | Heading skips | Focusables | Targets <24 px |
|---|---|---|---|---|---|---|---|---|---|---|---|
| `/` | 18 | 0 | 24 | 0 | 4 | 0 | 7 | 0 | 0 | 47 | 0 |
| `/map` | 55 | 0 | 16 | 0 | 1 | 0 | 2 | 0 | 0 | 72 | 0 |

Both routes have `aria-live`/`role=status` regions, a skip link, a `<main>` landmark, `lang="en-CA"`, and stylesheets containing `prefers-reduced-motion` rules. Audio has no mute/volume control or persisted preference: repository search for `mute|soundToggle|audioEnabled|soundEnabled` and for audio-related `localStorage` returned no matches.

## Audio implementation facts

- 35 same-origin audio files, 5.26 MB; 6 WAV files are uncompressed (1.4 MB).
- Cue families: UI click, Explore confetti pop, reveal sparkle, reveal applause, 8-step premium reveal beam sequence plus 8 standard variants, Crystal Ball energy/reveal/leaf.
- Preload-before-gesture is used deliberately (`preloadConfettiPop`, `preloadRevealApplause`, `preloadCrystalBallAudio`), with `playerror`/`loaderror` handling.
- Applause is session-guarded (`beginRevealAudioSession`, `endRevealAudioSession`) so it cannot play after close or twice per reveal.
- Crystal Ball energy fades out over 160 ms on stop.
- Configured volumes range `0.065`–`1.0`, with no shared loudness normalisation.
- `ExploreLuckButton` returns before sound and particles when `prefers-reduced-motion` is set.

## Repository verification

```
./freebuff-verify.sh
→ PASS (exit 0)
  ├─ pnpm 10.30.3 bootstrap + pnpm install --frozen-lockfile: PASS
  ├─ Spec Kit task-artifact gate + 25 regression tests: PASS
  ├─ Verification status integrity tests: PASS
  ├─ pnpm exec tsc --noEmit: PASS
  ├─ pnpm run build (Next.js 16.4.3, webpack): PASS (20 pages)
  ├─ Refresh Docs tests: 36 passed, 0 failed
  └─ CSS optimisation warnings: 4 (Tailwind `u003e` pseudo-class parse warnings, non-fatal)

du -sb .next public → 335,110,439 bytes = 319.59 MiB  (cap: 495 MiB, strictly below)
git diff --check → clean (exit 0)
```

## Limitations

- Subjective audio listening was not possible; audio findings come from files, configuration, call sites and measured downloads.
- Performance numbers are two emulated runs from one network location, not Lighthouse lab data or real-device field data (CrUX). TTFB varied with edge cache state and is reported as observed, not as a stable benchmark.
- Mobile presentation was measured (no overflow, LCP, page height) but mobile screenshots could not be saved or displayed: the Playwright CLI capture exited 1, and Browserless returns image payloads too large to render in this session.
- The desktop hero screenshot was captured and reviewed; other route visuals were assessed from DOM, CSS and measurements.
- Authenticated admin, completed Stripe purchase and gift-email delivery flows were not exercised; no payment, database or email behaviour was tested.
- Colour contrast was not measured with a contrast tool; the audit did not claim WCAG conformance.
- `@axe-core/react` is present as a dependency but no automated axe run was performed.
