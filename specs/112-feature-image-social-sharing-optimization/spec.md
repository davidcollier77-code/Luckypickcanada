# Feature Specification: Feature-page image optimization and social-sharing image replacement

**Feature**: `specs/112-feature-image-social-sharing-optimization`
**Branch**: `freebuff/6ce646730644757a168998bf`
**Input**: Master Work Request — implement SEO audit findings F-H2, F-H3 (and F-M6 where it applies to these images) from PR #1760.
**Source findings**: F-H2, F-H3 and F-M6 in the SEO audit recorded by PR #1760 (`https://github.com/davidcollier77-code/Luckypickcanada/pull/1760`).

## Overview

The SEO audit measured four feature-page images and one sitewide share image. This feature completes the
**outstanding** part of that optimization: new responsive width variants where the source is larger than
the rendered box, missing intrinsic dimensions on one decorative image, and a correctly sized
1200 × 630 share image whose declared metadata dimensions match the file.

Existing, already-correct work is **not** recreated: the AVIF/WebP derivatives for all four feature images
exist and are delivered today. Only gaps remain in scope.

### Verified baseline (measured in this workspace before any change)

| Route | File | Dimensions | Bytes | Delivered today |
| --- | --- | --- | --- | --- |
| `/crystal-ball` | `public/assets/crystal-ball-pedestal.png` | 716 × 875 | 1,529,009 | `<picture>` AVIF (226,663) → WebP (231,356) → PNG |
| `/reveal` | `public/NGC4216_crawford.jpg` | 2949 × 2847 | 2,515,005 | `<picture>` AVIF (137,183) → WebP (143,576) → JPEG |
| `/lucky-meter` | `public/images/lucky-meter-night-sky.webp` | 1400 × 2559 | 421,068 | `<picture>` AVIF (390,334) → WebP |
| `/map` | `public/IMG_20260731_055452_187611.png` | 569 × 464 | 241,864 | `<picture>` AVIF (38,666) → WebP (42,870) → PNG |
| sitewide OG/Twitter | `public/1785347037732.png` | 1407 × 768 | 1,290,881 | direct PNG, declared 1200 × 630 (wrong) |

Rendered boxes: crystal ball `clamp(280px, 75vw, 420px)`; reveal/meter backgrounds `100vw`;
map artwork `min(100%, 44rem)` (569 px source, already smaller than the 704 px box).

## User Scenarios & Testing

### User story 1 — Visitor on a phone loads a feature page (P1)

A mobile visitor opens `/crystal-ball`, `/reveal` or `/lucky-meter`. The browser selects a width variant
matching the rendered box and device pixel ratio instead of downloading a full-resolution source.

**Independent test**: request each page from a local production build with a mobile-width viewport and a
narrow `Accept`/`DPR` profile; observe `currentSrc` on the chosen `<source>` and confirm the exact file name
and byte count from the network.

### User story 2 — Shared link shows a correct preview (P2)

A visitor shares any page to a social platform. The crawler fetches a 1200 × 630 image under 250 KB and the
`og:image:width`/`og:image:height` values equal the real file dimensions.

**Independent test**: fetch the share image, read its header dimensions with `sharp`, and compare them with
the values emitted in the rendered `<meta property="og:image:width">` and `og:image:height` tags.

### User story 3 — Layout stays stable while the decorative image loads (P3)

The full-bleed `/reveal` background reserves its intrinsic aspect ratio in markup, so it cannot shift layout
when it resolves (audit finding F-M6 for an image in this scope).

**Independent test**: inspect the rendered `<img>` for matching `width`/`height` attributes equal to the
served candidate's intrinsic dimensions.

## Requirements

- **FR-001**: `/crystal-ball` serves at least two AVIF and two WebP width candidates selected by `sizes`
  that describe the actual `clamp(280px, 75vw, 420px)` box.
- **FR-002**: `/lucky-meter` serves at least three AVIF and three WebP width candidates selected by `sizes="100vw"`.
- **FR-003**: `/reveal` serves at least three AVIF and three WebP width candidates selected by `sizes="100vw"`,
  and its `<img>` declares intrinsic `width`/`height`.
- **FR-004**: `/map` keeps its existing AVIF/WebP derivatives and `width`/`height`; no derivative is regenerated
  and no upscaled source is invented.
- **FR-005**: Every existing PNG/JPEG fallback file for the four feature images stays in place and unchanged.
- **FR-006**: One 1200 × 630 share image exists under 250 KB and preserves the original artwork and composition.
- **FR-007**: Every Open Graph and Twitter image reference in `app/**` points at the new share image, and every
  declared `width`/`height` equals the real file dimensions.
- **FR-008**: The original `public/1785347037732.png` and all four original feature images remain in the repository.
- **FR-009**: Responsive markup keeps the existing visual presentation: same artwork, colours, composition,
  object-fit/object-position, aspect ratio, loading priority and accessibility attributes.
- **FR-010**: No wording, layout, animation, routing, API, payment, authentication, database or deployment
  configuration changes.

## Success Criteria

- **SC-001**: Measured AVIF bytes delivered per route are lower than the pre-change file for the same viewport
  (crystal ball, lucky meter, reveal), reported with exact bytes and percentages.
- **SC-002**: The share image is exactly 1200 × 630, is ≤ 250 KB, and is byte-for-byte under the declared dimensions
  at every referencing route.
- **SC-003**: A Vitest regression file fails if any width variant, `sizes` attribute, intrinsic dimension, share
  image or metadata reference is removed or drifts from the real file.
- **SC-004**: `./freebuff-verify.sh` exits 0 on the committed diff.
- **SC-005**: The production build stays below the 495 MB ceiling, with the measured size reported.

## Assumptions and limits

- Social platforms cache previews; re-scraping is an owner/platform action and cannot be performed here.
- The `/map` source is 569 px wide against a 704 px box, so no honest larger candidate exists; creating one
  would be an upscale that adds bytes without detail, which the task forbids ("do not recreate derivatives that
  already exist and are correctly implemented").
- Device-pixel-ratio behaviour is verified in a real browser; which candidate a specific user agent picks
  cannot be guaranteed beyond the standards-defined selection.
- No Core Web Vitals field data or Search Console access exists here, so byte savings are reported as measured
  transfers, not as a performance-score claim.
