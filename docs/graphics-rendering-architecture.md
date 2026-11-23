# Graphics Rendering Architecture

Status: current architecture, verified 2026-11-15 on Chromium 156.0.8078.4 (no hardware GPU).
Scope: this document describes how the site renders today and the contract future graphics work must
follow. It does not introduce a feature, a renderer or a WebGPU requirement.

## Layer model

The site uses the cheapest layer that can produce the effect, and every layer has a defined fallback.

| Layer | Used for | Runs on | Required fallback |
| --- | --- | --- | --- |
| CSS / DOM | Layout, gradients, shadows, keyframes, transitions, hover and focus states, the page atmosphere | Browser compositor | Static styled state; `prefers-reduced-motion` removes animation |
| Canvas 2D | Starfields, card reveal particles, maple-leaf confetti, share-card raster composition | CPU rasteriser, GPU-accelerated where available | The underlying artwork and content stay visible without the canvas |
| WebGL 1/2 | Lucky Meter physical scene, Daily Resonance meteors, lightning and fireworks (shaders, additive blending, depth-ordered far/near surfaces) | GPU or software ANGLE (SwiftShader) | Complete CSS meter (wheel, pointer, leaf, vessel, beam) plus the existing completion timer; the reading remains fully usable |
| WebGPU | Not used in production. Investigated as a future optional backend only | — | The WebGL or Canvas 2D path already covers every current effect |

WebGPU is deliberately absent from the production render path. No feature may require it, detect it as
a gate, or replace a working WebGL/Canvas 2D path with it.

## Capability selection

`app/lib/graphics-capabilities.js` is the single capability layer. It is dependency-free and follows
these rules:

- **Probe, don't assume.** Canvas 2D, WebGL, Path2D and reduced-motion support are detected lazily and
  cached for the page lifetime. Nothing touches a canvas at import time, so server rendering and the
  first paint are unaffected.
- **No identity branching.** No user-agent, vendor, GPU-model or renderer-string checks. No
  `powerPreference` hint and no `failIfMajorPerformanceCaveat`, so the browser keeps its own renderer
  choice (including software rendering) instead of being forced onto a backend.
- **Conservative device profile.** `saveData`, low `deviceMemory` or low `hardwareConcurrency` resolve
  to the constrained tier; missing hints resolve to the safer default, never to the highest tier.
- **Measured cost, not device class.** Cinematic quality steps down from the actual backing-store cost
  (viewport × pixel ratio) as well as the profile, so a high-DPI phone is not assumed weak and a 4K
  desktop is not assumed fast.
- **Bounded work.** Pixel ratio is capped per tier, particle counts and point batches are bounded, and
  the frame governor lowers resolution and budgets before it drops an optional layer.
- **Lifecycle-aware.** Reduced motion suppresses animation, hidden documents stop work, and WebGL
  context loss is observed (and cancelled where restoration is possible) with a safe teardown.

Renderers consume the resolved profile; they do not re-implement detection or choose a vendor path.

## Renderer inventory

| Surface | Layer | Fallback behaviour |
| --- | --- | --- |
| Homepage starfield | Canvas 2D | Static night-sky artwork remains |
| Lucky Meter physical meter | Three.js, built through `createCreativeSurface` (`app/lib/lucky-meter/meter-scene.js`) | The complete CSS meter and the full result panel remain; the scene is never required for the reading |
| Daily Resonance cinematic stage | WebGL, far surface plus optional near surface (`CosmicEventStage.jsx`, `cosmic-event-engine.js`) | Static gradient glow, existing safety timer still completes the sequence |
| Lucky Card reveal | Canvas 2D | Card content and reveal remain |
| Maple-leaf confetti | Canvas 2D with `Path2D` | Confetti is omitted |
| Share card image | Raster composition | Existing share error message; no WebGL dependency |
| Page chrome and transitions | CSS / DOM | Static styled state |

The cinematic stage is the most demanding path: two transparent additive surfaces, one behind and one
in front of the interface, real depth ordering rather than simulated depth, and additive light so the
Milky Way artwork underneath is never replaced or dimmed.

## Fallback ladder

