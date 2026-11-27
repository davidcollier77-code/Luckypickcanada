# Feature Specification: Lucky Meter Visitor Experience — Cinematic Instrument

**Feature Branch**: `227-lucky-meter-visitor-experience`

**Created**: 2026-11-27

**Status**: Draft

**Input**: Owner request: refine the existing Lucky Meter into a polished, cinematic, high-quality 3D reveal that closely matches the supplied READY and FINISHED reference images, with coordinated animation, liquid effects, an independent Lucky Number transfer, seasonal colour presentation, sound design and precise timing, while preserving every existing mechanic and the production background.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Ready composition matches the reference instrument (Priority: P1)

A first-time visitor opens `/lucky-meter` and sees the instrument itself, not a marketing block: the red-and-gold "Lucky Meter" banner above a twelve-cup gold wheel of coloured glass compartments, an open gold spout at 7:30, an empty faceted crystal bowl lower-left, an empty ornate "Your Lucky Number" plaque to its right, a gold "Your Lucky Colour" bar beneath the bowl, and one gold "Start My Lucky Meter" control below.

**Why this priority**: The READY state is the first and only impression before the interaction; if it does not read as the reference instrument, nothing later recovers the experience.

**Independent Test**: Load `/lucky-meter` at 390×844 with a seeded empty state; compare the capture against the target READY reference; the wheel occupies 60–75 % of the stage width, both result destinations are visibly empty, and Start is the only call to action.

**Acceptance Scenarios**:

1. **Given** no reading today, **When** the page is ready, **Then** the banner, twelve cups, spout, empty bowl, empty plaque, colour bar and Start pill are all present, and no intro heading, visits pill, event card or results grid is rendered.
2. **Given** a 320×568 viewport, **When** the page loads, **Then** the instrument is fully inside the viewport with no horizontal scroll and Start remains reachable.

---

### User Story 2 - Finished composition matches the reference (Priority: P2)

After a completed reading the visitor sees the same instrument with the bowl full of the selected colour, the colour name in the gold bar, the Lucky Number seated in the plaque beneath its engraved header, and Home and Share in the corner dock with the compact "Next Reveal In" clock chip.

**Why this priority**: The finished state is the shareable outcome; it must read as one physical instrument.

**Independent Test**: Seed a completed reading and capture at 390×844; the plaque contains the stored Lucky Number, the bar contains the stored colour name, no "Today's Event" card exists, and the dock shows Home, Share and the "Next Reveal In" chip.

**Acceptance Scenarios**:

1. **Given** a stored result, **When** the page hydrates, **Then** the number is inside the plaque and the colour name is inside the bar.
2. **Given** a completed reading, **When** the dock arrives, **Then** the countdown reads "Next Reveal In" and the visits pill and event card are absent.

---

### User Story 3 - Only the selected chamber drains, with believable liquid (Priority: P3)

During the pour the selected cup empties through the spout into the crystal bowl while the other eleven stay full, and the bowl rises with a moving surface.

**Why this priority**: The reveal is the mechanic; an inconsistent drain misreports the result.

**Independent Test**: Run a reveal and sample `data-pour`, `data-vessel-fill` and the scene state at the pour midpoint; the drain is monotonic, the bowl fill tracks it, and the selected index equals the stored colour's palette index.

**Acceptance Scenarios**:

1. **Given** a landed reading, **When** the pour runs, **Then** only the chamber at the 7:30 spout loses liquid and all others stay at full.
2. **Given** the pour has ended, **When** the bowl is full, **Then** the fill stays at 1.000 and the stream stops.

---

### User Story 4 - Independent dimensional Lucky Number transfer (Priority: P4)

After the drain the number forms inside the selected cup, detaches as its own dimensional gold object, flies a continuous arc that never enters the spout, the stream or the bowl, and seats itself inside the plaque's recess while the plaque frame brightens.

**Why this priority**: The owner called this the centrepiece creative moment; it also proves the number and the colour are separate results.

**Independent Test**: Sample the flight path from the layout helper and assert its distance from the bowl and spout; capture detach, mid-flight and arrival frames; assert the plaque inlay mounts only at arrival.

**Acceptance Scenarios**:

1. **Given** the transfer window, **When** it begins, **Then** the number leaves the cup, not the spout, and its path stays at least 0.25 world units clear of the bowl.
2. **Given** arrival, **When** the transfer settles, **Then** the number is inside the plaque recess and the DOM inlay reports the stored value.

