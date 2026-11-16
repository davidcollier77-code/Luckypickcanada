# Feature Specification: Daily Resonance Polish — Tier Numbers, Event Sync and Autumn Leaves

**Feature Branch**: `freebuff/e216184bd07a6a66fde616d3`

**Created**: 2026-11-16

**Status**: Implemented

**Input**: Owner mission: deliver a polished Daily Resonance experience with fixed daily lucky numbers per tier, synchronized meteor, lightning and fireworks visuals and audio, and sharper, wind-carried autumn maple leaves, cinematic on desktop and mobile.

## Context

`specs/160-lucky-meter-daily-experience` created the daily result and the
scramble; `specs/164-lucky-meter-cinematic-redesign` added the bottom-anchored
medallion, far/near additive WebGL stage and recorded finale/thunder cues;
`specs/170-lucky-meter-dimensional-environment` made the medallion, leaves and
effects dimensional. This feature is the next pass over the delivered result. It
changes no artwork, route, storage boundary, calculation, colour, Spark,
sharing behaviour or Milky Way markup.

Measured review of the delivered experience, and the before captures in
`artifacts/lucky-meter-resonance-20261116/before/`, found:

- The three approved number triplets were keyed to the **event**, so the same
  tier showed different numbers on different days
  (`low-fireworks` and `low-meteor` both rendered their event's triplet).
- The reveal showed the percentage, tier and every supporting panel in one
  beat, so the numbers never had their own moment before the event.
- Meteor sounds fired at spawn while the meteor was still off screen, and a
  meteor had no entry flare and no end-of-pass impact.
- Thunder was played on the same frame as the lightning crack, so a distant
  strike sounded immediate.
- Regular firework bursts and the finale shared a mix that made the finale's
  boom less distinct, and no launch announced the finale.
- Every maple leaf was the same gold, and the far layer orbited in place rather
  than being carried by wind. A foreground leaf could cross the result panels.
- A resumed cinematic could leave thunder or crackle playing after the stage
  had finished.

## Number ownership — specification reconciliation

`specs/160` FR-007 assigned the triplets to events. The owner mission
establishes that the numbers belong to the **tier**. The three approved
triplets are preserved exactly and are not randomised or re-invented:

| Tier | Numbers | Provenance |
|---|---|---|
| Low Resonance | 3, 9, 21 | The first approved triplet in spec 160 |
| Medium Resonance | 11, 22, 33 | The second approved triplet in spec 160 |
| High Resonance | 7, 8, 77 | The third approved triplet in spec 160 |

They are assigned in the order the specification recorded them. No number is
13, no triplet contains a duplicate, and the set never changes with the event,
the colour, the Spark or the time of day. A stored result from the earlier
event-keyed payload keeps its percentage, tier, event, colour and Spark and is
re-rendered with its tier's numbers; no storage-version bump or data migration
is required.

## User Scenarios & Testing *(mandatory)*

### User Story 1 — One tier, one set of numbers (Priority: P1)

A visitor's daily reading has a tier. That tier carries three fixed numbers for
the whole local day, whichever cinematic runs.

**Independent Test**: Seed a completed result for each tier and each event and
compare the displayed values; refresh and compare again.

**Acceptance Scenarios**:

1. **Given** any tier and any event, **When** the result is displayed, **Then**
   the numbers are that tier's approved triplet.
2. **Given** the same tier with a meteor, lightning and fireworks event,
   **When** each is displayed, **Then** all three render identical numbers.
3. **Given** a stored result created with the earlier event-keyed payload,
   **When** the page loads, **Then** it keeps its reading and shows its tier's
   numbers.

### User Story 2 — A readable reveal order (Priority: P1)

The visitor sees the percentage and tier, then the lucky numbers, then the
supporting details, and only then the cinematic. Every tier is presented in the
same order.

**Independent Test**: Time each beat from Start and confirm the order on desktop
and both mobile viewports.

**Acceptance Scenarios**:

1. **Given** a reveal, **When** 4.5 seconds pass, **Then** the percentage and
   tier are visible and no numbers or panels are.
2. **Given** the landed reading, **When** 0.8 seconds pass, **Then** the Lucky
   Numbers appear alone, before the colour, Spark, event, Share and countdown.
3. **Given** the numbers, **When** 0.6 seconds pass, **Then** the supporting
   panels and controls appear; 0.6 seconds later the event starts.

### User Story 3 — Meteors that announce, travel and end (Priority: P2)

Each meteor flares as it enters the frame, crosses with its graded trail, and
burns out with a visible impact flare. The entry whoosh and the burnout thud
match those moments.

**Acceptance Scenarios**:

1. **Given** a meteor entering the frame, **When** its head first becomes
   visible, **Then** it flares and its whoosh starts.
2. **Given** a meteor leaving the frame, **When** the head passes out, **Then**
   a warm impact flare, shed embers and a thud occur.
3. **Given** the finale meteor, **When** it enters and burns out, **Then** both
   events are larger, brighter and louder than an opening meteor.

### User Story 4 — Lightning and thunder in natural order (Priority: P2)

The strike cracks when it flashes; thunder follows after a distance-dependent
delay, quieter and later for distant strikes.

**Acceptance Scenarios**:

1. **Given** a lightning strike, **When** it fires, **Then** the impact cue
   plays and no thunder plays on that frame.
2. **Given** the same strike, **When** the delay elapses, **Then** a throttled
   rumble plays, later for a distant strike than for a close one.
3. **Given** the finale strike, **When** it fires, **Then** it uses the close
   finale crack and its own rumble.

### User Story 5 — Crisp pops and a bigger finale (Priority: P1)

Regular bursts pop crisply; the finale is visibly and audibly larger, deeper
and fuller than every preceding burst.

**Acceptance Scenarios**:

1. **Given** a regular burst, **When** it detonates, **Then** exactly one crisp
   pop plays.
2. **Given** the finale, **When** it launches, **Then** a deeper whistle
   precedes it, and at detonation a layered boom plays that is louder in total
   than any pop, with a lower-register body layer and no layer above unity.
3. **Given** the finale, **When** it is on screen, **Then** its shell,
   shockwave, willow fall, golden sparks and warm sky illumination exceed every
   opening burst.

### User Story 6 — Autumn leaves carried by wind (Priority: P1)

Golden maple leaves drift through the scene in a coherent Canadian autumn
palette and never obstruct the reading.

**Acceptance Scenarios**:

1. **Given** any tier or event, **When** leaves are shown, **Then** their
   colours come from the seven-colour autumn palette and do not depend on the
   tier or the event.
2. **Given** the far layer, **When** it runs, **Then** leaves travel across the
   frame with a shared gust and wrap, rather than spinning in place.
3. **Given** the near layer, **When** a leaf is placed, **Then** it stays
   outside the reading lane, so no text or control is covered.

### User Story 7 — Nothing keeps playing (Priority: P1)

When the animation ends, the sounds it started stop.

**Acceptance Scenarios**:

1. **Given** a long rumble is playing, **When** the stage completes, **Then**
   sustained event sounds fade and stop.
2. **Given** the component unmounts or the day rolls over, **Then** every sound
   is stopped and unloaded and no timer remains.

## Requirements *(mandatory)*

- **FR-001**: Lucky Numbers MUST belong to the tier and MUST NOT change with the
  event.
- **FR-002**: The approved triplets MUST be preserved exactly: Low 3/9/21,
  Medium 11/22/33, High 7/8/77; no 13, no duplicates, no randomisation.
- **FR-003**: Validation MUST recompute numbers from the tier so an older
  stored result renders the tier's numbers without a storage-version change.
- **FR-004**: The reveal MUST order percentage+tier, then numbers, then
  supporting details, then the event, with the same order for every tier.
- **FR-005**: Reduced motion MUST present the complete reading calmly without a
  scramble or stage.
- **FR-006**: Meteor entry and burnout MUST be visible and MUST each emit the
  matching cue when the head is on screen.
- **FR-007**: Lightning MUST crack at the flash and MUST queue thunder after a
  distance-based delay; thunder MUST remain throttled and MUST NOT stack on the
  strike.
- **FR-008**: Regular firework bursts MUST be a single crisp pop; the finale
  MUST be launched by a deeper whistle and MUST layer a louder, lower boom over
  the pop.
- **FR-009**: The finale MUST remain the largest, warmest and brightest moment,
  with a shockwave and lingering golden fall.
- **FR-010**: Leaf colours MUST come from the autumn palette and MUST be
  independent of tier and event.
- **FR-011**: Far leaves MUST be wind-carried with a shared gust; near leaves
  MUST NOT cross the reading lane.
- **FR-012**: Sustained event sounds MUST fade and stop when the stage ends;
  unmount and midnight rollover MUST release all audio and timers.
- **FR-013**: No new dependency, route, server write, database change, artwork
  change or Milky Way change may be introduced.
- **FR-014**: Audio assets MUST be retained; no replacement is authorised
  unless a meaningful improvement is proven. No new asset is added.
- **FR-015**: WebGL capability handling, fallbacks, mobile performance budgets,
  sharing, persistence and refresh/resume behaviour MUST be preserved.

## Success Criteria *(mandatory)*

- **SC-001**: All nine tier × event combinations show the tier's triplet
  (verified in unit tests and browser tests on desktop, 390 px and 412 px).
- **SC-002**: The reveal order is observable at each documented beat on all
  three Playwright projects.
- **SC-003**: Deterministic tests cover cue mapping, cue timing, thunder delay,
  finale loudness and cleanup.
- **SC-004**: The WebGL fallback completes and returns Home within its safety
  window with no page errors.
- **SC-005**: `pnpm exec tsc --noEmit`, the full Vitest suite, the Playwright
  Lucky Meter suite and `./freebuff-verify.sh` pass, and the production build
  stays strictly below 495 MiB.

## Assumptions

- The mission's tier ownership supersedes spec 160 FR-007's event ownership;
  the number values themselves are unchanged.
- The added numbers beat keeps each documented beat length and moves the event
  start from 5.9 s to 6.5 s after Start.
- Playwright runs in this workspace are software-rendered (no `/dev/dri`), so
  captures and timing describe that path, not a hardware GPU.
- Existing recordings remain the product's audio; loudness is verified by cue
  mapping and mix, not by measuring the actual output level.