1. WebGL context and programs created → full effect.
2. WebGL unavailable, or shader/program creation fails → static stage, UI stays interactive, the
   completion timer still fires.
3. Near surface unavailable (constrained tier, failed second context, or retired by the governor) →
   far surface only; foreground points fall back to it instead of being lost.
4. Canvas 2D unavailable → no canvas layer; artwork and content remain.
5. Reduced motion → animation suppressed, static composition.
6. Context lost → effect reported and disposed, UI continues; restoration is honoured where possible.
7. WebGPU absent → no change, because nothing depends on it.

No fallback may block the visitor's result, sharing, navigation or audio.

## Image delivery is separate

AVIF is the preferred modern image format with WebP as the fallback, delivered through the existing
image pipeline (`<picture>` / source sets and the current conversion outputs). This is independent of
canvas rendering:

- Images are decoded by the browser; they are not a substitute for CSS, Canvas 2D, WebGL or WebGPU.
- Canvas/WebGL work must not assume an AVIF decode path, and image work must not change renderer
  selection.
- Do not add conversions, re-encode artwork or change fallbacks as part of graphics changes.

## Testing modes

| Mode | What it represents | Measured on this host |
| --- | --- | --- |
| Standard (`playwright.config.ts`) | The visitor's normal path: the browser chooses hardware or software | Software WebGL via SwiftShader because the host has no GPU; WebGL/WebGL2 and Canvas 2D pass |
| SwiftShader (`playwright.swiftshader.config.ts`) | Explicit software rendering for graphics investigation | ANGLE/SwiftShader renderer; WebGL/WebGL2, shader link and pixel readback pass |
| WebGPU probe | Availability reporting only | `unavailable_software`; `navigator.gpu` undefined in every tested configuration |

Rules:

- Standard is the only configuration used by required QA and CI, and the only one that speaks for
  visitor experience.
- SwiftShader never gates a pull request, never updates visual baselines and never stands in for a
  physical-GPU benchmark.
- A launch flag is not evidence. Report only what the page and the browser's feature status observed.

## Requirements for future 3D work

The architecture can support richer 3D without changing its contract. A future 3D effect (for example
more realistic fireworks or lightning) must:

- Use WebGL 2 (with a WebGL 1 or Canvas 2D fallback) for perspective, depth testing, lighting,
  instancing and particle systems; shaders live beside the existing point pipeline rather than
  duplicating context handling.
- Keep work bounded: point/particle budgets, capped pixel ratio, and quality tiers from the existing
  capability layer.
- Provide a static or simplified fallback that preserves the result and completion timing.
- Keep WebGPU optional. If it is ever added, it must sit behind the same capability interface, be
  selected from an observed adapter rather than a flag, and leave the WebGL path intact.
- Avoid forcing a renderer, vendor or backend on visitors, and avoid adding a production dependency on
  a capability the browser may not have.

Explicit non-goals for this task: no new 3D effect, no visual redesign, no migration of existing
features to GPU, no AVIF/WebP conversion change, no production WebGPU requirement.

## Change control

- Production graphics detection, selection, quality and fallbacks are preserved as implemented; a
  change requires its own feature record and evidence.
- The SwiftShader configuration is investigation-only. Its guard test pins the exact arguments and
  rejects unjustified unsafe or experimental flags.
- Re-run the graphics probe before adding a Chromium flag, and record the renderer and feature status
  with the result.

## Lit meshes and the shared scene-light bus (spec 170)

The Lucky Meter's physical scene sits beside the additive point stage. Both
share the same capability detection, quality profile, visibility pausing and
context-loss handling. The meter adds a Three.js scene family through
`createCreativeSurface`; the background ornament and the tier celebrations keep
their hand-written lit-mesh engines.

- `app/lib/gpu-math.js` — the one effect camera. Depth is authored as a
  multiplier; `depthScale()` turns it into a screen scale (`FOCAL / (BASE /
  depth)`), so authoring a single number controls apparent size, speed and
  convergence together. `composeTrs`, `normalMatrixFromMat4` and
  `orthographicMat4` back both mesh renderers. `composeTrs` ping-pongs three
  module-level scratch matrices because `multiplyMat4` may not alias its output.
