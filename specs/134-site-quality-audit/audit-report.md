# LuckyPickCanada.ca — Independent Quality & Visitor Experience Audit

**Audit date:** 2026-11-10
**Scope:** `https://luckypickcanada.ca/` (production) and this repository
**Status:** Audit and recommendations only. No application code, artwork, audio, configuration, SEO setting or functionality was changed. Every recommendation requires owner approval before implementation.
**Evidence:** [evidence.md](./evidence.md) · Spec: [spec.md](./spec.md) · Plan: [plan.md](./plan.md) · Tasks: [tasks.md](./tasks.md)

---

## Executive summary

Lucky Pick Canada is a distinctive, thoughtfully built entertainment site with a coherent Canadian celestial identity, unusually careful accessibility basics, a well-structured SEO foundation, and an ambitious sound-design system. It does not read as a template. The strongest parts are the visual cohesion, the accessibility markup, the metadata/canonical discipline, and the reveal and Crystal Ball experiences.

The biggest opportunities are not cosmetic. Three measured issues affect almost every visitor:

1. **Production serves every static asset with `cache-control: public, max-age=0, must-revalidate`** — including CSS, images and audio — despite `next.config.mjs` intending a one-year immutable policy. Every return visit revalidates the entire site.
2. **Audio dominates two of the heaviest routes.** `/crystal-ball` is 988 KB, of which 902 KB (91%) is three preloaded WAV files; `/reveal` is 1,540 KB, of which 1,352 KB (88%) is preloaded audio, including two near-duplicate "final discharge" files.
3. **The homepage's real headline and call to action sit below the first screen.** The painted branding is beautiful, but at 1440×900 the `<h1>` starts at y=912 and is only 15.2 px; the Explore control starts at y=1,175. A first-time visitor sees artwork and navigation before any readable explanation of what the site does.

There is no sound control anywhere on the site, the 404 page inherits the homepage title, and structured data stops at `WebSite` + `FAQPage`. None of these are severe, but they are cheap to fix and each has a clear visitor or search benefit.

**Overall:** strong creative foundation and solid engineering discipline; the main gains now come from delivery discipline (caching, audio weight), first-screen clarity, and completing the SEO/a11y details — not from redesigning the experience.

### Area scorecard

| Area | Verdict | One-line summary |
|---|---|---|
| Visual design | **Strong, with hierarchy issues** | Cohesive, premium identity; very long page; branding-as-image pushes meaning below the fold. |
| Audio | **Ambitious, over-weight, no user control** | Rich, well-guarded cue system; 900 KB–1.35 MB preloads; no mute/volume; mixed loudness. |
| User experience & accessibility | **Good basics, first-screen friction** | Excellent semantic markup and mobile fit; value proposition and CTA arrive late; no persistent nav. |
| SEO | **Solid foundation, incomplete depth** | Unique metadata, canonicals, redirects, sitemap, FAQ schema; thin core pages, limited schema, generic 404. |
| Performance | **Fast first paint, expensive payload** | Edge-cached static pages and good CLS; caching defect, heavy audio, large sky background, 33 MB asset folder. |

---

## What is already working well

- **A real identity.** Gold, maple red and clover green on a photographic night sky; painted emblem and wordmark; consistent gold CTA language. It is memorable and unmistakably Canadian without using lottery branding.
- **Security and delivery hygiene are above average.** HSTS, a strict CSP, `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`, COOP, and `poweredByHeader: false`. Pages are prerendered and return `x-nextjs-cache: HIT`.
- **Accessibility fundamentals are genuinely good.** Measured on `/` and `/map`: 0 unnamed buttons, 0 unnamed links, 0 unlabelled inputs, 0 missing `alt` attributes, 0 heading-level skips, 0 interactive targets under 24 px, one `<h1>`, a skip link, a `<main>` landmark, `lang="en-CA"`, `aria-expanded` on all 14 FAQ items, and live regions for form status. `prefers-reduced-motion` is handled in CSS and in the Explore animation.
- **SEO basics are in place.** Unique titles/descriptions/canonicals per route, Open Graph and Twitter cards, `www` → apex 301, legacy map URLs 308 → `/map`, a valid 6-URL sitemap, a sitemap-referencing `robots.txt`, and `noindex, follow` on `/privacy` and `/terms`.
- **FAQ structured data cannot drift from the UI.** `app/page.js` and `FAQSection.js` both read `app/homepage/faq-content.js`; the rendered `FAQPage` JSON-LD matches the visible 14 questions.
- **Image delivery is deliberate.** The hero uses AVIF-first `<picture>` with a 669 w/1024 w `srcset`; only AVIF is preloaded (a documented fix to avoid double downloads); below-fold images are lazy.
- **The audio system is defensively engineered.** Playback failures are caught; applause is session-guarded so it cannot play twice or after closing; Crystal Ball energy fades out instead of cutting; the Explore cue is skipped for reduced-motion visitors.
- **Mobile layout does not overflow.** 390×844 scrollWidth equals viewport width on all six routes.
- **The build is far inside the cap.** 319.59 MiB measured against the 495 MiB hard limit.

