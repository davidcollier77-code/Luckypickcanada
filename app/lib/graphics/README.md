# Graphics and audio development toolkit

The creative development layer for Lucky Pick Canada. It wraps the graphics and
audio technologies the project already ships — Three.js, GSAP, Canvas 2D, the
existing additive WebGL cinematics, Howler/Web Audio, confetti and the share-card
raster path — behind one automatic entry point, and extends the existing
Resource-Readiness Hub instead of adding a second preloader.

Nothing here changes a current experience. Every existing artwork, animation
sequence, sound, timing and layout keeps its own code and its own renderer. What
this layer adds is *capability*, *selection* and *preparation*.

The rendering contract is [`docs/graphics-rendering-architecture.md`](../../../docs/graphics-rendering-architecture.md).

## What is available

| Capability | Technology | Entry point |
| --- | --- | --- |
| 3D scenes: PBR materials, lighting, shadows, depth, instancing, GLSL | Three.js 0.187 (MIT), lazy | `stage.js`, `runtime.js` |
| Cinematic grading: SMAA, HDR bloom, ACES tone mapping, sRGB output | Three.js addons (bundled) | `effects.js` |
| glTF / GLB models | `GLTFLoader` (bundled), lazy | `assets.js` |
| Materials: gold, enamel, glass, emissive glow | Three.js presets | `materials.js` |
| Lighting: tiered hemisphere/key/rim/fill rig with event pulses | Three.js | `lighting.js` |
| GPU particles: bounded, seeded, intensity-controlled | Three.js `Points` | `particles.js` |
| Timelines, transitions, staggered choreography | GSAP, lazy | `timeline.js` |
| Managed 2D drawing: DPR cap, adaptive frames, resize, teardown | Canvas 2D | `canvas-surface.js` |
| Synchronised sound cues on a visual timeline | Existing Howler/Web Audio path | `audio-sync.js` |
| Sound-reactive visuals: envelope from the live mix bound to lights, particles and values | Web Audio analyser on the existing Howler graph | `audio-reactivity.js` |
| Shared visual-QA sandbox: deterministic scenes, frozen frames, PNG capture, agent inspection API | This toolkit, development-only route | `workbench.js`, `components/graphics/CreativeWorkbench.jsx` |
| Automatic technology selection and surface creation | This toolkit | `technologies.js`, `runtime.js` |
| Automatic resource discovery and preparation | Resource-Readiness Hub | `experiences.js`, `adapters.js` |
| Reusable React surface | React | `components/graphics/CreativeSurface.jsx` |
| Worked example (not mounted) | Everything above | `examples/golden-motes.js` |

The Lucky Meter's whole physical meter — the struck medallion, the twelve
seasonal chambers, the central leaf, the fixed 7:30 pointer with its curved arm
and spout, the receiving vessel, the pour and the golden transfer beam — is one
scene (`app/lib/lucky-meter/meter-scene.js`) built on `createCreativeSurface`,
the material library, the light rig and the particle field. The tier
celebrations stay on the existing cinematic family (`app/lib/gpu-*.js`,
`cosmic-event-engine.js`). The meter is registered once as `lucky-meter` with
the `three` chunk; the retired `lucky-meter-vessel` entry no longer exists. Its
CSS composition is both the first paint and the permanent fallback when WebGL
is unavailable or a context is lost.

## Automatic behaviour

### Technology selection

A feature describes what it needs; `selectGraphicsTechnologies` decides what
draws it.

```js
import { selectGraphicsTechnologies } from '@/app/lib/graphics/technologies.js';

selectGraphicsTechnologies({ dimension: '3d', postProcessing: true });
// → { renderer: 'three', fallbacks: ['canvas2d', 'dom'], postProcessing: true, … }

selectGraphicsTechnologies({ renderer: 'webgl' });
// → { renderer: 'webgl' } — an existing engine keeps its frames.

selectGraphicsTechnologies({ particles: true });
// → { renderer: 'canvas2d', fallbacks: ['dom'] }
```

Reduced motion selects no motion technology; it never downgrades the renderer.
Without WebGL, a 3D request resolves to Canvas 2D and then DOM, so the caller
always has a static fallback.

### Resource discovery and preparation

`app/lib/graphics/experiences.js` is the one registry. A descriptor declares the
renderer, the engine chunks, the texture/model URLs and the sound cues:

```js
{
  id: 'my-experience',
  renderer: 'three',            // or 'canvas2d' | 'webgl' | 'dom'
  dimension: '3d',
  postProcessing: true,
  chunks: ['three', 'gsap'],
  textures: [{ id: 'sky-texture', url: '/images/sky.avif' }],
  audio: [{ id: 'my-chime', prepare: prepareMyChime }],
}
```

`creativeResourcesFor` derives the hub resources (`module`, `texture`, `model`,
`audio`) from that descriptor. The readiness manifest spreads the derived list
into the experience's registration, and `installCreativeExperiences()` installs
the adapters and registers any visual experience that has no manifest entry. No
one has to remember an individual module, texture or sound registration.

