# Feature Specification: Lucky Meter Seasonal Cinematic Experience

**Feature Branch**: `freebuff/2e88013f2999bd99eaec289b`

**Created**: 2026-11-19

**Status**: Implemented

**Input**: Owner request: rebuild the Lucky Meter as the nine-step premium cinematic shown in the attached
reference, with 3D materials, synchronized sound, four complete Canadian seasonal palettes and one
"Sparks & Seasonal Colours" configuration, while preserving distributions, history, daily limits, the
Resource Readiness Hub, the background artwork and the production build limit.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - The resting scene wakes into the reveal (Priority: P1)

A visitor arrives at `/lucky-meter`. A gold maple-leaf pointer rests at 6 o'clock inside a lit metal
bezel, a few maple leaves sit at the edges, and the reading is not exposed. The leaves rest long enough to
register (1.75 s), a breeze lifts and carries them out (1.3 s), the scene pauses (0.7 s), and only then does
Start appear. Pressing Start holds a 0% reading while the sky listens (0.9 s).

**Independent Test**: Load the page, observe the Start button is invisible and untabbable, wait for the
breeze, then press Start and confirm the ring is spinning with a 0% readout and no result panels.

**Acceptance Scenarios**:

1. **Given** the resting scene, **When** the page loads, **Then** the pointer is fixed at 6 o'clock, the
   leaves rest, and Start is not visible.
2. **Given** the breeze has cleared, **When** the short pause passes, **Then** Start fades in and becomes
   keyboard reachable.
3. **Given** Start is pressed, **When** the anticipation runs, **Then** the reading shows 0%, no number or
   colour is exposed, and no cinematic is mounted.

---

### User Story 2 - One clock stops the wheel and the percentage (Priority: P1)

The 12-segment seasonal wheel spins beneath the fixed leaf pointer while the percentage counts up on the
same clock. Both stop on the exact same frame: the wheel lands with the selected segment under the pointer
and the percentage lands on the result. The selected segment then opens and pours its colour downward into
the Lucky Colour vessel while the Lucky Number is progressively uncovered, 1–50.

**Independent Test**: Start a fresh reading and sample `data-wheel-angle`, `data-value`,
`data-number-reveal` and the result panels across the generation, landing and pour stages.

**Acceptance Scenarios**:

1. **Given** a fresh reading, **When** generation completes, **Then** the wheel angle matches the selected
   colour's index and the percentage equals the stored result on the same DOM frame.
2. **Given** the wheel has landed, **When** the segment opens, **Then** colour visibly drains from that
   segment into the vessel and the number reveal rises from 0 to 1.
3. **Given** the pour has finished, **When** the result settles, **Then** the number and colour panels show
   the exact stored values and share the wheel's palette.
4. **Given** any viewport, **When** the wheel is rendered, **Then** it has exactly twelve named segments from
   the active season and the pointer never rotates.

---

### User Story 3 - The message, the celebration and the written Spark (Priority: P1)

The exact tier message is written one character at a time above the meter, held long enough to read, and
faded. The tier's existing cinematic then runs (meteor 5–30, lightning 31–65, fireworks 66–100) with its
recorded sound cues. After the sky is still, the gold maple-leaf cursor writes the Little Spark. Home and the
daily countdown appear together in the upper-right dock only after the writing completes.

**Independent Test**: Let a full reading run, assert the message text and state, the mounted event id, the
Spark writing state, and that Home/countdown are both absent until the Spark is written and then present
together.

**Acceptance Scenarios**:

1. **Given** the reveal has settled, **When** the message phase starts, **Then** the exact tier sentence is
   typed above the meter, held and faded without a panel.
2. **Given** the message has faded, **When** the celebration begins, **Then** the event selected by the
   percentage mounts with its documented duration and cues, and Home stays hidden.
3. **Given** the celebration has finished, **When** the Spark is written, **Then** Home and the countdown
   arrive together, never one without the other.
4. **Given** a refresh at any lifecycle point, **When** the component resumes, **Then** it resumes at the
   stored point (reveal, message, celebration or Spark) without re-rolling the result.

---

### User Story 4 - Every reading wears its own season (Priority: P1)

Four complete palettes rotate with the browser-local date: Winter (Dec 1–Feb 28/29), Spring (Mar 1–May 31),
Summer (Jun 1–Aug 31), Autumn (Sep 1–Nov 30). The wheel, the pour and the result card use the same palette
and exact HEX values. A stored reading keeps its original values; legacy colour ids and old HEX values are
never re-rolled.

**Independent Test**: Move the browser clock to a date in each season, seed a matching result, and compare
the twelve segment ids and the panel name/HEX with the config. Check Feb 29 in a leap year and both sides of
every boundary in the pure helpers.

**Acceptance Scenarios**:

