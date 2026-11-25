# Implementation Plan: Lucky Meter — Complete Visitor Experience

**Branch**: `218-lucky-meter-complete-experience` | **Date**: 2026-11-25 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/218-lucky-meter-complete-experience/spec.md`

## Summary

Rebuild the Lucky Meter as one continuous, mobile-first cinematic experience while preserving the existing Milky Way artwork, seasonal colours, result generation, storage, tier celebrations, audio and saved Sparks. Mobile is the primary design target, but the experience must be equally polished on tablets and desktops without distortion, clipping or awkward scaling. The work is split into two gates:

1. A focused, development-only prototype of the three-dimensional instrument, faceted crystal bowl and medallion flip, captured at representative mobile (390×844), tablet (820×1180) and desktop (1440×900) stages in READY and FINISHED states for comparison with the two references and with each other.
2. Only after owner comparison: the full reveal, responsive layout, timing, pour, number transfer, celebration, Spark and final controls.

The prototype must not change the visitor route. It mounts through the existing Creative Workbench and the existing graphics runtime, so the visual result is representative of the production path without exposing unfinished work.

## Technical Context

**Language/Version**: JavaScript and TypeScript, Node.js 26.x, pnpm 10.30.3.

**Primary Dependencies**: Next.js 16.4.6, React 19.3.1, Three.js 0.187.0, the existing `app/lib/graphics/` runtime (`createCreativeSurface`, `stage`, `materials`, `lighting`, `particles`), Howler, Vitest 5.1.1, Playwright 1.65.1. No new dependency.

**Storage**: Existing Local Storage result key `lucky-pick-canada-lucky-meter-v1`; no server or database change.

**Testing**: Vitest + Testing Library for pure timing/scene/layout/framing logic; Playwright desktop, mobile-390 and mobile-412 projects; the Creative Workbench for deterministic prototype captures at 390×844, 820×1180 and 1440×900; `tsc --noEmit`; production build size check. Prototype captures are composition evidence, not production QA evidence. Physical-device GPU/browser verification is not available in this VM and remains outstanding, as do high-DPR, touch and cross-browser checks.

**Target Platform**: Cloudflare Pages/Workers through the existing OpenNext configuration. No deployment in this task.

**Project Type**: Next.js App Router web application.

**Performance Goals**: Preserve the existing adaptive tiers. The prototype must render at 390 × 844 within the `balanced` and `constrained` tiers without adding render targets, transmission passes or a second renderer. Tablet and desktop must reuse the same geometry and single renderer; capability-gated richness may be added later, but it must never raise the mobile budget. Physical-GPU performance is unavailable in this VM and remains unverified.

**Constraints**: Production build strictly below 495 MiB; no new dependencies; preserve result logic, colours, tiers, celebrations, audio, storage, share and security behavior; no status banner; development-only prototype.

**Scale/Scope**: One route and one integrated experience, plus one development-only prototype scene, three representative stage presets and six captures.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Check | Result |
|---|---|---|
| I. Single Source of Truth | `AGENTS.md` read; spec/plan/tasks stay subordinate to it. | PASS |
| II. Verify Before Acting | Current route, scene, timings, workbench, dependencies and browser setup inspected. | PASS |
| III. Implementation Sequence | INSPECT → IDENTIFY → UNDERSTAND → PLAN → IMPLEMENT → TEST → DOUBLE-CHECK → REPORT → PR. Spec artifacts precede code. | PASS |
| IV. Protect Core Systems | No payment, auth, database, hosting, deployment or secret change. | PASS |
| V. Resource Conservation | Existing free services; `.docs/` read-only; no new dependency. | PASS |

**Post-design re-check**: PASS. The prototype is development-gated and does not alter the visitor route. The full implementation remains gated on owner comparison.

## Project Structure

### Documentation (this feature)

```text
specs/218-lucky-meter-complete-experience/
├── spec.md
├── plan.md
├── research.md
├── tasks.md
└── checklists/requirements.md
```

### Source Code (repository root)

```text
app/
├── lib/
│   ├── graphics/
│   │   ├── workbench.js                 # scene catalogue + state
│   │   ├── workbench-runtime.js         # scene builder dispatch
│   │   └── ...                          # existing runtime, materials, lighting, particles
│   └── lucky-meter/
│       ├── meter-layout.js              # shared world anchors
│       ├── instrument-prototype.js      # NEW: prototype geometry + flip/bowl
│       ├── meter-scene.js               # production scene, changed only after approval
│       ├── storyboard.js                # timing source, changed after approval
│       └── ...
├── workbench/creative/page.js           # existing development-only route
└── globals.css                          # prototype frame + later layout/chrome/fallback

