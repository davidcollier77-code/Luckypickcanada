# Feature Specification: Lucky Meter — Complete Visitor Experience

**Feature Branch**: `218-lucky-meter-complete-experience`

**Created**: 2026-11-25

**Status**: Implemented (production) — 2026-11-25

**Input**: Owner description: the complete Lucky Meter visitor experience, with two reference images establishing the starting and final appearances.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Arrive, start and lock the reading (Priority: P1)

A visitor opens the Lucky Meter. The existing Milky Way scene is already there. Golden maple leaves drift and blow away while a soft wind plays; the Start control stays hidden until the last leaf is gone, while Return to Home remains in the upper-right. The visitor presses Start My Lucky Meter. Start and Home disappear. The instrument and its two empty result destinations move down together, opening the sky above. The central maple medallion turns over to reveal the percentage display, the twelve chambers turn, and the wheel and percentage stop together on the stored result. The pointer identifies the selected chamber, and the percentage and tier label are presented in the gold-framed well.

**Why this priority**: This is the entry point and the moment the result becomes trustworthy. Without a clean arrival, a coordinated start and a simultaneous lock, the rest of the reveal has no stable result to tell.

**Independent Test**: Load the experience, wait for the leaves to clear, verify Start is unavailable before they do and Home is visible; press Start; verify both controls disappear, the instrument and both destinations move down together, the medallion opens, and the wheel and percentage stop on the same frame with the stored colour under the 7:30 pointer. No result may change after the lock.

**Acceptance Scenarios**:

1. **Given** the visitor arrives, **When** the leaves are still visible, **Then** Start is not visible or focusable, and Return to Home remains visible in its original upper-right position.
2. **Given** every leaf has disappeared, **When** the quiet beat ends, **Then** Start My Lucky Meter appears.
3. **Given** Start is pressed, **When** the press is accepted, **Then** Start and Home disappear immediately, and the meter, colour destination and number destination translate downward together without separating or changing scale.
4. **Given** the medallion is closed, **When** the opening turn runs, **Then** the percentage is concealed until the medallion has turned, and the percentage display is readable afterwards.
5. **Given** the wheel and percentage are running, **When** the result locks, **Then** both stop on the same frame, the stored percentage is shown for the first time, the pointer identifies the selected chamber, and nothing rotates or changes selection again.
6. **Given** the result is locked, **When** the presentation appears, **Then** the percentage and tier label are in the gold-framed well, and the exact temporary tier sentence appears above the instrument.

---

### User Story 2 - Watch the colour pour and the number transfer (Priority: P1)

After the lock, only the selected chamber drains. A luminous liquid matching the stored seasonal colour runs from that chamber into the curved gold spout and falls into the separate crystal receiving bowl. The bowl fills; the colour name appears beneath it. As the chamber empties, the Lucky Number emerges inside that chamber. Once fully revealed, the number is carried by a separate golden energy effect — light, particles and maple-leaf sparks — from the chamber to the permanent number display beside the bowl. The number travels continuously and never enters the colour bowl. The original chamber ends blank.

**Why this priority**: This is the heart of the new experience and the part the current implementation gets wrong: the number currently travels from the vessel to the wheel, and the colour and number are not presented as two separate destinations.

**Independent Test**: With a stored result, verify only the selected chamber drains; the bowl fills with the exact stored colour; the colour name appears beneath it; the number emerges inside the chamber; the golden transfer carries the number continuously to the separate number display; the chamber ends blank; the bowl remains full and untouched; no other chamber changes.

**Acceptance Scenarios**:

1. **Given** the result is locked, **When** the pour begins, **Then** only the selected chamber drains and the other eleven remain full.
2. **Given** the selected chamber is draining, **When** the liquid reaches the bowl, **Then** the bowl fills with the stored colour and the colour name appears beneath it.
3. **Given** the selected chamber is draining, **When** the liquid level falls, **Then** the Lucky Number emerges progressively inside that same chamber and never enters the spout or the bowl.
4. **Given** the bowl is full and the chamber is empty, **When** the transfer begins, **Then** a separate golden light-and-particle effect carries the number from the chamber to the number display.
5. **Given** the transfer is running, **When** the number moves, **Then** it remains visible continuously from beginning to arrival and does not disappear or reappear elsewhere.
6. **Given** the transfer is complete, **When** the visitor inspects the results, **Then** the original chamber is blank, the number is permanently in **Your Lucky Number**, the colour is permanently in its own bowl, and the two results are not combined.

---

### User Story 3 - Receive the celebration, the Spark and the finished controls (Priority: P1)

The temporary tier sentence disappears before the celebration. The existing percentage-selected celebration — Meteor Shower, Cosmic Lightning or Fireworks — runs in the open sky above the lowered instrument. Afterwards the existing saved Lucky Spark is written across the sky with a golden trail and maple-leaf treatment and remains visible. The finished experience shows the completed meter and percentage, the filled bowl and colour name, the separate number display, the Spark, a countdown in the upper-left, Return to Home in the upper-right, and a small Share control directly beneath Home. Start does not return.

**Why this priority**: The experience is not finished until the established celebration, the personal Spark and the final navigation controls are all present without obscuring each other.

**Independent Test**: Reach the finished state and verify the existing celebration matches the stored tier; the tier sentence is gone before it starts; the saved Spark is the stored Spark and remains visible; countdown, Home and Share appear together in their final positions; Start is absent; Share uses the existing share behavior.

**Acceptance Scenarios**:

1. **Given** the meter result is complete, **When** the temporary tier sentence is due to leave, **Then** it fades out and unmounts before the celebration's first frame.
2. **Given** the stored percentage is 66–100, **When** the celebration begins, **Then** the existing Fireworks stage runs; 31–65 runs Cosmic Lightning; 5–30 runs Meteor Shower.
3. **Given** the celebration has ended, **When** the Spark is written, **Then** the stored saved Spark is written character by character across the open sky and remains visible.
4. **Given** the experience is complete, **When** the visitor looks at the corners, **Then** the countdown is upper-left, Return to Home is upper-right, and Share is directly beneath Home and visually secondary.
5. **Given** the experience is complete, **When** the visitor uses Share or Home, **Then** the existing share and navigation behavior works, and Start is not present.

---

### User Story 4 - Use the experience comfortably on any screen (Priority: P2)

LuckyPickCanada is public-facing, so the Lucky Meter cannot assume a particular device. It must be mobile-first but fully responsive and compatible with phones, tablets, touch devices, laptops and desktop monitors, across different screen sizes, resolutions, pixel densities, browsers and hardware capabilities. Mobile remains the primary design target, but tablet and desktop visitors must receive an equally polished experience: the instrument adapts its proportions, positioning, readability and visual presentation to the available space without distortion, clipping or awkward scaling. Desktop hardware may enable richer effects where supported, but those effects must never compromise performance or visual quality on mobile.

**Why this priority**: A visually impressive reveal that clips, overlaps or pushes content off-screen fails on the majority device, and a phone layout merely enlarged on desktop is not an acceptable public experience.

**Independent Test**: Render the experience at 320×568, 360×640, 390×844, 412×915 and 430×932 phones; 820×1180 tablet portrait; 844×390 phone landscape; and 1440×900 desktop. Verify no horizontal scroll, no clipped result or control, no distortion of the circular instrument, no overlap between the Spark and the top controls, no control covering a result, and that the desktop presentation is deliberately composed rather than an enlarged phone layout.

**Acceptance Scenarios**:

1. **Given** a 320 px-wide phone, **When** the finished state is shown, **Then** the Spark remains readable and the countdown, Home and Share do not cover it or the results.
2. **Given** a short or landscape phone viewport, **When** the instrument moves down, **Then** the colour plaque and number display remain fully visible and the Start control is not clipped.
3. **Given** an 820×1180 tablet in portrait, **When** READY and FINISHED are shown, **Then** the whole instrument and both result destinations are visible with a safe margin, the wheel stays circular, and all result text remains readable and touch-operable.
4. **Given** a 1440×900 desktop viewport, **When** the experience is shown, **Then** the instrument remains a centred collectible composition that uses the available space deliberately, rather than an enlarged phone layout, with no clipping or distortion.
5. **Given** a device with a high pixel density or a different browser, **When** the experience is shown, **Then** the layout and result presentation remain stable and no horizontal scrolling or oversized canvas is introduced.
6. **Given** a lower-powered phone, **When** the experience runs, **Then** mobile visual quality and performance are not reduced by effects that exist only for desktop hardware.

---

### User Story 5 - Preserve the established result and accessibility behavior (Priority: P2)

The experience keeps the existing twelve seasonal colours and transition dates, percentage and number generation, tier mapping, stored daily result, saved Sparks and their selection, celebration effects and audio. It also keeps a complete no-WebGL fallback and a reduced-motion path that presents the result without the animation chain.

**Why this priority**: The redesign must not sacrifice the product's established behavior or exclude visitors whose device or preferences cannot run the full animation.

**Independent Test**: Compare stored results before and after the redesign; verify the same percentage, tier, colour and number are revealed; verify the saved Spark list and selection are unchanged; disable WebGL and verify the complete fallback; enable reduced motion and verify the finished result appears without the animation chain.

**Acceptance Scenarios**:

1. **Given** an existing stored result, **When** the experience is refreshed, **Then** the same percentage, tier, colour, number and Spark are shown; no new result is generated.
2. **Given** the twelve seasonal colours and transition dates, **When** the palette is read, **Then** the same colours, order and season boundaries are used.
3. **Given** a device without WebGL, **When** the experience loads, **Then** a complete readable fallback shows the instrument, bowl, percentage, colour and number.
4. **Given** reduced motion is requested, **When** Start is pressed, **Then** the completed result is presented without the wheel, pour, transfer or celebration animation.
5. **Given** the existing audio cannot play before a user gesture, **When** the opening runs, **Then** the experience continues silently without blocking Start or losing the result.

### Edge Cases

