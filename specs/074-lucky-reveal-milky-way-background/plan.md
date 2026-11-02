# Implementation Plan: Milky Way Background for the Lucky Reveal Experience

**Feature**: `specs/074-lucky-reveal-milky-way-background`

**Branch**: `freebuff/22482c484ffb5108687ad98e`

## Technical Context

- **Stack**: existing Next.js App Router + React client component. No new dependency, route, asset,
  API, or configuration.
- **Files touched by the change**: `app/lucky-reveal-popup.js` only.
- **Existing pieces reused**: the homepage sky artwork assets already shipped under
  `public/assets/crystal-ball-bg-desktop.{webp,avif,jpeg}` and the format order/focal point from
  `.homepage-sky-backdrop` in `themes/default/homepage.css`.
- **Unknowns**: none requiring research; the current background and the homepage artwork were both
  read from source before planning.

## Constitution Check

- **I. Single Source of Truth** — `AGENTS.md` remains authoritative; no governance file is touched.
- **II. Verify Before Acting** — the reveal background layers and the homepage backdrop were read
  from source, not assumed.
- **III. Implementation Sequence** — inspect → plan (this file) → tasks → implement → test → diff
  audit → report.
- **IV. Protect Core Systems** — checkout, Stripe, Resend, database, API routes, and environment
  handling are untouched. No visual behaviour outside the reveal background changes.
- **V. Resource Conservation** — no MCP, no dependency, no documentation refresh; `.docs/` is read
  only.

**Gate result**: PASS.

## Phase 0 — Research

No material unknown required external research. The only routed document that applies is the
repository's MDN image-format reference, because this task serves raster formats (AVIF, WebP, JPEG).
Its guidance is that format choice should follow browser support, quality, and fallback needs rather
than a blanket preference; the plan therefore reuses the homepage's existing AVIF → WebP → JPEG
`image-set()` fallback chain instead of choosing or converting new formats.

## Phase 1 — Design

### Background replacement (`app/lucky-reveal-popup.js`)

1. Add one module constant holding the homepage artwork as a three-format CSS `image-set()`
   (`webp`, `avif`, `jpeg`) pointing at `/assets/crystal-ball-bg-desktop.*`.
2. Replace the overlay style so the full-viewport layer paints:
   - the homepage vertical darkening gradient (same stops as `.homepage-sky-backdrop`),
   - the Milky Way artwork at `center 45%`, `cover`, `no-repeat`,
   - a `#02050a` base colour for browsers without `image-set()`.
   The old `rgba(2, 4, 8, 0.90)` scrim and its `blur(12px)` backdrop filter are removed from the
   overlay.
3. Remove the three aurora glow layers, the nine twinkling star points, the `starPositions` list, and
   the now-unused `lucky-aurora-glow-1`, `lucky-aurora-glow-2`, and `lucky-twinkle` keyframes.
4. Remove the lucky-colour `radialGlow` value from each `themeGlows` entry (it existed only for the
   removed background gradient) and keep the themed `borderColor` and `boxShadow`.
5. Keep the dialog's translucent panel scrim (raised opacity so text stays legible over the artwork)
   and its existing backdrop filter.

### Preserved behaviour

Reveal copy, numbers, colour/day cards, `ShareLuckyPickButton`, the gold map CTA, the close control,
Escape handling, autofocus, and every animation delay are unchanged. No meteorite or shooting-star
layer is added.

### Tests

- New `__tests__/lucky-reveal-background.test.js`: source guard proving the popup paints the homepage
  artwork in the homepage's format order, keeps the `center 45%` / `cover` focal treatment, no longer
  contains the aurora layers, twinkle stars, or their keyframes, adds no meteor/shooting-star
  vocabulary, and keeps the shared reveal module contract intact.

**Post-design Constitution re-check**: PASS — the change is confined to the reveal background, adds
no dependency, and preserves every existing safeguard and control.
