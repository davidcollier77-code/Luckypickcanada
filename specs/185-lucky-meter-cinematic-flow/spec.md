# Feature Specification: Lucky Meter Cinematic Flow — Arrival Leaves, One Continuous Reveal and Sky-Written Spark

**Feature Branch**: `freebuff/48421c42b397224a7be733cc`

**Created**: 2026-11-18

**Status**: Implemented; verification recorded in `evidence.md`

**Input**: Owner mission: refine the Lucky Meter into a cohesive cinematic experience with natural visual transitions, precisely synchronized audio and a polished Spark finale. Build on the existing implementation; preserve the Milky Way, existing artwork, selection logic and the 5–30 / 31–65 / 66–100 tier thresholds.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - The scene arrives with real leaves (Priority: P1)

As a visitor opening the Lucky Meter for the first time in a day, I want a few realistic maple leaves resting naturally at the edges of the sky before anything is asked of me, so the ritual begins with a composed scene rather than a static page.

**Why this priority**: The mission asks for a natural introduction that finishes before Start; it is the first frame of the experience.

**Independent Test**: Load the route without a stored reading; confirm the arrival canvas is present and resting, that the breeze begins about one second later, that the canvas removes itself after roughly four seconds, and that Start was never blocked.

**Acceptance Scenarios**:

1. **Given** a fresh visit with no stored reading, **When** the page appears, **Then** five small autumn leaves rest at the side edges, drawn as maple shapes with veins, stem, pigment and a grounded shadow.
2. **Given** the leaves are resting, **When** one second has passed, **Then** the shared wind field lifts them one after another and carries them across and out of the frame.
3. **Given** the introduction is in progress, **When** the visitor presses Start, **Then** the leaves are removed immediately and the reveal proceeds without waiting for them.
4. **Given** reduced motion, **When** the page appears, **Then** the leaves are drawn once at rest and never animate or remove themselves.

---

### User Story 2 - The three reveals are one continuous cinematic (Priority: P1)

As a visitor, I want the percentage, Lucky Number and twelve-colour ring to move as one coordinated reveal over seven to eight seconds, with a brief held breath after Start, so the reading feels deliberate rather than three unrelated spinners.

**Why this priority**: The previous 1.24-second stagger is too quick to carry the mission's cinematic intent, and the three motions must still read as one event.

**Independent Test**: Pin the random source, press Start, and measure the DOM milestones: 500 ms of anticipation, percentage at 3.2 s, number at 5.4 s, colour at 7.4 s, cinematic after a further 420 ms; every stored value and tier remains unchanged.

**Acceptance Scenarios**:

1. **Given** a fresh day, **When** Start is pressed, **Then** the ring holds still for 500 ms with a gathering point of gold and no value exposed.
2. **Given** the anticipation ends, **Then** all three motions begin together and settle in the order percentage (3.2 s), Lucky Number (5.4 s), colour ring (7.4 s).
3. **Given** the last settle, **Then** the percentage-selected cinematic begins 420 ms later; the 5–30 / 31–65 / 66–100 boundaries and every existing event are unchanged.
4. **Given** a refresh during the motions, **Then** the same stored values replay the motions instead of skipping to the cinematic.

---

### User Story 3 - Audio follows the visuals (Priority: P1)

As a visitor, I want the buildup, impacts, launches, thunder and finale to land with the moments I see, so the sound supports the cinematic instead of drifting away from it.

**Why this priority**: The reveal is now much longer; the buildup must cover the anticipation and dial, and the event cues must remain tied to the engine's visual actions.

**Independent Test**: Run the DOM audio suite and confirm the buildup is the only cue before the stage mounts, the buildup fades when the percentage settles, and the event cue vocabulary still resolves to the same layers and mix.

**Acceptance Scenarios**:

1. **Given** Start is pressed, **Then** the buildup begins with the held breath and is still the only reveal cue through the percentage settle.
2. **Given** the percentage lands, **Then** the buildup fades and stops exactly with the landing flash.
3. **Given** the cinematic starts, **Then** its impacts, launches, thunder delays and layered finale cues remain unchanged and are emitted by the visual engine.

---

### User Story 4 - The Spark is written in the sky (Priority: P1)

As a visitor, I want the Little Spark written directly into the sky by a tiny point of golden light after a short pause, leaving the completed message visible, so the finale feels like a message arriving rather than a card appearing.

**Why this priority**: The mission explicitly replaces the oversized travelling leaf and the separate typing panel.

**Independent Test**: Complete a cinematic, wait for the cursor, confirm the Spark has no panel background, border or padding, that characters appear progressively, that the cursor disappears when finished, and that the message remains.

**Acceptance Scenarios**:

1. **Given** the cinematic has just finished, **Then** the sky holds for about one second with a gathering ember.
2. **Given** the hold ends, **Then** a tiny golden point of light reveals the stored message one character at a time in warm, glowing sky text.
3. **Given** the writing completes, **Then** the full message stays in place, the cursor disappears, and the countdown appears beneath Home.
4. **Given** reduced motion, **Then** the complete message is shown at once with no cursor.
5. **Given** a refresh after the cinematic, **Then** the writing resumes without replaying the stage.

