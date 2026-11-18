# Implementation Plan: Premium Daily Resonance — Medallion, Independent Reveals and the Little Spark Finale

**Branch**: `freebuff/ec0b9abbbe0e2dabc982edca` | **Date**: 2026-11-18 | **Spec**: [spec.md](./spec.md)

**Input**: Owner mission for a premium Daily Resonance experience; percentage weighting, tiers and events unchanged.

## Summary

Split the single "numbers" concept into three independent draws — percentage, Lucky Number and Lucky Colour — each remembering exactly one previous value, and give the Little Spark its own persisted completion flag. The reveal loop becomes one requestAnimationFrame driver that runs three spinners from the same start time, settles percentage at 620 ms, number at 940 ms and colour at 1240 ms, then hands over to the existing percentage-selected cinematic at 1540 ms. After the cinematic, the existing Crystal Ball GoldenLeaf rises into a reserved panel above the medallion and types the Spark like a quill; the countdown dock appears only once that finishes.

The medallion keeps the existing WebGL 1 renderer and gains a deeper profile (17 profile rings over a 0.26 z range, shadow groove, raised bezel, domed enamel), a raking key light, held-back exposure and a tighter milled rim, plus a DOM contact shadow. The number dial is an outer bezel band with 50 ticks and a counter-rotated numeral badge; the colour ring is a thin segmented SVG arc at r 38.7 with a fixed top marker. Neither is read back into selection.

## Technical Context

**Language/Version**: TypeScript/React 19 client components plus plain ES modules for math and storage; Next.js 16 App Router.

**Primary Dependencies**: React, Next.js, existing WebGL 1 medallion engine and procedural geometry. No new dependency, no WebGPU, no replacement engine.

**Storage**: Existing versioned localStorage key `lucky-pick-canada-lucky-meter-v1` (version 1). No database, no API, no server write; Neon and `DATABASE_URL` remain Lucky Stories only.

**Testing**: Vitest unit suites for selection, storage, sharing and reveal math; React DOM suites for the daily experience and the cinematic lifecycle; Playwright visual/behavioural spec on `desktop`, `mobile-390` and `mobile-412`.

**Target Platform**: Static/client-rendered Next.js route at `/lucky-meter`, WebGL 1 with CSS fallback.

**Project Type**: Existing Next.js application.

**Constraints**: Percentage range/weights/tier boundaries frozen; Milky Way layer byte-identical; context-loss and reduced-motion preserved; rendering bounded and fully cleaned up; production build below 495 MiB.

## Constitution Check

- **One complete task result**: all changes serve the mission; Lucky Stories, database, API and unrelated pages untouched.
- **Spec Kit artifacts**: `spec.md`, `plan.md`, `tasks.md` and `evidence.md` in this directory, written after implementation from actual results.
- **Evidence over assertion**: every claim in `evidence.md` names the command or capture that produced it.

## Project Structure

### Documentation (this feature)

```
specs/184-daily-resonance-premium/
├── spec.md
├── plan.md
├── tasks.md
└── evidence.md
```

### Source (repository)

```
app/lib/lucky-meter/config.js        tiers, colours, labels, history limits, number range
app/lib/lucky-meter/selection.js     four independent draws + migration validation
app/lib/lucky-meter/storage.js       normalization, sparkCompleted lifecycle, one-time number write-back
app/lib/lucky-meter/share.js         singular Lucky Number + colour name/HEX lines
app/lib/lucky-meter/reveal.js        settle timings, number/colour spin math and samplers
app/lib/lucky-meter/little-sparks.js unchanged messages
app/lib/gpu-geometry.js              deeper medallion profile
components/lucky-meter-medallion-engine.js  lighting, camera, tilt, exposure
components/LuckyMeterRing.jsx        medallion frame, number dial, colour ring, contact shadow
components/DailyResonance.tsx        one RAF reveal driver, staged Spark, new layout, dock
app/globals.css                      finale panel, quill, number value, dock, contact shadow
__tests__/lucky-meter-*.test.*       unit coverage for the contracts above
__tests__/daily-resonance-daily-experience.test.jsx, lucky-meter-cinematic-lifecycle.test.jsx
tests/visual/lucky-meter-daily-resonance.spec.ts
tests/visual/crystal-ball-daily-limit.spec.ts
```

