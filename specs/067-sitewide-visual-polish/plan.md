# Implementation Plan: Site-Wide Visual Polish and Presentation Refinement

**Branch**: `freebuff/016113030bd542c07a547bd2` | **Date**: 2026-11-01 | **Spec**: `specs/067-sitewide-visual-polish/spec.md`

## Summary

Three presentation-only corrections, each traced to a measured defect in the current source: resolve the undefined `--font-header` fallback so every homepage card heading uses the brand display face; bring the two stock-Tailwind legal routes onto the site's dark palette and surface language; and stop the Lucky Map artwork from being upscaled with a pixel-replicating rendering hint. No content, behaviour, asset, dependency, or protected experience is touched.

## Technical Context

**Language/Version**: JavaScript (Next.js App Router), CSS (`themes/default/*.css`, `app/globals.css`), Tailwind v4 utilities already in use.
**Primary Dependencies**: none added — no package, font, or asset change.
**Testing**: `pnpm exec tsc --noEmit`; `pnpm test` (vitest); `pnpm exec playwright test` for visual/interaction checks; `./freebuff-verify.sh`; production build size measurement.
**Constraints**: `.docs/` read-only; no API/route/config/secret/deployment change; AVIF-first with WebP fallback preserved; 495 MB hard build maximum; PR left open and unmerged.

## Constitution Check

- Smallest correct change: PASS — three files of CSS/markup-level presentation work, no new abstractions.
- Preserve protected experiences: PASS — no change to starfield, Lucky Meter, card reveal, Crystal Ball, paid reveals, or map/story behaviour, artwork files, copy, or navigation.
- No security or behavior weakening: PASS — presentation properties and utility classes only; legal-page links keep their hrefs.
- Verify before claiming completion: REQUIRED — every claim in the PR body is tied to a command actually run and its real result.

## Phase 0 — Research (measured)

- Located `var(--font-header, serif)` in `themes/default/homepage.css:23`; repository-wide search shows `--font-header` defined only in `app/components/CrystalBall/CrystalBall.module.css:13` (module-scoped), and a stale unused copy under `public/themes/default/`.
- Confirmed the global display rule `.lpc-display, h1, h2, h3 { font-family: var(--lpc-display) }` is overridden for `.homepage-community-card h2` / `.homepage-offer h3` by the more specific `var(--font-header, serif)` rule, while `.homepage-community-banner h2` keeps Cinzel — the inconsistency is inside a single page.
- Confirmed `app/privacy/page.js` and `app/terms/page.js` are the only routes using `text-blue-600` / `text-gray-500`, and that `--lp-text` (`#fff8de`) already provides their body text colour via `body`.
- Measured the map artwork at 569×464 with `sharp` and confirmed `themes/default/map.css` displays it up to 44rem (704px) with `image-rendering: crisp-edges`.

## Phase 1 — Design

1. `themes/default/homepage.css`: replace the undefined `var(--font-header, serif)` fallback in the card-heading rule with `var(--lpc-display)`. One declaration; no new token, no module override touched.
2. `app/privacy/page.js`, `app/terms/page.js`: keep every heading, paragraph, date, and link destination, and replace the stock palette classes with a small set of local classes (`legal-page`, `legal-back-link`, `legal-meta`, `legal-surface`, `legal-title`, `legal-section-title`) styled from the existing brand tokens and presented on a framed glass surface, consistent with `/about`. Gold link colour supplies ≥4.5:1 contrast on the dark background.
3. `themes/default/map.css`: change `.official-map-image`'s `image-rendering` to `auto`, keeping the existing `translateZ(0)` compositing hint, display sizing, marker geometry, and `object-fit`.

## Phase 2 — Verification

- Typecheck, unit suite, governance gate + build via `./freebuff-verify.sh`, measured build size, and golden-CSS/served-HTML evidence for each change.
- Playwright visual/interaction runs where the container renderer permits; record the real outcome rather than assuming.
- Final diff audit against the reported file list.

## Phase 3 — Reporting

- Publish one PR body as the canonical report and update `memory-bank/activeContext.md`; leave the PR open and unmerged.
