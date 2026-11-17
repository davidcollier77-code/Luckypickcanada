# Feature Specification: Shared Adaptive Performance and Rendering System

**Feature Branch**: `freebuff/1716deb7870376472b3b3bb7`

**Created**: 2026-11-17

**Status**: Implemented

**Input**: Owner request: build a shared adaptive performance and rendering system that evaluates network
conditions, device capabilities and accessibility preferences through feature detection and sensible
fallbacks, manages resource loading, animation workload, rendering and memory, reassesses when conditions
change, preserves the complete existing experience, and adds tests across device and network profiles.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - A constrained device gets a stable experience without losing features (Priority: P1)

A visitor on a low-memory, two-core phone with Save-Data enabled opens the homepage. The ambient star and
aurora canvases keep rendering, but at a reduced frame rate and density that the device can sustain. Audio
is fetched when the visitor actually activates a sound instead of speculatively. Every section, control,
artwork and interaction is still present.

**Why this priority**: Instability and jank are the concrete harm the system exists to prevent, and a
constrained device is where that harm is most visible.

**Independent Test**: Resolve the plan with constrained hints, then drive the shared frame loop and audio
loaders with those hints. Confirm the frame rate and load policy change while every renderer still runs and
every sound still plays when forced.

**Acceptance Scenarios**:

1. **Given** Save-Data, two cores or two gigabytes of memory, **When** the plan is resolved, **Then** the
   tier is `constrained`, the frame rate is 30, and speculative audio and prefetch are deferred.
2. **Given** the same device, **When** the visitor activates a sound, **Then** the sound still loads and plays.
3. **Given** the same device, **When** the page is visible, **Then** every canvas animation still runs.

---

### User Story 2 - A capable device is never needlessly restricted (Priority: P1)

A visitor on a modern desktop with many cores and ample memory sees exactly the visuals and behaviour that
exist today: 60 fps animation, unchanged canvas resolution, unchanged artwork, hover prefetching and
preloaded audio.

**Why this priority**: The repository's standing rule is that performance work must not degrade capable
devices, and this is the regression risk of any adaptive layer.

**Independent Test**: Resolve the plan for a high-capability desktop profile and compare each budget with the
current behaviour; assert no visual, interaction or loading capability was reduced.

**Acceptance Scenarios**:

1. **Given** a device reporting 8+ cores and 8 GB with a fast measured connection, **When** the plan is
   resolved, **Then** the tier is `high`, the frame rate is 60, prefetch is allowed on hover and audio may
   preload speculatively.
2. **Given** a browser that exposes no memory, core or connection hints, **When** the plan is resolved,
   **Then** no budget is reduced.

---

### User Story 3 - Conditions change and the experience recovers (Priority: P2)

A visitor moves from a slow mobile connection to Wi-Fi, or closes a memory-heavy tab. The system reassesses
through one shared subscription and restores the fuller experience without a reload. If the page is hidden,
animation stops; when it is visible again, it resumes.

**Why this priority**: A one-way downgrade would turn temporary conditions into a permanent experience loss.

**Independent Test**: Subscribe, change the reported connection and visibility, trigger reassessment, and
assert the plan and the frame loop recover. Then unsubscribe and assert every listener and timer is gone.

**Acceptance Scenarios**:

1. **Given** a slow connection, **When** the network reports fast throughput, **Then** prefetch and audio
   policy return to their full values.
2. **Given** a hidden document, **When** the plan is resolved, **Then** the frame rate is paused and idle
   resources may be released; **When** the document is visible again, **Then** animation resumes.
3. **Given** an unsubscribed consumer, **When** the last unsubscribe runs, **Then** no shared listener, timer
   or poll remains.

---

### User Story 4 - Accessibility preferences are honoured without removing content (Priority: P2)

A visitor who prefers reduced motion gets static frames and no newly started ambient loops, while every
feature, panel and control remains available and usable.

**Why this priority**: Motion preference is a documented accessibility requirement and must never be traded
for performance or ignored by an adaptive system.

**Independent Test**: Resolve the plan with reduced motion, assert the animation budget is `minimal` and the
frame rate is paused, and assert all functional fields are unchanged.

**Acceptance Scenarios**:

1. **Given** `prefers-reduced-motion: reduce`, **When** the plan is resolved, **Then** no continuous
   animation is scheduled and the feature set is unchanged.

---

### Edge Cases

