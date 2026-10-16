# Tasks: Premium Golden Maple-Leaf Assets

**Input**: Design documents from `specs/023-golden-maple-leaf-assets/`

**Prerequisites**: spec.md, plan.md, research.md, data-model.md, quickstart.md

## Phase 1: Implementation (US1)

- [x] T001 [US1] Inspect the current shared leaf component, animation CSS, visual interaction test, image fallback conventions, and package configuration.
- [x] T002 [US1] Prepare transparent leaf assets at `public/assets/golden-maple-leaf.avif`, `public/assets/golden-maple-leaf.webp`, and `public/assets/golden-maple-leaf.svg`.
- [x] T003 [US1] Update `app/components/CrystalBall/GoldenLeaf.tsx` to serve AVIF → WebP → SVG fallback through a shared picture component.
- [x] T004 [US1] Preserve cursor and flying-leaf behavior with a minimal CSS display adjustment in `app/components/CrystalBall/CrystalBall.module.css`.
- [x] T005 [US1] Extend `tests/visual/crystal-ball-interactions.spec.ts` to verify source ordering, fallback, loading, and reuse of the same source set.
- [x] T006 [US1] Update the active Spec Kit feature pointer to `specs/023-golden-maple-leaf-assets`.

## Phase 2: Verification

- [ ] T007 [US1] Run the Crystal Ball Playwright regression test and correct any failures.
- [ ] T008 [US1] Run `./jules-verify.sh` including its Spec Kit task-artifact gate.
- [ ] T009 [US1] Verify the production and OpenNext/Cloudflare builds and measure build size against 495 MB.
- [ ] T010 [US1] Inspect all final changed files and update the PR Summary with actual CI results before merge.
