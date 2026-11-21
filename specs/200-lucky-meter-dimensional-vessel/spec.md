# Feature Specification: Lucky Meter Three-Dimensional Vessel and Pour

**Feature Branch**: `freebuff/856a686c49f64f37f6ddb027`

**Created**: 2026-11-20

**Status**: Implemented — requirements partly superseded; verification/handoff record incomplete

**Input**: User description: "The colour pouring from the meter into the vessel must look convincing, dimensional and fully animated—not like a simple glowing streak. The Home button must appear in its usual top-right position when the page first opens. Hide it immediately when the visitor starts the reveal, then bring it back with the daily countdown after the sky-writing and final hold are complete. Do not show the countdown at the beginning."

> **Current authority (21 November 2026).** The approved Lucky Meter Living
> Requirements Outline and Approval Sheet supersede this spec's top-right Home
> dock, glyph-by-glyph Spark, fill-only vessel and full-vessel number timing.
> The current contract is the approved outline: cylindrical vessel, functional
> CSS fallback, progressive number reveal during the drain, last-row Home and
> countdown, path-traced Spark and one 12,000 ms celebration.
>
> **D12 (resolved 21 November 2026):** every celebration runs for 12,000 ms,
> including the same celebration restarted after a page refresh. An older stored
> duration does not re-time it. The saved percentage, Lucky Number, colour and
> tier remain unchanged.
>
> **Verification record.** T035–T037 record TypeScript, 23 focused tests and
> 105 files / 1,133 full-suite tests. T038–T041 and T052 remain unchecked and
> must not be reported as passed. No new checks were run for this documentation
> reconciliation.

## Context

The Lucky Meter already selects and persists one reading per local day, plays
three tier celebrations and organises its presentation into twelve storyboard
stages. Spec 199 delivered the sequence and the CSS vessel. This task raises the
vessel, the pour, the medallion face and the sky-written Spark to the
dimensional quality of the supplied storyboard, and corrects the Home and
countdown contract.

Selection, storage, tier thresholds and messages, seasonal palettes, the Milky
Way artwork, the medallion identity and the celebration engines are unchanged.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - A real glass vessel receives a real pour (Priority: P1)

After the colour selection settles, a thick-walled glass tumbler stands in the
scene with a gold rim. The selected colour leaves the meter as a curved,
rounded column, falls into the vessel and raises a rippling surface with a
meniscus. The glass refracts the shelf behind it; gold dust drifts around it.
The vessel fills, then drains through the approved 4.0 s window; the Lucky
Number reveals progressively during the drain and is fully visible when the
vessel is empty.

**Why this priority**: This is the request. A flat gradient bar was the largest
remaining gap between the implementation and the storyboard.

**Independent Test**: Start a reading and watch the pour stage. The vessel reads
as an object with wall thickness, the stream has a body and a highlight, and the
liquid surface moves.

**Acceptance Scenarios**:

1. **Given** the vessel stage is open, **When** the pour begins, **Then** the
   stream grows downward from above the vessel rather than appearing at once.
2. **Given** the pour is running, **When** the liquid rises, **Then** the free
   surface and meniscus follow the fill and the impact point ripples.
3. **Given** the pour has finished, **When** the result is held, **Then** the
   stream and droplet are gone, the vessel drains, and the empty vessel is held
   and highlighted.
4. **Given** a browser without WebGL, **When** the vessel stage opens, **Then**
   the CSS vessel presents the same stored colour and supports the open, fill
   and drain states.

### User Story 2 - The medallion reads as a struck coin (Priority: P1)

The seasonal wheel no longer covers the entire coin. The milled rim, the raised
bezel, the shadow groove and the broad lit gold face are visible around the
pigments, and the well is large enough for the reading and the Lucky Number.

**Why this priority**: The artwork existed but was hidden, so the centrepiece
read as a flat wheel rather than a medal.

**Independent Test**: Load `/lucky-meter` and inspect the meter. A band of gold
wider than the pigment band is visible, with a milled outer edge.

**Acceptance Scenarios**:

1. **Given** the meter is idle, **When** it paints, **Then** the gold face and
   its milled rim are visible around the wheel.
2. **Given** the reading is revealed, **When** the wheel is present, **Then**
   the Lucky Number still fits inside the recessed well.

### User Story 3 - Gold sky writing (Priority: P2)

The Little Spark is a single-stroke, path-traced gold line drawn by the
maple-leaf cursor with a comet trail. Words never break mid-word, and a fine
gold flourish completes the line.

**Why this priority**: The final message is the last thing the visitor reads and
should match the storyboard's calligraphic treatment.

**Acceptance Scenarios**:

1. **Given** the Spark is writing, **When** a word is partially revealed,
   **Then** the word stays on one line.
2. **Given** the Spark is complete, **When** it holds, **Then** the line, the
   flourish and the cursor-free script remain.

### User Story 4 - Home from the first frame, countdown only at the end (Priority: P1)

Home sits in the last row of the results panel as soon as the page opens.
Starting the reveal hides it immediately. It returns with the daily countdown
only after the Spark and the final hold are complete. The countdown is never
present at the beginning.

**Why this priority**: It is an explicit behavioural correction with existing
test coverage that must change.

**Acceptance Scenarios**:

1. **Given** a fresh visit, **When** the page paints, **Then** Home is visible
   and the countdown is absent.
2. **Given** the visitor presses Start, **When** the first stage begins,
   **Then** Home is gone.
3. **Given** the Spark is complete and the hold has passed, **When** the dock
   arrives, **Then** Home and the countdown appear together.
4. **Given** reduced motion, **When** Start is pressed, **Then** the completed
   reading and both dock controls appear without the cinematic.
5. **Given** the compact widget, **When** it renders, **Then** it never shows
   Home.

### User Story 5 - Preserved identity and fallbacks (Priority: P2)

The Milky Way, selection logic, palettes, thresholds, messages, celebration
engines and audio are unchanged; the approved reveal order is preserved. No
competing renderer, preloader or paid dependency is introduced, and the
production build stays below 495 MiB.

## Requirements *(mandatory)*

- **FR-001**: The colour MUST leave the meter as a curved three-dimensional
  stream with a body, a highlight and a splash, not a flat streak.
- **FR-002**: The vessel MUST be a thick-walled transparent vessel with depth,
  a gold rim and a contact shadow; it MUST fill continuously and then drain
  through the approved vessel sequence.
- **FR-003**: The vessel scene MUST be built through the shared creative
  toolkit and registered in the shared experience registry.
- **FR-004**: The CSS vessel MUST remain a first-paint and no-WebGL fallback,
  and MUST support the same cylindrical silhouette and open, fill and drain
  states.
- **FR-005**: The wheel band MUST be pulled inward so the medallion face, rim
  and well are visible.
- **FR-006**: The Spark MUST be a single-stroke, path-traced gold line drawn by
  the maple-leaf cursor, with a comet trail and whole-word wrapping.
- **FR-007**: Home MUST be visible in the last row of the results panel on first
  open and hidden from the moment the reveal starts until the dock.
- **FR-008**: The countdown MUST appear only with Home in the last row of the
  results panel after the Spark and hold.
- **FR-009**: Existing selection, result schema, tiers, messages, palettes and
  audio MUST be preserved; the approved stage order and 12,000 ms celebration
  duration MUST be used.
- **FR-010**: The production build MUST remain strictly below 495 MiB.

## Success Criteria

- A full reading shows the stream, the rising liquid, the drain, the empty
  vessel highlight and the gold Spark in order, on desktop and mobile.
- Every new or restarted celebration runs for 12,000 ms.
- The Home/countdown contract is covered by updated unit and Playwright tests.
- The full Vitest suite, TypeScript check, production build and the
  `lucky-meter-daily-resonance` Playwright spec pass.

## Out of Scope

- Changing selection, the stored reading schema, tier thresholds, messages or
  palettes.
- Replacing the medallion, wheel or celebration renderers.
- New audio recordings or dependencies.
- Deployment.
