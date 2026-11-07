# SEO Audit — Lucky Pick Canada (`https://luckypickcanada.ca/`)

**Task**: Master Work Request #1 — comprehensive, evidence-based SEO audit of the live site and repository.
**Task groups**: `deep-dive` (required: evidence-driven investigation and audit-only delivery) + `seo` (the repository's directly applicable specialist SEO guidance). `testing` was not selected; no behaviour was changed.
**Feature**: `specs/106-seo-audit` (new; no existing SEO feature directory, branch or PR to reuse — 0 open pull requests at start).
**Audit timestamp**: 2026-11-07, 13:02–13:07 UTC.
**Nature**: **AUDIT ONLY.** No recommendation is implemented. No application code, content, metadata, image, configuration, DNS, Cloudflare, indexing or deployment change is in this pull request.

---

## 1. Executive Summary

- **Overall assessment**: the site is structurally sound and technically healthy for a small entertainment site. Crawlability, indexability, canonicalisation, status codes, HTTPS/host consistency and sitemap/robots basics are all in good shape. No critical, site-blocking SEO defect was verified.
- **The real weakness is depth and payload**, not plumbing: the three headline features (`/lucky-meter`, `/crystal-ball`, `/reveal`) carry only ~69–94 words of crawlable text each, and their pages ship single images of 0.24–2.46 MB while the homepage — the best-optimised page — ships 1.02 MiB of JS/CSS/fonts and a 199 KB AVIF hero.
- **Three duplicate map URLs** return HTTP 200 with identical content; two of them inherit the homepage's `<title>`. Canonicals point to `/map`, so this is a dilution problem rather than a hard duplicate-indexing emergency.
- **Social presentation is under-served**: one 1.26 MB, 1407×768 PNG is the only share image sitewide, while the metadata declares 1200×630. Heavy images can fail or crop unpredictably in link previews.
- **Structured data is minimal** (WebSite + FAQPage only). The FAQ markup exactly matches the visible FAQ — good discipline — but FAQ rich results are effectively restricted to government/health sites, so the site earns little from it and lacks entity (Organization/Person) and breadcrumb markup.
- **What could not be assessed**: rankings, traffic, queries, indexing coverage and Core Web Vitals. Google Search Console, Analytics, CrUX and PageSpeed Insights were unavailable (PSI returned HTTP 429 quota exhaustion; CrUX requires a key). Every such item is listed in §8, not inferred.
- **Previous work still holds**: the secure JSON-LD helper, the FAQ↔schema parity, the single-format hero preload, the low-priority Turnstile preload and self-hosted fonts are all verified present on the live site today.

**Highest-value next actions** (details in §10): redirect or remove the two duplicate map URLs; replace the share image; compress the four oversized tool-page images; deepen the three thin feature pages; add Organization + breadcrumb structured data.

---

## 2. Existing Strengths

Preserve these — they are verified working, not assumed:

- **Sitemap and robots are present, correct and absolute.** `/sitemap.xml` returns 200 `application/xml`, brotli-compressed, listing 6 absolute URLs. `/robots.txt` returns 200, allows all crawling and declares the sitemap.
- **Self-referencing absolute canonicals on every indexable page**: `/`, `/lucky-meter`, `/crystal-ball`, `/reveal`, `/map`, `/about`, `/privacy`, `/terms`.
- **Incorrect URLs fail properly.** Unknown paths return a real HTTP 404 (not a soft 200) and the 404 document carries `noindex`.
- **Host and protocol consistency works**: `http://` → 301 → `https://`; `www.` → 301 → apex; trailing slashes 308-redirect to the canonical path; `/stories` 308-redirects to `/map`; uppercase `/Map` 404s.
- **Unique titles and descriptions on all six primary pages**, descriptions 95–156 characters (no truncation risk).
- **Legal pages are deliberately excluded from indexation** (`/privacy`, `/terms` = `noindex, follow`, absent from the sitemap) — correct for thin policy pages.
- **Hero image delivery is genuinely optimised.** `<picture>` with AVIF (199 KB) → WebP (293 KB) sources, responsive 669w/1024w variants, and exactly **one** AVIF preload — no duplicate-format download. Verified in live HTML: one `rel=preload` with `type="image/avif"`, no WebP preload.
- **Deferred third-party work.** The Turnstile script is preloaded at `fetchpriority="low"` and kept behind the hero and route CSS/JS; Google Fonts are self-hosted (`next/font`) with font preloads instead of a render-blocking external stylesheet.
- **Structured data is safely serialised.** `app/components/JsonLd.js` escapes `<` and `>` before injection; the FAQPage schema's 7 question/answer pairs are byte-identical to the visible accordion copy in `app/homepage/FAQSection.js`.
- **Homepage is a real internal-linking hub**, with CTA links to `/lucky-meter`, `/reveal`, `/crystal-ball`, `/map` and `/about`.
- **Mobile basics are correct**: `<meta name="viewport" content="width=device-width, initial-scale=1">`, one responsive site (no separate mobile URLs), `lang="en-CA"`.
- **SEO-adjacent trust and safety headers are strong**: HSTS, CSP, `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`.
- **Clear non-gambling framing** in the title, description, footer and FAQ — good for audience trust and for the entertainment-only positioning the project requires.

---

## 3. Critical and High-Priority Findings

### CRITICAL — none verified

No finding meets the critical bar (sitewide indexation blocked, robots blocking the site, broken canonical architecture, mass soft-404s, manual-action-class cloaking/deception).

Evidence for that conclusion: all 10 discovered public URLs resolve with expected statuses; `robots.txt` allows `*`; the sitemap is valid and reachable; canonicals are absolute and self-referencing; no primary page carries `noindex`; every discovered internal link returns 200; redirects are single-hop with no loops.

---

### F-H1 — Three URLs serve the same map page; two inherit the homepage title

1. **Issue**: `/map`, `/lucky-map-of-canada` and `/where-luck-has-been-found-in-canada` all return HTTP 200 with identical content. Both aliases are crawlable, absent from the sitemap, unlinked internally, and take the root layout's title instead of a map title.
2. **Affected URLs**: `https://luckypickcanada.ca/map`, `https://luckypickcanada.ca/lucky-map-of-canada`, `https://luckypickcanada.ca/where-luck-has-been-found-in-canada`.
3. **Evidence**: status 200 and sizes 55,325 / 55,450 / 57,549 bytes; identical H1 "Where Luck Has Been Found Across Canada 🍀" and identical H2/H3 sets on all three; both aliases emit `<title>Lucky Pick Canada | Daily Lucky Picks, Cards &amp; Stories</title>` (the homepage title) while `/map` emits `Lucky Map | LuckyPickCanada.ca`; all three emit `rel=canonical` = `https://luckypickcanada.ca/map`; `app/lucky-map-of-canada/page.js` and `app/where-luck-has-been-found-in-canada/page.js` declare `alternates: { canonical: '/map' }` and no `title`.
4. **Why it matters**: a canonical is a hint, not a directive. Three 200 URLs with the same body and two duplicated titles split crawl budget and can surface the wrong title in results or in third-party scrapers. Their `og:url` values also contradict the canonical, so social consumers see a different "page identity" than search engines.
5. **Recommendation**: either 301 both aliases to `/map` (preferred: keep one URL per page) or delete the routes. If they must stay reachable, give each a unique title/description that matches its own URL and make `og:url` agree with the canonical.
6. **Expected benefit**: consolidates link and content signals on one URL and removes duplicate titles from the crawl — no ranking promise.
7. **Difficulty**: Low (redirect entries in `next.config.mjs`, or route removal).
8. **Dependencies/risks**: confirm in Analytics whether any real traffic or external links use the aliases before removing; redirects must preserve query strings; any removal is an application change and needs separate approval.
9. **Confidence / verification**: **High — verified live and in source.**

---

### F-H2 — Multi-megabyte images on the three feature pages

1. **Issue**: the tool routes serve full-resolution images with no responsive variants or modern-format sources, so a single decorative or LCP image costs more than the homepage's entire script and stylesheet budget.
2. **Affected URLs and evidence** (dimensions measured with `sharp`, bytes from `Content-Length`):
   - `/crystal-ball` — `/assets/crystal-ball-pedestal.png`: **716×875 PNG, 1,493 KB (1.46 MB)**, `loading="eager"`, no `srcSet`, no AVIF/WebP source.
   - `/reveal` — `/NGC4216_crawford.jpg`: **2949×2847 JPEG, 2,456 KB (2.40 MB)**, decorative (`aria-hidden="true"`), no variants.
   - `/lucky-meter` — `/images/lucky-meter-night-sky.webp`: **1400×2559, 411 KB**, `loading="eager"` + `fetchPriority="high"`, no variants.
   - `/map` — `/IMG_20260731_055452_187611.png`: **569×464 PNG, 236 KB**, `loading="eager"` + `fetchPriority="high"`.
3. **Why it matters**: image bytes are the dominant cost of Largest Contentful Paint on these routes. 1.5–2.5 MB single images are slow on mobile connections and on lower-end phones, which is exactly the audience a Canadian consumer site targets.
4. **Recommendation**: reuse the pattern already proven on the homepage — `<picture>` with AVIF then WebP, 2–3 width variants, explicit `width`/`height`, and `loading="lazy"` for decoration below the fold.
5. **Expected benefit**: a materially lighter first view on four routes and a better chance of passing image-related performance audits — measured only after implementation.
6. **Difficulty**: Moderate (asset derivatives + markup), Low if the homepage pattern is copied.
7. **Dependencies/risks**: artwork is protected by repository governance — regenerate derivatives from the originals without altering composition; verify with the existing visual QA suite.
8. **Confidence / verification**: **High — sizes and dimensions measured; markup inspected.**

---

### F-H3 — The only share image is 1.26 MB and contradicts its declared size

1. **Issue**: one sitewide Open Graph/Twitter image is a large PNG whose real dimensions do not match the 1200×630 declared in metadata.
2. **Affected URLs**: every page — the image is `/1785347037732.png`, referenced by `app/layout.js` `openGraph.images` and `twitter.images`; page-level overrides reuse the same file.
3. **Evidence**: actual file is **1407×768 PNG, 1,261 KB**; `app/layout.js` declares `width: 1200, height: 630` and the rendered tags confirm `og:image:width=1200`, `og:image:height=630`, `og:image=https://luckypickcanada.ca/1785347037732.png`.
4. **Why it matters**: social and messaging platforms fetch this image with their own timeouts and re-crop it to their own aspect ratio. A 1.26 MB PNG is slow to fetch and some consumers will fall back to no image; the declared 1.90:1 box versus the real 1.83:1 image means previews crop differently from what the metadata promises.
5. **Recommendation**: export a 1200×630 JPEG or WebP under ~250 KB; either match the declared dimensions exactly or declare the real ones. Optionally add per-page images later.
6. **Expected benefit**: reliable, correctly cropped link previews, which supports click-through from shares — not a ranking promise.
7. **Difficulty**: Low.
8. **Dependencies/risks**: Facebook/X cache previews aggressively; re-scrape after the change. The file is also referenced in page-level metadata, so all references must move together.
9. **Confidence / verification**: **High — bytes and dimensions measured; declared values read in source and in rendered tags.**

---

## 4. Medium- and Low-Priority Findings

### F-M1 — Thin content and an empty heading outline on the three primary features

1. **Issue**: `/lucky-meter`, `/crystal-ball` and `/reveal` are the site's headline experiences but carry almost no crawlable explanatory text and little heading structure.
2. **Affected URLs**: `/lucky-meter` (~94 words, 2 H2), `/crystal-ball` (~80 words, **0 H2**), `/reveal` (~69 words, **0 H2**).
3. **Evidence**: rendered-text extraction (includes sitewide nav/footer, so real unique copy is lower); heading parse shows no H2 and no H3 on `/crystal-ball` and `/reveal`; source confirms client-rendered components with UI labels only.
4. **Why it matters**: these pages cannot rank for their own topic without enough text to establish it, and they give search engines nothing to quote for snippets or AI answers. Thin pages also make the site's topical purpose harder to read than the homepage's own copy does.
5. **Recommendation**: add 150–300 words of genuinely useful copy per page (what it is, how to use it, what the result means, entertainment disclaimer), 2–3 descriptive H2s, and one or two contextual links. No keyword repetition.
6. **Expected benefit**: stronger relevance for the feature's own topic and more ways to be found — no ranking guarantee.
7. **Difficulty**: Moderate (copy + layout; protected visual surface).
8. **Dependencies/risks**: page copy and layout are protected — needs owner approval; keep the premium visual character; avoid filler that repeats the same phrase.
9. **Confidence / verification**: **High for the measurement; the benefit is a professional judgement, not a measured outcome.**

---

### F-M2 — Titles are short, generic, and brand-inconsistent

1. **Issue**: page titles use 30–37 characters, spend a third of that on the brand, vary the brand form, and do not express the query intent the feature could serve.
2. **Affected URLs and evidence** (rendered title lengths): `/map` 30 — "Lucky Map | LuckyPickCanada.ca"; `/lucky-meter` 31; `/crystal-ball` 32; `/reveal` 37; `/about` 53; `/` 58. Brand appears as "LuckyPickCanada.ca", "Lucky Pick Canada", and "Lucky Pick Canada" with different separators. No `title.template` is used.
3. **Why it matters**: the title is the strongest on-page relevance signal and the main determinant of click-through in results. 30–37 characters leave roughly 20–25 characters unused, and phrases such as "daily lucky card", "lucky number generator" or "crystal ball reading" never appear.
4. **Recommendation**: adopt one brand suffix and write 50–60 character titles that name the feature plus its intent, e.g. "Lucky Meter — Daily Luck Reading | Lucky Pick Canada", "Crystal Ball — Ask a Fun Question | Lucky Pick Canada".
5. **Expected benefit**: clearer topical relevance and a better snippet click-through rate — unmeasured here.
6. **Difficulty**: Low (metadata only).
7. **Dependencies/risks**: changes what users see in results; confirm brand preference; keep each title unique.
8. **Confidence / verification**: **High — titles and lengths extracted from live HTML and matched to source.**

---

### F-M3 — Structured data is minimal, and the FAQ markup earns little

1. **Issue**: only two schema types exist sitewide (WebSite, FAQPage). There is no Organization/Person entity, no breadcrumb trail, no list/collection markup for stories, and no `sameAs` linking the four social profiles.
2. **Affected URLs**: `WebSite` on every page (from `app/layout.js`); `FAQPage` on `/` only (from `app/page.js`).
3. **Evidence**: parsed JSON-LD types per page: `["WebSite"]` everywhere, `["WebSite","FAQPage"]` on `/`. `WebSite` contains only name, url and description. `FAQPage`'s 7 pairs match the visible accordion exactly (verified by comparing `app/page.js` with `app/homepage/FAQSection.js`).
4. **Why it matters**: entity markup helps search engines connect the brand, the creator and the social profiles into one entity; breadcrumbs can improve how subpages appear in results. Conversely, FAQ rich results have been restricted to authoritative government/health sites since 2023, so this site's FAQ markup is valid but no longer a rich-result opportunity.
5. **Recommendation**: keep FAQPage (harmless) but add `Organization` (or `Person` for the solo creator) with `logo` and `sameAs`; add `BreadcrumbList` on subpages; add `ItemList` for the story list if it grows. Reuse the existing escaping `JsonLd` helper.
6. **Expected benefit**: clearer entity understanding and potential breadcrumb display; no guaranteed rich results.
7. **Difficulty**: Low–Moderate.
8. **Dependencies/risks**: markup must describe visible content; the four social URLs should be confirmed working first (see F-M10); invalid markup creates warnings rather than gains.
9. **Confidence / verification**: **High for current state; moderate for impact.**

---

### F-M4 — Static assets are revalidated on every visit

1. **Issue**: hashed Next.js bundles and artwork are served with `max-age=0, must-revalidate` instead of long-lived immutable caching, despite a configuration rule that declares a one-year immutable policy for image extensions.
2. **Affected URLs**: `/_next/static/**/*.css`, `/_next/static/chunks/*.js`, `/homepage-hero-lucky-pick-canada.avif`, `/assets/crystal-ball-pedestal.png`.
3. **Evidence**: live `cache-control: public, max-age=0, must-revalidate` on each; `next.config.mjs` declares `Cache-Control: public, max-age=31536000, immutable` for `/:path*.(avif|webp|png|jpg|jpeg|gif|svg|ico)`, which is not present on the observed image response.
4. **Why it matters**: content-hashed files never change, so revalidation is pure overhead. Repeat visitors and multi-page journeys re-request every asset, adding latency and requests that a first-load-only audit would miss.
5. **Recommendation**: identify which layer (OpenNext asset handler or Cloudflare) emits the header and apply one-year immutable caching to `/_next/static/*` and immutable artwork, keeping HTML on its short s-maxage.
6. **Expected benefit**: faster repeat views and fewer requests; measurable with a repeat-visit comparison after the change.
7. **Difficulty**: Low–Moderate (deployment layer).
8. **Dependencies/risks**: Cloudflare/deployment changes are owner-authorized; scope strictly to immutable assets so HTML is never cached long.
9. **Confidence / verification**: **High for the observed headers; the root cause is unverified without Cloudflare access.**

---

### F-M5 — The homepage first load is heavy for a mostly static page

1. **Issue**: the initial document pulls nine scripts, five stylesheets and four preloaded fonts before any image, and all CSS is render-blocking.
2. **Affected URL**: `/`.
3. **Evidence** (measured wire bytes): JS 9 files **618,379 B** (including `polyfills` 112,594 B; two chunks at 203,721 B and 242,535 B); CSS 5 files **291,226 B** (one file 172,430 B); fonts 137,216 B; total **1,046,821 B (~1.02 MiB)** before images; HTML 65,372 B; TTFB 0.283 s / 0.313 s / 0.313 s / 0.296 s / 0.494 s across five samples. HTML, CSS and the sitemap are brotli-compressed.
4. **Why it matters**: render-blocking CSS delays first paint and large client bundles delay interactivity, both of which are Core Web Vitals inputs. This audit could not measure those vitals (§8), so the finding is a byte-and-structure observation.
5. **Recommendation**: profile the 172 KB stylesheet for unused rules, consider deferring non-critical CSS, re-check whether the polyfill chunk is still needed for the supported browser matrix, and keep splitting rarely used client components.
6. **Expected benefit**: faster first render on mobile — to be proven with lab measurement, not assumed.
7. **Difficulty**: Moderate.
8. **Dependencies/risks**: protected visuals and a committed screenshot baseline mean any CSS change needs visual QA; the hero preload must not be disturbed.
9. **Confidence / verification**: **High for the sizes; the runtime effect is unverified.**

---

### F-M6 — Missing intrinsic dimensions on the hero and `/reveal` artwork

1. **Issue**: several images have no `width`/`height`, so the browser cannot reserve space before the file arrives.
2. **Affected URLs**: `/` (hero `<img>`, no dimensions; `/community-stars-bg.webp`, no dimensions) and `/reveal` (both images, no dimensions).
3. **Evidence**: attribute parse of the rendered `<img>` tags; by contrast `/crystal-ball`, `/map` and the homepage offer images do declare dimensions.
4. **Why it matters**: absent dimensions are a direct cause of layout shift (CLS). Actual CLS could not be measured here.
5. **Recommendation**: add `width`/`height` (or an equivalent CSS aspect-ratio) that matches each file's real ratio without changing the rendered layout.
6. **Expected benefit**: reduced layout-shift risk.
7. **Difficulty**: Low.
8. **Dependencies/risks**: must not move the hero artwork or the card; confirm visually.
9. **Confidence / verification**: **Medium — markup verified, impact unmeasured.**

---

### F-M7 — Two robots.txt sources, and a duplicate rule group in the live file

1. **Issue**: both a static `public/robots.txt` and a dynamic `app/robots.js` exist and describe the same policy; the live file is the static one, so the dynamic route is dead configuration. The live file also contains two separate `User-agent: * / Allow: /` groups.
2. **Affected URL**: `https://luckypickcanada.ca/robots.txt` (2,748 bytes).
3. **Evidence**: live file ends with the exact static file content (`User-agent: *`, `Allow: /`, `Sitemap: …`); the first group is Cloudflare's managed content-signal block; `app/robots.js` is not reflected in the response.
4. **Why it matters**: harmless today, but a future edit to `app/robots.js` would silently change nothing, and duplicate groups make the policy harder to reason about during an incident.
5. **Recommendation**: keep one source of truth and remove the duplicate group; verify the file after deployment.
6. **Expected benefit**: prevents a future accidental crawl-policy change.
7. **Difficulty**: Low.
8. **Dependencies/risks**: `robots.txt` is a high-impact file — validate byte-for-byte after any deploy.
9. **Confidence / verification**: **High — live bytes and repository source compared.**

---

### F-M8 — Non-descriptive image filenames and a few incorrect alt values

1. **Issue**: several images use camera/asset identifiers as filenames, one decorative image carries descriptive alt text while also being `aria-hidden`, and one content image has empty alt.
2. **Affected URLs and evidence**: `/NGC4216_crawford.jpg`, `/IMG_20260731_055452_187611.png`, `/IMG_20260728_220305_112042.webp`, `/1785347037732.png`, `/FB_IMG_1785107325979.jpg`; on `/reveal`, `<img alt="Cosmic Space Background" aria-hidden="true">` (decorative: alt should be empty); on `/`, the reward artwork `/1784889264858.png` has `alt=""`.
3. **Why it matters**: filenames are a minor image-search signal, and alt text is what users see when an image fails and what assistive technology announces. Contradictory decorative semantics are an accessibility defect as much as an SEO one.
4. **Recommendation**: use descriptive filenames for new derivatives (e.g. `lucky-map-canada-stories.png`), set `alt=""` on purely decorative images, and give content images meaningful alt text.
5. **Expected benefit**: modest image-search and accessibility improvement.
6. **Difficulty**: Low.
7. **Dependencies/risks**: renaming live assets breaks existing references and caches — prefer new filenames on new derivatives rather than renaming originals.
8. **Confidence / verification**: **High — markup and files inspected.**

---

### F-M9 — No contextual internal links between features

1. **Issue**: every page's internal links are the identical global navigation and footer; only the homepage adds in-content CTAs. No tool page links to another tool page or to supporting content inside its body.
2. **Affected URLs**: all pages; most visibly `/about`, `/map`, `/crystal-ball`, `/reveal`, `/lucky-meter`.
3. **Evidence**: anchor inventory per page — 8 global internal links plus 5 social externals everywhere; the homepage adds `/lucky-meter`, `/reveal`, `/crystal-ball`, `/map` and `/about` CTAs; no other page adds any.
4. **Why it matters**: contextual links carry relevance and give crawlers a reason to traverse; a nav-only link graph gives every page identical context and makes deep content less discoverable.
5. **Recommendation**: add a few natural in-copy links (Lucky Meter → Daily Card Reveal, Map → About, Reveal → Lucky Meter) as part of the copy work in F-M1.
6. **Expected benefit**: better crawl context and longer sessions.
7. **Difficulty**: Low once copy exists (depends on F-M1).
8. **Dependencies/risks**: copy and layout are protected; approvals required.
9. **Confidence / verification**: **High — anchor inventory extracted from every page.**

---

### F-M10 — Sitewide X (Twitter) link returns 404 to an automated request

1. **Issue**: the footer's X link may be dead.
2. **Affected URL**: `https://x.com/luckypickcanada` (linked in the footer on every page).
3. **Evidence**: an unauthenticated automated request returned **HTTP 404**; the Facebook group, Facebook page, Instagram and TikTok links returned 200 in the same check.
4. **Why it matters**: a broken outbound link is a trust and usability defect, and it would poison any `sameAs` entity markup added under F-M3.
5. **Recommendation**: open the link in a normal browser to confirm; fix the handle or remove the link.
6. **Expected benefit**: removes a dead sitewide link.
7. **Difficulty**: Low.
8. **Dependencies/risks**: X serves different responses to bots and logged-out clients, so this may be a false positive — confirm manually before changing anything.
9. **Confidence / verification**: **Medium — one automated observation; needs manual confirmation.**

---

### Low-priority findings

- **F-L1 — Duplicate heading text on the homepage.** `H2 "Lucky Reveal"` (section) and `H3 "Lucky Reveal"` (offer card) repeat within the same page. *Evidence*: heading parse. *Fix*: differentiate the card heading. *Effort*: Low. *Confidence*: High.
- **F-L2 — A dynamic count is used as an H2.** `/map` renders `H2 "1 lucky story"`. *Why*: counts change and make poor section headings. *Fix*: convert to a status line and keep a stable H2. *Effort*: Low. *Confidence*: High.
- **F-L3 — Dead metadata in a layout.** `app/lucky-meter/layout.js` declares a title and description that the page's own `metadata` overrides (live title is "Lucky Meter | Lucky Pick Canada"). *Why*: two conflicting sources invite future mistakes. *Fix*: keep one. *Effort*: Low. *Confidence*: High (source + live HTML).
- **F-L4 — The 404 page canonicalises to the homepage and inherits its description.** *Why*: minor confusion for tools that read canonicals before robots. *Fix*: drop the canonical (the page already sends `noindex`). *Effort*: Low. *Confidence*: High.
- **F-L5 — `keywords` meta is present sitewide.** *Why*: ignored by Google; harmless but noise. *Fix*: optional removal. *Effort*: Low. *Confidence*: High.
- **F-L6 — Sitemap has no `lastmod`.** *Why*: freshness hints are weaker for `/reveal` (daily) and `/map`. *Fix*: add `lastModified` for changing pages. *Effort*: Low. *Confidence*: High (sitemap inspected). Legal pages are correctly omitted.
- **F-L7 — Emoji inside the `/map` H1** ("…Canada 🍀"). *Why*: cosmetic; can appear in snippets. *Fix*: optional. *Effort*: Low. *Confidence*: High.
- **F-L8 — `map-logo-small.png` is 44 KB at 160×346 for a 40×40 render.** *Fix*: resize/compress. *Effort*: Low. *Confidence*: High.
- **F-L9 — Permanent redirects use 308** (`/stories` → `/map`, `/map/` → `/map`) while `www` → apex uses 301. *Why*: both are treated as permanent by Google, so no action is required; recorded for consistency. *Confidence*: High.
- **F-L10 — AI-crawler policy needs a conscious decision.** The live `robots.txt` includes Cloudflare's managed block, which disallows `Google-Extended`, `GoogleOther` and ~30 AI crawlers plus a `Content-Signal` declaration. `Google-Extended` does **not** affect Search indexing or ranking, but it does affect eligibility for some AI/Gemini uses. *Why*: this is a deliberate content-use policy, not a defect. *Action*: confirm it matches the owner's intent; do not change it as an "SEO fix". *Confidence*: High (live file).

---

## 5. Page-by-Page Findings

| URL | Status | Title (chars) | Desc (chars) | H1 / H2 / H3 | ~Words | Structured data | Key notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `/` | 200 | "Lucky Pick Canada \| Daily Lucky Picks, Cards & Stories" (58) | 156 | 1 / 12 / 1 | ~967 | WebSite, FAQPage | H1 is `sr-only`; duplicate H2/H3 "Lucky Reveal"; 4 images (hero AVIF/WebP good); best-optimised page but 1.02 MiB JS/CSS/fonts |
| `/lucky-meter` | 200 | "Lucky Meter \| Lucky Pick Canada" (31) | 121 | 1 / 2 / 0 | ~94 | WebSite | Thin; H1 is "AWAKEN TODAY'S RESONANCE"; 411 KB eager background image; dead layout metadata (F-L3) |
| `/crystal-ball` | 200 | "Crystal Ball \| Lucky Pick Canada" (32) | 95 | 1 / **0** / 0 | ~80 | WebSite | Thin; no H2; 1.46 MB PNG (F-H2) |
| `/reveal` | 200 | "Daily Card Reveal \| Lucky Pick Canada" (37) | 109 | 1 / **0** / 0 | ~69 | WebSite | Thinnest page; 2.40 MB decorative JPEG; missing image dimensions; `revalidate = 0` (dynamic render) |
| `/map` | 200 | "Lucky Map \| LuckyPickCanada.ca" (30) | 109 | 1 / 3 / 6 | ~460 | WebSite | Dynamic; H2 is a live count ("1 lucky story"); 236 KB PNG LCP image; province H3s are the strongest sub-page structure on the site |
| `/lucky-map-of-canada` | 200 | **homepage title** (58) | 116 | 1 / 3 / 6 | ~464 | WebSite | Duplicate of `/map`, canonical → `/map`, `og:url` self-referencing (F-H1) |
| `/where-luck-has-been-found-in-canada` | 200 | **homepage title** (58) | 142 | 1 / 3 / 6 | ~466 | WebSite | Duplicate of `/map`, canonical → `/map`, `og:url` self-referencing (F-H1) |
| `/about` | 200 | "About the Creator & Our Story \| Lucky Pick Canada" (53) | 150 | 1 / 6 / 2 | ~635 | WebSite | Best content depth on the site; only page with a real heading hierarchy; no images; no in-body links (F-M9) |
| `/privacy` | 200 | "Privacy Policy \| Lucky Pick Canada" (34) | 119 | 1 / 4 / 0 | ~249 | WebSite | `noindex, follow`; correctly absent from sitemap |
| `/terms` | 200 | "Terms of Service \| Lucky Pick Canada" (36) | 133 | 1 / 3 / 0 | ~226 | WebSite | `noindex, follow`; correctly absent from sitemap |
| `/stories` | 308 → `/map` | — | — | — | — | — | Legacy redirect works |
| unknown paths (`/gift`, `/checkout`, `/test-tools/gift-email`, `/index.html`, `/Map`) | 404 | "404: This page could not be found." | 156 (inherited) | 1 / 1 / 0 | ~69 | WebSite | Correct 404 + `noindex`; canonical wrongly points to the homepage (F-L4) |

**Cross-page**: titles unique on the six primary pages; descriptions present on every page; zero broken internal links (all 9 distinct internal hrefs return 200); one canonical per page; no page uses an `hreflang` set (correct — single `en-CA` locale).

---

## 6. Previous Audit Comparison

**Accessible prior records**: `specs/034-homepage-seo-section-background`, `specs/055-secure-jsonld`, `specs/homepage-perf`, `specs/perf-fixes`, `specs/041-turnstile-early-preload`, `specs/088-live-performance-readiness`, plus the Memory Bank entries that reference them. No earlier **sitewide SEO audit** document, ranking report, traffic report or keyword report exists anywhere in this repository or workspace (searched `specs/`, `memory-bank/` and repository root). The documentation library's SEO snapshot and its manifest group mapping were previously removed (`memory-bank/progress.md`), so no library SEO reference is available either.

**Improved and verified still in place**

- **Secure JSON-LD (specs/055)** — the escaping helper is live and the FAQ schema still matches the visible FAQ question-for-question. *Verified by live HTML + source comparison.*
- **Hero duplicate-download fix (specs/088)** — the live document emits exactly one AVIF preload (no WebP preload) and the `<picture>` sources are AVIF → WebP. The 293 KB duplicate identified in that spec is gone. *Verified by parsing the live head.*
- **Turnstile early preload (specs/041)** — present at `fetchpriority="low"`, homepage-scoped. *Verified in the live head.*
- **Font self-hosting / render-path work (specs/homepage-perf)** — fonts are served from `/_next/static/media/*.woff2` with preloads; no external Google Fonts stylesheet is requested. *Verified in the live head.*
- **Homepage SEO section (specs/034)** — the "About Lucky Pick Canada" section is present in the server-rendered homepage with an H2 and three paragraphs. Its *visual* readability was not re-assessed (no browser review in this audit).

**Outstanding from earlier work**

- **Mobile PageSpeed target (specs/perf-fixes: "currently ~78/100 → target 85+")** cannot be confirmed: no measured score is retained in the repository and PageSpeed Insights is unavailable today (HTTP 429). Status: **unverified**, not "still failing".
- **Large images outside the homepage** were never in scope of the earlier performance specs and remain the largest byte cost on four routes (F-H2).
- **FAQ schema value** was a reasonable target in 2023-era guidance; the rich-result eligibility has since narrowed, which is a change in the search landscape, not a regression in this repository.

**Newly discovered in this audit** (not covered by any earlier record): the duplicate map URLs and their inherited homepage title; the share-image size/ratio mismatch; the static-asset revalidation headers; missing intrinsic image dimensions; thin content on the three feature pages; the dual robots.txt source; the 404 canonical; the X link 404.

---

## 7. Recommended Improvements

| # | Improvement | Findings | Effort | Expected benefit (no ranking promise) |
| --- | --- | --- | --- | --- |
| 1 | Redirect (or remove) the two duplicate map URLs; give the survivor one title | F-H1 | Low | One URL per page; removes duplicate titles; consolidates signals |
| 2 | Replace the share image with a ≤250 KB 1200×630 JPEG/WebP and match declared dimensions | F-H3 | Low | Reliable, correctly cropped link previews |
| 3 | Add AVIF/WebP variants and dimensions to the four oversized tool images | F-H2, F-M6 | Moderate | Much lighter first view on four routes; lower CLS risk |
| 4 | Write 150–300 words + 2–3 H2s for `/lucky-meter`, `/crystal-ball`, `/reveal` | F-M1, F-M9 | Moderate | Topical relevance and more entry points; contextual linking |
| 5 | Rewrite titles to 50–60 characters with one brand form and clear intent | F-M2 | Low | Better relevance and snippet click-through |
| 6 | Add Organization/Person + BreadcrumbList JSON-LD with `sameAs` | F-M3 | Low–Moderate | Entity understanding; possible breadcrumb display |
| 7 | Fix immutable caching for `/_next/static/*` and artwork | F-M4 | Low–Moderate | Faster repeat visits, fewer requests |
| 8 | Reduce render-blocking CSS and review the polyfill chunk | F-M5 | Moderate | Faster first render (must be measured) |
| 9 | Consolidate robots sources; drop the duplicate group | F-M7 | Low | Prevents a future crawl-policy mistake |
| 10 | Descriptive asset names, correct decorative alt text, confirm/repair the X link | F-M8, F-M10 | Low | Image/accessibility hygiene; removes a dead link |
| 11 | Low-priority clean-ups (F-L1…F-L10) | F-L* | Low | Housekeeping; each optional |

Explicitly **not** recommended: keyword stuffing, artificial link building, doorway or location-spam pages, hidden text, or any scheme promising rankings. The site's entertainment-only, non-gambling positioning is an asset and should stay intact.

---

## 8. Unverified Items

None of the following was available to this audit. Nothing in this report should be read as a claim about them.

| Item | Why unavailable | What it would change |
| --- | --- | --- |
| Indexing coverage, sitemap status, crawl errors, manual actions | No Google Search Console access | Whether the duplicate URLs are actually indexed and how often they are crawled |
| Search queries, impressions, CTR, average position | No Search Console / no rank-tracking tool | Which titles to prioritise; whether the thin pages already receive impressions |
| Traffic, engagement, conversion, alias-URL usage | No Analytics access | Whether the aliases can be removed safely |
| Core Web Vitals (LCP, INP, CLS) field data | CrUX API requires a key; none available | Whether the measured byte weight actually harms real-user vitals |
| Lighthouse / PageSpeed lab score | PSI API returned HTTP 429 (anonymous daily quota exhausted); installing Lighthouse is prohibited by the task | Quantified performance scoring and specific audit passes |
| Cloudflare cache rules, bot-fight, WAF behaviour | No Cloudflare dashboard access | Root cause of the `max-age=0` asset headers (F-M4) |
| Actual mobile rendering and interaction | No browser-based visual review was run (audit-only scope, no UI change) | Whether the thin pages feel thin to users, and whether missing dimensions cause visible shift |
| Rich-results eligibility / structured-data validation in Google's tools | No Rich Results Test access | Whether any current or proposed markup produces warnings |
| Backlink profile, domain authority, competitor visibility | No backlink or competitor tooling | Off-page opportunity sizing |
| X (Twitter) account existence | X answers automated clients differently from browsers | Whether F-M10 is a real broken link |
| HTTP/2, CDN edge latency by region | Only single-region sampled timings | Whether TTFB varies for Canadian users |

**Data sources actually used**: live HTTP requests (`curl`) to the production site; server-rendered HTML parsed with Node; image metadata measured with the repository's installed `sharp`; byte counts of the initial JS/CSS/font set; repository source files (`app/**`, `next.config.mjs`, `wrangler.jsonc`, `public/robots.txt`); GitHub branch/PR inventory; prior Spec Kit records listed in §6.

---

## 9. Recommended Implementation Order

1. **Metadata and duplication (low effort, immediate clarity)** — F-H1 duplicate map URLs, F-H3 share image, F-M2 titles. These are small, isolated, reversible, and remove the most visible inconsistencies.
2. **Image payload on the four tool routes** — F-H2 with F-M6 dimensions. Highest measurable byte win per unit of effort, and the homepage already demonstrates the pattern.
3. **Structured data and entity signals** — F-M3 after F-M10 is confirmed, so `sameAs` does not point at a dead profile.
4. **Content depth and internal linking** — F-M1 + F-M9, delivered together because the copy provides the link opportunities. Requires owner approval for protected copy/layout.
5. **Performance work with measurement** — F-M5 (CSS/JS) and F-M4 (caching) last, each with a before/after lab or byte comparison, because these carry the highest regression risk to a protected visual surface.
6. **Hygiene pass** — F-M7, F-M8, F-L1…F-L10, batched into one small review.

Each step should be its own scoped task with owner approval; none is authorized by this audit.

---

## 10. Top Recommendations

1. **Resolve the three map URLs into one** (F-H1). Lowest effort, clearest crawl-hygiene gain, and it also fixes two duplicate titles and two contradictory `og:url` values.
2. **Replace the 1.26 MB share image with a correct 1200×630 file under 250 KB** (F-H3). One file, sitewide effect on every share preview.
3. **Compress the four tool-page images to AVIF/WebP with dimensions** (F-H2, F-M6). The single biggest measurable page-weight win on the site.
4. **Deepen `/lucky-meter`, `/crystal-ball` and `/reveal`** (F-M1, F-M9). These are the site's product; today they are its thinnest pages.
5. **Add Organization/Person and BreadcrumbList structured data** (F-M3). Cheap, durable entity clarity that compounds with any future content.

---

## Spec Kit stages and artifacts

Executed in order, per `AGENTS.md` §2 and the `.freebuff/cmds/speckit.*.md` definitions, with no extension hooks registered (`.specify/extensions.yml` does not exist):

1. **Specify** → `specs/106-seo-audit/spec.md`, `specs/106-seo-audit/checklists/requirements.md`
2. **Plan** → `specs/106-seo-audit/plan.md` (Phase 0 research recorded as not needed; no `data-model.md`, `contracts/` or `quickstart.md`, which are inapplicable to a documentation-only audit)
3. **Tasks** → `specs/106-seo-audit/tasks.md`
4. **Implement** → this report, the Memory Bank record, and `.specify/feature.json`; no website implementation

**Routed references that materially informed the work**: `AGENTS.md`; `.freebuff/deep-dive.md`; `.freebuff/seo.md`; `memory-bank/projectBrief.md`; `memory-bank/activeContext.md`; `.specify/memory/constitution.md`; `specs/034-homepage-seo-section-background`; `specs/055-secure-jsonld`; `specs/041-turnstile-early-preload`; `specs/088-live-performance-readiness`; `specs/homepage-perf` and `specs/perf-fixes`.

---

## Verification

| Check | Command | Result |
| --- | --- | --- |
| Live crawl of all discovered URLs, statuses and sizes | `curl -sS -L -o … -w "%{http_code} %{url_effective} %{size_download}"` over 16 paths | **PASS** — 10 public URLs 200, 4 probes 404, 2 redirects 308 |
| Page metadata/heading/image/link extraction | `node extract2.cjs` over the saved HTML | **PASS** — 12 page records written |
| Image dimensions and bytes | `node -e` with the repository's `sharp` over 13 downloaded assets | **PASS** |
| Initial resource weight | `node weight.cjs` over 9 JS + 5 CSS + 4 font URLs | **PASS** |
| Internal link resolution | `node -e` fetch of every distinct internal href | **PASS** — all 200, zero broken |
| External social links | `curl -L` on 5 profile URLs | **PASS as recorded** — 4 × 200, 1 × 404 (F-M10, needs manual confirmation) |
| PageSpeed Insights field/lab data | `curl https://www.googleapis.com/pagespeedonline/v5/runPagespeed…` | **BLOCKED** — HTTP 429, anonymous daily quota exhausted |
| CrUX field data | `curl https://chromeuxreport.googleapis.com/v1/records:queryRecord` | **BLOCKED** — API key required |
| Repository gate | `./freebuff-verify.sh` | **PASS** — exit 0; Spec Kit governance tests and gate, `tsc --noEmit`, production build (`next build --webpack`) and the 36 refresh-docs tests all completed with "All verification steps passed" |
| Production build size vs 495 MB | `du -sb .next public` after each gate build | **PASS** — final gate build: `.next` 317,720,442 B + `public` 32,840,043 B = **350,560,485 B (334.32 MiB)**; the earlier gate build in the same session measured 333,142,190 B (317.71 MiB). Both are below the 495 MB maximum |
| Final diff audit | `git status --short`, `git diff --stat`, full diff read | **PASS** — four documentation paths only: `PR_SUMMARY.md`, `.specify/feature.json`, `memory-bank/activeContext.md`, `memory-bank/progress.md`, plus the new `specs/106-seo-audit/` tree. No `app/`, `public/`, `themes/`, `components/`, `next.config.mjs`, `wrangler.jsonc`, `.github/`, dependency or `.docs/` path |
| PR-head CI | GitHub checks on the pushed branch | **PENDING** — not yet reported by GitHub at the time this body was written |

*PR-head CI is the only outstanding row. It is reported as PENDING and is not presented as passed.*

**Behaviour preserved**: no `app/`, `public/`, `themes/`, `components/`, `next.config.mjs`, `wrangler.jsonc`, `.github/`, `package.json`, `pnpm-lock.yaml` or `.docs/` change. The live site was not deployed to, configured, or modified.

**USEFUL RESULT: YES** — the requested audit and its report are complete and verified: every finding is traceable to an executed live request, a parsed page artifact, a measured asset, or a repository file; unavailable data (Search Console, Analytics, CrUX, PageSpeed Insights) is declared rather than inferred; the repository gate passed; the production build is 317.71 MiB, below the 495 MB maximum; and the final diff contains documentation only.

**Implementation status**: COMPLETE (audit documentation). **PR-head CI**: PENDING.