- `app/lib/gpu-geometry.js` — procedural geometry only, no mesh assets. A maple
  leaf silhouette is ear-clipped and extruded through a shared bevel profile;
  the medallion is a lathe over `MEDALLION_PROFILE`. Every band owns its own
  vertices so creases stay sharp.
- `app/lib/gpu-lighting.js` — one metallic shader (two-lobe Blinn-Phong, Schlick
  Fresnel, procedural environment reflection, hemisphere ambient, ACES tone map,
  sRGB) and one additive full-screen sky-light pass. Shaders live here and
  nowhere else; renderers own only their buffers and frame state.
- `app/lib/gpu-scene-light.js` — a fixed four-light bus. The effect stage
  publishes the strongest active lights each frame; the medallion, the leaves
  and the smoke read it. This is what makes an explosion light the gold beside
  it instead of sitting on top of it as a separate flat layer.
- `app/lib/lucky-meter/meter-scene.js` draws the whole meter — medallion,
  chambers, central leaf, pointer/arm/spout, vessel, stream and beam — as one
  Three.js scene on the shared creative surface. It owns no renderer: the
  surface supplies the frame loop, quality tier, reduced motion and context-loss
  handling. The retired medallion engine is gone; the CSS meter is both the
  first paint and the permanent fallback.
- `components/lucky-meter-ornament-engine.js` draws the background leaf layers
  and falls back to static CSS artwork when WebGL is unavailable.
- `components/cosmic-event-engine.js` keeps the pre-existing two-surface
  (far/near) additive stage and projects every effect through the shared camera.
  It also runs the sky-light pass and owns the timeline clock: the timeline
  follows wall time so a slow frame cannot stretch the event, while the physics
  step is capped so a long frame cannot teleport particles.

Quality budgets are resolved once per page (`resolveRenderQuality`) and add
`meshSegments` and `ornament: { far, near }` to the existing tier profile.

## Adaptive performance layer

`app/lib/adaptive-performance.js` sits above the capability probes and answers
what the current device and connection can actually sustain. It does not replace
`graphics-capabilities`: probes, context acquisition and the cinematic quality
tiers stay there, and the adaptive layer composes with them.

- **Measurement over labels.** Downlink and RTT decide the network class.
  `effectiveType` is only a fallback when no measurement exists, and no label is
  read as 5G or 5G Advanced because the API does not identify either reliably.
- **Missing hints mean capable.** `deviceMemory`, `hardwareConcurrency` and the
  Network Information API are privacy-reduced or absent in several browsers.
  Absence never reduces a budget, and no cookie, storage or user-agent value is
  consulted for memory.
- **One plan, one subscription.** The plan carries tier, frame rate, animation
  budget, prefetch/audio/image policies, a parallel-request limit and a release
  flag, each with a `reasons` entry naming the signal that caused it. All
  consumers share one listener set (connection, resize, visibility, motion,
  online/offline, optional heap poll) and the last unsubscribe removes it.
- **Cadence, not removal.** `createAdaptiveFrameLoop` keeps capable devices at
  60 fps, steps constrained devices to 30 fps, stops when the page is hidden or
  reduced motion is preferred, and resumes when conditions improve. Artwork,
  density, interactions and features are unchanged.
- **Deferred loading recovers.** Prefetch waits for strong intent on a moderate
  connection and is skipped on slow/Save-Data; speculative audio is skipped under
  constraint while every playback path loads on demand. Image delivery remains
  the approved native `srcset`/`sizes` ladders; `imageQuality` is a hint for
  future derivatives, not a rewrite of asserted markup.
- **Bounded memory.** `registerReleasableResource` runs best-effort releases once
  per pressure episode (for example unloading idle decoded audio) and never
  interrupts an active sound.

`docs/graphics-rendering-architecture.md` remains the rendering contract;
`specs/180-adaptive-performance-rendering/` holds this layer's specification,
plan, tasks and evidence.

## Resource-readiness hub

`app/lib/resource-readiness.js` coordinates preparation for the experiences that
sit on top of these renderers. It is not a renderer and not a second adaptive
layer: it reads the existing plan and uses its parallel-request limit, prefetch
policy, audio policy and release registry.

