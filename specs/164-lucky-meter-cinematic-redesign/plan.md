# Implementation Plan: Lucky Meter Cinematic Redesign

**Branch**: `freebuff/645448188e4eb950b3b04f32` | **Date**: 2026-11-15 | **Spec**: `specs/164-lucky-meter-cinematic-redesign/spec.md`

**Input**: Feature specification from `/specs/164-lucky-meter-cinematic-redesign/spec.md`

## Summary

Keep the existing daily-result model, 4.5-second scramble, staged reveal,
event durations, event weighting, Local Storage and sharing untouched. Replace
the presentational shell with a bottom-anchored cinematic stage built around an
always-mounted circular meter, add a persisted lifecycle flag so the Home
control is only visible when the day's event has actually finished (including
after a refresh), extend the existing additive WebGL pipeline with near/far
surfaces and redesigned meteor, lightning and firework choreography, and add two
licensed recorded audio cues (finale boom and thunder) beside the preserved
existing sounds.

## Technical Context

**Language/Version**: JavaScript/TypeScript on Node.js 26.x, React 19, Next.js 16 App Router.

**Primary Dependencies**: Existing React, Next.js, Tailwind CSS 4, Howler. No new dependency.

**Storage**: Browser Local Storage only, existing versioned Lucky Meter key; no server or database writes.

**Testing**: Vitest + Testing Library for units/components; Playwright for browser QA; `tsc --noEmit`; production Next.js build.

**Target Platform**: Public Lucky Pick Canada website on Cloudflare Pages, across Chromium (Chrome, Edge, Opera, Samsung Internet), Gecko (Firefox) and WebKit (Safari), desktop and mobile.

**Project Type**: Web application feature (single Next.js app).

**Performance Goals**: Target 60 FPS; sustain ≥ 55 FPS in capable Chromium QA; cap particles, DPR and draw calls; pause when hidden.

**Constraints**: Milky Way artwork and markup unchanged; no new dependencies, routes or server writes; build below 495 MiB; all existing reveal timings and selection rules unchanged.

**Scale/Scope**: One route plus the existing compact widget; one component rewrite, two GPU engines, one capability helper extension, two audio assets and their provenance record.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- Preserve existing artwork, identity and unrelated behaviour: **PASS** — background markup is unchanged; no global visual changes outside the meter.
- Preserve security, privacy and data boundaries: **PASS** — daily data stays in Local Storage; no new network calls except same-origin audio.
- No protected-area changes (payments, database, auth, hosting, secrets): **PASS**.
- Build-size cap: **PASS** — expected addition under 1 MiB; measured in verification.
- Spec Kit workflow: **PASS** — spec, research, plan and tasks precede implementation.
- QA checker requirements: **PASS** — changed paths stay within application, specs, tests and audio assets; no checker or workflow change.
- Accessibility and reduced motion: **PASS** — existing preference handling is retained and extended to new animation.
- Audio licensing: **PASS** — Mixkit Sound Effects Free License, recorded masters, provenance committed.

## Project Structure

### Documentation (this feature)

```text
specs/164-lucky-meter-cinematic-redesign/
├── spec.md
├── research.md
├── plan.md
├── tasks.md
└── evidence.md          # verification record, written during implementation
```

### Source Code (repository root)

```text
app/
├── globals.css                      # ring, home and cinematic presentation styles
├── lib/
│   ├── graphics-capabilities.js     # + resolveRenderQuality (pure, tested)
│   ├── gpu-particles.js             # shared shader/program/point-batch primitives
│   └── lucky-meter/
│       └── storage.js               # + eventCompleted / stageDurationMs (backward compatible)
├── lucky-meter-client/LuckyMeterClient.js
└── lucky-meter/page.js
components/
├── DailyResonance.tsx               # redesigned composition and lifecycle
├── LuckyMeterRing.jsx               # persistent circular meter shell
├── lucky-meter-ring-engine.js       # slow additive GPU energy trails
├── CosmicEventStage.jsx             # far + near composited surfaces
└── cosmic-event-engine.js           # depth layers, new choreography, governor
public/sounds/
├── lucky-meter-finale-boom.wav
├── lucky-meter-thunder-rumble.wav
└── lucky-meter-cinematic-audio-sources.md
__tests__/
├── lucky-meter-cinematic-lifecycle.test.jsx
├── lucky-meter-storage.test.js       # lifecycle persistence additions
├── daily-resonance-daily-experience.test.jsx
├── graphics-capabilities.test.js     # quality resolution additions
└── daily-resonance-lifecycle.test.jsx
```