---

## 1. Visual design

**What works:** the hero painting, gold ring, emblem and wordmark create a premium first impression; section cards use a consistent glass-and-gold surface; the star canvas and gold shimmer add motion without visual noise; the palette is coherent across `.gold-3d-btn`, headings and borders.

**Findings**

| # | Finding | Evidence |
|---|---|---|
| V1 | **The brand message is painted into one image.** The tagline, wordmark and "EXPLORE YOUR LUCK" line are pixels, not text. The accessible `<h1>` is a separate 15.2 px line. The artwork therefore cannot be selected, translated, resized as text, or indexed, and its meaning is only conveyed by the emblem's alt text. | `app/homepage/Hero.js`; rendered `h1` font-size 15.2 px at 1440 px |
| V2 | **The first screen is branding, not explanation.** At 1440×900 the `<h1>` begins at y=912 (below the viewport) and the Explore control at y=1,175; hero artwork is 1,044 px tall. On 390×844 the `<h1>` starts at y=502 and the control at y=701. | Rendered geometry, [evidence.md](./evidence.md) |
| V3 | **The homepage is very long.** 9,348 px on desktop and 8,445 px on mobile, with 10 sections and 12 `<h2>` headings. Each section competes for attention. | Rendered geometry |
| V4 | **Eight identical gold CTAs.** The same gradient pill is used 8 times at full visual weight, so the primary action (Play) does not stand out from Tip Jar, About, Story or Reveal actions. | Rendered count of `.gold-3d-btn` |
| V5 | **No persistent navigation or return-to-top** was detected across a 9,000 px page; navigation exists only at the top and in the footer. | DOM check for fixed/sticky header and top links returned false |
| V6 | **Decorative images are correctly decorative.** Five of seven homepage images have empty `alt`, which is appropriate; only the emblem is described. | Rendered image audit |
| V7 | **Image dimensions are not on the `<img>` elements.** Hero slices rely on CSS `aspect-ratio` on their containers, which currently prevents shift (CLS 0–0.01), but the intrinsic dimensions are absent. | `Hero.js`; rendered `width`/`height` = null |

**Assessment:** the visual direction should be preserved. The problem is sequencing and hierarchy, not taste. One first-screen readable sentence would do more for comprehension than any restyle.

---

## 2. Audio

**What works:** 35 same-origin cues cover clicking, the Explore celebration, the reveal sparkle, applause, an eight-stage reveal beam sequence, and Crystal Ball energy/reveal/leaf. Sounds are preloaded before the triggering gesture where timing matters, volumes are individually tuned low (0.065–0.55 in most places), failures never break an interaction, and the applause lifecycle is properly scoped.

**Findings**

| # | Finding | Evidence |
|---|---|---|
| A1 | **`/crystal-ball` downloads 902 KB of audio on arrival.** `crystal-ball-energy.wav` 676 KB, `crystal-ball-reveal.wav` 138 KB, `crystal-ball-leaf.wav` 88 KB — 91% of the page's 988 KB. | Resource timing |
| A2 | **`/reveal` downloads 1,352 KB of audio on arrival** across 16+ files, 88% of the route's 1,540 KB. Both `final_discharge.mp3` (228 KB) and `standard_final_discharge.mp3` (210 KB) are fetched, as are premium and standard versions of the same cue family. | Resource timing |
| A3 | **Six WAV files (1.4 MB) are uncompressed**, including a 494 KB applause file and a 692 KB energy loop. | `public/sounds` inventory |
| A4 | **No sound control exists.** No mute toggle, volume slider, or persisted preference was found; `localStorage` is never used for audio. Visitors who dislike sound must mute the whole device. This is also the practical WCAG 1.4.2 audio-control gap. | Repository search for mute/sound toggle/audio preference |
| A5 | **Loudness is inconsistent.** Configured volumes span 0.065 to 1.0 with no normalisation, so cues can feel uneven in a sequence. | `app/lib/audio.js`, `app/lucky-card-reveal.js`, components |
| A6 | **The homepage fetches the confetti cue on load** (43 KB) before any interaction, because `preloadConfettiPop()` runs on mount. | Resource timing (audio, 43 KB) |
| A7 | **The total sound library is 5.26 MB** (28 MP3 3.6 MB + 6 WAV 1.4 MB) inside a 33 MB `public/` folder. | Asset inventory |

