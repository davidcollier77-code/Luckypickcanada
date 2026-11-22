# Feature Specification: Resource-readiness safety limits

**Feature Branch**: `210-resource-safety-limits`

**Created**: 2026-11-22

**Status**: Implemented

**Input**: Owner request: "Switch to Build and create Spec 210, but start with the safety fixes only: capacity accounting, queue caps, pin/lease protection and real disposal, with tests. Do not add the two-container handover until a current experience actually consumes a prepared payload."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Preparation stays inside a bounded budget (Priority: P1)

A visitor browses several experiences while the site speculatively prepares likely next ones. The preparation system counts the size of everything it keeps, stops admitting work beyond its entry, weight and queue budgets, prioritises the page the visitor is on, and never lets speculative preparation grow without limit.

**Why this priority**: the hub currently prepares honestly but has no upper bound. A long visit, several registrations or an unmeasured resource can accumulate retained records and queued jobs indefinitely, which risks memory pressure on constrained phones.

**Independent Test**: register more background resources than a constrained device allows, prepare them all, and confirm the retained-record, retained-weight and queue counts stay within their published limits, that refused work reports `skipped` instead of starting, and that committed work still runs.

**Acceptance Scenarios**:

1. **Given** a constrained device and more speculative resources than the queue allows, **When** all are requested at background priority, **Then** no more than the queue limit wait and every other resource reports `skipped` with a capacity reason.
2. **Given** a full queue of speculative work, **When** the on-screen experience requests a committed resource, **Then** queued speculative work is shed before committed work and the committed resource is prepared.
3. **Given** a resource whose declared or estimated weight exceeds the resident budget, **When** it is requested, **Then** no adapter runs, the resource reports `skipped`, and the retained-weight total stays at zero.
4. **Given** a refused speculative resource, **When** the visitor later commits to that experience, **Then** the request is evaluated again instead of being cached as permanently skipped.

---

### User Story 2 - Active experiences keep ownership of what they use (Priority: P2)

While a reveal, cinematic or paid animation is on screen, the resources it is using cannot be released, evicted, disposed or replaced by a version change. When the experience ends, anything it no longer needs is released immediately.

**Why this priority**: the safety limits above make eviction and pressure release real. Without ownership, a memory-pressure sweep or a capacity decision could dispose a texture an active experience is still displaying.

**Independent Test**: prepare a disposable resource, lease it, attempt an explicit release, a pressure release and a version change, and confirm the payload survives and is not disposed until the lease ends, at which point it is disposed exactly once.

**Acceptance Scenarios**:

1. **Given** a leased resource, **When** an explicit release or the shared memory-pressure release runs, **Then** the resource is retained, the release reports zero, and its disposal callback is not called.
2. **Given** a leased resource and a new registration version, **When** the version changes, **Then** the old record is retired rather than disposed, and it is disposed only when the last lease ends.
3. **Given** an active experience named by its registered id, **When** it begins, **Then** its prepared resources are leased automatically for the active period and released when it ends.
4. **Given** a lease that is released twice, **When** the second release runs, **Then** ownership counts do not go negative and nothing is disposed twice.

---

### User Story 3 - Released resources are actually freed (Priority: P3)

When the preparation system drops a record because of release, pressure, eviction, a version change or a reset, any payload it owns is disposed immediately. Payloads owned by another system — the existing audio layer, the router or an evaluated engine module — are never disposed by the hub.

**Why this priority**: the texture adapter has always returned an explicit `dispose()`, but the hub never called it. Bound capacity without real disposal would bound bookkeeping while leaking decoded bitmaps.

**Independent Test**: prepare an owned payload with a disposal spy, release it through each path, and confirm exactly one disposal; prepare a delegated audio payload and confirm its disposal callback is never called.

**Acceptance Scenarios**:

1. **Given** a texture record, **When** it is released, evicted or replaced by a version change, **Then** its `dispose()` runs exactly once.
2. **Given** a hub-owned decoded image, **When** its record is released, **Then** the hub clears its source so the decoded bitmap can be collected.
3. **Given** an audio, route or engine-module payload, **When** its record is released, **Then** the hub drops only its own reference and never disposes the other owner's object.
4. **Given** settled records, **When** the test reset runs, **Then** every owned payload is disposed before state is cleared.

---

### Edge Cases

