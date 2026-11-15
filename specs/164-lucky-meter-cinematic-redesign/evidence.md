# Verification Evidence: Lucky Meter Cinematic Redesign

**Branch**: `freebuff/645448188e4eb950b3b04f32`
**Date**: 2026-11-15
**Feature**: `specs/164-lucky-meter-cinematic-redesign`

## Build, types and unit suites

| Check | Command | Result |
| --- | --- | --- |
| Full Vitest suite | `pnpm exec vitest run` | PASS — 80 files, 769 tests |
| Focused Lucky Meter suites | `pnpm exec vitest run __tests__/lucky-meter-cinematic-lifecycle.test.jsx __tests__/lucky-meter-storage.test.js __tests__/graphics-capabilities.test.js __tests__/daily-resonance-daily-experience.test.jsx __tests__/lucky-meter-reveal.test.js __tests__/lucky-meter-selection.test.js __tests__/lucky-meter-share.test.js` | PASS — 7 files, 80 tests |
| TypeScript | `pnpm exec tsc --noEmit` | PASS — exit 0 |
| Repository gate | `bash ./freebuff-verify.sh` | PASS — exit 0, including the Spec Kit gate, `tsc`, the production build and 36 refresh-docs tests |
| Production build | `pnpm run build` (inside the gate) | PASS — 379,382,610 bytes (361.81 MiB), below the 495 MiB cap |

## Browser QA (Chromium against the Next.js dev server)

`artifacts/lucky-meter-cinematic-qa/qa-final.mjs` — 27/27 checks passed. These
runs exercise the application through `next dev`; they are behaviour and visual
checks, not a deployment or Workers-runtime test.

### Lifecycle and persistence

- Welcome shows the Home control in the top-right corner, the heading, the
  description, Start above the meter and a neutral meter centre with no
  percentage, tier, colour or numbers.
- Home is removed the instant Start is pressed and stays absent through the
  scramble, landing, supporting details and the whole cinematic.
- The stage mounts with the stored event and its documented duration; Share and
  every other control remain clickable above the near canvas.
- Home returns only after the stage detaches, and `eventCompleted: true` is
  persisted with the result.
- Reloading a completed day restores the full result, keeps Home visible and
  does not replay the event.
- Reloading with `eventCompleted: false` resumes the event, keeps Home hidden
  and returns Home when that resumed event finishes.
- Reduced motion skips the scramble and the cinematic, shows the complete
  result immediately and returns Home.
- With WebGL forcibly disabled the static fallback runs, the stage completes on
  schedule and Home returns.
- Mobile portrait 390 × 844: no horizontal overflow, Start sits above the meter
  and Home returns after completion.
- Milky Way `<picture>` sources and `object-position: center 40%` are unchanged
  in the rendered page.

### Visual review

Captured at 1440 × 900, 1024 × 700 and 390 × 844 during this task:

- Meteors render as continuous plasma streaks with hot heads and atmospheric
  bloom, crossing both behind and in front of the meter.
- Lightning renders as a white-hot kinked channel with branching forks, a blue
  bloom and a visibly lit atmosphere; the finale is a dominant close strike.
- Fireworks open with distinct dense red peonies and fine silver crackle.
- The finale is a large spherical golden chrysanthemum with willow streamers
  and a substantial foreground rain of golden sparks that passes over the
  meter, the colour, Lucky Numbers, Little Spark, Share and the countdown.
- Sparks fade with gravity and drag before the stage completes; the canvas is
  faded, not cleared while sparks are visible.

## Audio provenance and authenticity

- `public/sounds/lucky-meter-finale-boom.wav` and
  `public/sounds/lucky-meter-thunder-rumble.wav` were compared sample-for-sample
  against the Mixkit masters named in
  `public/sounds/lucky-meter-cinematic-audio-sources.md`
  (`assets.mixkit.co/active_storage/sfx/2994/2994.wav`,
  `.../sfx/1296/1296.wav`). Both downloads matched the documented byte sizes and
  the mono derivatives correlate **1.0** with the masters after the documented
  folding and fades. They are genuine recordings, not synthesised audio.
- The existing buildup, meteor whoosh, lightning impact, firework burst and
  whistle cues are unchanged.
- Thunder is throttled to at most two rumbles per lightning event with a
  minimum 2.5 s spacing and rate variation; it plays under the preserved strike
  cue. The finale boom plays at 0.96 with a softer gain envelope than the
  opening bursts, so it is deeper and louder without clipping.

## Checks not run

| Check | Status | Reason |
| --- | --- | --- |
| Firefox / WebKit browser runs | NOT RUN | Only the Chromium Playwright build is provisioned in this environment; Gecko and WebKit binaries are unavailable. Their code paths rely on the same standards-based WebGL, visibility, resize and context-loss handling, but were not executed here. |
| Hardware-GPU frame-rate sample | NOT RUN | The workspace exposes no hardware GPU; Chromium runs on SwiftShader. The quality governor, budget stepping and near-layer fallback were exercised on that software path, and frame timing there is not representative of hardware. |
| Real-device Samsung Internet / Opera / Edge runs | NOT RUN | Not available in this environment. |
