# Feature Specification: Graphics Development Toolkit

**Feature Branch**: `freebuff/5675fb1c2b649136e34a4b21`

**Created**: 2026-11-19

**Status**: Implemented

**Input**: User description: "Equip Luckypickcanada with premium graphics-development capabilities for
future cinematic, realistic, gaming-quality visual enhancements. Investigate, select and install
whichever free graphics technologies provide genuine value (Three.js, PixiJS, GSAP, WebGL, WebGPU,
shaders and similar). Audit existing dependencies, reuse what is already available and install only
what is worthwhile. Integrate everything properly so future development can access these
capabilities. Installing dependencies, configuring graphics tooling and preparing rendering
infrastructure are authorized. Do not modify existing website visuals, artwork, animations, layouts
or functionality; those enhancements will be commissioned separately. Maintain mobile compatibility,
performance and the 495 MiB production build-size limit. Prioritize free and open-source solutions."

## Context

Lucky Pick Canada already renders a lot of graphics without a 3D engine: Canvas 2D starfields and
particles, additive WebGL cinematics, procedural metallic meshes with a shared scene-light bus, a
shared capability layer (`app/lib/graphics-capabilities.js`), an adaptive performance layer
(`app/lib/adaptive-performance.js`) and a resource-readiness hub. It also already ships
`framer-motion`, `canvas-confetti`, `html2canvas` and `gsap` (installed but not imported anywhere).

What it lacked was a general-purpose 3D capability for physically based rendering, real lighting and
shadows, depth, instancing, HDR bloom and tone mapping, and glTF asset loading — the building blocks
of cinematic, realistic or gaming-quality visuals. This feature installs and wraps that capability
without changing anything a visitor sees.

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Future 3D work has a supported entry point (Priority: P1)

A developer commissioned to build a premium 3D effect can create a renderer, scene and camera, add
post-processing and load a glTF model, guided by one small documented API, without researching
context flags, quality tiers, resize handling, reduced motion, context loss or disposal from
scratch.

**Why this priority**: Without a shared entry point every future effect would reinvent renderer
setup and would probably break the repository's graphics contract.

**Independent Test**: Import `app/lib/graphics/stage.js`, create a stage on a canvas, render a
frame, dispose it, and confirm the documented fallback (`null`) when WebGL is unavailable.

**Acceptance Scenarios**:

1. **Given** a browser with WebGL, **When** a feature calls `createThreeStage({ canvas })` and
   `start()`, **Then** a renderer, scene and perspective camera render through the shared frame
   loop at the resolved tier's frame rate and pixel-ratio cap.
2. **Given** a stage, **When** the feature calls `dispose()`, **Then** the frame loop, resize
   observer, listeners, scene resources and WebGL context are released exactly once.
3. **Given** a feature that needs bloom, **When** it calls `createCinematicEffects`, **Then** the
   composer adds bloom, tone mapping/sRGB output and SMAA according to the tier budget.
4. **Given** a glTF model, **When** it is loaded with `loadGLTF`, **Then** the resolved scene is
   returned with a `dispose()` and a failed load resolves to `null`.

---

### User Story 2 — The live site is completely unchanged (Priority: P1)

A visitor sees exactly the same artwork, layout, animation, audio and behaviour as before this
feature. No page downloads Three.js, no extra request is issued and no renderer is initialised.

**Why this priority**: The mission explicitly forbids changing existing visuals; the capability must
be invisible until a commissioned feature uses it.

**Independent Test**: Build the production bundle, compare the rendered homepage and Lucky Meter
with the committed behaviour, and confirm no page imports the toolkit.

**Acceptance Scenarios**:

1. **Given** the repository after this feature, **When** the production build runs, **Then** no
   Three.js chunk is emitted because no page imports the toolkit.
2. **Given** the homepage and Lucky Meter, **When** they load, **Then** existing canvases, WebGL
   cinematics, copy and layout are unchanged and no graphics console error appears.

---

### User Story 3 — Mobile, constrained devices and reduced motion stay safe (Priority: P2)

The toolkit never spends more than the shared tiers allow and never forces animation on a visitor
who asked for less motion.

**Why this priority**: Premium graphics must not regress mobile performance or accessibility.

**Independent Test**: Resolve budgets for each tier and assert the constrained tier drops MSAA,
shadows and post-processing resolution; assert reduced motion paints one static frame.

