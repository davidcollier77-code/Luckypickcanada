# Tasks — Crystal Ball Build Repair

- [x] Inspect the Cloudflare syntax error and compare the component with the last valid version.
- [x] Restore the picture wrapper and valid AVIF/WebP/PNG fallback structure.
- [x] Remove duplicate glow markup and duplicated JSX properties.
- [x] Restore question input state updates and the Seek Fortune click handler with existing audio feedback.
- [x] Review the repaired component markup and changed source.
- [x] Make the Crystal Ball visual interaction test deterministic by mocking `/api/oracle` with a delayed successful response; rerun and confirm it passes before marking verification complete.
- [ ] Run `pnpm exec playwright test tests/visual/crystal-ball-interactions.spec.ts` and confirm it passes.
- [ ] Run `./jules-verify.sh`.
- [ ] Run the production build and measure build size against the 495 MB limit.
- [ ] Verify the resulting Cloudflare build succeeds.
