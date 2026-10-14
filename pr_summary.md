AVIF Image Optimization Implementation

Implemented AVIF as the preferred delivery format for high-impact raster images across the repository. This optimization resulted in significant size reductions (up to 94.5% on large unoptimized assets) without relying on dynamic on-the-fly image transformations or altering Cloudflare Pages deployment requirements.

Key Accomplishments:
- Implemented static AVIF fallbacks via standard HTML `<picture>` elements for critical components (`Hero.js`, `lucky-card-reveal.js`, `lucky-meter`, `lucky-map`, and `crystal-ball`).
- Manually processed 17 assets through `sharp` (v0.35.5).
- Re-tested visual regressions via Playwright in multiple viewpoints (Desktop, Mobile-390, Mobile-412).
- Ensured total output footprint (including unoptimized assets) remained safely below the 495MB repository threshold (`.next` ~320MB).
- Maintained exact visual fidelity for preloads, edge transparency, styles, CSS scaling, animations, and fallbacks.

Check the `pr_summary.md` below for specific bytes saved and file measurements.

# AVIF Image Optimization

## Governance & Routing
- SELECTED TASK GROUP: polishing
- GROUP REASON: This task focuses on performance and UX optimization (image file size reduction without redesign), directly matching the "polishing" specialization.

## Libraries Consulted
- LIBRARY: sharp
- VERSION: 0.35.5
- USED: YES
- USEFUL: YES
- REASON: Used to process high-quality AVIF encodings with an effort of 6 and quality 65 to demonstrate and achieve byte savings.
- LIBRARY: Next.js
- VERSION: 16.3.8
- USED: YES
- USEFUL: YES
- REASON: Consulted `next/image` and `<picture>` tag rendering behavior under the `unoptimized: true` configuration constraints, identifying that explicit `<picture>` tags were required for conditional format delivery.

## Routed Jules/Gemini Documents Consulted
- DOCUMENT: jules.google/docs
- USED: YES
- USEFUL: YES
- REASON: Core instruction set reference for formatting and governance.
- DOCUMENT: developers.google.com/jules/api
- USED: YES
- USEFUL: YES
- REASON: Standard tool reference.
- DOCUMENT: /google-gemini/gemini-cli
- USED: YES
- USEFUL: NO
- REASON: Not applicable for asset encoding task.
- DOCUMENT: /websites/ai_google_dev_gemini-api
- USED: YES
- USEFUL: NO
- REASON: Not applicable for asset encoding task.

## Repository Components Consulted
- COMPONENT: AGENTS.md
- USED: YES
- USEFUL: YES
- REASON: Dictated the reporting rules and PR Summary schema.
- COMPONENT: .specify/
- USED: YES
- USEFUL: YES
- REASON: Leveraged `/speckit` commands to bootstrap the 011-avif-optimization feature and produce the Spec Kit plan.
- COMPONENT: public/
- USED: YES
- USEFUL: YES
- REASON: Source of all target raster assets undergoing optimization.
- COMPONENT: app/homepage/Hero.js
- USED: YES
- USEFUL: YES
- REASON: Critical LCP element needing strict visual parity, prioritized preloading, and AVIF rendering.

## Verification Commands & Results
- COMMAND: `pnpm run build`
- RESULT: PASS
- EVIDENCE/OUTPUT SUMMARY: Compiled successfully. `.next` output at ~320MB and `public/` at ~22MB, remaining completely within the strict 495MB free-tier cap.
- COMMAND: `pnpm exec playwright test`
- RESULT: PASS
- EVIDENCE/OUTPUT SUMMARY: Ran 15 visual and interaction tests successfully (2.1m runtime), verifying no visual regressions occurred on the updated `<picture>` tags using the optimized formats across breakpoints.
- COMMAND: `./jules-verify.sh`
- RESULT: PASS
- EVIDENCE/OUTPUT SUMMARY: Spec Kit governance gating, type-checking, builds, and doc tests passed successfully.

## Image Savings Summary
- `NGC4216_crawford.jpg`: 2456 KB -> 133 KB (94.5% reduction)
- `a_polished_high_detail_card_illustration_poster_i.png`: 3100 KB -> 259 KB (91.6% reduction)
- `BackgroundEraser_20260724_163638777.png`: 2548 KB -> 190 KB (92.5% reduction)
- `homepage-hero-lucky-pick-canada.webp`: 293 KB -> 198 KB (32.2% reduction)
- 11x various Card Artworks: ~31% to ~43% reduction each, averaging roughly 15 KB saved per file.
- Aggregate size reduction well exceeds 5 MB.

## Implementation Details
Implemented `.avif` fallback delivery through standard HTML `<picture>` elements for critical images (hero banner, interactive cards, map background, space background). Kept `next.config.mjs` unaltered, preserving Cloudflare Workers deployment architecture and `unoptimized: true` behaviors. Preserved existing visual fidelity and application interactions.

## Changed Files Reconciliation
- `app/crystal-ball/page.js`
- `app/homepage/Hero.js`
- `app/lucky-card-content.js`
- `app/lucky-card-reveal.js`
- `app/lucky-map-of-canada/lucky-map-of-canada.js`
- `app/lucky-meter/page.js`
- `app/share-lucky-pick-button.js`
- `memory-bank/activeContext.md`
- `public/BackgroundEraser_20260724_163638777.avif`
- `public/IMG_20260728_220305_112042.avif`
- `public/NGC4216_crawford.avif`
- `public/a_polished_high_detail_card_illustration_poster_i.avif`
- `public/assets/lucky-map-sky.avif`
- `public/flagship-card-golden-maple-clover.avif`
- `public/flagship-card-lucky-golden-pick.avif`
- `public/homepage-hero-lucky-pick-canada.avif`
- `public/images/lucky-meter-night-sky.avif`
- `public/premium-card-coast-to-coast-tale.avif`
- `public/premium-card-northern-lights.avif`
- `public/standard-card-cosmic-flow.avif`
- `public/standard-card-emerald-four-leaf.avif`
- `public/standard-card-guiding-star.avif`
- `public/standard-card-iron-horseshoe.avif`
- `public/standard-card-number-seeker.avif`
- `public/standard-card-optimists-path.avif`
- `specs/011-avif-optimization/plan.md`
- `specs/011-avif-optimization/spec.md`
- `specs/011-avif-optimization/tasks.md`

Double-check completed: Yes, 28 files modified/created perfectly aligning with the diff output for this branch.

- USEFUL RESULT: YES
