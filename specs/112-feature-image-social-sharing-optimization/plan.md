# Implementation Plan: Feature-page image optimization and social-sharing image replacement

**Feature**: `specs/112-feature-image-social-sharing-optimization` · **Spec**: `spec.md` · **Branch**: `freebuff/6ce646730644757a168998bf`

## Technical Context

- **Application**: Next.js App Router 16.4.3 (installed `node_modules/next`), React 19.3.1, webpack builds.
  `next.config.mjs` sets `images.unoptimized: true`, so every image is served as a static file from `public/`
  and `<picture>`/`srcSet` markup is authored by hand. There is no Next image optimizer to rely on.
- **Change surface**: `public/` derivative assets, three rendered image blocks
  (`app/components/CrystalBall/CrystalBall.tsx`, `components/DailyResonance.tsx`,
  `app/lucky-card-reveal.js`), the seven `app/**` metadata modules that reference the share image, and tests.
- **Tool**: `sharp@0.35.5` is already a devDependency and is the tool the previous derivative work used
  (`specs/011-avif-optimization`, `specs/017-avif-optimization-part2`). No new dependency.
- **Format strategy**: the repository's mandated MDN image-format reference
  (`.docs/polishing/_websites_mdn_image_types.md`, manifest ID `/websites/mdn_image_types`) documents that AVIF
  and WebP are the modern raster formats and that AVIF gives the smallest files for photographic content while
  WebP is the wider-support modern fallback. Existing `<picture>` order (AVIF → WebP → original) already follows
  that guidance, so this plan adds **widths inside the same format chain** instead of changing the chain.
- **Share-image format**: the original is an opaque sRGB PNG with no alpha (measured: 3 channels, `hasAlpha: false`),
  so a JPEG is lossless in composition terms and passes every platform's preview fetcher; an indexed PNG at the
  same size was measured at 305,344 B (over budget), so JPEG is the correct format here.
- **Rendered boxes** drive the candidate widths: crystal ball `clamp(280px, 75vw, 420px)` → 420 px and the
  716 px source; lucky meter and reveal are full-bleed `100vw` → 640/1024/1400 and 1280/1920/2949.
- **No data model, contracts or quickstart**: no entity, persisted data or external interface changes.

## Constitution Check

| Principle | Assessment |
| --- | --- |
| I. Single Source of Truth | Compliant — no governance, Memory Bank or specialist instruction duplicated. |
| II. Verify Before Acting | Compliant — baseline bytes/dimensions and delivered markup measured before editing. |
| III. Implementation Sequence | Compliant — inspect, specify, plan, tasks, implement, verify, diff audit, report. |
| IV. Protect Core Systems | Compliant — no payment, authentication, database, secret, Cloudflare or deployment change. |
| V. Resource Conservation | Compliant — only ships-outstanding derivatives; `.docs/` read-only. |
| Build/execution safety | Compliant — build measured against the 495 MB ceiling and reported. |

Post-design re-check: unchanged.

## Approach

1. Generate only the missing width derivatives with `sharp`, from the existing originals, at the candidate
   widths above. Keep the existing full-size AVIF/WebP files as the largest candidate and keep every PNG/JPEG
   fallback untouched.
2. Add `srcSet` width descriptors plus an accurate `sizes` attribute to the existing `<picture>` sources; keep
   the DOM order, classes, `object-fit`, `object-position`, priority hints and `aria-hidden` attributes.
3. Add intrinsic `width`/`height` to the `/reveal` background `<img>` (F-M6). The crystal ball and map images
   already declare them; the lucky-meter image uses `fill`, which is absolutely positioned and already
   shift-free.
4. Produce `public/luckypickcanada-share-1200x630.jpg` (1200 × 630, ≤ 250 KB) by resizing the original to 1200 px
   wide and centre-cropping 12 px from the top and 13 px from the bottom (655 → 630). This is a 1.83:1 → 1.90:1
   trim that removes background only; the logo, maple leaf, wordmark, tagline and CTA stay inside the frame.
5. Point all seven metadata references at the new file with true 1200 × 630 declaration.
6. Add `__tests__/feature-image-social-sharing.test.js` guarding formats, widths, `sizes`, intrinsic dimensions,
   share-image bytes/dimensions, and the absence of the old share path in `app/**`.

## Files

| File | Change |
| --- | --- |
| `public/assets/crystal-ball-pedestal-420w.{avif,webp}` | New width candidates. |
| `public/images/lucky-meter-night-sky-{640w,1024w}.{avif,webp}` | New width candidates. |
| `public/NGC4216_crawford-{1280w,1920w}.{avif,webp}` | New width candidates. |
| `public/luckypickcanada-share-1200x630.jpg` | New 1200 × 630 share image. |
| `app/components/CrystalBall/CrystalBall.tsx` | `srcSet`/`sizes` on both sources. |
| `components/DailyResonance.tsx` | `srcSet`/`sizes` on the AVIF source; WebP fallback gains `sizes`. |
| `app/lucky-card-reveal.js` | `srcSet`/`sizes` on three sources; intrinsic `width`/`height`. |
| `app/layout.js`, `app/map/page.js`, `app/crystal-ball/page.js`, `app/lucky-meter/page.js`, `app/reveal/page.tsx`, `app/lucky-map-of-canada/page.js`, `app/where-luck-has-been-found-in-canada/page.js` | Share-image URL only. |
| `__tests__/feature-image-social-sharing.test.js` | New regression guard. |
| `__tests__/lucky-card-reveal-presentation.test.js`, `tests/visual/crystal-ball.spec.ts` | Updated expectations for the responsive `srcSet`. |
| `specs/112-feature-image-social-sharing-optimization/**`, `.specify/feature.json`, `memory-bank/**` | Task artifacts and record. |

Not changed: `next.config.mjs`, `wrangler.jsonc`, `package.json`, `pnpm-lock.yaml`, `.docs/**`, the sitemap,
routes, copy, animations, audio, Stripe/Neon/Turnstile code.

## Verification plan

| Check | Method |
| --- | --- |
| Derivative dimensions/bytes | `sharp` metadata on every new and existing file, before/after table. |
| Delivered markup | Local production build + `next start`; `curl` the four routes and inspect `<picture>`/`srcSet`. |
| Real browser delivery | Managed cloud browser: read `currentSrc` and `naturalWidth`/`naturalHeight` per route at desktop and mobile widths. |
| Fallback behaviour | Force the JPEG/PNG candidates by restricting the browser's accepted formats and confirm the original file is served. |
| Share metadata | Rendered `og:image`, `og:image:width`, `og:image:height`, `twitter:image` on every route. |
| Regression tests | `pnpm exec vitest run __tests__/feature-image-social-sharing.test.js` and the touched existing tests. |
| Repository gate | `./freebuff-verify.sh` (Spec Kit gate, TypeScript, build, refresh-docs). |
| Build size | measured `.next` + `public` bytes versus 495 MB. |

## Risks and mitigations

- **Artwork altered**: derivatives are resized from the committed originals only; originals stay byte-identical
  and the diff excludes them.
- **Wrong candidate selected**: `sizes` mirrors the real CSS box (420 px cap / 100vw / fill), so the browser
  never picks a candidate smaller than the display needs at DPR 1.
- **Visual regression from the crop**: the share image is viewed in the browser before and after; the crop only
  removes background bands.
- **Platform preview caching**: stated as an owner-side action, not claimed here.
