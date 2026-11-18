# Feature Specification: Premium Daily Resonance — Medallion, Independent Reveals and the Little Spark Finale

**Feature Branch**: `freebuff/ec0b9abbbe0e2dabc982edca`

**Created**: 2026-11-18

**Status**: Implemented; verification recorded in `evidence.md`

**Input**: Owner mission: make Daily Resonance a premium daily experience centred on a realistic 3D medallion, with an independent Lucky Number and Lucky Colour reveal and a Little Spark finale written by the Crystal Ball GoldenLeaf. The existing percentage weighting, tiers and events are frozen; the layout is owned by this task.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - The reading is a real object, not a flat chart (Priority: P1)

As a visitor, I want the daily reading to feel like a substantial gold-and-enamel medallion held in the light, so the ritual feels considered and cinematic rather than a themed progress bar.

**Why this priority**: The medallion is the centre of the experience; without physical weight the page reads as generic.

**Independent Test**: Render the route at desktop, 390 px and 412 px and inspect the medallion: raised bezel, enamel well, milled rim, held-back specular highlights, a grounded contact shadow, and no flat or casino-style gradient.

**Acceptance Scenarios**:

1. **Given** the reading is revealed, **When** the medallion is rendered, **Then** it shows depth (bezel, groove, raised rim, enamel dome), a lit metal response and a contact shadow that grounds it against the Milky Way.
2. **Given** WebGL is unavailable or the context is lost, **When** the reading is revealed, **Then** the CSS medallion stands in with the same layout, text and test ids, and the reading still completes.

---

### User Story 2 - Three independent reveals settle in a fixed order (Priority: P1)

As a visitor, I want the percentage, the Lucky Number and the Lucky Colour to each be chosen independently and to land in a readable, staggered sequence, so I trust that one value is not derived from another.

**Why this priority**: The previous fixed number triplets implied the number came from the percentage; the mission requires three separate draws.

**Independent Test**: Pin the random source, run the reveal, and assert the stored result's percentage, number and colour against the selection helpers; then assert the DOM order of the three settles and the cinematic start time.

**Acceptance Scenarios**:

1. **Given** a fresh day, **When** Start is pressed, **Then** all three animations begin together and settle in the order percentage (620 ms), number (940 ms), colour (1240 ms), and the cinematic begins at 1540 ms.
2. **Given** the previous saved result, **When** the next result is drawn, **Then** only that result's percentage, number, colour and Spark are excluded; older values are eligible, and the previous tier/event never blocks a draw.
3. **Given** the number pointer and the colour ring, **When** they settle, **Then** they land on values already chosen by the selection layer and never influence the percentage.

---

### User Story 3 - The Little Spark is the memorable finale (Priority: P1)

As a visitor, I want the GoldenLeaf to bring the day's message after the cinematic and write it like a quill in a place of honour, so the reading ends on something personal rather than a card of data.

**Why this priority**: The mission names the finale as the memorable moment; a bottom card buried under the results cannot carry it.

**Independent Test**: Complete a reading and assert the Spark panel is above the medallion, that it is empty until the cinematic ends, that the message types out, stays visible when complete, and that the countdown appears beneath Home only afterwards.

**Acceptance Scenarios**:

1. **Given** the cinematic has just finished, **When** the Spark begins, **Then** GoldenLeaf moves to the reserved message area near the top and writes the stored message character by character.
2. **Given** a completed Spark, **When** the page is reloaded, **Then** the full message is shown immediately, the stage is not replayed and the countdown is present.
3. **Given** a reload during the writing, **When** the page loads, **Then** the writing resumes from the start of the message and the cinematic is not replayed.

---

### User Story 4 - Saved results migrate without rerolling (Priority: P1)

As a returning visitor with a saved reading from before this release, I want my percentage, colour and Spark kept exactly, and one missing Lucky Number added once, so nothing about my day changes.

**Why this priority**: Rerolling a saved day would break the promise that a reading is fixed at local midnight.

**Independent Test**: Seed a stored result without `luckyNumber`, load the route, read the number from storage and the UI, reload, and confirm both are unchanged.

**Acceptance Scenarios**:

1. **Given** a stored result without a Lucky Number, **When** the route loads, **Then** exactly one 1–50 number is drawn, persisted with the result and inserted into the number history.
2. **Given** that migrated result, **When** the page reloads, **Then** the same number is displayed and no new draw occurs.
3. **Given** a stored result with all fields, **When** the route loads, **Then** no field is rewritten, no completed stage replays and no unfinished animation is skipped.

---

### User Story 5 - The layout holds on a phone and a desktop (Priority: P2)

As a visitor on a 390 px phone, I want the Spark, medallion, results, Home and countdown to fit without overlapping, so the ritual is readable in one pass.

**Why this priority**: The new finale and three result cards add height; the old bottom-card arrangement no longer fits.

**Independent Test**: Capture the completed reading at 1440×900, 390×844 and 412×915 and check for overlap, clipping and scroll.

**Acceptance Scenarios**:

