# Feature Specification: Lucky Meter Twelve-Stage Cinematic Polish

**Feature Branch**: `freebuff/e2b73e42c5b7204636ab22eb`

**Created**: 2026-11-20

**Status**: Implemented

**Input**: User description: "Polish the existing Lucky Meter into a cohesive, cinematic, high-end 3D video-game experience, with all 12 storyboard stages flowing naturally from the opening leaf arrival through the final result and controls."

## Context

The Lucky Meter / Daily Resonance experience already selects and persists one
result per local day and already plays three tier celebrations. This task is a
**presentation, animation, timing and audio polish** task. It does not redesign
the selection logic, the Medallion Gold identity, the seasonal palettes, the
Milky Way backdrop, or the tier artwork.

The presentation is reorganised into one continuous twelve-stage sequence so
each beat hands off to the next instead of reading as a set of separate
animations.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - A substantial arrival that becomes the meter (Priority: P1)

A visitor lands on `/lucky-meter`. A substantial pile of autumn maple leaves
rests in the foreground around the base of a moderately sized meter. The scene
holds long enough to register as a real composition. A natural gust then lifts
the pile, turns the leaves in the air and carries every one of them out of
frame, revealing the meter.

**Why this priority**: The arrival is the first impression and the only leaf
moment in the experience. If it reads as scattered stickers the whole scene
feels like a web page rather than a game.

**Independent Test**: Load `/lucky-meter` and watch the first ~5 seconds. The
pile is layered (smaller/darker at the back, larger/warmer at the front), leaves
overlap, and every leaf clears the frame before Start appears.

**Acceptance Scenarios**:

1. **Given** a fresh visit, **When** the page paints, **Then** the leaf layer is
   a layered foreground pile below the headline and the Start control, not a row
   of edge decorations.
2. **Given** the resting scene, **When** the breeze arrives, **Then** the pile
   disperses from the centre outwards and the layer unmounts once clear.
3. **Given** reduced motion, **When** the page paints, **Then** the pile is a
   still composition and Start appears without waiting for an animation.

---

### User Story 2 - The reading, the colour and the vessel (Priority: P1)

The visitor presses Start. The existing plaque steps aside and the percentage
generates across the meter's real 5–100 scale in the exact centre of the meter.
The wheel and the readout stop on the same frame. The seasonal colour selection
then settles under the fixed pointer. A transparent square vessel unfolds from a
flat plate into a three-dimensional glass box and opens. The selected colour
pours into it and the vessel fills.

**Why this priority**: This is the core reveal. The percentage, the colour and
the vessel must read as one continuous mechanism.

**Independent Test**: Start a reading and watch 5–21 seconds. The plaque is
absent during generation, the percentage starts at 5, the vessel is empty and
closed when the pour phase begins, and it is open and full when the pour ends.

**Acceptance Scenarios**:

1. **Given** Start has been pressed, **When** generation runs, **Then** only the
   percentage occupies the centre and it never shows the final value early.
2. **Given** the wheel has stopped, **When** the colour selection settles,
   **Then** the selected seasonal colour is presented under the pointer.
3. **Given** the vessel is closed, **When** the vessel stage runs, **Then** it
   opens with visible depth before any colour flows.
4. **Given** the vessel is open, **When** the pour runs, **Then** the colour
   drains from the segment and rises inside the vessel continuously.

---

### User Story 3 - The number is never early (Priority: P1)

Only after the colour has completely finished draining does the Lucky Number
(1–50) appear. It flashes exactly twice and then settles into its permanent
placard.

**Why this priority**: The independent draw is the payoff. Revealing it during
the pour destroys the anticipation the storyboard builds.

**Independent Test**: During the pour, `data-number-reveal` is `0.00` and the
number placard is absent; after the drain both are present.

**Acceptance Scenarios**:

1. **Given** the pour is running, **When** any frame is sampled, **Then** the
   number is not in the document and the ring reports no reveal.
2. **Given** the drain has finished, **When** the reveal runs, **Then** the
   number appears, flashes twice and settles.

---

### User Story 4 - The celebration, the Spark and the held result (Priority: P1)

The tier message is written, held and faded, then the tier's own celebration
plays at its established duration: Meteor Shower, Cosmic Lightning or Fireworks,
with the existing artwork, red peonies, white/silver crackle and the
substantially larger gold finale. Afterwards a small glowing golden maple-leaf
cursor writes the saved Little Spark across the sky. The finished message stays
visible while the complete result is held, and only then do Home and the daily
countdown arrive together at the top right.

**Why this priority**: The ending is what the visitor remembers; the controls
must not interrupt it.

**Independent Test**: Walk a full reading once per tier and confirm the message,
the celebration, the Spark and finally the dock, in that order.

**Acceptance Scenarios**:

1. **Given** the message has faded, **When** the celebration starts, **Then** it
   runs for its stored duration inside the documented per-tier window.