**Assessment:** the sound design is a genuine differentiator and should be kept. It needs compression, duplication cleanup, deferred loading and a user control — not removal.

---

## 3. User experience & accessibility

**What works:** clear primary destinations (Luck Generator, Community Stories, Crystal Ball, Daily Reveal); a labelled footer with legal and social links; a skip link; a correctly labelled suggestion form with honeypot and Turnstile; a single-question-at-a-time FAQ; friendly, human copy on the About page; explicit entertainment-only disclaimers; and no horizontal overflow at 390 px.

**Findings**

| # | Finding | Evidence |
|---|---|---|
| U1 | **A first-time visitor is not told what the site is before scrolling.** The painted hero communicates mood; the readable explanation begins below the fold. | V2 geometry |
| U2 | **Core experience pages are thin for newcomers.** Rendered word counts: `/reveal` 98, `/lucky-meter` 115, `/crystal-ball` 120 — versus `/map` 934 and `/about` 685. Daily-reset rules and the entertainment disclaimer are only in the homepage FAQ. | Rendered word counts |
| U3 | **Jargon appears before explanation.** "6 Pick / 7 Pick", "Daily Resonance" and "Personal vs Gift Reveal" are used in cards before any plain-language definition. | Homepage copy |
| U4 | **Long-scroll navigation.** With no persistent nav or back-to-top on a 9,348 px page, moving between experiences means scrolling or using the footer. | V5 |
| U5 | **The 404 page inherits the homepage title and description.** The HTTP status is correctly 404, but the document title is `Lucky Pick Canada | Daily Lucky Picks, Cards & Stories`. | Live 404 fetch |
| U6 | **No audio preference is offered**, so the only escape from sound is the device mute. | A4 |
| U7 | **Forms and status feedback are solid.** 0 unlabelled inputs, `role="status"`/`role="alert"` notices, visible focus styles on CTAs and FAQ buttons, and no sub-24 px targets. | DOM audit |

**Assessment:** accessibility execution is better than most independent sites. The UX gap is orientation: what the site is, where to start, and how to stop sound.

---

## 4. SEO

**What works:** unique titles and descriptions per route, explicit canonicals, consistent `en-CA`, one `<h1>` per page, descriptive internal links, correct host and legacy redirects, a valid sitemap, a valid robots file, legal pages correctly excluded, and FAQ rich-result markup that matches visible content exactly.

**Findings**

| # | Finding | Evidence |
|---|---|---|
| S1 | **Structured data stops at `WebSite` + `FAQPage`.** There is no `Organization` (logo, social `sameAs`), no `BreadcrumbList`, no `CollectionPage`/`ItemList` for the community map, and no `WebApplication` description for the experiences. | JSON-LD inventory across routes |
| S2 | **Three of six sitemap routes carry ~100 words.** Search engines have little to rank for "daily luck reading", "digital lucky card" or "crystal ball fortune" beyond the homepage's three-paragraph SEO block. | Rendered word counts |
| S3 | **The hero's key phrases are images.** Indexable text does not include the painted tagline or "Lucky Pick Canada: Your Daily Lucky Moment". | V1 |
| S4 | **The 404 response is a soft duplicate of the homepage metadata.** | Live 404 fetch |
| S5 | **One social image serves every route.** All pages point at `/luckypickcanada-share-1200x630.jpg`; route-specific cards are an easy social CTR gain. | Metadata blocks |
| S6 | **Minor metadata hygiene.** `app/lucky-meter/layout.js` defines a title/description that `page.js` overrides, so it is dead configuration; the map title uses "LuckyPickCanada.ca" while every other route uses "Lucky Pick Canada"; the sitemap has no `lastmod`; the `keywords` meta tag is ignored by Google (harmless). | Source inspection |
| S7 | **No breadcrumb or contextual cross-links between experiences.** Navigation and footer cover the routes, but body copy rarely links sideways (e.g. map story → Luck Generator). | Rendered link inventory |

