# Feature Specification: Lucky Meter Dimensional Redesign

**Feature Branch**: `freebuff/82127dd98cffccf4d358619f`

**Created**: 2026-11-23

**Status**: Implemented — one complete change, open as a regular unmerged PR

**Input**: Owner-approved Build instruction: *"Proceed with the complete Lucky Meter dimensional redesign under the existing Spec 212. Use the corrected Spec 212 plan and storyboard as the implementation authority."* The corrected storyboard is the timing authority in this document.

**Supersedes**: Spec 212's earlier pointer-only Stage 1 wording. This is the same feature number, expanded to the whole meter; there is no separate pointer-only feature or PR. Spec 205/199/200 confirmed the preserved presentation and generation behaviour, but their SVG wheel, 6 o'clock pointer and empty-vessel ending are replaced here.

## User Scenarios & Testing *(mandatory)*

### User Story 1 — The meter is one physical object (Priority: P1)

A visitor opening `/lucky-meter` sees a single dimensional meter: a struck gold medallion, twelve glass seasonal chambers, a central decorative maple leaf, a fixed external golden maple-leaf pointer with a curved arm and spout at 7:30, and a glass receiving vessel. The old SVG wheel, SVG pointer, curved arm, spout, chamber geometry and SVG pouring effects are gone.

**Independent Test**: Load the route on desktop and mobile, with WebGL and with WebGL denied. Confirm the meter has no `<svg>` artwork, the pointer sits at 7:30 in both renderers, all twelve chamber ids are present, and the CSS fallback still draws a complete wheel, pointer, leaf, vessel, stream and beam.

**Acceptance Scenarios**:

1. **Given** a fresh visit, **When** READY is shown, **Then** the wheel, twelve chambers, fixed pointer and vessel are visible as one composed object, and the central leaf floats above the well.
2. **Given** Start is pressed, **When** the leaf exits, **Then** the central decorative leaf rotates back, recedes and disappears, leaving the well clear.
3. **Given** the meter is idle, **When** no frame is needed, **Then** the scene stops rendering and a pointer move or a new reading wakes it.

### User Story 2 — The wheel and the percentage are independent clocks (Priority: P1)

The wheel turns for exactly 4,400 ms, makes five revolutions and stops on the already-selected colour at 6,300 ms. The percentage generates for its own 9,400 ms window beginning at 1,900 ms and reaches the stored result only at 11,300 ms. The five approved percentage beats are preserved.

**Independent Test**: `lucky-meter-reveal` proves the derived boundaries, the five-beat sampling, the 225° landing and a 4,400 ms spin independent of the 9,400 ms generation. Component tests confirm the stored percentage is not shown before its window closes.

**Acceptance Scenarios**:

1. **Given** a stored result, **When** the wheel stops, **Then** the selected colour is under the fixed pointer and the percentage is still generating.
2. **Given** 11,299 ms have elapsed, **When** the readout is sampled, **Then** it is not the stored percentage.
3. **Given** 11,300 ms have elapsed, **When** the percentage window closes, **Then** the stored result appears and the plaque returns; no new value is sampled.

### User Story 3 — Only the selected chamber drains; the vessel stays full (Priority: P1)

At 11,300 ms the selected chamber begins a 2,000 ms drain into the receiving vessel. The other eleven chambers remain full. The vessel fills to full at 13,300 ms, pauses for 1,500 ms, then a golden beam carries the number to its display for 1,500 ms. The vessel never empties afterwards.

**Independent Test**: `lucky-meter-layout` proves only the selected index changes fill factor. Lifecycle tests assert `data-vessel-fill="1.000"` from the pour's end through the celebration and FINISHED, and assert the number is hidden until the transfer completes.

**Acceptance Scenarios**:

1. **Given** the pour is running, **When** the chamber fill is evaluated, **Then** the selected chamber falls from full to empty while the other eleven stay exactly full.
2. **Given** the pour completes, **When** the vessel rests, **Then** it is full and the selected chamber is empty.
3. **Given** the transfer completes, **When** the number settles, **Then** the vessel remains full.

### User Story 4 — The message is permanent after it is written (Priority: P1)

The exact tier sentence keeps its wording, typing cadence, 800 ms lead-in, 3,000 ms hold and 900 ms event delay. The old fade is replaced by an 800 ms visible settle. The message stays visible through the 12,000 ms celebration and the FINISHED state.

**Independent Test**: `lucky-meter-cinematic-lifecycle` and `daily-resonance-daily-experience` assert the message is present and `data-settled="true"` while the celebration is mounted and after the dock appears. A stored completed reading shows the sentence immediately.

**Acceptance Scenarios**:

1. **Given** the message is writing, **When** the character clock finishes, **Then** the full sentence is held at full opacity.
2. **Given** the 800 ms settle runs, **When** the celebration begins, **Then** the sentence is still present at full opacity.
3. **Given** FINISHED is shown, **Then** the same sentence is still present.

### User Story 5 — Preserved later stages and preserved systems (Priority: P1)

The full 12,000 ms tier celebration, 1,300 ms Spark delay, 3,800–5,200 ms Spark writing, 2,800 ms final hold and 3,600 ms dock sequence are unchanged. Result generation, tiers/events, 1–50 Lucky Number, audio, persistence, sharing, reduced motion, the Milky Way and unrelated functionality are unchanged.

**Independent Test**: `lucky-meter-cinematic-lifecycle` walks the complete post-reveal sequence; `lucky-meter-selection`, `lucky-meter-storage`, `lucky-meter-seasonal-colours` and the audio suites pass unchanged. The celebration remains 12,000 ms for every tier and a refresh restarts it at full length.

