# Feature Specification: Device Capability and Observability

**Feature Branch**: `215-device-capability-observability`

**Created**: 2026-11-24

**Status**: Approved for implementation

**Input**: Owner request: centralize site-wide device capability detection, separate device capability from screen resolution, and add observational measured-performance monitoring without implementing automatic adaptive quality changes.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - One Device Assessment for Every Page (Priority: P1)

A visitor loads any page that renders a canvas, WebGL scene or the Lucky Meter. The site reads the browser's coarse hardware hints once, resolves one capability assessment, and every existing consumer uses that same assessment instead of repeating detection.

**Why this priority**: Repeated readers can disagree, and missing privacy-reduced hints must never be mistaken for a weak device.

**Independent Test**: Load a page with no canvas consumer and again with the Lucky Meter, then read the diagnostic surface. Both report the same cached assessment, and the hardware hints are read once per page.

**Acceptance Scenarios**:

1. **Given** a browser exposing 8 GB memory and 8 cores, **When** the page reads device capability more than once, **Then** both reads return the same `high` assessment and the browser hints are read only once.
2. **Given** a privacy-hardened browser that exposes neither memory nor core hints, **When** capability is assessed, **Then** the result is `balanced` with `confidence: none` and both signals listed as unknown, never `constrained`.
3. **Given** a browser exposing 2 GB memory, **When** capability is assessed, **Then** the result is `constrained` and the reason names low memory.

---

### User Story 2 - Capability Is Not Screen Resolution (Priority: P2)

A 4K desktop or a high-DPI phone is reported as a capable device even when its current backing store makes the existing render budget more conservative. The visitor and maintainer can see which factor limits the render budget without changing the current visuals.

**Why this priority**: Device class, display demand and render policy are different facts. Conflating them hides why a capable device receives a smaller budget.

**Independent Test**: Evaluate the documented device matrix. Capability, display demand and render quality are reported separately, and every render profile matches the pre-change output.

**Acceptance Scenarios**:

1. **Given** an 8 GB/8-core 4K desktop, **When** diagnostics are read, **Then** capability is `high`, display demand is `extreme`, the existing render tier remains `balanced`, and `limitedBy` includes `surface`.
2. **Given** an 8 GB/8-core phone with a coarse pointer and DPR 3, **When** diagnostics are read, **Then** capability is `high` and the existing render budget names `legacy-pointer-density`.
3. **Given** a capable 1080p desktop, **When** diagnostics are read, **Then** the render budget is `high` with no limiter.
4. **Given** Save-Data enabled on a capable device, **When** diagnostics are read, **Then** hardware capability remains `high` while the policy-limited render budget is `constrained`.

---

### User Story 3 - Observational Frame-Delivery Status (Priority: P3)

The site reports whether recent frame delivery is warming up, healthy, strained or critical. The report is diagnostic only: it never changes quality, cadence, resource loading or animation.

**Why this priority**: Any future decision to spend more or less rendering work needs evidence from real frame delivery first.

**Independent Test**: Drive the monitor with synthetic timestamps for healthy, strained and critical delivery, plus startup, hidden-tab, long-gap and viewport-change cases. Status follows the documented windows and hysteresis; no timer, frame loop or listener is added.

**Acceptance Scenarios**:

1. **Given** the page has just started, **When** samples are recorded during warm-up, **Then** status is `warming`, not `critical`.
2. **Given** a full measured window at roughly 60 fps, **When** the window completes, **Then** status becomes `healthy`.
3. **Given** sustained delivery near 30 fps, **When** the window completes and hysteresis elapses, **Then** status becomes `strained`.
4. **Given** sustained delivery below the critical threshold, **When** the window completes and hysteresis elapses, **Then** status becomes `critical`.
5. **Given** a hidden document or a long gap, **When** recording resumes, **Then** the window resets to `warming` instead of reporting the gap as sustained poor performance.
6. **Given** the viewport or DPR changes, **When** the next sample arrives, **Then** the monitor resets its window because the rendering target changed.

### Edge Cases

