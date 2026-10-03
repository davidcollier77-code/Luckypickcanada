## 2026-10-03 — PR #1347 Review Fix — Explore Your Luck Scroll Reliability
- Repaired the rAF scroll loop so each frame uses explicit `behavior: 'instant'` scrolling, preventing the global `scroll-behavior: smooth` rule from restarting a native animation on every frame.
- Moved the 10-second cooldown initialization until after `#lucky-meter` is confirmed to exist, so a missing target does not unnecessarily lock the control.
- Added user-interruption handling for wheel, touchstart/touchmove, and scrolling keyboard input; interruption cancels the rAF loop, clears particles, and returns scroll control to the user.
- Cleaned formatting and stale test comments, replaced fixed cooldown sleeps with polling, and changed the early-scroll assertion to match the intended synchronized animation.
- Added a desktop regression test proving keyboard scroll input can interrupt the synchronized animation.

## 2026-10-03 — PR #1347 Review Fix — Explore Your Luck Scroll Reliability
- Repaired the rAF scroll loop so each frame uses explicit `behavior: 'instant'` scrolling, preventing the global `scroll-behavior: smooth` rule from restarting a native animation on every frame.
- Moved the 10-second cooldown initialization until after `#lucky-meter` is confirmed to exist, so a missing target does not unnecessarily lock the control.
- Added user-interruption handling for wheel, touchstart/touchmove, and scrolling keyboard input; interruption cancels the rAF loop, clears particles, and returns scroll control to the user.
- Cleaned formatting and stale test comments, and replaced fixed cooldown sleeps in repeat-activation checks with polling.
- Added a desktop regression test proving keyboard scroll input can interrupt the synchronized animation.

## 2026-10-02 — Explore Your Luck Interaction Polish & Spam Protection
- **Hit Area Fix:** Increased the `max-h` constraint on the Explore Your Luck button wrapper from `160px` to `300px` (`max-h-[300px]`) to ensure the invisible touch target accurately aligns over the higher golden chevrons in the responsive background image.
- **Particle Refinement:** Adjusted the `activateExplore` function to generate exactly 6 maple leaves and 12 confetti particles. Increased particle velocity slightly for a wider, more satisfying burst.
- **Scroll Sync:** Replaced `element.scrollIntoView` with a custom smooth scroll powered by `requestAnimationFrame`. This perfectly matches the 1.2s scroll duration with the 1.2s particle animation length, allowing particles to cleanly disappear the moment the scroll stops.
- **Spam Protection:** Added a 10-second interaction cooldown to the button using `useRef` checks, protecting it against duplicate or chaotic activations while an animation/scroll is running or cooling down.
- **Testing:** Playwright visual and interaction test suites have been successfully updated to await the new 10-second spam cooldown when verifying subsequent touch/click capabilities. Build sizes remain under the strict 495MB limit.

## 2026-10-02 — PR #1345 Documentation Integrity Correction

- Documentation integrity follow-up: removed the unsupported ExploreLuckButton 0px-width justification from the canonical PR Summary and preserved the verified footer repair.

## 2026-10-02 — PR #1345 Follow-up Repair Pass

- Re-verified the current PR #1345 head before modifying anything.
- Repaired the mobile footer and social-link touch-target technique in `app/layout.js`: mobile expansion is now `before:-inset-1` with `sm:before:-inset-2`, preserving the larger desktop target while leaving enough separation between adjacent mobile links.
- Added deterministic Chromium/Playwright coverage in `tests/visual/homepage.spec.ts` to verify footer/social pseudo-element hit areas remain enlarged and do not overlap on mobile, including midpoint hit-testing between adjacent links.
- Investigated the FAQ loading path. `FAQSection` remains a `next/dynamic` code-split import; no additional viewport-gating change was made because doing so would require a new placeholder/layout strategy and the existing implementation is already split from the main client bundle. No unsupported network-timing claim is made.
- Follow-up CI on commit `ce043c90203bb62efd23d9b085f9ba65f59df1c8`: Visual QA passed (11 executed tests, 1 desktop skip); OpenNext validation passed through build, CSS, worker/assets, Wrangler, and Git-status checks. The latest validation workflow does not emit a `.next` disk-size measurement; the most recent clean production build measurement already recorded on this PR is 305M, below the 495 MB hard maximum.

