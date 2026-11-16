# Implementation Plan: Percentage-Owned Reveal and Natural Leaf Realism

**Feature**: `specs/174-lucky-meter-percentage-realism`

**Branch**: `freebuff/e2195ad8bebbd7fee909bb91`

**Status**: Implemented

## Approach

The percentage becomes the single source of truth for the reading, and the
dial's final angle becomes a function of that percentage instead of an
independent animation target. Visual realism is a focused pass over the leaf
mesh, the leaf motion and the finale mix; nothing outside the Lucky Meter is
touched.

### 1. Configuration and selection (`app/lib/lucky-meter/config.js`, `selection.js`)

- Tier bands moved to the inclusive boundaries 5–30 / 31–65 / 66–100.
- Each tier owns its `eventId`: Low → meteor, Medium → lightning, High →
  fireworks. Event weights and the separate event draw were removed.
- `getTierForPercentage` clamps to 5–100 and returns the band whose `min/max`
  contains the value.
- `pickPercentage(recent, random, blockedEventId)` now derives the blocked tier
  from the blocked event and rejects any drawn percentage inside that band,
  keeping the three-day guard on percentage history. If the block would empty
  the range it is ignored.
- `buildResult` derives tier, event, numbers, colour and Spark from the single
  sampled percentage.
- `validateDailyResult` keeps valid percentage/colour/Spark/date/state, and
  re-derives tier, event and numbers from the stored percentage.

### 2. Reveal (`app/lib/lucky-meter/reveal.js`, `components/DailyResonance.tsx`)

- `DEGREES_PER_PERCENT = 3.6`; `percentageToAngle` normalizes 360 to 0;
  `angleToPercentage` treats 0 as 100.
- `buildDialSpin(percentage, random)` returns 3–5 turns plus a random start
  angle and the exact landing angle, eased with `dialEase` (quintic ease-out).
- `sampleDialSpin` returns the angle for any moment; the component reads the
  displayed number from that angle and hides the true value until the dial
  lands, so the dial never shows the answer ahead of its arm.
- `DailyResonance` generates the result first, stores it, then starts the spin.
  On landing it sets both the exact angle and `displayPercentage` from the same
  number. The ring receives `dialAngle` and exposes `data-dial-angle`
  (`components/LuckyMeterRing.jsx`), so the resting angle is inspectable.

### 3. Leaves (`components/lucky-meter-ornament-engine.js`, `app/lib/gpu-geometry.js`, `app/lib/lucky-meter/leaf-wind.js`)

- Blade thickness 0.02 with a 0.012 bevel, a 0.052 dome and a 0.044 cup, so the
  silhouette is paper-thin while the face still catches light.
- `gpu-geometry.js` applies the dome and cup with a per-vertex tonal falloff so
  the blade shades across its surface rather than reading as one flat colour.
- Palette metal values stay low (0.11–0.32): dry autumn pigment, not polished
  metal.
- Each leaf carries `turnAmp`, `flutterSpeed`, `flutterPhase`, `pitchAmp` and
  `rollAmp`; wind gust, lift and cross terms drive drift and bank. The far layer
  crosses and wraps, the near layer sways in its side bands, and the near lane
  padding keeps foreground leaves off the copy and controls.

### 4. Meter and buttons (`components/LuckyMeterRing.jsx`, `app/globals.css`)

- Brass index: a 2 px tapering arm with a 9 px struck head, rotating with
  `dialAngle`, sitting above the medallion and below the reading. Its geometry
  and metal are inline styles on the two spans (`data-testid="lucky-meter-dial-arm"`
  / `-head`), so a deployment cannot lose the pointer to a stale or dropped CSS
  chunk; the corresponding rules were removed from `globals.css`.
- Medallion fallback highlight, tier plate and gold CTA gradients refined
  without changing dimensions, labels or focus behaviour.

### 5. Finale (`components/cosmic-event-engine.js`)

- Burst cap 9; gold/willow trails lengthened; larger flash cap; two shockwaves,
  two warm lights and more embers added to the golden finale only. The red and
  silver opening shells, their timing and their audio hooks are unchanged.

### 6. Verification

- Rewritten unit suites: `__tests__/lucky-meter-selection.test.js`,
  `__tests__/lucky-meter-reveal.test.js`.
- Rewritten Playwright spec `tests/visual/lucky-meter-daily-resonance.spec.ts`
  covering boundary mapping, tier numbers, stale-result normalization, dial
  landing angle, reveal order, reduced motion, WebGL fallback and cleanup, plus
  an opt-in (`LUCKY_METER_CAPTURE=1`) evidence-capture block.
- Before/after evidence in `artifacts/lucky-meter-visual-realism-20261116/`.

## Risks and mitigations

| Risk | Mitigation |
| --- | --- |
| Displayed number and dial disagree | The number is read from the angle during the spin and both are set from one value at landing; the spec asserts `data-dial-angle` and `data-value` together. |
| Old saved readings show the wrong event | `validateDailyResult` normalizes tier/event/numbers from the stored percentage and persists the correction. |
| Repeat guard over-blocks | The guard is scoped to the blocked tier band and lifted when it would empty the range. |
| Leaves covering copy | Near-layer placement pads the copy lane by leaf footprint and drift; captured at 390/412/1440. |
| Pointer missing after deploy | The live verification found the deployed CSS lacked the dial rules. The index is now styled inline and asserted by computed style against a production build and the live site. |
| Finale overwhelming the opening | Finale amplification is gated to the finale spawn; opening shells untouched. |

## Rollout

Single commit on the chat branch, one regular (non-draft) PR, no migrations and
no storage-version bump: the normalizer handles older records in place.
