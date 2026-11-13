# Implementation Plan: Homepage Search Listing

**Feature**: `specs/151-homepage-search-listing` · **Branch**: `freebuff/3861236672f48b16179def62` · **Date**: 2026-11-13

## Technical Context

| Item | Value |
| --- | --- |
| Framework | Next.js App Router 16.4.3 metadata API (`app/layout.js`) |
| Affected files | `app/layout.js`, `public/luckypickcanada-home-1200x630.jpg` (new), `__tests__/feature-image-social-sharing.test.js`, Memory Bank |
| Unaffected | Homepage components and artwork, other routes' metadata, dependencies, lockfile, workflows, hosting, secrets, Google Business Profile |
| Verification | Focused vitest, `tsc --noEmit`, production build size, `./freebuff-verify.sh`, live crawler-access probes |

No dependency or platform change is involved. The metadata API already emits absolute image URLs from `metadataBase`, so
the change stays inside the root metadata object plus one new public asset.

## Constitution Check

- **Smallest correct change**: one capture asset, four description surfaces that already share one constant, one image
  URL swap, one guard-test update.
- **Preserved behaviour**: homepage layout, artwork, copy, navigation, prices, animations, other routes' metadata and
  the existing shared share image are untouched.
- **Protected areas**: no security, payment, database, authentication, hosting, deployment, secret or `AGENTS.md` change.
- **Build size**: 1200 × 630 JPEG at ~157 KB; the 495 MiB cap is unaffected.
- **One feature directory**: all artifacts live under `specs/151-homepage-search-listing/`.

## Phase 0 — Research

Not required. The live homepage head, `robots.txt` and image headers were probed directly:

- `meta[name=description]`, `og:description`, `twitter:description` carry the old wording; `og:image` is the feature
  share artwork.
- `robots.txt` ends with `User-agent: * / Allow: /`; Googlebot is not blocked, and Cloudflare's managed block names
  only AI-training crawlers.
- Image responses are `200 image/jpeg` with no `X-Robots-Tag`.

## Phase 1 — Design

### FR-001/FR-002/FR-003 — homepage capture

1. Capture the deployed homepage with Playwright at 1440 × 900 (`artifacts/seo-homepage/live-homepage-1440x900.png`).
2. Crop the hero band (`top: 55`, `1440 × 756`, ~1.905:1) so the emblem, tagline and headline survive, then resize to
   1200 × 630 and encode as progressive mozjpeg quality 82 (`public/luckypickcanada-home-1200x630.jpg`, ~157 KB).
3. Keep the existing `public/luckypickcanada-share-1200x630.jpg` untouched for the feature routes.

Rejected: replacing the shared artwork (would change every feature page's share card); a full-page capture scaled down
(the headline would be unreadable); capturing at 1200 × 630 (the hero is taller than that viewport, so the headline is
cut off).

### FR-004 — approved description

`app/layout.js` gains one `siteDescription` constant holding the approved sentence verbatim; `metadata.description`,
`openGraph.description`, `twitter.description` and the WebSite JSON-LD `description` all reference it, so the wording
cannot drift between surfaces.

### FR-006 — guards

`__tests__/feature-image-social-sharing.test.js` keeps the shared-artwork contract for the feature routes, adds the
homepage capture's real 1200 × 630/JPEG/≤ 250 KB check and a root-metadata check (homepage URL, dimensions, Twitter
object), and no longer expects `app/layout.js` to reference the feature share image.

## Phase 2 — Verification

| Check | Command |
| --- | --- |
| Focused guard | `pnpm exec vitest run __tests__/feature-image-social-sharing.test.js` |
| Unit suite | `pnpm test` |
| Type check | `pnpm exec tsc --noEmit` |
| Build + size | `pnpm run build`, `du -sh .next` |
| Repository gate | `./freebuff-verify.sh` |
| Built metadata | inspect the built page's `<head>` for the four description surfaces and the absolute image URL |
| Crawler access | `robots.txt` rules for Googlebot, image `Content-Type`/status, absence of `X-Robots-Tag` |

## Risks and Mitigations

- **Google may truncate the long approved description**: the text is published verbatim as requested; no variant is
  invented.
- **Thumbnail differences across surfaces**: Open Graph, Twitter and JSON-LD all point at one asset with matching
  dimensions, so caches cannot pick up stale dimensions.
- **Live verification needs a deploy**: the change is verified on the production build locally; the owner's deploy is
  required before the live head can be re-read, and that limitation is reported rather than claimed as done.
