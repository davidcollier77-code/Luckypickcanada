# Feature Specification: Site-Wide Visual Polish and Presentation Refinement

**Feature Branch**: `freebuff/016113030bd542c07a547bd2`
**Created**: 2026-11-01
**Status**: Implemented (verification status recorded in `tasks.md`)
**Input**: Site-wide visual polish of LuckyPickCanada.ca — sharper, cleaner, more refined and professionally finished presentation — while preserving brand identity, artwork, content, navigation, functionality, animations, the AVIF-first/WebP-fallback image strategy, and every protected experience.

## Verified baseline (measured in this worktree, not assumed)

- `.homepage-offer h3, .homepage-community-card h2, .homepage-offer-title` in `themes/default/homepage.css` declare `font-family: var(--font-header, serif)`. A repository search finds `--font-header` declared **only** inside `app/components/CrystalBall/CrystalBall.module.css:13`, where it is scoped to that CSS module's root class. On every other surface the token is undefined, so all homepage card headings ("Lucky Meter", "Today's Lucky Card", "Crystal Ball", "Lucky Stories", "Leave a tip for the journey.") render in the browser's generic `serif` (Times), while sibling headings on the same page (`h1`/`h2` and `.homepage-community-banner h2`) render in the brand display face (Cinzel).
- `app/privacy/page.js` and `app/terms/page.js` are the only routes that still use the stock Tailwind palette instead of the site's brand palette: body links are `text-blue-600` (`#2563eb`) and the document date is `text-gray-500` (`#6b7280`) on the near-black page background (`#02070c`). `#2563eb` on `#02070c` is ≈3.1:1 contrast, below the 4.5:1 body-text threshold the rest of the site's warm-ivory/gold text meets. Both pages also render flush against the top edge with no page surface, unlike every other content route.
- `public/IMG_20260731_055452_187611.png` (the Lucky Map artwork) is **569×464**. `themes/default/map.css` displays it at `width: min(100%, 44rem)` (704px at the default root size) and applies `image-rendering: -webkit-optimize-contrast; image-rendering: crisp-edges`, which selects nearest-neighbour-style scaling. The artwork is therefore upscaled ≈1.24× with a pixel-replicating filter, producing visible blocky edges and broken fine detail, including at 2× device pixel ratios where the upscale is ≈2.5×.

## User Scenarios & Testing

### User Story 1 — Consistent brand typography on every card heading (Priority: P1)

As a visitor, I want headings in the same card section to share one typeface, so the page reads as deliberately designed rather than partially styled.

**Independent Test**: Load `/` and compare the computed `font-family` of a `.homepage-community-card h2` and a `.homepage-section-heading h2`; both resolve to the brand display stack. Rendered output contains no generic `serif`-only heading.

**Acceptance Scenarios**:
1. **Given** any homepage card heading, **When** it renders, **Then** it uses the same display typeface as the surrounding section headings.
2. **Given** the Crystal Ball module, **When** it renders, **Then** its locally scoped `--font-header` value still applies unchanged.

### User Story 2 — Legal pages presented like the rest of the site (Priority: P2)

As a visitor opening the Privacy Policy or Terms of Service, I want readable brand-consistent text and links, so a legal page does not look like an unfinished default page.

**Independent Test**: Load `/privacy` and `/terms`; link and meta text meet body-text contrast on the dark background, the page has the same top spacing and framed surface language as other content pages, and every link keeps its existing destination and keyboard focus treatment.

**Acceptance Scenarios**:
1. **Given** the privacy or terms page, **When** it renders, **Then** links use the site's warm gold accent and body text remains readable on the dark backdrop.
2. **Given** a keyboard user tabbing the legal pages, **When** a link receives focus, **Then** a visible focus indicator is shown.
3. **Given** either legal page, **When** compared with `/about`, **Then** top spacing and content framing are visually consistent.

### User Story 3 — Full-fidelity map artwork (Priority: P2)

As a visitor, I want the Lucky Map artwork to render at its best available sharpness, so fine map labels and coastline detail are not pixelated by the upscaling hint.

**Independent Test**: Inspect the computed `image-rendering` value on `.official-map-image`; it is `auto`, and the artwork file, display size, marker positions, and interactions are unchanged.

**Acceptance Scenarios**:
1. **Given** the map artwork is displayed larger than its intrinsic size, **When** the browser scales it, **Then** smooth high-quality scaling is used instead of pixel replication.
2. **Given** the same story data, **When** a province marker is clicked, **Then** selection, story panel, sharing, and celebration behaviour are unchanged.

## Requirements

- **FR-001**: Homepage card headings MUST resolve to the brand display typeface, and the Crystal Ball module's scoped header token MUST keep its current value.
- **FR-002**: The Privacy and Terms routes MUST use the site's brand text/link palette on the dark background and MUST retain their current content, structure, and link destinations.
- **FR-003**: Link text on those routes MUST reach at least 4.5:1 contrast against its rendered background.
- **FR-004**: The Lucky Map artwork element MUST use standard high-quality scaling rather than a pixel-replicating rendering hint; its source files, intrinsic dimensions, display size, markers, and behaviour MUST NOT change.
- **FR-005**: No change may alter the Milky Way backdrop, starfield, Lucky Meter, Lucky Card Reveal, Crystal Ball, paid reveal experiences, Lucky Map or Lucky Stories artwork/functionality, copy, navigation, animations, or interactive behaviour.
- **FR-006**: The AVIF-first with WebP fallback delivery strategy and all source image assets MUST remain unchanged.
- **FR-007**: Changes MUST remain presentation-only CSS/markup-classwork; no new dependency, route, feature, or architecture change.

## Success Criteria

- **SC-001**: Rendered pages show one display typeface across card and section headings, with no generic-serif heading remaining.
- **SC-002**: Legal-page body, meta, and link text meet body-text contrast on the dark backdrop when measured from rendered computed colours.
- **SC-003**: The map artwork element reports a non-pixelated rendering mode while its markup, source, and marker geometry are unchanged.
- **SC-004**: Existing unit, Playwright, typecheck, governance, and build checks pass at their previously recorded levels, and the production build stays below the 495 MB hard maximum.

## Assumptions

- The brand display typeface is the existing `--lpc-display` (Cinzel) stack already used for `h1`–`h3` site-wide; no new font is introduced or downloaded.
- The legal pages are static content routes, so restyling them carries no functional risk beyond their links, which keep their destinations.
- The map artwork cannot be re-rendered at higher resolution within this task (assets are protected), so sharpness is improved by using correct browser scaling rather than by regenerating assets.