**Structure Decision**: Single Next.js application. Rendering stays in the
existing `components/` + `app/lib/lucky-meter` split, with shared GPU primitives
in `app/lib/` so both engines use one shader implementation.

## Design

### 1. Composition

`DailyResonance` renders one full-height scene. The existing Milky Way `<picture>`
and overlay are copied verbatim from the current implementation. Above them:

- `Aurora` (unchanged, `z-0`).
- `CosmicEventStage` far canvas at `z-10`.
- Content column at `z-20`, bottom-anchored: welcome copy and Start above the
  ring, ring, result details below, Share and countdown at the end.
- `CosmicEventStage` near canvas at `z-40`, `pointer-events-none`.
- Home control at `z-50`, top-right.

The ring is always mounted. Its centre changes between a neutral void, the
scramble preview and the landed percentage + tier. No result values exist in
the welcome markup.

### 2. Lifecycle

Storage payload gains `eventCompleted` and `stageDurationMs` under the existing
version. Missing values mean "not completed" so older payloads remain valid.

- Start: persist result + duration, `eventCompleted=false`, hide Home.
- Event completion: set `eventCompleted=true`, persist, unmount the stage.
- Load completed result: show result, Home visible, no replay.
- Load incomplete result: show result, Home hidden, resume the stage for the
  stored duration, then persist completion.
- Reduced motion: no stage; completion is recorded when details appear.
- Midnight: reset all lifecycle state.

### 3. Rendering quality

`resolveRenderQuality` (pure) combines the existing profile with viewport area,
DPR, pointer type and optional capability details to return:

```js
{
  tier: 'high' | 'balanced' | 'constrained',
  maxPixelRatio: 2 | 1.6 | 1.25,
  particleScale: 1.15 | 0.85 | 0.6,
  foreground: boolean,
  haze: boolean,
  sparkBudget: number,
}
```

The stage additionally measures a rolling frame average. Two consecutive
low-FPS windows reduce `qualityScale` and backing-store resolution; recovery is
allowed once, with hysteresis, to avoid oscillation. The near surface is dropped
first on constrained profiles.

### 4. Effects

- Meteors: depth-tagged; near meteors and the finale sweep render on the near
  surface. Trails keep additive glow and gain a denser plasma gradient.
- Lightning: deeper recursive branching, a white-hot core with cool halo,
  origin cloud bloom, ground illumination and a double-flicker decay. At least
  one background and one foreground strike per event; finale gains extra forks.
- Fireworks: a `kind`-aware particle model. Red bursts are dense spherical
  peonies with soft rounded particles; silver bursts use finer sizes, longer
  trails, branching child sparks and faster twinkle; the finale adds a large
  multi-shell golden chrysanthemum, long willow streamers and a dedicated
  foreground spark population.
- Finale scheduling: spawn early enough that the longest-lived spark ends before
  the existing duration; fade the near surface over the final 700 ms instead of
  clearing it.
- Ring: slow orbiting comet trails in the existing additive point shader plus
  layered CSS conic arcs; one static frame under reduced motion.

### 5. Audio

`ensureRevealAudio` loads two new WAVs with the existing Howler pattern. Cues:

- `firework-launch` — existing whistle, slight rate variation.
- `firework-burst` — existing recorded burst, red burst.
- `firework-burst-silver` — existing `fireworkBurstAlt` at a lighter rate/volume.
- `finale-boom` — new deep recorded boom at near-full volume.
- `thunder` — new rumble at low volume, throttled to two per event with a
  minimum interval and rate variation.

No synthesis, no hotlinks, no new dependency.

### 6. Verification

1. Focused Vitest suites (reveal, selection, storage, lifecycle, audio wiring,
   graphics capability, new lifecycle component tests).
2. Full Vitest suite and `pnpm exec tsc --noEmit`.
3. `pnpm run build`, measured against 495 MiB.
4. `./freebuff-verify.sh`.
5. Production-build Chromium QA: welcome, full reveal, stage, Home lifecycle,
   refresh resume, reduced motion, WebGL-disabled fallback, desktop + mobile
   viewports, console errors and frame sample.
6. Firefox/WebKit only if their runtime libraries are available; otherwise
   reported as not run.

## Complexity Tracking

No constitution violations. Two WebGL contexts are used only on capable devices
and the near layer is optional by design; the alternative single canvas cannot
satisfy the explicit behind/in-front requirement.
