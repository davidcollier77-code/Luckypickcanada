# Verification evidence — feature images and social share image

Feature: `specs/112-feature-image-social-sharing-optimization`
Captured: 2026-11-07, local production build (`next build --webpack`, `next start -H 0.0.0.0 -p 3000`).

## 1. Asset measurements (sharp 0.35.5)

### Social share image (F-H3)

| File | Dimensions | Format | Bytes | Delta vs original |
| --- | --- | --- | --- | --- |
| `public/1785347037732.png` (original, retained) | 1407 × 768 | PNG | 1,290,881 | — |
| `public/luckypickcanada-share-1200x630.jpg` (new) | 1200 × 630 | JPEG q90 4:4:4 | 127,584 | −1,163,297 B (−90.12%) |

Production process: resize the original to 1200 px wide (→ 1200 × 655), then centre-crop 12 px top and
13 px bottom (→ 1200 × 630). Only background bands are removed; logo, maple leaf, wordmark, tagline and
CTA remain inside the frame.

### Feature images (F-H2 / F-M6)

| Route | Existing delivered file | Bytes before | New candidates (AVIF) | Bytes after | Saved |
| --- | --- | --- | --- | --- | --- |
| `/crystal-ball` | `crystal-ball-pedestal.avif` 716 × 875 | 226,663 | `-420w.avif` 420 × 513 | 66,706 | 159,957 B (−70.57%) |
| `/lucky-meter` | `lucky-meter-night-sky.avif` 1400 × 2559 | 390,334 | `-640w.avif` 640 × 1170 / `-1024w.avif` 1024 × 1872 | 61,326 / 164,418 | −84.29% / −57.88% |
| `/reveal` | `NGC4216_crawford.avif` 2949 × 2847 | 137,183 | `-1280w.avif` 1280 × 1236 / `-1920w.avif` 1920 × 1854 | 47,665 / 74,892 | −65.25% / −45.41% |
| `/map` | `IMG_20260731_055452_187611.avif` 569 × 464 | 38,666 | none generated (see note) | 38,666 | 0 (already correct) |

WebP counterparts: crystal 420w 104,354; meter 640w 62,460 and 1024w 171,738; reveal 1280w 43,012 and
1920w 70,130. Originals (PNG/JPEG/WebP) are unchanged and remain the fallback candidates.

Note on `/map`: the source is 569 px wide against a 704 px rendered box, so a larger candidate would be an
upscale with no added detail. The existing AVIF/WebP derivatives and the `width`/`height` declaration were
already correct and were deliberately left untouched, per the "do not recreate correctly implemented
derivatives" boundary.

## 2. Authored markup delivered by the production build (curl)

```
/crystal-ball
<source srcSet="/assets/crystal-ball-pedestal-420w.avif 420w, /assets/crystal-ball-pedestal.avif 716w" sizes="(max-width: 560px) 75vw, 420px" type="image/avif"/>
<source srcSet="/assets/crystal-ball-pedestal-420w.webp 420w, /assets/crystal-ball-pedestal.webp 716w" sizes="(max-width: 560px) 75vw, 420px" type="image/webp"/>
<img src="/assets/crystal-ball-pedestal.png" ... width="716" height="875" loading="eager" decoding="async"/>

/reveal
<source type="image/avif" srcSet="/NGC4216_crawford-1280w.avif 1280w, /NGC4216_crawford-1920w.avif 1920w, /NGC4216_crawford.avif 2949w" sizes="100vw"/>
<source type="image/webp" srcSet="/NGC4216_crawford-1280w.webp 1280w, /NGC4216_crawford-1920w.webp 1920w, /NGC4216_crawford.webp 2949w" sizes="100vw"/>
<source type="image/jpeg" srcSet="/NGC4216_crawford.jpg" sizes="100vw"/>
<img src="/NGC4216_crawford.jpg" alt="Cosmic Space Background" width="2949" height="2847" ... aria-hidden="true"/>

/lucky-meter
<source srcSet="/images/lucky-meter-night-sky-640w.avif 640w, /images/lucky-meter-night-sky-1024w.avif 1024w, /images/lucky-meter-night-sky.avif 1400w" sizes="100vw" type="image/avif"/>
<source srcSet="/images/lucky-meter-night-sky-640w.webp 640w, /images/lucky-meter-night-sky-1024w.webp 1024w, /images/lucky-meter-night-sky.webp 1400w" sizes="100vw" type="image/webp"/>
<img ... loading="eager" fetchPriority="high" object-position:center 40% src="/images/lucky-meter-night-sky.webp"/>
```