2. **Given** the celebration has finished, **When** the Spark is written,
   **Then** the cursor is visibly a maple leaf, not a dot.
3. **Given** the Spark is complete, **When** the hold ends, **Then** Home and
   the countdown appear together.
4. **Given** reduced motion, **When** Start is pressed, **Then** the reading,
   the Spark and the dock are presented calmly with no cinematic.

---

### User Story 5 - Preserved identity and no regressions (Priority: P2)

The Milky Way artwork and overlay, the stars, forest, lake, lightning, the
Medallion Gold identity, the seasonal palettes, the tier thresholds and the
exact tier messages are unchanged. The percentage, number, colour and Spark
selection logic is unchanged. No competing renderer, duplicate preloader, paid
dependency or required WebGPU path is introduced.

**Why this priority**: The task is a polish, not a redesign.

**Independent Test**: The existing Milky Way source-assertion test passes; the
tier thresholds and messages are byte-identical; no new dependency appears.

**Acceptance Scenarios**:

1. **Given** the complete diff, **When** it is reviewed, **Then** no tier
   threshold, tier message, palette or selection function has changed.
2. **Given** the production build, **When** it is measured, **Then** it remains
   strictly below 495 MiB.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The experience MUST follow twelve ordered stages: ready, breeze,
  percentage generation, colour selection, vessel opening, colour pour, Lucky
  Number, tier celebration, Spark writing begins, Spark completes, final result
  hold, controls appear.
- **FR-002**: A substantial, layered, natural-looking pile of maple leaves MUST
  rest in the foreground around the meter and be carried away by one gust.
- **FR-003**: The continuous drifting-leaf ornament overlays MUST be removed;
  the opening arrival is the only leaf moment.
- **FR-004**: The existing plaque MUST be absent while the percentage generates,
  and the percentage MUST generate across the 5–100 scale in the exact centre.
- **FR-005**: The selected seasonal colour MUST be presented in a cinematic
  settle before the vessel opens.
- **FR-006**: The vessel MUST be a transparent square vessel with convincing
  depth, lighting, reflections and dimensionality, and MUST open before pouring.
- **FR-007**: The colour MUST flow continuously into the vessel and fill it.
- **FR-008**: The Lucky Number MUST be revealed only after the colour has
  finished draining, MUST flash twice, and MUST settle into its placard.
- **FR-009**: The existing tier celebrations MUST be preserved at their
  established durations, including the deeper layered final fireworks boom.
- **FR-010**: The Spark MUST be written by a small glowing golden maple-leaf
  cursor, and the completed message MUST remain visible.
- **FR-011**: The completed scene MUST be held before Home and the countdown
  appear together at the top right.
- **FR-012**: The Milky Way, stars, forest, lake, lightning, Medallion Gold
  identity and seasonal palettes MUST be preserved.
- **FR-013**: The tier thresholds and messages MUST remain exactly:
  5–30 Meteor Shower "You're riding a little low today, but you're still okay!";
  31–65 Cosmic Lightning "Your luck is in the mid-range today.";
  66–100 Fireworks "Your luck is running high today!".
- **FR-014**: Percentage, number, colour and Spark selection MUST be unchanged.
- **FR-015**: Timing and audio MUST be deliberately synchronised, with a
  complete run of approximately forty seconds where the tier durations permit.
  Tier runs MUST NOT be forced into identical length.
- **FR-016**: The existing WebGL paths and Canvas fallbacks MUST be preserved;
  no competing renderer, duplicate preloader, paid dependency or required
  WebGPU path may be introduced.
- **FR-017**: Reduced motion MUST present the completed reading, the Spark and
  the dock calmly without any cinematic.
- **FR-018**: The responsive presentation MUST keep the pile, the vessel and the
  controls clear of the copy column on desktop and on phones.
- **FR-019**: The production build MUST remain strictly below 495 MiB.

### Key Entities

- **Storyboard timing**: the single frozen source for every stage length.
- **Arrival composition**: the layered pile bands, depth order and motion path.
- **Reveal motion**: wheel angle, percentage, vessel-open progress, pour
  progress and number reveal, all derived from one clock.
- **Cue map**: the existing recordings mapped to the actions that trigger them.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A complete reading reaches the dock in 36–45 seconds for every
  tier, with the tier celebration difference preserved.
- **SC-002**: During every pour frame the number reveal is `0.00` and the number
  placard is absent; after the drain it is present.
- **SC-003**: The percentage's first frame is 5, it never equals the final value
  before the last frame, and the final frame is the stored result.
- **SC-004**: The storyboard exposes twelve ordered stages whose windows meet
  without gaps or overlaps.
- **SC-005**: No new dependency is added and the measured production build stays
  below 495 MiB.
- **SC-006**: The full unit suite, TypeScript check, repository gate and the
  existing Playwright specs pass, and any failure is reported rather than
  bypassed.