**Assessment:** technically clean, strategically shallow. The highest-value SEO work is content depth and entity/collection structured data, not more meta tags.

---

## 5. Performance

**What works:** static prerendering, Cloudflare edge caching (`x-nextjs-cache: HIT`), HTTP/3 (`alt-svc: h3`), AVIF/WebP responsive delivery, a single AVIF preload, lazy below-fold images, CLS 0–0.01, and FCP as low as 384 ms on `/reveal`. On mobile, `/` reaches FCP ~1.93 s and LCP ~2.04 s in this environment.

**Findings**

| # | Finding | Evidence |
|---|---|---|
| P1 | **Static assets are served with `max-age=0, must-revalidate`.** CSS, images and audio all return `cache-control: public, max-age=0, must-revalidate`, so repeat visits revalidate ~1 MB instead of using the intended immutable policy. `next.config.mjs` sets `public, max-age=31536000, immutable` for images and `s-maxage=3600` for pages, but those headers are not reaching static files. | Live response headers for AVIF, CSS and WAV |
| P2 | **Audio preloads dominate two routes.** 902 KB of 988 KB on `/crystal-ball`; 1,352 KB of 1,540 KB on `/reveal`. | A1, A2 |
| P3 | **The homepage sky is 418 KB on desktop / 175 KB on mobile** — the largest resource either way, and a fixed full-viewport photograph. Responsive delivery works, but the image is still heavy for a decorative backdrop. | Resource timing, `homepage.css:491`/`:772` |
| P4 | **Homepage weight is 1,071 KB desktop / 827 KB mobile over 44 requests.** Mobile composition: 199 KB hero AVIF, 175 KB sky, 181 KB JS, 137 KB fonts, 52 KB CSS, 43 KB premature audio. | Resource timing |
| P5 | **`/reveal` issues 56 desktop / 70 mobile requests** for a single card reveal. | Route profiling |
| P6 | **`public/` is 33 MB, with ~4.7 MB of top-level PNGs referenced nowhere**: `a_polished_high_detail_card_illustration_poster_i.png` 3.1 MB, `1785347037732.png` 1.3 MB, `IMG_20260728_220305_112042.png` 342 KB. This is deployment weight and maintainability debt, not page weight. | Reference search |
| P7 | **Other avoidable payload:** 43 KB confetti audio on load; four font families (137 KB preloaded); 199 KB hero AVIF that is painted as the first thing on screen. | Resource timing |
| P8 | **TTFB varied from 16 ms to 1,536 ms** across runs due to edge cache state; this is not a stable benchmark, but it shows cold misses are noticeable. | Route measurements |

**Assessment:** the app is fast to first paint but expensive to complete. Caching and audio compression are the two changes with the largest measurable effect.

---

## 6. Improvement suggestions and additions

These are proposals, not approved work.

**Audio experiences**
- A small, persistent sound control (on/off, remembered) in the header or footer, with `aria-pressed` and a visible state.
- Optional ambient night-sky bed on the map/stories page, off by default and user-initiated.
- Distinct, short cue for rare/high-tier cards so rarity is audible as well as visual.
- Normalise cue loudness (shared target, e.g. −16 LUFS for short UI sounds) so sequences feel intentional.
- Mobile haptics (`navigator.vibrate`) as a non-audio counterpart to the reveal snap, respecting reduced-motion and mute.

**Visual and interaction**
- One readable sentence and the primary Explore action inside the first screen, without replacing the artwork.
- A sticky compact navigation bar after the hero, plus a return-to-top affordance.
- Deliberate CTA hierarchy: one primary style, one secondary style, one tertiary link style instead of eight equal gold pills.
- Optional subtle parallax on the sky for capable devices, with a static fallback under reduced motion.

**Features**
- A "today's luck" summary widget that combines card, generator and fortune into one returning-visitor view.
- Shareable result cards per experience (a share component already exists for lucky picks) — extend to the Crystal Ball fortune.
- Collection progress ("X of Y cards discovered") on the reveal page, building on the existing card collection.
- A short "How daily luck works" explainer page or section that consolidates all reset rules in one place.