- `navigator.deviceMemory` and `navigator.hardwareConcurrency` may be absent, zero, non-numeric or privacy-reduced. Absence stays `null`.
- Only one hardware hint may be available. A known plentiful hint may establish high capability, but a missing hint is never treated as low.
- Save-Data is a transport policy, not a hardware capability. It must not lower the capability assessment.
- Display demand changes on resize, orientation change and DPR change; it is not cached with hardware.
- The page may be hidden, backgrounded or throttled during a cinematic. Those gaps must not become a false critical status.
- A single slow frame or a short fluctuation must not immediately change status.
- WebGL2 may be unavailable while WebGL1 works, or both may be unavailable. The feature report must describe what exists without reading vendor or renderer identity strings.
- Server rendering has no browser globals and must return permissive defaults without throwing.
- A canvas consumer may already depend on the exact existing render-quality fields; adding diagnostics must not change those values.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST expose one shared cached device assessment for the existing capability consumers, refreshed only at the adaptive plan's explicit reassessment boundary.
- **FR-002**: The assessment MUST include `capabilityTier` (`constrained`, `balanced` or `high`), `confidence` (`high`, `partial` or `none`), `unknownSignals`, the raw coarse memory/core values and human-readable reasons.
- **FR-003**: Known memory or core values at or below 2 MUST produce `constrained`. Missing signals MUST NOT produce `constrained`; a device with no hints MUST be `balanced` with `confidence: none`.
- **FR-004**: Existing `getGraphicsProfile()`, `getRenderQuality()` and adaptive `readDeviceState()` shapes MUST remain compatible and MUST delegate hardware reads to the one assessment.
- **FR-005**: The system MUST expose display demand separately from capability, derived from CSS viewport dimensions multiplied by device pixel ratio, with `light`, `moderate`, `heavy` and `extreme` bands.
- **FR-006**: The existing render-quality profiles and gates MUST remain byte-for-byte unchanged. Diagnostics MUST name the active limiter without removing or altering the 3 MP backing-store gate or the coarse-pointer DPR-3 gate.
- **FR-007**: The capability layer MUST expose one lazy WebGL feature report covering WebGL1, WebGL2 and scalar context limits, MUST release the probe context, and MUST NOT read vendor, renderer or unmasked identity strings.
- **FR-008**: The adaptive capability report MUST keep its exact existing `features` shape and MAY add separate `device`, `display`, `graphics`, `renderBudget` and `performance` fields.
- **FR-009**: The system MUST expose an observational frame monitor with `warming`, `healthy`, `strained` and `critical` statuses, a bounded measurement window, warm-up, gap/visibility/target resets and hysteresis.
- **FR-010**: The monitor MUST use frame timestamps supplied by existing render loops. It MUST NOT create a new animation frame loop, timer or event listener.
- **FR-011**: Monitor samples MUST be de-duplicated when several existing loops paint the same animation frame, so multiple loops do not inflate the measured rate.
- **FR-012**: Monitoring MUST be strictly observational. It MUST NOT change render quality, frame cadence, resource loading, artwork, effects, animation timings or the 12-second celebration.
- **FR-013**: Site-wide priming MUST continue through the existing root `ResourceReadiness` → adaptive plan → device-state chain. No new provider, preloader, renderer or tier vocabulary may be introduced.
- **FR-014**: All new readers MUST be safe on the server and with partial browser APIs; unsupported APIs return permissive defaults instead of throwing.
- **FR-015**: Rare fallback cases (no WebGL2, no hardware hints, hidden page, long gap, multiple frame loops) MUST have automated coverage.

### Key Entities

- **Device Assessment**: Cached hardware facts and the resulting capability classification. It is independent of viewport, network policy and render policy.
- **Display Demand**: Live viewport, pixel ratio, backing-pixel count and demand band. It describes the current surface, not the device class.
- **Render Budget Description**: The unchanged existing quality profile plus the gates that currently limit it and the factor names `surface` and `legacy-pointer-density`.
- **Performance Snapshot**: The monitor's current status, measured rate, frame-time percentiles, sample count, warm-up remainder, reset reason and target surface.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A page reuses one assessment across capability consumers. The hardware hints are read when the assessment is created and when the adaptive plan explicitly reassesses, never by each consumer or each frame.
- **SC-002**: The documented device matrix produces unchanged render-quality profiles before and after the change, including max pixel ratio, particle scale, foreground, haze and spark budget.
- **SC-003**: Every tested capable high-resolution device reports `capabilityTier: high` while its render limiter is a named surface or input gate, not a mislabelled hardware class.
- **SC-004**: Missing hardware hints produce `balanced` with `confidence: none` in 100% of tested privacy-hardened profiles.
- **SC-005**: The monitor reports `warming` during the warm-up window and reaches the expected status for synthetic 60 fps, 30 fps and below-critical delivery.
- **SC-006**: No new animation frame loop, timer or event listener is present in the observational monitor.
- **SC-007**: Existing graphics, adaptive-performance and meter tests continue to pass, and the production build remains strictly below 495 MiB.

## Assumptions

- `deviceMemory` remains Chromium-only and coarse, and `hardwareConcurrency` may be privacy-reduced. Their absence is not evidence of weakness. The cached assessment is refreshed at the adaptive plan's existing reassessment boundary so a changed hint can recover.
- The existing render-budget gates stay in place for this feature. Removing them is deferred to the separate adaptive-rendering work, pending measured evidence.
- The monitor's thresholds are provisional until physical-device evidence exists; changing them is a diagnostic change, not an adaptive one.
- No new dependency is required. The work stays inside the existing capability, adaptive and graphics modules.
- The VM has no hardware GPU and no physical mobile browser, so measured hardware performance is not claimed.
