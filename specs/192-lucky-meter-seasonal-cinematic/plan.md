# Implementation Plan: Lucky Meter Seasonal Cinematic Experience

**Feature**: `specs/192-lucky-meter-seasonal-cinematic`

**Branch**: `freebuff/2e88013f2999bd99eaec289b`

**Base**: `main` (workspace base `361486a4`)

## Summary

The previous meter revealed three independent values with staggered spins, a raised letter panel for the
Spark, and twelve fixed colours. This plan replaces the reveal with one nine-stage storyboard, one seasonal
colour source and one wheel/percentage clock, while keeping the existing WebGL gold body, the percentage-driven
tiers and events, the daily persistence and the Resource Readiness Hub.

## Technical Context

- **Runtime**: Next.js 16, React 19, TypeScript, Howler, canvas/WebGL medallion.
- **New configuration**: `app/lib/lucky-meter/sparks-and-seasonal-colours.js` owns 30 Sparks, 4 palettes × 12
  colours, finishes, date ranges and pure season helpers.
- **New storyboard**: `app/lib/lucky-meter/storyboard.js` owns every stage length and the derived schedule.
- **Shared resource hub**: `app/lib/resource-readiness.js` and its manifest prepare the Lucky Meter v2
  experience, including the `audio` resource; `app/lib/lucky-meter/audio.js` only creates the shared Howl set.
- **Tests**: Vitest for pure config, wheel math, storyboard, selection, storage, components and audio;
  Playwright for desktop, 390 px and 412 px browser flows.
- **Constraints**: background artwork unchanged, existing distributions/history/limits preserved, production
  build strictly below 495 MiB, no new audio downloads.

## Constitution Check

- **Preserve the approved scene**: the Milky Way `<picture>`, `objectPosition`, overlay, Aurora, ornaments,
  tier/event mapping, sharing and reduced-motion contract are untouched.
- **One source of truth**: colours, seasons, dates and finishes live in one config; stage lengths live in one
  storyboard; the wheel, pour and result all read the stored result's season palette.
- **Additive persistence**: new lifecycle fields are optional; old payloads infer their state and resume
  rather than being discarded.
- **Smallest correct surface**: the redesign is contained to the Lucky Meter library, its ring/message
  components, the controller and their tests; no route, API, dependency or asset is added.
- **Fail safe**: optional audio, static WebGL fallback, reduced motion, visibility pause and timer latches all
  complete the experience.
- **Evidence first**: the reference frames, the existing timing constants, the hub API and the checker rules
  were read before implementation.

## Phase 0: Research

1. The existing `DailyResonance` drove three rAF samplers from one start but settled percentage, number and
   colour at 620/940/1240 ms, then mounted the event at 1540 ms — no message, no pour and Home visible in the
   welcome state.
2. The existing ring exposed `data-dial-angle` from the percentage (3.6° per percent). The new design needs a
   12-segment colour wheel, so the angle is now the colour's resting rotation and the pointer is fixed at 180°.
3. `storage.js` already normalized old payloads; adding `messageCompleted` lets a refresh resume before the
   celebration without changing the stored result.
4. The hub's `registerExperienceResources` + `prepareExperience` API can prepare an audio resource with the
   same priority and interaction-aware scheduling as images and engines. Creating a second loader would
   duplicate that logic and was rejected.
5. The existing same-origin recordings cover every new cue: cinematic whoosh, rail-gun charge, crystal leaf,
   magic sparkles, chime, impacts, thunder and fireworks.

## Phase 1: Design

### Files

```
app/lib/lucky-meter/sparks-and-seasonal-colours.js   # Sparks, 48 colours, finishes, seasons/dates, helpers
app/lib/lucky-meter/storyboard.js                    # stage timings and derived schedule
app/lib/lucky-meter/reveal.js                        # wheel spin, sampler, fixed pointer, event duration
app/lib/lucky-meter/selection.js                     # seasonal draw, stored-colour normalisation
app/lib/lucky-meter/storage.js                       # messageCompleted + seasonal/legacy ids
app/lib/lucky-meter/event-audio.js                   # stage and event cue map
app/lib/lucky-meter/audio.js                         # shared Howl set (hub-prepared)
app/lib/resource-readiness-manifest.js               # Lucky Meter v2 + audio resource
components/LuckyMeterRing.jsx                        # SVG wheel, drain, number reveal, fixed pointer
components/LuckyMeterMessage.tsx                     # tier typewriter
components/LuckyMeterSkyWriting.tsx                  # Spark typewriter (existing, reused)
components/DailyResonance.tsx                        # nine-stage controller and layout
components/LuckyMeterArrivalLeaves.jsx               # breeze completion callback + fallback latch
components/ResonanceButton.tsx                       # optional tabIndex during arrival
app/globals.css                                      # message and vessel styling
__tests__/*                                          # seasonal, storyboard, lifecycle, audio, protection
tests/visual/lucky-meter-daily-resonance.spec.ts     # browser coverage
```

### Storyboard

| Stage | Start | Length |
| --- | --- | --- |
| Leaf rest | 0 | 1,750 ms |
| Breeze | 1,750 ms | 1,300 ms (staggered) |
| Start pause | after breeze | 700 ms |
| Anticipation | press | 900 ms |
| Generation | 900 ms | 4,200 ms |
| Landing | 5,100 ms | 450 ms |
| Segment open | 5,550 ms | 800 ms |
| Pour | 6,350 ms | 1,900 ms |
| Result settle | 8,250 ms | 800 ms |
| Message | 9,050 ms | 700 ms + typing + 2,500 ms hold + 700 ms fade |
| Celebration | after message + 800 ms | event window (9–11.5 s) |
| Spark | after event + 1,200 ms | 28 ms/character (+220 ms punctuation) |
| Dock | after Spark + 800 ms | instant, Home + countdown together |

### Colour and season model

- Season ranges: Winter Dec 1–Feb 28/29, Spring Mar 1–May 31, Summer Jun 1–Aug 31, Autumn Sep 1–Nov 30.
- `getSeasonKeyForDate` checks the wrapped Winter range first, then Spring/Summer/Autumn.
- Starts and ends are inclusive; leap day falls in Winter.
- Every palette has twelve unique ids, exact HEX, a light flag and one of five painted finishes.
- Stored results keep their chosen colour; legacy ids (`navy-blue`, `royal-blue`, `charcoal`, `cream`,
  `winter-white`, `pumpkin-orange`) remain valid and keep their stored HEX.

### Audio map

| Cue | Recording |
| --- | --- |
| wheel start | `starship-rail-gun-charge-35904.mp3` |
| wheel stop | `crystal-ball-leaf.mp3/.wav` |
| segment open | `crystal-ball-leaf.mp3/.wav` |
| colour pour | `mixkit-magic-sparkles.mp3` |
| message write / Spark write | `crystal-ball-leaf.mp3` at different rates |
| dock arrival | `chime-sound.mp3` |
| meteor / lightning / fireworks | existing event cues, unchanged |
| finale | existing deeper boom layer |

### Accessibility and resilience

- The pointer is `aria-hidden`; the wheel exposes `data-wheel-angle` and twelve segment test ids.
- The result is announced through the existing polite live region after the pour.
- Reduced motion sets every value, the written Spark and the dock at once.
- The WebGL engine keeps its static medallion fallback.
- rAF stages have timer completion latches; the arrival canvas has a fallback timer; audio failure is
  non-blocking.

## Re-evaluated Constitution Check

No route, API, dependency, protected configuration or artwork changed. The only new runtime resource is the
existing audio set registered in the manifest. The build budget is unaffected beyond a few kilobytes. No
violation.
