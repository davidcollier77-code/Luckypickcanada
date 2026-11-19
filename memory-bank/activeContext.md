# Active Context — Lucky Meter Seasonal Cinematic

- **Updated:** 2026-11-19
- **Branch:** freebuff/2e88013f2999bd99eaec289b
- **Base:** main at 361486a4
- **Spec Kit feature:** specs/192-lucky-meter-seasonal-cinematic

## Current Task

Rebuild the Lucky Meter as the nine-step premium cinematic from the reference: a fixed gold maple-leaf
pointer, a 12-segment wheel that stops with the percentage, a colour pour that exposes the Lucky Number, a
written tier message, the tier celebration, a maple-leaf-written Spark, and Home + countdown docked together
only after the writing. Four complete Canadian seasonal palettes rotate with the browser-local date, all
owned by one Sparks & Seasonal Colours config beside the thirty Sparks.

## Implemented State

- `app/lib/lucky-meter/sparks-and-seasonal-colours.js` owns 30 Sparks, 4 palettes × 12 unique colours (48),
  exact HEX values, five painted finishes, season names, date ranges and pure helpers. Winter wraps across the
  year boundary and owns Feb 29; starts and ends are inclusive.
- `storyboard.js` owns every stage length: 1,750 ms leaf hold, 1,300 ms breeze, 700 ms start beat, 900 ms
  anticipation, 4,200 ms generation, 450 ms settle, 800 ms segment open, 1,900 ms pour, 800 ms result settle,
  700 ms message lead + 34 ms/char + 2,500 ms hold + 700 ms fade, 800 ms event gap, 1,200 ms Spark gap,
  28 ms/char Spark and 800 ms dock.
- `reveal.js` provides the seasonal wheel spin (3–4 turns, quintic ease-out), fixed pointer at 180°, landing
  rotation `180 − index × 30`, the generation sampler and the existing event-duration clamp.
- `selection.js` draws the colour from the reading date's season and preserves a stored colour, including
  legacy ids and legacy HEX values. Percentage, number, colour and Spark remain independent draws with the
  existing distributions, one-previous-value exclusion, history and daily limit.
- `storage.js` adds additive `messageCompleted` and `stageDurationMs`; old payloads infer lifecycle state and
  resume instead of being discarded.
- `LuckyMeterRing.jsx` is the lit medallion plus a crisp 12-segment SVG wheel on its raised bezel: gold rims,
  per-colour radial paint, grain, painted bevel, drain overlay, wet edge, progressive number reveal and the
  fixed gold maple-leaf pointer. The static medallion remains the WebGL fallback.
- `DailyResonance.tsx` drives the nine stages from the storyboard, resumes at the stored lifecycle point,
  latches rAF stages with timers, keeps Home and the countdown absent until the Spark is written, and shows
  both together in the upper-right dock. Reduced motion presents the whole reading and dock at once.
- `LuckyMeterMessage.tsx` writes the exact tier sentence above the meter with no panel. `LuckyMeterSkyWriting`
  writes the Spark with the maple-leaf cursor; the dock waits for its completion.
- `LuckyMeterArrivalLeaves.jsx` rests 1,750 ms, reports when the staggered breeze has cleared, and has a
  fallback timer so Start can never be stranded by a paused frame clock. Start waits a further 700 ms.
- `app/lib/lucky-meter/audio.js` creates one shared Howl set for the existing recordings; the Lucky Meter v2
  manifest registers an `audio` resource so the existing Resource Readiness Hub prepares and pauses it under
  the same priorities as before. No separate loading system and no new audio asset.
- The Milky Way artwork, `objectPosition`, overlay, Aurora, ornaments, tier/event mapping, sharing,
  entertainment disclaimer and compact mode are unchanged.

## Verification

- Full Vitest: 101 files / 1,046 tests pass.
- `pnpm exec tsc --noEmit`: exit 0.
- Lucky Meter Playwright spec passes on desktop, mobile-390 and mobile-412 (13 passed / 1 opt-in skip each).
- Evidence captures: `artifacts/lucky-meter-seasonal-cinematic-20261119/{before,after}`.
- Production build and `./freebuff-verify.sh` are run before submission and recorded in
  `specs/192-lucky-meter-seasonal-cinematic/evidence.md`.

## Limitations

- No hardware GPU; captures are software-rendered.
- Audio was not auditioned; cue scheduling is covered by unit tests.
- The static fallback is tested by blocking WebGL, not on a GPU-less device.