## 2026-10-02 — PR #1345 Review-Fix Pass (nav spacing, offer artwork, css preload)

- Verified the three open, unresolved review threads on PR #1345 (`app/homepage/Hero.js:23`, `app/homepage/HomePage.js:355`, `app/layout.js:57`) against the shipped theme CSS and the compiled Tailwind output before changing anything.
- Replaced the `p-2 -m-2` hit-area pattern on the primary nav links and every footer nav link with `relative before:absolute before:-inset-2 before:content-['']`, so the 0.5rem tap-area growth no longer widens the label-to-separator spacing.
- Reverted the three `<picture>` offer-artwork wrappers in `app/homepage/HomePage.js`; the theme rule `.homepage-offer-grid > .homepage-offer:nth-child(-n + 3) > .homepage-offer-image { display: none; }` already hides that artwork at every viewport.
- Removed the manual `<link rel="preload" as="style">` for the theme stylesheet. The `<link rel="stylesheet">` stays in the same head position so the no-FOUC guarantee is unchanged; Next.js/React still emits its own preload for that stylesheet.
- Verification: `pnpm test` 11/11 passed; `pnpm build` passed with a 306 MB production `.next` (495 MB hard limit); compiled CSS contains `.before\:absolute:before` and `.before\:-inset-2:before`; Chromium checks at 1440x900 and 390x844 confirm label-to-neighbour distance equals the container gap, link box width equals label width, padding/margin are `0px`, and probes 4px outside each box resolve to that link.
- `tests/visual/homepage.spec.ts` could not run locally because `playwright.config.ts` hardcodes port 3000, which an unrelated sandbox service already occupies; that suite must run in pull-request CI.
- Protected systems, Stripe, database, auth, deployment, environment variables, dependencies, `.docs/`, `AGENTS.md`, and `tailwind.config.js` were not modified.

## 2026-10-02 — Explore Your Luck Touch-Target Repair

- Verified the merged PR #1341 correctly delayed scrolling but its browser test activated the button directly, so it did not verify the real mobile tap hit area over the baked-in arrow artwork.
- Implemented a scoped repair in `app/homepage/ExploreLuckButton.js`: expanded the invisible lower-center touch target across the hero stage, kept normal scrolling behavior intact, removed the hover tooltip/visible hover cue, preserved the artwork, particle effect, and reduced-motion path, and re-queried `#lucky-meter` after the animation before scrolling.
- Extended `tests/visual/homepage.spec.ts` to verify the hit target is centered, reaches the hero-stage bottom edge, is large enough to cover the intended interaction zone, and uses a touch tap on mobile projects.
- Browser/build verification is being handled by the pull-request CI because a local repository checkout is unavailable in this environment.

## 2026-10-02 — Homepage PNG Replacement

- Replaced the homepage hero PNG with the provided replacement image.
- Updated references in app/homepage/Hero.js.
- Verified Playwright baselines and build limits.

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

## 2026-10-01 — Homepage Hero Image Transparency Cleanup

- Identified checkerboard artifacts embedded in the primary hero artwork (`public/file_00000000e2c481f6912a5c165bae46a4.png`).
- Developed a Python processing script (`fix_image_with_alpha.py`) to systematically remove the specific opaque and blended checkerboard pixels (grey shades around 140 and 190 RGB values) while preserving the opaque gold, maple leaf, red tones, and intended transparency bounds of the artwork.
- Processed the PNG and verified the removal of the baked-in grid remnants surrounding the text and inner emblem elements without damaging glowing effects or borders.
- Re-ran the Playwright visual test suite against the updated image and safely updated the known-good visual regression snapshots (`tests/visual/__screenshots__`) because the underlying pixel-level layout of the artwork intrinsically shifted to true transparency.
- Verified final build passes, verified size limits (`< 495 MB`), and ensured `./jules-verify.sh` succeeded without degrading the Next.js optimization pipeline.

