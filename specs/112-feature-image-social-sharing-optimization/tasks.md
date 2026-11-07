# Tasks: Feature-page image optimization and social-sharing image replacement

**Feature**: `specs/112-feature-image-social-sharing-optimization` · **Spec**: `spec.md` · **Plan**: `plan.md`

## Phase 1 — Setup

- [X] T001 Confirm the clean worktree, `main` baseline `a8eded36`, and that no other feature directory covers this task.
- [X] T002 Measure every existing derivative with `sharp` (dimensions, bytes) and record the delivered `<picture>` markup per route.
- [X] T003 Point `.specify/feature.json` at `specs/112-feature-image-social-sharing-optimization`.

## Phase 2 — Foundational

- [X] T004 Confirm `sharp@0.35.5` is an existing devDependency and that `images.unoptimized: true` makes handwritten `srcSet` the delivery mechanism.
- [X] T005 Read the mandated MDN image-format reference and apply its AVIF-then-WebP guidance to the existing format chain.

## Phase 3 — User story 1: lighter feature images (P1)

- [X] T006 [US1] Generate `public/assets/crystal-ball-pedestal-420w.avif` and `.webp` from the original PNG.
- [X] T007 [US1] Generate `public/images/lucky-meter-night-sky-640w.{avif,webp}` and `-1024w.{avif,webp}` from the existing WebP.
- [X] T008 [US1] Generate `public/NGC4216_crawford-1280w.{avif,webp}` and `-1920w.{avif,webp}` from the original JPEG.
- [X] T009 [US1] Add `srcSet` width descriptors and `sizes` to `app/components/CrystalBall/CrystalBall.tsx`, `components/DailyResonance.tsx` and `app/lucky-card-reveal.js`, keeping every existing attribute and fallback.
- [X] T010 [US1] Leave `public/IMG_20260731_055452_187611.*` untouched: its AVIF/WebP already exist, are delivered, and declare dimensions; no honest larger source exists.

## Phase 4 — User story 2: correct social preview (P2)

- [X] T011 [US2] Produce `public/luckypickcanada-share-1200x630.jpg` (1200 × 630, ≤ 250 KB) from `public/1785347037732.png` by a 1200 px resize and a 25 px centre trim.
- [X] T012 [US2] Update the share-image reference in `app/layout.js`, `app/map/page.js`, `app/crystal-ball/page.js`, `app/lucky-meter/page.js`, `app/reveal/page.tsx`, `app/lucky-map-of-canada/page.js` and `app/where-luck-has-been-found-in-canada/page.js`, with true 1200 × 630 declaration.
- [X] T013 [US2] Keep `public/1785347037732.png` in place as the original asset.

## Phase 5 — User story 3: stable full-bleed layout (P3)

- [X] T014 [US3] Add intrinsic `width={2949}` `height={2847}` to the `/reveal` background `<img>` (F-M6 for an in-scope image).
- [X] T015 [US3] Confirm the crystal ball and map images already declare intrinsic dimensions and that the `fill` lucky-meter image is absolutely positioned, so no new dimension is required.

## Phase 6 — Polish and cross-cutting

- [X] T016 Add `__tests__/feature-image-social-sharing.test.js` covering formats, widths, `sizes`, intrinsic dimensions, share-image bytes/dimensions and metadata references.
- [X] T017 Update `__tests__/lucky-card-reveal-presentation.test.js` and `tests/visual/crystal-ball.spec.ts` for the responsive `srcSet` they assert.
- [X] T018 Inspect the complete final diff and confirm only the files in `plan.md` changed.
- [X] T019 Focused Vitest 16/16 and the full suite 50 files / 396 tests pass.
- [X] T020 `./freebuff-verify.sh` exit 0; build `.next` 300,762,458 + `public` 33,834,328 = 334,596,786 B (319.10 MiB), below 495 MB.
- [X] T021 In-VM Chromium confirmed selected candidate file, decoded bytes, rendered sizes and fallback decoding; evidence in `artifacts/image-social-optimization/out/`. Remote Browserbase/Browserless inspection is BLOCKED (owner-gated preview).
- [X] T022 Recorded the task in `memory-bank/activeContext.md` and `memory-bank/progress.md`.
- [ ] T023 Commit, push, open one PR with the canonical summary, and leave it open and unmerged.
- [ ] T024 Record the PR-head CI outcome truthfully (pending is acceptable; never reported as passed).

## Dependencies

- T004–T005 before T006–T009.
- T006–T008 before T009.
- T011 before T012.
- T009, T012, T014 before T016–T017.
- T016–T019 before T020–T021.
- T020–T023 before T024.

## Implementation strategy

Two independently verifiable increments: the three responsive image blocks, then the share image with its
seven metadata references. Both land in one branch and one PR because they belong to one audit remediation.
