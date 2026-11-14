# Implementation Plan: Adaptive Graphics Capability Foundation

**Branch**: `freebuff/ac8a265279e6080fde702b01` | **Date**: 2026-11-14 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/162-graphics-capability-foundation/spec.md`

## Summary

Add one small, dependency-free module at `app/lib/graphics-capabilities.js` that provides lazy
feature detection, a device profile, safe Canvas 2D/WebGL acquisition, reduced-motion and
visibility helpers, and context-loss watchers. Adopt it in the active renderers: the homepage star
canvas, the Aurora canvas, the WebGL cinematic stage, the Lucky Card reveal canvases, the
confetti celebrations and the canvas share-image path. Preserve every default visual, keep the
standard Playwright and SwiftShader configurations untouched, and add focused unit/source guards
plus Chromium browser checks.

## Technical Context

**Language/Version**: JavaScript/TypeScript on Node.js 26.x; Next.js 16 App Router, React 19.

**Primary Dependencies**: No new packages. The feature uses standard browser APIs only
(`HTMLCanvasElement.getContext`, `matchMedia`, `document.visibilityState`, canvas context events).

**Storage**: N/A.

**Testing**: Vitest + Testing Library for unit/source guards; Playwright (`playwright.config.ts`,
unchanged) for Chromium desktop and mobile checks; `./freebuff-verify.sh` for the repository gate,
type check and production build.

**Target Platform**: Modern Chrome, Edge, Firefox, Samsung Internet and Safari, desktop and mobile.
The available verification browser is Playwright Chromium; Firefox and WebKit are not installed in
this workspace and will be reported as untested.

**Project Type**: Next.js web application with a client-side rendering layer.

**Performance Goals**: No probe at import time; at most one lazy probe per capability per page
lifetime; no capability check inside a render loop; animation loops stop in hidden tabs; high-DPR
canvas backing stores are capped.

**Constraints**: Preserve artwork, layout, animation, audio and functionality. Do not change
`playwright.config.ts`, `playwright.swiftshader.config.ts`, CI workflows, QA checkers, protected
files (`app/globals.css`, `package.json`, lockfile, Next/Wrangler/Tailwind configs) or committed
visual baselines. No new dependency, service or infrastructure. Production build strictly below
495 MiB.

**Scale/Scope**: One shared module, thirteen active/legacy renderer or effect files, two focused
Vitest files, Spec Kit artifacts and Memory Bank updates.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **I. Single Source of Truth** — PASS. `AGENTS.md` remains authoritative; the plan and memory
  files only record task state and verified facts.
- **II. Verify Before Acting** — PASS. The actual canvases, WebGL engine, test harness, visual QA
  classifier, Spec Kit gate and PR scope checker were inspected before writing this plan.
- **III. Implementation Sequence** — PASS. INSPECT → IDENTIFY → UNDERSTAND → PLAN → IMPLEMENT →
  TEST → DOUBLE-CHECK → REPORT → CREATE PR. This plan is written before source changes.
- **IV. Protect Core Systems** — PASS. No payment, authentication, database, secrets, hosting or
  deployment configuration is touched.
- **V. Resource Conservation & Control** — PASS. `.docs/` stays read-only; no external service,
  hosted runner or paid resource is introduced.

**Post-design re-check**: PASS. The design is additive, leaves the normal visual path unchanged on
capable devices, and keeps every existing compatibility mechanism (static glow, reduced-motion
presentation, share-image error message, confetti basic shapes) intact.

## Project Structure

### Documentation (this feature)

```text
specs/162-graphics-capability-foundation/
├── spec.md
├── plan.md
├── research.md
├── tasks.md
├── checklists/requirements.md
└── evidence.md
```

### Source Code (repository root)

```text
app/lib/graphics-capabilities.js          # new shared capability/runtime layer
app/lib/mapleLeafConfetti.mjs             # Path2D capability fallback
app/homepage/HomePage.js                  # homepage star canvas adoption
app/homepage/ExploreLuckButton.js         # confetti instance failure fallback
app/lucky-card-reveal.js                  # reveal canvas null/context-loss safety
app/lucky-card-share.js                   # share-image context null handling
app/lucky-reveal-celebration.jsx          # safe painted-pixel sampling
app/lucky-reveal-share-image.js           # safe context via shared getter (already guarded)
components/Aurora.tsx                     # Aurora safe context, DPR cap, context loss
components/CosmicEventStage.jsx           # WebGL fallback on context loss
components/cosmic-event-engine.js         # shared WebGL acquisition + context-loss lifecycle
components/Starfield.tsx                  # legacy starfield consistency
components/TwinklingStars.tsx             # legacy starfield consistency
components/ShootingStars.tsx              # legacy starfield consistency
__tests__/graphics-capabilities.test.js   # capability, fallback and source guards
__tests__/cosmic-event-stage-fallback.test.jsx # static glow, context loss and completion
```

**Structure Decision**: The repository already centralizes shared client helpers under
`app/lib/` and shared React canvases under `components/`. One module in `app/lib/` is the smallest
place every renderer can import without a new dependency or provider tree. It avoids a React
context/provider because the values are process-wide and most consumers are imperative canvas
effects, not render-time UI.

## Implementation Approach

### 1. Shared capability layer

Create `app/lib/graphics-capabilities.js` with:

- `getGraphicsProfile()` — cached page-lifetime profile. Tier is `constrained` when Save-Data is
  on, `navigator.deviceMemory <= 2`, or `navigator.hardwareConcurrency <= 2`; otherwise
  `standard`. Missing hints mean standard. `maxPixelRatio` is `1.5` constrained and `2` standard.
  `particleScale` is `0.7` constrained and `1` standard. No user-agent, platform or vendor input.
- `getCanvasPixelRatio(maxPixelRatio = profile.maxPixelRatio)` — clamps
  `window.devicePixelRatio` to `[1, max]`.
- `prefersReducedMotion()` — safe `matchMedia` read.
- `onReducedMotionChange(listener)` — `addEventListener` with the legacy `addListener` fallback;
  returns an idempotent cleanup.
- `supportsCanvas2D()` — lazy 1×1 canvas probe; caches a boolean.
- `supportsWebGL()` — lazy probe; tries `webgl` then `experimental-webgl`; releases the probe
  context with `WEBGL_lose_context` when available; caches a boolean.
- `supportsPath2D()` — lazy global constructor check.
- `getCanvas2DContext(canvas, options)` — safe getter, returns `null` on null/throw.
- `getWebGLContext(canvas, options)` — safe getter, standard then legacy name, no forced power
  preference and no `failIfMajorPerformanceCaveat`.
- `watchContextLoss(canvas, { onLost, onRestored })` — listens to `webglcontextlost` /
  `webglcontextrestored` and, where supported, `contextlost` / `contextrestored`. Only the WebGL
  loss event is cancelled with `preventDefault()` so the browser may restore it; the 2D event is
  observed only, because cancelling it prevents restoration and the event is not universally
  available.
- `onVisibilityChange(listener)` and `isPageVisible()` — safe wrappers over
  `document.visibilityState` and `visibilitychange`.

All probes are lazy and module-cached. Nothing runs at import time. No option is added that would
reject SwiftShader or any other browser-chosen rasterizer.

### 2. Active renderer adoption

- **Homepage star canvas**: use the safe getter; return quietly when unavailable; use the shared
  reduced-motion read; cancel the RAF while hidden and resume once; watch context loss and redraw
  on restoration; apply the constrained particle scale to the ambient-star count.
- **Aurora**: use the safe getter; cap its backing pixel ratio with the shared profile; use shared
  reduced-motion and visibility helpers; watch context loss.
- **Cosmic WebGL stage**: replace the manual context acquisition with the shared getter and pass
  an `onContextLost` callback. The stage sets its existing static-glow fallback when the engine
  reports loss or cannot start; the engine stops its loop, cancels the frame, clears listeners on
  destroy, and never leaves the stage visually blank. Keep the existing completion safety timer.
- **Lucky Card reveal**: use safe getters; if the background context is unavailable, stop the
  canvas effect while the CSS/Framer reveal and audio continue; watch context loss and cancel the
  RAF.
- **Share images**: use the safe getter and keep the existing handled error path. The reveal share
  image already checks for `null`; the card share image gains the same check.
- **Confetti**: keep `create` inside the existing promise `.catch`; use the safe 2D getter for
  pixel sampling; use the `Path2D` capability before `shapeFromPath`; keep the basic-shape
  fallback. Do not gate confetti creation on a probe, because the library itself must remain the
  source of truth and the existing test harness stubs it.
- **Legacy starfield components**: bring them onto the same safe getter/context-loss pattern so a
  future feature cannot reintroduce the unsafe path.

### 3. Quality and density adaptation

- Cap backing pixel ratios at the shared maximum for canvases that already scale by DPR.
- Apply `particleScale` to ambient-star count and WebGL burst counts only on constrained devices.
- Do not change default counts, colours, artwork, timing, sound or CSS.
- Do not add `will-change`, `translateZ`, `translate3d` or other forced-compositing hints; the
  browser remains in charge of acceleration.

### 4. Tests and verification

- Unit-test the shared layer: lazy caching, tier resolution, pixel-ratio clamp, safe 2D/WebGL
  acquisition, legacy WebGL name fallback, event cancellation rules, reduced-motion/visibility
  cleanup, and source guards against vendor sniffing/forced flags.
- Run the focused test, the full Vitest suite, `tsc --noEmit`, `./freebuff-verify.sh`, and measure
  the production build.
- Run focused Playwright Chromium checks at desktop and mobile widths: homepage canvas paints,
  no graphics console errors, reduced-motion static frame, and a simulated no-2D path still
  renders the page. Run the committed homepage visual baseline.
- Attempt Firefox/WebKit only if their browsers and libraries are available; otherwise report
  them as untested rather than claiming cross-browser verification.

## Risks and Rollback

- **Risk**: A capability probe consumes a WebGL context. **Mitigation**: probes are lazy, cached,
  and release the context immediately with `WEBGL_lose_context`.
- **Risk**: Context-loss handling cancels 2D restoration. **Mitigation**: only the WebGL loss event
  calls `preventDefault`; the 2D event is observed without cancellation.
- **Risk**: The new density or DPR caps alter committed baselines. **Mitigation**: caps only apply
  above the baseline's device pixel ratio and on constrained devices; run the committed visual
  baseline.
- **Risk**: A safe getter changes a test harness that relied on a throw. **Mitigation**: safe
  getters return `null`; renderers bail out and existing fallbacks take over. Run the full suite.
- **Risk**: Scope creep into GPU migration. **Mitigation**: no effect is moved to GPU; the WebGL
  stage keeps its existing pipeline and only gains safer lifecycle handling.
- **Rollback**: Remove the shared module and revert the renderer imports. No data, schema,
  deployment or dependency change is involved.
