# Lucky Pick Canada — Visual, Usability, Functionality and Brand-Positioning Audit

**Audited**: 2026-11-08, production site `https://luckypickcanada.ca`
**Browser**: Browserless (required default hosted browser). Playwright was not used.
**Task groups**: `deep-dive` (evidence-only investigation, explicit limitations) and `polishing` (visual consistency, readability, responsive presentation).
**Scope**: audit and recommendations only. No website code, copy, artwork or configuration was changed.

Raw evidence for every number below is in `artifacts/ui-audit-20261108/measurements.json`.

---

## 1. What was actually inspected

| Route | Status | Desktop load (networkidle2) | Document height (desktop / mobile) | Notes |
| --- | --- | --- | --- | --- |
| `/` | 200 | 5 445 ms | 8 448 / 7 894 px | Home: hero, Play & Explore, Lucky Pick, Tip Jar, community, FAQ, Suggestion Box, About |
| `/about` | 200 | 1 298 ms | 3 437 / 4 955 px | Creator story, 6 H2 sections |
| `/lucky-meter` | 200 | 28 272 ms | 1 178 / not measured | Mobile pass did not reach network idle in 45 s |
| `/crystal-ball` | 200 | 1 070 ms | 1 511 / 1 313 px | Ask form + reading |
| `/reveal` | 200 | 1 651 ms | 1 404 / 1 061 px | Daily Lucky Card |
| `/map` | 200 | 1 539 ms | 4 064 / 4 267 px | Province markers, stories, stats |
| `/privacy` | 200 | 1 319 ms | — / — | Not in sitemap; `noindex` by design |
| `/terms` | 200 | 2 008 ms | — / — | Not in sitemap; `noindex` by design |
| `/widget/daily-meter` | 200 | — | — | Public embed page |
| `/reveal/00000000-0000-0000-0000-000000000000` | 200 | — | — | Unknown id still renders the page |
| `/stories` | 308 → `/map` | — | — | Correct |
| `/lucky-map-of-canada` | 308 → `/map` | — | — | Correct |
| `/where-luck-has-been-found-in-canada` | 308 → `/map` | — | — | Correct |
| `/does-not-exist-audit` | 404 | — | — | Real 404 |

Also exercised: FAQ accordion, Lucky Meter reveal, Daily Lucky Card reveal, Crystal Ball question, Tip Jar dialog, Suggestion Box contract, Lucky Map province filter, keyboard focus, `prefers-reduced-motion`, console/network capture, `/api/lucky-reveals-count`, `/api/lucky-stories`, and the five external profile links.

**Not reached / not exercised**: a paid reveal (`/reveal/<id>` purchase), any Stripe checkout completion, story reactions (`POST /api/lucky-stories/react`, would alter live community data), suggestion submission (would create live data), and the story-detail modal (see §6).

---

## 2. First impressions — the most important finding

**D1 (Critical, presentation/positioning). The first screen contains no visible brand name and no explanation of what the site is.**

Measured at 1440×900 on `/`:

- The only visible text in the first viewport is the four header links: "Lucky Meter", "Lucky Stories", "Consult the Crystal Ball", "Daily Card Reveal" (top offset 9 px, 14 px type).
- The page's only `H1` is "Lucky Pick Canada" with a rendered width of **1 px** — it is `sr-only` for assistive technology but invisible to sighted visitors.
- The first explanatory line, "Free to explore / Play & Explore / Discover a little magic, everyday.", begins at **y ≈ 843 px**; the section heading "Play & Explore" sits at **y ≈ 870 px**.
- The hero is therefore roughly 840 px of artwork with a navigation bar and a scroll prompt; nothing on the first screen states the brand, the offer, that it is free, or that it is entertainment rather than gambling.

At 390×844 the same pattern holds: the first screen shows the four header links (14 px high) and an "Explore your luck. Scroll down to the Play and Explore section." button (351 × 182 px); the first product copy is below the fold.

**Why it matters**: a first-time visitor is asked to scroll before being told what they are looking at. The strongest existing sentence — "Discover a little magic, everyday." — is one scroll away from where it is needed.

**Recommendation (improvement, not a defect claim)**: add a visible brand line plus one plain sentence above the fold, e.g. the brand name, "Free, playful reminders that luck is about hope and possibility", and a primary action into a free experience. Keep the artwork; add the words.

---

## 3. Verified defects

Each item below is an observed behaviour or measurement, not a preference.

### D2 (Important — sitewide, functional). The Cloudflare analytics beacon is blocked by the site's own CSP.

