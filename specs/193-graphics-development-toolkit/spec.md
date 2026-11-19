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

---

## Continuation — completed automatic integration (2026-11-19)

The owner directed that the toolkit become **genuinely usable and automatic**, not merely installed:
new and existing experiences must get the right capabilities without individual registrations, and
resource loading, scheduling, performance adaptation, cleanup, disposal and recovery must run through
the existing architecture.

### Added user stories

**User Story 5 — An experience gets the right technology automatically (P1)**

A developer describes what a visual needs (`dimension`, `renderer`, `particles`, `postProcessing`,
`timeline`, `audio`). The layer selects the technology from the shared capability probes and adaptive
tier: Three.js only for genuine 3D/post-processing, Canvas 2D for 2D layers, and the existing
hand-written WebGL engines are never replaced. Reduced motion selects no motion technology without
downgrading the renderer.

**User Story 6 — Resources are discovered and prepared without manual registration (P1)**

One descriptor per experience drives resource derivation: engine chunks (`module`), textures
(`texture`), glTF preflights (`model`) and existing audio prepare functions (`audio`). The registry
composes the Resource-Readiness Hub registration; the manifest spreads the derived resources; future
visual experiences are registered automatically on install. No second preloader, scheduler or cache.

**User Story 7 — Existing experiences use the capability layer without changing (P1)**

The Lucky Meter and the Lucky Card Reveal declare their renderer and cues once and call
`useCreativeExperience`. Their artwork, animation sequence, timing, sounds, fallbacks, responsive
behaviour and functionality are unchanged. The Crystal Ball, Lucky Map and Lucky Number Generator
declare their capabilities the same way.

**User Story 8 — Creative building blocks are available (P2)**

Materials (gold, enamel, glass, glow), a tiered light rig with event pulses, bounded GPU particles,
GSAP timelines with reduced-motion completion, a managed Canvas 2D surface, synchronised audio cues,
a runtime that returns one lifecycle for every renderer, a reusable React surface and a runnable
worked example.

### Acceptance scenarios

1. **Given** a descriptor with `dimension: '3d'` and WebGL, **When** the selector runs, **Then** the
   renderer is `three` with Canvas 2D and DOM fallbacks; without WebGL it is Canvas 2D, and without
   Canvas 2D it is DOM.
2. **Given** a descriptor with an existing `renderer: 'webgl'`, **When** the selector runs, **Then**
   the renderer remains the existing engine and post-processing is not offered.
3. **Given** a descriptor with a chunk, texture, model or audio cue, **When** it is registered,
   **Then** exactly those hub resources are derived, and preparing the experience loads them through
   the existing hub.
4. **Given** a new visual experience with no manifest entry, **When** the manifest installs the
   creative layer, **Then** the experience is registered automatically.
5. **Given** a component using `useCreativeExperience`, **When** the page settles, **Then** its
   resources prepare at critical priority without competing with the first paint.
6. **Given** reduced motion, **When** a timeline is created, **Then** playing it applies the final
   state without scheduling animation frames.
7. **Given** any creative surface, **When** `dispose()` runs, **Then** frames, observers, listeners,
   composer passes, scene resources and the WebGL context are released once and the call is safe twice.

### Scope boundaries (unchanged)

No visual, artwork, layout, copy, audio or timing change to an existing experience. Three.js is not
forced onto the existing renderers. The documentation-library, its manifest, updater workflows and
Cloudflare scheduler remain the owner's separate work and are untouched here. The production build
stays strictly below 495 MiB.

---

## Continuation — Creative Workbench and sound-reactive cinematics (2026-11-19)

The owner asked for two improvements to this same layer, in this same pull request:

1. **Creative Workbench** — a shared sandbox where AI coding agents can experiment with graphics,
   inspect visual effects, capture screenshots and perform visual QA before PR approval.
2. **Sound-Reactive Cinematics** — connect existing audio effects with particles, lighting and
   animations so the visuals respond naturally to the sounds being played.