---

### User Story 5 - The flow holds on a phone and cleans up after itself (Priority: P2)

As a visitor on a phone, I want the arrival, reveal and sky-writing to stay readable and smooth, and I want nothing to keep running after the scene is over.

**Why this priority**: The new canvas and longer timeline must not cost mobile performance or leak frames and timers.

**Independent Test**: Run the new checks on 390×844 and 412×915; confirm the phone leaves stay below the headline, the sky message does not clip, and the new canvases and timers are gone after their stage.

**Acceptance Scenarios**:

1. **Given** a 390 px viewport, **Then** every arrival leaf sits in the side gutters below the headline, the medallion is untouched, and the sky message fits without horizontal scroll.
2. **Given** a completed Spark or a cancelled introduction, **Then** its timers and animation frames are released.
3. **Given** the tab is hidden during the arrival, **Then** the breeze pauses and resumes from where it stopped rather than jumping to the end.

### Edge Cases

- Start pressed during the arrival: leaves unmount and their frames/timers are cancelled.
- Start pressed twice during the anticipation: the second press is ignored.
- Refresh during the reveal, cinematic, one-second Spark hold or writing: the persisted stage flags resume the right stage with the same values.
- Reduced motion: no spins, no cinematic, no writing cursor; the complete reading and Spark are presented immediately.
- Local midnight during any new stage: the sequence is cleared and the welcome state returns.
- WebGL unavailable: the existing fallback still completes the reveal and cinematic; the arrival and sky-writing are DOM/canvas-2D and unaffected.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Preserve `PERCENTAGE_MIN/MAX`, the 5–30 / 31–65 / 66–100 tier boundaries, their events and the existing independent selection and storage logic.
- **FR-002**: Render a resting arrival composition of a few realistic maple leaves at the scene edges before Start.
- **FR-003**: Begin the breeze about 1,000 ms after the arrival mounts and carry every leaf out of the frame within roughly four seconds.
- **FR-004**: Finish or cleanly cancel the arrival before the reveal begins; never block Start.
- **FR-005**: Hold for 500 ms after Start with no value exposed and a gathering visual.
- **FR-006**: Start the percentage dial, Lucky Number pointer and colour ring together after the hold and settle them at 3,200 / 5,400 / 7,400 ms.
- **FR-007**: Start the percentage-selected cinematic 420 ms after the last settle, keeping `EVENT_START_MS` as the single derived start time.
- **FR-008**: Keep each existing sampler returning its exact final value at landing and never leak the result early.
- **FR-009**: Keep the buildup sounding through the anticipation and dial spin, fading at the percentage settle.
- **FR-010**: Preserve every existing cinematic cue, layer, rate, volume, thunder delay and finale cue unchanged.
- **FR-011**: Hold for about one second after the cinematic before the Spark begins.
- **FR-012**: Replace the raised Spark panel and travelling GoldenLeaf with sky-writing in the existing scene.
- **FR-013**: Write the message progressively using a tiny golden point of light; remove the cursor on completion.
- **FR-014**: Keep the completed message visible and expose it to assistive technology only once complete.
- **FR-015**: Keep the Spark's character clock local to the writing component so the page does not re-render per character.
- **FR-016**: Present the complete Spark immediately under reduced motion.
- **FR-017**: Preserve the persisted lifecycle (`revealCompleted`, `eventCompleted`, `sparkCompleted`) and resume the correct stage after refresh.
- **FR-018**: Release every new animation frame, timer, visibility listener and canvas on unmount, Start and midnight rollover.
- **FR-019**: Keep the Milky Way picture block, its sources, position and overlay byte-for-byte unchanged; preserve the existing ornament layers.
- **FR-020**: Keep the phone composition out of the headline and the sky message inside the viewport at 390 px and 412 px.

### Key Entities

- **Arrival leaf**: viewport-fraction position, size, rotation, tilt, autumn pigment, lift delay, flight length, drift, rise, spin, flutter and sway.
- **Reveal timing**: `anticipationMs`, three settle times, `spinMs`, flash, event delay and Spark hold.
- **Spark writing state**: `waiting`, `writing`, `written`; message text and visible character count.

## Success Criteria *(mandatory)*

- **SC-001**: Unit tests prove the leaf composition is edge-bound, mobile-safe, deterministic for a fixed random source and fully faded at the end of the crossing.
- **SC-002**: Unit and DOM tests prove the 500 ms hold, the 3,200 / 5,400 / 7,400 ms settle order, the 420 ms hand-off and the one-second Spark hold.
- **SC-003**: A browser test measures the cinematic starting after 6.8 s on the resumed reveal, proving the old 1.2 s hand-off is gone.
- **SC-004**: A browser test confirms the Spark section has no background, border or padding, a visible cursor while writing, and the completed message after.
- **SC-005**: Desktop, 390 px and 412 px browser runs pass for arrival, Spark and reduced motion.
- **SC-006**: The full Vitest suite, TypeScript check, production build under 495 MiB and `./freebuff-verify.sh` pass.
- **SC-007**: Before-and-after captures show the old panel and the new sky-writing, and the arrival/resting scene.