Preparation is still the hub's: it is deduplicated, bounded to the adaptive
plan's parallel-request limit, paused for an active experience, a hidden page or
Save-Data, started only after the page has settled, and retried once on failure.
Ready, failed and skipped states are reported truthfully. The hub never plays a
sound or draws a frame.

### Runtime and cleanup

`createCreativeSurface()` (used by `CreativeSurface.jsx`) returns the same
lifecycle for every renderer — `start`, `stop`, `render`, `resize`, `dispose` —
so a component never branches on the technology:

- Three.js path: a budgeted stage plus the composer when requested.
- Canvas 2D path: a managed surface with the tier's DPR cap and adaptive frames.
- Existing-engine/DOM path: no renderer is created; the plan is reported and the
  lifecycle is a safe no-op.

Frames come from `createAdaptiveFrameLoop`, so a hidden tab stops and a
constrained device steps down. Reduced motion paints one composed frame.
Context loss stops the surface and restoration resumes it. `dispose()` releases
the composer, scene resources, listeners, timers and the WebGL context, and is
safe to call twice.

### React

```jsx
'use client';
import { useCreativeExperience } from '@/app/lib/use-creative-experience.js';

export default function Experience() {
  const { plan, readiness, prepare } = useCreativeExperience('my-experience');
  // plan.renderer, plan.postProcessing, plan.reducedMotion are already resolved.
  // Preparation is automatic after the page settles; `prepare()` forces it now.
  return null;
}
```

```jsx
import CreativeSurface from '@/components/graphics/CreativeSurface';

<CreativeSurface
  className="absolute inset-0"
  requirements={{ dimension: '3d', postProcessing: true, particles: true }}
  onSurface={(surface) => surface?.start()}
  onFrame={({ delta, elapsed }) => { /* animate */ }}
/>;
```

## A complete 3D scene

```js
import { createCreativeSurface } from '@/app/lib/graphics/runtime.js';
import { createMaterialLibrary } from '@/app/lib/graphics/materials.js';
import { createLightRig } from '@/app/lib/graphics/lighting.js';
import { createParticleField } from '@/app/lib/graphics/particles.js';
import { createMotionTimeline } from '@/app/lib/graphics/timeline.js';
import { createAudioSync } from '@/app/lib/graphics/audio-sync.js';

const surface = await createCreativeSurface({ canvas, requirements: { dimension: '3d', postProcessing: true } });
if (!surface || surface.kind !== 'three') return; // keep the static artwork

const THREE = surface.stage.three;
const materials = createMaterialLibrary(THREE, { quality: surface.plan });
const rig = createLightRig(THREE, { quality: surface.stage.quality, budget: surface.stage.budget });
rig.addTo(surface.stage.scene);

const motes = createParticleField(THREE, { count: 900, quality: surface.stage.quality });
surface.stage.scene.add(motes.points);

const timeline = await createMotionTimeline({ reducedMotion: surface.plan.reducedMotion });
const audio = createAudioSync({ resolve: (name) => preparedSounds[name] });
timeline?.call(() => { rig.pulse(1); audio.cue('chime'); }, 0.4);

surface.start();
timeline?.play();

// teardown
timeline?.dispose();
audio.dispose();
motes.dispose();
rig.dispose();
materials.dispose();
surface.dispose();
```

`examples/golden-motes.js` is this scene as a runnable module. It is deliberately
not mounted by any page, so it adds no chunk and no visual change.

`createAudioSync().attach(timeline, schedule)` accepts the `createMotionTimeline`
wrapper or a raw GSAP timeline; `at` is forwarded as the position in both cases.

## Sound-reactive cinematics

`audio-reactivity.js` makes the visuals follow the sound the visitor is already
hearing. It creates no audio context and no player: one shared `AnalyserNode`
taps the mix Howler already built (`masterGain → analyser → 0-gain →
destination`), so the audible output is unchanged.

Ask for it declaratively — `reactiveAudio: true` in the requirements — and the
runtime creates the envelope and includes it on every frame:

```js
const surface = await createCreativeSurface({
  canvas,
  requirements: { dimension: '3d', particles: true, reactiveAudio: true },
  onFrame: ({ delta, envelope }) => {
    // envelope.level / bass / mids / highs / transient / peak are 0–1
  },
});

surface.reactive?.bindLightRig(rig);
surface.reactive?.bindParticleField(motes);
surface.reactive?.bindValue(material, 'emissiveIntensity', { min: 0, max: 2 });
surface.reactive?.onBeat((strength) => body.scale.setScalar(1 + strength * 0.08));
```

The envelope is smoothed asymmetrically (fast attack, slow release) and reports
a transient when the mix jumps, with a 140 ms cooldown so one loud hit is one
accent. Reduces motion switches it off entirely, a hidden page freezes it, and a
missing or blocked audio graph resolves to a neutral all-zero envelope — the
visual keeps its authored resting state. `selectGraphicsTechnologies` reports
`audioReactive` plus the reason (`sound-reactivity-enabled`,
`sound-reactivity-reduced-motion`, `sound-reactivity-unavailable`).