- A definition repeats a resource identity: validation rejects it before admission, so no duplicate record or request is created.
- Every retained record is leased and a committed resource still needs capacity: the committed request reports an honest capacity skip; nothing leased is disposed.
- The adaptive tier changes while work is queued: the next admission uses the new tier's budgets; already-retained records are not destroyed merely because the budget shrank, and new work is deferred until capacity is available.
- A lease is acquired before its resources are prepared: the resources are pinned when their records are created, so a release between preparation and consumption cannot dispose them.
- A leased resource is released while still preparing: it is not deleted mid-flight; it retires when it settles if the lease has ended, or when the lease ends if it is still owned.
- A released or pressure-retired record is requested again before its last lease ends: the still-valid payload is revived for the new consumer instead of being swept and disposed underneath it.
- A version change lands while the old record is still leased or preparing: a request for the replacement is deferred with an honest reason until the old record is released and disposed, so the old payload is never reused or overwritten.
- No `window` exists (server rendering): leasing, statistics and preparation remain safe no-ops, and no disposal or adapter call occurs.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Every prepared record MUST carry a byte weight: the resource's declared `bytes` when positive, otherwise a documented conservative estimate for its kind.
- **FR-002**: The hub MUST enforce, per adaptive tier, a maximum retained-record count, a maximum retained-weight total, a maximum queue depth and a maximum pending speculative count per experience.
- **FR-003**: Validation and duplicate-identity rejection MUST happen before any capacity decision, so invalid or duplicate entries never consume budget or start work.
- **FR-004**: Speculative (background and intent) work that exceeds a budget MUST be deferred with an honest `skipped` state and a capacity reason, MUST NOT call its adapter, and MUST be re-evaluated on a later committed request rather than cached as permanently skipped.
- **FR-005**: Committed (critical) work MUST be admitted ahead of queued speculative work by shedding speculative jobs; in-flight work and leased records MUST never be shed or interrupted.
- **FR-006**: A committed request that cannot fit even after shedding and eviction MUST report an honest skip; the experience MUST continue with its existing partial availability and fallbacks rather than throwing.
- **FR-007**: Settled, unleased records MAY be evicted for higher-priority work, least valuable and least recently used first; leased records MUST NOT be evicted.
- **FR-008**: A lease API MUST pin every resource identity of a registered experience, MUST be counted per identity, MUST be idempotent on release, and MUST NOT allow ownership counts to go negative.
- **FR-009**: Release, pressure release and version replacement MUST NOT delete or dispose a leased record; they MUST retire it instead, and retirement MUST be completed as soon as the last lease ends and the record is settled.
- **FR-010**: Dropping a record through release, pressure release, eviction, version replacement or reset MUST dispose a payload the hub owns: call a result's `dispose()` when present, or clear a hub-created image source.
- **FR-011**: The hub MUST NOT dispose delegated payloads of kind `audio`, `code` or `module`; it may only drop its own reference to them.
- **FR-012**: The hub MUST expose a payload-free diagnostic of retained entries, retained weight, queue depth, running jobs, leases, pinned and retired records, and the active tier's limits.
- **FR-013**: An active experience whose label is a registered experience id MUST lease that experience's resources for the active period and release the lease when the period ends.
- **FR-014**: Disposal MUST be best effort and MUST NEVER throw into preparation, rendering, release or reset.
- **FR-015**: This change MUST NOT add the proposed two-container handover state machine, a second preloader, a second adaptive policy, or any payload consumer. The existing public readiness contract, visuals, audio, timing, layout and fallbacks MUST remain unchanged.
- **FR-016**: Every new limit and path MUST be covered by automated tests in the existing readiness suite.

### Key Entities

- **Resource record**: one prepared identity, with kind, label, state, attempts, byte weight, owning experience, priority, last access and an optional owned payload.
- **Admission decision**: admitted, deferred (`skipped` with a reason), shed or evicted; determined from the tier budget and the requesting priority.
- **Lease**: a counted ownership of one registered experience's resource identities for the duration of active use.
- **Pool diagnostic**: retained entries and weight, queue and running counts, leases, pinned and retired records, and the current limits.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: On a constrained profile, requesting 24 unique background resources retains at most 16 records, at most 8 MiB of accounted weight and at most 8 queued jobs, and calls the adapter only for admitted work.
- **SC-002**: A committed request at a full speculative queue completes successfully, with at least one speculative job reporting `capacity-shed`.
- **SC-003**: A leased record survives an explicit release, a pressure release and a version replacement with zero disposal calls, then produces exactly one disposal when the lease ends.
- **SC-004**: Every owned payload is disposed exactly once across release, eviction, version replacement and reset; no delegated audio payload is ever disposed.
- **SC-005**: The existing readiness, manifest, image-identity and mount suites continue to pass unchanged, and the production build remains strictly below 495 MiB.
- **SC-006**: A resource that cannot fit reports `skipped` without an adapter call and without an unhandled rejection or thrown error.

## Assumptions

- The declared `bytes` values in the manifest are compressed asset sizes, so the retained-weight budget is an accounting budget rather than an exact measure of decoded memory. Unknown resources are charged a conservative per-kind estimate so an unmeasured adapter cannot silently bypass the budget.
- The adaptive plan remains the only source of device tier and concurrency; this feature adds no probe, subscription or timer.
- Experiences still consume readiness metadata only. Leases are therefore an exported contract plus automatic leasing when an active experience names its registered id; no current experience is forced to adopt a payload.
- The two-container alternating handover remains a later feature and is deliberately out of scope until a current experience consumes a prepared payload.
- The browser's HTTP cache remains outside the hub's ownership and is never accounted or disposed.
