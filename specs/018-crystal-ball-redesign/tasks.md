# Crystal Ball Redesign Tasks

- [x] [CBR-01] [US1] Inspect the merged artwork, source component, styling, and visual test; confirm the wrong console image is the primary illustration.
- [x] [CBR-02] [US1] Replace the raster artwork block in `app/components/CrystalBall/CrystalBall.tsx` with `CrystalBallArtwork`.
- [x] [CBR-03] [US1] Add `app/components/CrystalBall/CrystalBallArtwork.tsx` with the jeweled orb and ornate pedestal on a transparent canvas.
- [x] [CBR-04] [US1] Update `app/components/CrystalBall/CrystalBall.module.css` so brand text sits on the illustrated inset nameplate.
- [x] [CBR-05] [US1] Update `tests/visual/crystal-ball.spec.ts` to assert the intended emblem, jewel, pedestal, and responsive geometry.
- [ ] [CBR-06] [US1] Run `pnpm test`, `pnpm run build`, `./jules-verify.sh`, and Playwright visual checks; inspect desktop and mobile pages.
- [ ] [CBR-07] [US1] Measure build size, reconcile the final diff, then update the feature completion state.