- **Registration contract.** An experience declares its `id`, `version`, routes,
  dependencies and ordered resources. A resource is `{ kind, url | route,
  prepare? }`; the built-in adapters are `image` (load + decode), `code` (the Next
  router's prefetch) and `audio` (the existing Howler/Web Audio prepare function).
  A future Canvas, WebGL or WebGPU renderer registers its own adapter kind through
  `registerResourceAdapter`; no renderer migration is required today.
- **Preparation only.** The hub never plays a sound, draws a frame or runs
  business logic. Preparing audio does not unlock or start it; the activation
  path still owns autoplay rules.
- **Truthful readiness.** Resources report `fetched`, `initialized`, `ready`,
  `failed` or `skipped`, and an experience is ready only when its required
  resources are. A missing dependency, a cycle or a failed resource fails safely
  and can be retried without repeating ready work. A `skipped` resource is a
  policy decision, not a permanent cache entry: visitor-state skips such as the
  current route and plan-dependent audio skips are re-evaluated on the next
  preparation. A reported failure backs off briefly so intent events cannot
  issue a request per event; an explicit retry clears the backoff.
- **Bounded and deduplicated.** One URL shared by several experiences makes one
  request. Concurrency is `min(plan.maxParallelRequests, 3)`; queued background
  work pauses during an active reveal/cinematic, a hidden page or Save-Data and
  resumes through the shared plan subscription. Current-route and homepage
  preparation start only after `load` plus a quiet window measured from the last
  largest-contentful-paint and resource entries, so no hub request or main-thread
  work lands inside the load/LCP window; heavy assets (`background: false`) wait
  for the route or for intent. A committed caller that arrives while a background
  run is still in flight triggers one follow-up run at the higher priority, so
  the deferred heavy assets are prepared for that caller rather than inherited as
  a partial background result.
- **Caching.** The hub warms the exact URLs used in markup, so the existing
  immutable `Cache-Control` responses are reused. No service worker, storage
  layer or cache-busting query string is added, and nothing promises permanent
  retention: the browser may evict any entry.

`specs/186-resource-readiness-hub/` holds this hub's specification, plan, tasks
and evidence.

## Graphics and audio development layer (spec 193)

The site has a complete creative development layer for cinematic, realistic and
gaming-quality work. It is additive: no current artwork, sequence, timing or
sound changes, and the toolkit draws nothing unless a commissioned feature asks
it to. It is also automatic: a feature describes what it needs and the layer
selects the technology, derives the resources and hands preparation to the
existing readiness hub.

### Technology selection, not a single engine

`app/lib/graphics/technologies.js` is the selector. A descriptor declares
`dimension`, `renderer`, `postProcessing`, `particles`, `timeline` and `audio`;
the selector resolves the render technology from the shared capability probes and
the adaptive tier:

- `renderer: 'webgl'` means an existing hand-written engine keeps its frames.
  The Lucky Meter's tier celebrations stay on their hand-written WebGL engine.
  The physical meter is one Three.js scene registered as `lucky-meter` with
  `renderer: 'three'`, `dimension: '3d'`, particles and no post-processing.
  Its complete CSS meter is both the first paint and the permanent fallback.
- 3D or post-processing with WebGL available selects `three` (fallbacks Canvas 2D,
  then DOM). Without WebGL it resolves to Canvas 2D or DOM.
- A 2D particle layer selects the managed Canvas 2D surface.
- Atmosphere with no canvas need stays CSS/DOM.
- Reduced motion selects no motion technology but never downgrades the renderer;
  a timeline chooses GSAP, otherwise CSS.

Selection is deterministic and side-effect free, so an experience can render the
resolved plan in SSR-safe tests and on the server without touching a canvas.

### Automatic discovery and preparation

`app/lib/graphics/experiences.js` is the single registry of visual/audio
experiences. `creativeResourcesFor()` derives the readiness resources from a
descriptor: engine chunks, texture and model preflights, and audio prepare
functions. The manifest spreads that derived list into the experience's
registration, and `installCreativeExperiences()` installs the adapters and
registers any future visual experience that has no manifest entry.

The adapters extend the existing hub through its documented
`registerResourceAdapter` contract — no second preloader, scheduler, cache or
memory detector:

- `module` warms a heavy chunk through literal dynamic imports in
  `engine-chunks.js` (Three.js, GSAP, canvas-confetti, Howler) so nothing is
  executed and no chunk is downloaded until an experience asks for it.
- `texture` fetches and decodes into an `ImageBitmap` (or an `Image` fallback)
  with an explicit `dispose()`.
- `model` preflights a glTF/GLB into the HTTP cache; parsing stays lazy through
  `assets.js`.

Preparation inherits every hub guarantee: deduplication by kind + target +
version, `min(plan.maxParallelRequests, 3)` concurrency, pause for an active
experience or hidden page, Save-Data and slow-connection skips, a post-settle
start window, one automatic retry, truthful `fetched`/`initialized`/`ready`/
`failed`/`skipped` states and re-evaluated policy skips. The hub still never
plays a sound, draws a frame or runs business logic.

### Creative capability surface

| Module | Capability |
| --- | --- |
| `stage.js` | Lazy budgeted Three.js stage: scene, perspective camera, resize, reduced motion, context loss/restore, teardown |
| `effects.js` | Tiered composer: SMAA in linear space, HDR bloom, ACES + sRGB `OutputPass` last; runtime bloom tuning; `null` on failure |
| `materials.js` | Gold, enamel, glass and emissive presets; transmission and clear-coat only on the high tier |
| `lighting.js` | Tiered hemisphere/key/rim/fill rig with wall-time event pulses |
| `particles.js` | Seeded, bounded GPU point field with intensity control |
| `timeline.js` | Lazy GSAP timelines; reduced motion applies the final state without frames |
| `canvas-surface.js` | Managed Canvas 2D: capped DPR, adaptive frames, resize, context restore, clean teardown |
| `audio-sync.js` | Named sound cues bound to timeline positions, played once, never after teardown |
| `assets.js` / `resources.js` | Lazy glTF loading and best-effort GPU disposal |
| `runtime.js` | `createCreativeSurface()` — the automatic entry point returning one lifecycle for every renderer |
| `components/graphics/CreativeSurface.jsx` | React wrapper that builds, starts and disposes the selected surface |
| `app/lib/use-creative-experience.js` | React binding that resolves the plan and prepares the experience automatically |
| `examples/golden-motes.js` | Runnable worked example (not mounted) |
| `audio-reactivity.js` | Shared analyser on the existing Howler mix; smoothed envelope bound to lights, particles and numeric values |
| `workbench.js`, `workbench-runtime.js`, `components/graphics/CreativeWorkbench.jsx` | Development-only visual-QA sandbox with deterministic scenes and an inspection API |

### Integration of existing experiences

The Lucky Meter, its dimensional meter surface and the Lucky Card Reveal now
declare their renderer and cues in the registry. Their resources — including the
Lucky Meter sound set, the meter's Three.js chunk, the reveal sparkle, applause
and confetti pop, and the confetti chunk — are derived and prepared by the hub;
the components call `useCreativeExperience` and nothing about their artwork,
timing, playback or fallback changed. The Crystal
Ball, Lucky Map and Lucky Number Generator declare their capabilities the same
way. New features use `CreativeSurface` and the registry, so they get the same
budgets, lazy loading, cleanup and recovery without a new registration.

### Preserved contract

WebGL is still the render path, WebGPU stays probe-only and optional, the browser
still chooses its backend (no vendor branching, no `powerPreference`, no
`failIfMajorPerformanceCaveat`), and every effect keeps a static or Canvas 2D
fallback for a `null` stage. The build budget stays strictly below 495 MiB. The
engine chunks (Three.js, GSAP, confetti, Howler) exist only as async chunks
recorded in `react-loadable-manifest.json`; no page's initial JavaScript includes
them, and they are requested only when a descriptor asks for that chunk.

`specs/193-graphics-development-toolkit/` holds this toolkit's specification,
plan, research, tasks and evidence; `app/lib/graphics/README.md` is the usage
guide.