Both build on the existing infrastructure. No visitor route, artwork, animation, timing, sound,
layout, dependency or service changes.

### User Story 9 — An agent can inspect a visual before approving a PR (P1)

A coding agent opens `/workbench/creative`, selects a catalogue scene, forces a tier and seed,
freezes the scene clock at a known time and captures a PNG. It reads the resolved technology plan,
surface kind, audio envelope, frame rate and errors as plain JSON through
`window.__creativeWorkbench`.

**Independent Test**: in development, call `getState()`, `setTime(2.5)` and `capture()`; confirm the
plan, the frozen frame and the deterministic filename.

**Acceptance scenarios**:

1. **Given** the workbench in development, **When** it loads, **Then** it mounts a catalogue scene
   through `createCreativeSurface` and reports `ready: true` with the plan it actually resolved.
2. **Given** a ready workbench, **When** `setTime(2.5)` is called, **Then** animation stops and one
   composed frame is painted from a frozen clock.
3. **Given** a capture, **Then** the PNG name is
   `creative-workbench-<scene>-<tier>-t<t>s-seed<s>.png` and `readCapture()` returns its data URL.
4. **Given** `setTier('constrained')` or `setReducedMotion(true)`, **Then** the plan resolves with
   that tier, or with `motion: 'none'` and `audioReactive: false`, independent of the OS setting.

### User Story 10 — Visuals follow the sound the visitor already hears (P1)

An experience declares `reactiveAudio: true`; the layer measures the existing audio mix and binds a
smoothed envelope to the existing light rig, particle field or any numeric property.

**Independent Test**: create a surface with `reactiveAudio: true`, play a Lucky Meter cue in the
workbench and confirm `frame.envelope.level` rises while the bound values follow.

**Acceptance scenarios**:

1. **Given** `audioReactive` in the plan, **When** a frame renders, **Then** it carries
   `{ level, bass, mids, highs, transient, peak, beat, available }`.
2. **Given** a bound rig, **When** the mix jumps, **Then** one pulse fires for that transient
   (140 ms cooldown) and a glow proportional to the level holds between beats.
3. **Given** reduced motion, a hidden page or no analysable audio, **Then** the envelope stays
   neutral, no analyser is read and the visual keeps its resting state.
4. **Given** an experience that does not request reactivity, **Then** no analyser and no envelope
   work exist for it.

### Continuation requirements

- **FR-013**: Tap the audio graph Howler already created with one shared `AnalyserNode` through a
  zero-gain branch; never create an `AudioContext` and never change the audible mix.
- **FR-014**: Produce a smoothed, banded envelope with fast attack, slow release and transient
  detection; expose `bindLightRig`, `bindParticleField`, `bindValue` and `onBeat`, each unbindable.
- **FR-015**: Select `audioReactive` from the requirement, the capability probe and reduced motion,
  report the reason, and attach the envelope to runtime frames and `surface.reactive`.
- **FR-016**: Add a deterministic workbench catalogue, builders, UI, inspection API, PNG capture and
  a production 404 gate; build scenes only through the existing runtime.
- **FR-017**: Add no dependency, service, visitor route or visible change; keep the build strictly
  below 495 MiB.
- **FR-018**: Document both capabilities in `app/lib/graphics/README.md` and
  `docs/graphics-rendering-architecture.md`.

### Continuation edge cases

- WebGL unavailable: the workbench reports the Canvas 2D or DOM plan it actually got.
- Audio context not created before the first gesture: attaching resolves `null`, retries on a
  throttle and never throws.
- `html5: true` Howler cues bypass Web Audio: documented; the workbench demonstrates reactivity with
  the Web Audio Lucky Meter set.
- A WebGL canvas may refuse a direct `toDataURL` read-back: the capture reports
  `canvas-not-readable` and a Playwright screenshot after `setTime()` is the documented path.
