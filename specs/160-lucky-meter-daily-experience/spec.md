# Feature Specification: Lucky Meter Daily Experience

**Feature Branch**: `freebuff/38a663e10f412e1b8cba2642`

**Created**: 2026-11-14

**Status**: Draft

**Input**: User description: "Transform the existing Lucky Meter into a complete daily experience with daily results, an unpredictable reveal and three events."

## Context

The existing `/lucky-meter` page (and its `isCompact` widget) renders `DailyResonance`,
an animated resonance reveal backed by ad-hoc Local Storage keys, a 0–100 random
percentage and three canvas effects. It has no event weighting, fixed Lucky
Numbers, colour or Little Spark, and its percentage can be zero. This feature
replaces the daily result, reveal choreography and event rendering while
preserving the Milky Way artwork, Lucky Pick Canada identity, Medallion Gold
palette, page routes, the shared local-midnight countdown and the existing total
ritual counter.

## User Scenarios & Testing *(mandatory)*

### User Story 1 — One independent daily result (Priority: P1)

A visitor opens the Luck Generator, reveals once, and receives one complete
reading for their local day: a percentage, tier, event, colour, fixed Lucky
Numbers and a Little Spark. Refreshing the page for the rest of the day shows
the same reading without replaying the reveal.

**Why this priority**: The daily result is the product. Without stable, complete
and repeatable data, the reveal and events have nothing trustworthy to present.

**Independent Test**: Reveal once, read the stored result, refresh, and compare
every field; then confirm the next reveal is blocked until local midnight.

**Acceptance Scenarios**:

1. **Given** no result for today, **When** the visitor reveals, **Then** the
   percentage is an integer from 5 to 100 and is not one of the last three
   persisted percentages.
2. **Given** a result exists for today, **When** the page is refreshed, **Then**
   the complete result is displayed and no new random result is generated.
3. **Given** the local date changes while the tab is open, **When** midnight
   passes, **Then** the meter returns to its unrevealed state and the next
   reveal creates a new day's result.

### User Story 2 — Unpredictable reveal (Priority: P2)

The visitor watches the number climb high, drop low and jump high again for 4.5
seconds. The real percentage is never visible early. It lands, flashes two or
three times, stays visible, and the remaining details appear in a deliberate
sequence before the event begins.

**Why this priority**: The reveal is the moment of delight and the reason the
daily result feels earned rather than fetched.

**Independent Test**: Observe a reveal and time each beat; confirm the real
number is absent until 4.5 seconds, the flash ends visible, details follow about
0.8 seconds later and the event starts about 0.6 seconds after that.

**Acceptance Scenarios**:

1. **Given** a reveal has started, **When** the first 4.5 seconds elapse, **Then**
   every preview value differs from the real percentage and stays within 5–100.
2. **Given** the animation lands, **When** the number flashes, **Then** it flashes
   2–3 times and remains visible.
3. **Given** the percentage and tier are visible, **When** 0.8 seconds pass,
   **Then** colour, numbers, Little Spark and event appear; 0.6 seconds later the
   event starts.

### User Story 3 — Three weighted cinematic events (Priority: P3)

The daily event is Meteor Shower (42%), Cosmic Lightning (38%) or Fireworks
(20%). It cannot occur three days in a row. Each event has its own build-up and
finale with GPU-rendered depth and light, and the result text stays readable.

**Why this priority**: The event turns the reading into a produced moment and is
the main visual payoff of the daily ritual.

**Independent Test**: Force many selections and inspect the weighting and repeat
guard; run each event and check its duration, choreography and clean fade-out.

**Acceptance Scenarios**:

1. **Given** the last two events are identical, **When** the next event is
   selected, **Then** it is chosen by weighted re-selection from the other events,
   not by a fixed rotation.
2. **Given** Meteor Shower is selected, **When** it runs, **Then** 12–16 meteors
   of varied depth appear and a dominant close meteor finishes the sequence in
   8.5–9.5 seconds.
