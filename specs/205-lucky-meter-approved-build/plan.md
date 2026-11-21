# Implementation Plan: Lucky Meter Approved Build

**Feature**: `specs/205-lucky-meter-approved-build`

**Branch**: `freebuff/lucky-meter-build`

## Technical Context

- Next.js 16 App Router, React 19, Tailwind 4. Node 26, pnpm 10.30.3.
- Three.js 0.187 is already a dependency; no package is added.
- The vessel keeps the shared creative surface (`createCreativeSurface`) and the
  `lucky-meter-vessel` registry descriptor. The existing medallion, wheel, celebration, audio
  and arrival engines are preserved.
- One `requestAnimationFrame` clock owns the vessel beat. React state carries only the values
  the scene and the DOM need; the Three.js scene is never rebuilt for a frame.

## Timing Model

| Beat | Length |
| --- | --- |
| Anticipation | 1,200 ms |
| Five-beat generation | 5,600 ms |
| Landing | 600 ms |
| Colour selection | 1,800 ms |
| Vessel opening | 1,400 ms |
| Fill | 5,000 ms |
| Full hold | 700 ms |
| Drain | 4,000 ms |
| Empty highlight | 1,600 ms |
| Tier message | lead-in + typing + 3,000 ms hold + 800 ms fade |
| Celebration | 12,000 ms |
| Spark writing | 3,800–5,200 ms (clamped) |
| Final hold | 2,800 ms |
| Dock approach | 800 ms |

The total is emergent (roughly 54–57 s from first paint to the dock); no stage is stretched to
force it.

## Architecture Decisions

1. **One storyboard source.** `app/lib/lucky-meter/storyboard.js` owns every length, the Spark
   character schedule and the derived stage boundaries. The component, the writer and the tests
   read it; no timing literal is duplicated.
2. **One vessel clock.** `startVesselSequence` maps elapsed time to open, fill, stream, wheel
   drain, vessel fill and number reveal. The wheel's own drain completes as the vessel fills and
   stays complete; the vessel fill later falls during the drain, so the two values are separate.
3. **The number reveal is the drain clock.** The ring clips the number from the top with the
   same eased progress, and the placard mounts only when the drain ends.
4. **D12 is a constant, not a stored value.** Every run and every resume uses `CELEBRATION_MS`.
   A stored duration is retained in the payload only for compatibility and is never read for
   timing.
5. **Home is derived state in the results panel.** `showHome` and `showCountdown` are unchanged
   derivations; only their DOM position moved from a fixed top-right dock to the last row of the
   results panel.
6. **The CSS vessel is functional, not a cover.** It renders under the canvas from the first
   paint and takes over on `onUnavailable` and `onContextLost`. It uses the same fill, open and
   phase props, and the empty highlight is a renderer-independent overlay.
7. **The Spark schedule is bounded.** A per-character weight (punctuation slightly heavier) is
   distributed across the clamped 3,800–5,200 ms window, so both the writer and the storyboard
   agree exactly.

## Files

| File | Purpose |
| --- | --- |
| `app/lib/lucky-meter/storyboard.js` | Approved timings, Spark schedule, derived boundaries and the twelve-stage list |
| `app/lib/lucky-meter/reveal.js` | Five-beat percentage generation; obsolete per-tier duration helper removed |
| `components/DailyResonance.tsx` | Vessel sequence, D12 resume, vessel phase and the last-row dock |
| `components/LuckyMeterVessel.tsx` | Explicit stream/fill, phase data, context-loss fallback and highlight layer |
| `app/lib/lucky-meter/vessel-scene.js` | Forwards context-loss/restore to the shared stage |
| `components/LuckyMeterSkyWriting.tsx` | Cumulative Spark schedule instead of a fixed per-character delay |
| `app/globals.css` | Cylindrical CSS fallback, empty highlight and last-row dock styles |
| `__tests__/lucky-meter-reveal.test.js` | Five-beat generation and new timing contract |
| `__tests__/lucky-meter-sky-writing.test.jsx` | Bounded Spark schedule |
| `__tests__/daily-resonance-daily-experience.test.jsx` | Vessel beat, surrender and dock lifecycle |
| `__tests__/lucky-meter-cinematic-lifecycle.test.jsx` | D12 restart, dock placement and lifecycle |
| `__tests__/daily-resonance-lifecycle.test.jsx` | Generation starts at 0 |
| `__tests__/lucky-meter-vessel-fallback.test.jsx` | Functional CSS fallback states |
| `tests/visual/lucky-meter-daily-resonance.spec.ts` | Five-beat start, drain reveal, D12, WebGL fallback and reduced motion |
| `specs/205-lucky-meter-approved-build/*` | Spec Kit record |
| `memory-bank/*` | Current state, progress and technical facts |

## Verification Plan

1. `pnpm exec vitest run` — full unit and component suite.
2. `pnpm exec tsc --noEmit`.
3. `pnpm test:visual -- lucky-meter-daily-resonance.spec.ts` on desktop, mobile-390 and
   mobile-412, including the WebGL-disabled and reduced-motion cases.
4. `pnpm build` and a measured byte size against the 495 MiB cap.
5. `SPEC_KIT_BASE_REF=8741c655 ./freebuff-verify.sh`.
6. Capture desktop and mobile visual evidence for the arrival, fill, drain and dock.
7. Review the complete diff, the seven checker categories and the PR scope declaration.

## Risks and Limits

- The Cloud VM has no hardware GPU. Three.js shader compilation is slow under software
  rendering; the scene warms up during generation and the CSS vessel covers any gap.
- The vessel is not a fluid simulation: the stream is a revealed curved tube with a leading
  droplet, a splash ring and beads, and the drain lowers the liquid surface.
- No lucky-meter screenshot baseline exists in `tests/visual/__screenshots__`, so no baseline is
  regenerated; the Home position change cannot invalidate an unrelated baseline.
- The dev-server browser runs use the repository Playwright configuration, not a competing
  automation setup.