## Phase 0 — Research and constraints

1. Re-read `AGENTS.md`, the Memory Bank, the Lucky Meter task groups (`.freebuff/palette.md`, `testing.md`, `polishing.md`, `audio.md`, `troubleshooting.md`) and `.docs/manifest.json`.
2. Confirm the frozen surface: `PERCENTAGE_MIN/MAX`, `TIERS`, `EVENTS`, the Milky Way JSX block and the localStorage key.
3. Confirm the Chromium/Playwright wrapper and the capture opt-in already used by the repository.

## Phase 1 — Data contracts

1. Replace multi-value history with `HISTORY_LIMITS = { percentages: 1, numbers: 1, colours: 1, sparks: 1 }`.
2. Add `pickLuckyNumber` (uniform 1–50) and `pickColour` (uniform over twelve), each excluding only the newest saved value.
3. Keep `createDailyResult` as the single entry point; add `luckyNumber` and `sparkCompleted` to the payload.
4. Make `validateDailyResult` migrate a missing number once and normalise every field; export `hasValidLuckyNumber`.
5. Normalise storage per choice, append to four lists, and write the migrated number back immediately.

## Phase 2 — Reveal orchestration

1. Single RAF driver starts all three spins at one timestamp.
2. Percentage sampler settles first, then the number pointer, then the colour ring; each sampler returns its exact final value at landing.
3. `EVENT_START_MS = colourSettleMs + eventDelayMs` starts the existing cinematic.
4. On cinematic end, stage the GoldenLeaf, then type the Spark at 24 ms/character with a 120 ms punctuation pause.
5. Persist `sparkCompleted` when writing finishes; keep the message visible and only then mount the dock countdown.
6. Resume rules: a completed cinematic never replays; an interrupted Spark restarts its writing without replaying the stage.

## Phase 3 — Medallion and layout

1. Extend `MEDALLION_PROFILE` (17 rings, 0.26 z range, shadow groove, raised bezel, enamel dome, finer milling).
2. Retune the engine: raking key light, held-back exposure, gentler tilt, grounded contact shadow in the DOM.
3. Number dial: outer band with 50 ticks, pointer triangle, counter-rotated numeral badge; percentage pointer untouched and inline-styled.
4. Colour ring: thin segmented SVG arc, fixed top marker, selected segment emphasised.
5. Layout: Spark panel first with reserved writing area, medallion, then three result cards, disclaimer, share; Home top-right with countdown docked beneath; mobile top-aligned with reserved dock space.

## Phase 4 — Verification

1. Unit suites for selection, storage, sharing and reveal math.
2. DOM suites for the daily experience and the cinematic lifecycle, including resume and migration.
3. Playwright on all three projects, including reduced motion and WebGL fallback.
4. `tsc --noEmit`, production build with size measurement, `./freebuff-verify.sh`.
5. Visual captures at 1440×900, 390×844 and 412×915, inspected for overlap and clipping.

## Phase 5 — Invariant audit and repair

1. Re-read every mission invariant against the delivered code instead of trusting the earlier report.
2. Confirm the frozen selection contracts by reading `selection.js` and the pre-change file from `main`.
3. Find that a reload during the reveal skipped the motions: the payload had no reveal stage.
4. Persist `revealCompleted` in the same version 1 payload, infer it for legacy payloads from the cinematic,
   and extract the motion block into `animateReveal` shared by Start and the resume path.
5. Strengthen the browser coverage with a measured `MutationObserver` timeline (start-together, strict
   settle order, total under ~1.5 s, cinematic after the ring), a deterministic pointer/ring value test, and a
   stored mid-reveal resume test; read the resting angles modulo a whole turn.

## Complexity Tracking

| Decision | Why | Cost |
| --- | --- | --- |
| Number dial as an outer bezel band | Keeps the percentage pointer unambiguous inside the coin | Extra SVG band and counter-rotation math |
| Single RAF driver for three spinners | Guarantees one start time and a deterministic settle order | Manual sampling instead of CSS transitions |
| `sparkCompleted` in the same version 1 payload | Resume needs one durable stage flag without a version bump | Legacy payloads must default to Spark-complete |
| Top-aligned mobile layout | The fixed Home dock cannot overlap the ritual counter | Small unused space on very tall phones |
