# Implementation Plan: Mobile usability and accessibility remediation

**Feature**: `specs/114-mobile-usability-accessibility` · **Spec**: `spec.md` · **Branch**: `a11y/mobile-usability-accessibility-20261108`

## Technical Context

- **Application**: Next.js App Router 16.4.3, React 19.3.1, Tailwind CSS 4.3.4 plus hand-authored theme CSS in
  `themes/default/` (`index.css` imports `tokens`, `default`, `effects`, `header`). Route-specific CSS
  (`themes/default/map.css`, `CrystalBall.module.css`) is imported by the component that needs it.
- **Shared shell**: `app/layout.js` renders the document, the single page-level `<main>`, and the footer with three
  labelled `<nav>` regions. Every route renders inside it.
- **Change surface**: the shared layout and theme CSS, the Crystal Ball component, the Lucky Meter component, the
  map component and its stylesheet, the Lucky Card reveal markup, and one new accessibility stylesheet.
- **No new dependency**: no package is added; the work uses existing Tailwind utilities and theme CSS. `axe-core`
  and Playwright are already devDependencies.
- **Colour contrast is out of scope**: no colour value is introduced or changed to satisfy a contrast ratio. The
  focus ring reuses the theme's existing gold.
- **Token notes**: `default.css` sets `html { font-size: 15px }` at ≤ 620 px, so `0.8rem` is 12 px and `1rem` is
  15 px at the audit viewport. This is why the caption floor uses `0.8rem` rather than `12px` directly — it keeps
  the existing rem scale and desktop proportions.

## Constitution Check

| Principle | Assessment |
| --- | --- |
| I. Single Source of Truth | Compliant — no governance or Memory Bank duplication; one feature directory. |
| II. Verify Before Acting | Compliant — the audit numbers and the rendered baseline are measured in this workspace before edits. |
| III. Implementation Sequence | Compliant — specify → plan → tasks → implement → verify → diff audit → report. |
| IV. Protect Core Systems | Compliant — no payment, authentication, database, secret, Cloudflare, deployment or API change. |
| V. Resource Conservation | Compliant — smallest structural/CSS change per finding; `.docs/` read-only. |
| Build/execution safety | Compliant — build measured against the 495 MB ceiling and reported. |

Post-design re-check: unchanged.

## Approach

### Work area 1 — mobile usability

1. **Tap targets (D3).**
   - Footer links (`app/layout.js`): the anchors keep their exact type and colour, and gain a 24 px minimum box
     through the shared `footer nav a` rule in the new `themes/default/a11y.css`; their existing
     `before:-inset-*` expander still surrounds that box, so the effective target is ≥ 32 px tall and does not
     reach past the grid gap into a neighbouring link.
   - Homepage header links (`app/homepage/Hero.js`): each already carries `relative` plus a `before:-inset-2`
     hit-area expander. The change is measured rather than assumed; if the hit-test shows ≥ 24 px the markup is
     left alone, and the measurement is the evidence.
   - Lucky Map markers (`themes/default/map.css`): the visible circle is kept at its current size and artwork. A
     transparent `::before` ring with `inset: -3px` raises the effective target to ≈ 29 px. `::after` is already
     used by the active-marker twinkle, so the ring uses `::before` to avoid disturbing it.
2. **Small mobile text (D4).** Text roles are reviewed before sizing:
   - Reading captions are raised to the 12 px floor: footer navigation/social/legal links and the disclaimer
     (`app/layout.js`, `text-[10px]`/`text-[11px]` → `text-xs`), the Lucky Map statistic labels and story badge
     (inline `0.72rem` → `0.8rem`), the Crystal Ball daily-quota countdown (`0.78rem` → `0.8rem`), the revealed
     card tier chip and “Series 1 · Added to your collection” line (`0.68rem`/`0.7rem` → `0.8rem`), and — on
     mobile only — the offer note, lucky-moment eyebrow and share status (`a11y.css`).
   - Decorative eyebrows, section kickers, the engraved artwork plaque and icon glyphs keep their sizes: they are
     not reading text and enlarging them would flatten the typography hierarchy the task must preserve.
3. **Homepage layout review (390 × 844).** Verified by measurement after the tap-target and type changes:
   horizontal overflow, clipped text, overlapping interactive controls and the first-screen controls.

### Work area 2 — accessibility

4. **Duplicate main landmark (D5).** `app/components/CrystalBall/CrystalBall.tsx` renders its own `<main>` inside
   the layout's `<main>`. The component's landmark becomes a `<div>` with the same class, so the page has one main
   landmark and the visual container is unchanged. Every other route is checked for the same pattern.
