# Feature Specification: HTML5 Audio Reactivity and Gemini Retirement QA

**Feature Branch**: `freebuff/25c1d4ae61eefff2a7a4cddb`

**Created**: 2026-11-19

**Status**: Implemented

**Input**: Owner instruction: make HTML5 audio cues compatible with the shared sound-reactive graphics system, and correct Visual QA's outdated expectations about intentionally removed Gemini documents.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - HTML5 cues drive sound-reactive visuals (Priority: P1)

A visual experience requests `reactiveAudio` while the site plays a Howler cue declared `html5: true` (the reveal sparkle, applause or confetti pop). Where the browser supports media-element capture, the cue's media element feeds the same shared analyser as the Web Audio mix, so lights, particles and numeric bindings react to it. Playback stays audible and unchanged.

**Why this priority**: The shared graphics layer documented HTML5 cues as permanently unanalysable, so one of the site's three existing reveal cues could never drive the effects it already supports.

**Independent Test**: Open the development Creative Workbench, create the Web Audio graph with one cue, then play only an HTML5 cue. The reported envelope level is above zero and `audio.html5Sources` is non-zero while no Web Audio cue is playing.

**Acceptance Scenarios**:

1. **Given** a running Howler `AudioContext` and a playing same-origin HTML5 cue, **When** the reactive envelope updates, **Then** the element is captured into the shared analyser and its level, bass, mids and highs are measured.
2. **Given** any HTML5 cue, **When** it is captured, **Then** it is connected to the context destination at unity before the analyser edge, so the cue remains audible exactly once and the analyser's silent branch does not silence it.
3. **Given** a browser without `createMediaElementSource`, a suspended context, a cross-origin element, or an element already captured by another owner, **When** the cue plays, **Then** playback is untouched, the analyser is not attached to it, and the envelope stays neutral without throwing.
4. **Given** reduced motion or a hidden page, **When** an HTML5 cue plays, **Then** no new capture or analysis work begins.

### User Story 2 - Visual QA validates Gemini retirement (Priority: P1)

A maintainer runs the Visual QA verification job after the Gemini API library sources were intentionally retired. The suite must assert that those documents are absent; it must not require a removed snapshot to exist.

**Why this priority**: `reviewer-retirement.test.ts` still required `.docs/deep-dive/_google-gemini_gemini-skills_gemini-api-dev.md`, so the full Vitest run in Visual QA fails on an intentionally retired document.

**Independent Test**: Run the two retirement suites; they pass on the current tree and fail if either Gemini document is restored or re-routed.

**Acceptance Scenarios**:

1. **Given** the retired Gemini API identifiers, **When** the retirement suites run, **Then** neither identifier appears in manifest groups, sources, inventory, SHA pins or `.freebuff/*` routing files.
2. **Given** every snapshot path those identifiers could occupy, **When** the suites run, **Then** each path is asserted absent.
3. **Given** the shared Gemini runner, Pullfrog key wiring and Oracle runtime integration, **When** the suites run, **Then** those unrelated protections remain asserted.

### Edge Cases

- Howler has not created its audio context yet (no Web Audio cue has played): the HTML5 cue keeps playing unanalysed and a later scan captures it once the context is running.
- A cue is still playing when the last reactive consumer disposes: its audible path is never disconnected; only the analyser edge is removed.
- The audio context is closed and rebuilt: captured elements are reconnected to the rebuilt analyser.
- Howler auto-suspends its context after inactivity: because capture reroutes the element into that context, automatic suspension is switched off once a cue is captured and a suspended or interrupted context is resumed while a captured cue is playing.
- Connecting the analysis edge fails after the audible path succeeded: the cue stays tracked and the edge is retried on the next scan or graph rebuild instead of being reported as analysed.
- The retired snapshots are absent while historical spec records still mention them: only the QA expectations change, not history.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The existing `app/lib/graphics/audio-reactivity.js` module MUST capture playing `html5: true` Howler cues into the shared analyser when the existing Howler context supports media-element capture.
- **FR-002**: Capture MUST use Howler's existing `AudioContext`; no new `AudioContext`, player, analyser or second audio implementation may be created.
- **FR-003**: A captured element MUST reach the context destination at unity and the analyser through the same source node, so audible playback is preserved exactly once.
- **FR-004**: Capture MUST be refused safely for an unsupported context, a non-running context, a cross-origin element or an already-owned element; the envelope MUST remain neutral and nothing may throw.
- **FR-005**: Releasing the shared analyser MUST NOT silence an HTML5 cue that is still playing.
- **FR-006**: The development workbench MUST expose a way to play a catalogue recording through Howler's HTML5 path and report capture/playback state for browser evidence.
- **FR-007**: Retirement tests MUST assert both Gemini API documents absent from every manifest index, every `.freebuff/*.md` agent routing file (including `sentinel.md`) and every snapshot location.
- **FR-008**: No retired Gemini document may be restored, recreated, regenerated or replaced.
- **FR-009**: Unrelated Gemini protections (Pullfrog key wiring, Oracle runtime integration, historical reviewer specs) MUST remain asserted.
- **FR-010**: The production build MUST remain strictly below 495 MiB.
- **FR-011**: A captured HTML5 cue MUST remain audible while Howler's context is idle: automatic suspension MUST be switched off once a cue is captured and a suspended or interrupted context MUST be resumed while a captured cue is playing.
- **FR-012**: A failed analysis edge MUST NOT mark the element as analysed; the edge MUST be retried without re-capturing the element.

## Success Criteria

- **SC-001**: Focused audio tests cover capture, audible-path ordering, de-duplication, fallbacks and HTML5 detection.
- **SC-002**: The retirement suites pass and fail if either Gemini document is restored.
- **SC-003**: A real Chromium run measures a non-zero envelope from an HTML5-only cue and reports its playback.
- **SC-004**: With media capture made unavailable, the same run shows neutral analysis, no page error and unchanged playback state.
- **SC-005**: `node scripts/test-refresh-docs.js` reports 48 passed, 0 failed, the full Vitest suite passes, `tsc --noEmit` exits 0 and the production build is below 495 MiB.
