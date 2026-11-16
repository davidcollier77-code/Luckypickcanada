# Implementation Plan: Lucky Meter Dimensional Environment

**Branch**: `freebuff/51520cf7c26c97a2e1b3bcde` | **Date**: 2026-11-15 | **Spec**: `specs/170-lucky-meter-dimensional-environment/spec.md`

**Input**: Feature specification from `/specs/170-lucky-meter-dimensional-environment/spec.md`

**Baseline**: `specs/164-lucky-meter-cinematic-redesign` (spec, research, plan,
tasks and evidence). This feature refines that delivered result and does not
rewrite its record.

## Summary

Keep every result, timing, storage, audio and accessibility rule established by
spec 164. Replace the flat CSS medallion with procedurally generated, lit,
bevelled geometry; replace the static SVG leaves with extruded, bevelled,
rotating Canadian maple-leaf meshes at several depths; move meteors, lightning
and fireworks onto a shared perspective camera with smoke, fragments and
atmospheric wakes; add a full-screen sky-light pass and a shared scene-light bus
so bursts and strikes visibly illuminate the sky, the smoke, the leaves and the
medallion; and finish the tier plate and supporting interface to match.

## Technical Context

**Language/Version**: JavaScript/TypeScript on Node.js 26.x, React 19, Next.js 16 App Router.

**Primary Dependencies**: Existing React, Next.js, Tailwind CSS 4, Howler. No new dependency. WebGL 1 (GLSL ES 1.00) only.

**Storage**: Browser Local Storage only, existing versioned Lucky Meter key. No server or database writes.

**Testing**: Vitest + Testing Library for units and components; Playwright (repository `desktop`, `mobile-390`, `mobile-412` projects) for browser and visual QA; `tsc --noEmit`; production Next.js build.

**Target Platform**: Public Lucky Pick Canada website on Cloudflare Pages across Chromium, Gecko and WebKit, desktop and mobile.

**Performance Goals**: Target 60 FPS and sustain ≥ 55 FPS where the environment permits; cap pixel ratio, particle counts, mesh resolution and draw calls; pause when hidden; measured and reported per event and viewport.

**Constraints**: Milky Way artwork, markup and CSS byte-identical; no new dependency, route, server write or database change; build strictly below 495 MiB; every reveal timing, event duration, selection rule, audio cue and control behaviour unchanged.

**Scale/Scope**: One route. Three new `app/lib/` rendering modules, three renderer components, one engine refactor, one component rewrite, one stylesheet section, focused tests.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- Preserve existing artwork, identity and unrelated behaviour: **PASS** — the Milky Way block is untouched; only Lucky Meter presentation changes.
- Preserve security, privacy and data boundaries: **PASS** — daily data stays in Local Storage; no new network calls.
- No protected-area changes (payments, database, auth, hosting, secrets): **PASS**.
- Build-size cap: **PASS** — new source is a few tens of kilobytes; measured in verification against 320.55 MiB baseline.
- Spec Kit workflow: **PASS** — spec, checklist, research, plan and tasks precede implementation.
- QA checker requirements: **PASS** — inspected before specifying; changed paths stay inside application, specs, tests, styles and QA artifacts; no checker or workflow is modified.
- Accessibility and reduced motion: **PASS** — existing preference handling retained and extended to every new animation; all centre content stays DOM text.
- Audio licensing: **PASS** — no audio asset is added, removed, replaced or retimed.

## Project Structure

### Documentation (this feature)

```text
specs/170-lucky-meter-dimensional-environment/
├── spec.md
├── checklists/requirements.md
├── research.md
├── plan.md
├── tasks.md
└── evidence.md          # verification record, written during implementation
```

### Source Code (repository root)

```text
app/
├── globals.css                          # medallion fallback, tier plate, panel chrome
└── lib/
    ├── gpu-math.js                      # NEW  mat4/mat3, perspective, projection (pure)
    ├── gpu-geometry.js                  # NEW  lathe, maple leaf, triangulation (pure)
    ├── gpu-lighting.js                  # NEW  lit-mesh and sky-light shader programs
    ├── gpu-scene-light.js               # NEW  shared screen-space light bus
    ├── gpu-particles.js                 # unchanged point pipeline
    └── graphics-capabilities.js          # + ornament budgets on the quality profile
components/
├── DailyResonance.tsx                   # mount ornament layers, tier plate, panel polish
├── LuckyMeterRing.jsx                   # 3D medallion canvas + CSS fallback
├── lucky-meter-medallion-engine.js      # NEW  lit medallion renderer
├── lucky-meter-ornament-engine.js       # NEW  far/near golden maple-leaf renderer
├── CosmicEventStage.jsx                 # pass scene-light publishing surface
└── cosmic-event-engine.js               # perspective camera, smoke, sky light, new choreography
__tests__/
├── gpu-geometry.test.js                 # NEW  silhouette, topology, normals
├── gpu-math.test.js                     # NEW  projection and matrix contracts
├── gpu-scene-light.test.js              # NEW  bus publication and decay
├── graphics-capabilities.test.js        # + ornament budget assertions
├── lucky-meter-cinematic-lifecycle.test.jsx  # + ornament layer mounting
└── daily-resonance-daily-experience.test.jsx # unchanged expectations
artifacts/lucky-meter-cinematic-v2-qa/
├── qa-capture.mjs                       # screenshot + frame-timing harness
├── qa-checks.mjs                        # behavioural and structural assertions
└── evidence/                            # before and after captures and report.json
```