- Console error on all eight pages: `Loading the script 'https://static.cloudflareinsights.com/beacon.min.js/…' violates the following Content Security …`
- Matching network failure: `REQFAIL https://static.cloudflareinsights.com/beacon.min.js/… csp`.
- `next.config.mjs` `script-src` allows `'self'`, `'unsafe-inline'`, `https://challenges.cloudflare.com` and `https://www.googletagmanager.com` — `static.cloudflareinsights.com` is absent.
- **Impact**: Web Analytics/visitor measurement never runs, so engagement decisions are made blind. Visitor-facing behaviour is unaffected.
- **Fix**: add `https://static.cloudflareinsights.com` to `script-src` (or remove the beacon if analytics is not wanted). Needs the hosting/CSP approval in `AGENTS.md` §5 before implementation.

### D3 (Important — accessibility). Phone tap targets are far below the 24×24 CSS-px minimum.

Measured at 390×844:

| Control group | Measured hit box | Occurrences |
| --- | --- | --- |
| Lucky Map province markers | **23 × 23 px** | 12 markers on `/map` |
| Footer navigation links | 30–62 × 15 px | every page |
| Footer social links | 29–100 × 13 px | every page |
| Homepage header links | 63–121 × 14 px | `/` |

WCAG 2.2 SC 2.5.8 requires 24×24 CSS px (or equivalent spacing); 44×44 is the widely recommended touch size. Every footer link and every province marker fails the 24 px floor on the primary mobile device width.

### D4 (Important — readability). Body and caption type is very small on phones.

Measured minimum / median body font sizes at 390×844:

| Page | Minimum | Median |
| --- | --- | --- |
| `/reveal` | 10 px | **11.25 px** |
| `/crystal-ball` | 10 px | **11.7 px** |
| `/` | 9.6 px | 14.7 px |
| `/map` | 10 px | 15 px |
| `/about` | 10 px | 16.9 px |

Kickers and captions across the site render at 11.2 px on desktop ("Free to explore", "DAILY RESONANCE RITUAL", "COMMUNITY") and 11.52 px on `/map` ("Total lucky stories shared"). Under 12 px is below common legibility guidance for extended reading, and `/reveal` and `/crystal-ball` are dominated by it.

### D5 (Important — structural accessibility). Landmark and heading-order errors.

- `/crystal-ball` renders **two `<main>` landmarks** (`main: 2`). A document must have one main landmark.
- `/lucky-meter` heading order is **`2,1,2`** — an `H2` ("Daily Resonance Ritual") precedes the page `H1` ("AWAKEN TODAY'S RESONANCE").
- No page provides a skip link (`a[href="#main"]`, `#content`, `.skip-link` all absent), so keyboard users must traverse the header and hero before reaching content.
- Multiple `<nav>` landmarks per page (4 on `/`, 4 on `/map`, 3 on `/about`); whether each carries a distinct accessible name was not captured, so landmark uniqueness is unconfirmed.

### D6 (Important — navigation consistency). The same destinations carry different names.

| Destination | Header label | Footer label |
| --- | --- | --- |
| `/map` | "Lucky Stories" | "Lucky Map" |
| `/crystal-ball` | "Consult the Crystal Ball" | "Crystal Ball" |
| `/reveal` | "Daily Card Reveal" | "Daily Reveal" |
| `/lucky-meter` | "Lucky Meter" | "Lucky Meter" on `/`, but "Luck Meter" on `/crystal-ball` and `/map` |

Two labels for one place is a wayfinding defect, not a style choice: the header omits "About" and "Home" entirely, so those pages are only discoverable in the footer, under yet another naming scheme.

### D7 (Important — data consistency). `/map` shows "1 lucky story" while its own statistics report 8.

- Default render: `H2` = **"1 lucky story"**; the same page's stat tiles read "Total lucky stories shared (All-time) **8**", "Provinces with lucky moments (All-time) **6**", "Mapped story markers **8**"; the API `/api/lucky-stories` returns multiple stories.
- After activating "Nova Scotia: 3 lucky stories", the `H2` changes to **"3 lucky stories"** and `aria-pressed="true"` is set on that marker.
- So the filter itself works, but the default headline count contradicts the page's totals. Either the default is showing a filter that is not visibly selected, or the count is stale. This needs an owner decision; the audit does not change it.

### D8 (Minor — accessibility polish). Focus indication is inconsistent.

Sampled focus states on `/map`: footer links and the gold CTA show `outline-style: none`; the "Back to Home Page" link also shows `outline: none`. Other links showed `outline: solid 3px`. Keyboard users therefore get a visible ring on some controls and none on others.

