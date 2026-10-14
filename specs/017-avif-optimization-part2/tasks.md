# Tasks: AVIF Optimization Part 2

## Phase 1: Shared Background Conversion (Crystal Ball, Map, Home) [US1]
- [ ] T001 [P] [US1] Run a conversion script to download Pexels backgrounds and generate AVIF/WebP assets in `public/assets/`.
- [ ] T002 [US1] Update `.homepage-sky-backdrop` in `public/themes/default/homepage.css` to use CSS `image-set()` referencing local AVIF, WebP, and JPEG files.
- [ ] T003 [US1] Update `.homepage-sky-backdrop` in `themes/default/homepage.css` to use CSS `image-set()` referencing local AVIF, WebP, and JPEG files.

## Phase 2: Lucky Map Assets [US2]
- [ ] T004 [P] [US2] Convert `public/IMG_20260731_055452_187611.png` to AVIF and WebP using `sharp`.
- [ ] T005 [US2] In `app/lucky-map-of-canada/lucky-map-of-canada.js`, update inline style for `.story-modal` to use `image-set()` for `lucky-map-sky.avif` and `lucky-map-sky.webp`.
- [ ] T006 [US2] In `app/lucky-map-of-canada/lucky-map-of-canada.js`, wrap the `<Image src="/IMG_20260731_055452_187611.png">` with a `<picture>` tag serving AVIF and WebP sources.

## Phase 3: Lucky Meter Background [US3]
- [ ] T007 [US3] In `components/DailyResonance.tsx`, wrap the `<Image src="/images/lucky-meter-night-sky.webp">` with a `<picture>` tag serving the existing `lucky-meter-night-sky.avif` and falling back to WebP.

## Phase 4: Verification
- [ ] T008 Run `./jules-verify.sh`.
- [ ] T009 Run `pnpm run build` and ensure output size is < 495MB.
- [ ] T010 Run `pnpm exec playwright test` for visual verification.