Howler cues declared `html5: true` play through a media element rather than
`masterGain`. When the browser supports `createMediaElementSource`, a playing
cue's element is routed through the same Howler `AudioContext`: it feeds the
shared analyser for measurement and the context destination at unity for
unchanged playback. The analyser's own output stays on its silent branch, so
the audible mix does not change. Capture is only attempted on a running
context and for same-origin (or `blob:`/`data:`) media. Because capture moves
an element's output into the context, the module also keeps that context
running once a cue is captured: Howler's automatic suspension is switched off,
and a suspended context is resumed while a captured cue is playing, so a
rerouted cue is never silenced by inactivity. A browser without media capture, a
cross-origin element, or an element another owner already captured keeps playing
unanalysed: the envelope stays neutral. A failed analysis edge is retried on the
next scan instead of marking the cue as analysed.
Web Audio cues — the Lucky Meter set and the Crystal Ball sounds — are measured
exactly as before.

## Creative Workbench

The workbench is the shared sandbox for building and reviewing visuals. It
mounts the catalogue in `workbench.js` through the same runtime a production
feature uses, at a forced tier and seed, with deterministic controls:

- choose a scene, tier (`high`/`balanced`/`constrained`), seed and reduced motion;
- scrub the scene clock to freeze one composed frame;
- play an existing Lucky Meter recording and watch the envelope drive lights,
- play that recording through Howler's `html5: true` path (`playHtml5Cue`) to
  verify media-element capture, and read `audio.html5Sources` /
  `audio.html5Playing` from the inspection state;
  particles and exposure;
- capture a PNG and download it.

Two behaviours keep the sandbox trustworthy. `capture()` pauses through the same
state path the UI uses, reads the frozen frame back and resumes only if the scene
was playing, so the transport, the reported state and the timestamp in the
filename always agree. And a cue that starts long after mount re-arms analyser
attachment: the retry budget is not a permanent lockout, so the first late cue is
still measured instead of leaving the visual silently neutral.

Agents drive the same controls through `window.__creativeWorkbench`:

```js
__creativeWorkbench.getState();            // plan, diagnostics, surface, envelope, fps, errors
__creativeWorkbench.listScenes();
__creativeWorkbench.selectScene('reactive-aurora');
__creativeWorkbench.setTier('constrained');
__creativeWorkbench.setReducedMotion(true);
__creativeWorkbench.setTime(2.5);          // deterministic, paused frame
await __creativeWorkbench.capture();       // { ok, filename, width, height, bytes }
__creativeWorkbench.readCapture();         // PNG data URL, or null
```

`getState()` is version 2. Its `diagnostics` object is the shared adaptive
payload: `plan` (tier, frame rate, animation budget, reduced-motion/visibility
and reasons), `monitor` (the plan-aware status, evidence, measured fps, target,
thresholds, warnings and per-source samples) and `device` (capability tier,
confidence, unknown signals, memory and cores). The Performance health panel
shows the same monitor, and a 30 fps adaptive plan is expected to report 30 fps
as healthy rather than strained.

The route is `/workbench/creative`. It is development only: production answers
404 unless the deployment sets `CREATIVE_WORKBENCH=1` for a deliberate review
environment. It adds no visitor navigation, no page chunk on existing routes and
no second renderer. Playwright remains the repository's browser tool; the page
gives it a stable surface to inspect and photograph. For WebGL canvases, use a
Playwright screenshot after `setTime()` — a direct `toDataURL` read-back can be
empty without `preserveDrawingBuffer`, which the stage deliberately does not set.

## Rules the toolkit enforces

- **Bounded work.** Quality comes from `resolveRenderQuality`; DPR, shadows,
  light count, particle count and post-processing resolution are capped per tier.
- **The browser owns the backend.** No user-agent or vendor branching, no
  `powerPreference`, no `failIfMajorPerformanceCaveat`, no renderer strings.
- **Lazy by default.** `three`, `gsap`, `canvas-confetti` and `howler` are loaded
  through literal dynamic imports in `engine-chunks.js`, only when a registered
  experience asks for them.
- **Fails soft.** Every entry point returns `null` or a no-op instead of throwing;
  callers keep their static or Canvas 2D fallback. A model request that stops
  making progress resolves to `null` after a stall window instead of leaving the
  caller waiting.
- **No WebGPU requirement.** WebGPU remains probe-only; the toolkit renders
  through WebGL.
- **One preparation system.** The Resource-Readiness Hub is the only preloader.
  `module`, `texture` and `model` are adapters on it, not a second scheduler.

## Known limitations

- No hardware GPU is available in the Freebuff Cloud VM; any graphics it draws is
  software-rendered.
- Draco and KTX2 compressed models need decoder files under `public/`; add them
  with the effect that first needs them. `loadGLTF` handles uncompressed
  glTF/GLB.
- `@react-three/fiber` and PixiJS are deliberately not installed: they would add
  a second React renderer model or duplicate the existing 2D/WebGL pipelines.
- `gsap` remains declared in `devDependencies`; Next and the Workers build resolve
  it at build time, so no dependency change is required to use it.
- The toolkit draws nothing by itself. A visual change is still a commissioned
  feature with its own review, Playwright evidence and baseline update.