1. **Given** a 390 px viewport, **When** the reading completes, **Then** the Home button and its countdown do not overlap the ritual counter or the Spark panel, and the share button is fully visible.
2. **Given** a desktop viewport, **When** the reading completes, **Then** the Spark panel is near the top, the medallion centred and the three result cards sit in one row.

---

### Edge Cases

- Reduced motion: the three values are presented at their settled state, the cinematic is skipped as before, and the Spark appears complete with the countdown.
- Midnight rollover while the page is open: the reading resets through the existing local-midnight path, with no new server call.
- A skip of several days: the "most recent saved result" is still the newest stored one, so exclusions are taken from it rather than from yesterday.
- Legacy payloads with an `events` history: the old list is ignored and never blocks an event.
- Storage unavailable or corrupt: the existing safe fallback path still yields a valid reading.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Preserve the 5–100 percentage range, its weighting and the 5–30 / 31–65 / 66–100 tier boundaries and their events.
- **FR-002**: Exclude only the immediately preceding saved percentage; older percentages stay eligible and no tier or event is ever excluded.
- **FR-003**: Draw one Lucky Number uniformly from 1–50, excluding only the number in the most recent saved result.
- **FR-004**: Draw one Lucky Colour uniformly from the existing twelve-colour palette with its approved names and HEX values, excluding only the most recent saved colour.
- **FR-005**: Draw one Little Spark from the unchanged thirty messages, excluding only the most recent saved Spark.
- **FR-006**: Record exactly one previous value per choice in storage size; older history must not restrict a draw.
- **FR-007**: Keep the percentage pointer and the colour ring display-only; they must never select or alter a value.
- **FR-008**: Start percentage, number and colour animations together and settle them within roughly 1–1.5 s in that order.
- **FR-009**: Play the percentage-selected cinematic after all three settles, then write the Spark with the Crystal Ball GoldenLeaf and keep it visible.
- **FR-010**: Show the countdown beneath Home only after the Spark animation finishes.
- **FR-011**: Present the Spark finale near the top, above the medallion, with the remaining results arranged cleanly for desktop and mobile.
- **FR-012**: Use singular "Lucky Number" in the interface and in sharing, and show the colour's exact name and HEX.
- **FR-013**: Render the medallion as a raised gold-and-enamel object with bevels, depth, controlled reflections, lighting and a grounded shadow.
- **FR-014**: Preserve the Milky Way artwork and its layering exactly.
- **FR-015**: Extend the existing WebGL 1 medallion renderer, geometry, shaders, capability detection, adaptive quality and fallbacks; add no new dependency or engine.
- **FR-016**: Preserve context-loss handling and reduced-motion behaviour.
- **FR-017**: Preserve audio, sharing, Home, the disclaimer and local-midnight behaviour, and keep all Daily Resonance data in the existing localStorage key.
- **FR-018**: Migrate a saved result without a Lucky Number once, and never reroll an existing percentage, colour or Spark.
- **FR-019**: Ensure refresh/resume neither rerolls selections, replays completed stages nor skips unfinished animations. The reveal motions are a stage in their own right, so a reload during them resumes them rather than jumping to the cinematic.
- **FR-020**: Bound rendering work and release frames, timers, listeners and GPU resources on unmount.
- **FR-021**: Do not touch Lucky Stories, the database, `DATABASE_URL` or any API/server write.

### Key Entities

- **Daily result**: `dateKey`, `percentage`, `tierId`, `eventId`, `luckyNumber`, `colourId`, `sparkId`, `createdAt`, `completed`, `sparkCompleted`.
- **History**: four single-value lists (`percentages`, `numbers`, `colours`, `sparks`) holding the most recent saved result's values.
- **Stored payload**: `{ version: 1, result, history, visits }` under `lucky-pick-canada-lucky-meter-v1`.

## Delivered Invariant Audit *(follow-up pass)*

Every requirement above was re-checked against the delivered code as a claim to falsify, and each is now
demonstrated by a named passing test rather than by commentary. The audit found one violation — a refresh
during the reveal skipped the three motions — which is repaired by FR-019's persisted reveal stage and
re-proven in unit, DOM and browser tests. `evidence.md` maps every invariant to its test.

## Success Criteria *(mandatory)*

- **SC-001**: Unit tests prove each choice is uniform within its range and excludes only its own newest value, including the older-value-eligible case.
- **SC-002**: Unit and browser tests prove the settle order and that the cinematic starts only after the last settle.
- **SC-003**: A seeded legacy payload keeps its percentage, colour and Spark, gains exactly one persisted number, and survives reload unchanged.
- **SC-004**: The completed reading overlaps nothing and needs no scrolling at 1440×900, 390×844 and 412×915.
- **SC-005**: The production build stays below the repository's 495 MiB limit.
- **SC-006**: `./freebuff-verify.sh` passes.
- **SC-007**: A stored reading that was interrupted mid-reveal resumes its motions, keeps its exact values and reaches the cinematic only after them.