1. **Given** a date inside a season, **When** the page loads, **Then** the wheel shows that season's twelve
   colours in config order.
2. **Given** a local midnight or season boundary, **When** the date changes, **Then** a new reading uses the
   new season and the old stored reading is not recoloured.
3. **Given** a stored legacy colour, **When** it is normalized, **Then** its id and stored HEX are preserved.

---

### User Story 5 - The experience remains accessible and resilient (Priority: P2)

Reduced motion presents the complete reading, Spark and dock at once with no spin, message typing, cinematic
or cursor. If WebGL is unavailable, the static medallion fallback still shows the wheel and result. Audio is
optional and never blocks the reading. A throttled animation-frame clock cannot strand a stage.

**Independent Test**: Run with `prefers-reduced-motion: reduce`, block WebGL, and simulate a stalled frame
clock; the reading still completes and controls remain usable.

**Acceptance Scenarios**:

1. **Given** reduced motion, **When** Start is pressed, **Then** all values, the Spark and the dock appear
   immediately and no cinematic mounts.
2. **Given** no WebGL, **When** the page loads, **Then** the medallion renders its static fallback with the
   wheel and result intact.
3. **Given** a broken audio import, **When** Start is pressed, **Then** the reveal continues and only a
   diagnostic warning is logged.
4. **Given** a paused frame clock, **When** the stage duration elapses, **Then** a timer latch completes the
   stage instead of leaving it half-finished.

---

### Edge Cases

- Feb 29 must belong to Winter in leap years and Mar 1 to Spring.
- Dec 31 and Jan 1 must stay in Winter across the year boundary.
- A legacy stored colour id may not exist in the active palette; it must still render with its stored HEX.
- Midnight in an open tab resets the welcome state and clears the dock.
- The daily reading, Lucky Number, colour and Spark remain independent draws with their existing
  distributions, one-previous-value exclusion, history and daily limit.
- Compact embeds never render the Home dock.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The pointer MUST be a gold maple leaf fixed at 6 o'clock; only the wheel rotates.
- **FR-002**: The wheel MUST have twelve named segments and stop with the selected segment under the pointer
  on the same frame as the percentage.
- **FR-003**: The selected segment MUST visibly open and pour its colour into the Lucky Colour area while
  the Lucky Number is progressively exposed.
- **FR-004**: The exact tier message MUST be written above the meter, held, faded, and only then followed by
  the tier celebration.
- **FR-005**: Home and the countdown MUST appear together, and only after the Spark writing completes.
- **FR-006**: Four 12-colour seasonal palettes, their finishes and their local date ranges MUST live in one
  configuration beside the thirty Sparks.
- **FR-007**: Every new sound and visual resource MUST be registered and prepared through
  `app/lib/resource-readiness.js`; no separate loading system may be introduced.
- **FR-008**: Existing recordings MUST be reused; no new licence or download may be added.
- **FR-009**: Persistence MUST resume the reveal, message, celebration and Spark without re-rolling, and MUST
  preserve legacy stored colours.
- **FR-010**: The Milky Way artwork, its position and its overlay MUST remain unchanged; only meter colour
  may change with the season.
- **FR-011**: Reduced motion, a WebGL fallback, optional audio and frame-clock throttling MUST all complete
  the experience.
- **FR-012**: The production build MUST remain strictly below 495 MiB.

### Key Entities

- **Season**: `winter | spring | summer | autumn`, with a name, date range and exactly twelve colours.
- **Colour record**: id, name, exact HEX, light flag and a painted finish (`matte`, `satin`, `gloss`,
  `frost`, `petal`) with grain and sheen.
- **Storyboard timing**: the single object that owns every stage length and the derived run schedule.
- **Stored lifecycle**: `revealCompleted`, `messageCompleted`, `eventCompleted`, `sparkCompleted` and
  `stageDurationMs`, additive over the existing result and history.

## Success Criteria *(mandatory)*

### Measured Outcomes

- **SC-001**: A complete fresh run takes roughly 25–32 seconds from Start to the dock, and every stage hands
  off in the documented order.
- **SC-002**: The wheel and percentage stop within one frame; the wheel angle equals `180 − index × 30`
  modulo 360.
- **SC-003**: All 48 seasonal colours are unique and match the owner-supplied HEX values exactly.
- **SC-004**: The full unit suite, the Lucky Meter Playwright suite on desktop and both mobile viewports,
  `tsc --noEmit`, `./freebuff-verify.sh` and the production build pass, with the build below 495 MiB.

## Assumptions

- The existing WebGL medallion remains the lit gold body; the colour wheel is crisp SVG on its raised bezel.
- The existing same-origin recordings are sufficient for the new stage cues.
- Browser-local time is authoritative for the season and the daily reset.
