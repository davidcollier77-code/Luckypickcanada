# Research: Adaptive Graphics Capability Foundation

**Date**: 2026-11-14 | **Feature**: `specs/162-graphics-capability-foundation/`

## Current state (inspected, not assumed)

- `app/homepage/HomePage.js` creates a full-viewport 2D canvas without checking the context and
  immediately calls `ctx.clearRect` in its draw loop. It reads reduced motion once at mount,
  never pauses while hidden, and only redraws on resize when reduced motion is set.
- `components/Aurora.tsx` repeatedly asks for a 2D context, scales by the full device pixel ratio,
  slows rather than stops under reduced motion, and has visibility/resize handling but no
  context-loss handling.
- `components/cosmic-event-engine.js` creates WebGL manually, has a static fallback in
  `CosmicEventStage.jsx` when creation fails, but no `webglcontextlost` handling. It requests
  `powerPreference: 'high-performance'`.
- `app/lucky-card-reveal.js` obtains two 2D contexts inside its render loop and dereferences the
  background context without a null guard. Its CSS/Framer presentation and fallback timer exist
  independently of the canvas.
- `app/lucky-card-share.js` obtains a 2D context and immediately calls `createLinearGradient`
  without a null check; the reveal share-image path already checks and throws a handled error.
- `app/lucky-reveal-celebration.jsx` samples the confetti canvas through `getContext('2d')` with a
  try/catch, and `app/lib/mapleLeafConfetti.mjs` checks `shapeFromPath` but not `Path2D`.
- `components/Starfield.tsx`, `TwinklingStars.tsx` and `ShootingStars.tsx` are not mounted by any
  current route (only a `.orig` file references TwinklingStars), but each is a retained canvas
  renderer with its own ad-hoc reduced-motion/visibility handling.
- `playwright.config.ts` defines three Chromium projects with `deviceScaleFactor: 1`; the opt-in
  `playwright.swiftshader.config.ts` is the only place with forced graphics flags. Both are out of
  scope and must remain unchanged.

## Decisions

### Standards-based detection, never browser identity

Decision: detect Canvas 2D, WebGL and `Path2D` by feature handling, not by user-agent, platform or
renderer-vendor strings.

Rationale: The requirement explicitly names Chrome, Samsung Internet, Firefox, Edge and Safari,
including mobile. Any name-based branch would age quickly and would violate the instruction not to
force a particular browser or rendering technology.

Alternative rejected: a browser allowlist or a WebGL renderer string check. Both misclassify
private browsing, embedded webviews, future versions and legitimate software rasterizers.

### Never set `failIfMajorPerformanceCaveat`

Decision: WebGL attributes include only transparency/depth/stencil choices; no
`failIfMajorPerformanceCaveat` and no forced `powerPreference`.

Rationale: `failIfMajorPerformanceCaveat: true` makes context creation fail when the browser is
using a software rasterizer. SwiftShader is a valid browser-chosen fallback on machines without a
GPU, so rejecting it would break exactly the limited devices this feature is meant to support.
Removing the high-performance hint lets the browser/OS choose the appropriate GPU and power
profile.

Alternative rejected: probing the unmasked renderer and blocking software renderers. That is
vendor/browser-specific and contradicts the no-forced-technology requirement.

### Lazy, cached probes

Decision: do not create probe canvases at import time. Cache each result for the page lifetime and
release a probe WebGL context immediately with `WEBGL_lose_context`.

Rationale: Most visits do not need every probe, and an eager WebGL context costs GPU memory.
Caching keeps the layer free in render loops. A `loseContext()` release keeps a capability question
from consuming a context slot.

Alternative rejected: a React provider that probes on mount. It would allocate for pages with no
canvas effects and would couple an imperative canvas layer to the React tree.

### Safe acquisition and existing fallbacks

Decision: safe getters return `null`; callers keep their existing static/CSS/error fallbacks.

Rationale: The site already has correct fallbacks (sky backdrop, static glow, share-image error,
basic confetti shapes). The smallest correct change is to make those fallbacks reachable instead of
adding a second rendering path.

### WebGL context loss needs `preventDefault`, 2D loss does not

Decision: the watcher calls `preventDefault()` only for `webglcontextlost`; it observes
`contextlost`/`contextrestored` without cancelling.

Rationale: MDN and the WebGL wiki state that a WebGL context is only restorable when the loss event
is cancelled. The 2D `contextlost` event has limited availability, and cancelling it prevents the
browser's restoration. The 2D renderers therefore treat loss as "stop safely" and use their
existing static presentation, while the WebGL stage switches to its static glow.

### Conservative device tier

Decision: constrained only for Save-Data, `deviceMemory <= 2`, or `hardwareConcurrency <= 2`;
missing values mean standard. `maxPixelRatio` is 2 for standard and 1.5 for constrained;
`particleScale` is 1 and 0.7 respectively.

Rationale: These are coarse, optional hints. Using them only at the very low end avoids changing
the visual experience on ordinary phones and desktops while protecting genuinely constrained
devices. Baselines run at device pixel ratio 1, so caps do not affect them.

Alternative rejected: FPS sampling or adaptive quality loops. That adds continuous overhead,
battery cost and non-deterministic visuals, contrary to the task's cost constraint.

### Reuse existing reduced-motion mechanisms

Decision: centralize the media-query read and change subscription, but preserve each feature's
existing static presentation.

Rationale: Several components already handle reduced motion. Replacing their static branches would
change approved behaviour. The shared layer only supplies a consistent, safe read/listener.

## References consulted

| Document | Used | Contribution |
|---|---|---|
| `.docs/troubleshooting/_websites_developer_chrome.md` | Useful | Confirmed the platform context for canvas/WebGL web APIs; no Chrome-only path was adopted. |
| `.docs/testing/_websites_developer_apple_webkit.md` | Not useful | Snapshot contained no specific canvas-context-loss guidance for this task. |
| `.docs/testing/_microsoft_playwright.md` | Useful | Confirmed the existing Playwright project structure and command conventions for verification. |
| `.docs/creation/_vercel-labs_agent-skills_react-best-practices.md` | Useful | Reinforced avoiding render-time work in React components; capability reads stay inside effects. |
| `AGENTS.md`, `PR_SUBMISSION.md`, `.specify/memory/constitution.md` | Useful | Established the Spec Kit sequence, checker review and PR handoff requirements. |
| MDN: `webglcontextlost`, `webglcontextrestored`, `contextlost`, `contextrestored` | Useful | Confirmed event names, preventDefault semantics and limited 2D event availability. |
| `playwright.config.ts`, `playwright.swiftshader.config.ts`, `.github/workflows/visual-qa.yml`, `.github/scripts/classify-visual-changes.sh` | Useful | Established the unchanged standard/SwiftShader modes and the visual QA trigger for any source change. |

## Freebuff integrations and skills

- Playwright (local Chromium) is the primary browser verification tool. No hosted browser, paid
  service or new dependency is used.
- No enabled skill was required for the implementation; the repository's own Playwright setup
  script provisions the browser when available.
