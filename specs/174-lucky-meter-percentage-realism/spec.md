# Feature Specification: Percentage-Owned Reveal and Natural Leaf Realism

**Feature Branch**: `freebuff/e2195ad8bebbd7fee909bb91`

**Created**: 2026-11-16

**Status**: Implemented

**Input**: Owner mission: make the Lucky Meter more realistic, and make the
final dial percentage — not an independent random draw — decide the tier, the
event, the number set and the dial's resting position.

## Context

`specs/160-lucky-meter-daily-experience` set the 5–100 % dial and its three
tiers, `164-lucky-meter-cinematic-redesign` added the medallion and the
meteor/lightning/fireworks stage, `170-lucky-meter-dimensional-environment`
made the medallion and leaves dimensional, and `173-lucky-meter-daily-resonance-polish`
gave each tier fixed lucky numbers and synchronized audio.

This pass keeps all of that and fixes two things the owner can see:

- The reveal could disagree with itself. The tier and the event were drawn
  separately from the percentage, the number set followed the event, and the
  dial settled near the value rather than on it. A visitor could see 64 % with
  the Fireworks event and the High triplet.
- The maple leaves had become thin in code but still read as stiff metal
  plaques, and the fireworks finale did not dominate the sky the way the
  red/silver opening promised.

The Milky Way photograph, the route, storage keys, colour/Spark selection,
sharing, local-midnight behaviour and the cinematic timings are unchanged.

## Acceptance boundary — tiers are the percentage's own intervals

| Percentage | Tier   | Event         | Numbers   |
| ---------- | ------ | ------------- | --------- |
| 5          | Low    | Meteor Shower | 3, 9, 21  |
| 30         | Low    | Meteor Shower | 3, 9, 21  |
| 31         | Medium | Lightning     | 11, 22, 33 |
| 65         | Medium | Lightning     | 11, 22, 33 |
| 66         | High   | Fireworks     | 7, 8, 77  |
| 100        | High   | Fireworks     | 7, 8, 77  |

Boundaries are inclusive at the top of each band: `5 ≤ p ≤ 30` is Low,
`31 ≤ p ≤ 65` is Medium and `66 ≤ p ≤ 100` is High.

## User Scenarios & Testing

### US1 — The dial lands on the number it shows (P1)

A visitor presses Reveal. The dial turns several times with an ease-out and
comes to rest exactly on the angle that represents the displayed percentage:
0 % is straight up and 100 % is the same angle after a full turn, so the resting
arm reads `percentage × 3.6°`. The percentage, tier, event and numbers were all
chosen before the spin began; nothing is re-drawn at the end.

**Why it matters**: the dial is the promise. If it stops beside the number, the
reading feels faked whatever the numbers say.

**Acceptance**: for a saved reading of 5, 30, 31, 65, 66 and 100 the ring's
`data-dial-angle` ends within one degree of `percentage × 3.6`, and the value,
tier label, event name and number chips show that percentage's band.

### US2 — Saved readings are normalized, never rerolled (P1)

A visitor who already has today's reading reloads the page. The stored
percentage, colour, Spark, date and reveal state are kept. If a stored tier or
event contradicts the stored percentage (for example a 72 % reading saved as
Low/Meteor after this change), the tier, event and numbers are re-derived from
the percentage on read, and the corrected reading is persisted. Storage is never
cleared for this case, and the percentage is never replaced.

**Acceptance**: a seeded `percentage: 72, tier: low, event: low-meteor` record
renders High / Fireworks / 7-8-77, keeps the same colour and Spark, and writes
back once.

### US3 — Repeat protection still follows the three-day window (P1)

The same tier's event may not repeat three days running. Because event is now a
tier property, the guard blocks the tier band itself rather than reweighting
individual events. When the block would empty the pool the guard lifts, so the
dial always produces a reading.

**Acceptance**: with three identical Low days blocked, a 5–30 draw lands in a
different band; with all bands blocked, the draw still returns a valid
percentage and tier.

### US4 — Leaves read as thin, wind-carried autumn foliage (P1)

Leaves keep the approved maple silhouette but become paper-thin: a 0.02-unit
blade with a hairline bevel, a 0.052 dome and a 0.044 cross-blade cup. Each leaf
has its own low-metal autumn pigment, its own flutter, turn, pitch, roll and
bank, and the far layer crosses the frame with the wind while the near layer
stays in its side bands. Depth, parallax and the Milky Way are untouched, and no
foreground leaf crosses the reading column or its controls.

