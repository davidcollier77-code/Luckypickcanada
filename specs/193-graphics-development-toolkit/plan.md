# Implementation Plan: Graphics Development Toolkit

**Branch**: `freebuff/5675fb1c2b649136e34a4b21` | **Date**: 2026-11-19 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/193-graphics-development-toolkit/spec.md`

## Summary

Install Three.js 0.187 as the 3D engine and wrap it in four additive modules under
`app/lib/graphics/` (stage, effects, assets, disposal). The wrappers consume the existing capability
and adaptive-performance layers instead of duplicating them, load Three.js only through dynamic
imports, and return `null` instead of throwing so every caller keeps a static fallback. Nothing on
the site imports the toolkit, so the visitor path, bundle contents and build size are unchanged.
`gsap`, `framer-motion`, `canvas-confetti` and `html2canvas` are already installed and are reused.

## Technical Context

**Language/Version**: JavaScript (ES modules) with JSDoc types, consumed by Next.js 16.4.5 /
React 19.3.1 / TypeScript 5.x.

**Primary Dependencies**: `three@^0.187.0` (runtime, MIT) and `@types/three@^0.187.0` (dev). No
other package added.

**Storage**: N/A. No database, cache, cookie or storage access.

**Testing**: Vitest (jsdom) unit and source-guard coverage; Playwright for the unchanged-visual
browser check.

**Target Platform**: Cloudflare Pages/Workers (OpenNext) production; modern desktop and mobile
browsers with WebGL 1/2, including software rendering.

**Project Type**: Next.js App Router web application.

**Performance Goals**: No effect on existing routes (no import, no chunk, no request). Any future
consumer inherits the existing tier caps: ≤2× DPR on `high`, ≤1.6× on `balanced`, ≤1.25× on
`constrained`, 30 fps cap on constrained devices, paused when hidden or reduced motion.

**Constraints**: Production build strictly below 495 MiB; no visual change; no WebGPU requirement;
no forced renderer; no user-agent branching; free/MIT only; no new build step.

**Scale/Scope**: 4 new library modules, 1 usage README, 1 test file, 1 architecture-doc section,
Spec Kit records, memory-bank state, `package.json` and `pnpm-lock.yaml`.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **I. Single Source of Truth** — PASS. `AGENTS.md` is followed; the spec and plan reference it and
  do not restate or weaken governance.
- **II. Verify Before Acting** — PASS. Dependency versions, addon paths, constructor signatures,
  composer resize behaviour and current site rendering were inspected in the installed packages and
  repository before writing code.
- **III. Implementation Sequence** — PASS. Inspect → identify → understand → plan (this document) →
  implement → test → double-check → report → PR.
- **IV. Protect Core Systems** — PASS. No Stripe, auth, Neon, deployment, environment or secret
  change. `package.json`/`pnpm-lock.yaml` are protected files and this change is the explicitly
  authorized dependency installation; the PR discloses it for owner approval.
- **V. Resource Conservation / 495 MiB** — PASS. MIT packages only; no service; build measured.
- **Technology Stack** — PASS. Next.js/Cloudflare/Neon stack unchanged; WebGL remains the renderer;
  WebGPU stays optional; the identity and entertainment-only boundaries are untouched.
- **Development Workflow** — PASS. Spec Kit specify/plan/tasks/implement artifacts exist; testing
  follows `AGENTS.md` browser rules; no optional artifact was fabricated.

Re-check after Phase 1: unchanged — the design adds no governance, payment, database, auth or
hosting surface.

## Project Structure

### Documentation (this feature)

```text
specs/193-graphics-development-toolkit/
├── spec.md
├── plan.md
├── tasks.md
├── research.md
└── evidence.md
```

### Source Code (repository root)

```text
app/lib/graphics/
├── stage.js        # lazy Three.js renderer/scene/camera + lifecycle + adaptive frames
├── effects.js      # tiered bloom / ACES output / SMAA composer
├── assets.js       # lazy glTF/GLB loading with disposal
├── resources.js    # geometry/material/texture disposal
└── README.md       # usage, budgets, rules, rejected alternatives, limitations

__tests__/graphics-three-toolkit.test.js
docs/graphics-rendering-architecture.md   # adds the toolkit section
package.json / pnpm-lock.yaml             # three + @types/three only
```

**Structure Decision**: A new `app/lib/graphics/` directory keeps 3D infrastructure separate from
the existing `gpu-*` primitives, which stay untouched. Modules follow the repository's JavaScript +
JSDoc convention rather than introducing TypeScript into `app/lib`.

## Phase 0 — Research (see `research.md`)

Dependency audit, selection and rejection rationale, verified package facts, and the mobile,
performance, licensing and build-size analysis.

## Phase 1 — Design

- Stage owns renderer/scene/camera/size/lifecycle and nothing about scene content.
- Effects own only the composer and its passes; they never create a renderer.
- Assets return data with disposal; they never mutate the scene.
- Disposal is shared by stage and assets.
- Tier budgets are pure functions so they are unit-testable without a GPU.
- Every entry point is lazy and returns `null` on failure.

## Risks and Mitigations

- **Future consumer imports the toolkit at module scope** → documented dynamic-import rule and
  source guard test.
- **A future effect forgets disposal** → README requires `dispose()` in React cleanup and the stage
  disposes scene resources automatically.
- **Tier budget drift from the capability layer** → budgets keyed by the same tier names and
  defaulting to `balanced`.
- **Compressed model assets arrive later** → README records the Draco/KTX2 follow-up rather than
  shipping unused decoders.
- **Build-size growth** → no import means no chunk today; per-feature measurement required later.

## Verification Strategy

Focused Vitest suite, `tsc --noEmit`, production build with a measured size and a chunk inspection
for Three.js, `./freebuff-verify.sh`, a Playwright desktop/mobile homepage check for unchanged
visuals and clean console, and a static, software-rendered render check of the toolkit itself.
