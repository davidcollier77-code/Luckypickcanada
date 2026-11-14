# Implementation Plan: Lucky Meter Daily Experience

**Branch**: `freebuff/38a663e10f412e1b8cba2642` | **Date**: 2026-11-14 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/158-lucky-meter-daily-experience/spec.md`

## Summary

Replace the Lucky Meter's ad-hoc daily lockout with a versioned, validated Local
Storage record and a pure selection layer, then rebuild the reveal around a
deterministic 4.5-second scramble and staged information beats. Three GPU
particle/shader set pieces are rendered by a new WebGL engine in a transparent
overlay above the existing Milky Way artwork. The component keeps the existing
route, widget, countdown store, artwork and Medallion Gold identity.

## Technical Context

**Language/Version**: Node.js 26.x, Next.js 16.4.3, React 19.3.1, TypeScript 5.9

**Primary Dependencies**: None added. Uses existing React, Tailwind CSS 4,
Howler (existing cues) and the browser's WebGL 1 API.

**Storage**: Browser Local Storage under `lucky-pick-canada-lucky-meter-v1`
(versioned JSON); no database or network persistence.

**Testing**: Vitest + Testing Library for selection, storage, reveal timing,
sharing and the component state machine; `tsc --noEmit`; `./freebuff-verify.sh`;
production `next build` size measurement; Playwright browser QA where available.

**Target Platform**: Cloudflare Workers/Pages via OpenNext for the Next.js app;
modern mobile and desktop browsers for the visual layer.

**Project Type**: Web application (Next.js App Router).

**Performance Goals**: 60 fps particle rendering on desktop; reduced particle
counts, DPR cap and shortened trails on small/coarse-pointer screens; one rAF
loop per event that stops when the run ends or the component unmounts.

**Constraints**: No change to the Milky Way background, routes, payment, auth,
database, Turnstile or unrelated functionality. Production build strictly below
495 MiB. No new audio.

**Scale/Scope**: One route (`/lucky-meter`), one widget (`/widget/daily-meter`),
six new logic/data modules, one event engine, one event stage, one rewritten
component and focused tests.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **I. Single Source of Truth** — PASS. `AGENTS.md` remains authoritative; this
  plan and its artifacts are task-scoped.
- **II. Verify Before Acting** — PASS. The existing component, storage keys,
  countdown store, visual baseline, test suite and build system were inspected
  before design (`research.md`).
- **III. Implementation Sequence** — PASS. INSPECT → IDENTIFY → UNDERSTAND →
  PLAN → IMPLEMENT → TEST → DOUBLE-CHECK → REPORT → CREATE PR.
- **IV. Protect Core Systems** — PASS. No payment, authentication, database,
  secrets or Cloudflare configuration is touched. Local Storage is client-only.
- **V. Resource Conservation & Control** — PASS. `.docs/` stays read-only; only
  task-relevant references were consulted.

**Post-design re-check**: PASS. The design adds no protected-system change and
keeps the visual layer additive so existing artwork is untouched.

## Project Structure

### Documentation (this feature)

```text
specs/158-lucky-meter-daily-experience/
├── spec.md
├── plan.md
├── tasks.md
├── research.md
├── data-model.md
└── evidence.md
```

### Source Code (repository root)

```text
app/lib/lucky-meter/
├── config.js            # tiers, events, weights, numbers, colours, storage key
├── little-sparks.js     # 30 editable motivational Sparks with stable ids
├── selection.js         # independent selections, complete result, validation
├── storage.js           # versioned Local Storage read/write, history, guards
├── reveal.js            # 4.5s scramble path, phase timings, event durations
└── share.js             # share text, native share + cancellation + clipboard

components/
├── DailyResonance.tsx   # rewritten daily experience and state machine
├── CosmicEventStage.jsx # mount/cleanup wrapper + reduced-motion / no-WebGL view
├── cosmic-event-engine.js # GPU particle + shader engine for the three events
└── daily-reset-countdown.js # unchanged shared countdown store

app/globals.css          # landing flash + calm detail-rise keyframes
tests/visual/crystal-ball-daily-limit.spec.ts # seeds the new storage schema

__tests__/
├── lucky-meter-selection.test.js
├── lucky-meter-storage.test.js
├── lucky-meter-reveal.test.js
├── lucky-meter-share.test.js
├── daily-resonance-daily-experience.test.jsx
└── daily-resonance-lifecycle.test.jsx
```

**Structure Decision**: A single Next.js project at the repository root. The
logic is split into pure modules under `app/lib/lucky-meter/` so selection,
timing and share behaviour are testable without a browser or WebGL. The visual
engine is a plain JS module next to the component because it owns canvas/GL
resources and lifecycle.

## Rendering Architecture

- One transparent `<canvas>` overlay (z-index below result text) with WebGL 1,
  additive blending and no opaque background; the existing `<picture>` Milky Way
  and Aurora layers are untouched.
- A shared point-shader pipeline draws meteors, lightning segments, firework
  particles and embers as soft radial points with hot cores.
- A second full-screen haze shader supplies procedural cloud noise and
  strike-driven light for Cosmic Lightning only.
- Depth is simulated by parallax size, speed, trail length and alpha. Mobile
  budgets reduce particle counts, trail samples, DPR and branch generations.
- The engine owns one rAF loop, pauses delta accumulation while hidden, fades in
  and out, clears the canvas and deletes buffers/programs on teardown.

## Implementation Approach

1. Define the data modules: tiers, weighted events with fixed numbers and
   duration windows, twelve colours, the 30-Spark editable file and the storage
   key/schema version.
2. Implement independent selection with injectable randomness, the three-value
   percentage avoidance, weighted event re-selection, recent Spark avoidance and
   complete-result validation.
3. Implement guarded Local Storage with history limits, DST-safe date keys from
   the shared `daily-reset` helpers and stale-result handling.
4. Implement the scramble path, phase constants and event duration selection.
5. Implement native-first sharing with cancellation detection and clipboard
   fallback only on unavailability/failure.
6. Build the WebGL engine and stage, then rewrite `DailyResonance` around the
   persisted result, phase timers, shared countdown and rollover effect.
7. Add focused tests, update the visual countdown seed and run verification.

## Risks and Rollback

- **Risk**: WebGL context or shader compilation failure on older devices.
  **Mitigation**: the engine returns null, the stage renders a static glow and a
  safety timer completes the sequence. **Rollback**: remove the stage mount.
- **Risk**: the cinematic overlay reduces text contrast. **Mitigation**: effects
  are additive, sit behind the result card and never dim the background.
- **Risk**: storage schema change hides results saved with the old keys.
  **Mitigation**: only today's revealed result matters; history is rebuilt from
  new-format entries. The visual test was updated to the new schema.
- **Risk**: timers continuing after unmount. **Mitigation**: one timer registry,
  one rAF ref and a full cleanup effect that cancels both and unloads owned audio.
- **Rollback**: restore the previous `DailyResonance` implementation and delete
  the new modules/components; no server, database or deployment change is
  involved.
