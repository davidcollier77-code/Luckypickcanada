# Feature Specification: Homepage Search Listing

**Feature Branch**: `freebuff/3861236672f48b16179def62`
**Created**: 2026-11-13
**Status**: Implemented

**Input**: Owner request to improve the Lucky Pick Canada Google Search listing with an accurate homepage thumbnail
and the approved community-focused description, without changing the Google Business Profile, homepage layout,
artwork or functionality.

## Verified baseline (before this change)

- The production homepage (`https://luckypickcanada.ca/`) serves
  `meta name="description"` and `og:description` as "Explore daily luck readings, collectible cards, a playful crystal
  ball and Canadian community stories. Entertainment only, with no real lottery affiliation."
- Its `og:image` and `twitter:image` point at `/luckypickcanada-share-1200x630.jpg` (1200 × 630), which is an
  illustration of a collectible card rather than a preview of the actual homepage.
- `app/layout.js` owns the root metadata (description, Open Graph, Twitter, WebSite JSON-LD) for the homepage and every
  route without its own metadata; the feature routes declare their own descriptions and keep the shared artwork.
- `https://luckypickcanada.ca/robots.txt` allows `User-agent: *` with `Allow: /` (Cloudflare's managed content block
  additionally disallows AI-training crawlers only), and image responses omit `X-Robots-Tag`.

## User Scenarios & Testing

### User Story 1 — A search result that looks like the real homepage (Priority: P1)

Someone searching for Lucky Pick Canada sees a thumbnail of the live homepage — the Milky Way sky, the golden maple
leaf and four-leaf clover emblem, the Canadian tagline and the "Lucky Pick Canada: Your Daily Lucky Moment" headline —
instead of an unrelated card illustration.

**Why this priority**: the owner asked for an accurate homepage thumbnail; a listing image that does not resemble the
site misrepresents it.

**Independent Test**: read the committed 1200 × 630 JPEG and confirm it is a downscaled crop of the live 1440 × 900
homepage capture that keeps the emblem, tagline and headline on the night-sky background.

**Acceptance Scenarios**:

1. **Given** the homepage metadata, **When** a crawler reads `og:image`, `og:image:width`, `og:image:height`,
   `og:image:alt` and `twitter:image`, **Then** all of them describe the 1200 × 630 homepage capture.
2. **Given** the asset, **When** it is requested from the deployed site, **Then** it is served as `image/jpeg` with a
   successful status and is not disallowed by `robots.txt`.

### User Story 2 — The approved description is exactly what is published (Priority: P1)

The homepage description (standard, Open Graph, Twitter and the WebSite structured data) is the owner-approved wording,
verbatim.

**Independent Test**: grep the built HTML head for the approved sentence and confirm all four surfaces match character
for character, including the em dash.

### Edge Cases

- The approved wording is longer than Google typically displays; the metadata still carries it verbatim and Google may
  truncate the visible snippet. No shortened variant is introduced.
- Feature routes (`/map`, `/crystal-ball`, `/reveal`, `/lucky-meter`, and the map aliases) keep their own descriptions
  and the existing shared share image, so only the homepage listing changes.
- The homepage capture must not alter the page: it is taken from the deployed site, not from local source.

## Requirements

- **FR-001**: A committed 1200 × 630 JPEG capture of the live homepage MUST be the root `og:image` and `twitter:image`,
  with matching intrinsic dimensions and descriptive alt text.
- **FR-002**: The capture MUST preserve the Milky Way background, the Canadian emblem and the main homepage headline.
- **FR-003**: The new asset MUST be optimized (JPEG, progressive, ≤ 250 KB) and MUST NOT replace or modify the existing
  shared artwork or any other image.
- **FR-004**: `app/layout.js` MUST publish the approved description on the standard, Open Graph, Twitter and WebSite
  JSON-LD surfaces, verbatim.
- **FR-005**: Homepage layout, artwork, functionality, copy, the Google Business Profile and every other route MUST be
  unchanged.
- **FR-006**: Automated guards MUST check the homepage capture's real dimensions, format and size, and that the root
  metadata references it with matching dimensions.

## Success Criteria

- **SC-001**: The built homepage HTML head carries the approved description and the absolute homepage image URL with
  `1200` × `630` dimensions.
- **SC-002**: `robots.txt` allows crawling of the image and the live image request succeeds.
- **SC-003**: Focused tests, the type check, the production build and `./freebuff-verify.sh` pass, and the build stays
  below the 495 MiB cap.

## Assumptions

- Google reads Open Graph images for search result thumbnails; no Google Business Profile or verification-token change is
  involved or authorized.
- The live metadata itself can only be re-verified after the owner deploys the merged change; this task verifies the
  built output locally and the live crawler access path.
