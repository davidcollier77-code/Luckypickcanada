# Tasks — Crystal Ball Build Repair

- [x] Inspect the Cloudflare syntax error and compare the component with the last valid version.
- [x] Restore the picture wrapper and valid AVIF/WebP/PNG fallback structure.
- [x] Remove duplicate glow markup and duplicated JSX properties.
- [x] Restore question input state updates and the Seek Fortune click handler with existing audio feedback.
- [x] Review the repaired component markup and changed source.
- [ ] Run `pnpm exec playwright test tests/visual/crystal-ball-interactions.spec.ts`.
- [ ] Run `./jules-verify.sh`.
- [ ] Run the production build and measure build size against the 495 MB limit.
- [ ] Verify the resulting Cloudflare build succeeds.
