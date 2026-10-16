# Implementation Plan — Crystal Ball Leaf-First Fortune Reveal

## Technical context
- Next.js App Router / React client component, TypeScript, CSS Modules.
- Main component: app/components/CrystalBall/CrystalBall.tsx.
- Styles: app/components/CrystalBall/CrystalBall.module.css.
- Existing leaf drawing: app/components/CrystalBall/GoldenLeaf.tsx.
- E2E coverage: tests/visual/crystal-ball-interactions.spec.ts.

## Sequence
1. Keep the existing loading glow during the async fortune request.
2. On a valid answer, show the answer panel with the accessible full answer, pause visible character reveal, and run a short gold pre-reveal pulse.
3. Measure the artwork and panel in viewport coordinates. Animate a separate GoldenLeaf SVG clone between those positions; never mutate or hide the original image decoration.
4. When the flight animation ends, transition to the existing character-by-character reveal, then the existing completion pulse.
5. When reduced motion is preferred, skip the decorative flight and typewriter.
6. Extend Playwright to assert the flash → leaf → text order and verify a second question in the same visit.

## Constraints
- No dependencies, API changes, database work, or new raster assets.
- Preserve the source artwork, current fortune presentation, responsive layout, screen-reader full text, and session readings.
- Build and run repository verification through available CI. The available connection exposes GitHub APIs but does not provide a repository shell for local setup scripts or local size measurement.
