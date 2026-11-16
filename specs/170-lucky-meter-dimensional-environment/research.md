# Research: Lucky Meter Dimensional Environment

**Feature**: `specs/170-lucky-meter-dimensional-environment`
**Date**: 2026-11-15

## 1. What the delivered experience actually looks like

Measured, not assumed. Captured with the repository Playwright build against a
production Next.js build at 1440 × 900 (the `desktop` project viewport) with the
`artifacts/lucky-meter-cinematic-v2-qa/qa-capture.mjs` harness.

| Observation | Evidence |
| --- | --- |
| The medallion is CSS only: `resonance-ring-rim` conic gradient, three masked `resonance-ring-arc` layers and a flat `bg-[radial-gradient(...)]` disc. | `components/LuckyMeterRing.jsx`, `app/globals.css:537-723` |
| The rim's brightest band sits at the bottom-left of the circle, which is lighting from below. There is no bevel edge, no thickness and no perspective. | `desktop-welcome.png` |
| Both maple leaves are the same static `/assets/golden-maple-leaf.svg` at 44 px and 36 px. The silhouette is a symmetric radial starburst, not a maple leaf. | `components/LuckyMeterRing.jsx:88-110`, `desktop-welcome.png` |
| A meteor renders as a thin, dead-straight, uniform white line with a round dot at the head. | `desktop-meteor-045.png` |
| A red firework renders as a small ragged cluster of uniform dots in one corner; the sky around it is unchanged. | `desktop-fireworks-042.png` |
| A lightning frame sampled between strikes is visually identical to the welcome frame — no haze, no afterglow, no atmosphere. | `desktop-lightning-045.png` |
| Frame timing on this host is software rendered (ANGLE/SwiftShader, no `/dev/dri`): 24–29 FPS at 1440 × 900 during an event. | `before/report.json` |

Conclusion: the effects are additive 2D point sprites on two canvases. Depth is
simulated by choosing a different canvas, not by projecting geometry. Nothing
shares a light model, so nothing can illuminate anything else.

## 2. Decision: extend the existing WebGL 1 pipeline, do not add an engine

`docs/graphics-rendering-architecture.md` requires future 3D work to use the
existing capability layer, keep work bounded, keep WebGPU optional and provide a
fallback.

Considered options:

| Option | Verdict |
| --- | --- |
| Add three.js or a similar engine | Rejected. A new runtime dependency to render one medallion, a dozen leaves and a few extra shader passes is disproportionate, costs bundle size against a project rule of near-zero cost, and duplicates context/lifecycle handling the repository already owns. |
| WebGL 2 only, with a WebGL 1 fallback | Rejected. The lighting, depth testing and geometry required here are all WebGL 1 features. A second shader dialect would double the surface with no visual gain and would need a second fallback path. |
| Extend the WebGL 1 renderers with a lit-mesh program, a projected camera and a shared light set | **Selected.** Reuses `app/lib/gpu-particles.js` context creation and lifecycle helpers, keeps one dialect, keeps every existing fallback. |

The existing point pipeline stays. A second program family (lit meshes) and a
third (full-screen sky light) are added beside it in `app/lib/`.

## 3. Decision: one shared camera model for all effects

Every effect is authored in a simple camera space:

```
F  = 1000                      // focal length in pixels
Z  = 700 / depth               // view depth; depth 0.35 far … 1.6 near
s  = F / Z = 1.43 * depth      // screen scale for that depth
sx = cx + X * s
sy = cy + Y * s
```

Because projection is a real perspective divide, a straight line in world space
projects to a straight screen line but its screen speed and width vary along the
line. Trails therefore converge toward the vanishing point instead of being
uniform, which is exactly the "distance and perspective" the brief requires, and
it costs two multiplies per sample.

Burst centres keep an artistic screen position by back-solving world X and Y
from the desired screen point at the chosen depth:
`X = (sx - cx) / s`. So composition stays controlled while scale, shape and
motion stay physical.

## 4. Decision: one shared light model across canvases

The medallion, the leaves and the event effects live on separate canvases for
layer-order reasons that spec 164 established. They cannot share a depth buffer,
but they must share lighting or the scene still looks like unrelated layers.

Solution: `app/lib/gpu-scene-light.js`, a tiny mutable light bus.

- The event engine publishes up to four screen-space lights per frame: position
  in CSS pixels, radius, colour and intensity. Lightning strikes and firework
  detonations are the sources.