### Edge Cases

- **No WebGL or context loss**: a complete CSS composition replaces the canvas. It contains no SVG and keeps every essential object. A lost context returns to CSS; a restored context returns to the scene.
- **Reduced motion**: the reading, full vessel, sentence, Spark and dock are presented at once; the CSS highlight renders statically.
- **Throttled frames**: timer-owned hand-offs set the percentage at 11,300 ms and the full vessel at 13,300 ms, so a paused frame loop cannot leave either value wrong.
- **Refresh at any point**: the stored lifecycle point resumes without rerolling; a completed reading shows the full vessel, sentence and Spark without replaying.
- **Mobile**: adaptive quality tiers keep the composition; the stage remains square and the readout stays over the wheel's well.
- **Build size**: the production build stays strictly below the 495 MiB cap.

## Requirements *(mandatory)*

- **FR-001**: The Lucky Meter MUST be one Three.js scene mounted through `createCreativeSurface`; no second renderer, registry, runtime or preloader.
- **FR-002**: The meter MUST render no SVG artwork: no SVG wheel segments, pointer, curved arm, spout, chamber geometry or SVG pouring effects.
- **FR-003**: The wheel MUST turn for 4,400 ms, make exactly five revolutions, and stop on the stored colour at 6,300 ms under a fixed pointer at 225° (7:30).
- **FR-004**: The percentage MUST generate for 9,400 ms from 1,900 ms and reach the stored result only at 11,300 ms, preserving the five approved beats (0 → 100 → fall → rise → erratic → settle).
- **FR-005**: The selected chamber MUST drain for 2,000 ms from 11,300 ms; the other eleven chambers MUST remain full.
- **FR-006**: The receiving vessel MUST fill to full by 13,300 ms and MUST remain full through the pause, transfer, message, celebration and FINISHED state.
- **FR-007**: The number pause MUST be 1,500 ms and the golden-beam transfer MUST be 1,500 ms, completing at 16,300 ms.
- **FR-008**: The tier message MUST preserve its wording and typing cadence, 800 ms lead-in, 3,000 ms hold, 900 ms event delay and replace the fade with an 800 ms visible settle.
- **FR-009**: The message MUST remain visible at full opacity through the celebration and the FINISHED state.
- **FR-010**: The celebration MUST be exactly 12,000 ms for every tier; the Spark delay MUST be 1,300 ms; Spark writing MUST stay inside 3,800–5,200 ms; the final hold MUST be 2,800 ms and the dock 3,600 ms.
- **FR-011**: The selected colour and Lucky Number MUST come from the already-generated stored result. No animation may reroll, reselect or expose the final percentage early.
- **FR-012**: A fixed external golden maple-leaf pointer and curved arm/spout MUST sit at approximately 7:30; the central decorative leaf MUST be a separate object that retracts after Start.
- **FR-013**: WebGL absence and context loss MUST fall back to a complete CSS composition built from gradients, clip-paths and layers, with no SVG.
- **FR-014**: The Milky Way background, external artwork, generation/daily behaviour, audio, accessibility and unrelated functionality MUST be preserved.
- **FR-015**: The production build MUST remain strictly below 495 MiB.
- **FR-016**: All affected Vitest suites, the type check, the build-size check and the browser suite MUST be updated to the new contract rather than weakened or bypassed.

## Key Entities

- **Meter Scene**: one Three.js scene with wheel, twelve chambers, central leaf, pointer/arm/spout, vessel, stream, beam and dust. Owns state; never selects a result.
- **Storyboard Clock**: `storyboard.js` is the single timing authority. New derived constants: `PERCENTAGE_START_MS = 1900`, `WHEEL_END_MS = 6300`, `PERCENTAGE_END_MS = 11300`, `POUR_END_MS = 13300`, `NUMBER_PAUSE_END_MS = 14800`, `REVEAL_COMPLETE_MS = 16300`.
- **Stored Daily Result**: percentage 5–100, Lucky Number 1–50, seasonal colour, Spark, tier/event derived from percentage only.
- **Stage Surface**: one canvas plus DOM readout, colour caption, test hooks and CSS fallback.

## Success Criteria *(mandatory)*

- **SC-001**: The meter contains zero SVG elements and one canvas in both READY and FINISHED.
- **SC-002**: The derived boundaries equal 1,900 / 6,300 / 11,300 / 13,300 / 14,800 / 16,300 ms; the spin is five turns over 4,400 ms and lands exactly on the stored colour.
- **SC-003**: The selected chamber is the only one that drains; the vessel reads 1.000 from 13,300 ms onward.
- **SC-004**: The exact tier sentence is visible during the celebration and after the dock, with the 800 ms settle replacing the fade.
- **SC-005**: Every preserved later stage keeps its approved length and the celebration stays 12,000 ms for every tier.
- **SC-006**: WebGL-denied and reduced-motion runs remain complete and usable; a context loss and restore returns to the scene.
- **SC-007**: `tsc --noEmit`, affected Vitest suites, the build-size check and the browser suite pass, with any environment limitation reported honestly.
- **SC-008**: The production build is below 495 MiB.

## Assumptions and limitations

- There is no attached reference image or PDF in the workspace; the composition follows the owner's written contract for the 7:30 pointer, arm, spout and receiving vessel.
- This environment has no hardware GPU and no A17-class mobile device. Software-rendered desktop and mobile browser results are proxies for device visual QA.
- No later stage is shortened or stretched to force a total; the shorter total is emergent from the corrected reveal.
