# Active Context


## Current Work
- 2026-09-23: Rebuilt the Lucky Card Reveal post-flip effect as a tier-colored molten-plasma crawl across the front face.
- Post-flip dissipation is 4.2s after the 1.8s final flip/settle, for a 6.0s final-hit lifetime.
- Four primary and six secondary molten streams originate at the top edge, visibly travel down the upright card, and continue below the bottom edge as runoff.
- The molten material uses Standard copper/bronze, Premium silver/pewter, or Flagship rich-gold tones; the electrical filaments remain blue across all tiers.
- Added lower-rim pools, falling molten droplets, side runoff, blue electrical crawl, hot sparks, longer-lived embers, and a deliberate final smolder-out before the canvas becomes fully clean.
- The post-flip renderer remains foreground-canvas-only and uses stable measured-card coordinates; no DOM particle system or new physics dependency was introduced.
- The card stays upright during the effect; no post-flip shake was added.
- Standard, Premium, and Flagship hit counts remain 3, 4, and 5 total hits respectively.
- Card artwork, tier selection, collection persistence, countdown, sharing, navigation, and the existing final flip behavior remain unchanged.
- Current verification status: source/diff inspection completed; CI/build verification and independent visual re-review remain pending.

## Recent Changes
- Downloaded `NGC4216_crawford.jpg` via standard CLI (`curl`/python script).
- Modified `app/lucky-card-reveal.js` to insert a fixed full-screen `next/image` background.
- Verified build (`pnpm run build`) and tests (`pnpm test`).
- Executed `./jules-verify.sh` successfully.

## Completed Work
- Reduced regular hits by one across all tiers (Standard: 3, Premium: 4, Flagship: 5).
- Replaced detached 2D afterglow ring with a physically attached, organic 3D plasma burnout effect on the card geometry in `app/lucky-card-reveal.js` (burnout lasts ~2.5s post-flip).

- Repaired `lucky-card-reveal.js` to dispatch `unlockedCardsUpdated` and persist to `unlockedCards`.
- Changed `FINAL_HIT_DISSIPATE` to 4.3s.
- Replaced flat `arc` based plasma with 3D volumetric bezier streams.
- Updated CSS text-shadow on `h1` in `themes/default/homepage.css` to fix readability.
- Refined beam and residual energy visuals in `app/lucky-card-reveal.js`.

## Next Steps
- Run repository verification and independent visual re-review of the three-tier post-flip dissipation before final approval.

## 2026-09-22 Updates
- Fixed the wording on the Lucky Card reveal screen to read "Today's Lucky Card" and "A new Lucky Card awaits your collection."
- Improved readability of the text against the cinematic background using backdrop blur, adjusted text shadows, and a subtle border container to provide visual separation.
- Updated button styles for 'View Collection' and 'Return to Home' to use golden treatment.

## 2026-09-22 Updates (Mobile Polish)
- Removed the translucent UI overlay container behind "Today's Lucky Card" on the Reveal page to improve readability and visual integration with the cinematic background.
- Modified `themes/default/default.css` to hide the custom `-webkit-scrollbar` on mobile devices (`max-width: 768px`) to ensure the page is clean, while retaining standard touch scrolling.