### D9 (Minor — content/identity). Terms still describes a "random number generation" service and "advanced cryptographic algorithms for true randomness".

`/terms`, "Use of Platform": *"Our platform is a digital random number generation…"*; "Disclaimer": *"While we use advanced cryptographic algorithms for true randomness…"*. This is technically framed, defensible-but-unverifiable marketing language that pulls the identity toward a numbers product rather than the stated "hope, optimism, possibility" identity. It is a copy judgement, not a defect; changing it needs owner approval.

### D10 (Minor — visual consistency). Call-to-action iconography and casing are inconsistent.

Observed control names: `❤️Open the tip jar`, `🎁Choose a Lucky Pick`, `💡Share Your Idea →`, `🔮Seek Fortune`, `✨Reveal My Resonance`, `♠Reveal Today's Luck`, `🍀 View Lucky Stories`, `✍️Share your lucky story`. Emoji are glued to the label text with no space, and each experience uses a different metaphor. Section headings also mix casing: "LUCKY METER" (all caps) beside "Today's Lucky Card" and "Crystal Ball" (title case) on the same row on `/`.

---

## 4. Interaction results

| Experience | Result | Evidence |
| --- | --- | --- |
| FAQ accordion | **Works** | `aria-expanded` false → true, `aria-controls="faq-answer-0"`, panel 133 px / 313 characters, not clipped, exactly 1 item open |
| Lucky Meter | **Works** | Reading rendered: "COSMIC LIGHTNING RESONANCE **37%**", quote "A fresh breeze from the Pacific brings clarity and new opportunities.", "TOTAL RESONANCE RITUALS: 109", "NEXT RESONANCE IN 22:16:04", "Share My Resonance"; 2 canvases animate |
| Daily Lucky Card | **Works** | "◆ PREMIUM TIER **Coast-to-Coast Tale**", "SERIES 1 · ADDED TO YOUR COLLECTION", quote "Good fortune grows where hope is planted.", share control |
| Crystal Ball | **Works, two observations** | Submit disabled until a question is typed; after submit a reading rendered ("The Northern Lights whisper that today brings unexpected luck and double-doubles.") plus a "Session Readings" list. The same reading string appears twice in the rendered text. The allowance label still read "3 of 3 questions remaining today" 16 s after the reading — **single sample, reproduction not completed** (runner restart), so not asserted as a defect. |
| Tip Jar dialog | **Works** | `role="dialog"` opens with "Leave a tip", "Suggested CAD $5.00", tip-amount field, "🔒Continue to secure checkout", "Close checkout options"; `Escape` restores `dialogs: 0` |
| Suggestion Box | **Contract verified, submission blocked** | Fields: name, email, message textarea (`minLength 10`, `maxLength 1000`, `required`), honeypot `website`, hidden `cf-turnstile-response`; submit button disabled until the security check completes. In Browserless the challenge failed (`401` from `challenges.cloudflare.com`, `ERR_NAME_NOT_RESOLVED` for `brunhild.challenges.cloudflare.com`), so no end-to-end submission was performed — **environment restriction, not a site defect** |
| Lucky Map filter | **Works** | Clicking a province sets `aria-pressed="true"` and updates the count H2 ("1 lucky story" → "3 lucky stories") |
| Story detail modal | **Not verified** | Story cards are `<button tabindex="0">` and a "View full lucky story" control exists, but automated activation did not produce a `role="dialog"` in two attempts. Reported as unverified, not as broken |
| Reduced motion | **Honoured** | With `prefers-reduced-motion: reduce`, the three running animations collapse to `1e-06s` duration |
| Keyboard focus | **Partial** | `outline: solid 3px` on some links, `outline: none` on others (D8) |

No production content was created: no story, reaction, suggestion, tip or payment was submitted. The one Crystal Ball question is the only server-side write-adjacent action, and it consumed no allowance according to the displayed counter.

---

## 5. Mobile presentation

**No horizontal scrolling anywhere** — `documentElement.scrollWidth` equalled 390 px on every measured page. That is the single most common responsive failure and it is absent.

Issues that remain on phones:

