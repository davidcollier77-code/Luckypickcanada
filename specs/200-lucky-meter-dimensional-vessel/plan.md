# Implementation Plan: Lucky Meter Three-Dimensional Vessel and Pour

**Feature**: `specs/200-lucky-meter-dimensional-vessel`

**Branch**: `freebuff/856a686c49f64f37f6ddb027`

## Technical Context

- Next.js 16 App Router, React 19, Tailwind 4; Three.js 0.187 is already a
  dependency, so no package is added.
- The vessel surface uses the shared toolkit: `createCreativeSurface`
  (`app/lib/graphics/runtime.js`), `createMaterialLibrary`,
  `createLightRig`, `createParticleField`, and the adaptive tier from
  `graphics-capabilities.js`. No second renderer, frame loop or preloader.
- The existing medallion, wheel and celebration engines stay. Only the wheel's
  radii and the medallion's albedo profile change.
- The scene is a separate experience descriptor (`lucky-meter-vessel`) so the
  readiness hub derives the Three.js chunk through `useCreativeExperience`.
- Home/countdown is derived state in `DailyResonance`, not a new timer.

## Architecture Decisions

1. **Commissioned Three.js surface, existing engines preserved.** The toolkit's
   stage owns the renderer, ResizeObserver, reduced motion, context loss and
   teardown. The scene builds the lathed glass, liquid, stream, splash and dust
   and exposes an imperative `setState` so 60 fps storyboard values never
   recreate the scene.
2. **A fresh canvas per mount.** Three.js teardown releases the WebGL context;
   a canvas whose context was released cannot reliably serve another. React
   Strict Mode mounts effects twice in development, so the canvas is created
   imperatively after a zero-delay tick and removed on cleanup. This removes
   the lost-context white canvas.
3. **Warm up before the pour.** The vessel panel mounts as soon as a reading
   exists and stays `hidden` until the vessel stage, giving the engine the
   whole generation/landing beat to compile shaders and compose its
   environment. Hidden content is excluded from the accessibility tree and
   from layout.
4. **CSS remains the fallback.** The existing CSS vessel renders under the
   canvas and is shown whenever the scene is unavailable or still pending.
5. **No post-processing for this surface.** A full-screen bloom chain costs
   more shader compilation than it adds on a 416×216 scene; emissive liquid,
   additive stream layers, the env-lit glass and the gold dust carry the light.
6. **Home contract without a flash.** `showHome = !isCompact && (dockReady ||
   !result)`; `showCountdown = !isCompact && dockReady && !stageActive`. Home is
   in its top-right position from the server-rendered first paint, hides the
   moment the reveal starts and returns with the countdown only after the Spark
   and the final hold. The countdown never appears before the dock.

## Files

| File | Purpose |
| --- | --- |
| `app/lib/lucky-meter/vessel-scene.js` | New Three.js glass, liquid, stream, splash, dust, environment and controller |
| `components/LuckyMeterVessel.tsx` | New panel: warm-up host, imperative canvas, CSS fallback, caption |
| `components/DailyResonance.tsx` | Mounts the vessel early, Home/countdown derivation |
| `components/LuckyMeterRing.jsx` | Wheel radii, bevel shading, flat pour streak removed |
| `components/LuckyMeterSkyWriting.tsx` | Whole-word glyph reveal and flourish |
| `app/globals.css` | Canvas host, gold script, dock arrival, reduced-motion rules |
| `app/lib/gpu-geometry.js` | Higher-contrast medallion rim, bezel, groove and well |
| `app/lib/graphics/experiences.js` | `lucky-meter-vessel` descriptor |
| `app/lib/graphics/README.md`, `docs/graphics-rendering-architecture.md` | Toolkit documentation |
| Tests | Updated Home contract, hidden warm-up panel, Playwright expectations |

## Verification Plan

1. TypeScript: `pnpm exec tsc --noEmit`.
2. Unit: focused Lucky Meter suites, then the full `pnpm test`.
3. Browser: `lucky-meter-daily-resonance.spec.ts` on the desktop and mobile
   projects; manual Playwright captures at arrival, open, pour and dock.
4. Production build: `pnpm build`, measured against 495 MiB.
5. Repository gate: `./freebuff-verify.sh`.
6. Confirm no new dependency; confirm the CSS fallback with WebGL disabled.

## Risks and Limits

- This Cloud VM has no hardware GPU; the Three.js shader compilation is slow
  under software rendering. The scene warms up during the generation beat and
  is ready before the pour when the dev server is warm. A cold first compile
  can land during the pour, in which case the CSS vessel covers the gap.
- The scene is not a fluid simulation; the stream is a revealed curved tube
  with a leading droplet, a splash ring and beads. It is deterministic and
  cheap on a phone.
- Screenshot baselines are not regenerated in this task.
