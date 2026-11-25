# Feature Specification: Lucky Meter Reveal Hand-off and Mobile Delivery

**Feature Branch**: `217-lucky-meter-reveal-delivery`

**Created**: 2026-11-24

**Status**: Implemented under owner approval and merged through PR #2033 into `main` at `2026-11-25T00:38:11Z` (2026-11-24 20:38:11 Atlantic). Merge commit: `ae844b4902a387cde508a4d1a312c9a535ad29ff`. Physical-device GPU verification (SC-006) remains outstanding.

**Input**: Owner request: "Use the Phase 0 evidence in `artifacts/lucky-meter-performance-20261124` to specify and plan Spec 217 for the Lucky Meter reveal and mobile delivery." Phase 0 evidence is the comparison record: the largest load task is the first compositor commit after the CSS fallback is removed, and 2,889 KiB of optional audio (76 % of the page) downloads before the visitor presses Start.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - The meter takes over smoothly, without a long stall (Priority: P1)

A visitor opens the Lucky Meter page on a phone. The complete CSS meter is already on screen. Once the 3D meter has actually produced a frame, it takes over with the same gentle fade the site uses today — but the fade lasts only as long as it usefully needs to, rather than adding a fixed burst of extra composited frames after the hand-off.

**Why this priority**: Phase 0 attributes the page's largest task to this hand-off. Measurement for this feature shows the fade runs *after* that task, at 4 composited frames for 600 ms, 2 for 300 ms and 1 for 150 ms. Shortening the fade therefore cannot fix the main stall, but it can remove avoidable post-stall work on constrained devices while keeping the transition the visitor recognises.

**Independent Test**: Load the page in the browser harness and observe the hand-off. The CSS meter is present before it, the incoming meter appears through a single opacity fade of the decided duration, and no second reveal animation runs. A slow-renderer case keeps the CSS meter instead of showing a blank or partial 3D stage.

**Acceptance Scenarios**:

1. **Given** the CSS meter is visible and the 3D renderer reports a produced frame, **When** the hand-off happens, **Then** the 3D meter appears through one opacity fade of the decided duration, with no additional reveal animation and no abrupt cut.
2. **Given** the 3D renderer has not produced a frame, **When** the readiness delay elapses, **Then** the CSS meter stays visible and no blank or partially drawn 3D stage is revealed.
3. **Given** the 3D renderer never produces a frame within the bounded wait, **When** the wait expires, **Then** the page keeps the complete CSS meter and does not reveal an empty canvas.
4. **Given** the visitor prefers reduced motion, **When** the hand-off happens, **Then** it is still a single step and introduces no new animation.
5. **Given** the 3D context is lost after the hand-off, **Then** the complete CSS meter returns as it does today, and a restored context returns to the 3D meter.

---

### User Story 2 - Optional celebration audio waits for a committed visit (Priority: P1)

A visitor lands on the Lucky Meter page and reads it without pressing Start. The page downloads only the cues needed to begin the ritual; the celebration sound set is not transferred. When the visitor presses Start, the remaining cues load during the ritual, each before it is needed, so nothing is missing or late.

**Why this priority**: Optional audio is 2,889 KiB of a 3,817 KiB cold load (76 %). Most of that is celebration sound that can never play unless the visitor starts, and on mobile data it is spent before any interaction. Phase 0 records all twelve files being requested 3.0–5.4 s after load with no Start press.

**Independent Test**: Cold-load the page without starting and record audio requests. Only the opening cues are present. Press Start and confirm the remaining cues are requested, then confirm every scheduled cue still has its sound when its moment arrives.

**Acceptance Scenarios**:

1. **Given** a cold load with no activation, **When** the page settles, **Then** only the opening cue files have been requested and the celebration cue files have not.
2. **Given** the visitor presses Start, **When** the opening cue fires, **Then** its sound is ready and plays as it does today.
3. **Given** the visitor presses Start, **When** a celebration cue's scheduled moment arrives, **Then** its file was requested after activation and has had time to load before that moment.
4. **Given** audio is blocked, unavailable or fails to load, **Then** the reveal continues silently exactly as today.
5. **Given** the adaptive plan defers speculative audio (Save-Data or a slow connection), **Then** the page still requests no celebration audio before activation.

---

### User Story 3 - No collateral change, and honest evidence (Priority: P2)

A maintainer reviews the change against the Phase 0 record: the composition, palette, layout, storyboard timings, celebration, fallback and audio mix are untouched; the hand-off and the pre-Start payload are the only intended differences; and the measurement limits of a software-rendered environment are stated rather than hidden.

**Why this priority**: The meter is a crafted cinematic. A performance change that alters its look or timing is not acceptable, and a claimed mobile improvement that was never measured on a GPU device would violate the repository's evidence rule.

**Independent Test**: Run the existing Lucky Meter browser and unit suites, compare state attributes and storyboard durations, and review the recorded before/after transfer and hand-off evidence.

**Acceptance Scenarios**:

1. **Given** the existing Lucky Meter browser suite, **When** it runs against the change, **Then** every composition, state, fallback and timing expectation still passes.
2. **Given** the Phase 0 probe run on the same cold mobile profile, **When** the change is measured, **Then** the pre-activation transfer and the hand-off behaviour match this specification's success criteria.
3. **Given** no hardware-GPU device is available, **When** results are reported, **Then** the device-dependent frame claim is marked outstanding instead of passed.

### Edge Cases