**SEO content**
- Individual permalinks for community stories, if the product wants long-tail discovery; this is a routing/data decision, not a copy change.
- Province/territory summary pages only if each has genuinely unique content; thin location pages would be harmful.

---

## 7. Prioritized recommendations

Priority reflects visitor impact × confidence ÷ effort. Tier **P1** = fix first; **P2** = high value, schedule next; **P3** = worthwhile polish or experiments.

### P1 — High impact

| ID | Recommendation | Why it matters | Expected impact | Recommended approach |
|---|---|---|---|---|
| **R1** | **Fix static-asset caching** so CSS, JS, images and audio are immutable for a year (with hashed filenames where needed). | Every repeat visit currently revalidates the whole site; this is the single broadest performance defect. | Large improvement in repeat-view LCP/TTFB and bandwidth; near-zero risk if filenames are hashed or content-stable. | Add a Cloudflare Pages `_headers` file (or a Cache Rule) for `/_next/static/*`, `/assets/*`, `/sounds/*` and image extensions; keep HTML short-lived. Verify with `curl -I` that `cache-control` matches intent. |
| **R2** | **Compress, deduplicate and defer audio.** | 91% of `/crystal-ball` and 88% of `/reveal` is audio downloaded before the visitor acts. | Roughly 800 KB–1.2 MB saved on those routes; faster LCP/TTI, less mobile data. | Re-encode WAV/MP3 to AAC/Opus mono at 96–128 kbps; collapse standard/premium duplicates into one family with per-tier variation; load on first interaction or on explicit intent; keep preloading only the first cue a gesture needs. |
| **R3** | **Add a visible sound on/off control with a persisted preference.** | Visitors currently cannot stop sound without muting the device; this is also the practical WCAG audio-control requirement. | Better comfort and accessibility; lower immediate bounce for sound-sensitive visitors. | Single toggle in header/footer, reads/writes `localStorage`, `aria-pressed`, updates Howler global mute, and is respected by every cue. |
| **R4** | **Restore first-screen clarity.** Put one readable line of value copy and the primary Explore action within the first viewport while keeping the artwork. | At 1440×900 the H1 starts at y=912 and the CTA at y=1,175; visitors must scroll to learn what the site does. | Faster comprehension and higher activation of the primary experience; indexable brand copy. | Preferred: real-text tagline over the painted tagline area or immediately beneath the emblem, with the Explore line moved up. Alternative: shorten the artwork windows on desktop. This is an approved-visual change and needs owner sign-off. |
| **R5** | **Give the 404 page its own metadata.** | It currently presents the homepage title, which weakens the signal and confuses users who land there. | Cleaner indexing and a clearer dead-end experience. | Add `app/not-found.js` (or metadata) with a specific title, description and `noindex`. |

### P2 — High value

| ID | Recommendation | Why it matters | Expected impact | Recommended approach |
|---|---|---|---|---|
| **R6** | **Expand structured data.** Add `Organization` (logo, social `sameAs`), `BreadcrumbList`, and `CollectionPage`/`ItemList` for the stories map. | Search engines currently learn little beyond "this is a website with a FAQ". | Stronger entity recognition and eligibility for additional rich results. | Extend `app/components/JsonLd` usage; validate with the Rich Results Test; do not add `Product`/`Review` markup to entertainment content. |
| **R7** | **Route-specific social images.** | One generic 1200×630 image serves every page. | Better social click-through for `/map`, `/crystal-ball` and `/reveal`. | Generate 1200×630 cards from existing artwork and set per-route `openGraph.images`. |
| **R8** | **Deepen the thin experience pages** with genuinely useful copy (150–300 words each): what it does, the daily reset, what it is not, and a link to related experiences. | 98–120 words gives search little to rank and newcomers little to read. | Better search relevance and first-time understanding. | Add a short intro and a compact "How it works" block to `/lucky-meter`, `/crystal-ball` and `/reveal`; keep the entertainment-only positioning. |
| **R9** | **Defer the confetti cue until intent.** | 43 KB of audio downloads on page load before any interaction. | Small but free saving on the most-visited page. | Preload on `pointerenter`/`focus` of the Explore control, or during idle after first paint; keep the already-loaded fast path. |
| **R10** | **Normalise audio loudness and volume scale.** | Cue volumes range 0.065–1.0, so sequences can feel uneven. | More professional, less jarring sound design. | Measure each file, apply a shared loudness target, then use a consistent 0–1 scale for variation only. |
| **R11** | **Clean the asset folder and set a budget.** | 33 MB deployed, ~4.7 MB unreferenced PNGs, several 300 KB+ card PNGs. | Faster deploys and clearer asset discipline; protects the 495 MiB cap. | Remove unreferenced files after confirming no external references; convert remaining card art to AVIF/WebP with PNG fallback; add a size check. |
| **R12** | **Introduce CTA and section hierarchy on the homepage.** | Eight equal gold buttons flatten priority; the page is 9,348 px. | Clearer path to the primary experience; less scroll fatigue. | One primary style per view, secondary outline style for support actions, and consider collapsing the Tip Jar/About teaser. Visual change: owner approval required. |
| **R13** | **Add `lastmod` to the sitemap** and remove the dead `/lucky-meter` layout metadata. | Minor crawl/maintenance hygiene. | Slightly better crawl prioritisation; one less conflicting metadata source. | Emit `lastModified` from content dates; delete or consolidate the unused layout metadata. |