- **Overflow outside the viewport without page scroll**: the decorative `.homepage-sky-backdrop` extends to 393 px and `.gold-shimmer` layers reach 407–627 px on the homepage. They are clipped by an ancestor, so the page does not scroll sideways, but they are unconstrained layers that only avoid a bug by accident.
- **Tiny type** (D4) and **tiny targets** (D3).
- **Long pages**: the homepage is 7 894 px on mobile with 3 185 words of page text; a visitor scrolls past the free experiences, a paid offer, a tip jar, a Facebook prompt, ten FAQ items, a suggestion form and the creator story in one column.
- **`/lucky-meter` did not reach network idle within 45 s** in mobile emulation while its DOM was complete in ~1.3 s; desktop reached idle at 28.3 s. This looks like long-lived background requests rather than slow first paint. Not claimed as a user-facing performance defect.
- The homepage header is 844 px tall at 390 px width: it contains the hero, not just a navigation bar. No hamburger menu was found; the four links simply sit at the top, which is acceptable at this link count but leaves 14 px-high targets.

---

## 6. Functional, link and loading observations

- All internal links resolved; the three aliases redirect permanently (308) to `/map`; unknown paths return a genuine 404.
- `/reveal/<zero-uuid>` returns 200 rather than a not-found state — the page renders the daily reveal regardless, which is internally consistent with a public daily card but worth confirming.
- `/api/lucky-reveals-count` returns `{"total":0}` and the homepage renders **"LUCKY REVEALS CREATED TO DATE 0"**. The counter works; its value is zero. As social proof it currently argues against the experience (see §8).
- `/api/lucky-stories` returns stories (200).
- External profiles: Instagram 200, TikTok 200, **X (`https://x.com/luckypickcanada`) 404**, Facebook returned 400/login for a bot user agent — inconclusive, needs a human check. The X result matches the earlier SEO audit.
- Static assets are served with `cache-control: public, max-age=0, must-revalidate` despite the one-year immutable rule in `next.config.mjs` (also recorded by the SEO audit). Measured on `/lucky-meter`: polyfills 112 594 B, one JS chunk 203 721 B, another 242 535 B, CSS 23 066 B.
- HTML for `/lucky-meter` is 23 957 B with 0.314 s TTFB; homepage HTML is 74 137 B with 0.437 s TTFB.

---

## 7. Screenshots and limitations

**Screenshots could not be retained.** Browserless captured renders, but the integration returned every image as a base64 string inside the tool response, and each response was truncated by the transport:

| Request | Result |
| --- | --- |
| Full page, JPEG q35 | Truncated |
| 900×560 clip, JPEG q35 | Truncated |
| 640×400 clip, JPEG q22 | Truncated |
| 480×300 clip, JPEG q12 | Returned inline only; lost when the runner restarted before it could be written to the repository |

No screenshot file is included, and no visual conclusion in this report depends on one. Every layout statement is a measured geometry, computed-style or rendered-text observation that a reviewer can reproduce with the same Browserless calls. To obtain images, the audit needs a browser integration that can write image bytes to disk (or a hosted screenshot URL), which this session does not provide.

Other limitations, stated rather than inferred:

- **Contrast was not measured.** Gradient-filled headings report a computed colour of `rgba(0,0,0,0)`, which defeats automated ratio maths; no contrast claim is made.
- **Story-detail modal** could not be opened (see §4).
- **Turnstile** could not complete in the hosted browser, so suggestion submission is unverified end-to-end.
- **Crystal Ball allowance** is a single observation (§4).
- **`/lucky-meter` mobile idle timeout** is recorded, not explained.
- **Real-device behaviour** was emulated at 390×844 with touch, not tested on hardware.
- **No analytics, Search Console or field performance data** was available, so traffic, engagement and Core Web Vitals are outside this audit.

---

## 8. Engagement and identity opportunities (judgements, not defects)

1. **Start with one human sentence.** Above the fold: brand, one line of what this is, and a free action. This single change addresses the largest comprehension gap (D1).
2. **Let the free experiences carry the first impression.** The Lucky Meter, Crystal Ball and Daily Card are free and immediately rewarding; the paid Lucky Pick (CAD $1.00 / $1.99) currently sits in the middle of the same page and is one of the hero's CTAs. Put free play first and frame the paid reveal as an optional gift, not the entry point.
3. **Seed or reframe the zero counter.** "0 Lucky Reveals created to date" is honest but discouraging. Either start gathering real activity or reframe it as an invitation ("Be the first to send a Lucky Reveal").
4. **Bring Lucky Stories closer to the top.** The most emotional, most shareable content (people describing second chances and small kindnesses) begins ~1 900 px down the desktop homepage.
5. **Explain the map's empty provinces.** Six provinces show stories, thirteen territories/provinces show 0; a short "stories are just beginning here" line would turn an empty state into an invitation.
6. **Rename premium-adjacent language.** "◆ PREMIUM TIER" on a free daily card, plus "collection" and "series", reads as a trading-card/gacha economy. "Rare card" or "special edition" keeps the delight without the purchase-shaped vocabulary.
7. **Keep what already works.** The explicit non-gambling statements (footer, FAQ "we are not a lottery operator or gambling service", About) are clear and warm; the About page's human story (solo project, Nova Scotia, built on a phone) is the most persuasive brand asset on the site; the Lucky Stories copy explicitly defines luck as "a second chance, or simply being lucky to be here". None of this should be replaced.

