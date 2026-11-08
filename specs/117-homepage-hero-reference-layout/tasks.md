# Tasks: Homepage hero reference layout

**Feature**: `specs/117-homepage-hero-reference-layout` · **Spec**: `spec.md` · **Plan**: `plan.md`

## Phase 1 — Setup

- [X] T001 Read `AGENTS.md`, the selected `.freebuff` group instructions (`creation`, `polishing`, `testing`), the Memory Bank and `.docs/manifest.json`; confirm no existing branch/PR implements this layout change.
- [X] T002 Inspect available skills and read `frontend-design` and `verification-before-completion` before designing or claiming results.
- [X] T003 Confirm the baseline in this workspace: one flattened 1024 × 1536 hero artwork, `preload` of its AVIF, `.hero-welcome` block above the artwork, hero pinned to `100svh`.
- [X] T004 Create `specs/117-homepage-hero-reference-layout` (116 is the active community-stories feature) and point `.specify/feature.json` at it.

## Phase 2 — Foundational

- [X] T005 Measure the painting's alpha row bands with `sharp`: emblem 14–690, tagline 672–743, wordmark 755–1085, subtitle 1095–1205, divider 1222–1306, Explore line 1325–1378, chevron 1385–1502.
- [X] T006 Inspect the repository for a layered source asset; only optimised derivatives of the single flattened painting exist (`git log`/`git ls-tree` on `public/homepage-hero-lucky-pick-canada*`).
- [X] T007 Record the window plan: emblem/tagline/wordmark `0–1090`, divider `1222–1306` (used twice), Explore line and chevron `1306–1506`.

## Phase 3 — User story 1: reference order (P1)

- [X] T008 [US1] `app/homepage/Hero.js`: add the `HeroArtwork` window component and render emblem slice → divider → `.hero-welcome` → divider → Explore slice inside `.hero-artwork-column`.
- [X] T009 [US1] `themes/default/hero.css`: add `.hero-art-slice` windows (`overflow: hidden`, measured `aspect-ratio`, `--hero-art-offset` row window) and divider rhythm.
- [X] T010 [US1] Restyle `.hero-welcome` as the reference panel (gold hairline, dark navy fill, inner highlight, gold display heading), keeping every existing element and the `#play-explore` CTA.

## Phase 4 — User story 2: branding keeps its size (P2)

- [X] T011 [US2] Remove `minHeight: 100svh`, `h-[100svh]` and the height-driven artwork sizing; size the column from width (`min(100%, 46rem)`) so the hero grows with its content.
- [X] T012 [US2] Verify at 1440 × 900, 1024 × 768, 412 × 915 and 390 × 844 that each slice's height/width equals its painting ratio and that there is no horizontal overflow.

## Phase 5 — User story 3: preserved behaviour (P1)

- [X] T013 [US3] Keep the single AVIF preload, AVIF-first/WebP-second `<picture>` and `srcset`/`sizes`; give only the emblem eager/high priority and defer the three repeated decorative crops with lazy/auto.
- [X] T014 [US3] Map the gold shimmer frames to the emblem slice (ring + wordmark) and the Explore slice (line + chevron) with the same measured band percentages; keep `aria-hidden`, `pointer-events: none` and the reduced-motion hide rule.
- [X] T015 [US3] Keep `<ExploreLuckButton />` at the bottom of the Explore window with its accessible name, hit target, confetti, sound, eased scroll, cooldown, interrupt handlers and reduced-motion path; `.hero-image-container` stays the Explore window so its browser contract is preserved.
- [X] T016 [US3] Confirm navigation labels/destinations, all copy and every section below the hero are unchanged.

## Phase 6 — Verify and deliver

- [X] T017 [P] Add `__tests__/homepage-hero-layout.test.js` guarding the reference order, the reused divider, the preserved panel content, the width-based sizing, the single preload and the absence of new image assets.
- [X] T018 [P] Update `__tests__/homepage-nav-gold-shimmer.test.js` alignment guard from the old `object-contain` frame to the measured slice mapping, keeping every motion, layering, pointer and reduced-motion assertion.
- [X] T019 Run the focused guards, the full Vitest suite and `tsc --noEmit`. PASS — focused guards 4 files / 33 tests, full Vitest 53 files / 428 tests, `tsc --noEmit` exit 0.
- [X] T020 Run the Playwright suites (shimmer motion, Explore interaction, gold CTAs, mobile accessibility) with refreshed homepage baselines. PASS with one pre-existing flake — homepage spec 18 passed / 3 project-level skips, content refresh + gold CTA 33 passed, site-wide gold CTA 18 passed, mobile accessibility 14 passed / 1 skip; the `/map` skip-link check fails intermittently because it measures the link during its own 160 ms focus transition (measured `top: -61` immediately, `top: 12` after 400 ms), on a route this change does not touch.
- [X] T021 Run `./freebuff-verify.sh` with a valid comparison base and measure `.next` + `public` against the 495 MB maximum. PASS — exit 0 (Spec Kit gate, production build, 36/36 documentation tests); `.next` 401 MB + `public` 33 MB = 434 MB (on-disk, includes the dev cache) < 495 MB.
- [X] T022 Capture desktop and mobile screenshots, compare them with the reference, and correct any composition defect. PASS — 1440 × 900, 1024 × 768, 412 × 915 and 390 × 844 all show the reference order with 0 px horizontal overflow; the tighter caption sizes initially added for the one-line note broke the repository's 12 px mobile caption floor and were raised back (`h1` 12.9 px, note 12 px).
- [X] T023 Inspect the complete final diff, then open/update the single PR with the canonical summary, leaving it open and unmerged.
- [X] T024 Repair the `/map` skip-link Playwright flake found during T020: the check sampled the link during its own 160 ms focus transition, so it now polls for the settled viewport position with the same assertion. PASS — repeated five times per project and the full mobile-accessibility file passes.
- [X] T025 [US3] Restore the Explore hit target to the full visible Explore crop and keep its keyboard focus outline visible inside the crop's overflow boundary.
- [X] T026 [US3] Add Playwright assertions for the crop-row geometry and Explore hit-target coverage, plus a source guard for the single high-priority/eager artwork policy.
- [X] T027 [P] Replace fixed waits in the reference probe with image decode, font readiness and stable-geometry conditions.
- [X] T028 [US3] Replace the remaining fixed post-scroll waits in the Explore Playwright test with settled-geometry polling, clarify the prop-free artwork count, and terminate the measurements JSON with a newline.
- [X] T029 [US3] Verify the mobile Explore touch activation by comparing scroll movement from the position immediately before the tap, isolated from the preceding click cooldown.

## Dependencies

- T005–T007 before T008–T009.
- T008–T010 before T012 and T022.
- T013–T015 before T017–T020.
- T017–T018 before T019–T021.
- T021–T022 before T023.