3. **Given** Cosmic Lightning is selected, **When** it runs, **Then** 5–7
   branching strikes with cloud haze and light finish with a huge close strike in
   9.5–10.5 seconds.
4. **Given** Fireworks is selected, **When** it runs, **Then** 5–7 bursts use red
   and white only until a gold/amber layered finale with embers in 11–12 seconds.

### User Story 4 — Share the finished reading (Priority: P4)

The visitor can share the completed reading with the native share sheet. A
cancelled share copies nothing; the clipboard is used only when native sharing is
unavailable or fails.

**Independent Test**: Invoke Share with a mocked native sheet (resolve, cancel,
reject), then with no native sheet, and inspect calls and clipboard state.

**Acceptance Scenarios**:

1. **Given** native sharing is available, **When** Share is pressed, **Then** the
   native sheet receives the result text and URL.
2. **Given** the native sheet is cancelled, **When** it rejects with a
   cancellation, **Then** nothing is copied.
3. **Given** native sharing is missing or fails, **When** Share is pressed,
   **Then** the text is copied and the button confirms it.

### Edge Cases

- Local Storage is disabled, full or throws: the reveal still works for this
  visit; nothing is persisted and the page does not crash.
- Stored data is corrupt, the wrong schema version or internally inconsistent:
  it is discarded as a daily result, while valid recent history is retained.
- A result exists for a different date: it is never shown as today's result.
- Daylight-saving days of 23 or 25 hours: rollover follows the shared local
  midnight calculation, not a fixed 24-hour timer.
- A tab is hidden through midnight: the shared countdown store's date change
  resets the meter when it returns or when the interval next fires.
- The visitor prefers reduced motion: no scramble, flash or cinematic stage; the
  complete result is shown calmly.
- WebGL is unavailable or a shader fails to compile: a static glow replaces the
  event and the result remains complete; the UI never stays stuck.
- Share cancellation is not treated as a failure and never falls back to copy.
- The compact widget (300×250, scaled) keeps the result readable without
  changing its route.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST generate one complete daily result per local day
  containing percentage, tier, event, colour, Lucky Numbers and Little Spark.
- **FR-002**: The percentage MUST be an integer from 5 to 100 inclusive, never 0,
  and MUST avoid the last three persisted percentages.
- **FR-003**: Tiers MUST be low 5–39, medium 40–79 and high 80–100 with the exact
  supplied messages.
- **FR-004**: Event, colour and Little Spark MUST be selected independently of
  the percentage; the tier follows from the percentage by definition.
- **FR-005**: Event weights MUST be Meteor 42%, Lightning 38%, Fireworks 20%.
- **FR-006**: Three consecutive identical events MUST be prevented by weighted
  re-selection, not by rotation.
- **FR-007**: Lucky Numbers MUST be exactly Meteor 3/9/21, Lightning 11/22/33 and
  Fireworks 7/8/77, never randomised, never 13 and never duplicated.
- **FR-008**: The numbers MUST be labelled "Your Lucky Numbers" and accompanied
  by the entertainment-only disclaimer (no lottery predictions or promises of
  winning).
- **FR-009**: Colours MUST be chosen with equal probability from the twelve
  supplied names and hex values, and displayed with name and swatch.
- **FR-010**: Little Sparks MUST live in a separate editable data file with 30
  original motivational messages and unique ids, avoiding recent repeats.
- **FR-011**: Persistence MUST use Local Storage only and MUST store the date,
  complete result, last three percentages and recent event/Spark history.
- **FR-012**: A refresh MUST retain the complete result for the rest of the local
  day without replaying the reveal.
- **FR-013**: The meter MUST roll over after local midnight, including in an open
  tab, and MUST follow DST correctly.
- **FR-014**: Storage failures MUST be handled without breaking the experience.
- **FR-015**: The local-midnight countdown MUST update independently of the
  reveal and event timers.
