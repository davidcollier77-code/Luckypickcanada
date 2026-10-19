# Research: Shared Sky Background Regression

## Inspected Evidence

- PR #1532 changed app/layout.js by removing its direct import of ../themes/default/index.css.
- The same PR added @import "../themes/default/index.css"; after @import "tailwindcss"; in app/globals.css.
- themes/default/index.css imports the default, effects, homepage, header, hero, and map stylesheets.
- themes/default/homepage.css defines .homepage-sky-backdrop (fixed positioning, z-index -30, and a layered image set using crystal-ball-bg-desktop.webp/.avif/.jpeg) and route-specific transparency/fallback-foundation rules.
- The homepage, /crystal-ball, and /map routes each render .homepage-sky-backdrop.
- The user video shows a visual difference in the shared-sky surfaces while Lucky Meter and Card Reveal appear substantially less affected.

## Findings

- **VERIFIED**: The import order changed in the last homepage CSS performance update. The source background rules and backdrop markup still exist.
- **HYPOTHESIS (strong)**: Import placement/bundling altered the theme's application/cascade on some routes; the timing and affected surfaces correspond to rules in the theme stylesheet.
- **VERIFIED remediation choice**: Return to the previously working theme-first stylesheet import arrangement and add computed-style assertions for all three routes.
- **UNKNOWN until CI**: Whether browser screenshots and all full build/governance checks pass on this repaired commit. This environment cannot complete a local Git checkout because resolving github.com fails.

## References

- app/layout.js
- app/globals.css
- themes/default/index.css
- themes/default/homepage.css
- app/page.js
- app/crystal-ball/page.js
- app/map/page.js
- tests/visual/homepage.spec.ts
- Merged PR #1532, Optimize Homepage CSS Delivery
