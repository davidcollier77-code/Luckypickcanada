# Active Context

## Current Work
- 2026-09-23: Completed the investigation task "Homepage Visual Quality + Scroll Performance Investigation".
- Verified root causes for the reported lack of "1080p-class" sharpness (missing `devicePixelRatio` scaling on the canvas) and scroll jank (extreme use of CSS `filter: blur` and `backdrop-filter: blur`).
- Prepared a detailed findings report. No code changes were implemented, respecting the investigation-only boundary.

## Next Steps
- Await approval of the investigation report.
- An upcoming task will authorize the implementation of the proposed fixes (DPR scaling, CSS filter optimization).


## 2026-09-24 - Post-Flip 3D Electrical / Volumetric Cinematic Polish
- Applied true 3D Z-axis projection mathematics to `app/lucky-card-reveal.js` without relying on DOM manipulation.
- Refined `drawMoltenBurst` so edge explosions pop outwards (`zPop`) and adjusted `drawEnergyArc` so energy strands blow away from the card surface during dissipation (`zBlow`).
- Introduced continuous 3D depth to `drawDroplet` splatters and pushed background pools deeper into the z-plane (`zPush`).
- Choreographed Framer Motion with the physical `rotateX`/`rotateZ` tumble during the reveal throw followed by the existing post-flip motion.
- Improved the post-final-card-flip electrical-field effect across Standard, Premium, and Flagship into a more convincing 3D cinematic energy event.
- Replaced plain sine-wave arc motion with procedural turbulence (`tNoise1`, `tNoise2`), parallax drift (`parallaxX`, `parallaxY`), Z-depth scaling, and branching secondary tendrils.
- Updated `surfaceFilaments` with layered noise and 3D outward projection.
- Upgraded the inner electrical core with layered white/cyan screen-blended passes.
- Replaced full-screen gradient fills with tightly bounded `fillRect` passes to preserve mobile performance while targeting maximum practical fidelity within 1080p.
- Automated verification passed (`./jules-verify.sh` and `pnpm run build`); independent visual regression review remains pending.

## Completed Work
- Reduced regular hits by one across all tiers (Standard: 3, Premium: 4, Flagship: 5).
- Historical: The prior 3D plasma burnout implementation was documented as lasting ~2.5s post-flip; superseded by the current 4.2s post-flip crawl.

- Repaired `lucky-card-reveal.js` to dispatch `unlockedCardsUpdated` and persist to `unlockedCards`.
- Historical: The prior implementation set `FINAL_HIT_DISSIPATE` to 4.3s; superseded by the current 6.0s total final-hit lifetime (4.2s post-flip).
- Replaced flat `arc` based plasma with 3D volumetric bezier streams.
- Updated CSS text-shadow on `h1` in `themes/default/homepage.css` to fix readability.
- Refined beam and residual energy visuals in `app/lucky-card-reveal.js`.

## 2026-09-22 Updates
- Fixed the wording on the Lucky Card reveal screen to read "Today's Lucky Card" and "A new Lucky Card awaits your collection."
- Improved readability of the text against the cinematic background using backdrop blur, adjusted text shadows, and a subtle border container to provide visual separation.
- Updated button styles for 'View Collection' and 'Return to Home' to use golden treatment.

## 2026-09-22 Updates (Mobile Polish)
- Removed the translucent UI overlay container behind "Today's Lucky Card" on the Reveal page to improve readability and visual integration with the cinematic background.
- Modified `themes/default/default.css` to hide the custom `-webkit-scrollbar` on mobile devices (`max-width: 768px`) to ensure the page is clean, while retaining standard touch scrolling.

- 2026-09-23: Fixed `drawRimFlow` so each rim flow progressively reveals only the traversed portion of the card edge over its configured duration; tier colors, thickness, glow, and existing VFX timing remain unchanged.

- 2026-09-23: Refined the final post-flip VFX into a three-stage sequence: brief electric edge-wrap, short molten snap/pop bursts, then two attached lower-edge drips that grow from the card edge before detaching and fading. Shortened surface energy timing and anchored splatter/burst sources to the card perimeter so particles no longer appear disconnected from the molten event.

## 2026-09-23 - Polished final Lucky Card Reveal Cinematic
- Addressed task #1: Enhanced the existing Lucky Card Reveal cinematic at the final reveal/payoff moment.
- Refined `app/lucky-card-reveal.js` by slowing the hero settle `duration: 1.2`, improving tension grab scale/y coordinates, and adding a slight `filter: brightness(1.5)` pulse during the throw.
- The molten/afterglow dissipation was eased using a `smoothstep` ease-in-out calculation for a more natural release.
- Protected scopes (artwork, audio, tiers, hit counts) were respected.
- Build passed.

