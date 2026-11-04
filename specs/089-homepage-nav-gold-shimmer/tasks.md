# Tasks: Homepage Navigation Consolidation and Golden Shimmer

**Feature**: `specs/089-homepage-nav-gold-shimmer`
**Input**: `spec.md`, `plan.md`

## Phase 1: Setup

- [x] T001 Record the baseline for both halves of the task: the hero primary navigation entries in `app/homepage/Hero.js` and the hero `<picture>`/`preload()` image delivery in the same file — baseline navigation was `Lucky Meter · Community Stories (#community-stories) · Consult the Crystal Ball · Lucky Map (/map) · Daily Card Reveal`; delivery was one AVIF preload hint, AVIF `<source>`, WebP `<source>`, WebP `<img>` fallback
- [x] T002 Confirm the browser evidence path available in this workspace (Playwright Chromium under `~/.cache/ms-playwright` and `scripts/setup-chromium-libs.sh`) before relying on it — Chromium 1243 was present but couldn't launch (`libnspr4.so` missing); `scripts/setup-chromium-libs.sh` provisioned the user-level libraries (exit 0, 27 MB prefix) and the browser then launched

## Phase 2: Foundational

- [x] T003 Measure the artwork regions that must receive shimmer from `public/homepage-hero-lucky-pick-canada.avif` (gold ring, wordmark lettering, Explore Your Luck line/arrow) as percentages of the 1024x1536 artwork, so the decoration is positioned by measurement rather than guesswork — gold-pixel analysis gave ring bbox x 177–842 / y 25–690, wordmark rows 755–1075 / x 40–985, Explore line + arrow rows 1310–1480 / x ~190–830

## Phase 3: User Story 1 — one clear stories destination (P1)

**Goal**: The hero primary navigation offers one "Lucky Stories" link to the
existing Lucky Stories area of the homepage, with no "Lucky Map" entry.

**Independent test**: Serve the homepage, read the hero primary navigation, and
count stories links and "Lucky Map" links; confirm the map route still responds.

- [x] T004 [US1] Remove the "Lucky Map" navigation link and its separator from the hero primary navigation and relabel the remaining stories link to "Lucky Stories" (keeping its `#community-stories` destination) in `app/homepage/Hero.js`
- [x] T005 [US1] Confirm the map functionality is untouched: `app/map/page.js` still exists and the homepage "EXPLORE LUCKY STORIES" call to action in `app/homepage/HomePage.js` still links to `/map` — served homepage shows four hero nav links (`/lucky-meter`, `#community-stories`, `/crystal-ball`, `/reveal`), one `EXPLORE LUCKY STORIES →` link to `/map`, one footer "Lucky Map" link, and `/map` plus `/where-luck-has-been-found-in-canada` both answer HTTP 200

## Phase 4: User Story 2 — moving golden shimmer (P1)

**Goal**: A subtle, moving golden highlight crosses the wordmark, the Explore
Your Luck line/arrow and the emblem's gold ring, with artwork, wording, colours
and layout unchanged.

**Independent test**: Two browser captures of the hero a few seconds apart differ
in all three regions; reduced motion shows no shimmer; the Explore control still
confettis, sounds and scrolls.

- [x] T006 [US2] Add the decorative shimmer layers to `app/homepage/Hero.js` inside the hero artwork container (frame plus three region layers, `aria-hidden`, non-interactive)
- [x] T007 [US2] Add the masked, keyframed shimmer CSS and the artwork-box alignment rule to `themes/default/hero.css` so the highlight tracks the painted artwork at every viewport size — measured frame equals the painted artwork box exactly: desktop 432x648 = 432x648, mobile 360x540 = 360x540
- [x] T008 [US2] Add the `prefers-reduced-motion: reduce` rule that removes the shimmer entirely — reduced-motion profile reports `display: none` for all three layers and a whole-hero frame difference of 0
- [x] T009 [US2] Confirm `app/homepage/ExploreLuckButton.js` is unchanged: click/touch/keyboard activation, confetti, sound and eased scroll behaviour are intact, and the decoration never intercepts input — file untouched; Chromium click scrolled 0 → 996 px (desktop) and 0 → 867 px (mobile), added the confetti canvas, and reported `data-confetti-pop-ready="true"`

## Phase 5: User Story 3 — image delivery untouched (P1)

**Goal**: AVIF-first delivery, WebP fallback, preloads and image files are
exactly as they were.

**Independent test**: Served markup and file listing show the unchanged AVIF/WebP
sources, the single AVIF preload hint and no image-file change.

- [x] T010 [US3] Verify no image file, format, quality setting, preload or delivery configuration changed and that the `<picture>` source order and the WebP `<img>` fallback are intact — no image file, `next.config.mjs` or asset changed; served document still emits exactly one hero preload hint (AVIF), AVIF source before WebP source, WebP `<img>` fallback; each Chromium profile transferred exactly one hero variant (`homepage-hero-lucky-pick-canada.avif` desktop, `-669w.avif` mobile)

## Phase 6: Polish and verification

- [x] T011 Add `__tests__/homepage-nav-gold-shimmer.test.js` guarding the single "Lucky Stories" link, the absent "Lucky Map" link, the preserved map route and call to action, the three shimmer regions, the reduced-motion rule, the untouched Explore control and the unchanged image delivery
- [x] T012 Run the focused guard and the affected existing homepage suites — PASS: `homepage-nav-gold-shimmer` 12/12 and `homepage-hero-preload` 4/4
- [x] T013 Run the full `pnpm exec vitest run` suite — PASS: 39 files / 413 tests
- [x] T014 Run `pnpm exec tsc --noEmit` — PASS: exit 0
- [x] T015 Run `./freebuff-verify.sh` and measure the production build size against the 495 MB limit — PASS: exit 0; `.next` 285,913,411 B + `public` 32,840,043 B = 318,753,454 B (304.0 MiB)
- [x] T016 Capture browser evidence (desktop and mobile): two hero captures a few seconds apart proving movement in all three regions, no horizontal overflow, zero console errors, and the reduced-motion path — PASS: max consecutive-frame change per region (desktop ring 7.254 / wordmark 9.620 / explore 11.447; mobile ring 6.291 / wordmark 12.596 / explore 14.677), 0 px overflow, 0 console/page errors, reduced motion 0
- [x] T017 Inspect the complete final diff and confirm it contains only the intended files
- [x] T018 Write the PR summary and update `memory-bank/activeContext.md`; leave the PR open and unmerged