## 2026-10-02 — Spec Kit v1.0.13 Update

- Verified the repository's recorded Spec Kit version was 1.0.4.
- Verified upstream Spec Kit v1.0.13 is newer and used it as the replacement baseline.
- Updated the managed Spec Kit scripts, templates, Jules generic command files, Spec Kit workflow, and version/manifests.
- Preserved the repository constitution and application/source files outside the requested Spec Kit scope.
- Second-pass verification confirmed the ten Jules Spec Kit command files contain no unresolved __SPECKIT_COMMAND_ placeholders and no stale 1.0.4 markers.
- Runtime build/test verification is left to the pull-request checks because a local repository checkout/network was unavailable in the execution environment.

## 2026-10-02 — Documentation Refresh Schedule Reliability Repair

- Deep-dived the scheduled documentation updater instead of changing the working refresh engine.
- Verified scheduled Refresh Documentation runs repeatedly landed several hours later than the configured 2:21 AM and 6:21 AM Atlantic targets, while the updater itself completed successfully when a scheduled event was eventually delivered.
- Verified run #33 updated 14 documentation snapshots with 0 failures and created/updated the automated refresh PR successfully.
- Confirmed the earlier UTC/time-guard design could discard delayed scheduled events because it required the runner clock to be exactly 02:00 Atlantic; that guard was not restored.
- Updated .github/workflows/refresh-docs.yml to retain the intended 2:21 AM and 6:21 AM Tuesday/Friday schedules, add a 10:21 AM Tuesday/Friday recovery opportunity, record the nominal schedule plus actual UTC/Atlantic trigger time, and cap a refresh job at 20 minutes.
- Preserved the updater script and documentation refresh behavior unchanged.
- Runtime pull-request execution remains the final validation point because the repository cannot be checked out locally in this environment.

## 2026-10-02 — PR #1346 Review Follow-up — Explore Your Luck Touch

- Addressed the three review findings on PR #1346.
- Removed the timestamp-based touch suppression from `app/homepage/ExploreLuckButton.js`; touch/pen input now prevents the compatibility click at `pointerdown`, while `pointerup` performs the activation directly.
- Restored the narrower pointer-event boundary in `app/homepage/Hero.js`: the hero stage remains `pointer-events-none`, while only the Explore button restores `pointer-events-auto`.
- Strengthened `tests/visual/homepage.spec.ts` to assert the stage/button pointer-event split and exercise a second real mobile tap after the first animation completes.
- The repair remains limited to the homepage Explore Your Luck interaction and its targeted regression coverage. CI is the required runtime verification point.

## 2026-10-02 — PR #1346 Review Follow-up — Regression Test Strengthening

- Kilo re-review confirmed the three implementation findings were resolved and identified one remaining test-coverage weakness.
- Strengthened `tests/visual/homepage.spec.ts` so a native click activation is attempted after a completed real mobile touch sequence while the test clock remains frozen. This specifically fails under the removed timestamp-guard implementation, because a reintroduced frozen-time guard would suppress the click.
- Retained a second real mobile touchscreen tap check after that click sequence to cover repeat touch activation.

## 2026-10-02 — PR #1346 Review Follow-up — Smooth-Scroll Test Reset

- Kilo's latest incremental review identified a test-only issue: the global smooth-scroll CSS could leave the viewport moving when the repeat-touch coordinates were reused.
- Updated `tests/visual/homepage.spec.ts` to temporarily force `scroll-behavior: auto`, reset to `scrollY === 0`, restore the page style, and only then issue the repeat mobile tap.
- Application interaction code remains unchanged by this follow-up.
