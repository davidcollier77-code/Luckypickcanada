# Tasks — Repository Cleanup Audit (Feature 030)

## Completed Tasks

- [x] Read governance documentation: `AGENTS.md`, `.jules/deep-dive.md`, `.docs/manifest.json`, `memory-bank/projectBrief.md`, `memory-bank/activeContext.md`, `.specify/memory/constitution.md`.
- [x] Enumerate `public/` image assets and trace references in source files.
- [x] Enumerate `public/` audio assets and trace references in source files.
- [x] Run `pnpm dlx depcheck` and cross-verify results with manual grep.
- [x] Identify git-tracked stale artifacts (`.orig`, `.rej` files) using `git ls-files`.
- [x] Measure build size using `du -sk .next public/` and verify against 495 MB constraint.
- [x] Classify findings as CONFIRMED UNUSED, LIKELY UNUSED, or DO NOT REMOVE.
- [x] Document findings and build size in `PR_SUMMARY.md`.
- [x] Identify governance conflict: `.jules/deep-dive.md` forbids audit-only PRs; Master Work Request #1 explicitly overrides with strict audit-only scope. Conflict reported in `PR_SUMMARY.md`.

## Pending Tasks (future implementation PR)

- [ ] Verify CONFIRMED UNUSED assets with bundler-based analysis (`next-bundle-analyzer` or `webpack-bundle-analyzer`) before deletion.
- [ ] Verify NGC4216 image variants are not used as `<picture>` fallbacks or in Next.js image loader configuration before removal.
- [ ] Remove `components/DailyResonance.tsx.orig`, `components/DailyResonance.tsx.rej`, and `app/lucky-card-reveal.js.orig` after verifying the active resolved source files are correct.
- [ ] Untrack and delete `copilot_image_1785515250260.jpeg` from the repository root.
- [ ] Remove unused audio files: `public/yodguard-lightning-magic-3-378649.mp3`, `public/freesound_community-shaking-coins-105774.mp3`.
- [ ] Remove unused image files: `public/a_polished_high_detail_card_illustration_poster_i.webp`, `public/a_polished_high_detail_card_illustration_poster_i.png`.
- [ ] Remove unused npm dependencies: `html2canvas`, `lucide-react`.
