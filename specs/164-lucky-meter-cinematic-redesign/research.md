# Research: Lucky Meter Cinematic Redesign

**Feature**: `specs/164-lucky-meter-cinematic-redesign`

## Existing implementation inspected

| Area | File | Finding |
| --- | --- | --- |
| Page route | `app/lucky-meter/page.js`, `app/lucky-meter-client/LuckyMeterClient.js` | Client wrapper renders `DailyResonance` under a full-height gradient container and a small SEO paragraph. |
| Main component | `components/DailyResonance.tsx` | Holds result, scramble, details, stage and share state; persists before animating; emits 4.5 s / 600 ms / 800 ms / 600 ms beats from `REVEAL_TIMING`. |
| Reveal maths | `app/lib/lucky-meter/reveal.js` | Climb-drop-jump keyframes, per-frame jitter, guaranteed non-final preview values and per-event durations. |
| Selection and storage | `app/lib/lucky-meter/selection.js`, `storage.js` | Independent selections, validation, versioned Local Storage, history caps and stale-date handling. |
| Share | `app/lib/lucky-meter/share.js` | Native-first with cancellation safety and clipboard fallback. |
| GPU stage | `components/CosmicEventStage.jsx`, `cosmic-event-engine.js` | Transparent additive WebGL point pipeline plus a lightning haze shader; single canvas below the result content; cleanup, context-loss and visibility handling already present. |
| Capability layer | `app/lib/graphics-capabilities.js` | Cached Canvas2D/WebGL probes, conservative device tier, DPR cap, visibility, reduced-motion and context-loss helpers; deliberately never forces a renderer. |
| Audio | `app/lib/audio.js`, `components/DailyResonance.tsx` | Howler is loaded lazily after the Start gesture; existing buildup, meteor whoosh, lightning impact, firework bursts, whistle and willow crackle are already wired. |
| Artwork | `components/DailyResonance.tsx` | The Milky Way `<picture>` (AVIF/WebP at 640/1024/1400) plus `object-position: center 40%` and the `bg-slate-950/40` overlay must not change. |
| Visual identity | `app/globals.css`, `public/assets/golden-maple-leaf.svg` | Shared metallic gold CTA treatment, gold gradient text, Lucky Meter flash/rise animations and the golden maple leaf emblem are available for reuse. |

## Constraints discovered

1. The stage is a child of a `z-0` root with content at `z-20`. A single canvas
   cannot render both behind and in front of the meter; two composited surfaces
   are required.
2. A WebGL context belongs to one canvas. Two surfaces need two contexts, so the
   near layer must be optional and omitted on constrained profiles.
3. `saveMeterState` currently persists only result and history. Completion must
   be added without changing the storage version, otherwise today's valid
   result would be discarded after the upgrade.
4. Existing tests assert exact reveal text and beats. Labels must be preserved
   where possible, and only the intentional "resume on refresh" behaviour may
   change an assertion.
5. `REVEAL_TIMING` and event duration windows are shared data used by tests and
   must not change.
6. The CSS already disables the flash and detail-rise animations under reduced
   motion; the new ring spins must follow the same rule.
7. The production build cap is 495 MiB; audio derivatives must stay small.

## Audio research

Mixkit's Sound Effects Free License permits commercial and non-commercial use
in a larger work, requires no attribution, and forbids redistributing the sound
as standalone stock. Two full-quality WAV masters were downloaded directly and
measured before selection:

| Candidate | ID | Duration | Peak | RMS | Low-band share | Decision |
| --- | --- | --- | --- | --- | --- | --- |
| Clear firework explosions | 2994 | 2.28 s | 0.91 | 0.094 | 90% below 1.2 kHz | Finale boom: deepest and loudest of the short firework recordings. |
| Fireworks bang in sky | 2989 | 3.00 s | 0.76 | 0.046 | 88% below 1.2 kHz | Rejected: quieter and less dense than 2994. |
| Multiple fireworks explosions | 1689 | 3.27 s | 0.95 | 0.081 | 58% below 1.2 kHz | Rejected: brighter and multi-burst, competing with the finale. |
| Thunder deep rumble | 1296 | 18.17 s | 0.99 | 0.133 | 93% below 1.2 kHz | Thunder: immediate deep rumble; an 8 s excerpt fits the lightning window. |

The existing lightning cue (`/sounds/mixkit-cinematic-impact.mp3`), meteor
whoosh, firework burst, whistle and willow crackle remain untouched. New
derivatives are mono 44.1 kHz 16-bit WAV with short fades so they decode quickly
and stay same-origin.

## Technical approach

- **Capability**: add a pure `resolveRenderQuality` function that combines the
  existing conservative tier with viewport area, DPR and pointer type. It returns
  a tier, pixel-ratio cap, particle scale, near-layer flag and haze flag. The
  existing exports and behaviour stay intact.
- **Shared GPU primitives**: move the point shaders, program helpers and growable
  `PointBatch` into `app/lib/gpu-particles.js` and import them from the existing
  engine, so the ring and the stage share one implementation instead of
  duplicating shader code.
- **Ring**: a new `LuckyMeterRing` component with CSS conic-gradient arcs and a
  tiny additive WebGL comet-trail engine. It renders one static frame under
  reduced motion, pauses when hidden, and caps DPR through the quality profile.
- **Stage**: extend the engine with two `Surface` instances (far and near),
  depth-tagged particles, a redesigned firework particle model (red peony,
  silver crackle, golden finale), foreground sparks, an FPS governor and a
  fade-out that never clears live sparks.
- **Lifecycle**: extend the stored payload with `eventCompleted` and
  `stageDurationMs` at the existing version, defaulting missing values to
  false/0 for backward compatibility. Resume the stage on refresh when today's
  result exists but is not marked complete.
- **Layout**: keep the exact background picture and overlay; replace the
  text-only reveal and result card with a bottom-anchored stage whose ring is
  always mounted. Preserve all visible labels used by tests and QA.
- **Audio**: add two same-origin WAV derivatives and two Howler cues, throttled
  thunder and distinct red/silver burst cues using the existing unused
  `fireworkBurstAlt` asset.

## Rejected alternatives

- Replacing the WebGL stage with CSS or Canvas2D animation: loses the existing
  GPU pipeline and cinematic depth, and violates the instruction to build on it.
- A single full-screen canvas with `mix-blend-mode` over the meter: would place
  far particles in front of the interface too.
- Rendering the near layer with a second library or worker: adds dependencies
  and latency without improving the visual result.
- Making the ring a pure CSS animation: fails the continuous radiant GPU trail
  requirement and duplicates nothing existing.
- Bumping the storage version to add lifecycle state: would discard today's
  persisted result for every returning visitor.
