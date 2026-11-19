# Tasks: Graphics Development Toolkit

**Input**: Design documents from `/specs/193-graphics-development-toolkit/`

**Prerequisites**: spec.md, plan.md, research.md

**Scope guard**: Infrastructure only. No page, component, style, asset, animation or audio change.
No WebGPU requirement. No new service or build step. Build stays below 495 MiB.

## Phase 1: Setup and Baseline

- [X] T001 Audit existing dependencies and confirm `gsap`, `framer-motion`, `canvas-confetti` and
      `html2canvas` are already available (`package.json`)
- [X] T002 Audit the existing graphics layers and record the gap: no general 3D engine, no PBR,
      no post-processing, no glTF loading (`research.md`)
- [X] T003 Run the documented startup procedure (`verify-startup.sh`, `bootstrap-pnpm.sh`,
      `pnpm install --frozen-lockfile`)
- [X] T004 Install `three@^0.187.0` and `@types/three@^0.187.0`; no other dependency added
- [X] T005 Verify addon paths, constructor signatures and composer resize behaviour in the
      installed package before writing code (`research.md`)

## Phase 2: User Story 1 — A supported entry point (P1)

**Goal**: Future 3D work can create a scene, add effects and load a model through one documented API.

**Independent Test**: Create a stage on a real WebGL canvas, render, dispose; confirm `null`
fallbacks without WebGL.

- [X] T006 [US1] Add `app/lib/graphics/resources.js` with best-effort geometry/material/texture
      disposal
- [X] T007 [US1] Add `app/lib/graphics/stage.js` with dynamic `import('three')`, tier resolution,
      renderer/scene/camera, resize, reduced motion, context loss, error containment and `dispose()`
- [X] T008 [US1] Add `app/lib/graphics/effects.js` with tiered `EffectComposer` + `RenderPass` +
      `UnrealBloomPass` + `OutputPass` + `SMAAPass`
- [X] T009 [US1] Add `app/lib/graphics/assets.js` with lazy `GLTFLoader` loading and disposal
- [X] T010 [US1] Add `app/lib/graphics/README.md` usage guide and `docs/graphics-rendering-architecture.md`
      toolkit section

## Phase 3: User Story 2 — The live site is unchanged (P1)

**Goal**: No page imports the toolkit and no bundle chunk is emitted.

**Independent Test**: Production build inspection plus a desktop/mobile homepage browser check.

- [X] T011 [US2] Confirm no existing page, component or style was edited and no production import
      of the toolkit exists
- [X] T012 [US2] Inspect the production build output for a Three.js chunk
- [X] T013 [US2] Capture desktop and mobile homepage browser evidence with console check

## Phase 4: User Story 3 — Mobile, constrained and reduced motion (P2)

**Goal**: Tier budgets and motion preferences are enforced by the toolkit.

- [X] T014 [US3] Resolve stage and effect budgets from the shared tier names with a `balanced`
      default
- [X] T015 [US3] Drive frames from `createAdaptiveFrameLoop`; paint one frame under reduced motion
- [X] T016 [US3] Cap pixel ratio per tier while leaving CSS size untouched

## Phase 5: User Story 4 — Contract and cost limits preserved (P2)

**Goal**: No backend forcing, no WebGPU requirement, build under the cap.

- [X] T017 [US4] Add source guards that reject `powerPreference`, `failIfMajorPerformanceCaveat`,
      user-agent branching, `navigator.gpu` and `WebGPURenderer`
- [X] T018 [US4] Confirm every package is free/MIT and no service, secret or platform change was
      introduced
- [X] T019 [US4] Measure the production build size against 495 MiB

## Phase 6: Verification and Delivery

- [X] T020 Run the focused Vitest suite
- [X] T021 Run `pnpm exec tsc --noEmit`
- [X] T022 Run `./freebuff-verify.sh`
- [X] T023 Render the toolkit itself in software and record renderer, draw result and console state
- [X] T024 Record evidence in `evidence.md`, update Memory Bank and `.specify/feature.json`
- [X] T025 Review the complete diff against the scope/protected-file checkers, then open the PR

## Dependencies

T004 depends on T001–T003. T007–T009 depend on T004–T005. T010 depends on T006–T009. T011–T019
depend on T006–T010. T020–T025 depend on all implementation tasks.

## Out of scope

Any visual effect, artwork, animation, layout or copy change; PixiJS, `@react-three/fiber`,
Babylon.js, the experimental WebGPU renderer, Draco/KTX2 decoders, and any production import of the
toolkit.
