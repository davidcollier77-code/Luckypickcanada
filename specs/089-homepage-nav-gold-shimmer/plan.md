# Implementation Plan: Homepage Navigation Consolidation and Golden Shimmer

**Feature**: `specs/089-homepage-nav-gold-shimmer` | **Branch**: `freebuff/d1d198f83bbd7f8a37f69b23` | **Date**: 2026-11-04

## Technical Context

- **Application**: Next.js 16 App Router, Cloudflare/OpenNext target, Tailwind utility
  classes plus repository CSS under `themes/default/`.
- **Touched surfaces**: the homepage hero server component
  (`app/homepage/Hero.js`), its stylesheet (`themes/default/hero.css`, imported by
  that component), and one new source-guard test. No route, API, data, payment,
  email, dependency, image or deployment file is touched.
- **Hero artwork reality**: the gold wordmark ("LUCKY PICK CANADA: YOUR DAILY LUCKY
  MOMENT"), the "EXPLORE YOUR LUCK" line with its downward arrow, and the gold ring
  around the emblem are all painted inside one AVIF/WebP artwork
  (`public/homepage-hero-lucky-pick-canada*.{avif,webp}`). The artwork is therefore
  untouchable, and the shimmer must be a decorative layer above it.
- **Alignment problem**: the `<img>` is `object-contain` inside
  `.hero-image-container`, so its painted box is letterboxed and changes with the
  viewport (height-limited when wide, width-limited when narrow). Positioning the
  decoration in container percentages would misplace it on phones. Solution: make
  `.hero-image-container` a size container (`container-type: size`) and give the
  overlay frame `height: min(100cqh, 150cqw)` with `aspect-ratio: 1024 / 1536`,
  which reproduces the `object-contain` box exactly. Engines without container
  query units drop the frame (zero size), so the decoration degrades silently.
- **Measured artwork regions** (from the 1024x1536 artwork, gold-pixel analysis):
  ring bbox ≈ x 177–842, y 25–690; wordmark rows 755–1075, x 40–985; Explore line
  and arrow rows 1310–1480, x ~190–830. Converted to frame percentages in the CSS.
- **No research required**: no library, API or version question affects this task.
  Existing repository conventions (plain CSS in `themes/default/`, Vitest source
  guards in `__tests__/`, Playwright/Chromium for visual evidence) are sufficient.
- **No new dependencies.** No design artifacts beyond `plan.md`: no entity, data
  shape, contract or persisted state changes, and the exact checks live in
  `tasks.md`.

## Constitution Check

| Principle | Status |
| --- | --- |
| I. Single Source of Truth | PASS — `AGENTS.md` remains authoritative; this plan adds no competing rule set. |
| II. Verify Before Acting | PASS — navigation entries, artwork regions and delivery markup were inspected/measured in this workspace before planning. |
| III. Implementation Sequence | PASS — INSPECT → IDENTIFY → UNDERSTAND → PLAN (this file) → IMPLEMENT → TEST → DOUBLE-CHECK → REPORT → PR. |
| IV. Protect Core Systems | PASS — no Stripe, auth, database, Cloudflare, secret or API-route change; navigation and decoration only. |
| V. Resource Conservation | PASS — no MCP use, `.docs/` read-only and unmodified, no documentation refresh. |

**Post-design re-check**: PASS — the design adds one CSS scope and one markup
block in existing files, plus one test; it does not widen access, alter
monetization or touch protected systems.

## Implementation

1. **Navigation** (`app/homepage/Hero.js`): in the hero primary navigation, remove
   the "Lucky Map" entry and its separator, and relabel the remaining stories link
   to "Lucky Stories" keeping its `#community-stories` destination. The `/map`
   route, the homepage "EXPLORE LUCKY STORIES" call to action and the footer
   navigation are untouched, so map functionality is preserved.
2. **Shimmer markup** (`app/homepage/Hero.js`): add one `aria-hidden` frame with
   three layers between the artwork `<picture>` and `ExploreLuckButton`, so the
   decoration never intercepts the hero's hit target.
3. **Shimmer styles** (`themes/default/hero.css`): the size-container alignment
   rule, the three masked region layers, one shared sweeping band animation with
   per-region durations/offsets, and a `prefers-reduced-motion: reduce` rule that
   removes the decoration entirely.
4. **Guard** (`__tests__/homepage-nav-gold-shimmer.test.js`): pin the single
   "Lucky Stories" link, the absent "Lucky Map" link, the preserved map route and
   call to action, the three shimmer regions, the reduced-motion rule, the
   untouched Explore control and the unchanged image delivery.
5. **Evidence**: focused and full Vitest runs, `tsc --noEmit`,
   `./freebuff-verify.sh` with a measured build, and Chromium captures of the hero
   a few seconds apart on desktop and mobile plus the reduced-motion path.

## Preserved behaviour

Hero artwork and wording, colours, layout, the Explore Your Luck click/touch/
keyboard activation with its confetti, sound and eased scroll, AVIF-first
delivery with the WebP fallback and the single AVIF preload hint, every route
including `/map`, and all non-hero homepage content.
