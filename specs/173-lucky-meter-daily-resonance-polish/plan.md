# Implementation Plan: Daily Resonance Polish

**Feature**: `specs/173-lucky-meter-daily-resonance-polish/`

## Scope guard

Only the Daily Resonance experience. Result generation, weighting, colours,
Sparks, persistence keys, sharing, routes, the Milky Way artwork, navigation and
the total-ritual counter are preserved. No dependency, workflow, checker or
infrastructure change.

## 1. Data model — numbers move from event to tier

- `app/lib/lucky-meter/config.js`: `numbers` moves from `EVENTS` to `TIERS`
  (Low 3/9/21, Medium 11/22/33, High 7/8/77), exported as canonical tier data.
- `app/lib/lucky-meter/selection.js`: `createDailyResult` and
  `validateDailyResult` write `tier.numbers` and drop `event.numbers`.
  Validation recomputes from the tier definition, which doubles as the migration
  for results stored by the earlier payload.
- `app/lib/lucky-meter/share.js`: share text reads `tier.numbers`.
- No storage-version bump: the stored shape keeps the same fields, and the
  numbers were always derived data rather than a user choice.

## 2. Reveal choreography

`app/lib/lucky-meter/reveal.js` gains `numbersDelayMs` and an exported
`EVENT_START_MS`. Order: scramble 4.5 s → percentage/tier; +0.8 s numbers;
+0.6 s supporting panels and controls; +0.6 s event. Each documented beat keeps
its length; the numbers gain their own 0.6 s block.

`components/DailyResonance.tsx` adds `numbersVisible`, gates the numbers plate
separately from the detail panels, renders the numbers first (full-width, larger
numerals) and keeps Share and countdown in the later beat. Reduced motion and
refresh/resume set both states immediately, so the reading is complete.

## 3. Event audio as testable data

New `app/lib/lucky-meter/event-audio.js`:

- `EVENT_CUE_LAYERS` — cue → layers of `{ sound, rate, volume, jitter? }`.
- `getCueLayers(cue, random)` — neutral at `random() === 0.5`, opt-in jitter.
- `getThunderDelayMs(depth, isFinale)` / `getThunderCue(depth, isFinale)` —
  distance-based delay (260 ms near … 980 ms far) and near/far/finale rumble.
- `SUSTAINED_EVENT_SOUNDS` — sounds faded when the stage ends.
- `getCueLoudness` — used to keep the finale above every pop.

`DailyResonance` replaces the if/else cue chain with the map, keeps the
two-rumble throttle, and gains `stopEventAudio()` (fade → stop) called on stage
completion, midnight rollover and unmount; its timers are tracked and cleared.

## 4. Event engine synchronisation

`components/cosmic-event-engine.js`:

- Meteor: the whoosh moves from spawn to the first on-screen frame
  (`meteor-enter`), with an ignition flare and light; leaving the frame emits
  `meteor-impact` with a warm flare, shed embers and, for the finale, a
  shockwave.
- Lightning: the strike cue stays at the flash; thunder is queued through
  `queueCue()` at `getThunderDelayMs(depth)`, so it can never stack on the
  crack.
- Fireworks: a deeper launch whistle is queued 520 ms before the finale; the
  finale adds a shockwave ring and the strongest warm environmental light.
- `queueCue()` keeps the delayed cue list sorted; `shockwaves` is bounded and
  cleared on destroy.

## 5. Autumn leaves

New `app/lib/lucky-meter/leaf-wind.js`:

- Seven-colour Canadian autumn palette (warm gold, amber, copper, maple red,
  burnt orange, burgundy, russet) with weighted selection, no tier/event input.
- `sampleWindField(seconds)` — shared gust/lift/cross from two slow periods.
- `sampleLeafTravel(leaf, seconds, wind)` — wrapping, depth-scaled crossing.

`app/lib/gpu-lighting.js` gains a per-draw `u_albedoTint` (identity by
default), so the shared lit-mesh program can pigment each leaf without affecting
the medallion. `app/lib/gpu-geometry.js` accepts an `albedo` argument
(default unchanged) so the leaf mesh can be neutral and tinted per leaf.

`components/lucky-meter-ornament-engine.js`: per-leaf colour and metal, sharper
bevel/doming, larger size ranges, shared wind travel for the far layer, sway for
the near layer, and a reading lane (`COPY_LANE.bottom` 0.93) that keeps
foreground leaves off every panel and control.

## 6. Tests and evidence

- Updated: selection, share, reveal timing, daily-experience, cinematic
  lifecycle tests for tier numbers and the new beat.
- New: `lucky-meter-event-audio.test.js` (map, delays, finale distinctness),
  `lucky-meter-leaf-wind.test.js` (palette, wind, travel),
  `lucky-meter-event-audio-playback.test.jsx` (cue → Howl playback, throttling,
  cleanup).
- New Playwright spec `tests/visual/lucky-meter-daily-resonance.spec.ts`:
  nine tier × event combinations, reveal order, reduced motion, WebGL fallback
  and stage cleanup on desktop, mobile-390 and mobile-412.
- Before/after captures and the capture harness in
  `artifacts/lucky-meter-resonance-20261116/`.

## 7. Verification order

1. Focused Vitest files, then the full suite.
2. `pnpm exec tsc --noEmit`.
3. Playwright spec across all three projects.
4. `./freebuff-verify.sh`, including the production build; measure the build.
5. Diff and checker self-review before the PR.

## Risks and mitigations

- **Shared shader change** — the tint uniform defaults to white, so every
  existing draw call is byte-for-byte equivalent; the medallion is untouched.
- **Timing change** — the event starts 0.6 s later, only because a beat was
  added; documented in the spec and asserted in tests.
- **Performance** — no new layer or particle budget; the shockwave adds a small
  bounded ring population; the leaf counts are unchanged.