- **FR-016**: The reveal MUST animate unpredictable jumps for 4.5 seconds,
  climbing high, dropping low and jumping high again.
- **FR-017**: The real percentage MUST be hidden for the whole scramble and MUST
  differ from every preview value.
- **FR-018**: On landing, the real number MUST flash 2–3 times and then remain
  visible.
- **FR-019**: Percentage and tier MUST be revealed on landing; colour, numbers,
  Little Spark and event MUST appear after about 0.8 seconds; the event MUST
  start about 0.6 seconds later.
- **FR-020**: The Meteor Shower MUST use 12–16 depth-varied meteors and finish
  with a dominant close foreground meteor in 8.5–9.5 seconds.
- **FR-021**: Cosmic Lightning MUST use 5–7 branching strikes at varied depths,
  with clouds, haze and realistic light, finishing with a huge close strike in
  9.5–10.5 seconds.
- **FR-022**: Fireworks MUST use 5–7 realistic bursts; opening bursts are red and
  white only; the finale is an enormous gold/amber chrysanthemum or willow with
  layered particles, cascading trails and foreground embers in 11–12 seconds.
- **FR-023**: Every event MUST have a distinct build-up/finale and MUST fade and
  stop cleanly, leaving no overlay or animation loop running.
- **FR-024**: Rendering MUST use GPU acceleration, WebGL, particles and shaders
  for depth, lighting and motion, with lower particle budgets on small screens.
- **FR-025**: The existing Milky Way background MUST NOT be altered, replaced,
  covered, dimmed or repositioned by the effects.
- **FR-026**: The result MUST show percentage, tier, event, Lucky Numbers, colour,
  Little Spark, "Share My Resonance" and the local-midnight countdown.
- **FR-027**: Sharing MUST prefer the native share sheet; cancellation MUST NOT
  copy; the clipboard is allowed only when sharing is unavailable or fails.
- **FR-028**: The experience MUST adapt to mobile and desktop and keep content
  readable.
- **FR-029**: Reduced motion MUST be respected and all timers, listeners,
  particles and overlays MUST be cleaned up.
- **FR-030**: No audio or sound effects may be added by this visual mission; the
  existing artwork, routes, identity, palette and unrelated functionality MUST be
  preserved.

### Key Entities

- **Daily result**: The immutable record for one local date, with percentage,
  tier, event, colour, Spark and the event's fixed numbers.
- **Recent history**: The last three percentages, recent event ids and recent
  Spark ids used to avoid repeats.
- **Event definition**: Weight, duration window, fixed numbers and accent.
- **Colour definition**: Name and exact hex.
- **Little Spark**: Stable id and short motivational message.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of generated percentages fall within 5–100 and never match any
  of the last three values.
- **SC-002**: Over 30,000 draws, event frequencies match 42/38/20 within 1
  percentage point and no three-peat occurs.
- **SC-003**: Every event's duration stays inside its documented window.
- **SC-004**: The real percentage is never rendered during the 4.5-second
  scramble; details and event start at the specified beats.
- **SC-005**: A refresh restores every field of today's result; a date change in
  an open tab resets the meter.
- **SC-006**: Share cancellation performs zero clipboard writes.
- **SC-007**: Unit and component tests, the type check, `./freebuff-verify.sh` and
  the production build all pass, with the build below the 495 MiB cap.

## Assumptions

- The daily result is per browser profile, not per account; Local Storage is the
  only store and no daily result is transmitted to a server.
- The reveal begins from the existing "Reveal My Resonance" action, so the
  visitor opts into the cinematic moment.
- The existing total-ritual counter and return-home link remain as they are.
- The established Howler sound cues may continue to play; this mission adds no
  new audio design.
- Browser support targets the project's current Next.js/Cloudflare baseline with
  WebGL as progressive enhancement.
