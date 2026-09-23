# Active Context


## Current Work
- 2026-09-23: Replacing the Lucky Card Reveal post-flip dissipation with a gravity-driven molten-plasma runoff sequence.
- The post-flip effect is intentionally modeled as viscous plasma attached to the card edges and lower rim, with downward drips, stretched streams, detached droplets, sparse sparks, and cooling embers.
- Removed the previous perimeter/afterglow-ring rendering model; the new effect contains no closed perimeter path, expanding ring, shockwave, or orbital loop.
- Extended the final reveal lifetime to 5.2s total from final-hit start: 1.8s flip/settle plus 3.4s molten dissipation.
- The effect is rendered through the existing foreground canvas only after the card flip, avoiding duplicate screen-composited rendering and unnecessary mobile GPU work.
- Particle positions are initialized once from the measured card bounds so they remain stable during the dissipation instead of changing randomly every animation frame.
- Tier-specific material colors remain tied to Standard, Premium, and Flagship while sharing the same physical runoff behavior.
- No card artwork, tier selection logic, collection persistence, countdown, share behavior, or navigation behavior is intentionally changed.
- Verification status: source/diff inspection completed; repository CI/build and final visual re-review remain required before claiming completion.
- Rebuilt Lucky Card Reveal post-flip burnout to accurately reflect 3-stage visual storyboard (Ignition, Active Burnout, clean Dissipation).
- Refined metallic tier colors per governance (Standard: Bronze/Gold, Premium: Pewter/Silver, Flagship: Rich Gold).
- Removed persistent `tier-glow` CSS application from card front to ensure perfectly clean dissipation with no lingering halo or grid artifacts.
- Synced explosive/superheated spark colors to tier properties to prevent Premium from receiving warm orange sparks.
- Previous: Adjusted `FINAL_HIT_DISSIPATE` duration to 4.8s to fully capture the 3-second visual burnout phase cleanly.
- Improved cinematic post-flip burn sequence in `app/lucky-card-reveal.js` across all tiers.
- Restored color dominance in the plasma/beam effects by reducing white core thickness and increasing colored outer glow bloom and line width.
- Added organic stretching and gravity drip effects to the plasma breakup sequence by modifying control points.
- Refactored spark particle behavior to include explosive outward/upward arcs mixed with drifting heat embers, varied colors (tier color + superheated gold/orange), and gravity effects.
- Maintained mobile performance constraints by leveraging the existing canvas context without adding DOM nodes or complex physics simulation loops.
- Removed 'opacity-70' on NGC4216_crawford.jpg in app/lucky-card-reveal.js to eliminate shadowy overlay.
- Added '-ms-overflow-style: none;' and 'scrollbar-width: none;' and removed '(hover: none)' requirement from the max-width: 768px scrollbar media query in themes/default/default.css to successfully hide the visible mobile scrollbar.
- Implemented cinematic continuous beam architecture in `app/lucky-card-reveal.js`.
- Replaced disconnected arc/bezier Canvas drawing with a unified `drawContinuousBeam` function that smoothly transitions from approach curve into a tight wrapping radius.
- Re-synchronized Framer Motion `x/rotateZ` card shaking to strictly align with contact (`P_WRAP`) and stop exactly on release (`P_SHAKE`).
- Engineered tension and physical launch tracking on the final hit, mirroring the Framer Motion flip timeline (y: -60 launch at F_FLIP_TIME) via shared constants and approximated easing curves.
- Enhanced residual energy to function as a unified fluid runoff over the card rather than disjointed floating arcs.
- Polished the cinematic visual progression of the Lucky Card Reveal component (`app/lucky-card-reveal.js`).
- Fetched and applied a new deep space cinematic background (`NGC4216_crawford.jpg`) for the Lucky Card Reveal.
- The new background image fills the entire viewport and remains visible alongside the interactive reveal canvas.

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
