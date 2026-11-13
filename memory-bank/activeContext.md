# Active Context — Homepage Search Listing

- **Updated:** 2026-11-13
- **Repository:** davidcollier77-code/Luckypickcanada
- **Branch:** `freebuff/3861236672f48b16179def62`
- **Base:** `main`
- **Spec Kit feature:** `specs/151-homepage-search-listing` (follows `specs/150-*`)

## Current Task

The owner asked for an accurate Google Search homepage thumbnail and an approved community-focused description, with no
change to the Google Business Profile, homepage layout, artwork or functionality.

## What changed

- `public/luckypickcanada-home-1200x630.jpg` — new 1200 × 630 progressive JPEG (160,384 bytes) cropped from a live
  Playwright capture of the deployed homepage at 1440 × 900: Milky Way backdrop, maple-leaf/clover emblem, tagline and
  headline.
- `app/layout.js` — one `siteDescription` constant holds the approved wording verbatim and feeds the standard, Open
  Graph, Twitter and WebSite JSON-LD descriptions; the root `og:image`/`twitter:image` now point at the homepage
  capture with matching dimensions and descriptive alt text. The existing shared share artwork and every feature route
  are unchanged.
- `__tests__/feature-image-social-sharing.test.js` — feature routes keep the shared-artwork contract; new guards check
  the homepage capture's real dimensions/format/size and that the root metadata references it correctly.
- `artifacts/seo-homepage/` — source capture and verification evidence.

## Verified behaviour (this workspace)

| Check | Result |
| --- | --- |
| Focused image/social guard | 10 tests, exit 0 |
| Full unit suite | 67 files, 635 tests, exit 0 |
| Type check | `tsc --noEmit`, exit 0 |
| Production build | 309 MB (cap 495 MiB) |
| `./freebuff-verify.sh` | exit 0 |
| Built homepage head | approved description on all four surfaces; absolute homepage `og:image`, 1200 × 630, alt text |
| Local image delivery | `200 image/jpeg`, 160,384 bytes, no `X-Robots-Tag`; `robots.txt` allows all crawling |

## Known Context Risks

- The live head can only be re-verified after the owner deploys the merged change; the local production build and the
  live crawler-access path are verified instead.
- The approved description is longer than Google usually displays; it is published verbatim and Google may truncate the
  visible snippet.
- The source capture is a screenshot of the live homepage, so it must be re-captured only if the hero artwork itself
  changes.