- The Network Information API is absent, prefixed or partially populated.
- `deviceMemory` or `hardwareConcurrency` is absent, zero or non-numeric.
- A connection reports a `4g` label with a measured 0.4 Mbps throughput; the measurement must win.
- A connection reports `slow-2g` but a measured 10 Mbps throughput; the measurement must win.
- No label claims 5G or 5G Advanced; those labels are never interpreted.
- `performance.memory` is absent (non-Chromium) or reports a ratio below the pressure threshold.
- Memory pressure clears: resources release once per episode and normal caching resumes.
- Multiple components subscribe: exactly one set of browser listeners exists.
- A subscriber throws: the remaining subscribers still receive the plan.
- A release callback throws: the remaining release callbacks still run.
- A page is hidden on a constrained device: idle audio is released and reloads on the next activation.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST read connection signals when available: effective type, downlink, round-trip
  time, Save-Data and connection-change events.
- **FR-002**: The system MUST classify connections from measured throughput and latency first, using labels
  only as a fallback, and MUST NOT infer 5G or 5G Advanced from any label.
- **FR-003**: The system MUST read device signals: viewport, pixel ratio, device memory, hardware
  concurrency, pointer type, reduced-motion preference, and browser graphics features.
- **FR-004**: The system MUST treat missing signals as capable and MUST NOT reduce any budget without a
  measured constraint or an explicit preference.
- **FR-005**: The system MUST resolve a single plan covering performance tier, frame-rate target, animation
  budget, prefetch policy, audio preload policy, image quality hint, parallel-request limit and resource
  release.
- **FR-006**: The system MUST reassess on connection change, visibility change, viewport change,
  reduced-motion change, online/offline transitions and supported heap pressure.
- **FR-007**: The system MUST share one set of listeners and timers across all consumers and MUST remove all
  of them when the last consumer unsubscribes.
- **FR-008**: The system MUST provide a frame governor that paints at 60 fps on capable devices, reduces to
  the plan's frame rate on constrained devices, stops when hidden or reduced-motion is preferred, and
  resumes when conditions improve.
- **FR-009**: Existing ambient canvas renderers MUST keep their artwork, density defaults, reduced-motion
  behaviour and fallbacks.
- **FR-010**: Link prefetching MUST remain functional and MUST defer to stronger intent or stop on measured
  slow connections and Save-Data, recovering when conditions improve.
- **FR-011**: Speculative audio loading MUST defer under constraint, and every sound MUST still load and play
  on the activation that needs it.
- **FR-012**: Under memory pressure or a hidden constrained page, registered idle resources MUST be released
  once per episode; releasing MUST NOT interrupt an active sound.
- **FR-013**: The system MUST NOT read or write cookies or browser storage for memory purposes.
- **FR-014**: The system MUST be server-safe: importing it on the server allocates nothing and starts no
  timers or listeners.
- **FR-015**: No Cloudflare, DNS, Pages, Workers, CDN, account, payment, database, authentication or secret
  configuration may change, and no paid service may be introduced.

### Key Entities

- **Network state**: supported flag, Save-Data, effective type, downlink in Mbps, round-trip time in ms.
- **Device state**: memory in GB, hardware concurrency, pixel ratio, viewport, reduced motion, coarse pointer.
- **Heap pressure**: supported flag, used/limit ratio, pressure boolean.
- **Adaptive plan**: tier, network class, save-data, visibility, frame rate, animation budget, prefetch
  policy, audio preload policy, image quality hint, parallel-request limit, release flag and reasons.
- **Capabilities report**: plan plus lazy Canvas 2D/WebGL/Path2D results and the existing render quality.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Every adaptation the system applies is attributable to a named signal in the plan's `reasons`;
  a profile with no restrictive signals yields zero reduced budgets.
- **SC-002**: Across low-, medium- and high-capability mobile and desktop profiles, animation scheduling
  matches the profile's budget: 60 fps for capable, 30 fps for constrained, paused for reduced motion.
- **SC-003**: A consumer that unsubscribes leaves zero adaptive listeners, intervals or pending debounce
  timers, verified by instrumentation.
- **SC-004**: Ten concurrent subscribers add exactly one set of shared listeners.
- **SC-005**: With a throttled 4x CPU profile in Chromium, the governed ambient canvas work uses less
  main-thread time per animated frame than the ungoverned baseline while retaining every renderer.
- **SC-006**: The existing unit suite and visual baselines pass unchanged, the production build stays below
  495 MiB, and no Cloudflare or hosting configuration file changes.

## Assumptions

- Browsers that hide device or network hints receive the full experience; the system prefers a false negative
  (no restriction) over a false positive (unnecessary degradation).
- The browser remains responsible for image candidate selection through the existing `srcset`/`sizes`
  ladders; the plan exposes an image-quality hint for future derivative selection without rewriting approved
  markup.
- Reduced motion is a user preference that outranks performance signals.
- Memory pressure is only detectable where `performance.memory` exists; elsewhere the system relies on
  coarse device memory hints.