- A refresh during the reveal must resume from the stored result, never generate a new one.
- A stored result created before this redesign must remain readable.
- A long tier sentence must still leave the sky clear before the celebration.
- A long Spark must remain readable and must not overlap the top controls.
- A very short or landscape phone viewport must not clip the results or controls.
- A tablet in either orientation must not crop the instrument, the bowl, the number display or the Spark.
- A very wide or high-pixel-density display must not stretch the instrument or shrink the result text to an unreadable size.
- A low-powered or touch-only device must remain fully operable without hover, and must fall back gracefully if WebGL is unavailable or lost.
- A share cancellation must not copy to the clipboard; an unavailable share must show a compact failure state.
- A daily rollover while the page is open must clear the old result and return to the arrival state.
- A WebGL context loss must restore the complete fallback without losing the result.
- The temporary tier sentence must not remain over the sky during the celebration.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The experience MUST keep the existing Milky Way background, stars, Aurora and surrounding artwork visible and intact.
- **FR-002**: The experience MUST identify the feature as Lucky Meter, not Oracle.
- **FR-003**: Return to Home MUST be visible in the upper-right during the opening, disappear immediately when Start is pressed, remain hidden during the active reveal and celebration, and return to the same position when the experience is complete.
- **FR-004**: Start My Lucky Meter MUST remain hidden and unavailable until every opening leaf has completely disappeared.
- **FR-005**: The opening MUST include drifting golden/autumn maple leaves, a soft wind, and a complete clearing of the leaves before Start appears.
- **FR-006**: Pressing Start MUST hide Start and Home immediately and MUST NOT bring Start back.
- **FR-007**: The instrument and both result destinations MUST move downward together after Start, preserving their relative positions and spacing, without reflow, separation, scale change or camera change.
- **FR-008**: The central maple medallion MUST turn over in a visibly three-dimensional way to reveal the percentage display beneath it.
- **FR-009**: The twelve chambers MUST rotate during the generation, and the wheel and percentage display MUST stop together.
- **FR-010**: The stored percentage MUST NOT be revealed before the lock.
- **FR-011**: After the lock, the selected chamber, colour and Lucky Number MUST NOT change, and the wheel MUST NOT rotate again.
- **FR-012**: The fixed 7:30 pointer MUST identify the selected chamber.
- **FR-013**: The percentage and tier label MUST be presented in the gold-framed well after the lock.
- **FR-014**: The exact temporary tier sentence MUST appear immediately after the lock, remain readable, and disappear completely before the celebration begins.
- **FR-015**: Only the selected chamber MUST drain; the other eleven MUST remain full.
- **FR-016**: A luminous liquid matching the stored colour MUST travel from the selected chamber into the curved gold spout and fall into the crystal bowl.
- **FR-017**: The crystal bowl MUST fill with the stored colour and MUST remain full; the colour name MUST appear beneath it.
- **FR-018**: The Lucky Number MUST emerge progressively inside the selected chamber as its liquid falls, and MUST NOT enter the spout or the bowl.
- **FR-019**: After the pour, the selected chamber MUST be empty and the full Lucky Number MUST be visible inside it.
- **FR-020**: A separate golden energy effect MUST carry the number continuously from the chamber to a permanent number display beside the colour bowl; the number MUST NOT disappear and reappear.
- **FR-021**: The golden transfer MUST use light, particles and maple-leaf treatment, MUST remain visually distinct from the colour liquid, and MUST NOT obscure or enter the colour bowl.
- **FR-022**: When the transfer finishes, the original chamber MUST be blank, the number MUST be permanently in **Your Lucky Number**, and the colour MUST remain in its own bowl with its own name.
- **FR-023**: The existing percentage-selected celebration MUST run unchanged in the open sky after the temporary sentence has gone.
- **FR-024**: The existing saved Lucky Spark MUST be selected by the existing logic, written across the open sky with a golden trail and maple-leaf treatment, and remain visible.
- **FR-025**: The finished experience MUST show the completed meter and percentage, the filled bowl and colour name, the separate number display, the Spark, a countdown in the upper-left, Home in the upper-right, and a small secondary Share directly beneath Home.
- **FR-026**: The countdown, Home and Share MUST appear together at completion and MUST NOT overlap or obscure the Spark or any result.
- **FR-027**: The experience MUST keep the existing twelve seasonal colours, transition dates, percentage range, Lucky Number range, tier mapping, stored result, saved Sparks and Spark selection logic.
- **FR-028**: The experience MUST keep a complete no-WebGL/context-loss fallback and a reduced-motion path that presents the completed result without the animation chain.
- **FR-029**: The experience MUST be mobile-first and fully responsive from 320 px phones through tablets and desktop monitors, without horizontal scrolling, clipping, distortion, unwanted overlap or content being pushed out of view.
- **FR-030**: The experience MUST NOT add a red-and-gold status banner, status strip or other new banner across the top of the screen.
- **FR-031**: The experience MUST NOT add a second selection system, new randomness, a new Spark generator, a new celebration engine or a new dependency.
- **FR-032**: The instrument MUST look like a genuine three-dimensional gold object with depth, materials and lighting, not a flat illustration.
- **FR-033**: Tablet and desktop layouts MUST deliberately adapt the instrument's proportions, positioning, readability and visual presentation to the available space rather than scaling up the phone layout; the wheel MUST remain circular and every result destination MUST remain complete.
- **FR-034**: The experience MUST support touch and pointer input across phones, tablets and desktops, in portrait and landscape, with controls remaining reachable and operable at different resolutions and pixel densities.
- **FR-035**: Desktop hardware MAY receive richer effects only where capability supports them; such enhancements MUST NOT raise the mobile performance budget, degrade mobile visual quality, or be required to read the result.
- **FR-036**: Across supported browser and WebGL capabilities, including lower-powered hardware, the experience MUST preserve readable results, complete fallback behavior and graceful recovery from context loss.

