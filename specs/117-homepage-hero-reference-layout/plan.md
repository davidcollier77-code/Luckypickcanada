# Implementation Plan: Homepage hero reference layout

**Branch**: `freebuff/c2fffecd2a96680aacf6147e` | **Date**: 2026-11-08 | **Spec**: `spec.md`

## Summary

Re-compose `/`'s hero into the supplied reference order without touching the artwork, its delivery or
the interactive layer. The single flattened 1024 × 1536 painting is measured once (alpha row profile)
and displayed through four row windows: `0–1090` (emblem, tagline, wordmark), `1222–1306` (the
maple-leaf divider, rendered twice), and `1306–1506` ("EXPLORE YOUR LUCK" and its chevron). The
existing `.hero-welcome` block becomes the bordered panel between the two dividers; the fixed
`100svh` budget is removed so the painting keeps its scale on phones.

## Technical Context

**Language/Version**: JavaScript (React 19, Next.js 16 App Router)
**Primary Dependencies**: Next.js 16.4.3, React 19.3.1, Tailwind CSS 4 (utilities only), canvas-confetti
**Storage**: none touched
**Testing**: Vitest source guards, Playwright visual/interaction suites
**Target Platform**: Cloudflare Pages via OpenNext; desktop and mobile browsers
**Project Type**: Next.js web application
**Constraints**: one existing artwork file, no new assets, no dependency changes, 495 MB build cap,
PR stays open and unmerged

## Constitution Check

- Smallest correct change: two source files (`app/homepage/Hero.js`, `themes/default/hero.css`) plus
  two source-guard tests and the refreshed visual baselines. No route, API, auth, payment, database,
  CSP, deployment or dependency change.
- Artwork integrity: the same file bytes, same `srcset`/`sizes`, same AVIF-first/WebP-second order,
  same single AVIF preload. Windows are CSS crops (`overflow: hidden` + measured `top` offset), so
  proportions are preserved and nothing is redrawn or stretched.
- Preserved behaviour: navigation, copy, gold shimmer regions, star canvas, Explore control
  (confetti, sound, eased scroll, cooldown, interrupt, reduced motion) and every section below the
  hero are untouched.
- Accessibility: `aria-hidden` decorative slices, unchanged button accessible name and hit target,
  44 px+ targets, `prefers-reduced-motion` preserved.
- Documentation: `.docs/` stays read-only.

## Research and decisions

1. **Is separating the flattened artwork necessary?** Yes. The reference places the welcome panel
   between two dividers, but the painting carries the subtitle band in that position and only one
   divider. No layered or separate source asset exists in the working tree or in the file history
   (`git log -- public/homepage-hero-lucky-pick-canada*` shows only optimised derivatives of this one
   painting), so the panel cannot be inserted without windowing the painting.
2. **Measured row bands** (alpha > 32 px coverage, 1024 × 1536 painting): content runs `14–690`
   (emblem), `672–743` (tagline), `755–1085` (wordmark), `1095–1205` (subtitle, replaced by the
   panel), `1222–1306` (divider with sparkle bursts), `1325–1378` ("EXPLORE YOUR LUCK"),
   `1385–1502` (chevron), `1503–1535` empty. Windows: `0–1090`, `1222–1306`, `1306–1506`.
3. **Window technique**: each slice is `position: relative; overflow: hidden; aspect-ratio: 1024/H`
   with the image `position: absolute; width: 100%; height: auto; top: var(--hero-art-offset)`. The
   offset percentage resolves against the slice height, so `-1222 / 84 * 100%` lands the divider
   exactly where it is painted. No new asset and no image processing step.
4. **Shimmer mapping**: the frame keeps `aspect-ratio: 1024 / 1536` and `width: 100%`, so it still
   reproduces the painting's box exactly; it is now anchored to each slice with the same
   `--hero-art-offset`. Every measured band percentage (ring 0.49 %/68.4 %, wordmark 48.6 %/22 %,
   Explore 85.2 %/11.6 %) is unchanged.
5. **No fixed viewport height**: `minHeight: 100svh`, `h-[100svh]` and the height-driven artwork
   sizing are removed; the column is `min(100%, 46rem)` wide, so branding scale follows width.
6. **Panel design**: the existing welcome block gains a gold hairline border, dark navy translucent
   fill, inner top highlight and gold glow; the heading becomes gold display caps as in the reference.
   All existing elements, wording and the gold `#play-explore` CTA are kept.

## Project Structure

```text
app/homepage/Hero.js              # slice composition, preload unchanged, preserved content
themes/default/hero.css           # slice windows, shimmer mapping, panel styling
__tests__/homepage-nav-gold-shimmer.test.js  # updated alignment guard
__tests__/homepage-hero-layout.test.js       # new composition/regression guard
tests/visual/homepage.spec.ts     # refreshed approved baseline (layout changed by request)
tests/visual/__screenshots__/*    # refreshed baselines for all three projects
specs/117-homepage-hero-reference-layout/
artifacts/hero-reference-20261108/
```

## Verification

- Focused Vitest guards, full Vitest suite, `tsc --noEmit`, `./freebuff-verify.sh`, build size.
- Playwright: measured DOM order/geometry at 1440 × 900, 1024 × 768, 412 × 915, 390 × 844; screenshots
  compared with the reference; refreshed visual baseline; shimmer motion; Explore interaction;
  reduced motion; gold CTA geometry; mobile accessibility.
- Final diff review and canonical PR summary.

## Risks and mitigations

- *Slice seams*: windows are cut on measured near-empty rows, and the drop shadow that could reveal a
  seam is removed from the slices.
- *Shimmer drift*: the frame maps the painting box by construction; verified by motion sampling and
  screenshots at both sizes.
- *Baseline churn*: the homepage visual baseline is intentionally refreshed for the approved layout
  and committed, so the suite still fails on unintended pixel changes.

## Complexity Tracking

No constitution violations and no additional architectural complexity.
