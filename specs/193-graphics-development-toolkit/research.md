# Research: Graphics Development Toolkit

**Date**: 2026-11-19

## 1. Existing capability audit

| Capability | Already present | Evidence |
| --- | --- | --- |
| CSS/DOM motion | `framer-motion` ^13.1.0, Tailwind 4 | `package.json`, components |
| Declarative timelines | `gsap` ^3.15.0 | `package.json` devDependencies |
| Canvas 2D particles/confetti | `canvas-confetti`, custom canvases | `package.json`, `app/` |
| Share-card raster | `html2canvas` | `package.json` |
| WebGL 1 additive cinematics, shaders | `app/lib/gpu-particles.js`, `components/cosmic-event-engine.js` | repository |
| Procedural metallic meshes, lighting bus | `gpu-geometry.js`, `gpu-lighting.js`, `gpu-scene-light.js`, `gpu-math.js` | repository |
| Capability detection, tiers, context loss | `app/lib/graphics-capabilities.js` | repository |
| Adaptive frame rate, visibility, reduced motion | `app/lib/adaptive-performance.js` | repository |
| Resource preparation | `app/lib/resource-readiness.js` | repository |
| 3D engine (PBR, depth, shadows, instancing), post-processing, glTF | **absent** | no `three`/`babylon`/`pixi` in `package.json` or `node_modules` |

`gsap` is installed but not imported anywhere in `app/` or `components/` today (grep found no
`from 'gsap'`). It is left where it is: pnpm installs dev dependencies in every workflow and the
OpenNext build resolves them, so moving it would churn a protected manifest for no functional gain.
The README records it as available.

## 2. Selection

**Install `three@0.187.0` (MIT).** It is the only gap in the audit that maps directly to
"cinematic, realistic, gaming-quality": physically based materials, real lighting and shadow maps,
depth and instancing, GLSL shaders, HDR post-processing and glTF loading. It is free, has no
runtime service, no account and no data collection, and its post-processing and loaders ship in the
same package, so no second dependency is required. `@types/three` 0.187.0 matches.

Verified in the installed package:

- `three/build/three.module.js` is 658,900 bytes; `three.core.js` 1,474,799 bytes. Webpack
  tree-shakes named imports, and nothing imports the package yet, so no chunk is emitted today.
- Addons are exported as `three/addons/*` and exist on disk under
  `node_modules/three/examples/jsm/`.
- `EffectComposer(renderer, renderTarget?)`; `EffectComposer.setSize(width, height)` multiplies by
  its own pixel ratio and calls `pass.setSize(effectiveWidth, effectiveHeight)`, so one call resizes
  every pass.
- `UnrealBloomPass(resolution, strength = 1, radius, threshold)` copies only `resolution.x/y`, so a
  plain `{ x, y }` object is accepted.
- `SMAAPass()` takes no arguments in r187 and exposes `setSize`/`dispose`.
- `OutputPass()` applies the renderer's tone mapping and output colour space; it must be the
  colour-management pass in the chain.
- `GLTFLoader` resolves a `gltf` object with `scene`, `scenes`, `animations`, `cameras`, `asset`.

## 3. Rejected options

| Option | Why rejected |
| --- | --- |
| PixiJS | A 2D WebGL batcher. The site already has Canvas 2D and additive WebGL renderers for those effects; a second 2D pipeline duplicates them and adds bundle weight without new 3D capability. |
| `@react-three/fiber` + `drei` | A second React rendering paradigm alongside the existing imperative engines; heavy transitive tree and a different mental model from the repository's renderer pattern. Plain Three.js is the smaller, compatible fit. |
| `postprocessing` (pmndrs) | Bloom, AA and colour management are already in Three.js addons. Revisit only if a commissioned effect needs SSAO, DOF or TAA beyond Three's own passes. |
| Babylon.js | A larger full engine with its own tooling and asset conventions; Three.js is smaller and closer to the existing hand-written WebGL style. |
| Three's experimental WebGPU renderer | WebGPU is probe-only in this repository and `navigator.gpu` is unavailable in the measured environments. Production may not require it. |
| Draco/KTX2 decoders | They need decoder binaries served from `public/`; nothing loads compressed assets yet, so shipping them would be unused weight. |
| A new build step or asset pipeline | Not needed for the capability; the existing Next/webpack build handles dynamic imports. |

## 4. Integration design

- **No duplicate capability layer.** Stage quality comes from `resolveRenderQuality`, context-loss
  watching from `watchContextLoss`, motion preference from `prefersReducedMotion` /
  `onReducedMotionChange`, and cadence from `createAdaptiveFrameLoop`.
- **Lazy.** `import('three')` and every addon import are dynamic and only run when a caller creates
  a stage/effect/model. This keeps the initial bundle and mobile data cost unchanged.
- **Fail soft.** A missing WebGL context, a failed chunk, an addon error, a bad model or a throwing
  frame callback all resolve to `null`/a stopped loop, never an uncaught page error.
- **Ownership.** The caller owns the canvas, scene content and DOM; the toolkit owns only GPU
  resources and frame scheduling, and releases them in `dispose()`.
- **Transparency preserved.** The renderer clears to `0x000000` alpha 0 so the existing artwork
  remains visible behind a scene, matching the existing far/near additive stage approach.

## 5. Mobile, performance and cost

- Tier caps: 2× DPR (high), 1.6× (balanced), 1.25× (constrained); shadows and MSAA only where the
  tier allows; post-processing buffer scale 1 / 0.85 / 0.6.
- Hidden documents and reduced motion stop the loop; constrained devices run at the adaptive plan's
  frame rate (30 fps).
- All packages are MIT, no paid service, no API key, no environment variable, no hosting change.
- Today's build impact is zero bytes of application JavaScript because nothing imports the toolkit;
  the production build is measured anyway and must stay below 495 MiB.

## 6. Known limitations recorded in the code and README

- No hardware GPU in the Freebuff Cloud VM: software rendering only for any measurement or capture.
- Compressed model support (Draco/KTX2) is deferred.
- The toolkit has no production consumer yet, so its happy-path rendering is verified by a
  standalone software-rendered harness rather than by a site route.
