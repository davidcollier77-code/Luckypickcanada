# Feature Specification: Align Link Prefetch with the Adaptive Network Policy

**Feature Branch**: `perf/link-prefetch-policy`

**Created**: 2026-11-18

**Status**: Implemented

**Input**: Owner request, performance improvement 4 of 5: prevent speculative RSC prefetching from bypassing the
existing adaptive network decisions. The audit observed RSC requests during intent activity, including on
constrained connections.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Constrained visitors pay for no speculative route (Priority: P1)

A visitor on Save-Data or a measured slow connection loads a page and hovers, focuses or long-presses a
navigation link. Nothing is prefetched: no RSC request, no route bundle. Clicking the link still navigates
normally.

**Why this priority**: Next.js prefetches links by default, which bypassed the adaptive plan's `none` policy.

**Independent Test**: With Save-Data set, load the homepage, hover a navigation link, and record App Router RSC
requests. Then click it and confirm the destination renders.

**Acceptance Scenarios**:

1. **Given** Save-Data, **When** the homepage loads, **Then** no RSC prefetch request is made for navigation
   links.
2. **Given** Save-Data, **When** the visitor hovers a navigation link, **Then** still no RSC prefetch request
   is made.
3. **Given** Save-Data, **When** the visitor clicks that link, **Then** navigation and the destination content
   work exactly as before.
4. **Given** a fast connection, **When** the visitor hovers a navigation link, **Then** its route is still
   prefetched, so navigation stays instant.

---

### User Story 2 - Moderate connections wait for a committed intent (Priority: P2)

On a moderate connection (`strong-intent` policy) a hover is not enough: prefetching waits for a press, tap or
keyboard focus, and the hub's speculative route preparation follows the same rule.

**Why this priority**: It preserves the speed benefit while keeping the policy consistent between the Link and
the readiness hub.

**Independent Test**: Under a moderate connection, hover then press a nav link; count RSC requests and hub
route preparations.

**Acceptance Scenarios**:

1. **Given** a moderate connection, **When** the visitor hovers, **Then** no route code is prepared by the hub.
2. **Given** a moderate connection, **When** the visitor presses or focuses, **Then** preparation is allowed.
3. **Given** Save-Data, **When** any route code is requested from the hub, **Then** it is reported `skipped`
   with `prefetch-disabled`.

---

### Edge Cases

- A link with no hover (keyboard Tab) triggers focus, which counts as strong intent.
- Touch devices fire `touchstart` before navigation, so a tap still marks strong intent.
- The route already on screen is never prefetched.
- An external or hash-only link is not a navigation prefetch candidate.
- The policy recovers when the connection improves: `prefetch` returns to `intent` and hover prefetching
  resumes.
- Links must keep their `href`, styling, `aria` attributes, `data-testid`s and click handlers.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Every same-origin navigation link in the app shell, homepage, legal pages and route components
  MUST prefetch only through the adaptive policy.
- **FR-002**: The Link wrapper MUST render the same anchor, with the same href, class names, ARIA attributes
  and handlers, and MUST always navigate.
- **FR-003**: The hub's `code` adapter MUST refuse speculative route preparation when the plan's prefetch policy
  is `none` (reason `prefetch-disabled`).
- **FR-004**: The hub MUST wait for intent priority when the policy is `strong-intent` (reason
  `prefetch-strong-intent`).
- **FR-005**: Capable connections MUST keep hover prefetching and idle hub warming.
- **FR-006**: No route, page, layout, copy, artwork, dependency or Next.js configuration change may be
  introduced.

### Key Entities

- **Adaptive prefetch policy**: `intent`, `strong-intent` or `none`, derived from Save-Data and measured
  network class.
- **IntentPrefetchLink**: the existing wrapper that maps hover/focus/press to policy-checked prefetch.
- **Route code resource**: a hub resource of kind `code` that calls the Next.js router prefetch.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Under Save-Data, homepage load and nav-link hover make 0 RSC prefetch requests (audit observed
  RSC requests during intent on constrained connections).
- **SC-002**: Under Save-Data, clicking a nav link still reaches the destination with its expected heading and
  no console error.
- **SC-003**: On a capable connection, hovering a nav link still prefetches it (2 RSC requests observed for the
  static `/about` route).
- **SC-004**: Focused and full unit suites, the type check, `./freebuff-verify.sh` and the production build
  pass, and the build stays below 495 MiB.

## Assumptions

- Next.js `prefetch={false}` disables both viewport and hover speculative prefetching for that link, while
  click navigation still fetches the route.
- `navigator.connection.saveData` is the cleanest reproducible constrained profile in Chromium, which does not
  expose downlink in headless mode.
- The hub's own idle warming on capable connections is intended behaviour and stays enabled.
