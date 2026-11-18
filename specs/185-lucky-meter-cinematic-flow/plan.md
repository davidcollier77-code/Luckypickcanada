# Implementation Plan: Lucky Meter Cinematic Flow — Arrival Leaves, One Continuous Reveal and Sky-Written Spark

**Branch**: `freebuff/48421c42b397224a7be733cc` | **Date**: 2026-11-18 | **Spec**: [spec.md](./spec.md)

**Input**: Owner mission to refine the existing Lucky Meter into a cohesive cinematic flow without changing selection, tiers, artwork or data boundaries.

## Summary

Add a one-shot arrival layer of five procedural maple leaves at the edges of the existing sky. They rest for one second, then the shared wind field lifts and carries them out; the canvas removes itself. Re-time the existing three-motion reveal behind a 500 ms anticipation and stretch the settles to 3.2 s, 5.4 s and 7.4 s, with the existing percentage-derived cinematic starting 420 ms later. Replace the raised Spark panel and GoldenLeaf quill with sky-writing: a one-second hold after the cinematic, then a tiny golden cursor reveals the stored message in warm light, and the completed message stays. The character clock moves into the writing component so the page no longer re-renders per character.

## Technical Context

**Language/Version**: TypeScript/React 19 client components plus plain ES modules; Next.js 16 App Router.

**Primary Dependencies**: React, Next.js, existing Canvas 2D and WebGL capability helpers, existing Howler cue map. No new dependency and no new engine.

**Storage**: Unchanged `lucky-pick-canada-lucky-meter-v1` payload and lifecycle flags. No database or API write.

**Testing**: Vitest unit tests for arrival motion and reveal timing; React DOM suites for the daily experience, cinematic lifecycle, audio playback and sky-writing; Playwright on `desktop`, `mobile-390` and `mobile-412`.

**Target Platform**: `/lucky-meter`, WebGL 1 with CSS fallback, Canvas 2D for the arrival.

**Constraints**: Milky Way block untouched; tiers and selection frozen; reduced motion respected; new frames/timers/canvases released; production build below 495 MiB.

## Constitution Check

- **One complete task result**: only the Lucky Meter cinematic flow, its tests, Spec Kit artifacts and Memory Bank entry change.
- **Spec Kit artifacts**: `spec.md`, `plan.md`, `tasks.md` and `evidence.md` in this directory.
- **Evidence over assertion**: every claim in `evidence.md` names the command, browser run or capture that produced it.
- **Preservation**: `config.js`, `selection.js`, `storage.js` contracts and the Milky Way JSX are unchanged; audio cue data is unchanged.

## Project Structure

```
specs/185-lucky-meter-cinematic-flow/
├── spec.md
├── plan.md
├── tasks.md
└── evidence.md

app/lib/lucky-meter/arrival-leaves.js        pure composition, wind and motion
components/LuckyMeterArrivalLeaves.jsx       one Canvas 2D introduction layer
components/LuckyMeterSkyWriting.tsx          sky-writing with a local character clock
components/DailyResonance.tsx                anticipation, re-timed reveal, 1 s Spark hold
app/lib/lucky-meter/reveal.js                new timing contract and EVENT_START_MS
app/globals.css                              anticipation and sky-writing styles
__tests__/lucky-meter-arrival-leaves.test.js
__tests__/lucky-meter-sky-writing.test.jsx
__tests__/lucky-meter-reveal.test.js
__tests__/daily-resonance-daily-experience.test.jsx
__tests__/lucky-meter-cinematic-lifecycle.test.jsx
tests/visual/lucky-meter-daily-resonance.spec.ts
memory-bank/activeContext.md
```

## Phase 0 — Constraints and existing work

1. Re-read `AGENTS.md`, all four Memory Bank files, `.docs/manifest.json`, the polishing/audio/testing task groups and the Playwright repository guide.
2. Inspect the existing `DailyResonance`, `reveal.js`, `CosmicEventStage`, `event-audio.js`, ornament engine and the existing DOM/visual suites.
3. Confirm the frozen surfaces: tier boundaries, selection, storage key, Milky Way block, event cue map, existing ornament layers.
4. Capture desktop and 390 px before evidence of the old raised Spark panel.

## Phase 1 — Arrival leaves

1. Add `arrival-leaves.js`: five edge bands, phone bands below the headline, per-leaf pigment/size/depth, 1,000 ms rest, staggered lift, 2,350 ms crossing, fade over the final 38 %.
2. Add `LuckyMeterArrivalLeaves.jsx`: one DPR-capped Canvas 2D layer, procedural maple path, gradient/vein/stem/shadow drawing, wind from the existing field.
3. Pause the arrival on hidden tabs and resume from the same moment; release frames, timers and the resize listener on unmount.
4. Draw once and stop under reduced motion; unmount on Start because the result state removes it.
5. Mount only before a reading exists, so a result page is never re-introduced.

## Phase 2 — Coordinated reveal

1. Add `anticipationMs: 500` and settle the three motions at 3,200 / 5,400 / 7,400 ms with `spinMs = colourSettleMs`.
2. Redefine `EVENT_START_MS = anticipationMs + colourSettleMs + eventDelayMs` (8,320 ms).
3. Add `isAnticipating` to `DailyResonance`; show a gathering point and hide the result; start `animateReveal` after the hold.
4. Keep `animateReveal` shared by Start and the mid-reveal refresh path; reset the anticipation in it.
5. Keep the buildup playing from Start and fade it at the percentage settle.

## Phase 3 — Sky-written Spark

1. Add `LuckyMeterSkyWriting.tsx` with `waiting` / `writing` / `written` states and its own character timer.
2. Replace the raised panel and GoldenLeaf with the component; keep `lucky-spark-finale`, `lucky-spark-message` and `data-state` test contracts, add `lucky-spark-cursor`.
3. Hold for `sparkStartDelayMs: 1000` in `handleStageComplete` before setting `sparkWriting`.
4. Keep reduced motion immediate and the completed message in the accessibility tree.
5. Replace the panel/quill CSS with sky text, glow, ember and cursor styles; no panel chrome.

## Phase 4 — Verification

1. Add unit tests for composition, motion, determinism, duration, fade and wind.
2. Add DOM tests for waiting, progressive writing, completion and reduced motion.
3. Update the reveal, daily-experience and lifecycle suites to the new milestones and the one-second hold.
4. Update the Playwright spec for the arrival, the measured reveal hand-off, the sky-writing panel-free assertion, reduced motion and new capture paths.
5. Run `pnpm exec vitest run`, `pnpm exec tsc --noEmit`, the focused Playwright runs on all three projects, the production build with size measurement and `./freebuff-verify.sh`.
6. Capture before/after evidence in `artifacts/lucky-meter-cinematic-flow-20261118/`.

## Complexity Tracking

| Decision | Why | Cost |
| --- | --- | --- |
| Purpose-built Canvas 2D arrival | One-shot, five leaves and a short life; avoids extending the persistent WebGL ornament engine with a second mode | One small canvas and ~350 lines of pure motion/draw code |
| 7.4 s motion window | The mission asks for 7–8 s and a single continuous reveal | The page must keep Home hidden for 8.3 s |
| Spark clock in a child component | Avoids a full page re-render per character on mobile | A small presentational component and a completion callback |
