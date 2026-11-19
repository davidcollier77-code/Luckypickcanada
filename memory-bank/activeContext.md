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

## Continuation — completed automatic integration (PR #1966, 2026-11-19)

The owner directed that the toolkit become automatically available and usable, not merely installed.

- `app/lib/graphics/technologies.js` selects the render technology (Three.js, Canvas 2D, an existing
  WebGL engine, or DOM) plus motion and audio technology from the declared requirements, the shared
  capability probes and the adaptive tier. Existing `webgl` experiences are never moved to Three.js.
- `app/lib/graphics/experiences.js` is the single visual registry. `creativeResourcesFor` derives the
  hub resources (`module`, `texture`, `model`, `audio`) from one descriptor; the readiness manifest
  spreads them into its experience definitions, and `installCreativeExperiences()` installs the
  adapters and registers any future visual experience automatically. No second preloader exists.
- Building blocks: `canvas-surface.js` (managed Canvas 2D), `timeline.js` (lazy GSAP),
  `materials.js`, `lighting.js`, `particles.js`, `audio-sync.js`, `runtime.js` (one lifecycle for
  every renderer), `components/graphics/CreativeSurface.jsx`, `use-creative-experience.js` and the
  unmounted example `examples/golden-motes.js`.
- The Lucky Meter and the Lucky Card Reveal call `useCreativeExperience`; their derived resources
  (Lucky Meter sound set, reveal sparkle/applause/pop, confetti chunk) are prepared by the hub after
  the page settles. Their artwork, timing, sounds, responsive behaviour and fallbacks are unchanged.
- PR review findings were repaired: `Clock.start()` reset, context loss before `renderer.dispose()`,
  SMAA before `OutputPass`, exposed bloom handle with `setBloom`, real shared-layer guard assertion,
  README double render. Graphite's context-restore claim was checked against Three.js's
  `WebGLRenderer.onContextRestore` and is not a defect.
- Verification: 103 files / 1083 Vitest tests, `tsc --noEmit` exit 0,
  `SPEC_KIT_BASE_REF=722e17b7 ./freebuff-verify.sh` exit 0, production build 378,582,202 bytes
  (361.1 MiB; 376 MiB by `du -sm`), zero page chunks containing Three.js (engine code is async-only).
  Playwright visual runs and the CI checkers remain pending after the push; no ESLint config exists.

### Round 2 (current head)

Five genuine review findings were repaired: `CreativeSurface` requirement identity, explicit
`aria-hidden`, the `audio-sync.attach` timeline contract, once-per-teardown disposal of shared
resources, and a stall timeout for `loadGLTF`. Clock reset, context-loss ordering, SMAA order and the
bloom handle remain fixed from round 1; the context-restore and camera-aspect claims were re-checked
and are not defects. Focused tests 41, full suite 103 files / 1087 tests, `tsc` exit 0,
`freebuff-verify.sh` exit 0, clean build 394.53 MiB by `du -sb .next public`.