5. **Heading order (D5).** `components/DailyResonance.tsx` renders an eyebrow `H2` (“Daily Resonance Ritual”)
   before the page `H1`, producing `2,1,2`. The eyebrow becomes a paragraph carrying the identical utility
   classes, so it looks the same and the sequence becomes `H1 → H2 → H2`.
6. **Skip link (D5).** `app/layout.js` gains a first-in-body `<a class="skip-link" href="#main-content">` and the
   shared `<main>` gains `id="main-content"` and `tabIndex={-1}` so the fragment target is focusable on every
   route. `a11y.css` keeps the link off-screen until `:focus`/`:focus-visible`.
7. **Navigation landmark names (D5).** Every existing `<nav>` already carries a distinct `aria-label`
   (“Primary navigation”, “Footer navigation”, “Social links”, “Legal links”, “Crystal Ball navigation”, “Lucky Map
   navigation”). The rendered names are read per route and no navigation is removed.
8. **Focus indicators (D8).** `themes/default/map.css` removes the outline on hover/focus for `.home-link`,
   `.story-link`, `.province-marker`, `.province-select-card`, `.map-activity-card`, `.map-province-card` and
   `.secondary-action-btn`. The `outline: none` declarations are dropped and an explicit 3 px gold `:focus-visible`
   rule is added, so the gold CTA and “Back to Home Page” keep their normal appearance but stay visible when
   focused. Footer links additionally get a guaranteed ring in `a11y.css`.

## Files

| File | Change |
| --- | --- |
| `app/layout.js` | Skip link, `#main-content` + `tabIndex` on `<main>`, footer link/caption sizes. |
| `themes/default/a11y.css` | New accessibility layer: skip link, footer focus ring, 24 px footer target box, mobile caption floor. |
| `themes/default/index.css` | Import the accessibility layer after the existing theme files. |
| `themes/default/map.css` | Restore visible focus on map controls; transparent marker hit-area ring. |
| `app/components/CrystalBall/CrystalBall.tsx` | Nested `<main>` becomes a `<div>`. |
| `app/components/CrystalBall/CrystalBall.module.css` | Daily-quota countdown caption to 0.8rem. |
| `components/DailyResonance.tsx` | Eyebrow `H2` becomes a paragraph so the page starts at `H1`. |
| `app/lucky-map-of-canada/lucky-map-of-canada.js` | Statistic label and story badge captions to 0.8rem. |
| `app/lucky-card-reveal.js` | Revealed-card tier chip and series caption to 0.8rem. |
| `__tests__/mobile-accessibility.test.js` | New regression guard for the structural and CSS guarantees. |
| `artifacts/a11y-mobile-20261108/**` | Measurement harness and before/after evidence. |
| `specs/114-mobile-usability-accessibility/**`, `.specify/feature.json`, `memory-bank/**` | Task artifacts and record. |

Not changed: artwork and `public/` assets, `next.config.mjs`, `wrangler.jsonc`, `package.json`, `pnpm-lock.yaml`,
`.docs/**`, routes, copy, animations, audio, Stripe/Neon/Turnstile code, contrast values.

## Verification plan

| Check | Method |
| --- | --- |
| Unit/type/gate | `pnpm exec vitest run __tests__/mobile-accessibility.test.js`, `pnpm exec tsc --noEmit`, `./freebuff-verify.sh`. |
| Tap targets | Chromium via Playwright at 390 × 844, emulated touch: border box plus hit-tested effective extents for markers, footer nav/social/legal links and homepage header links. |
| Mobile type | Rendered computed `font-size` enumeration per route at 390 × 844; min/median and the classified sub-12 px list. |
| Homepage layout | `scrollWidth` vs `clientWidth`, clipped-text check, control overlap check at 390 × 844. |
| Desktop integrity | Same measurements at 1440 × 900 plus a rendered comparison of the changed regions. |
| Landmarks/headings | `<main>` count and heading sequence per route. |
| Skip link | Keyboard `Tab` to the link, `Enter`, assert focus lands on `#main-content`; also assert `#main-content` is unique per route. |
| Focus indicators | Keyboard `Tab` walk on `/map`, reading `outline-style`/`outline-width` per focused element. |
| Build size | `.next` + `public` bytes versus 495 MB. |

## Risks and mitigations

- **Larger hit areas stealing taps**: hit areas are expanded with transparent generated boxes only, the measured
  overlap between adjacent map markers is recorded before and after, and no marker position or artwork changes.
- **Typography drift**: only reading captions move, desktop sizes are untouched except the footer's own
  `text-xs` normalisation, and the visual hierarchy (display / headings / body / caption) is preserved.
- **Focus-visible regressions**: hover/focus lift and brightness stay; only the outline removal is reverted.
- **Focus target invisibility**: `#main-content` is focusable and not `outline: none`, so keyboard users can see
  where the skip link lands.