---

## 9. Prioritised recommendations

Priority reflects visitor impact and reversibility. None of these is authorised for implementation by this audit.

### Critical

| # | Recommendation | Findings | Why critical | Effort |
| --- | --- | --- | --- | --- |
| C1 | Add a visible brand line, a one-sentence explanation and a free primary action above the fold | D1 | A first-time visitor currently cannot tell what the site is without scrolling; everything else depends on this | Low–Moderate (copy + one hero element) |
| C2 | Repair the CSP so the analytics beacon loads (or remove it deliberately) | D2 | The site is currently measuring nothing; every future product decision is made without visitor data | Low |

### Important

| # | Recommendation | Findings | Why important | Effort |
| --- | --- | --- | --- | --- |
| I1 | Raise phone tap targets to at least 24×24 px (footer links, social links, map markers) | D3 | Accessibility failure on the primary mobile width; small, isolated CSS changes | Low–Moderate |
| I2 | Raise mobile body/caption type (target ≥14 px body, ≥12 px captions) | D4 | Readability on the dominant device; affects `/reveal` and `/crystal-ball` most | Moderate (type scale) |
| I3 | Fix the duplicate `<main>` on `/crystal-ball`, the `H2`-before-`H1` order on `/lucky-meter`, and add a skip link | D5 | Structural accessibility defects that affect every keyboard and screen-reader visitor | Low |
| I4 | Unify navigation labels and place Map/About consistently | D6 | Wayfinding; one destination should have one name | Low |
| I5 | Resolve the `/map` default count vs. totals contradiction | D7 | A visible data contradiction undermines trust in the whole map | Low–Moderate (needs owner intent) |
| I6 | Reframe or seed the zero reveal counter | §6, §8.3 | First-impression credibility and engagement | Low |

### Optional

| # | Recommendation | Findings | Why optional | Effort |
| --- | --- | --- | --- | --- |
| O1 | Consistent CTA iconography, spacing and heading casing | D10 | Polish; does not block any task | Low |
| O2 | Uniform focus rings on every interactive element | D8 | Accessibility polish beyond the sampled controls | Low |
| O3 | Rewrite Terms' "random number generation / cryptographic randomness" copy in the optimism-first voice | D9 | Copy judgement requiring owner approval | Low |
| O4 | Move the free experiences above the paid offer; give Lucky Stories more prominence | §8.2, §8.4 | Presentation/positioning improvement | Moderate |
| O5 | Add empty-state copy to the map's zero-story provinces | §8.5 | Engagement improvement | Low |
| O6 | Rename "premium tier"/"collection"/"series" toward "rare card"/"special edition" | §8.6 | Brand vocabulary refinement | Low |
| O7 | Investigate the long-lived background requests on `/lucky-meter` | §5 | No user-facing symptom was observed, so this is a measurement follow-up | Unknown |
| O8 | Confirm the X profile (404 to bots) and the Facebook links from a normal browser | §6 | Inconclusive bot-response behaviour | Low |

---

## 10. What the site gets right

- Clear, repeated, well-placed non-gambling statements that match the owner's stated identity.
- No gambling imagery, betting vocabulary or win-money promises anywhere in the rendered copy.
- Real, working interactive experiences: the meter, the card, the Crystal Ball, the map filter and the FAQ all respond correctly.
- Strong human writing on `/about` and in Lucky Stories, which carries exactly the "hope, optimism, possibility" message the brand asks for.
- No horizontal scroll at 390 px, one consistent dark/gold visual language, `lang="en-CA"`, a single responsive implementation.
- `prefers-reduced-motion` is respected, links carry visible focus rings in most places, and all images have an `alt` attribute (decorative ones correctly empty).
- Aliases redirect permanently, unknown paths 404 properly, and the sitemap and robots configuration are coherent.

**Overall judgement**: the experiences and the written identity are genuinely good; the failure is the first thirty seconds. With a visible promise above the fold and a free action in front of a newcomer, the site would communicate the identity it already lives by.