---

### User Story 5 - Coordinated sound, light and timing (Priority: P5)

Every audio cue lands on its visual event: wheel start, wheel stop, pour start, bowl completion, number detach, number arrival and dock arrival; light and particle envelopes rise and fall with the beats.

**Why this priority**: A cinematic sequence that sounds out of step reads as broken even when every frame is correct.

**Independent Test**: Assert the cue offsets against the storyboard constants, and assert the choreography envelopes at named elapsed times.

**Acceptance Scenarios**:

1. **Given** a reveal, **When** the pour ends, **Then** a bowl-completion cue fires at `POUR_END_MS` and not earlier.
2. **Given** the transfer, **When** it starts, **Then** a detach cue fires at `NUMBER_PAUSE_END_MS` and the arrival cue fires only at `REVEAL_COMPLETE_MS`.

---

### User Story 6 - All twelve seasonal colours remain faithful (Priority: P6)

Each season's twelve palettes drive cup liquid, rim light, bowl fill, stream, bar swatch and label.

**Why this priority**: The colour system is the product's seasonal identity.

**Independent Test**: For each season, seed its palette and assert the wheel reports twelve ids and the bar shows that palette's colour.

**Acceptance Scenarios**:

1. **Given** any season, **When** the instrument is ready, **Then** all twelve colours are present and no colour is hard-coded.

### Edge Cases

- WebGL unavailable or context lost: the complete CSS fallback meter must remain, now including the plaque and colour bar.
- Reduced motion: the reading, number and dock appear together with no flight or typing.
- Refresh during the transfer: the stored reading resumes complete, never replaying a half-flight.
- `prefers-reduced-motion` with a stored result: no cursor and no celebration.
- Very short viewport (844×390 landscape): both result destinations remain inside the viewport.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The metre MUST be one three-dimensional instrument: banner, twelve gold-bezelled glass cups with liquid, gold spout, crystal bowl on a foot, colour bar and number plaque.
- **FR-002**: Only the selected chamber may drain; the other eleven MUST remain full.
- **FR-003**: The Lucky Number MUST leave the selected chamber as an independent object and MUST NOT pass through the spout, the stream or the bowl.
- **FR-004**: The number MUST arrive inside the plaque's recess beneath its engraved header.
- **FR-005**: The plaque and colour bar MUST be separate destinations; the colour stays with the bowl.
- **FR-006**: The intro block, visits pill, event result card and results grid MUST NOT render in the visitor experience.
- **FR-007**: The countdown MUST appear only as the compact dock chip labelled "Next Reveal In".
- **FR-008**: The start control MUST read "Start My Lucky Meter" and keep `data-testid="lucky-meter-start"`.
- **FR-009**: All twelve seasonal colours, the palette mapping, selection maths, daily limits, persistence, share and reduced-motion behaviour MUST be preserved.
- **FR-010**: The Milky Way, forest and lake artwork MUST be unchanged; new light and particles MUST be foreground effects.
- **FR-011**: Audio MUST reuse shipped recordings and the existing Howler/event-audio architecture.
- **FR-012**: Rendering MUST stay bounded: cached geometry, pooled particles, disposal, idle stop and the existing quality tiers.
- **FR-013**: The production build MUST remain strictly below 495 MiB.

### Key Entities

- **Chamber**: one of twelve seasonal cups; index, colour id, hex, fill 0–1.
- **Reading**: stored percentage, tier, colour, lucky number, spark line, event id.
- **Destination**: the bowl (colour) and the plaque (number); never interchangeable.

## Success Criteria *(mandatory)*

- **SC-001**: READY and FINISHED captures read as the same instrument family as the supplied references at 390×844.
- **SC-002**: The number's sampled path clears the bowl by ≥ 0.25 world units and the spout mouth by ≥ 0.45.
- **SC-003**: Twelve of twelve seasonal palettes render with no console error.
- **SC-004**: No horizontal overflow at 320, 360, 390, 412, 430, 820, 844 or 1440 px.
- **SC-005**: Measured production build strictly below 495 MiB.

## Assumptions

- The reference images define the foreground design; their background is illustrative and the production artwork is preserved.
- Existing storyboard timings are authoritative; the transfer reuses its existing 2,900 ms window.
- Emulated viewports are the verification environment; no physical device is available.
