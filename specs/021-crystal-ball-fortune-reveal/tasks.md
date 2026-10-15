# Tasks — Crystal Ball Fortune Reveal Enhancement

- [ ] T001 Define golden maple leaf inline SVG inside `CrystalBall.tsx` or as a new component without altering `MapleLeafLogo.tsx`.
- [ ] T002 Implement progressive word reveal logic inside `CrystalBall.tsx` along with dynamic timing calculation based on word count.
- [ ] T003 Update `CrystalBall.tsx` markup for accessibility (aria-hidden for animated words, sr-only for full text).
- [ ] T004 Implement scroll-into-view logic when a question is submitted.
- [ ] T005 Update `CrystalBall.module.css` to handle the golden maple leaf animation, progressive word fade-in, and completion pulse.
- [ ] T006 Ensure timeouts and state reset correctly on repeated submissions.
- [ ] T007 Run visual QA via Playwright (`tests/visual/crystal-ball-interactions.spec.ts`).
- [ ] T008 Run `./jules-verify.sh`.
- [ ] T009 Run `pnpm run build` and measure build size.

- [ ] T010 Repair malformed `fortuneWords.map` JSX in `app/components/CrystalBall/CrystalBall.tsx` by restoring the opening `<span>` and removing the duplicate `key` attribute.
- [ ] T011 Run `./jules-verify.sh`, `pnpm run build`, and the OpenNext Cloudflare build in CI; confirm the build-size limit remains under 495 MB.

- [ ] T012 Repair malformed `app/components/CrystalBall/GoldenLeaf.tsx` JSX while preserving the original gold gradient and maple-leaf path data; use unique `useId()` gradient references, then rerun production build and all governance/Cloudflare checks.