Social metadata on every route (`/`, `/crystal-ball`, `/reveal`, `/lucky-meter`, `/map`,
`/lucky-map-of-canada`, `/where-luck-has-been-found-in-canada`):

```
og:image        https://luckypickcanada.ca/luckypickcanada-share-1200x630.jpg
og:image:width  1200
og:image:height 630
twitter:image   https://luckypickcanada.ca/luckypickcanada-share-1200x630.jpg
```

Asset response headers (HTTP 200): share image `image/jpeg 127584`, crystal 420w AVIF `image/avif 66706`,
meter 640w/1024w AVIF `61326`/`164418`, reveal 1280w/1920w AVIF `47665`/`74892`, map AVIF `38666`,
fallbacks `image/png 1529009`, `image/jpeg 2515005`, `image/png 1290881`.

## 3. Real-browser delivery (in-VM headless Chromium, CDP)

Measured through iframes at a 1440 px and a 390 px viewport (browser DPR 2), reading `currentSrc` and the
PerformanceResourceTiming `decodedBodySize` of the image actually fetched.

| Route | 1440 px frame | 390 px frame |
| --- | --- | --- |
| `/crystal-ball` | `/assets/crystal-ball-pedestal.avif` 226,663 (716w; 420 × 2 = 840 > 716) | `/assets/crystal-ball-pedestal.avif` 226,663 (292 × 2 = 584 → 716w) |
| `/reveal` | `/NGC4216_crawford.avif` 137,183 (1440 × 2 → 2949w) | `/NGC4216_crawford-1280w.avif` **47,665** (390 × 2 = 780 → 1280w) |
| `/lucky-meter` | `/images/lucky-meter-night-sky.avif` 390,334 (1440 × 2 → 1400w) | `/images/lucky-meter-night-sky-1024w.avif` **164,418** (390 × 2 = 780 → 1024w) |
| `/map` | `/IMG_20260731_055452_187611.avif` 38,666 | same, 38,666 |

Fallback assets requested directly in the browser all decode at their true intrinsic sizes:
crystal PNG 716 × 875, reveal JPEG 2949 × 2847, meter WebP 1400 × 2559, map PNG 569 × 464,
share JPEG 1200 × 630.

Note: `naturalWidth` on a `srcset` image is density-corrected by Chromium (it reports the `sizes` width),
so file identity is established from `currentSrc` and the resource-timing entry, not from `naturalWidth`.

Visual check: the `/crystal-ball` page rendered with the artwork, gold pedestal, plaque, heading and
subtitle intact and no layout shift around the ball (viewport screenshot inspected during the run).

### Limitation — remote MCP browser inspection

- **Browserbase tools are not exposed in this session** (`search_integration_tools` returns only
  Browserless for every Browserbase query), so the requested primary inspector is unavailable.
- **Browserless fallback cannot inspect the changed build**: it returns the preview gate text
  “This preview is private. Open it from the Browser panel in Freebuff, signed in as the project owner.”
  The `*.style.dev` preview is owner-authenticated; a third-party cloud browser cannot sign in, and no
  public tunnel or deployment was created for this task.
- The evidence above therefore comes from the chat's own managed Chromium (CDP, not Playwright MCP).
  Browserless/Browserbase verification of the changed build is **NOT RUN** and is reported as such,
  never as a pass.

### Fallback-selection limitation

The AVIF→WebP→PNG/JPEG `type` chain is asserted structurally and every fallback URL was fetched and
decoded in the browser, but no browser with AVIF/WebP decoding disabled was available, so automatic
fallback *selection* was not exercised end to end.
