# Homepage Search Listing — Verification Evidence

Date: 2026-11-13 · Branch: `freebuff/3861236672f48b16179def62`

## Source capture

- Playwright capture of the deployed homepage `https://luckypickcanada.ca/` at 1440 × 900:
  `artifacts/seo-homepage/live-homepage-1440x900.png`.
- Crop and encode (`sharp`): `extract({ left: 0, top: 55, width: 1440, height: 756 })` → `resize(1200, 630)` →
  progressive mozjpeg quality 82.
- Result: `public/luckypickcanada-home-1200x630.jpg`, 1200 × 630 JPEG, 160,384 bytes (≤ 250 KB guard).
- Composition kept: Milky Way backdrop, golden maple-leaf/four-leaf-clover emblem, "A little Canadian magic made for
  today" tagline and the "Lucky Pick Canada: Your Daily Lucky Moment" headline.

## Built output (local `next start`, port 3123)

| Surface | Value |
| --- | --- |
| `meta[name=description]` | approved wording, verbatim |
| `og:description` | approved wording, verbatim |
| `twitter:description` | approved wording, verbatim |
| WebSite JSON-LD `description` | approved wording, verbatim |
| `og:image` | `https://luckypickcanada.ca/luckypickcanada-home-1200x630.jpg` |
| `og:image:width` / `height` | `1200` / `630` |
| `og:image:alt`, `twitter:image`, `twitter:image:alt` | homepage emblem alt text |
| Image response | `200`, `Content-Type: image/jpeg`, `Content-Length: 160384`, no `X-Robots-Tag` |
| `/robots.txt` | `User-agent: *` / `Allow: /` / sitemap (no image or homepage disallow) |

## Live production probes (before this change is deployed)

- `GET https://luckypickcanada.ca/` → `200`; head still carries the previous description and
  `/luckypickcanada-share-1200x630.jpg` (deployment pending).
- `GET https://luckypickcanada.ca/robots.txt` → `200`; Cloudflare's managed block disallows AI-training crawlers only,
  and the origin block ends with `User-agent: *` / `Allow: /`, so Googlebot and Googlebot-Image are allowed.
- `GET https://luckypickcanada.ca/luckypickcanada-share-1200x630.jpg` → `200 image/jpeg`, no `X-Robots-Tag`.
- The new homepage image path cannot be probed live until the owner deploys; it is verified on the production build
  locally with the same public path and headers.

## Checks run

| Check | Result |
| --- | --- |
| `pnpm exec vitest run __tests__/feature-image-social-sharing.test.js` | 10 passed |
| `pnpm test` | 67 files, 635 tests passed |
| `pnpm exec tsc --noEmit` | exit 0 |
| `pnpm run build` | success; `.next` 309 MB (cap 495 MiB) |
| `./freebuff-verify.sh` | exit 0, all steps passed; verification build 326 MB |