**Structure Decision**: Single Next.js application. Rendering primitives stay in
`app/lib/` beside the existing point pipeline so every renderer shares one audited
program set; renderer lifecycles stay in `components/` beside the components that
mount them.

## Design

### 1. Rendering modules

- `gpu-math.js`: `perspective`, `multiplyMat4`, `translation`, `rotationX/Y/Z`,
  `scale`, `normalMatrix`, `projectToScreen`. Pure, allocation-light, unit tested.
- `gpu-geometry.js`: `buildLatheGeometry(profile, segments)`,
  `buildMapleLeafGeometry(options)`, `triangulatePolygon(points)`,
  `mergeMeshes`. Pure, unit tested for topology and normal orientation.
- `gpu-lighting.js`: `createMeshProgram(gl)` and `createSkyLightProgram(gl)`
  returning program plus attribute/uniform locations, and the shader sources.
- `gpu-scene-light.js`: a fixed-capacity light set with `publish`, `clear`,
  `read`; no allocation after construction.

### 2. Medallion

`lucky-meter-medallion-engine.js` renders the medallion into a canvas inside
`LuckyMeterRing`. Depth test on, antialias on, backing store capped by the
quality profile. One model matrix with a fixed −8° X tilt and a small
pointer-driven Y/X offset, so the rim highlight travels. Scene lights are read
from the shared bus each frame. Reduced motion draws one frame.

`LuckyMeterRing` keeps every existing class contract, data attribute, child
slot and label. The decorative conic layers become a low-key CSS fallback shown
only when the engine cannot start, and the two static leaf images are removed.

### 3. Ornament leaves

`lucky-meter-ornament-engine.js` mounts twice: a far canvas below the interface
and, on capable profiles only, a near canvas above it. Each instance owns 8–9
(far) or 5 (near) leaves with depth, orbit, drift and rotation state. Geometry
is built once and shared per instance. Backing-store ratio is capped low, which
is acceptable because these are soft depth elements. A light drift and rotation
keep them moving; reduced motion draws one still composition.

### 4. Cosmic event engine

- A camera (`cx`, `cy`, `F`) plus `project(x, y, depth)` used by every effect.
- Meteors: world-space start, direction and speed, sampled trail projected per
  sample; colour ramp white → gold → orange → deep red → ember; smoke wake
  particles with growth and long life; fragment sparks; near/distant spawn mix.
- Lightning: branching in three dimensions, per-vertex projection, width by
  depth, white core plus cool sheath, flicker and afterglow; each strike
  publishes a scene light.
- Fireworks: three-dimensional Fibonacci shells projected per particle; burst
  publishes a scene light with radius and decay; smoke puffs tinted by the
  active lights; finale composes large gold shells, willow fall, shockwave and
  the strongest light.
- Sky light: an additive full-screen pass drawn on the far surface after haze and
  before points.

### 5. Presentation

A framed tier plate (hairline gold rules, letter-spaced label, metallic
gradient text), consistent panel chrome, refined Share, countdown and Home
treatments. All wording, sizes below 12 px, structure and handlers unchanged.

### 6. Verification

1. New pure-module tests (`gpu-math`, `gpu-geometry`, `gpu-scene-light`) and
   quality-budget tests.
2. Focused Lucky Meter suites, then the full Vitest suite and `tsc --noEmit`.
3. Production build measured against 495 MiB.
4. `./freebuff-verify.sh`.
5. `qa-capture.mjs` before and after at `desktop`, `mobile-390`, `mobile-412`
   for welcome plus all three events, with frame timing per event.
6. `qa-checks.mjs` structural and behavioural assertions: medallion canvas
   present, ornament layers mounted per profile, WebGL-disabled fallback,
   reduced motion, hidden-tab pause, preserved lifecycle and text.
7. Pixel comparison of before/after captures to evidence sky illumination and
   finale scale.
8. Firefox and WebKit reported honestly if their binaries are unavailable.

## Complexity Tracking

No constitution violations. Three extra WebGL contexts exist only on capable
profiles and every one of them is optional: the medallion falls back to static
CSS, the near ornament layer is absent on the constrained profile, and the near
effect surface already drops under low frame rate. A single-canvas alternative
cannot satisfy the explicit behind/in-front depth requirement, which spec 164
already established and this feature preserves.