### Key Entities

- **Daily Result**: The stored reading for one local day: date, percentage, tier, event, colour, Lucky Number, Spark and season.
- **Seasonal Colour**: One of the twelve established colours with its id, name, hex and season transition dates.
- **Tier and Event**: The percentage-derived tier and its established celebration.
- **Lucky Spark**: One of the existing saved Spark messages and its selection identity.
- **Destination**: The separate colour bowl and number display; each owns one result and they are never combined.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A visitor can complete the full experience from arrival to finished state without a dead end, missing control or blocked Start.
- **SC-002**: The wheel and percentage stop within one rendered frame of each other, and no wheel rotation occurs after the lock.
- **SC-003**: The temporary tier sentence is absent before the celebration's first frame in every tier.
- **SC-004**: Only one of the twelve chambers drains, and the colour bowl remains full at the end.
- **SC-005**: The number is visible continuously throughout its transfer and ends in the separate number display with the original chamber blank.
- **SC-006**: The complete experience reads clearly at 320, 360, 390, 412 and 430 px phone widths, at 820×1180 tablet portrait, at 844×390 phone landscape, and at 1440×900 desktop, with no overlap, clipping, distortion or horizontal scroll.
- **SC-007**: The existing stored result, seasonal palette, tier mapping and saved Spark selection are unchanged for the same stored record.
- **SC-008**: The no-WebGL fallback and reduced-motion path both present a complete, readable result.
- **SC-009**: The production build remains strictly below the repository's 495 MiB cap, with no new dependency.
- **SC-010**: READY and FINISHED captures at mobile 390×844, tablet 820×1180 and desktop 1440×900 can be compared directly with the reference images and with each other before full implementation.
- **SC-011**: Within the six development-prototype captures only, the tablet and desktop stages show the instrument with a circular wheel, undistorted proportions and visible safe margins, with no bowl, pointer or percentage cropped at the stage edge. This criterion demonstrates prototype camera framing; it does not establish production-route responsiveness, physical-device or cross-browser compatibility, or the placement of result plaques and controls, which remain covered by SC-006 and FR-033–FR-036 during production verification.
- **SC-012**: No desktop-only visual effect is required for mobile; the mobile prototype READY and FINISHED captures retain the approved crystal bowl, pointer and enamel quality, and the prototype adds no renderer, render target, transmission pass or dependency to the mobile path.

## Assumptions

- The existing Milky Way artwork is preserved; the reference's painted sky is a composition and material standard, not a background replacement.
- The current route has no top-right Home; the reference's upper-right position is the intended “original homepage position”.
- The existing percentage window, celebration and Spark durations are preserved; the wheel is extended to the percentage window so both stop together.
- The existing result storage key and shape remain compatible; a refresh never generates a new result.
- The opening wind is best-effort because browsers may block audio before a user gesture.
- The existing supporting copy, visits counter and disclaimer remain in the product below the cinematic frame.
- A development-only visual prototype of the instrument, bowl and medallion flip will be reviewed before the full implementation.
- Responsive requirements are demonstrated in the development prototype at representative phone, tablet and desktop stages. Those captures validate prototype framing, geometry and materials only; they do not establish production-route responsiveness or physical-device compatibility. The full production responsive matrix (SC-006, FR-033–FR-036) and the physical-device, high-DPR, touch, cross-browser and hardware-GPU checks remain part of post-approval verification, because this environment has no hardware GPU or physical devices.
- Desktop may add capability-gated richness later, but the mobile-first budget and the approved mobile visual quality are the floor, not a trade-off.