**Acceptance Scenarios**:

1. **Given** the constrained tier, **When** a stage and effects are created, **Then** MSAA, shadows
   and bloom are disabled and the post-processing buffer is scaled below native.
2. **Given** `prefers-reduced-motion: reduce`, **When** `start()` is called, **Then** one static
   frame is drawn and no continuous loop starts.
3. **Given** a hidden document, **When** the frame loop ticks, **Then** no frames are painted.

---

### User Story 4 — The contract and cost limits are preserved (Priority: P2)

The browser still chooses its own backend, WebGPU remains optional, and the production build stays
far below 495 MiB.

**Why this priority**: The repository's graphics and cost constraints are hard requirements.

**Independent Test**: Source guards reject `powerPreference`, `failIfMajorPerformanceCaveat`,
user-agent branching and WebGPU requirements; the production build is measured.

**Acceptance Scenarios**:

1. **Given** the toolkit sources, **When** they are inspected, **Then** no vendor branch, forced
   renderer option or WebGPU dependency exists.
2. **Given** the production build, **When** it completes, **Then** its measured size is strictly
   below 495 MiB.

### Edge Cases

- WebGL unavailable or a canvas already holding a 2D context: every entry point resolves to `null`
  and the caller's static fallback stays visible.
- Context lost after the scene starts: the loop stops, `onContextLost` fires; restoration resumes
  a scene that was animating and repaints one frame otherwise.
- Post-processing addon failure: the plain stage keeps rendering.
- A model request fails: `loadGLTF` resolves to `null` rather than rejecting.
- A throwing `onFrame`: the loop stops and reports through `onError`; the page keeps working.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Install a free, open-source 3D engine as a runtime dependency with matching types.
- **FR-002**: Provide a stage factory that lazily loads the engine, creates a renderer, scene and
  perspective camera on a caller-owned canvas, and never changes the canvas's CSS size.
- **FR-003**: Resolve quality, antialias, shadow and pixel-ratio budgets from
  `resolveRenderQuality`; default unknown tiers to `balanced`.
- **FR-004**: Drive frames from `createAdaptiveFrameLoop` so hidden pages, reduced motion and
  constrained devices are honoured.
- **FR-005**: Subscribe to reduced-motion changes and paint a static frame when animation is
  suppressed.
- **FR-006**: Handle WebGL context loss and restoration through the shared `watchContextLoss`.
- **FR-007**: Provide a disposal path that releases the loop, observers, listeners, geometries,
  materials, textures and the WebGL context, and is safe to call twice.
- **FR-008**: Provide optional cinematic post-processing (bloom, ACES tone mapping, sRGB output,
  SMAA) from Three.js addons, scaled by tier and degradable without breaking the scene.
- **FR-009**: Provide lazy glTF/GLB loading with disposal and a `null` failure result.
- **FR-010**: Document usage, budgets, fallbacks, rejected alternatives and limitations beside the
  modules and in `docs/graphics-rendering-architecture.md`.
- **FR-011**: Do not modify any existing page, component, style, asset or animation, and do not
  import the toolkit from production code.
- **FR-012**: Keep every choice free/MIT and add no paid service, no build step and no new hosting.

### Key Entities

- **Stage**: renderer + scene + perspective camera + size + lifecycle (`start`, `stop`, `render`,
  `resize`, `dispose`).
- **Stage budget**: per-tier `{ maxPixelRatio, antialias, shadows, shadowMapSize, anisotropy,
  maxLights }`.
- **Effect budget**: per-tier `{ bloom, bloomStrength, bloomRadius, bloomThreshold, antialias,
  resolutionScale }`.
- **Loaded model**: `{ scene, scenes, animations, cameras, asset, dispose }`.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: `pnpm exec vitest run __tests__/graphics-three-toolkit.test.js` passes.
- **SC-002**: `pnpm exec tsc --noEmit` exits 0.
- **SC-003**: The production build completes and measures strictly below 495 MiB, with no Three.js
  chunk emitted for existing routes.
- **SC-004**: `./freebuff-verify.sh` exits 0.
- **SC-005**: A browser check of the homepage at desktop and mobile widths shows unchanged visuals
  and no console error.
- **SC-006**: No existing file under `app/`, `components/`, `public/`, `themes/` or `styles` has a
  visual or behavioural change.