- WebGL unavailable, blocked or context lost: the complete CSS meter remains the permanent result; no blank stage.
- The first 3D frame is unusually slow: the CSS meter stays until a frame exists; the bounded wait decides when to stop waiting and keep the CSS meter.
- A frame is produced and then the context is lost before the hand-off: the fallback remains and no half-ready canvas is revealed.
- Reduced motion: the scene paints a static frame; the hand-off stays a single step.
- Save-Data or a measured slow connection: the existing plan already defers speculative audio; the change must not override it or delay the opening cue.
- Cached audio: measured pre-activation bytes are smaller on a warm cache; the success criteria use a cold context.
- High-DPI and low-DPI displays: the render tier, pixel ratio and backing store are unchanged; this feature does not alter render density.
- Screen readers and keyboard users: the canvas stays `aria-hidden`, the fallback stays hidden from assistive technology, and no new semantics, focus target or announcement is added.
- Audio failure after partial loading: the reveal is unaffected, and the existing warning behaviour is preserved.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The 3D meter MUST replace the CSS meter only after the 3D renderer has produced a frame; a readiness timer alone MUST NOT reveal the canvas.
- **FR-002**: The hand-off MUST keep the existing opacity fade. Its duration MAY be shortened only when measured evidence shows it reduces post-hand-off compositing without harming the transition; the fade MUST NOT be removed, replaced with an immediate cut, or lengthened.
- **FR-003**: The wait for a first frame MUST be bounded. When the bound expires without a frame, the page MUST keep the complete CSS meter and MUST NOT reveal an empty canvas.
- **FR-004**: The change MUST NOT alter scene composition, palette, lighting, pointer, chambers, vessel, pour, beam, layout, storyboard timings, celebration duration, reduced-motion behaviour or the CSS fallback's design.
- **FR-005**: Before activation, the page MUST request only the cue files required to begin the ritual. Celebration cue files MUST NOT be requested before activation.
- **FR-006**: After activation, every existing cue MUST remain available in the same shared sound set and MUST have its file requested before its scheduled moment; the cue map, mix, layering and volumes MUST stay unchanged.
- **FR-007**: Audio MUST remain optional. A blocked, unavailable or failed sound MUST NOT delay, block or break the reveal, and MUST preserve the existing diagnosable warning.
- **FR-008**: The feature MUST reuse the existing graphics surface, render-quality tiers, readiness hub and audio loader. It MUST NOT add a renderer, preloader, audio system, dependency, service, route or paid resource.
- **FR-009**: Render density MUST stay unchanged. The existing tier caps and gates, including the balanced 1.6 pixel-ratio cap measured on the deployed page, MUST remain in effect.
- **FR-010**: Server rendering MUST remain safe; no browser-only API may be required at module load.
- **FR-011**: The change MUST be measured with the Phase 0 harness on the same cold mobile profile, with production and localhost evidence kept separate, and the comparison recorded with the feature.
- **FR-012**: Automated coverage MUST include the hand-off ordering, the bounded wait, the no-animation contract, the pre-activation cue policy and the post-activation cue availability.
- **FR-013**: The production build MUST remain strictly below the 495 MiB limit.

### Key Entities

- **Reveal hand-off**: The single transition from the CSS meter to the 3D meter. It has a precondition (a produced frame), an ordering rule (remove and reveal together) and a failure result (stay on the CSS meter).
- **Opening cues**: The subset of the Lucky Meter sound set needed to begin the ritual; required before activation.
- **Celebration cues**: The remaining sounds used by the wheel, tier event and finale; required only after activation and before their scheduled moments.
- **Phase 0 record**: The baseline and attribution evidence in `artifacts/lucky-meter-performance-20261124`, including the corrected canvas measurement.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In a cold mobile lab load, the 3D layer is revealed by one opacity fade whose duration is the evidence-based decision (600 ms retained, or a shorter value down to a perceptible floor of 150 ms). The recorded run states the duration, the number of composited transition frames and the post-stall blocking, and no run uses a cut.
- **SC-002**: A cold mobile load without Start requests at most 650 KiB of audio, down from 2,889 KiB, and the page's total transfer is at most 1,650 KiB, down from 3,817 KiB.
- **SC-003**: After Start, all twelve cues are requested and no scheduled cue lacks its sound when its moment arrives; the cue map and mix are unchanged.
- **SC-004**: The existing Lucky Meter browser suite passes with unchanged composition, state, fallback and timing assertions, and the focused unit suites pass.
- **SC-005**: The production build stays strictly below 495 MiB with no new dependency.
- **SC-006**: On a device with hardware GPU compositing, the reveal hand-off produces no more than one long task and none longer than 500 ms. This criterion is verified on such a device or recorded as outstanding; the software-rendered lab host cannot establish it.
- **SC-007**: The recorded before/after evidence shows the hand-off and transfer outcomes above on the same cold mobile profile, and any host-specific compositing cost is reported separately rather than presented as fixed.

## Assumptions

- The Phase 0 numbers are the accepted baseline. Its original 3 MP canvas assumption is corrected by the measured 328×328 CSS, 524×524 buffer, 1.6 ratio and 0.27 MP backing store; no pixel-ratio or quality change is part of this feature.
- The 600 ms opacity transition on the canvas host is the only animation applied to the incoming 3D layer.
- The readiness hub's route-time audio preparation is what downloads the sound set before Start; the activation path already prepares audio on its own.
- Deferred celebration cues have several seconds of runway after activation before their first scheduled use, so loading them on demand does not delay a cue.
- The reveal keeps its fade. The default remains 600 ms; a shorter duration is adopted only if the measured post-hand-off work falls and the transition still reads as a fade. 600 ms is retained when the difference is not measurable, because keeping the existing experience is preferred.
- No hardware GPU and no physical phone are available in this workspace, so mobile frame-rate improvement remains provisional and must be verified on a real device.
- No commit, push, deployment or build is authorised by this specification; the build follows owner approval of the plan.
