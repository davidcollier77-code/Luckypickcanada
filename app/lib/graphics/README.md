# Graphics development toolkit

Additive rendering capabilities for cinematic, realistic and gaming-quality
visual enhancements. Nothing here is imported by a page yet, so the live site
renders exactly as it did before this toolkit existed.

The rendering contract is [`docs/graphics-rendering-architecture.md`](../../../docs/graphics-rendering-architecture.md);
this file explains how to use the toolkit without breaking it.

## What is available

| Capability | Package | Where it comes from |
| --- | --- | --- |
| 3D scenes: PBR materials, lighting, depth, shadows, instancing, GLSL shaders | [`three`](https://threejs.org) 0.187 (MIT) | `stage.js` |
| Bloom, ACES tone mapping, sRGB output, SMAA | `three/addons/postprocessing/*` (bundled with Three.js) | `effects.js` |
| glTF / GLB model loading | `three/addons/loaders/GLTFLoader.js` (bundled) | `assets.js` |
| Resource disposal | — | `resources.js` |
| Declarative animation timelines | `gsap` (already a dev dependency, MIT) | `import { gsap } from 'gsap'` |
| 2D/3D motion, drag and layout animation | `framer-motion` (already installed, MIT) | existing components |
| Particle confetti | `canvas-confetti` (already installed, MIT) | existing components |
| Share-card raster composition | `html2canvas` (already installed, MIT) | existing components |
| Additive particle cinematics, metallic meshes, sky light | existing `app/lib/gpu-*.js` + `components/*-engine.js` | existing features |

`three` is a runtime dependency; `@types/three` is the matching dev-time type
package. Both are MIT and free.

## Quick start

```js
import { createThreeStage } from '@/app/lib/graphics/stage.js';
import { createCinematicEffects } from '@/app/lib/graphics/effects.js';

const canvas = canvasRef.current;
const stage = await createThreeStage({
  canvas,
  cameraPosition: { z: 6 },
  onFrame: ({ scene, camera, delta }) => {
    // Animate your own scene here.
    effects?.render() ?? stage.renderer.render(scene, camera);
  },
});

if (!stage) {
  // WebGL unavailable or the chunk failed: keep the existing static artwork.
  return;
}

const effects = await createCinematicEffects({
  renderer: stage.renderer,
  scene: stage.scene,
  camera: stage.camera,
  quality: stage.quality,
  size: stage.size,
});

stage.start();
// ...
stage.dispose();
effects?.dispose();
```

React cleanup must call `dispose()`; it stops the frame loop, disconnects the
resize observer, removes context-loss and reduced-motion listeners, releases
scene resources and the WebGL context.

## Rules the toolkit already enforces

- **Bounded work.** Quality comes from `resolveRenderQuality` in
  `app/lib/graphics-capabilities.js`. Budgets: `high` 2× DPR, MSAA and shadows;
  `balanced` 1.6× DPR, MSAA, no shadows; `constrained` 1.25× DPR, no MSAA, no
  shadows, 0.6× post-processing resolution.
- **The browser owns the backend.** No user-agent or vendor checks, no
  `powerPreference`, no `failIfMajorPerformanceCaveat`, no renderer-string
  branching.
- **Lazy by default.** `import('three')` and the addon imports happen only when
  a stage or effect is created, so a page without 3D ships no Three.js bytes.
- **Paused when idle.** Frames come from `createAdaptiveFrameLoop`, so hidden
  tabs stop, reduced motion paints one static frame, and constrained devices
  step down to 30 fps.
- **Fails soft.** Every entry point returns `null` instead of throwing. Keep a
  static or Canvas 2D fallback for the `null` case.
- **No WebGPU requirement.** WebGPU is still probe-only in this repository; the
  toolkit renders through WebGL. Three's experimental WebGPU renderer is not
  used and no effect may depend on it.

## Adding a feature

1. Commission the visual change first; this toolkit is infrastructure only.
2. Keep the scene inside a canvas that has a static fallback underneath it.
3. Register any model or texture URL with the existing resource-readiness hub
   (`app/lib/resource-readiness.js`) instead of preloading it at module scope.
4. Add the feature's own Playwright evidence and visual baseline review.
5. Measure the production build size; the hard cap is 495 MiB.

## Known limitations

- No hardware GPU is available in the Freebuff Cloud VM, so any graphics the
  toolkit draws there is software-rendered.
- Draco and KTX2 compressed assets need decoder files under `public/`; add them
  with the effect that first needs them. `loadGLTF` handles uncompressed
  glTF/GLB today.
- `@react-three/fiber` is deliberately not installed: it is a second React
  renderer model beside the site's existing vanilla engines. PixiJS is
  deliberately not installed either: its 2D WebGL batching would duplicate the
  existing Canvas 2D and additive WebGL renderers.
- The toolkit is not consumed by any page yet, so it adds no visual effect and
  no bundle chunk today.