components/
├── graphics/CreativeWorkbench.jsx       # stage presets + setStage capture API
└── DailyResonance.tsx                   # visitor experience, unchanged until approval

tests/visual/lucky-meter-daily-resonance.spec.ts  # later full QA
__tests__/graphics-creative-workbench.test.js      # stage catalogue/resolver QA
__tests__/lucky-meter-instrument-responsive.test.js # pure framing QA
__tests__/lucky-meter-*.test.*                    # later unit/component QA
```

**Structure Decision**: Use the existing Next.js App Router and existing graphics runtime. The prototype is a workbench scene, not a new renderer, route or preloader. The production scene adopts the validated geometry after the comparison gate.

## Phase 0 — Research

Material unknowns and decisions are recorded in [research.md](./research.md):

- How to mount a responsive 3D prototype without creating a second runtime.
- Camera framing for phone, tablet and desktop stages that keeps the wheel circular and the bowl/pointer clear of stage edges.
- Gold materials without a costly transmission pass.
- A faceted crystal bowl geometry that reads as cut crystal at phone size and remains clear behind the colour fill.
- A physical medallion flip that reveals the percentage without a flat cross-fade.
- Deterministic READY/FINISHED time mapping and a three-size capture method.

No additional research is needed before the prototype; the full implementation will revisit the transfer path and the cross-DOM/3D handoff after the visual gate.

## Phase 1 — Design

### Prototype contract

- **Scene id**: `lucky-meter-instrument`.
- **Mount**: existing Creative Workbench at `/workbench/creative`; development-only, 404 in production unless `CREATIVE_WORKBENCH=1`.
- **Stages**: selectable development frames of 390 × 844 (mobile), 820 × 1180 (tablet portrait) and 1440 × 900 (desktop). The scene declares its stage presets; `CreativeWorkbench` provides a stage selector and a `setStage(id)` API. A stage change remounts the canvas and re-runs the camera/resize path; other scenes keep the 16:10 frame.
- **Controls**: the stage selector plus the existing scene clock, tier, seed and reduced-motion controls. Time mapping:
  - `0.00 s` — READY: medallion closed, all chambers full, bowl empty.
  - `0.00–1.25 s` — medallion turns over and settles.
  - `1.25–2.00 s` — flipped hold; percentage readable.
  - `2.00–4.00 s` — selected chamber drains, bowl fills.
  - `4.00–6.00 s` — FINISHED hold; percentage and full bowl.
- **Capture states**: READY at `0.00 s`; FINISHED at `4.50 s`.
- **Capture method**: Playwright element screenshots of the stage at each preset, saved to `specs/218-lucky-meter-complete-experience/evidence/` as `ready-<stage>-<width>x<height>.png` and `finished-<stage>-<width>x<height>.png`.
- **No production changes**: `DailyResonance`, `LuckyMeterStage`, `meter-scene.js`, `storyboard.js` and the visitor route remain untouched in this checkpoint.

### Prototype visual scope

- 3D gold wheel with twelve chambers, pierced gold frames and recessed enamel fills with a two-lobe specular sheen.
- Central gold maple medallion with a real perspective turn and a percentage well behind it; the centre group counter-rotates so the reading stays upright while the wheel turns.
- Fixed 7:30 gold maple pointer with a broad five-lobed blade, engraved veins and a curved spout; the tip touches the selected chamber without covering the number.
- Clear Fresnel crystal bowl with 12 flat-shaded facets, white facet/rim highlights and a gold rim and foot; coloured liquid fill.
- Selected chamber drains as the bowl fills; the chamber gets a gold floor and the number is exposed progressively.
- Simple dark sky/halo and star motes for material judgement; the production Milky Way stays out of the prototype.
- Responsive camera framing derived from the stage's CSS size: phones keep the tall 6.6-unit vertical composition; tablet portrait uses 4.5 units; desktop uses 4.2 units. Perspective, wheel geometry and relative spacing are unchanged, so the wheel stays circular and nothing is stretched.
- The tablet framing deliberately leaves a safe margin around the bowl and pointer; the desktop framing uses the wider landscape stage as a centred collectible composition rather than stretching the phone layout.
- No ribbon, plaques, Spark or controls in the prototype; those are validated in the full implementation.

**Prototype result**: READY and FINISHED captures for all three stages are in `evidence/`; the observations, responsive framing decisions and known reference differences are recorded in [research.md](./research.md) §11–§12. The gate is open for the owner's comparison; no Phase 3 work has started. The captures validate prototype framing, geometry and materials only: they do not establish production-route responsiveness, physical-device compatibility, or the responsive placement of the DOM result plaques and controls, which are verified in Phase 6 and Phase 8.

### Full implementation design (after approval)

- Follow the sequence and timing in the approved plan: simultaneous wheel/percentage lock at 11,300 ms; message at lock and exit before celebration; pour 2,000 ms; number pause 1,500 ms; transfer 2,200 ms plus 700 ms settle; celebration 12,000 ms; Spark 1,300 ms delay plus 3,800–5,200 ms writing; dock after the final hold.
- Move Home to the upper-right; Share beneath it at finish; countdown upper-left at finish.
- Present the crystal bowl and number plaque from first paint; move the supporting copy/visits/disclaimer below the cinematic frame.
- Keep the existing `CosmicEventStage`, saved Sparks, audio cues, storage and reduced-motion behavior.
- Build responsive layout tokens for phone, tablet portrait/landscape and desktop, including safe zones for the Spark, countdown and Home/Share; adapt the camera framing by aspect ratio so the instrument remains circular and fully visible.
- Keep the mobile visual and performance budget as the floor. Desktop-only richness may be added behind capability checks, never as a requirement for the result and never at the expense of phone rendering.
- Update the complete CSS fallback and the responsive layout tokens.

## Complexity Tracking

No Constitution violations. No new dependency, renderer, registry, preloader or hosting change. The prototype's standalone module is a temporary design spike; the full implementation will consolidate the validated geometry into the production scene and remove the prototype copy.

## Risks and Mitigations

| Risk | Mitigation |
|---|---|
| Workbench's default 16:10 stage hides phone composition issues. | Add explicit mobile, tablet and desktop stage presets and capture all three. |
| A portrait tablet framing crops the bowl or pointer at the stage edge. | Use a tablet-specific vertical extent (4.5) and verify a safe margin at 820×1180. |
| A phone layout simply enlarged on desktop looks sparse or awkward. | Use a desktop-specific framing and a centred collectible composition; keep side space deliberate, not stretched. |
| High pixel density or a wide viewport increases fill cost or causes distortion. | Keep one renderer and the existing adaptive pixel-ratio caps; framing is size-based and aspect-preserving, never a non-uniform scale. |
| Desktop-only effects undermine mobile quality. | Capability-gate any later richness; the mobile budget and approved mobile captures remain the floor. |
| Gold reads flat without environment reflections. | Reuse the production procedural PMREM room and light rig. |
| Crystal bowl reads as a glass blob at phone size. | Use a low radial-segment lathe, flat shading, gold rim/foot, liquid surface and coloured light. |
| Medallion flip reads as a cross-fade. | Rotate real geometry around Y, scale it into a top ornament, and reveal a separate percentage plane behind it. |
| Prototype code drifts from production. | Use the production layout anchors and graphics entry points; consolidate into `meter-scene.js` after approval. |
| Software rendering is mistaken for phone GPU performance. | Report SwiftShader/software results as such; physical-device verification stays outstanding. |
| The full implementation exceeds scope. | Stop at the READY/FINISHED comparison gate; do not start visitor-route changes in this checkpoint. |