**Acceptance**: the before/after captures show thinner silhouettes, visible
surface shading and varied leaf attitudes; the near layer never enters the copy
lane.

### US5 — The meter and gold buttons read as physical objects (P2)

The medallion keeps its size and labels but gains a crisper struck rim, a
grazing highlight and a brass index that sweeps the milled edge; the gold
buttons keep their dimensions, labels, focus rings and behaviour with a
tighter bevel, warmer inner light and a grounded contact shadow.

**Acceptance**: dimensions and accessible names are unchanged; the dial pointer
is visible at every viewport and stops at the landing angle.

### US6 — The finale is the dominant moment (P1)

Meteor, lightning and fireworks stay distinct and audio stays synchronized. The
fireworks open with the existing red/silver shells, and the golden finale
arrives as the largest, deepest moment: bigger gold and willow shells, longer
trails, more embers, two shockwaves, warmer sky light and a larger flash cap. No
new assets or generated audio are added.

**Acceptance**: a resumed High reading shows the golden finale as the brightest,
widest event of the sequence in the captured frame, with the finale cue audible.

### Edge cases

- **Stylesheet miss**: a deployment can ship the new script with an older or
  partial stylesheet. The index must still be visible and must still sit at the
  displayed percentage's angle (verified on the live site, see evidence.md).

- **0° wrap**: a 100 % reading normalizes 360° back to 0°. `angleToPercentage`
  treats 0° as 100 %, and the landing never displays a value ahead of the dial.
- **Reduced motion**: the dial is presented already at its value, the reveal
  order is collapsed and the stage renders calm.
- **WebGL unavailable**: the CSS medallion fallback and no canvases, with the
  reading, numbers and Home control intact.
- **Narrow viewports**: 390 px and 412 px keep the copy lane clear and the dial
  on screen at full size.

## Requirements

- **FR-001** The generated percentage MUST stay in 5–100 inclusive.
- **FR-002** Tier, event and number set MUST be pure functions of the
  percentage, using the boundaries in the acceptance table.
- **FR-003** The dial MUST animate to `percentage × 3.6°` and MUST NOT display
  the final value before the dial settles.
- **FR-004** The landing MUST use the same percentage that was used to pick the
  reading; no second random draw or independent event selection is allowed.
- **FR-005** The three-day repeat guard MUST operate on percentage history and
  MUST NOT change the tier/percentage mapping.
- **FR-006** Saved readings MUST preserve percentage, colour, Spark, date,
  revealed state and completion state, and MUST normalize tier, event and
  numbers from the stored percentage.
- **FR-007** Leaves MUST be substantially thinner than the previous 0.024
  blade, with maple geometry, curvature and per-leaf wind motion; far and near
  depth and the copy lane MUST be preserved.
- **FR-008** The meter, pointer and gold buttons MUST keep their dimensions,
  labels, keyboard focus and accessible names.
- **FR-009** The three cinematic effects and their audio cues MUST remain
  distinct, synchronized and synchronized to their tier; the golden finale MUST
  be the dominant moment.
- **FR-010** The Milky Way background markup and assets MUST NOT change.
- **FR-011** The dial's brass index MUST paint from styles carried by its own
  elements, so its resting position remains visible even when a deployment's
  stylesheet omits or lags the component CSS.

## Key entities

- **Daily reading**: `{ percentage, tier, eventId, numbers, colour, spark, dateKey, revealed, completed }`.
- **Tier**: `{ id, label, min, max, eventId, numbers }` in
  `app/lib/lucky-meter/config.js`.
- **Dial sample**: `{ angle, percentage }` from `reveal.js`, where the displayed
  percentage is read back from the angle while the dial turns.

## Success criteria

1. Every percentage in 5–100 maps to exactly one tier, event and number set, and
   the four boundary examples (30/31/65/66) render as specified.
2. The rendered dial angle and the displayed percentage agree at rest for all
   six probe readings.
3. A stale saved tier is corrected from the percentage without clearing or
   rerolling the record.
4. Visual evidence exists for desktop 1440×900, 390×844 and 412×915, including
   the welcome state, a mid-spin frame, the landed reading and the fireworks
   finale.
5. The focused unit suites, the type check and the Playwright spec pass, and the
   production build stays below 495 MiB.

## Out of scope

- The Milky Way background, the site shell, navigation, analytics and unrelated
  pages.
- New audio, image or video assets.
- Any change to the daily percentage distribution or to colour/Spark selection.
