# Implementation Plan: Lucky Meter Dimensional Redesign

**Branch**: `freebuff/82127dd98cffccf4d358619f` | **Date**: 2026-11-23 | **Spec**: `specs/212-lucky-meter-dimensional-redesign/spec.md`

## Summary

Replace the Lucky Meter's SVG wheel, 6 o'clock pointer, separate CSS/Three vessel and bespoke medallion engine with **one** Three.js scene mounted through the existing creative surface. The scene owns the struck medallion, twelve seasonal chambers, central decorative leaf, fixed 7:30 pointer with curved arm and spout, receiving vessel, stream, golden transfer beam and dust. The existing result generation, tiers/events, audio, persistence, accessibility, Milky Way artwork and later-stage choreography are preserved; only the meter's rendering and the corrected reveal timings change.

The change is one implementation and one regular, unmerged PR. There is no Stage 1/Stage 2 split and no pointer-only PR.

## Technical Context

**Language/Version**: Next.js App Router 16.4.3, React 19.3.1, TypeScript/JavaScript as already used

**Primary dependencies**: existing `three@0.187.0` (lazy-loaded), `app/lib/graphics/runtime.js` (`createCreativeSurface`), `materials.js`, `lighting.js`, `particles.js`, `app/lib/gpu-geometry.js` (`buildMapleLeafGeometry`). No new dependencies.

**Storage**: unchanged `lucky-pick-canada-lucky-meter-v1`

**Testing**: Vitest component/unit suites plus the Playwright `lucky-meter-daily-resonance` browser spec; `pnpm exec tsc --noEmit`; production build with the 495 MiB cap

**Target**: Cloudflare Pages + OpenNext/Workers

## Constitution Check

- **Single source of truth**: `storyboard.js` remains the timing authority; `meter-layout.js` owns physical composition; `reveal.js` owns wheel mathematics. PASS.
- **Verify before acting**: existing components, engines, tests, CSS, registry, readiness manifest, Spec Kit artifacts and deploy CSS checker were inspected before replacement. PASS.
- **Protect core systems**: no payment, auth, database, deployment, secret or unrelated page change. PASS.
- **Graphics rule**: one scene through the shared toolkit, registered under the existing `lucky-meter` experience with the `three` chunk. No second renderer/registry/runtime. PASS.
- **Resource conservation**: the retired `lucky-meter-vessel` experience and four retired files are removed; the Three chunk is still the only new payload and was already installed. PASS.
- **QA gates**: tests updated to the new contract, not weakened; no gate bypassed. PASS.

## Design Decisions

1. **One scene, one canvas.** `app/lib/lucky-meter/meter-scene.js` builds every physical object and exposes `setState`, `start`, `stop`, `dispose`. `components/LuckyMeterStage.jsx` mounts it and owns the DOM readout, colour caption, test hooks and CSS fallback. `LuckyMeterRing.jsx`, `LuckyMeterVessel.tsx`, `lucky-meter-medallion-engine.js` and `vessel-scene.js` are deleted.
2. **Physical layout is data.** `meter-layout.js` holds the wheel, pointer, arm, vessel and beam anchors, the 12-chamber maths, `chamberFillFactor(index, selected, drain)` (only the selected chamber changes), and the CSS conic gradient. The camera maps the wheel centre to 33.5% of the square stage, the pointer to 28.3%/55.2%, and the vessel to 29.4%/81.7%.
3. **Corrected clocks.** `storyboard.js` owns 4,400 ms wheel / 9,400 ms percentage / 2,000 ms pour / 1,500 ms pause / 1,500 ms transfer, with the derived 1,900 / 6,300 / 11,300 / 13,300 / 14,800 / 16,300 ms boundaries. Preserved later stages are unchanged. `getMessageTotalMs` uses the 800 ms settle, not a fade.
4. **Timer-owned hand-offs.** The percentage lands at 11,300 ms and the full vessel is set at 13,300 ms by timers as well as by the frame loop, so a throttled tab cannot leave either state wrong.
5. **Permanent message.** Message state is `hidden | writing | holding` plus a `settled` boolean. There is no `fading` state. The line stays at full opacity through the celebration and FINISHED.
6. **Fallback without SVG.** The no-WebGL/context-loss composition is gradients, clip-paths and layers: wheel with conic chambers, selected-chamber drain overlay, gold leaf pointer and arm, central leaf, glass vessel with liquid, stream and beam. Required deployed selectors `.lucky-vessel-scene`, `.lucky-vessel-canvas-host` and `.lucky-results-dock` remain in compiled CSS.
7. **Registry.** `experiences.js` keeps the `lucky-meter` id but changes it to `renderer: 'three'`, `dimension: '3d'`, `chunks: ['three']`; `lucky-meter-vessel` is retired.

## Project Structure

```text
app/lib/lucky-meter/
├── storyboard.js          # corrected timing authority
├── reveal.js              # 225° pointer, five-turn spin, chamber mapper
├── meter-layout.js        # NEW: physical composition and chamber maths
└── meter-scene.js         # NEW: the single Three.js meter scene

components/
├── LuckyMeterStage.jsx    # NEW: canvas, readout, caption, fallback, test hooks
├── LuckyMeterMessage.tsx  # permanent holding + visible settle
└── DailyResonance.tsx     # one master clock, restore paths, stage mount

app/lib/graphics/experiences.js   # lucky-meter -> three/3d/chunk; vessel retired
app/globals.css                  # stage layout + complete CSS fallback
```

## Verification Strategy

- **Unit**: `lucky-meter-reveal` (boundaries, five beats, 225°, five turns, no early result), `lucky-meter-layout` (12 chambers, drain-only-selected, gradient), `lucky-meter-stage` (fallback first paint, ready handover, context loss/restore, no SVG, full vessel), `lucky-meter-cinematic-lifecycle` (message survives celebration and FINISHED), `daily-resonance-daily-experience` (full corrected sequence).
- **Regression**: selection, storage, seasonal palettes, audio, arrival leaves, deploy CSS check, graphics capabilities, visual QA cache.
- **Type**: `pnpm exec tsc --noEmit`.
- **Browser**: Playwright desktop/mobile with the new 7:30 pointer, corrected timings, full-vessel ending, reduced motion and WebGL-denied fallback.
- **Size**: production build strictly below 495 MiB.

## Risks and Limitations

- No hardware GPU or A17 device is available; software-rendered Chromium is a proxy for mobile visual QA.
- The reference PDF/image is not present in the workspace, so geometry follows the written 7:30 contract.
- The scene uses shader materials; the CSS fallback must remain the whole experience, not a placeholder.
