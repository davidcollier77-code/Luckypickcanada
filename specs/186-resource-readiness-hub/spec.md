# Feature Specification: Site-Wide Resource-Readiness Hub

**Feature Branch**: `freebuff/df6965c97260bd2bd71121ef`

**Created**: 2026-11-18

**Status**: Implemented

**Input**: Owner request: extend the existing adaptive performance architecture with one lightweight,
site-wide resource-readiness hub for intelligent preloading, cache reuse and active-experience protection,
compatible with current and future optional renderers.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - The homepage stays fast and prepares only what is likely next (Priority: P1)

A visitor opens the homepage on a capable phone. The hero artwork, header and first section paint without
waiting for any speculative work. Once the page has loaded and the browser is idle, a small, ordered set of
likely next experiences has its first images and route bundle prepared. On a Save-Data or slow connection
nothing speculative runs.

**Why this priority**: The homepage is the entry point and its critical content must never compete with
preparation for a different page.

**Independent Test**: Resolve a capable, moderate and Save-Data profile; drive the homepage idle scheduler;
assert that capable prepares at most three ordered experiences, constrained at most one, and Save-Data none.

**Acceptance Scenarios**:

1. **Given** a capable connection, **When** the homepage becomes idle, **Then** at most three likely next
   experiences are prepared in manifest order.
2. **Given** Save-Data or a measured slow connection, **When** the homepage becomes idle, **Then** no
   speculative preparation starts.
3. **Given** any profile, **When** the homepage first paints, **Then** no preparation has started before it.

---

### User Story 2 - Each experience registers what it needs and readiness is truthful (Priority: P1)

Each experience declares its resources, dependencies, priority, version and prepare behaviour once. The hub
reports `fetched`, `initialized`, `ready`, `failed` and `skipped` per resource and only reports the
experience ready when its required resources are ready. A failed resource can be retried without repeating
the resources that already succeeded.

**Why this priority**: Without a truthful readiness contract, a renderer cannot decide whether to start and
a failure becomes invisible.

**Independent Test**: Register an experience with an image resource; observe `fetched` after load and
`initialized` after decode; force a failure, retry, and assert only the failed resource repeats.

**Acceptance Scenarios**:

1. **Given** a registered experience, **When** its image has loaded but not decoded, **Then** its state is
   `fetched` and the experience is not yet ready.
2. **Given** a resource that fails twice, **When** preparation settles, **Then** the experience is `failed`
   with the error recorded, and an explicit retry can recover it.
3. **Given** an experience whose dependency failed, **When** it is prepared, **Then** it fails without
   running its own resources.

---

### User Story 3 - Shared assets are fetched once and reused across navigation (Priority: P1)

The personal paid Reveal and the paid Gift Reveal show the same animation and assets, and two experiences can
reference the same route bundle. The visitor receives one request, and returning to a page reuses the
prepared state instead of downloading again. Gift delivery and sharing remain separate paths and are not
registered as another animation set.

**Why this priority**: Duplicate preloads are the main regression risk of a preloader and the direct cost to
the visitor.

**Independent Test**: Register three experiences sharing one URL and assert one adapter call; prepare the
same experience twice and assert one call; resolve `/reveal/:id` to the same single reveal registration.

**Acceptance Scenarios**:

1. **Given** three experiences sharing one asset URL, **When** all are prepared, **Then** exactly one request
   is made.
2. **Given** a prepared experience, **When** the visitor returns to it, **Then** the hub reuses its state.
3. **Given** `/reveal` and `/reveal/:id`, **When** readiness is requested, **Then** both resolve to one
   `reveal` registration.

---

### User Story 4 - An active reveal or cinematic is never slowed by preparation (Priority: P1)

While the Lucky Card Reveal or the Daily Resonance cinematic runs, queued background preparation does not
start. When the experience finishes, the queue resumes. Critical and intent preparation still run so a
committed navigation is not stalled.

**Why this priority**: The experiences are animation- and audio-timed; competing network and decode work is
visible as jank or an audio slip.

**Independent Test**: Begin an active experience, request background preparation, assert no adapter call;
release it and assert the queued work starts.

**Acceptance Scenarios**:

1. **Given** an active reveal, **When** background preparation is requested, **Then** it waits.
2. **Given** that reveal ends, **When** the queue resumes, **Then** the background preparation completes.
3. **Given** an active reveal, **When** critical or intent preparation is requested, **Then** it still runs.

---

### User Story 5 - Constraints defer without removing features (Priority: P2)

On a constrained device or Save-Data connection, the hub runs no more than the plan allows, defers
speculative audio to the activation that needs it, and prepares no heavy background asset. Every experience
still works: playback, animation, artwork and fallbacks are unchanged.

**Why this priority**: Feature 180 already decided these budgets; the hub must respect, not re-derive them.

**Independent Test**: Prepare Crystal Ball in the background on a capable profile and assert its audio
adapter did not run; prepare on intent and assert it does, without any playback call.

**Acceptance Scenarios**:

1. **Given** background preparation, **When** a resource is marked heavy, **Then** it is deferred to route or
   intent preparation.
