# Crystal Ball Redesign Tasks

- [x] [CBR-01] [US1] Inspect the merged artwork, component, styling, and visual test; confirm the wrong console image is the primary illustration.
- [x] [CBR-02] [US1] Prepare a transparent Crystal Ball foreground asset matching the supplied target.
- [x] [CBR-03] [US1] Switch `app/components/CrystalBall/CrystalBall.tsx` to AVIF, WebP, and PNG sources.
- [x] [CBR-04] [US1] Tune `app/components/CrystalBall/CrystalBall.module.css` to position the glow and brand text on the crystal orb and inset pedestal nameplate.
- [x] [CBR-05] [US1] Update `tests/visual/crystal-ball.spec.ts` to check raster loading, source order, dimensions, glow geometry, question input, and navigation.
- [ ] [CBR-06] [US1] Run `pnpm test`, `pnpm run build`, `./jules-verify.sh`, and responsive visual tests; inspect rendered mobile and desktop pages.
- [ ] [CBR-07] [US1] Measure build size and verify it remains under the 495 MB hard cap, reconcile the final diff, and update task status.