### P3 — Worthwhile polish

| ID | Recommendation | Why it matters | Expected impact | Recommended approach |
|---|---|---|---|---|
| **R14** | **Evaluate individual story permalinks.** | All community stories live on one `/map` page, limiting long-tail discovery. | Potential new search entry points if stories are substantial. | Product/data decision; requires route and database work, so treat as a separate approved project. |
| **R15** | **Unify brand naming and metadata strings.** | "LuckyPickCanada.ca" and "Lucky Pick Canada" are mixed across titles. | Small consistency and trust gain. | Standardise on "Lucky Pick Canada" with the domain only in copy where needed. |
| **R16** | **Add an optional ambient layer and a Luck Generator result cue.** | Extends the strongest differentiator without forcing sound. | Deeper immersion for visitors who opt in. | Off by default, tied to the new sound preference, lazy-loaded only on first use. |
| **R17** | **Run automated accessibility checks in CI.** `axe-core` and `@axe-core/react` are already installed. | Prevents regressions in the currently strong accessibility baseline. | Durable protection for keyboard, labelling and contrast behaviour. | Add a Playwright/axe smoke check for `/`, `/map` and `/reveal` in the existing test setup. |
| **R18** | **Consider a web app manifest and a lightweight offline daily card.** | Daily-return behaviour is core to the product. | Better home-screen presence and return visits. | Only if the owner wants installability; keep it out of the critical path. |

---

## 8. Recommendations to preserve

- The painted hero artwork, gold/clover palette and celestial background.
- The entertainment-only, non-lottery positioning and its current copy.
- The existing validation, Turnstile protection, rate limits and sanitisation.
- The session-guarded audio lifecycle and reduced-motion behaviour.
- The current canonical/redirect structure and the 14-question FAQ source of truth.

## 9. Limitations and unverified items

- Audio was assessed from files, configuration, call sites and measured downloads. **No subjective listening test was performed**, so tone, mix quality and perceived timing are not judged.
- Performance figures are two emulated runs from one location, not Lighthouse lab data or CrUX field data. TTFB varied with edge cache state and should not be treated as a stable benchmark.
- Mobile layout was measured (no overflow, LCP, page height) but **mobile screenshots could not be saved or displayed**: the Playwright CLI capture exited 1, and Browserless image payloads were too large to render here. The desktop hero screenshot was reviewed.
- Colour contrast was not measured with a contrast analyser, and no axe run was performed, so this is **not** a WCAG conformance audit.
- Authenticated admin, completed Stripe checkout, gift-email delivery and database behaviour were not exercised.
- Firecrawl returned an invalid-token error; Crawlbase was used as the governed fallback.
- The 495 MiB build limit was verified at 319.59 MiB, but no Cloudflare deployment was performed.

## 10. Approval and next step

Nothing in this report has been implemented. R1–R3 are low-risk and self-contained; R4 and R12 change approved visual behaviour and need explicit owner approval; R14/R18 are product decisions. Recommended first increment: **R1 caching + R2 audio + R3 sound control**, verified with before/after transfer measurements on `/`, `/crystal-ball` and `/reveal`.