2. **Given** a constrained plan, **When** Crystal Ball audio is prepared, **Then** the existing loader defers
   it and nothing plays.
3. **Given** memory pressure, **When** the existing release registry runs, **Then** the hub drops its
   prepared entries and re-preparation still works.

---

### Edge Cases

- An experience is registered twice with the same version: one definition, no duplicate work.
- An experience's version changes: old prepared entries are dropped and new assets are fetched.
- A dependency is missing or forms a cycle: the experience fails safely and the page keeps working.
- A consumer asks for readiness on the server: idle state, no listeners, timers or requests.
- The document is hidden or the connection worsens while background work is queued: it waits and resumes
  through the existing shared plan subscription.
- The browser has no `Image` constructor or no route prefetcher: that resource is reported skipped instead of
  failing the page.
- Audio preparation resolves but the browser has not had a user activation: nothing plays.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The hub MUST provide one registration contract per experience covering resources, dependencies,
  priority, version and prepare/release behaviour.
- **FR-002**: Registration MUST be idempotent for the same id and version and MUST invalidate prepared state
  when the version changes.
- **FR-003**: The hub MUST coordinate preparation only and MUST NOT play audio, animate, render or own
  business logic.
- **FR-004**: The hub MUST deduplicate in-flight and completed requests by resource identity and MUST reuse
  prepared state across navigation and revisits.
- **FR-005**: The hub MUST report per-resource `fetched`, `initialized`, `ready`, `failed` and `skipped`
  states and an experience-level `idle`, `preparing`, `ready` or `failed` state.
- **FR-006**: Preparation MUST be bounded by the existing adaptive plan's parallel-request limit and MUST NOT
  add a second capability detector, subscription or governor.
- **FR-007**: Background preparation MUST pause during an active experience, a hidden page and a Save-Data or
  slow connection, and MUST resume when the condition clears.
- **FR-008**: Homepage preparation MUST start only after load and idle, MUST cap the number of experiences by
  the adaptive plan and MUST follow a declared likelihood order.
- **FR-009**: Intent preparation MUST use the existing prefetch policy for hover, focus and press and MUST
  only act on same-origin registered routes.
- **FR-010**: A failed resource MUST be retried once automatically and MUST be recoverable through an explicit
  retry that does not repeat ready resources.
- **FR-011**: The hub MUST provide image, code/route and existing Howler/Web Audio adapters, and MUST allow a
  future renderer kind to register its own adapter.
- **FR-012**: Preparing audio MUST NOT unlock or start playback; the existing autoplay/unlock rules remain.
- **FR-013**: The hub MUST NOT warm API or data endpoints and MUST NOT add a service worker, storage layer,
  dependency, paid service or infrastructure.
- **FR-014**: The hub MUST rely on existing browser/HTTP caching and MUST NOT promise permanent retention.
- **FR-015**: The hub MUST be server-safe: importing it starts no listeners, timers or requests.
- **FR-016**: Registered image URLs MUST match the URLs used in markup so the warmed HTTP cache entry is the
  one the page uses.
- **FR-017**: Release MUST drop prepared entries without interrupting a running preparation or a playing
  sound, and MUST integrate with the existing release registry.
- **FR-018**: Artwork, layout, wording, animation timing, sounds, prices, functionality and fallbacks MUST be
  preserved.

### Key Entities

- **Experience registration**: id, version, label, routes, dependencies, ordered resources.
- **Resource descriptor**: id, kind (`image`, `code`, `audio`, future renderer kind), URL or route, background
  eligibility, optional byte estimate and optional prepare function.
- **Readiness snapshot**: experience id/version, state, reason, per-resource states, attempts, errors and a
  partial flag when background work deliberately deferred heavy assets.
- **Active-experience hold**: a reference-counted foreground marker that pauses background preparation.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: One URL shared by three registered experiences produces exactly one preparation call.
- **SC-002**: A repeated preparation of a ready experience produces zero additional adapter calls.
- **SC-003**: At most three resources prepare concurrently on a capable profile and at most the plan's limit
  on any profile.
- **SC-004**: Zero background preparation calls occur while an active experience holds the foreground or while
  Save-Data is enabled.
- **SC-005**: Every requested experience is registered and resolvable from its route, including both paid
  reveal URLs resolving to one registration.
- **SC-006**: Server-side import and preparation perform no browser work and add no listeners or timers.
- **SC-007**: The existing unit suite, type check and visual/browser checks show no homepage, reveal, Crystal
  Ball, map or Daily Resonance regression; the production build stays below 495 MiB.

## Assumptions

- Feature 180's plan is the only adaptive policy source; this hub adds no measurements of its own.
- Preparation is speculative by nature: browsers may evict cached bytes, and the hub never claims otherwise.
- The heavy map sky backdrop and Crystal Ball audio are only prepared on the route or on intent, not by the
  homepage idle budget.
- The repository currently prices the personal Reveal at CAD $1.00 and the Gift Reveal at CAD $1.99; the
  owner's brief described $1.99 and $2.99. Prices and wording are preserved and out of scope.
- Future Canvas/WebGL/WebGPU renderers will register their own adapter kind rather than migrate now.
