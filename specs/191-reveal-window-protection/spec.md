# Feature Specification: Protect the Complete Reveal Window

**Feature Branch**: `perf/reveal-window-protection`

**Created**: 2026-11-18

**Status**: Implemented

**Input**: Owner request, performance improvement 5 of 5: protect the Lucky Meter reveal from competing background
work beginning at the activation press, not only when `stageActive` becomes true. The audit identified an
8.3-second protection gap, with background work starting 975 ms after the reveal press.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - The hold starts at the press (Priority: P1)

A visitor presses "Reveal My Resonance". The hub's foreground hold is taken in that same event handler, so the
spin pre-roll (held breath, three settles, event delay) runs with the same protection the cinematic already had.

**Why this priority**: The pre-roll is the longest and most timing-sensitive part of the reveal, and it was
unprotected for ~8.3 seconds.

**Independent Test**: Render the real component against the real hub, press Start without advancing timers,
and check that an active experience is held before the stage exists.

**Acceptance Scenarios**:

1. **Given** the welcome state, **When** the visitor presses Start, **Then** the hub is held immediately and no
   background preparation starts.
2. **Given** the pre-roll, **When** 5 seconds pass, **Then** the hold is still in place and the stage has not
   started.
3. **Given** a refresh mid-reveal or mid-cinematic, **When** the component resumes, **Then** the hold is taken
   before the first resumed animation frame.

---

### User Story 2 - The hold ends with the reveal (Priority: P1)

The hold is released when the cinematic completes, when the component unmounts, or after a bounded safety
margin if completion never arrives, so queued background work resumes promptly.

**Why this priority**: Protection must not become starvation.

**Independent Test**: Complete, unmount and time-out each reveal path and observe that queued background work
runs afterwards.

**Acceptance Scenarios**:

1. **Given** an active reveal, **When** the stage completes, **Then** the hub is free and the queued background
   job runs.
2. **Given** an active reveal, **When** the visitor navigates away, **Then** the hub is free.
3. **Given** a stage that never reports completion, **When** the safety margin elapses, **Then** the hub is
   free.
4. **Given** an active reveal, **When** critical or intent work is requested for a non-background resource,
   **Then** it still runs.
5. **Given** an active reveal, **When** a `background: true` resource is requested at critical priority (the
   post-settle route warm-up), **Then** it waits and runs after the reveal completes.

---

### Edge Cases

- Reduced motion has no pre-roll or cinematic, so no hold is taken and nothing has to be released.
- A second press while a hold exists must not take a second hold (idempotent).
- The safety margin must be long enough for the pre-roll plus the longest documented event, and bounded.
- Unmount during the pre-roll must clear the safety timer as well as release the hold.
- A released hold followed by a late stage completion must be a no-op.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The hold MUST be taken during the activation event handler, before any timer or state update can
  delay it.
- **FR-002**: The hold MUST cover the entire pre-roll and cinematic.
- **FR-003**: The hold MUST be released on cinematic completion, on unmount and by a bounded safety timer.
- **FR-004**: Taking the hold twice MUST NOT increment it twice; releasing twice MUST be safe.
- **FR-005**: Critical and intent preparation MUST continue during the hold, except for resources the
  definition itself marks `background: true` (route warm-up), which must never compete with a foreground
  experience.
- **FR-006**: Reveal timing, animations, audio, copy, persistence and the reduced-motion path MUST be
  unchanged.
- **FR-007**: The existing `stageActive` protection effect MUST be replaced by the press-time hold, not
  duplicated.

### Key Entities

- **Foreground hold**: the release function returned by `beginActiveExperience`.
- **Pre-roll**: `anticipationMs + colourSettleMs + eventDelayMs` = 8,320 ms from press to cinematic.
- **Safety margin**: cinematic duration plus a fixed slack, after which the hold is released.

## Success Criteria *(mandatory)*

### Measured Outcomes

- **SC-001**: An active experience is held at 0 ms after the press (previously only at ~8.3 s).
- **SC-002**: A queued background preparation does not start during the pre-roll and starts after completion.
- **SC-003**: The reveal's press-to-stage timing is unchanged at ~8.3 s in a production browser run.
- **SC-004**: Focused and full unit suites, the type check, `./freebuff-verify.sh` and the production build
  pass, and the build stays below 495 MiB.

## Assumptions

- `beginActiveExperience` is safe to call from an event handler; it only increments a counter and is already
  exported for exactly this purpose.
- Background preparation is the only work the hold pauses; critical and intent work is explicitly allowed by
  the hub.
- The persisted lifecycle marks (`revealCompleted`, `eventCompleted`) remain the source of truth for resume, so
  protection follows the same branches that already exist.
