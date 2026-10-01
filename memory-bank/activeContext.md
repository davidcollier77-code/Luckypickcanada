## 2026-10-01 — Homepage Visual Baseline Repair

- Verified the post-merge Visual QA failure on the homepage visual-regression suite: the three viewport screenshot comparisons failed consistently on desktop, mobile 390, and mobile 412, while all three ambient-star tests passed.
- Verified the mismatch was caused by the intentional PR #1326 hero artwork sizing change making the committed baselines stale; the failed-run actual screenshots were identical across retries.
- Regenerated the three approved homepage viewport baselines from the current merged implementation using the repository Playwright configuration without changing the screenshot diff threshold or test logic.
- Re-ran the complete Playwright suite after regeneration; all six homepage visual tests passed in GitHub Actions run 36860009779.
- Temporary baseline-refresh workflow was used only to create and verify the new baselines, then removed in the same commit so the final branch contains no new CI behavior.
- Preserved the hero implementation, Milky Way background, star canvas, shooting stars, and existing test thresholds.

## 2026-10-01 — Homepage Hero Artwork Layout Repair

- Verified the current foreground hero artwork was being constrained by an 800px maximum-width wrapper and a 4:3 mobile / 16:9 desktop container while the image itself uses `object-contain`.
- Implemented the minimal layout-only repair on branch `fix/homepage-hero-image-sizing`: the hero content stack now has a fixed `100svh` height with a shrink-safe flex center, the artwork wrapper expands to 1100px, and `.hero-image-container` is sized from viewport height (`clamp(420px, 72svh, 720px)`) rather than a landscape aspect ratio.
- Mirrored the hero CSS change in `themes/default/homepage.css` and `public/themes/default/homepage.css` because the application explicitly loads the public theme index and that index imports the mirrored homepage stylesheet.
- Preserved the existing hero PNG path, Milky Way background, navigation, page content below the fold, star canvas, shooting stars, accessibility behavior, and all non-layout functionality.
- The PNG transparency/checkerboard issue is explicitly outside this task and remains unchanged for the later asset replacement.
- Verification status: source-level reconciliation complete; browser/build verification remains required on the pull request because a local repository checkout was unavailable in the execution environment.

## 2026-09-29 — Homepage reduced-motion canvas resize repair

- Verified that resizing clears the canvas while reduced motion has no recurring frame to repaint it.
- Updated the resize listener to redraw once after resizing for reduced motion; normal motion retains its existing animation loop.
- A focused effect check passed for both motion settings and listener cleanup. CodeRabbit CLI review was unavailable because review is disabled for this task.

## 2026-09-27 — Homepage Sky Layer Repair (In Progress)

- Verified the deployed homepage retained a full-screen `bg-slate-950` foundation while the photographic homepage backdrop remained at `z-index: -30`.
- Verified the existing `HomePage.js` canvas already provides ambient star twinkle and randomized shooting-star effects; those effects are intentionally preserved unchanged.
- Implemented a scoped background-layer repair on branch `fix/homepage-sky-background-layer`: the legacy global background layer is now identifiable as `.homepage-background-foundation`, and becomes transparent only when the homepage photographic backdrop is present.
- Scoped the homepage body background to transparent while retaining the legacy dark foundation on non-homepage routes.
- No image assets were deleted or replaced; no homepage content, card artwork, audio, interactions, or other functionality was changed.
- Verification of the production build and runtime rendering remains pending.

## 2026-09-27 — Homepage Cinematic Night-Sky + Visual Polish (PR #1290)

- Replaced the homepage's synthetic four-layer aurora background foundation with a fixed, sky-only photographic Milky Way backdrop selected for an overhead/zenith-style composition with no landscape or horizon.
- Preserved the existing viewport Canvas atmosphere: ambient stars, independent twinkle behavior, and randomized shooting-star events with tails. Only the presentation layer was adjusted.
- Added a scoped homepage visual polish pass covering navigation glass, logo presentation, hero title depth, content-card surfaces, community banner/image framing, CTA treatment, suggestion/about surfaces, and lower-page SEO presentation.
- Removed the competing homepage synthetic pseudo-background layers so the photograph acts as the environmental foundation instead of stacking multiple simulated skies.
- Preserved reduced-motion handling and did not change audio, dependencies, homepage functionality, reset/countdown behavior, collections, sharing, payment, database, authentication, deployment configuration, or protected files.
- Verification: GitHub Actions run 36344468480 passed Next.js build, OpenNext build, compiled Tailwind verification, worker/assets checks, Wrangler validation, and Git status.
- Amazon Q review reported no blocking defects. CodeRabbit status was success; its repository comment indicated automatic review is disabled for this repository and a manual trigger is available.
