# Implementation Plan: First-screen clarity, approved naming, analytics CSP and mobile tap-target verification

**Feature**: `specs/115-first-screen-clarity-naming-csp` · **Spec**: `spec.md` · **Branch**: `freebuff/4c532ef5f3ae120cb7f4e2b5`

## Technical Context

- Next.js App Router 16.4.3, React 19.3.1, hand-authored theme CSS in `themes/default/` plus Tailwind
  utilities. The homepage hero is `app/homepage/Hero.js` (imports `themes/default/hero.css`), the
  section content is `app/homepage/HomePage.js` (imports `themes/default/homepage.css`), the shared
  shell and footer are `app/layout.js`, and response headers come from `next.config.mjs`.
- No new dependency, route, API, database, Stripe, email or configuration beyond one CSP source.
- Prices, Stripe price IDs, checkout types, product names sent to Stripe, email templates and all
  navigation destinations stay byte-identical.

## Constitution Check

| Principle | Assessment |
| --- | --- |
| I. Single Source of Truth | Compliant — one feature directory; no governance or Memory Bank duplication. |
| II. Verify Before Acting | Compliant — audit measurements re-checked in this workspace before editing. |
| III. Implementation Sequence | Compliant — specify → plan → tasks → implement → verify → diff audit → report. |
| IV. Protect Core Systems | Compliant — no payment, authentication, database, secret, deployment or API change; CSP change is additive to one directive. |
| V. Resource Conservation | Compliant — smallest copy/CSS/header change per finding; `.docs/` read-only. |
| Build/execution safety | Compliant — production build measured against the 495 MB ceiling. |

## Approach

### Work area 1 — first-screen clarity (D1)

1. `app/homepage/Hero.js`: the hidden `H1` becomes a visible brand line inside a new
   `.hero-welcome` block placed directly under the existing navigation and above the artwork:
   brand `H1`, one-sentence lede ("A fun, free place to explore what luck means to you."), a short
   explanation naming the Luck Generator, the Crystal Ball and Lucky Community Stories plus the
   "more than fortune and fame" statement, a free gold CTA to the existing `#play-explore` section,
   and a one-line "Free to enjoy · For fun and entertainment only" note.
2. `themes/default/hero.css`: the block's typography reuses the existing `--lpc-display` face and
   gold tokens; the 12 px mobile caption floor from PR #1774 is respected.
3. `themes/default/homepage.css`: the hero artwork container height is reduced responsively
   (`clamp(300px, 50svh, 560px)`, mobile `clamp(220px, 44svh, 380px)`) so the new copy and the CTA
   fit inside `100svh` at 390 × 844 and 1440 × 900 without clipping. The artwork file, its `<picture>`
   sources, preload hints, shimmer layers and the existing "Explore your luck" control are unchanged.

### Work area 2 — Cloudflare Analytics CSP (D2)

4. `next.config.mjs`: append `https://static.cloudflareinsights.com` to the existing `script-src`
   list only. `default-src`, `style-src`, `font-src`, `img-src`, `connect-src`, `frame-src`,
   `media-src`, `object-src`, `base-uri`, `form-action` and `frame-ancestors` keep their values, and
   the development-only `'unsafe-eval'` suffix stays.

### Work area 3 — approved naming (D6)

5. Replace legacy experience labels with the approved names in visitor-facing copy: homepage cards
   and section heading, hero navigation, footer navigation, FAQ content, `/lucky-meter` metadata and
   body copy, the Crystal Ball navigation link, the About page and About section, the map page
   metadata, loading text and headings, the map error states and the story database error text.
6. Leave unchanged: every `href`/route, the `Personal Reveal — CAD $1.00` and
   `Gift Reveal — CAD $1.99` labels, the checkout modal product titles and Stripe product names,
   Tip Jar and FAQ names.

### Work area 4 — phone tap-target verification (D3, PR #1774)

7. Re-measure the rendered controls at 390 × 844 in an emulated touch viewport: footer navigation
   links, footer social links, homepage header links and map province markers (border box plus
   generated `::before` hit area). Fix only controls below 24 × 24 px, preserving visible artwork.
   No PR #1774 rule is re-implemented or duplicated.

## Files

| File | Change |
| --- | --- |
| `app/homepage/Hero.js` | Visible first-screen introduction, free CTA, approved navigation labels. |
| `themes/default/hero.css` | Styles for the first-screen block. |
| `themes/default/homepage.css` | Responsive hero artwork height so the copy fits the first screen. |
| `next.config.mjs` | `static.cloudflareinsights.com` added to `script-src` only. |
| `app/homepage/HomePage.js` | Approved section and CTA names. |
| `app/layout.js` | Approved footer navigation names and keywords. |
| `app/homepage/faq-content.js` | Approved names inside the FAQ answers. |
| `app/lucky-meter/page.js`, `app/lucky-meter-client/LuckyMeterClient.js` | Luck Generator naming. |
| `app/components/CrystalBall/CrystalBall.tsx` | "Luck Meter" navigation link becomes "Luck Generator". |
| `app/about/page.js`, `components/AboutSection.tsx` | Approved names in About copy and links. |
| `app/map/page.js`, `app/lucky-map-of-canada/page.js`, `app/where-luck-has-been-found-in-canada/page.js` | Lucky Community Stories metadata and loading text. |
| `app/lucky-map-of-canada/lucky-map-of-canada.js`, `app/components/map-error-boundary.js` | Map headings, labels, empties and errors. |
| `app/lucky-stories.js`, `app/lucky-stories-db.js` | Story database error text. |
| `__tests__/first-screen-and-naming.test.js` | New regression guard. |
| `__tests__/**`, `tests/visual/**` | Guards that assert the superseded names updated to the approved names. |
| `specs/115-first-screen-clarity-naming-csp/**`, `.specify/feature.json`, `artifacts/first-screen-20261108/**` | Spec Kit artifacts and measurement evidence. |

Not changed: `public/**` artwork, Stripe/checkout/payment code, `package.json`, `pnpm-lock.yaml`,
`wrangler.jsonc`, `.docs/**`, route paths, prices, checkout types, email delivery, Turnstile.

## Verification plan

| Check | Method |
| --- | --- |
| Regression guard | `pnpm exec vitest run __tests__/first-screen-and-naming.test.js` |
| Full suite | `pnpm run test` |
| Types | `pnpm exec tsc --noEmit` |
| Repository gate | `./freebuff-verify.sh` |
| Build size | `.next` + `public` bytes versus 495 MB |
| CSP | `next start` + response header inspection; assertions on the header value |
| First screen | Rendered measurement at 1440 × 900 and 390 × 844: copy/CTA inside the viewport, no overflow |
| Naming | Rendered homepage/footer/FAQ/map text and source scan for legacy labels |
| Phone targets | Rendered hit-area measurement at 390 × 844 for footer, header and marker controls |
| Brand identity | Rendered copy and source scan: no gambling/betting/lottery positioning introduced |

## Risks and mitigations

- **First-screen crowding**: the artwork container shrinks instead of the artwork changing, and the
  result is measured at both viewports; copy is short enough to avoid clipping at 320 px width.
- **CSP over-widening**: exactly one source is appended to `script-src`; a regression test asserts the
  other directives are unchanged.
- **Naming over-reach**: only experience labels change; routes, prices, checkout types and product
  names are untouched and the final diff is reviewed path by path.
- **Regression in existing behaviour**: the homepage copy and FAQ strings are guarded by updated
  tests, and the free "Explore your luck" control, reveal checkout, Tip Jar and Suggestion Box are
  left functionally untouched.
