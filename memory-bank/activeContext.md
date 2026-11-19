# Active Context — Graphics Development Toolkit

- **Updated:** 2026-11-19
- **Branch:** freebuff/5675fb1c2b649136e34a4b21
- **Base:** main at 722e17b7
- **Spec Kit feature:** specs/193-graphics-development-toolkit

## Current Task

Equip the repository with premium graphics-development capabilities for future cinematic, realistic
and gaming-quality visuals. Audit existing dependencies, install only what adds genuine value, and
integrate it so future work can use it — without changing any existing visual, artwork, animation,
layout or behaviour. Free/MIT only, mobile and performance preserved, build strictly below 495 MiB.

## Implemented State

- `three` 0.187.0 (runtime) and `@types/three` 0.187.0 (dev) are installed. No other package was
  added; `gsap`, `framer-motion`, `canvas-confetti` and `html2canvas` were already present and are
  reused.
- `app/lib/graphics/stage.js` creates a renderer, scene and perspective camera from
  `resolveRenderQuality` tiers, loads Three.js through a dynamic import, renders through
  `createAdaptiveFrameLoop`, paints one static frame under reduced motion, watches context loss and
  restoration, caps the pixel ratio without touching CSS size, and disposes the loop, observers,
  listeners, scene resources and WebGL context.
- `app/lib/graphics/effects.js` composes `EffectComposer` + `RenderPass` + `UnrealBloomPass` +
  `OutputPass` + `SMAAPass` from `three/addons`, with per-tier bloom strength, resolution scale and
  no bloom/SMAA on the constrained tier.
- `app/lib/graphics/assets.js` lazily loads uncompressed glTF/GLB and returns a disposable scene or
  `null`; `app/lib/graphics/resources.js` disposes geometries, materials and textures.
- `app/lib/graphics/README.md` documents usage, budgets, fallbacks, rejected alternatives and
  limitations; `docs/graphics-rendering-architecture.md` gained the toolkit section.
- Nothing in `app/`, `components/` or any page imports the toolkit. No Three.js chunk is emitted and
  no existing page, component, style or asset changed.

## Verification

- Focused toolkit tests 16/16 and dependency-policy tests 10/10 pass.
- `pnpm exec tsc --noEmit`: exit 0.
- `SPEC_KIT_BASE_REF=FETCH_HEAD ./freebuff-verify.sh`: exit 0 (includes install, Spec Kit gate, QA
  script suites, type check, production build and refresh-docs tests).
- Production build 370.55 MiB (386 MiB by `du -sm`), below the 495 MiB cap, with
  `grep -rl WebGLRenderer .next/static` returning zero files.
- Software-rendered harness (SwiftShader WebGL2): stage and bloom composer created, 34 frames, lit
  pixel readback, `glError 0`, no page error.
- Desktop 1440×900 and mobile 390×844 homepage captures show unchanged visuals and no application
  console error; only the wrapper session's dev HMR WebSocket handshake failures appeared.
- Evidence: `specs/193-graphics-development-toolkit/evidence.md`; captures in
  `artifacts/graphics-development-toolkit/`.

## Limitations

- No hardware GPU in this VM, so no GPU performance measurement exists.
- Draco/KTX2 compressed models are deferred until an effect needs them.
- The toolkit has no production consumer yet; a future effect needs its own browser, mobile,
  accessibility, performance and baseline verification.
- The CI visual regression suite runs after PR creation; it was not run locally.