- The medallion and ornament renderers read the same set and add its
  contribution to their shading each frame.
- The bus allocates its arrays once. Publishing is a handful of assignments, and
  readers that are paused simply stop reading.

This is what makes an explosion measurably change the medallion's gold, which is
the brief's "the medallion and effects should feel like parts of the same
environment".

## 5. Decision: procedural geometry for the medallion and the leaves

**Medallion** — a lathe (surface of revolution) over an authored 2D profile:
outer chamfer, flat rim, milled coin edge (radius modulated by `cos(48θ)`),
recessed step, raised inner bezel, and a gently domed enamel well. Per-vertex
albedo distinguishes polished gold from dark enamel, so it is one buffer and one
draw call. 192 radial segments keep the milled edge crisp at 100 % zoom.

**Maple leaf** — the silhouette is an explicit 11-point Canadian maple-leaf
polygon (apex, two upper lobes, two mid lobes, two lower lobes, two base points,
stem), mirrored per side. It is triangulated with ear clipping, extruded to a
thickness, and given a two-ring bevel on both faces so edge highlights appear as
the leaf turns. Front and back faces are domed slightly away from the centre,
which reads as stamped repoussé metal rather than a flat plate.

Both builders are pure functions in `app/lib/gpu-geometry.js` and are unit
tested (vertex counts, outward normals, closed silhouette, ear-clipping
robustness) without a GPU.

## 6. Decision: physically motivated metal shading

The fragment shader combines:

- a tight specular lobe (exponent ~220) for the polished rim,
- a broad second lobe (exponent ~26) for the satin face,
- Schlick Fresnel with the metal's albedo as `F0`, so grazing angles brighten,
- a procedural environment reflection: a sky-to-horizon gradient sampled by the
  reflected view vector, tinted by the albedo (this is what makes gold look like
  gold rather than orange plastic),
- hemisphere ambient with warm ground and cool sky, and
- point contributions from the shared scene lights.

Output goes through an ACES-style filmic curve and an sRGB transfer, so
highlights roll off instead of clipping to flat white.

## 7. Decision: the sky-light pass is what "illuminates the sky"

An additive full-screen pass draws up to four coloured lights with an
atmospheric falloff and a low-frequency fbm modulation so the light has
structure instead of being a flat radial gradient. Because it is additive on a
transparent canvas over the untouched artwork, it brightens the Milky Way
photograph rather than covering it.

The golden finale publishes the strongest light of the sequence and the light
decays over roughly a second, which is the linger the brief asks for.

## 8. Decision: smoke takes colour from the light

Smoke puffs keep a neutral grey albedo. Each frame their tint is
`mix(grey, Σ(lightColour × falloff), amount)`, computed against the same shared
light set. This is cheap (≤ 4 lights × ≤ 60 puffs) and is the specific behaviour
the brief calls out: "Smoke should catch the red, white and silver light."

## 9. Performance approach

- Everything added is budgeted from `resolveRenderQuality`; the constrained
  profile creates no near ornament layer and no near effect surface.
- New geometry is static and uploaded once per context; per-frame work is
  uniform updates and one draw call per mesh.
- Ornament canvases render at a capped backing-store ratio (≤ 1.25) because the
  leaves are soft-focus depth elements; this keeps their fill cost small.
- The medallion canvas is small (the ring's own box), so antialiasing is
  affordable there and only there.
- The smoke, fragment and near-spark populations draw from the existing
  per-frame point budget rather than adding a parallel budget.
- The existing governor is extended, not replaced: sustained low frame rate still
  steps resolution and particle scale down before dropping the near layers.

## 10. Repository constraints confirmed before planning

- `AGENTS.md` requires the crawl: memory bank read, `.freebuff/` groups
  (`creation`, `polishing`, `testing`) read, `.docs/manifest.json` consulted,
  Playwright skill guidance read before browser work.
- QA checker requirements inspected before the specification:
  `classify-visual-changes.sh` will require visual QA for every changed
  `components/`, `app/` or `app/globals.css` path; the fail-closed behaviour is
  preserved and no checker is modified by this feature.
- `PR_SUBMISSION.md` requires checker self-review, local command results and an
  honest separation of executed checks from PR-triggered ones.
- Production build must stay strictly below 495 MiB; the measured baseline for
  this branch before any change is 320.55 MiB.
- No dependency, route, server write, database, payment, auth, hosting or secret
  change is required or permitted.
